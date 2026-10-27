import hashlib
import io
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import cast

import pypdfium2 as pdfium
import tiktoken
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.transforms.chunker.doc_chunk import DocChunk
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.openai import OpenAITokenizer
from docling_core.types.doc.base import BoundingBox
from docling_core.types.doc.document import DoclingDocument
from docling_core.types.doc.items.node import NodeItem
from docling_core.types.doc.items.picture.picture import PictureItem
from docling_core.types.doc.items.text import SectionHeaderItem, TextItem
from docling_core.types.doc.labels import DocItemLabel

from mcp_server.documents.embedding import DENSE_MODEL
from mcp_server.documents.ingest.references import (
    is_reference_heading,
    reference_blocks,
)
from mcp_server.documents.ingest.sections import FIGURE_CONTEXT_CHARS
from mcp_server.documents.models import Figure, Passage, make_passage_id

TALL_PAGE_RATIO = 2.0
TILE_ASPECT = 1.414
# Large overlap so any figure or paragraph shorter than it is whole in some tile.
TILE_OVERLAP = 0.3
EDGE_MARGIN = 3.0
MIN_FIGURE_SIDE = 30.0
MAX_TOKENS = 512
# Axis and legend labels are a few words; longer text inside a picture region is
# body text that Docling boxed as one picture and must be kept.
MAX_LABEL_WORDS = 5
# Digital PDFs still have a few blank or image-only pages.
MAX_TEXTLESS_SHARE = 0.5


@dataclass
class ExtractedPdf:
    chunks: list[Passage]
    figures: list[Figure]


@dataclass(frozen=True)
class TileMap:
    """Maps each page of a tiled PDF to its vertical offset in the original page."""

    path: Path
    offsets: dict[int, float]


def extract_pdf(
    path: Path,
    document_id: str,
    ingest_id: str,
    figures_dir: Path,
) -> ExtractedPdf:
    with tempfile.TemporaryDirectory() as tmp:
        tiles = normalize_tall_pages(path, Path(tmp) / "normalized.pdf")
        doc = _convert(tiles.path if tiles else path, ocr=_needs_ocr(path))
    _clean_document(doc, tiles)
    skipped = _duplicate_tiled_pictures(doc, tiles) if tiles else set()
    figures = _extract_figures(doc, tiles, skipped, document_id, figures_dir)
    _drop_references(doc)
    chunks = _chunk(doc, document_id, ingest_id, tiled=tiles is not None)
    return ExtractedPdf(chunks=chunks, figures=figures)


def normalize_tall_pages(path: Path, out_path: Path) -> TileMap | None:
    src = pdfium.PdfDocument(path)
    sizes = [src[i].get_size() for i in range(len(src))]
    if not any(h > TALL_PAGE_RATIO * w for w, h in sizes):
        return None
    out = pdfium.PdfDocument.new()
    offsets: dict[int, float] = {}
    for index, (width, height) in enumerate(sizes):
        boxes = _tile_boxes(width, height)
        out.import_pages(src, [index] * len(boxes))
        for bottom, top in boxes:
            page_no = len(offsets) + 1
            page = out[page_no - 1]
            page.set_mediabox(0, bottom, width, top)
            page.set_cropbox(0, bottom, width, top)
            offsets[page_no] = height - top
    out.save(out_path)
    return TileMap(path=out_path, offsets=offsets)


def _tile_boxes(width: float, height: float) -> list[tuple[float, float]]:
    if height <= TALL_PAGE_RATIO * width:
        return [(0.0, height)]
    tile = width * TILE_ASPECT
    step = tile * (1 - TILE_OVERLAP)
    boxes = []
    top = height
    while True:
        bottom = max(0.0, top - tile)
        boxes.append((bottom, top))
        if bottom == 0.0:
            return boxes
        top -= step


def _needs_ocr(path: Path) -> bool:
    """OCR only mostly-scanned PDFs: on digital ones it garbles the text layer."""
    pdf = pdfium.PdfDocument(path)
    textless = sum(pdf[i].get_textpage().count_chars() == 0 for i in range(len(pdf)))
    return textless / len(pdf) > MAX_TEXTLESS_SHARE


def _convert(path: Path, ocr: bool) -> DoclingDocument:
    options = PdfPipelineOptions(
        do_ocr=ocr, generate_picture_images=True, images_scale=2.0
    )
    # pypdfium2 reads Type 3 font text layers that docling-parse misses.
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=options, backend=PyPdfiumDocumentBackend
            )
        }
    )
    return converter.convert(path).document


def _box(doc: DoclingDocument, item: TextItem | PictureItem) -> BoundingBox:
    prov = item.prov[0]
    return prov.bbox.to_top_left_origin(doc.pages[prov.page_no].size.height)


def _page_of(item: TextItem | PictureItem) -> int:
    return item.prov[0].page_no


def _outside_or_cut(doc: DoclingDocument, item: TextItem | PictureItem) -> bool:
    """True when the item leaves the page or touches a tile edge (cut by tiling)."""
    box = _box(doc, item)
    size = doc.pages[_page_of(item)].size
    return (
        box.l < -1
        or box.r > size.width + 1
        or box.t < EDGE_MARGIN
        or box.b > size.height - EDGE_MARGIN
    )


def _cut_and_taller_than_overlap(doc: DoclingDocument, item: TextItem) -> bool:
    """True for text that crosses a tile edge but is too tall to fit whole in the
    overlap band, so no tile holds a complete copy of it."""
    box = _box(doc, item)
    size = doc.pages[_page_of(item)].size
    inside_horizontally = box.l >= -1 and box.r <= size.width + 1
    crosses_edge = box.t < size.height and box.b > 0
    return (
        inside_horizontally and crosses_edge and box.height > size.height * TILE_OVERLAP
    )


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def _clean_document(doc: DoclingDocument, tiles: TileMap | None) -> None:
    """Drop labels inside figures and, for tiled PDFs, tiling artefacts.

    Pictures stay in the document: deleting one would also delete its captions.
    """
    picture_boxes: dict[int, list[BoundingBox]] = {}
    for picture in doc.pictures:
        picture_boxes.setdefault(_page_of(picture), []).append(_box(doc, picture))

    to_delete: list[NodeItem] = []
    seen: dict[int, set[str]] = {}
    kept_tall_keys: set[str] = set()
    for item in doc.texts:
        if not item.prov:
            continue
        page_no = _page_of(item)
        box = _box(doc, item)
        key = _normalize(item.text)
        tiling_copy = False
        if tiles and _outside_or_cut(doc, item):
            # Text shorter than the overlap is whole in the neighbouring tile; taller
            # text is cut in every tile, so exactly one copy of it is kept.
            tall = _cut_and_taller_than_overlap(doc, item)
            tiling_copy = not tall or key in kept_tall_keys
            if not tiling_copy:
                kept_tall_keys.add(key)
        is_label = (
            item.label == DocItemLabel.TEXT
            and len(item.text.split()) <= MAX_LABEL_WORDS
        )
        inside_picture = is_label and any(
            box.intersection_over_self(pb) > 0.8
            for pb in picture_boxes.get(page_no, [])
        )
        if (
            tiling_copy
            or inside_picture
            or (tiles and key in seen.get(page_no - 1, set()))
        ):
            to_delete.append(item)
        else:
            seen.setdefault(page_no, set()).add(key)

    if to_delete:
        doc.delete_items(node_items=to_delete)
    _attach_orphan_captions(doc)
    _lift_instructions_out_of_pictures(doc)


def _attach_orphan_captions(doc: DoclingDocument) -> None:
    """Docling sometimes links a caption as a child but not as a caption, so
    serializers drop it."""
    for picture in doc.pictures:
        linked = {ref.cref for ref in picture.captions}
        for child in picture.children:
            item = child.resolve(doc)
            if (
                isinstance(item, TextItem)
                and item.label == DocItemLabel.CAPTION
                and child.cref not in linked
            ):
                picture.captions.append(child)


def _lift_instructions_out_of_pictures(doc: DoclingDocument) -> None:
    """The chunker skips picture children, so body text Docling nested under
    a picture region would never be indexed. Move it after the picture instead."""
    for picture in doc.pictures:
        lifted = [
            child
            for child in picture.children
            if isinstance(item := child.resolve(doc), TextItem)
            and item.label == DocItemLabel.TEXT
            and len(item.text.split()) > MAX_LABEL_WORDS
        ]
        if not lifted or picture.parent is None:
            continue
        parent = picture.parent.resolve(doc)
        position = next(
            i for i, ref in enumerate(parent.children) if ref.cref == picture.self_ref
        )
        lifted_crefs = {ref.cref for ref in lifted}
        picture.children = [
            ref for ref in picture.children if ref.cref not in lifted_crefs
        ]
        for ref in lifted:
            ref.resolve(doc).parent = picture.parent
        parent.children[position + 1 : position + 1] = lifted


def _duplicate_tiled_pictures(doc: DoclingDocument, tiles: TileMap) -> set[str]:
    kept: list[BoundingBox] = []
    duplicates: set[str] = set()
    for picture in doc.pictures:
        if not picture.prov:
            continue
        box = _box(doc, picture)
        offset = tiles.offsets[_page_of(picture)]
        original = BoundingBox(l=box.l, t=box.t + offset, r=box.r, b=box.b + offset)
        if _outside_or_cut(doc, picture) or any(
            original.intersection_over_union(k) > 0.5 for k in kept
        ):
            duplicates.add(picture.self_ref)
        else:
            kept.append(original)
    return duplicates


def _extract_figures(
    doc: DoclingDocument,
    tiles: TileMap | None,
    skipped: set[str],
    document_id: str,
    figures_dir: Path,
) -> list[Figure]:
    figures_dir.mkdir(parents=True, exist_ok=True)
    section = ""
    section_text: dict[str, list[str]] = {}
    pending: list[tuple[PictureItem, str]] = []
    for item, _level in doc.iterate_items():
        if isinstance(item, SectionHeaderItem):
            section = item.text
        elif isinstance(item, PictureItem) and item.self_ref not in skipped:
            pending.append((item, section))
        elif isinstance(item, TextItem):
            section_text.setdefault(section, []).append(item.text)

    figures: list[Figure] = []
    seen: set[str] = set()
    for picture, section_path in pending:
        box = _box(doc, picture)
        if min(box.width, box.height) < MIN_FIGURE_SIDE:
            continue
        image = picture.get_image(doc)
        if image is None:
            continue
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_hash = hashlib.sha256(buffer.getvalue()).hexdigest()
        figure_id = image_hash[:16]
        # A logo or badge printed on several pages is one figure to review.
        if figure_id in seen:
            continue
        seen.add(figure_id)
        image_path = figures_dir / f"{figure_id}.png"
        image_path.write_bytes(buffer.getvalue())
        figures.append(
            Figure(
                figure_id=figure_id,
                document_id=document_id,
                image_path=str(image_path),
                image_hash=image_hash,
                width=image.width,
                height=image.height,
                section_path=section_path,
                page=None if tiles else _page_of(picture),
                context=" ".join(section_text.get(section_path, []))[
                    :FIGURE_CONTEXT_CHARS
                ],
            )
        )
    return figures


def _drop_references(doc: DoclingDocument) -> None:
    """Remove reference lists: under a references heading, or a run of citations."""
    to_delete: list[NodeItem] = []
    segment: list[TextItem] = []
    in_references = False

    def close_segment() -> None:
        dropped = reference_blocks([item.text for item in segment])
        to_delete.extend(item for i, item in enumerate(segment) if i in dropped)
        segment.clear()

    for item, _level in doc.iterate_items():
        if isinstance(item, SectionHeaderItem):
            close_segment()
            in_references = is_reference_heading(item.text)
            if in_references:
                to_delete.append(item)
        elif isinstance(item, TextItem):
            if in_references:
                to_delete.append(item)
            else:
                segment.append(item)
    close_segment()
    if to_delete:
        doc.delete_items(node_items=to_delete)


def _chunk(
    doc: DoclingDocument,
    document_id: str,
    ingest_id: str,
    tiled: bool,
) -> list[Passage]:
    chunker = HybridChunker(
        tokenizer=OpenAITokenizer(
            tokenizer=tiktoken.encoding_for_model(DENSE_MODEL), max_tokens=MAX_TOKENS
        )
    )
    chunks = []
    for ordinal, base_chunk in enumerate(chunker.chunk(doc)):
        doc_chunk = cast(DocChunk, base_chunk)
        provs = [p for item in doc_chunk.meta.doc_items for p in item.prov]
        chunks.append(
            Passage(
                passage_id=make_passage_id(document_id, ingest_id, ordinal),
                document_id=document_id,
                document_type="pdf",
                ingest_id=ingest_id,
                section_path=" > ".join(doc_chunk.meta.headings or []),
                text=doc_chunk.text,
                embed_text=chunker.contextualize(doc_chunk),
                origin="text",
                page=provs[0].page_no if provs and not tiled else None,
                position=ordinal,
            )
        )
    return chunks
