from pathlib import Path

import pytest

pytest.importorskip("rapidocr")
from PIL import Image, ImageDraw, ImageFont

from mcp_server.documents.ingest.ocr import FigureOcr

pytestmark = pytest.mark.slow


@pytest.fixture(scope="module")
def ocr() -> FigureOcr:
    return FigureOcr()


def test_ocr_reads_printed_label(ocr: FigureOcr, tmp_path: Path) -> None:
    path = tmp_path / "label.png"
    image = Image.new("RGB", (400, 160), "white")
    ImageDraw.Draw(image).text(
        (40, 40), "ZONE", fill="black", font=ImageFont.load_default(size=64)
    )
    image.save(path)
    assert "ZONE" in ocr.read(str(path))


def test_ocr_of_missing_image_is_empty(ocr: FigureOcr, tmp_path: Path) -> None:
    assert ocr.read(str(tmp_path / "gone.png")) == ""


def test_ocr_of_unreadable_image_is_empty(ocr: FigureOcr, tmp_path: Path) -> None:
    path = tmp_path / "broken.png"
    path.write_bytes(b"not an image")
    assert ocr.read(str(path)) == ""


def test_ocr_of_blank_image_is_empty(ocr: FigureOcr, tmp_path: Path) -> None:
    path = tmp_path / "blank.png"
    Image.new("RGB", (200, 100), "white").save(path)
    assert ocr.read(str(path)) == ""
