import ctypes
from itertools import pairwise
from pathlib import Path

import pytest

pytest.importorskip("docling")
import pypdfium2 as pdfium
import pypdfium2.raw as raw
from docling_core.types.doc.base import BoundingBox, CoordOrigin, Size
from docling_core.types.doc.common.reference import ImageRef, ProvenanceItem
from docling_core.types.doc.document import DoclingDocument
from docling_core.types.doc.labels import DocItemLabel
from PIL import Image

from mcp_server.documents.ingest.pdf import (
    ExtractedPdf,
    TileMap,
    _clean_document,
    _extract_figures,
    _needs_ocr,
    _tile_boxes,
    extract_pdf,
)
from mcp_server.documents.models import make_passage_id

FIXTURE = Path(__file__).parent.parent / "fixtures" / "forest-loss.pdf"

TALL_PARAGRAPH = "A paragraph taller than the overlap between two tiles " * 3
SHORT_PARAGRAPH = "Roads open the forest to settlers along the river."


def _add_text_page(pdf: pdfium.PdfDocument, text: str) -> None:
    page = pdf.new_page(595, 842)
    obj = raw.FPDFPageObj_NewTextObj(pdf.raw, b"Helvetica", 12.0)
    encoded = (text + "\0").encode("utf-16-le")
    buffer = ctypes.create_string_buffer(encoded, len(encoded))
    raw.FPDFText_SetText(obj, ctypes.cast(buffer, ctypes.POINTER(raw.FPDF_WCHAR)))
    raw.FPDFPageObj_Transform(obj, 1, 0, 0, 1, 50, 700)
    raw.FPDFPage_InsertObject(page.raw, obj)
    raw.FPDFPage_GenerateContent(page.raw)


def _make_pdf(path: Path, text_pages: int, blank_pages: int) -> Path:
    pdf = pdfium.PdfDocument.new()
    for _ in range(text_pages):
        _add_text_page(pdf, "Forest loss accelerated along the new roads.")
    for _ in range(blank_pages):
        pdf.new_page(595, 842)
    pdf.save(path)
    return path


def test_digital_pdf_needs_no_ocr(tmp_path: Path) -> None:
    assert not _needs_ocr(_make_pdf(tmp_path / "d.pdf", text_pages=9, blank_pages=1))


def test_scanned_pdf_with_a_digital_cover_needs_ocr(tmp_path: Path) -> None:
    assert _needs_ocr(_make_pdf(tmp_path / "d.pdf", text_pages=1, blank_pages=3))


def test_tile_boxes_cover_a_tall_page_with_overlap() -> None:
    boxes = _tile_boxes(100.0, 1000.0)
    assert boxes[0][1] == 1000.0 and boxes[-1][0] == 0.0
    assert all(nxt[1] > prev[0] for prev, nxt in pairwise(boxes))
    assert _tile_boxes(100.0, 150.0) == [(0.0, 150.0)]


def _add(doc: DoclingDocument, page: int, text: str, top: float, bottom: float) -> None:
    box = BoundingBox(l=10, t=top, r=90, b=bottom, coord_origin=CoordOrigin.TOPLEFT)
    prov = ProvenanceItem(page_no=page, bbox=box, charspan=(0, len(text)))
    doc.add_text(label=DocItemLabel.TEXT, text=text, prov=prov)


def _two_tiles() -> DoclingDocument:
    doc = DoclingDocument(name="tiled")
    doc.add_page(page_no=1, size=Size(width=100, height=100))
    doc.add_page(page_no=2, size=Size(width=100, height=100))
    return doc


TILES = TileMap(path=Path("tiled.pdf"), offsets={1: 0.0, 2: 70.0})


def _texts(doc: DoclingDocument) -> list[str]:
    return [item.text for item in doc.texts]


def test_text_cut_in_every_tile_is_kept_once() -> None:
    doc = _two_tiles()
    _add(doc, 1, TALL_PARAGRAPH, top=50, bottom=150)
    _add(doc, 2, TALL_PARAGRAPH, top=-20, bottom=80)
    _clean_document(doc, TILES)
    assert _texts(doc) == [TALL_PARAGRAPH]


def test_cut_copy_is_dropped_when_a_whole_copy_exists() -> None:
    doc = _two_tiles()
    _add(doc, 1, SHORT_PARAGRAPH, top=80, bottom=99)
    _add(doc, 2, SHORT_PARAGRAPH, top=10, bottom=25)
    _clean_document(doc, TILES)
    assert _texts(doc) == [SHORT_PARAGRAPH]


def test_copy_of_another_tile_outside_this_tile_is_dropped() -> None:
    doc = _two_tiles()
    _add(doc, 1, SHORT_PARAGRAPH, top=20, bottom=35)
    _add(doc, 2, "roads open the forest to settlers", top=-50, bottom=-35)
    _clean_document(doc, TILES)
    assert _texts(doc) == [SHORT_PARAGRAPH]


@pytest.fixture(scope="module")
def extracted(tmp_path_factory: pytest.TempPathFactory) -> ExtractedPdf:
    return extract_pdf(FIXTURE, "doc-1", "i1", tmp_path_factory.mktemp("figures"))


@pytest.mark.slow
@pytest.mark.filterwarnings("ignore:`force_full_page_ocr`:DeprecationWarning")
def test_passages_follow_the_sections_and_pages(extracted: ExtractedPdf) -> None:
    by_section = {p.section_path: p for p in extracted.chunks}
    assert {"1. Introduction", "2. Results", "3. Conclusions"} <= set(by_section)
    assert by_section["1. Introduction"].page == 1
    assert by_section["2. Results"].page == 2
    assert "Zone 2 lost the most forest" in by_section["2. Results"].text


@pytest.mark.slow
def test_passages_carry_ids_and_type(extracted: ExtractedPdf) -> None:
    for ordinal, passage in enumerate(extracted.chunks):
        assert passage.passage_id == make_passage_id("doc-1", "i1", ordinal)
        assert (passage.document_id, passage.document_type) == ("doc-1", "pdf")
        assert passage.origin == "text"
        assert passage.section_path in passage.embed_text


@pytest.mark.slow
def test_the_chart_is_extracted_as_a_figure(extracted: ExtractedPdf) -> None:
    [figure] = extracted.figures
    path = Path(figure.image_path)
    assert path.exists() and path.name == f"{figure.figure_id}.png"
    assert (
        figure.image_hash.startswith(figure.figure_id) and len(figure.image_hash) == 64
    )
    assert (figure.width, figure.height) == (605, 405)
    assert figure.page == 1
    assert figure.section_path == "1. Introduction"
    assert "accelerated" in figure.context


def test_an_image_printed_twice_is_one_figure(tmp_path: Path) -> None:
    doc = DoclingDocument(name="repeated")
    doc.add_page(page_no=1, size=Size(width=200, height=200))
    image = ImageRef.from_pil(Image.new("RGB", (80, 80), "green"), dpi=72)
    for top in (10, 110):
        box = BoundingBox(
            l=10, t=top, r=90, b=top + 80, coord_origin=CoordOrigin.TOPLEFT
        )
        prov = ProvenanceItem(page_no=1, bbox=box, charspan=(0, 0))
        doc.add_picture(image=image, prov=prov)
    figures = _extract_figures(doc, None, set(), "doc", tmp_path)
    assert len(figures) == 1
    assert figures[0].page == 1
