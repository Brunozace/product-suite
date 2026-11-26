"""Checkpoint and proof each physical page independently."""

from functools import lru_cache
import json

from product_pages import (
    TYPES,
    EXERCISES,
    digest,
    infer,
    slots,
    pencil_plan,
    pencil_page,
    plain,
    validate,
    page_issues,
)
from page_press import pdf_pages
from providers import require, quote_job, run_job

SCHEMA = """Return only a JSON object with title and blocks. Each block has type and value.
heading, paragraph, callout: short string. illustration: pencil, stars, leaf or shapes.
tracing_path: straight, vertical, diagonal, wave, curve or zigzag. letter_practice: one Latin letter.
number_practice: a string from 0 through 10. shape_practice: circle, triangle, square or rectangle.
handwriting_grid and writing_area: integer 1 to 6 rows. checklist: array of short strings.
matching: array of 2 to 4 different shape names. table: rectangular array of string rows, first row column headings.
Make one printable page of under 165 words, using 2 to 6 blocks. Include real content. Keep tables short.
Use supplied evidence only for factual claims. Include the source name with any claim that needs attribution."""


@lru_cache(maxsize=768)
def proof(kind, slot_json, page_json):
    page = json.loads(page_json)
    slot = json.loads(slot_json)
    errors = page_issues(page, kind, slot)
    if not errors:
        try:
            pdf_pages(
                {
                    "title": "Proof",
                    "subtype": kind,
                    "titles": [page["title"]],
                    "pages": {"0": page},
                },
                only=1,
            )
        except ValueError as err:
            errors.append(str(err))
    return errors


def inspect_page(kind, slot, page):
    return proof(
        kind, json.dumps(slot, sort_keys=True), json.dumps(page, sort_keys=True)
    )


def quality(book):
    missing = []
    issues = {}
    seen = {}
    exercises = illustrations = 0
    for i, slot in enumerate(book["slots"]):
        key = str(i)
        page = book["pages"].get(key)
        if not page:
            missing.append(i)
            continue
        errors = list(inspect_page(book["subtype"], slot, page))
        if not errors:
            match = digest(page["blocks"])
            if match in seen:
                errors.append(f"Same content as page {seen[match] + 1}.")
            seen[match] = i
            exercises += sum(b["type"] in EXERCISES for b in page["blocks"])
            illustrations += sum(
                b["type"] == "illustration" or b["type"] == "number_practice"
                for b in page["blocks"]
            )
        if errors:
            issues[key] = errors
    return {
        "missing": missing,
        "issues": issues,
        "exercises": exercises,
        "illustrations": illustrations,
        "ready": bool(book["slots"])
        and not missing
        and not issues
        and not book.get("failures"),
    }


def quote_pages(p, t, cfg, keys):
    outline = [s.strip() for s in p["outline"].splitlines() if s.strip()]
    require(
        p.get("title")
        and 1 <= len(outline) <= 20
        and all(len(x) <= 140 for x in outline),
        "Review the title and outline first.",
    )
    kind = p["subtype"]
    require(kind in TYPES, "Choose a supported product subtype.")
    pencil = (
        pencil_plan(p["title"], kind)
        and "preschool" in (p["title"] + p.get("notes", "")).lower()
    )
    plan = slots(outline, pencil)
    if kind == "Ebook":
        plan = [
            {**slot, "focus": focus, "title": title}
            for slot in plan
            for focus, title in (
                (
                    "Explain the chapter's central idea using the reviewed evidence.",
                    slot["title"],
                ),
                (
                    "Continue the chapter with a distinct worked example and a reader exercise.",
                    slot["title"] + " in practice",
                ),
            )
        ]
    if pencil:
        for slot in plan:
            slot["required"] = [
                b
                for b in pencil_page(slot)["blocks"]
                if b["type"]
                in (
                    "tracing_path",
                    "shape_practice",
                    "matching",
                    "letter_practice",
                    "number_practice",
                )
            ]
    signature = digest(
        [p["title"], kind, outline, p.get("notes", ""), p.get("bookContext", "")]
    )
    book = t.get("book", {})
    same = book.get("signature") == signature
    target = p.get("pageIndex")
    if target is not None:
        require(
            same and type(target) is int and 0 <= target < len(plan),
            "Rebuild the reviewed outline before regenerating this page.",
        )
    jobs = []
    cost = 0
    for i, slot in enumerate(plan):
        if target is not None and i != target:
            continue
        if target is None and same and book.get("pages", {}).get(str(i)):
            continue
        job = {"index": str(i)}
        if not pencil:
            job.update(
                p,
                op="write",
                instruction=f"{SCHEMA}\nProduct format: {kind}. {TYPES[kind][1]} Include a {TYPES[kind][0]} block. Page {i + 1}: {slot['title']}. {slot.get('focus', '')} Outline: "
                + ", ".join(outline),
                notes=p["notes"] + p.get("bookContext", ""),
            )
            bound, _ = quote_job(job, t, cfg, keys)
            cost += bound
        jobs.append(job)
    require(
        jobs or (same and 4 in t.get("staleSteps", [])),
        "All pages are saved. Choose a page to edit or regenerate.",
    )
    p.update(pageJobs=jobs, slots=plan, signature=signature, localPages=pencil)
    engine = (
        "using local vector exercises" if pencil else "with the selected writing model"
    )
    return (
        round(cost, 4),
        f"Build {len(jobs)} of {len(plan)} printable pages {engine}. Each page is checked and saved separately.",
    )


def store_page(book, key, page):
    validate(page)
    errors = inspect_page(book["subtype"], book["slots"][int(key)], page)
    require(not errors, " ".join(errors))
    book["pages"][key] = page
    book["units"][key] = plain(page)
    book["titles"][int(key)] = page["title"]
    book.get("failures", {}).pop(key, None)


def run_pages(p, t, cfg, keys, persist):
    old = t.get("book", {})
    if old.get("signature") != p["signature"]:
        if old:
            t["previousBook"] = old
        t["book"] = {
            "signature": p["signature"],
            "title": p["title"],
            "subtype": p["subtype"],
            "slots": p["slots"],
            "titles": [s["title"] for s in p["slots"]],
            "outline": p["outline"],
            "brief": p["notes"],
            "pages": {},
            "units": {},
            "sources": [],
        }
    book = t["book"]
    t["staleSteps"] = sorted((set(t.get("staleSteps", [])) - {4}) | {5, 6})
    for job in p["pageJobs"]:
        key = job["index"]
        slot = book["slots"][int(key)]
        try:
            if p["localPages"]:
                page = pencil_page(slot)
            else:
                raw = run_job(job, t, cfg, keys, persist)
                try:
                    page = json.loads(
                        raw.strip().removeprefix("```json").removesuffix("```").strip()
                    )
                except (ValueError, AttributeError):
                    raise ValueError("The writer returned invalid page JSON.") from None
            store_page(book, key, page)
        except (ValueError, RuntimeError) as err:
            book.setdefault("failures", {})[key] = str(err)[:500]
            persist()
            raise ValueError(
                f"Page {int(key) + 1}: {err} Earlier pages are saved."
            ) from err
        persist()
    return f"{len(book['pages'])} printable pages saved."
