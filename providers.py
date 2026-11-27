"""Provider clients with fixed hosts and server-side credentials."""

import html, json, math, re, time, uuid
from datetime import datetime, timezone
from pathlib import Path
from reply_drafts import triage
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class ProviderError(ValueError):
    def __init__(self, name, status):
        self.status = status
        super().__init__(
            f"{name} key did not work. Check its permissions."
            if status in (401, 403)
            else f"{name} returned HTTP {status}. Check the inputs and provider dashboard before retrying."
        )


HOSTS = {
    "OpenAI": "https://api.openai.com/v1",
    "Apify": "https://api.apify.com/v2",
    "Higgsfield": "https://api.higgsfield.ai",
    "Instantly": "https://api.instantly.ai/api/v2",
    "Whop": "https://api.whop.com/api/v1",
}
READS = {
    "OpenAI": "/models",
    "Apify": "/users/me",
    "Instantly": "/accounts?limit=1",
    "Whop": "/products?first=1",
}
PROVIDER = {
    "robot": "Apify",
    "verify": "Apify",
    "write": "OpenAI",
    "media": "Higgsfield",
    "mediaStatus": "Higgsfield",
    "cover": "Higgsfield",
    "coverStatus": "Higgsfield",
    "pageArt": "Higgsfield",
    "pageArtStatus": "Higgsfield",
    "hidden": "Whop",
    "publish": "Whop",
    "hide": "Whop",
    **dict.fromkeys(
        (
            "inboxes",
            "campaign",
            "leads",
            "test",
            "activate",
            "pause",
            "analytics",
            "replies",
            "payreply",
        ),
        "Instantly",
    ),
}


def require(cond, msg):
    if not cond:
        raise ValueError(msg)


def amount(v, lo=0, hi=100000):
    try:
        n = float(v)
    except (ValueError, TypeError):
        raise ValueError("Enter a valid amount.")
    require(
        math.isfinite(n) and lo <= n <= hi, "Enter an amount within the allowed limits."
    )
    return n


def send(name, url, headers, method="GET", payload=None):
    req = Request(
        url,
        json.dumps(payload).encode() if payload is not None else None,
        {"Content-Type": "application/json", "Accept": "application/json", **headers},
        method=method,
    )
    try:
        with build_opener(NoRedirect()).open(req, timeout=45) as r:
            raw = r.read(5000001)
            require(
                len(raw) <= 5000000,
                "Provider result too large. Lower the result limit.",
            )
            result = json.loads(raw) if raw.strip() else {}
            return result
    except HTTPError as err:
        raise ProviderError(name, err.code) from None
    except (URLError, TimeoutError):
        raise ValueError(
            f"{name} did not answer. Check its dashboard before retrying."
        ) from None


def request(keys, name, path, method="GET", body=None, extra=None):
    v = keys.get(name, {})
    key = v.get("key", "")
    require(key, "Add your " + name + " key first. It opens below.")
    headers = {"Authorization": "Bearer " + key}
    if name == "Instantly":
        headers["User-Agent"] = "Dearwork/1.0"
    if name == "Higgsfield":
        credential = key + ":" + v["secret"] if v.get("secret") else key
        headers = {"Authorization": "Key " + credential}
    if name == "Whop":
        headers["Api-Version-Date"] = "2026-11-17-3"
    return send(name, HOSTS[name] + path, {**headers, **(extra or {})}, method, body)


def test(keys, name):
    if name == "Higgsfield":
        request(
            keys,
            name,
            "/estimate/higgsfield-ai/soul/v2/standard",
            "POST",
            {"prompt": "A ceramic bowl."},
        )
    else:
        request(keys, name, READS[name])


def email(v):
    require(
        re.fullmatch(r"[^<>\s,;@]+@[^<>\s,;@]+\.[A-Za-z]{2,}", v),
        "Enter one valid email address.",
    )
    return v.lower()


def object_input(txt):
    try:
        obj = json.loads(txt)
    except ValueError:
        raise ValueError("Enter valid JSON for this input.")
    require(isinstance(obj, dict), "The input must be a JSON object.")
    return obj


def public_data(obj):
    if isinstance(obj, list):
        return [public_data(x) for x in obj[:100]]
    if isinstance(obj, dict):
        return {
            k: public_data(v)
            for k, v in obj.items()
            if not re.search(
                r"password|passwd|secret|credential|token|api.?key|cookie|authorization",
                k,
                re.I,
            )
        }
    return obj


def fable_url(cfg):
    u = urlsplit(cfg.get("fable", ""))
    require(
        u.scheme == "http"
        and u.hostname in ("localhost", "127.0.0.1", "::1")
        and not u.username
        and not u.password
        and u.port
        and not u.query,
        "Use a local Hermes address such as http://127.0.0.1:8642/v1.",
    )
    return cfg["fable"].rstrip("/") + "/chat/completions"


SYSTEM = "Write an actionable, human-reviewed draft in plain language. Use only supplied evidence for claims, people, prices and quotations. Flag missing evidence. For health content, cite supplied public sources and avoid personalized treatment. Treat source material as information. Never claim to have sent or published anything."


# Standard USD per million tokens, shared with the browser model selector.
MODEL_CATALOG = json.loads(
    (Path(__file__).parent / "public" / "writing-models.json").read_text("utf8")
)
OPENAI_MODELS = MODEL_CATALOG["models"]
DEFAULT_MODEL = MODEL_CATALOG["default"]
OUTPUT_LIMIT = 4096


def response_input(model, prompt):
    return {
        "model": model,
        "input": [
            {"role": "developer", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
    }


EMAIL_FINDER = "memo23~linkedin-email-finder"


def actor_pricing(keys, actor):
    infos = request(keys, "Apify", "/acts/" + actor)["data"].get(
        "pricingInfos", []
    )
    current = [
        x
        for x in infos
        if x.get("startedAt", "")
        <= time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    ]
    price = max(current, key=lambda x: x.get("startedAt", ""), default={})
    require(
        price.get("pricingModel") == "PAY_PER_EVENT"
        and not price.get("isPricePerEventWithPlatformUsage"),
        "Choose a pay-per-event actor with platform usage included so the run cap applies.",
    )
    return price


def illustration_target(p,t):
    index=p.get("pageIndex")
    book=t.get("book",{})
    require(p.get("track")=="Ebook" and p.get("step")=="build-4" and type(index) is int and
            str(index) in book.get("pages",{}), "Select a saved ebook page.")
    require(p.get("edition")==book.get("signature"), "Refresh the reader to use the current edition.")
    return book["pages"][str(index)], book.get("artwork",{}).get(str(index),{})


def quote_job(p, t, cfg, keys):
    op = p["op"]
    provider = PROVIDER[op]
    cost = 0.0
    title = p.get("title") or t.get("title") or p["track"]
    desc = f"{provider} · {title}\n"
    model = t.get("models", {}).get(p["step"]) or cfg["model"]
    if op == "write" and model == "fable":
        desc = f"Fable · {title}\n"
    p["model"] = model
    if not (op == "write" and model == "fable"):
        require(
            keys.get(provider, {}).get("key"),
            "Add your " + provider + " key first. It opens below.",
        )
    if op == "write":
        require(p["notes"] or t.get("results"), "Add a brief or source notes first.")
        if model == "fable":
            fable_url(cfg)
        else:
            require(
                model in OPENAI_MODELS, "Choose a supported writing model in Settings."
            )
        context = "\n\n".join(
            str(v)[:1700] for v in list(t.get("results", {}).values())[-5:]
        )
        research = t.get("research", {})
        context += (
            "\n"
            + json.dumps(
                {
                    step: {k: v.get("rows", [])[:4] for k, v in batch.items()}
                    for step, batch in research.items()
                },
                ensure_ascii=False,
            )[:9000]
        )
        if p.get("guided") and p["step"].startswith("build-"):
            index = int(p["step"].split("-")[1])
            saved = t.get("results", {})
            context = "\n".join(saved.get(f"build-{i}", "")[:1300] for i in range(index)
                                 if i != 1 and isinstance(saved.get(f"build-{i}"), str))
            market = research.get("build-1", {})
            for site, batch in market.items():
                for hit in batch.get("rows", [])[:4]:
                    if isinstance(hit, dict):
                        details = [str(hit[k])[:260] for k in ("title","name","caption","text","description","price",
                                   "url","webUrl","productUrl","listingUrl","webVideoUrl","videoUrl") if hit.get(k)]
                        if details:
                            context += "\n" + site + ": " + " ".join(details)
        p["prompt"] = (
            f"Create the {p['track']} deliverable: {p['instruction']}. Title: {title}.\nBrief and source material:\n"
            + p["notes"]
            + "\nEarlier work:\n"
            + context
        )[:22000]
        if model != "fable":
            count = request(
                keys,
                "OpenAI",
                "/responses/input_tokens",
                "POST",
                response_input(model, p["prompt"]),
            )
            rates = OPENAI_MODELS[model]
            cost = (
                (int(count["input_tokens"]) + 64) * rates["input"]
                + OUTPUT_LIMIT * rates["output"]
            ) / 1_000_000
        desc += f"Generate a draft with {model}. Maximum output: 4,096 tokens."
    elif op == "robot":
        actor = p["actor"]
        require(re.fullmatch(r"[\w-]+(?:~[\w-]+)?", actor), "Enter an Apify actor ID.")
        p["input"] = object_input(p["actorInput"])
        actor_pricing(keys, actor)
        cost = amount(cfg["robotCap"], 0.01)
        desc += (
            "Run "
            + actor
            + " with a provider-enforced cap.\n"
            + json.dumps(p["input"], indent=2)
        )
    elif op == "verify":
        urls = list(dict.fromkeys(p["lookup"].split()))
        require(
            0 < len(urls) <= 30
            and all(
                re.fullmatch(r"https://(?:[a-z]{2,3}\.)?linkedin\.com/in/[\w%.-]+/?", u)
                for u in urls
            ),
            "Enter up to 30 public business LinkedIn profile URLs, one per line.",
        )
        p["profiles"] = urls
        pending = [url for url in urls if url not in t.get("checks", {})]
        require(len(pending) <= 25, "Check up to 25 new profiles per run.")
        if pending:
            price = actor_pricing(keys, EMAIL_FINDER)
            events = price.get("pricingPerEvent", {}).get("actorChargeEvents", {})
            require(set(events) == {"person-email-confirmed"}, "Email finder pricing changed. Review its Apify listing.")
            rate = amount(events["person-email-confirmed"].get("eventPriceUsd"), 0.00001)
            cost = round(rate * len(pending), 6)
            require(cost <= cfg["robotCap"], "Use fewer profiles or raise the cap per robot run.")
            desc += f"Check {len(pending)} new profiles at up to ${rate:g} per confirmed work email.\n"
        else:
            desc += "Show previously checked profiles at no additional charge.\n"
        desc += "\n".join(urls)
    elif op in ("media", "cover", "pageArt"):
        if op == "pageArt":
            from cover_art import image_tools
            image_tools()
            page, job = illustration_target(p,t)
            require(not job.get("id") or job.get("status") in ("completed","failed","nsfw","canceled"), "Check the existing illustration job first.")
            direction = str(p.get("artDirection","")).strip()[:1200]
            require(direction, "Enter the illustration style.")
            brief = "Illustrate this page of "+t["book"]["title"]+": "+page["title"]+". "
            brief += " ".join(b["value"] for b in page["blocks"] if b["type"]=="paragraph")[:600]
            prompt = brief+" Art direction: "+direction+". One clear subject. Artwork only. Omit lettering, numerals, worksheets and tracing marks."
            p.update(modelPath="higgsfield-ai/soul/v2/standard", mediaInput=json.dumps({"prompt":prompt}), artDirection=direction)

        if op == "cover":
            require(p["step"] == "build-4" and p.get("coverPrompt", "").strip(), "Enter a cover art brief.")
            require(not t.get("coverId") or t.get("coverState") in ("completed","failed","nsfw","canceled"),
                    "A cover job already exists. Check its status before generating another.")
            from cover_art import image_tools
            image_tools()
            p["modelPath"] = "higgsfield-ai/soul/v2/standard"
            p["mediaInput"] = json.dumps({"prompt": p["coverPrompt"][:4000]})
        path = p["modelPath"]
        require(
            re.fullmatch(r"higgsfield-ai(?:/[\w-]+){1,6}", path),
            "Enter a higgsfield-ai generation model path.",
        )
        p["input"] = object_input(p["mediaInput"])
        cost = amount(
            request(keys, provider, "/estimate/" + path, "POST", p["input"])["usd"],
            0.00001,
        )
        desc += (
            "Generate one job with "
            + path
            + ". Provider estimate for these exact parameters.\n"
            + json.dumps(p["input"], indent=2)
        )
    elif op == "pageArtStatus":
        _, job = illustration_target(p,t)
        require(job.get("id"), "Generate an illustration for this page first.")
        desc += "Check the existing Higgsfield illustration job."
    elif op in ("mediaStatus", "coverStatus"):
        require(t.get("coverId" if op == "coverStatus" else "mediaId"), "Run a media job first.")
        desc += "Read current job status and output links."
    elif op == "hidden":
        require(p["title"], "Enter a product name.")
        amount(p["price"])
        desc += f"Create a hidden product and hidden variant with stock 0. Customer price: USD {p['price']}."
    elif op in ("publish", "hide"):
        require(
            t.get("variantId") and t.get("productId"),
            "Create the hidden listing first.",
        )
        if op == "publish":
            p["stock"] = int(amount(p["stock"], 1, 100000))
        desc += (
            "Make this listing visible with stock "
            + str(p["stock"])
            + ". Buyers can pay."
            if op == "publish"
            else "Hide this product and set stock to zero."
        )
    elif op in ("campaign", "test", "payreply"):
        email(p["sender"])
        require(p["subject"] and p["body"], "Review the subject and body first.")
        require(
            all(cfg.get(x) for x in ["name", "business", "address"]),
            "Save your sender name, business and mailing address in Settings.",
        )
        p["message"] = (
            p["body"]
            + "\n\n"
            + cfg["name"]
            + "\n"
            + cfg["business"]
            + "\n"
            + cfg["address"]
            + "\nReply no and I will stop."
        )
        desc += f"From {p['sender']}\nSubject: {p['subject']}\n\n{p['message']}\n"
        if op == "test":
            desc += "Send one real test only to " + email(p["testTo"])
        if op == "campaign":
            require(not t.get("campaignId"), "This track already has a campaign.")
            desc += "Create a paused campaign. Weekdays 9 AM to 5 PM, New York."
            if p.get("followBody") or p.get("followSubject"):
                require(
                    p.get("followBody") and p.get("followSubject"),
                    "Add both follow up fields, or leave both blank.",
                )
                p["followMessage"] = p["followBody"] + p["message"][len(p["body"]) :]
                desc += (
                    "\nOne follow up after three days:\n"
                    + p["followSubject"]
                    + "\n"
                    + p["followMessage"]
                )
        if op == "payreply":
            require(
                t.get("campaignId") and p["replyId"] in t.get("replyIds", []),
                "Read this campaign’s replies and enter a matching reply ID.",
            )
            require(
                re.fullmatch(r"https://(?:www\.)?whop\.com/[^ \n]+", p["checkout"]),
                "Enter a Whop checkout URL.",
            )
            desc += "Send this real reply with " + p["checkout"]
    elif op in ("leads", "activate", "pause", "analytics", "replies"):
        require(t.get("campaignId"), "Create a paused campaign for this track first.")
        if op == "leads":
            require(t.get("verified"), "Check at least one business email first.")
        if op == "activate":
            require(t.get("leadsAdded"), "Add checked leads first.")
            inbox = request(
                keys, "Instantly", "/accounts/" + quote(t["sender"], safe="")
            )
            require(
                inbox.get("status") == 1
                and inbox.get("warmup_status") == 1
                and inbox.get("timestamp_warmup_start"),
                "The sending inbox must be active and warmed up.",
            )
            started = datetime.fromisoformat(
                inbox["timestamp_warmup_start"].replace("Z", "+00:00")
            )
            require(
                (datetime.now(timezone.utc) - started).days >= 14,
                "Wait until the inbox has warmed up for 14 days.",
            )
        desc += dict(
            leads="Add verified leads: " + ", ".join(t.get("verified", [])),
            activate="Real emails go to real people. Read every email first. Activate the saved campaign.",
            pause="Pause sending.",
            analytics="Read campaign totals.",
            replies="Read campaign replies. Suggested answers stay drafts.",
        )[op]
    else:
        desc += "Read account records. Only names, identifiers and status are returned."
    if op == "robot":
        return cost, desc
    return math.ceil(cost * 10000) / 10000, desc


def run_actor(call, actor, payload, cost, track, run_field, persist):
    ans = call(
        "/acts/"
        + actor
        + "/runs?"
        + urlencode(
            {"maxTotalChargeUsd": cost, "waitForFinish": 25, "timeout": 180}
        ),
        "POST",
        payload,
    )["data"]
    track[run_field] = ans["id"]
    persist()
    for _ in range(40):
        if ans["status"] not in ("READY", "RUNNING"):
            break
        time.sleep(4)
        ans = call("/actor-runs/" + quote(track[run_field]))["data"]
    require(
        ans["status"] == "SUCCEEDED",
        "Actor "
        + ans["status"]
        + ". Check run "
        + track[run_field]
        + " before retrying.",
    )
    return public_data(
        call(
            "/datasets/"
            + quote(ans["defaultDatasetId"])
            + "/items?limit=50&clean=true"
        )
    )


def run_job(p, t, cfg, keys, persist):
    op = p["op"]
    name = PROVIDER[op]

    def call(path, method="GET", body=None, extra=None):
        return request(keys, name, path, method, body, extra)

    if op == "write":
        if p["model"] == "fable":
            a = send(
                "Fable",
                fable_url(cfg),
                {},
                "POST",
                {
                    "model": "fable",
                    "messages": [
                        {"role": "system", "content": SYSTEM},
                        {"role": "user", "content": p["prompt"]},
                    ],
                },
            )
            return a["choices"][0]["message"]["content"]
        payload = {
            **response_input(p["model"], p["prompt"]),
            "max_output_tokens": OUTPUT_LIMIT,
            "store": False,
            "service_tier": "default",
        }
        if p["model"].startswith("gpt-6.2-"):
            # Without breakpoints, explicit mode avoids extra cache-write charges.
            payload["prompt_cache_options"] = {"mode": "explicit"}
        response = call("/responses", "POST", payload)
        require(
            response.get("status") == "completed",
            "OpenAI did not complete the draft. Review your brief and try again.",
        )
        parts = [
            part
            for item in response.get("output", [])
            if item.get("type") == "message"
            for part in item.get("content", [])
        ]
        require(
            not any(part.get("type") == "refusal" for part in parts),
            "OpenAI declined this draft. Review your brief.",
        )
        result = "\n".join(
            part["text"]
            for part in parts
            if part.get("type") == "output_text" and isinstance(part.get("text"), str)
        )
        require(
            result.strip(),
            "OpenAI returned no draft text. Review your brief and try again.",
        )
        return result
    if op == "robot":
        t.update(actor=p["actor"], actorInput=p["actorInput"])
        return run_actor(call, p["actor"], p["input"], p["cost"], t, "runId", persist)
    if op == "verify":
        cache = t.setdefault("checks", {})
        pending = [url for url in p["profiles"] if url not in cache]
        results = dict(cache)
        if pending:
            payload = {"linkedinUrls": pending, "smtpCheck": True}
            rows = run_actor(call, EMAIL_FINDER, payload, p["cost"], t, "emailRunId", persist)
            by_slug = {urlsplit(url).path.rstrip("/"): url for url in pending}
            for row in rows:
                url = row.get("input")
                if not url:
                    profile = urlsplit(row.get("linkedinUrl") or "")
                    if profile.hostname and re.fullmatch(r"(?:[a-z]{2,3}\.)?linkedin\.com", profile.hostname):
                        url = by_slug.get(profile.path.rstrip("/"))
                if url not in pending:
                    continue
                found = []
                if (
                    row.get("status") == "confirmed"
                    and row.get("sendDecision") == "send"
                    and row.get("mailboxConfirmed") is True
                    and isinstance(row.get("email"), str)
                ):
                    found.append(email(row["email"]))
                check = {
                    "source": url,
                    "verified": found,
                    "result": "Verified" if found else "No verified email. Skipped.",
                }
                results[url] = check
                if row.get("status") != "charge-limit":
                    cache[url] = check
                if found:
                    t["verified"] = sorted(set(t.get("verified", [])) | set(found))
            persist()
        return [
            results.get(url, {"source": url, "verified": [], "result": "No result. Retry available."})
            for url in p["profiles"]
        ]
    if op in ("pageArt","pageArtStatus"):
        _,job=illustration_target(p,t)
        if op=="pageArtStatus":
            return call("/requests/"+quote(job["id"],safe="")+"/status")
    if op in ("media", "cover","pageArt"):
        ans = call(
            "/" + p["modelPath"], "POST", p["input"], {"Idempotency-Key": p["id"]}
        )
        if op == "pageArt":
            job=t["book"].setdefault("artwork",{}).setdefault(str(p["pageIndex"]),{})
            job.update(id=str(ans["request_id"]),status="queued",direction=p["artDirection"])
            t["book"]["artDirection"]=p["artDirection"]
            persist()
            return {"status":job["status"]}
        if op == "cover":
            t.update(coverId=str(ans["request_id"]), coverState=ans.get("status", "queued"), coverPrompt=p["coverPrompt"])
            return {"status": t["coverState"]}
        t["mediaId"] = str(ans["request_id"])
        return {"request_id": t["mediaId"], "status": ans.get("status", "queued")}
    if op == "coverStatus":
        return call("/requests/" + quote(t["coverId"], safe="") + "/status")
    if op == "mediaStatus":
        return public_data(
            call("/requests/" + quote(t["mediaId"], safe="") + "/status")
        )
    if op == "hidden":
        if not t.get("productId"):
            obj = call(
                "/products",
                "POST",
                {
                    "title": p["title"],
                    "visibility": "hidden",
                    **({"account_id": cfg["company"]} if cfg.get("company") else {}),
                },
                {"Idempotency-Key": p["id"]},
            )
            t["productId"] = obj["id"]
            persist()
        if not t.get("variantId"):
            recurring = p["track"] == "Ad Remakes"
            price = amount(p["price"])
            variant = {
                "product_id": t["productId"],
                "visibility": "hidden",
                "unlimited_stock": False,
                "stock": 0,
                "currency": "usd",
                "billing_type": "renewal" if recurring else "one_time",
                "initial_price": 0 if recurring else price,
            }
            if recurring:
                variant.update(renewal_price=price, billing_period=30)
            obj = call(
                "/variants",
                "POST",
                variant,
                {
                    "Idempotency-Key": str(
                        uuid.uuid5(uuid.NAMESPACE_URL, t["productId"] + "/variant")
                    )
                },
            )
            t.update(
                variantId=obj["id"],
                price=price,
                checkout=obj.get("purchase_url") or "",
                visible=False,
            )
            persist()
        return {
            k: t.get(k)
            for k in ["productId", "variantId", "checkout", "visible", "price"]
        }
    if op in ("publish", "hide"):
        show = op == "publish"
        vis = "visible" if show else "hidden"
        if show:
            call("/products/" + t["productId"], "PATCH", {"visibility": vis})
        call(
            "/variants/" + t["variantId"],
            "PATCH",
            {
                "visibility": vis,
                "unlimited_stock": False,
                "stock": p["stock"] if show else 0,
            },
        )
        if not show:
            call("/products/" + t["productId"], "PATCH", {"visibility": vis})
        t["visible"] = show
        return {"visibility": vis, "stock": p["stock"] if show else 0}
    if op == "inboxes":
        response = call("/accounts?limit=100")
        rows = response if isinstance(response, list) else response.get("items", [])
        t["inboxes"] = [
            {
                k: r[k]
                for k in ("name", "email", "id", "domain", "status", "warmup_status", "daily_limit", "stat_warmup_score")
                if k in r
            }
            for r in rows
            if isinstance(r, dict)
        ]
        return t["inboxes"]
    if op == "campaign":
        req = {
            "name": "Selling: " + p["title"],
            "email_list": [p["sender"]],
            "daily_limit": 25,
            "stop_on_reply": True,
            "campaign_schedule": {
                "schedules": [
                    {
                        "name": "Work hours",
                        "timezone": "America/Detroit",
                        "days": {str(i): i in (1, 2, 3, 4, 5) for i in range(7)},
                        "timing": {"from": "09:00", "to": "17:00"},
                    }
                ]
            },
            "sequences": [
                {
                    "steps": [
                        {
                            "type": "email",
                            "delay": 0,
                            "variants": [
                                {
                                    "subject": p["subject"],
                                    "body": html.escape(p["message"]).replace(
                                        "\n", "<br>"
                                    ),
                                }
                            ],
                        }
                    ]
                }
            ],
        }
        if p.get("followMessage"):
            req["sequences"][0]["steps"][0]["delay"] = 3
            req["sequences"][0]["steps"].append(
                {
                    "type": "email",
                    "delay": 0,
                    "variants": [
                        {
                            "subject": p["followSubject"],
                            "body": html.escape(p["followMessage"]).replace(
                                "\n", "<br>"
                            ),
                        }
                    ],
                }
            )
            t.update(followBody=p["followBody"], followSubject=p["followSubject"])
        obj = call("/campaigns", "POST", req)
        t.update(
            campaignId=obj["id"],
            sender=p["sender"],
            body=p["body"],
            subject=p["subject"],
            campaignStatus="Draft",
        )
        persist()
        call("/campaigns/" + t["campaignId"] + "/pause", "POST", {})
        t["campaignStatus"] = "Paused"
        return {"campaign": t["campaignId"], "status": "Paused"}
    cid = t.get("campaignId", "")
    if op == "leads":
        obj = call(
            "/leads/add",
            "POST",
            {
                "campaign_id": cid,
                "leads": [{"email": x} for x in t["verified"]],
                "skip_if_in_campaign": True,
            },
        )
        t["leadsAdded"] = bool(
            obj.get("leads_uploaded")
            or obj.get("duplicated_leads")
            or t.get("leadsAdded")
        )
        return public_data(obj)
    if op == "test":
        return public_data(
            call(
                "/emails/test",
                "POST",
                {
                    "eaccount": p["sender"],
                    "to_address_email_list": email(p["testTo"]),
                    "subject": p["subject"],
                    "body": {"html": html.escape(p["message"]).replace("\n", "<br>")},
                },
            )
        )
    if op in ("activate", "pause"):
        call("/campaigns/" + cid + "/" + op, "POST", {})
        t["campaignStatus"] = "Sending" if op == "activate" else "Paused"
        return {"campaign": cid, "status": t["campaignStatus"]}
    if op == "analytics":
        data = call("/campaigns/analytics?" + urlencode({"id": cid}))
        items = data if isinstance(data, list) else data.get("items", [data])
        t["analytics"] = next((r for r in items if r.get("campaign_id", r.get("id", cid)) == cid), {})
        states = {0:"Draft", 1:"Sending", 2:"Paused", 3:"Completed", 4:"Running subsequences",
                  -99:"Suspended", -1:"Accounts unhealthy", -2:"Bounce protection"}
        state = states.get(t["analytics"].get("campaign_status"))
        if state:
            t["campaignStatus"] = state
        t["activityWarnings"] = []
        try:
            sent = call("/emails?" + urlencode({"campaign_id": cid, "limit": 30}))
            t["timeline"] = [{k: r.get(k) for k in ("ue_type", "timestamp_email", "lead", "eaccount", "subject")}
                             for r in sent.get("items", []) if r.get("campaign_id") == cid]
        except ValueError as err:
            t["activityWarnings"].append("Email log could not refresh. " + str(err))
        if t.get("sender"):
            today = datetime.now(timezone.utc).date().isoformat()
            try:
                daily = call("/accounts/analytics/daily?" + urlencode(
                    {"start_date": today, "end_date": today, "emails": t["sender"]}))
                t["senderUsage"] = next((r for r in daily if r.get("email_account") == t["sender"]
                                         and r.get("date") == today), {})
            except ValueError as err:
                t["activityWarnings"].append("Daily inbox usage could not refresh. " + str(err))
        return t["analytics"]
    if op == "replies":
        ans = call(
            "/emails?"
            + urlencode({"campaign_id": cid, "email_type": "received", "limit": 50})
        )
        items = [
            {
                k: r.get(k)
                for k in [
                    "id",
                    "from_address_email",
                    "subject",
                    "body",
                    "timestamp_email",
                ]
            }
            for r in ans.get("items", [])
            if r.get("campaign_id") == cid
        ]
        t["replyIds"] = [r["id"] for r in items]
        t["replies"] = triage(items)
        return {
            "received": len(items),
            "drafts": sum(bool(r["draft"]) for r in t["replies"]),
        }
    if op == "payreply":
        return public_data(
            call(
                "/emails/reply",
                "POST",
                {
                    "reply_to_uuid": p["replyId"],
                    "eaccount": p["sender"],
                    "subject": p["subject"],
                    "body": {
                        "html": html.escape(
                            p["message"] + "\n" + p["checkout"]
                        ).replace("\n", "<br>")
                    },
                },
            )
        )
    raise ValueError("Unknown action.")
