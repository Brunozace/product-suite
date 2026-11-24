"""Quoted batches of public research with each actor bounded independently."""

from concurrent.futures import ThreadPoolExecutor, as_completed
import json, re
from urllib.parse import quote_plus
from providers import quote_job, run_job, require


def make_jobs(p, t):
    topic = (
        p.get("notes") or t.get("notes", {}).get("build-0") or p.get("title") or ""
    ).strip()
    require(topic, "Save your idea or enter a search topic first.")
    topic = topic[:160]
    tag = re.sub(r"[^A-Za-z0-9_]", "", topic)[:60]
    if p["step"] == "build-1":
        jobs = [
            (
                "Reddit",
                "apify~reddit-scraper",
                {
                    "scrapeMode": "posts",
                    "searchQueries": [topic],
                    "maxSearchResultsPerQuery": 12,
                    "maxCommentsPerPost": 3,
                },
            ),
            (
                "Amazon",
                "junglee~amazon-crawler",
                {
                    "categoryOrProductUrls": [
                        {"url": "https://www.amazon.com/s?k=" + quote_plus(topic)}
                    ],
                    "maxItemsPerStartUrl": 10,
                    "maxSearchPagesPerStartUrl": 1,
                },
            ),
            (
                "Etsy",
                "epctex~etsy-scraper",
                {"search": topic, "maxItems": 10, "proxy": {"useApifyProxy": True}},
            ),
            (
                "TikTok",
                "clockworks~tiktok-scraper",
                {"searchQueries": [topic], "resultsPerPage": 10},
            ),
            (
                "YouTube",
                "streamers~youtube-scraper",
                {"searchQueries": [topic], "maxResults": 10},
            ),
        ]
    elif p["step"] == "launch-0":
        jobs = [
            (
                site,
                "apify~google-search-scraper",
                {"queries": "site:" + site + " " + topic, "maxPagesPerQuery": 1},
            )
            for site in ["whop.com", "gumroad.com", "skool.com"]
        ]
        jobs.append(
            (
                "Top reels",
                "apify~instagram-hashtag-scraper",
                {"hashtags": [tag], "resultsType": "reels", "resultsLimit": 10},
            )
        )
    elif p["step"] == "build-5":
        handle = topic.strip("@")
        require(
            re.fullmatch(r"[\w.]{1,30}", handle),
            "Enter just the public creator handle in the brief.",
        )
        jobs = [
            ("Profile", "apify~instagram-profile-scraper", {"usernames": [handle]}),
            (
                "Recent reels",
                "apify~instagram-reel-scraper",
                {"username": [handle], "resultsLimit": 15},
            ),
        ]
    elif p["track"] == "Airbnb Photos":
        jobs = [
            (
                "Public listings",
                "tri_angle~airbnb-scraper",
                {
                    "locationQueries": [topic],
                    "maxResults": 40,
                    "enrichUserProfiles": False,
                },
            )
        ]
    elif p["track"] == "Ad Remakes":
        jobs = [
            (
                "Running ads",
                "apify~facebook-ads-scraper",
                {
                    "startUrls": [
                        {
                            "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q="
                            + quote_plus(topic)
                        }
                    ],
                    "resultsLimit": 12,
                },
            )
        ]
    elif p["track"] == "YouTube Shorts" or p.get("platform") == "YouTube":
        jobs = [
            (
                "YouTube videos",
                "streamers~youtube-scraper",
                {"searchQueries": [topic], "maxResults": 15},
            )
        ]
    elif p.get("platform") == "TikTok":
        jobs = [
            (
                "Public videos",
                "clockworks~tiktok-scraper",
                {"searchQueries": [topic], "resultsPerPage": 25},
            )
        ]
    elif p.get("platform") == "LinkedIn":
        jobs = [
            (
                "Public profiles",
                "apify~google-search-scraper",
                {"queries": "site:linkedin.com/in " + topic, "maxPagesPerQuery": 1},
            )
        ]
    else:
        jobs = [
            (
                "Topic reels",
                "apify~instagram-hashtag-scraper",
                {"hashtags": [tag], "resultsType": "reels", "resultsLimit": 30},
            ),
            (
                "Creators",
                "apify~instagram-profile-scraper",
                {"usernames": ["derived from topic reels"]},
            ),
            (
                "Recent work",
                "apify~instagram-reel-scraper",
                {"username": ["derived from matching creators"], "resultsLimit": 8},
            ),
        ]
    return jobs


def quote_batch(p, t, cfg, keys):
    require(
        keys.get("Apify", {}).get("key"), "Add your Apify key first. It opens below."
    )
    batch = make_jobs(p, t)
    retry = p.get("retry")
    if retry and not p["step"] == "outreach-0":
        batch = [j for j in batch if j[0] == retry]
        require(batch, "This research row no longer exists.")
    planned = []
    details = []
    total = 0.0
    for label, actor, payload in batch:
        job = {
            **p,
            "op": "robot",
            "actor": actor,
            "actorInput": json.dumps(payload),
            "label": label,
        }
        cost, _ = quote_job(job, t, cfg, keys)
        job["cost"] = cost
        total += cost
        planned.append(job)
        details.append(
            f"{label}: {actor}. Run cap USD {cost:.2f}.\n"
            + json.dumps(payload, ensure_ascii=False)
        )
    p["jobs"] = planned
    return round(total, 4), "Research jobs for " + p["track"] + "\n\n" + "\n\n".join(
        details
    )


def run_batch(p, t, cfg, keys, persist):
    if p["step"] == "outreach-0":
        t.setdefault("research", {})[p["step"]] = {}
        t["searchPlatform"] = p.get("platform") or "Instagram"
    if p["step"] == "build-5":
        handle = p["notes"].strip().lstrip("@")
        if handle.lower() != t.get("voiceHandle", "").lower():
            t.setdefault("research", {})[p["step"]] = {}
        t.update(voiceHandle=handle, voiceReport="", voiceOriginal="")
    results = t.setdefault("research", {}).setdefault(p["step"], {})

    def one(job):
        try:
            rows = run_job(job, {}, cfg, keys, lambda: None)
            # Keep compact source records instead of entire remote page bodies.
            if job["actor"] == "apify~google-search-scraper":
                rows = [hit for page in rows for hit in page.get("organicResults", [page])]
            rows = [
                {
                    k: (v[:1600] if isinstance(v, str) else v)
                    for k, v in r.items()
                    if isinstance(v, (str, int, float, bool))
                }
                for r in rows
                if isinstance(r, dict)
            ]
            return {"status": "Done", "rows": rows, "count": len(rows)}
        except ValueError as err:
            return {"status": "Failed", "error": str(err), "rows": []}

    jobs = p["jobs"]
    if len(jobs) == 3 and jobs[0]["label"] == "Topic reels":
        for job in jobs:
            label = job["label"]
            if label != "Topic reels":
                src = results.get(
                    "Topic reels" if label == "Creators" else "Creators", {}
                ).get("rows", [])
                handles = []
                for r in src:
                    if not isinstance(r, dict):
                        continue
                    if (
                        label == "Recent work"
                        and not 10000 <= int(r.get("followersCount") or 0) <= 100000
                    ):
                        continue
                    value = r.get("ownerUsername") or r.get("username")
                    if value and re.fullmatch(r"[\w.]{1,30}", value):
                        handles.append(value)
                if not handles:
                    results[label] = {"status": "Skipped", "rows": [], "count": 0}
                    continue
                job["input"]["usernames" if label == "Creators" else "username"] = list(
                    dict.fromkeys(handles)
                )[:15]
            results[label] = one(job)
            persist()
    else:
        with ThreadPoolExecutor(max_workers=min(5, len(jobs))) as pool:
            futures = {pool.submit(one, job): job["label"] for job in jobs}
            for task in as_completed(futures):
                label = futures[task]
                results[label] = task.result()
                persist()
    return {
        label: {k: v for k, v in r.items() if k != "rows"}
        for label, r in results.items()
    }
