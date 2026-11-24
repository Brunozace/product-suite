"""Dearwork local helper. Start with python app.py."""

import argparse
import json
import mimetypes
import os
import re
import secrets
import socket
import subprocess
import threading
import time
import uuid
import webbrowser
from urllib.request import urlopen
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from book_pdf import render_pdf
from providers import (
    HOSTS,
    DEFAULT_MODEL,
    OPENAI_MODELS,
    PROVIDER,
    ProviderError,
    amount,
    quote_job,
    require,
    run_job,
    test,
)

from research import quote_batch, run_batch
from live_book import quote_book, run_book

ROOT = Path(__file__).resolve().parent
PUBLIC = (ROOT / "public").resolve()
TRACKS = {
    "Ebook",
    "Course",
    "Coaching",
    "Airbnb Photos",
    "Ad Remakes",
    "YouTube Shorts",
}
DEFAULTS = {
    "cap": 10.0,
    "robotCap": 1.0,
    "model": DEFAULT_MODEL,
    "fable": "",
    "company": "",
    "name": "",
    "business": "",
    "address": "",
}


class Workspace:
    def __init__(self, folder):
        self.folder = folder
        self.file = folder / "workspace.json"
        self.db = json.loads(self.file.read_text("utf8")) if self.file.exists() else {}
        self.db.setdefault("keys", {})
        self.db.setdefault("tracks", {})
        self.db["config"] = {**DEFAULTS, **self.db.get("config", {})}
        self.db["config"].pop("creditPrice", None)
        # Retired provider keys stay private and are never reused as OpenAI keys.
        if str(self.db["config"]["model"]).startswith("claude-"):
            self.db["config"]["model"] = DEFAULT_MODEL
        for track in self.db["tracks"].values():
            overrides = track.get("models", {})
            for step, model in list(overrides.items()):
                if str(model).startswith("claude-"):
                    del overrides[step]
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.Lock()
        self.tickets = {}
        self.reserved = 0.0
        self.events = []
        self.runs = 0
        self.secured = False
        self.polling = {}

    def persist(self):
        if not self.secured:
            self.folder.mkdir(mode=0o700, parents=True, exist_ok=True)
            if os.name == "nt":
                # Resolve the current SID without relying on translated account names.
                import csv

                account = subprocess.check_output(
                    ["whoami", "/user", "/fo", "csv", "/nh"], text=True
                )
                sid = next(csv.reader([account.strip()]))[1]
                subprocess.run(
                    [
                        "icacls",
                        str(self.folder),
                        "/inheritance:r",
                        "/grant:r",
                        f"*{sid}:(OI)(CI)F",
                    ],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=True,
                )
            else:
                os.chmod(self.folder, 0o700)
            self.secured = True
        tmp = self.folder / ("write-" + uuid.uuid4().hex)
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, "w", encoding="utf8") as file:
                json.dump(self.db, file, ensure_ascii=False)
                file.flush()
                os.fsync(file.fileno())
            os.replace(tmp, self.file)
        finally:
            tmp.unlink(missing_ok=True)

    def status(self):
        keys = {
            n: {
                "mask": "••••••••" + v["key"][-4:] if len(v["key"]) > 8 else "••••••••",
                "status": v["status"],
            }
            for n, v in self.db["keys"].items()
            if n in HOSTS
        }
        return {
            "keys": keys,
            "config": self.db["config"],
            "tracks": self.db["tracks"],
            "polling": list(self.polling),
            "reserved": self.reserved,
            "events": self.events[:30],
            "runs": self.runs,
        }

    def dispatch(self, route, p):
        keys, cfg = self.db["keys"], self.db["config"]
        if route == "status":
            return self.status()
        if route in ("key", "test"):
            n = p["name"]
            require(
                n in HOSTS, "Unknown provider."
            )
            self.tickets.clear()
            if route == "key":
                if p.get("remove"):
                    keys.pop(n, None)
                else:
                    k = str(p["key"]).strip()
                    sc = str(p.get("secret", "")).strip()
                    require(
                        0 < len(k) < 8192 and "\n" not in k and "\r" not in k,
                        "Paste a valid key.",
                    )
                    if n == "Higgsfield" and sc:
                        require(
                            sc and "\n" not in sc and "\r" not in sc,
                            "Add the secret as well.",
                        )
                    keys[n] = {"key": k, "secret": sc, "status": "Saved, not tested"}
            else:
                require(n in keys, "Add your " + n + " key first. It opens below.")
                try:
                    test(keys, n)
                except ProviderError as err:
                    if err.status in (401, 403):
                        keys[n]["status"] = "Key did not work"
                        self.persist()
                    raise
                keys[n]["status"] = "Connected"
            self.persist()
            return {"ok": True}
        if route == "config":
            new = {k: p[k] for k in DEFAULTS if k in p}
            for k in ["cap", "robotCap"]:
                if k in new:
                    new[k] = amount(new[k], 0.01, 10000)
            if "model" in new:
                require(
                    new["model"] in (*OPENAI_MODELS, "fable"),
                    "Choose a supported writing model.",
                )
            cfg.update(new)
            self.tickets.clear()
            self.persist()
            return {"ok": True}
        if route == "run":
            require(p.get("confirmed") is True, "Confirm the reviewed action first.")
            item = self.tickets.pop(str(p.get("ticket")), None)
            require(
                item and item[0] >= time.monotonic(),
                "Confirmation expired or was already used. Review the action again.",
            )
            p = item[1]
        require(
            p.get("track") in TRACKS
            and re.fullmatch(
                r"(build|outreach|launch|work|clients|paid)-[0-6]",
                str(p.get("step", "")),
            ),
            "Choose a valid track and step.",
        )
        track = self.db["tracks"].setdefault(p["track"], {"results": {}, "notes": {}})
        if route in ("pollstart", "pollstop", "poll"):
            key = p["track"]
            require(track.get("campaignId"), "Create a campaign first.")
            if route == "pollstop":
                self.polling.pop(key, None)
                return {"ok": True}
            if route == "pollstart":
                require(
                    p.get("confirmed") is True, "Confirm read-only reply checks first."
                )
                self.polling[key] = 0
                return {"ok": True}
            require(key in self.polling, "Reply checks are off.")
            require(
                time.monotonic() - self.polling[key] >= 55, "Wait for the next minute."
            )
            self.polling[key] = time.monotonic()
            value = run_job({"op": "replies"}, track, cfg, keys, self.persist)
            self.persist()
            return value
        if route == "editunit":
            book = track.get("book", {})
            key = str(p["unit"])
            require(key in book.get("units", {}), "Choose a built unit.")
            book["units"][key] = str(p["text"])[:60000]
            self.persist()
            return {"ok": True}
        if route == "stepmodel":
            model = p.get("model", "")
            require(
                model in (*OPENAI_MODELS, "fable", ""),
                "Choose a supported writing model.",
            )
            overrides = track.setdefault("models", {})
            if model:
                overrides[p["step"]] = model
            else:
                overrides.pop(p["step"], None)
            self.tickets.clear()
            self.persist()
            return {"ok": True}
        if route == "note":
            track["notes"][p["step"]] = str(p["notes"])
            track["results"][p["step"]] = str(p["notes"])
            track["title"] = str(p.get("title", ""))
            self.persist()
            return {"ok": True}
        if route == "quote":
            require(
                p.get("op") in {*PROVIDER, "batch", "book"},
                "Choose a supported action.",
            )
            if p.get("op") == "campaign":
                require(p.get("title"), "Enter a campaign product or service name.")
                require(
                    not any(
                        t.get("sender", "").lower() == p.get("sender", "").lower()
                        and t.get("campaignId")
                        for k, t in self.db["tracks"].items()
                        if k != p["track"]
                    ),
                    "Use a dedicated sending inbox for this track.",
                )
            cost, description = (
                {"batch": quote_batch, "book": quote_book}.get(p["op"], quote_job)
            )(p, track, cfg, keys)
            require(
                self.reserved + cost <= cfg["cap"],
                "This action would pass your session cap.",
            )
            self.tickets = {
                k: v
                for k, v in self.tickets.items()
                if v[0] >= time.monotonic() and v[1]["track"] != p["track"]
            }
            ticket = secrets.token_urlsafe(24)
            p["cost"] = cost
            p["id"] = str(uuid.uuid4())
            self.tickets[ticket] = (time.monotonic() + 180, p)
            return {
                "ticket": ticket,
                "description": description,
                "price": f"USD {cost:.4f} reserved"
                if cost
                else "$0 additional API fee · your plan applies",
            }
        require(route == "run", "Unknown local action.")
        cost = p["cost"]
        require(
            self.reserved + cost <= cfg["cap"],
            "This action would pass your session cap.",
        )
        if p["op"] == "robot":
            require(cost <= cfg["robotCap"], "The run exceeds your robot cap.")
        # Keep the full reservation on ambiguous failures and consume each ticket once.
        self.reserved = round(self.reserved + cost, 4)
        self.runs += 1
        self.tickets = {
            k: v for k, v in self.tickets.items() if v[1]["track"] != p["track"]
        }
        result = (
            {"batch": run_batch, "book": run_book}.get(p["op"], run_job)
        )(p, track, cfg, keys, self.persist)
        output = (
            result
            if isinstance(result, str)
            else json.dumps(result, indent=2, ensure_ascii=False)
        )
        track["results"][p["step"]] = output[:300000]
        track["notes"][p["step"]] = p.get("notes", "")
        if p.get("title"):
            track["title"] = p["title"]
        self.events.insert(
            0,
            [
                "check",
                p["op"].capitalize() + " complete",
                p["track"],
                time.strftime("%H:%M"),
            ],
        )
        self.persist()
        return {"ok": True}


class LocalServer(ThreadingHTTPServer):
    def server_bind(self):
        if os.name == "nt":
            self.allow_reuse_address = False
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Handler(BaseHTTPRequestHandler):
    server_version = "Dearwork"

    def log_message(self, *args):
        pass

    def response(self, code, body, content_type="application/json"):
        if not isinstance(body, bytes):
            body = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        )
        self.end_headers()
        self.wfile.write(body)

    def allowed(self, post=False):
        host = self.headers.get("Host", "")
        port = self.server.server_port
        if host not in {f"127.0.0.1:{port}", f"localhost:{port}"}:
            return False
        origin = self.headers.get("Origin")
        site = self.headers.get("Sec-Fetch-Site")
        return site not in ("cross-site", "same-site") and (
            origin == "http://" + host if post else origin in (None, "http://" + host)
        )

    def do_GET(self):
        if not self.allowed():
            return self.response(403, {"error": "Open the local workspace."})
        p = unquote(urlsplit(self.path).path)
        if p == "/health":
            return self.response(200, {"ok": True, "application": "Dearwork"})
        if p == "/api/session":
            return self.response(200, {"token": self.server.workspace.token})
        path = (PUBLIC / (p.lstrip("/") or "index.html")).resolve()
        if PUBLIC not in path.parents or not path.is_file():
            return self.response(404, {"error": "File not found."})
        self.response(
            200,
            path.read_bytes(),
            mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        )

    def do_POST(self):
        if (
            not self.allowed(True)
            or self.headers.get("Content-Type", "").split(";")[0] != "application/json"
        ):
            return self.response(403, {"error": "Open the local workspace."})
        try:
            n = int(self.headers.get("Content-Length", 0))
            require(0 < n <= 1000000, "Request size is outside the limit.")
            p = json.loads(self.rfile.read(n))
            require(isinstance(p, dict), "Expected a JSON object.")
            if (
                self.path == "/api/pdf"
                and self.headers.get("X-Product-Export") == "book"
            ):
                return self.response(200, render_pdf(p), "application/pdf")
            ws = self.server.workspace
            if not secrets.compare_digest(
                self.headers.get("X-Product-Session", ""), ws.token
            ):
                return self.response(403, {"error": "Refresh this local page."})
            with ws.lock:
                result = ws.dispatch(self.path.removeprefix("/api/"), p)
            self.response(200, result)
        except (ValueError, TypeError, KeyError, IndexError) as err:
            self.response(
                400,
                {
                    "error": str(err)
                    if isinstance(err, ValueError)
                    else "Incomplete input or unexpected provider response. The last successful result is preserved."
                },
            )
        except Exception:
            self.response(
                500,
                {
                    "error": "The helper could not complete the action. Check local file permissions and your provider dashboard."
                },
            )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(os.environ.get("LOCALAPPDATA") or Path.home() / ".local/share")
        / "ProductSuite",
    )
    args = parser.parse_args()
    try:
        server = LocalServer(("127.0.0.1", args.port), Handler)
    except OSError:
        url = f"http://127.0.0.1:{args.port}"
        try:
            with urlopen(url + "/health", timeout=2) as response:
                existing = json.load(response).get("application") == "Dearwork"
        except Exception:
            existing = False
        if not existing:
            parser.exit(
                1, f"Port {args.port} is busy. Start with --port {args.port + 1}.\n"
            )
        print("Dearwork is already running at " + url)
        if not args.no_browser:
            webbrowser.open(url)
        return
    server.workspace = Workspace(args.data_dir)
    url = f"http://127.0.0.1:{server.server_port}"
    print("Dearwork is running at " + url, flush=True)
    if not args.no_browser:
        threading.Timer(0.35, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
