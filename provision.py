"""Dedicated domain and inbox setup, quoted one order at a time."""

import json, re
from urllib.parse import urlencode, quote
from providers import amount, require, request, ProviderError, email

OPS = {
    "availability": "Spaceship",
    "register": "Spaceship",
    "orderMail": "ScaledMail",
    "writeDNS": "Spaceship",
    "readDNS": "Spaceship",
    "connectMail": "Instantly",
}


def domain(p):
    name = str(p.get("domain", "")).strip().lower()
    require(
        re.fullmatch(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}", name),
        "Enter a valid dedicated sending domain.",
    )
    return name


def register_price(keys, name):
    available = request(keys, "Spaceship", "/domains/" + name + "/available")
    require(available.get("result") == "available", "This domain is unavailable.")
    resp = request(keys, "Spaceship", "/domains/" + name + "/pricing")
    for row in resp.get("prices", {}).get("register", []):
        if row.get("period") == {"value": 1, "unit": "y"}:
            money = row["priceInDefaultCurrency"]["finalPrice"]
            require(money["currency"] == "USD", "This account needs a USD quote.")
            return amount(money["amount"], 0.01)
    raise ValueError("No one-year registration quote is available.")


def mailbox_price(keys):
    data = request(
        keys,
        "ScaledMail",
        "/calculate-package",
        "POST",
        {"volume": 1, "period": "day", "providers": ["google"], "tier": "medium"},
    ).get("data", {})
    require(
        data.get("totalDomains") == 1 and data.get("totalMailboxes") == 2,
        "The provider could not quote exactly one domain and two Google inboxes.",
    )
    return amount(data["totalPrice"], 1) / 100


def records(p):
    items = json.loads(p.get("dns", "[]"))
    require(
        isinstance(items, list) and 1 <= len(items) <= 12,
        "Enter the mail DNS records supplied by your mailbox provider.",
    )
    for r in items:
        require(
            isinstance(r, dict)
            and r.get("type") in ("TXT", "MX")
            and isinstance(r.get("name"), str)
            and r.get("name"),
            "Use only MX and TXT mail records.",
        )
        if r["type"] == "MX":
            require(
                r.get("exchange") and isinstance(r.get("preference"), int),
                "Add the MX host and preference.",
            )
        else:
            require(r.get("value"), "Add the TXT value from the provider.")
    return items


def quote_setup(p, t, cfg, keys):
    op = p["op"]
    n = domain(p) if op != "availability" else ""
    cost = 0
    require(
        keys.get(OPS[op], {}).get("key"),
        "Add your " + OPS[op] + " key first. It opens below.",
    )
    if op == "availability":
        stem = re.sub("[^a-z0-9]", "", p.get("brand", "").lower())
        require(1 <= len(stem) <= 40, "Enter a short business name.")
        p["candidates"] = [
            prefix + stem + ".com"
            for prefix in ["get", "team", "hello", "try", "use", "with"]
        ]
        text = "Check these six names:\n" + "\n".join(p["candidates"])
    elif op == "register":
        require(cfg.get("owner"), "Save your Spaceship owner contact ID first.")
        require(
            n not in t.get("registrations", {}),
            "This registration is already pending or complete.",
        )
        cost = register_price(keys, n)
        text = f"Register {n} for one year. Private WHOIS, automatic renewal off. Your saved contact is used for all four roles."
    elif op == "orderMail":
        require(
            keys.get("Registrar", {}).get("secret"),
            "Save the private registrar login in Settings first.",
        )
        require(
            n not in t.get("orders", {}), "An order for this domain already exists."
        )
        require(
            p.get("firstName") and p.get("lastName"),
            "Enter a sender first and last name.",
        )
        cost = mailbox_price(keys)
        text = f"Create a recurring Google mailbox subscription for {n}. Two inboxes. USD {cost:.2f} per month until cancelled with ScaledMail. The confirmed order includes the saved registrar login."
    elif op == "writeDNS":
        p["records"] = records(p)
        text = f"Add these mail records to {n}. No forced replacement.\n" + json.dumps(
            p["records"], indent=2
        )
    elif op == "readDNS":
        text = "Read the DNS records currently configured for " + n + "."
    else:
        require(
            keys.get("ScaledMail", {}).get("key"),
            "Add your ScaledMail key first. It opens below.",
        )
        require(cfg.get("workspace"), "Choose a ScaledMail workspace ID in Settings.")
        text = (
            "Connect the Google inboxes on "
            + n
            + " from ScaledMail to Instantly. Existing inboxes are skipped. Enable warmup, cap new inboxes at 25 per day. Passwords stay in the helper."
        )
    return cost, text


def run_setup(p, t, cfg, keys, persist):
    op = p["op"]
    n = domain(p) if op != "availability" else ""
    if op == "availability":
        out = []
        for name in p["candidates"]:
            try:
                out.append({"domain": name, "year_one_USD": register_price(keys, name)})
            except ValueError as err:
                out.append({"domain": name, "status": str(err)})
        return out
    if op == "register":
        require(
            register_price(keys, n) == p["cost"],
            "The domain price changed. Review a new quote.",
        )
        payload = {
            "autoRenew": False,
            "years": 1,
            "privacyProtection": {"level": "high", "userConsent": False},
            "contacts": {
                role: cfg["owner"]
                for role in ["registrant", "admin", "tech", "billing"]
            },
        }
        ans = request(keys, "Spaceship", "/domains/" + n, "POST", payload)
        t.setdefault("registrations", {})[n] = ans.get("operationId", "Submitted")
        persist()
        return {
            "domain": n,
            "operation_id": t["registrations"][n],
            "status": "Submitted",
            "next": "Check the registration status before ordering inboxes.",
        }
    if op == "orderMail":
        require(
            mailbox_price(keys) == p["cost"],
            "Mailbox pricing changed. Review a new quote.",
        )
        secret = keys["Registrar"]
        body = {
            "providers": {
                "google": {
                    "mailboxes_per_domain": 2,
                    "domains": [
                        {
                            "domain": n,
                            "first_name": p["firstName"],
                            "last_name": p["lastName"],
                        }
                    ],
                }
            },
            "hosting": {
                "provider": "Spaceship",
                "username": secret["key"],
                "password": secret["secret"],
            },
        }
        query = {"provider": "other"}
        if cfg.get("workspace"):
            query["organization_id"] = cfg["workspace"]
        ans = request(
            keys, "ScaledMail", "/create-custom-order?" + urlencode(query), "POST", body
        )
        t.setdefault("orders", {})[n] = str(
            ans.get("order_id") or ans.get("id") or "Submitted"
        )
        persist()
        return {"domain": n, "order": t["orders"][n], "status": "Submitted"}
    if op == "writeDNS":
        request(
            keys,
            "Spaceship",
            "/dns/records/" + n,
            "PUT",
            {"force": False, "items": p["records"]},
        )
        t.setdefault("dns", {})[n] = p["records"]
        return "Mail records submitted for " + n + "."
    if op == "readDNS":
        a = request(keys, "Spaceship", "/dns/records/" + n + "?take=500&skip=0")
        rows = a if isinstance(a, list) else a.get("items", [])
        return [
            {
                "type": r.get("type"),
                "host": r.get("name"),
                "value": r.get("value", r.get("exchange")),
                "status": "Present at registrar",
            }
            for r in rows
            if r.get("type") in ("MX", "TXT")
        ]
    ans = request(
        keys,
        "ScaledMail",
        "/mailboxes/"
        + n
        + "?"
        + urlencode({"organization_id": cfg["workspace"], "password": "true"}),
    )
    rows = ans.get("mailboxes", [])
    ready = []
    require(rows, "No mailboxes returned for this domain yet.")
    for r in rows:
        addr = email(r["email"])
        require(addr.rsplit("@", 1)[1] == n, "Mailbox domain mismatch.")
        path = "/accounts/" + quote(addr, safe="")
        try:
            request(keys, "Instantly", path)
        except ProviderError as err:
            if err.status != 404:
                raise
            pwd = r.get("mailbox_password")
            require(pwd, "ScaledMail has not supplied the mailbox password yet.")
            request(
                keys,
                "Instantly",
                "/accounts",
                "POST",
                {
                    "email": addr,
                    "provider_code": 2,
                    "first_name": p["firstName"] or addr.split("@")[0],
                    "last_name": p["lastName"] or "Team",
                    "daily_limit": 25,
                    "enable_slow_ramp": True,
                    "imap_username": addr,
                    "imap_password": pwd,
                    "imap_host": "imap.gmail.com",
                    "imap_port": 993,
                    "smtp_username": addr,
                    "smtp_password": pwd,
                    "smtp_host": "smtp.gmail.com",
                    "smtp_port": 465,
                },
            )
        ready.append(addr)
    request(keys, "Instantly", "/accounts/warmup/enable", "POST", {"emails": ready})
    t["inboxes"] = sorted(set(t.get("inboxes", []) + ready))
    return {"connected": ready, "warmup": "Enabled", "daily_cap_per_new_inbox": 25}
