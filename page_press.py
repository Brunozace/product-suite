"""The same vector page is used for browser proofing and final PDF output."""

from io import BytesIO
from threading import Lock
from textwrap import wrap

try:
    from reportlab.lib.colors import HexColor
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfbase.pdfmetrics import stringWidth
    from reportlab.pdfgen.canvas import Canvas
except ImportError:
    Canvas = None

from product_pages import TEXT, validate

INK = "#173734"
TEAL = "#247469"
MUTED = "#50645e"
LIGHT = "#d6e2da"
raster_lock = Lock()


def paper(kind):
    return (
        (432, 648) if kind in ("Ebook", "Practical guide", "Cookbook") else (612, 792)
    )


def lines(text, width, font, size):
    output = []
    for para in text.splitlines():
        words = para.split()
        line = ""
        for word in words:
            chunks = [word]
            if stringWidth(word, font, size) > width:
                chunks = wrap(
                    word,
                    max(1, int(len(word) * width / stringWidth(word, font, size)) - 1),
                )
            for chunk in chunks:
                trial = (line + " " + chunk).strip()
                if line and stringWidth(trial, font, size) > width:
                    output.append(line)
                    line = chunk
                else:
                    line = trial
        output.append(line)
    return output


class Sheet:
    def __init__(self, c, size):
        self.c = c
        self.w, self.h = size
        self.x = 42
        self.right = self.w - 42
        self.width = self.right - self.x
        self.y = self.h - 48

    def text(self, text, x, y, size=12, font="Helvetica", color=INK):
        self.c.setFillColor(HexColor(color))
        self.c.setFont(font, size)
        self.c.drawString(x, y, text)

    def paragraph(self, text, size=12, font="Helvetica", indent=0):
        for line in lines(text, self.width - indent, font, size):
            self.text(line, self.x + indent, self.y, size, font)
            self.y -= size * 1.32
        self.y -= 7

    def stroke(self, color=INK, dash=(), weight=1):
        self.c.setStrokeColor(HexColor(color))
        self.c.setLineWidth(weight)
        self.c.setDash(dash)

    def guide(self, y):
        for offset, dash in [(0, ()), (19, (3, 3)), (39, ())]:
            self.stroke("#a4b5ac", dash, 0.7)
            self.c.line(self.x, y + offset, self.right, y + offset)
        self.stroke()

    def shape(self, name, x, y, r):
        c = self.c
        if name == "circle":
            c.circle(x, y, r)
        elif name == "triangle":
            p = c.beginPath()
            p.moveTo(x, y + r)
            p.lineTo(x + r, y - r)
            p.lineTo(x - r, y - r)
            p.close()
            c.drawPath(p)
        else:
            c.rect(x - r, y - r, 2 * r if name == "square" else 2.7 * r, 2 * r)

    def glyph(self, value, x, y):
        c = self.c
        c.saveState()
        self.stroke("#63786c", (1.4, 1.8), 1.15)
        txt = c.beginText(x, y)
        txt.setFont("Helvetica", 54)
        txt.setTextRenderMode(1)
        txt.textOut(value)
        c.drawText(txt)
        c.restoreState()

    def icon(self, name, x, y):
        c = self.c
        self.stroke(TEAL, (), 2)
        if name == "pencil":
            p = c.beginPath()
            p.moveTo(x, y)
            p.lineTo(x + 6, y + 13)
            p.lineTo(x + 36, y + 34)
            p.lineTo(x + 42, y + 26)
            p.lineTo(x + 12, y + 4)
            p.close()
            c.drawPath(p)
            c.line(x + 6, y + 13, x + 12, y + 4)
        elif name == "leaf":
            p = c.beginPath()
            p.moveTo(x, y)
            p.curveTo(x, y + 28, x + 25, y + 34, x + 36, y + 30)
            p.curveTo(x + 34, y + 8, x + 15, y, x, y)
            c.drawPath(p)
            c.line(x, y, x + 28, y + 24)
        elif name == "stars":
            self.star(x + 18, y + 16, 15)
        else:
            self.shape("circle", x + 12, y + 15, 10)
            self.shape("triangle", x + 45, y + 15, 11)

    def star(self, x, y, r):
        from math import sin, cos, pi

        p = self.c.beginPath()
        for i in range(10):
            a = pi / 2 + i * pi / 5
            d = r if i % 2 == 0 else r * 0.45
            (p.moveTo if i == 0 else p.lineTo)(x + d * cos(a), y + d * sin(a))
        p.close()
        self.c.drawPath(p)

    def path(self, v):
        c = self.c
        x = self.x + 10
        end = self.right - 12
        y = self.y - 25
        for i in range(3):
            left = x + i * (end - x) / 3
            right = left + (end - x) / 3 - 22
            start = (left, y)
            stop = (right, y)
            if v == "vertical":
                start = (left + 36, y + 21)
                stop = (left + 36, y - 20)
            if v == "diagonal":
                start = (left, y - 13)
                stop = (right, y + 15)
            p = c.beginPath()
            p.moveTo(*start)
            if v in ("curve", "wave"):
                m = (left + right) / 2
                p.curveTo(left + 12, y + 32, m - 12, y + 32, m, y)
                p.curveTo(
                    m + 12,
                    y - 29,
                    right - 12,
                    y - 29,
                    right,
                    y if v == "wave" else y + 8,
                )
                stop = (right, y if v == "wave" else y + 8)
            elif v == "zigzag":
                for j in range(1, 5):
                    p.lineTo(left + (right - left) * j / 4, y + (18 if j % 2 else 0))
            else:
                p.lineTo(*stop)
            self.stroke("#67796f", (2, 3), 1.3)
            c.drawPath(p)
            self.stroke(TEAL)
            c.setFillColor(HexColor(TEAL))
            c.circle(*start, 3.2, fill=1)
            c.circle(*stop, 3.2)
        self.y -= 85

    def draw(self, b):
        c = self.c
        k = b["type"]
        v = b["value"]
        self.stroke()
        if k in TEXT:
            self.paragraph(
                v,
                17 if k == "heading" else 14 if self.w > 500 else 12,
                "Helvetica-Bold" if k != "paragraph" else "Helvetica",
            )
        elif k == "illustration":
            self.icon(v, self.x, self.y - 32)
            self.y -= 51
        elif k == "tracing_path":
            self.path(v)
        elif k == "shape_practice":
            self.text(v.capitalize(), self.x, self.y - 12, 10, "Helvetica-Bold")
            for i in range(4):
                self.stroke(TEAL if i == 0 else MUTED, () if i == 0 else (2, 3))
                self.shape(
                    v, self.x + 106 + i * (self.width - 150) / 4, self.y - 11, 16
                )
            self.y -= 67
        elif k in ("letter_practice", "number_practice"):
            if k == "number_practice":
                for i in range(int(v)):
                    self.star(self.x + 9 + i * 21, self.y - 4, 6)
                self.y -= 21
            self.guide(self.y - 34)
            for i in range(5):
                x = self.x + 8 + i * self.width / 5
                if i == 0:
                    self.text(v, x, self.y - 34, 54)
                else:
                    self.glyph(v, x, self.y - 34)
            self.y -= 88
        elif k in ("writing_area", "handwriting_grid"):
            for i in range(v):
                self.y -= 43
                if k == "handwriting_grid":
                    self.guide(self.y)
                else:
                    self.stroke(LIGHT)
                    c.line(self.x, self.y, self.right, self.y)
                self.y -= 10
        elif k == "matching":
            self.paragraph("Match the pairs", 13, "Helvetica-Bold")
            for i, name in enumerate(v):
                self.stroke()
                self.shape(name, self.x + 24, self.y - 8, 8)
                self.shape(v[(i + 1) % len(v)], self.right - 24, self.y - 8, 8)
                self.y -= 27
        elif k == "checklist":
            for item in v:
                self.stroke(TEAL)
                c.rect(self.x, self.y - 1, 10, 10)
                self.paragraph(item, 11, indent=20)
        elif k == "table":
            width = self.width / len(v[0])
            for i, row in enumerate(v):
                cells = [lines(s, width - 14, "Helvetica", 10) for s in row]
                height = max(28, 12 * max(map(len, cells)) + 10)
                for j, cell in enumerate(cells):
                    x = self.x + j * width
                    self.stroke(LIGHT)
                    c.setFillColor(HexColor("#e6efea" if not i else "#ffffff"))
                    c.rect(x, self.y - height, width, height, fill=1)
                    for n, s in enumerate(cell):
                        self.text(s, x + 6, self.y - 14 - n * 12, 10)
                self.y -= height
            self.y -= 24

    def content(self, page, kind, index, total, illustration=None):
        validate(page)
        c = self.c
        c.setFillColor(HexColor("#f0f5ed"))
        c.rect(0, self.h - 19, self.w, 19, stroke=0, fill=1)
        self.stroke(TEAL, (), 2)
        c.line(self.x, self.h - 28, self.x + 26, self.h - 28)
        self.text(kind.upper(), self.x, self.y, 9, "Helvetica-Bold", TEAL)
        self.y -= 38
        if illustration:
            width = self.width * 0.32
            height = 96
            top = self.h - 31
            from PIL import Image, ImageOps

            with Image.open(BytesIO(illustration)) as im:
                panel = ImageOps.fit(im.convert("RGB"), (int(width * 3), height * 3))
                c.drawImage(
                    ImageReader(panel), self.right - width, top - height, width, height
                )
            original_width = self.width
            self.width -= width + 16
            self.paragraph(page["title"], 23, "Times-Bold")
            self.width = original_width
            self.y = min(self.y, top - height - 20)
        else:
            self.paragraph(page["title"], 23, "Times-Bold")
        self.y -= 10
        start = self.y
        # Measure the vector body once; scale only if the artwork consumed its free margin.
        form = "body" + str(index)
        c.beginForm(form)
        for b in page["blocks"]:
            self.draw(b)
        c.endForm()
        scale = min(1, (start - 40) / max(1, start - self.y)) if illustration else 1
        if scale < 0.78 or (not illustration and self.y < 40):
            raise ValueError(
                "Content exceeds the print margins. Shorten the page or reduce the number of rows."
            )
        c.saveState()
        c.translate(self.x * (1 - scale), start * (1 - scale))
        c.scale(scale, scale)
        c.doForm(form)
        c.restoreState()
        self.stroke(LIGHT)
        self.c.line(self.x, 32, self.right, 32)
        self.text(f"{index} / {total}", self.x, 18, 9, color=MUTED)

    def cover(self, title, kind, art):
        c = self.c
        w, h = self.w, self.h
        c.setFillColor(HexColor("#f3eedf"))
        c.rect(0, 0, w, h, fill=1, stroke=0)
        split = h * 0.56
        if art:
            from PIL import Image, ImageOps

            with Image.open(BytesIO(art)) as photo:
                panel = ImageOps.fit(
                    photo.convert("RGB"), (round(w * 2), round(split * 2))
                )
                c.drawImage(ImageReader(panel), 0, 0, w, split)
        else:
            c.setFillColor(HexColor("#d0e3d8"))
            c.rect(0, 0, w, split, fill=1, stroke=0)
            for i in range(4):
                self.stroke(TEAL, (), 2)
                self.shape(
                    ("circle", "triangle", "square", "rectangle")[i],
                    w * (0.17 + i * 0.21),
                    split * 0.52,
                    20,
                )
        main, sep, subtitle = title.partition(":")
        self.text(kind.upper(), self.x, h - 46, 10, "Helvetica-Bold", TEAL)
        for size in range(50, 10, -1):
            head = lines(main, self.width, "Times-Bold", size)
            sub = (
                lines(subtitle.strip(), self.width, "Helvetica", max(11, size * 0.43))
                if sep
                else []
            )
            if (
                len(head) * size * 1.32 + len(sub) * max(11, size * 0.43) * 1.32
                < h - split - 100
            ):
                break
        self.y = h - 106
        self.paragraph(main, size, "Times-Bold")
        if sep:
            self.paragraph(subtitle.strip(), max(11, size * 0.43))
        self.stroke(TEAL, (), 2)
        c.line(self.x, split + 19, self.x + 48, split + 19)
        if self.y < split:
            raise ValueError("Cover title exceeds the available print area.")


def pdf_pages(book, art=None, only=None, illustrations=None):
    if Canvas is None:
        raise ValueError(
            "Install the print dependencies with python -m pip install -r requirements.txt."
        )
    out = BytesIO()
    size = paper(book["subtype"])
    c = Canvas(out, pagesize=size, invariant=1, pageCompression=1)
    c.setTitle(book["title"])
    total = len(book["titles"])
    for i in [only] if only is not None else range(total + 1):
        sheet = Sheet(c, size)
        if i == 0:
            sheet.cover(book["title"], book["subtype"], art)
        else:
            image = (illustrations or {}).get(str(i - 1)) or (art if i == 1 else None)
            sheet.content(book["pages"][str(i - 1)], book["subtype"], i, total, image)
        c.showPage()
    c.save()
    return out.getvalue()


def png(data):
    import pypdfium2 as pdfium

    with raster_lock, pdfium.PdfDocument(data) as doc:
        page = doc[0]
        bitmap = page.render(scale=1.65)
        try:
            out = BytesIO()
            bitmap.to_pil().save(out, format="PNG")
            return out.getvalue()
        finally:
            bitmap.close()
            page.close()
