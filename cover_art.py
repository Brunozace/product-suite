"""Save a completed Higgsfield image as a print-ready JPEG beside the workspace."""
from io import BytesIO
from urllib.parse import urlsplit
from urllib.request import Request, build_opener

from providers import NoRedirect, require


def image_tools():
    try:
        from PIL import Image, ImageOps
    except ImportError:
        raise ValueError("Install Pillow with python -m pip install Pillow to generate ebook covers.") from None
    return Image, ImageOps


def save_cover(url, path):
    require(urlsplit(url).scheme == "https", "Higgsfield returned an invalid image link.")
    Image, ImageOps = image_tools()
    # Only the authenticated job-status response supplies this URL. Never forward API credentials.
    try:
        with build_opener(NoRedirect()).open(Request(url), timeout=40) as stream:
            data = stream.read(16_000_001)
        require(len(data) <= 16_000_000, "Cover image is too large.")
        with Image.open(BytesIO(data)) as image:
            require(image.width * image.height <= 32_000_000, "Cover dimensions are too large.")
            art = ImageOps.fit(ImageOps.exif_transpose(image).convert("RGB"), (1000, 1216))
            temp = path.with_suffix(".tmp")
            art.save(temp, "JPEG", quality=90)
            temp.replace(path)
    except OSError as err:
        raise ValueError("The cover could not be downloaded or saved. Check the existing job again.") from err
