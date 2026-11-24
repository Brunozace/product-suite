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
from workflow import changed, completed, prepare
from discovery import quote_discovery, run_discovery
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
            "tracks": {name: {**t, "completedSteps": completed(t)} for name, t in self.db["tracks"].items()},
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
        if route == "applyvoice":
            require(p["step"] == "build-5" and all(completed(track)[:6]), "Review the current creator analysis first.")
            book = track["book"]
            text = book["units"].get("0", "")
            original = track.get("voiceOriginal", "")
            parts = re.split(r"^##\s+Adapted excerpt\s*$", track.get("voiceReport", ""), maxsplit=1, flags=re.I | re.M)
            require(original and text.startswith(original) and len(parts) == 2 and parts[1].strip()
                    and not track.get("voiceApplied"), "Review a fresh adaptation for the current opening.")
            book.setdefault("originalUnits", {}).setdefault("0", text)
            book["units"]["0"] = parts[1].strip() + text[len(original):]
            track["voiceApplied"] = True
            changed(track, 5)
            self.tickets.clear()
            self.persist()
            return {"ok": True}
        if route == "editunit":
            book = track.get("book", {})
            key = str(p["unit"])
            require(key in book.get("units", {}), "Choose a built unit.")
            if p.get("undo"):
                require(key in book.get("originalUnits", {}), "No saved edit to undo.")
                book["units"][key] = book["originalUnits"].pop(key)
            else:
                book.setdefault("originalUnits", {}).setdefault(key, book["units"][key])
                book["units"][key] = str(p["text"])[:60000]
            track["staleSteps"] = sorted(set(track.get("staleSteps", [])) | {5, 6})
            self.tickets.clear()
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
        if route == "savedraft":
            require(not track.get("campaignId"), "Edit a created campaign in Instantly.")
            track["mailDraft"] = {k: str(p.get(k, ""))[:20000] for k in ("sender", "subject", "body", "followSubject", "followBody")}
            self.persist()
            return {"ok": True}
        if route == "offerprice":
            require(p["step"] == "build-6", "Open Ready to sell to set the price.")
            track["price"] = amount(p["price"])
            self.persist()
            return {"ok": True}
        if route == "pickcreator":
            profiles = track.get("research", {}).get("outreach-0", {}).get("Creators", {}).get("rows", [])
            require(p["step"] == "outreach-0" and p.get("creator") and
                    any(r.get("username") == p["creator"] for r in profiles), "Choose a researched profile.")
            if track.get("voiceHandle") and track["voiceHandle"].lower() != p["creator"].lower():
                track["staleSteps"] = sorted(set(track.get("staleSteps", [])) | {5, 6})
                self.tickets.clear()
            track["creator"] = p["creator"]
            track["creatorProfile"] = next(r for r in profiles if r.get("username") == p["creator"])
            self.persist()
            return {"ok": True}
        if route == "pickbuyer":
            buyer = p.get("buyer")
            require(p["step"] == "build-2" and isinstance(buyer, str) and buyer
                    and buyer in track["results"].get("build-2", "").replace("**", "").replace("__", ""),
                    "Choose a group from the saved buyer analysis.")
            if p.get("guided"):
                require(completed(track)[1] and not track.get("needsBuyerScores"), "Score the current market research first.")
            if buyer != track.get("buyer") or 2 in track.get("staleSteps", []):
                changed(track, 2)
            track["buyer"] = buyer
            self.tickets.clear()
            self.persist()
            return {"ok": True}
        if route == "note":
            if p["step"] == "build-0" and "ideaIndex" in p:
                ideas = track.get("ideas", [])
                index = p["ideaIndex"]
                require(type(index) is int and 0 <= index < len(ideas)
                        and ideas[index]["title"] == p.get("title"),
                        "Refresh the idea list and choose again.")
                idea = ideas[index]
                if track["notes"].get("build-0") != idea["title"]:
                    changed(track, 0)
                    track["needsBuyerScores"] = True
                    self.tickets.clear()
                track["title"] = track["notes"]["build-0"] = idea["title"]
                track["results"]["build-0"] = "\n".join(
                    [idea["title"], idea["reason"], *(src["url"] for src in idea["sources"])]
                )
                self.persist()
                return {"ok": True}
            if p["step"] == "build-0" and (str(p["notes"]) != track["notes"].get("build-0") or p.get("title") != track.get("title")):
                changed(track, 0)
                track["needsBuyerScores"] = True
                self.tickets.clear()
            track["notes"][p["step"]] = str(p["notes"])
            track["results"][p["step"]] = str(p["notes"])
            track["title"] = str(p.get("title", ""))
            self.persist()
            return {"ok": True}
        if route == "quote":
            require(
                p.get("op") in {*PROVIDER, "batch", "book", "discover"},
                "Choose a supported action.",
            )
            if p.get("guided") and p["step"].startswith("build-"):
                prepare(p, track)
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
            if p.get("guided") and p["step"].startswith("launch-") and p["op"] in ("hidden","publish","write","batch"):
                require(all(completed(track)), "Finish Ready to sell for the current product before preparing its launch.")
                if p["op"] == "write":
                    p["instruction"] += "\nBuyer: " + track.get("buyer","") + "\nSaved offer: " + track["results"]["build-6"][:4000]
            if p["op"] == "write" and p["step"] == "build-3" and track.get("buyer"):
                p["instruction"] += "\nDesign this plan specifically for the selected buyer: " + track["buyer"]
            if p["op"] == "write" and p["step"] == "build-5":
                research = track.get("research", {}).get("build-5", {})
                handle = p["notes"].strip().lstrip("@").lower()
                posts = research.get("Recent reels", {}).get("rows", [])
                require(posts and handle == track.get("voiceHandle", track.get("notes", {}).get("build-5", "")).lstrip("@").lower(),
                        "Read public posts for this handle before analyzing the voice.")
                opening = track.get("book", {}).get("units", {}).get("0", "")
                excerpt = opening[:1600]
                if len(opening) > len(excerpt):
                    boundary = max(excerpt.rfind("\n\n"), excerpt.rfind(". ") + 1)
                    if boundary > 0:
                        excerpt = excerpt[:boundary]
                p["original"] = excerpt
                excerpts = [{"caption": str(r.get("caption", ""))[:450], "url": r.get("url")} for r in posts[:15]]
                p["instruction"] = ("Analyze only the following creator posts. Give sections for voice traits, "
                    "recurring phrases, audience needs and topic counts. Link observations to supplied posts. "
                    "Use a final heading '## Adapted excerpt' for a sample revision of the supplied original, "
                    "preserving factual claims and citations. If no original exists, omit the sample. "
                    "Never invent personal experiences or endorsements. Posts: " + json.dumps(excerpts) +
                    " Original: " + p["original"])
            if p["op"] == "write" and p["step"] == "build-6":
                book = track.get("book", {})
                offer = {
                    "buyer": track.get("buyer"),
                    "price_usd": track.get("price"),
                    "completed_units": [book["titles"][int(i)] for i in book.get("units", {})],
                    "sample": book.get("units", {}).get("0", "")[:1200],
                    "plan": track.get("results", {}).get("build-3", "")[:2500],
                }
                p["instruction"] += (" Use the product details below. Distinguish planned material from finished "
                                     "deliverables and use the saved price when present. " + json.dumps(offer))
            if p["op"] == "write" and p["step"] in ("outreach-3", "clients-1"):
                p["instruction"] += (" Return only JSON with four nonempty string fields subject, body, followSubject, followBody. "
                                     "Use a neutral greeting. No fictitious recipient details, signature or address. "
                                     "This is a draft for review. The sender footer is appended separately.")
            cost, description = (
                {"batch": quote_batch, "book": quote_book, "discover": quote_discovery}.get(p["op"], quote_job)
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
            {"batch": run_batch, "book": run_book, "discover": run_discovery}.get(p["op"], run_job)
        )(p, track, cfg, keys, self.persist)
        output = (
            result
            if isinstance(result, str)
            else json.dumps(result, indent=2, ensure_ascii=False)
        )
        if p["op"] == "coverStatus":
            track["coverState"] = result.get("status", "unknown")
            if track["coverState"] == "completed":
                from cover_art import save_cover
                images = result.get("images") or []
                require(images, "Higgsfield completed without returning a cover image.")
                save_cover(images[0]["url"], self.folder / (p["track"] + "-cover.jpg"))
                track["coverVersion"] = track["coverId"]
        if p["op"] == "write" and p["step"] in ("outreach-3", "clients-1"):
            try:
                draft = json.loads(output.strip().removeprefix("```json").removesuffix("```").strip())
            except ValueError:
                draft = None
            require(isinstance(draft, dict) and all(isinstance(draft.get(k), str) and draft[k].strip()
                    for k in ("subject", "body", "followSubject", "followBody")), "Incomplete email draft. Your saved emails are unchanged.")
            track["mailDraft"] = {**{k: draft[k] for k in ("subject","body","followSubject","followBody")}, "sender": p.get("sender", "")}
        if p["op"] not in ("discover", "cover", "coverStatus"):
            if p["op"] == "write" and p["step"] == "build-5":
                track.update(voiceReport=output, voiceOriginal=p["original"], voiceApplied=False)
            if p["op"] == "write" and p["step"] == "build-3":
                track["planBuyer"] = track.get("buyer", "")
            track["results"][p["step"]] = output[:300000]
            track["notes"][p["step"]] = p.get("notes", "")
            if p.get("title"):
                track["title"] = p["title"]
        if p["step"].startswith("build-"):
            index = int(p["step"].split("-")[1])
            if index == 1 and p["op"] == "batch":
                changed(track, 1)
                track["needsBuyerScores"] = True
            if index == 2 and p["op"] == "write":
                track["needsBuyerScores"] = False
                track["staleSteps"] = sorted(set(track.get("staleSteps", [])) | set(range(2, 7)))
            if (index in (3, 5, 6) and p["op"] == "write") or (index == 4 and p["op"] == "book"):
                changed(track, index)
            if index == 5 and p["op"] == "batch":
                track["staleSteps"] = sorted(set(track.get("staleSteps", [])) | {5, 6})
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
        if p.startswith("/covers/"):
            track = p.removeprefix("/covers/")
            if track in TRACKS:
                cover = self.server.workspace.folder / (track + "-cover.jpg")
                if cover.is_file():
                    return self.response(200, cover.read_bytes(), "image/jpeg")
            return self.response(404, {"error":"No saved cover."})
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
                track = p.get("coverTrack")
                cover = self.server.workspace.folder / (track + "-cover.jpg") if track in TRACKS else None
                return self.response(200, render_pdf(p, cover.read_bytes() if cover and cover.is_file() else None), "application/pdf")
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
