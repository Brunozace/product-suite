"""A small 6 x 9 inch book renderer. Uses only the Python standard library."""

import re
import textwrap
from pathlib import Path
from urllib.parse import urlsplit

W, H = 432, 648


def literal(text):
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
        .encode("cp1252", "replace")
    )


class Document:
    def __init__(self):
        self.objects = [b"", b""]
        self.pages = []
        self.ops = []
        self.annotations = []
        self.y = 592
        self.fonts = [
            self.add(
                f"<< /Type /Font /Subtype /Type1 /BaseFont /{f} /Encoding /WinAnsiEncoding >>".encode()
            )
            for f in ["Helvetica", "Helvetica-Bold", "Times-Roman"]
        ]
        pic = (Path(__file__).parent / "public/media/plate.jpg").read_bytes()
        # JPEG dimensions are read directly from its Start Of Frame segment.
        m = re.search(b"\xff[\xc0\xc1\xc2]..(.)(..)(..)", pic, re.S)
        height, width = int.from_bytes(m[2], "big"), int.from_bytes(m[3], "big")
        self.photo = self.stream(
            pic,
            f"/Type /XObject /Subtype /Image /Width {width} /Height {height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode",
        )

    def add(self, obj):
        self.objects.append(obj)
        return len(self.objects)

    def stream(self, content, meta=""):
        return self.add(
            f"<< {meta} /Length {len(content)} >>\nstream\n".encode()
            + content
            + b"\nendstream"
        )

    def command(self, text):
        self.ops.append(text.encode())

    def text(self, s, y, size=11, font=0, x=37, color="0.15 0.16 0.14"):
        self.ops.append(
            f"BT {color} rg /F{font} {size} Tf 1 0 0 1 {x} {y} Tm (".encode()
            + literal(s)
            + b") Tj ET"
        )

    def photo_band(self, y, h):
        self.command(
            f"q 36 {y} 360 {h} re W n 360 0 0 240 36 {y - (240 - h) / 2} cm /Photo Do Q"
        )

    def flush(self):
        if not self.ops:
            return
        self.text("DEARWORK   /   FIELD GUIDE", 19, 8, 1)
        self.text(str(len(self.pages) + 1), 19, 8, 1, 384)
        contents = self.stream(b"\n".join(self.ops))
        resources = " ".join(f"/F{i} {ref} 0 R" for i, ref in enumerate(self.fonts))
        links = " ".join(f"{a} 0 R" for a in self.annotations)
        self.pages.append(
            self.add(
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] /Resources << /Font << {resources} >> /XObject << /Photo {self.photo} 0 R >> >> /Contents {contents} 0 R /Annots [{links}] >>".encode()
            )
        )
        self.ops = []
        self.annotations = []
        self.y = 592

    def para(self, text, size=11, bold=False):
        for line in textwrap.wrap(
            text, width=int(360 / (size * 0.53)), break_long_words=True
        ) or [""]:
            if self.y < 53:
                self.flush()
            self.text(line, self.y, size, 1 if bold else 0)
            self.y -= size * 1.4
        self.y -= 5

    def build(self):
        self.flush()
        self.objects[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
        kids = " ".join(f"{p} 0 R" for p in self.pages)
        self.objects[1] = (
            f"<< /Type /Pages /Kids [{kids}] /Count {len(self.pages)} >>".encode()
        )
        data = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for i, obj in enumerate(self.objects, 1):
            offsets.append(len(data))
            data.extend(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
        pos = len(data)
        data.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
        for offset in offsets[1:]:
            data.extend(f"{offset:010d} 00000 n \n".encode())
        data.extend(
            f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{pos}\n%%EOF".encode()
        )
        return bytes(data)

    def practice(self, value):
        if self.y < 112:
            self.flush()
        y = self.y - 37
        self.command(f"q 0.80 G 0.6 w 37 {y-4} m 394 {y-4} l S Q")
        if value in ("circle", "triangle", "square", "line"):
            for x in (48, 135, 222, 309):
                paths = {
                    "square": "0 0 29 29 re",
                    "triangle": "0 0 m 15 29 l 30 0 l h",
                    "line": "0 0 m 48 26 l",
                    "circle": "15 0 m 35 0 35 30 15 30 c -5 30 -5 0 15 0 c",
                }
                self.command(f"q 1 0 0 1 {x} {y} cm 0.55 G [2 2] 0 d {paths[value]} S Q")
        elif value:
            self.text(value, y, 28, 0, 43, "0.70 0.70 0.70")
        self.y -= 63


def render_pdf(payload):
    title = str(payload["title"])[:120]
    units = payload["units"]
    sources = payload["sources"]
    if not 1 <= len(units) <= 60 or len(sources) > 100:
        raise ValueError("Book is too large.")
    doc = Document()
    doc.command("0.94 0.92 0.85 rg 0 0 432 648 re f")
    live = payload.get("liveProduct") is True
    doc.text(payload.get("format", "Book").upper() if live else "THE KITCHEN FIELD GUIDE", 580, 11, 1)
    y = 517
    for part in textwrap.wrap(title, 20):
        doc.text(part, y, 34, 2)
        y -= 40
    if not live:
        doc.photo_band(115, 222)
        doc.text("General information, not medical advice.", 78, 10)
    doc.flush()
    doc.text("Contents", 576, 32, 2)
    doc.y = 530
    for n, unit in enumerate(units, 1):
        doc.para(f"{n:02}    {unit['title']}", 13)
    doc.para("Source notes", 12)
    doc.flush()
    for n, unit in enumerate(units, 1):
        doc.text(f"{payload.get('format', 'Book').upper()}    /    {n:02}", 601, 9, 1)
        doc.y = 558
        for line in textwrap.wrap(str(unit["title"]), 30):
            doc.text(line, doc.y, 24, 2)
            doc.y -= 29
        if not live:
            doc.photo_band(doc.y - 67, 58)
            doc.y -= 90
        for i, part in enumerate(str(unit["text"]).split("\n\n")):
            chunks = part.splitlines()
            if i == 0 and not live:
                doc.para("THE SHORT VERSION", 10, True)
            if chunks and chunks[0] in (
                "Remember",
                "Try tonight",
                "Safety note",
                "Red flag",
            ):
                if doc.y < 95:
                    doc.flush()
                doc.command(f"0.89 0.91 0.83 rg 31 {doc.y - 5} 370 18 re f")
            for k, line in enumerate(chunks):
                practice = re.fullmatch(r"\[(?:TRACE: ([^\[\]]{1,20})|WRITE)\]", line.strip())
                if live and practice:
                    doc.practice(practice[1] or "")
                    continue
                doc.para(line, 11, k == 0 and len(chunks) > 1)
        doc.flush()
    doc.text("Source notes", 575, 30, 2)
    doc.y = 536
    for i, (name, url) in enumerate(sources, 1):
        if doc.y < 75:
            doc.flush()
        top = doc.y + 12
        doc.para(f"[{i}] {name}", 11, True)
        if urlsplit(url).scheme == "https":
            doc.para(url, 8)
            obj = (
                b"<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect ["
                + f"36 {doc.y} 400 {top}".encode()
                + b"] /A << /S /URI /URI ("
                + literal(url)
                + b") >> >>"
            )
            doc.annotations.append(doc.add(obj))
    return doc.build()
