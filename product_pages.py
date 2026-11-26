"""Physical page definitions for reviewed ebook plans."""

import hashlib
import json
import re
import string

TYPES = {
    "Ebook": ("paragraph", "Explain one concept with a worked example."),
    "Educational workbook": (
        "writing_area",
        "Set a learning task, model it and leave room to practice.",
    ),
    "Children's activity book": (
        "illustration",
        "Give a child one short illustrated task with a drawable response.",
    ),
    "Practical guide": (
        "checklist",
        "Demonstrate a procedure and include actionable checks.",
    ),
    "Cookbook": (
        "checklist",
        "Give ingredients with quantities, yield, timing and ordered cooking steps.",
    ),
    "Planner": (
        "table",
        "Create a usable planning spread with labeled columns and blank entries.",
    ),
    "Journal": (
        "writing_area",
        "Offer a focused reflection prompt with space for the reader.",
    ),
    "Checklist": (
        "checklist",
        "Provide distinct, observable items the reader can tick.",
    ),
    "Template collection": (
        "table",
        "Create a reusable template with named fields and a worked example.",
    ),
}
TEXT = {"heading", "paragraph", "callout"}
EXERCISES = {
    "tracing_path",
    "letter_practice",
    "number_practice",
    "shape_practice",
    "handwriting_grid",
    "matching",
    "writing_area",
    "checklist",
    "table",
}
VISUALS = {"pencil", "stars", "leaf", "shapes"}
PATHS = {"straight", "vertical", "diagonal", "wave", "curve", "zigzag"}
SHAPES = {"circle", "square", "triangle", "rectangle"}


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()


def infer(track):
    if track.get("book", {}).get("subtype") in TYPES:
        return track["book"]["subtype"]
    patterns = [
        ("Cookbook", r"cookbook|recipe"),
        ("Educational workbook", r"workbook|pencil practice|worksheet"),
        ("Children's activity book", r"activity book|coloring book"),
        ("Planner", r"planner"),
        ("Journal", r"journal"),
        ("Template collection", r"template"),
        ("Checklist", r"checklist"),
        ("Practical guide", r"guide|handbook"),
    ]
    for text in [
        track.get("title", ""),
        track.get("results", {}).get("build-3", "")[:1200],
        track.get("buyer", ""),
        track.get("results", {}).get("build-1", "")[:1200],
    ]:
        for subtype, pattern in patterns:
            if re.search(pattern, text, re.I):
                return subtype
    return "Ebook"


def block(kind, value):
    return {"type": kind, "value": value}


def validate(page):
    if (
        not isinstance(page, dict)
        or not isinstance(page.get("title"), str)
        or not 1 <= len(page["title"].strip()) <= 140
    ):
        raise ValueError("Give this page a title of up to 140 characters.")
    blocks = page.get("blocks")
    if not isinstance(blocks, list) or not 1 <= len(blocks) <= 14:
        raise ValueError("Use 1 to 14 content blocks per page.")
    for item in blocks:
        if not isinstance(item, dict):
            raise ValueError("Each block needs a type and value.")
        k, v = item.get("type"), item.get("value")
        valid = False
        if not isinstance(k, str):
            raise ValueError("Each block needs a supported type.")
        if k in TEXT:
            valid = isinstance(v, str) and 0 < len(v.strip()) <= 4000
        elif k == "illustration":
            valid = isinstance(v, str) and v in VISUALS
        elif k in ("tracing_path", "shape_practice"):
            valid = isinstance(v, str) and v in (
                PATHS if k == "tracing_path" else SHAPES
            )
        elif k == "letter_practice":
            valid = isinstance(v, str) and bool(re.fullmatch("[A-Za-z]", v))
        elif k == "number_practice":
            valid = isinstance(v, str) and bool(re.fullmatch(r"10|[0-9]", v))
        elif k in ("writing_area", "handwriting_grid"):
            valid = type(v) is int and 1 <= v <= 6
        elif k == "checklist":
            valid = (
                isinstance(v, list)
                and 1 <= len(v) <= 12
                and all(isinstance(x, str) and 0 < len(x.strip()) <= 120 for x in v)
            )
        elif k == "matching":
            valid = (
                isinstance(v, list)
                and 2 <= len(v) <= 4
                and all(isinstance(x, str) and x in SHAPES for x in v)
                and len(set(v)) == len(v)
            )
        elif k == "table":
            valid = (
                isinstance(v, list)
                and 1 <= len(v) <= 10
                and all(
                    isinstance(row, list)
                    and 1 <= len(row) <= 4
                    and len(row) == len(v[0])
                    and all(isinstance(x, str) and len(x) <= 80 for x in row)
                    for row in v
                )
                and all(x.strip() for x in v[0])
            )
        if not valid:
            raise ValueError(f"Invalid {k} block. Check its type and value.")
    return page


def plain(page):
    return "\n\n".join(
        str(b["value"])
        if b["type"] in TEXT
        else b["type"].replace("_", " ") + ": " + str(b["value"])
        for b in page["blocks"]
    )


def pencil_plan(title, subtype):
    return subtype in ("Educational workbook", "Children's activity book") and bool(
        re.search(r"pencil practice|tracing|handwriting", title, re.I)
    )


def slots(titles, pencil):
    result = []
    for section in titles:
        low = section.lower()
        variants = [("", None)]
        if pencil:
            if "uppercase" in low:
                variants = [("letter_practice", s) for s in string.ascii_uppercase]
            elif "lowercase" in low:
                variants = [("letter_practice", s) for s in string.ascii_lowercase]
            elif "number" in low:
                numbers = re.findall(r"\d+", low)
                lo, hi = map(int, numbers[:2]) if len(numbers) >= 2 else (1, 10)
                variants = [
                    ("number_practice", str(i))
                    for i in range(max(0, lo), min(10, hi) + 1)
                ] or variants
        for kind, value in variants:
            result.append(
                {
                    "section": section,
                    "title": section
                    if value is None
                    else ("Letter " if kind == "letter_practice" else "Number ")
                    + value,
                    "kind": kind,
                    "value": value,
                }
            )
    return result


def pencil_page(slot):
    title, low = slot["title"], slot["section"].lower()
    kind, value = slot["kind"], slot["value"]
    blocks = []

    def add(k, v):
        blocks.append(block(k, v))

    if not kind and "letter" in low:
        add(
            "paragraph",
            "Ask a grown-up to write your name on the line. Circle its first letter in the alphabet below.",
        )
        add("writing_area", 1)
        add(
            "table",
            [["A B C D E", "F G H I J", "K L M N O"], ["P Q R S T", "U V W X Y", "Z"]],
        )
        add("heading", "Try your letter")
        add(
            "paragraph",
            "Find its practice page in the alphabet section. Trace one example there, then come back and write your letter here.",
        )
        add("handwriting_grid", 3)
    elif kind == "letter_practice":
        ch = value or "A"
        add(
            "paragraph",
            f"Say the letter {ch}. Trace each outline. Try one on the empty line.",
        )
        add("letter_practice", ch)
        add("letter_practice", ch)
        add("handwriting_grid", 2)
    elif kind == "number_practice":
        add("paragraph", f"Count the stars. Say {value}, then trace the number.")
        add("number_practice", value)
        add("number_practice", value)
        add("handwriting_grid", 2)
    elif "shape" in low:
        add("paragraph", "Trace each shape, then draw a line between matching shapes.")
        for s in ("circle", "triangle", "square", "rectangle"):
            add("shape_practice", s)
        add("matching", ["circle", "triangle", "square"])
    elif any(s in low for s in ("review", "mix")):
        add(
            "paragraph",
            "Choose a trail. Trace a shape, a letter and a number. Circle your favorite.",
        )
        for k, v in [
            ("tracing_path", "wave"),
            ("shape_practice", "circle"),
            ("letter_practice", "A"),
            ("number_practice", "3"),
        ]:
            add(k, v)
    else:
        add("illustration", "pencil")
        add(
            "paragraph",
            "Put your pencil on each solid dot. Follow the dotted trail to the open circle.",
        )
        paths = (
            ["curve", "wave", "zigzag"]
            if re.search("curve|wave|turn|zigzag", low)
            else ["straight", "vertical", "diagonal"]
            if "direction" in low
            else ["straight", "curve", "straight"]
        )
        for v in paths:
            add("tracing_path", v)
        add("writing_area", 1)
    return validate({"title": title, "blocks": blocks})


def page_issues(page, subtype, slot):
    try:
        validate(page)
    except (TypeError, ValueError) as err:
        return [str(err)]
    kinds = [b["type"] for b in page["blocks"]]
    required = slot.get("kind")
    if slot.get("required"):
        for expected in slot["required"]:
            if not any(
                (b["type"], b["value"]) == (expected["type"], expected["value"])
                for b in page["blocks"]
            ):
                return [
                    "Restore the planned "
                    + expected["type"].replace("_", " ")
                    + " exercise ("
                    + str(expected["value"])
                    + ")."
                ]
    if required and not any(
        b["type"] == required and b["value"] == slot.get("value")
        for b in page["blocks"]
    ):
        return ["Missing the scheduled practice exercise."]
    expected = TYPES[subtype][0]
    if subtype == "Children's activity book" and set(kinds) & EXERCISES:
        return []
    if subtype == "Educational workbook" and not set(kinds) & EXERCISES:
        return ["Add a printable exercise."]
    if subtype != "Educational workbook" and expected not in kinds:
        return ["Add a " + expected.replace("_", " ") + " block."]
    if re.search(
        r"\b(lorem ipsum|insert content here|todo:|placeholder text)\b",
        plain(page),
        re.I,
    ):
        return ["Replace placeholder content."]
    return []
