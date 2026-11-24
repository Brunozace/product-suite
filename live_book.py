"""Generate one unit at a time, checkpointing after each successful response."""

import hashlib, json, re
from providers import require, quote_job, run_job


def quote_book(p, t, cfg, keys):
    titles = [x.strip() for x in p.get("outline", "").splitlines() if x.strip()]
    require(
        1 <= len(titles) <= 20 and all(len(x) <= 140 for x in titles),
        "Enter one chapter, lesson or week title per line, up to 20.",
    )
    require(
        p.get("title") and p.get("notes"),
        "Enter a title and reviewed source material before writing.",
    )
    urls = list(dict.fromkeys(re.findall(r"https://[^\s<>()]+", p["notes"])))
    sig = hashlib.sha256(
        json.dumps([titles, p["title"], p["notes"], p["track"]]).encode()
    ).hexdigest()
    existing = t.get("book", {}) if t.get("book", {}).get("signature") == sig else {}
    jobs = []
    cost = 0
    for i, title in enumerate(titles):
        if str(i) in existing.get("units", {}):
            continue
        prompt = {
            "Ebook": "Write 350 to 450 words. Open with The short version. Use 3 to 6 short sections, a Try tonight exercise, and 3 Remember bullets. Cite each factual claim with a supplied source number. If a fact lacks evidence, omit it. Include a safety note when needed.",
            "Course": "Write a spoken lesson script, a clear demonstration, one practice task, and a printable one-page worksheet.",
            "Coaching": "Write a week plan, call outline, practice assignment and printable check-in form.",
        }[p["track"]]
        if p["track"] == "Ebook" and re.search(r"\b(workbook|worksheet|printable)\b", p["title"], re.I):
            prompt = ("Create the actual printable activity for this unit. Give short learner or caregiver "
                      "directions, a worked example and space to practice. Match the age and the outline. "
                      "For handwriting exercises place each practice row on its own line as "
                      "[TRACE: A a] or [TRACE: 1 2 3]. For shape or path exercises use [TRACE: circle], "
                      "[TRACE: triangle], [TRACE: square] or [TRACE: line]. Use [WRITE] for a blank practice row. "
                      "Use only the rows this activity needs. Cite factual claims using supplied sources.")
        source_index = "\n".join(f"[{j + 1}] {u}" for j, u in enumerate(urls))
        job = {
            **p,
            "op": "write",
            "instruction": f"{prompt} This is unit {i + 1}: {title}. Full outline: "
            + ", ".join(titles)
            + ". Source index:\n"
            + source_index,
            "index": str(i),
        }
        bound, _ = quote_job(job, t, cfg, keys)
        cost += bound
        jobs.append(job)
    require(
        jobs,
        "Every unit in this outline is already built. Edit the saved product below.",
    )
    p.update(
        bookJobs=jobs, signature=sig, titles=titles, sources=[[u, u] for u in urls]
    )
    return (
        round(cost, 4),
        f"Write {len(jobs)} units of {p['title']} with {jobs[0]['model']}, one at a time. Save each completed unit before continuing.\n\n"
        + "\n".join(titles),
    )


def run_book(p, t, cfg, keys, persist):
    if t.get("book", {}).get("signature") != p["signature"]:
        t["book"] = {
            "signature": p["signature"],
            "title": p["title"],
            "titles": p["titles"],
            "sources": p["sources"],
            "units": {},
        }
    for job in p["bookJobs"]:
        draft = run_job(job, t, cfg, keys, persist)
        require(
            isinstance(draft, str) and draft.strip(),
            "Empty draft. Earlier units have been saved.",
        )
        t["book"]["units"][job["index"]] = draft
        persist()
    return f"{len(t['book']['units'])} units saved for human review."
