from dataclasses import dataclass

from mcp_server.documents.models import DocumentType, Passage, make_passage_id

MAX_WORDS = 300
OVERLAP_WORDS = 50
FIGURE_CONTEXT_CHARS = 1500


@dataclass(frozen=True)
class Section:
    path: list[str]
    anchor: str | None
    blocks: list[str]


def split_words(
    text: str, max_words: int = MAX_WORDS, overlap: int = OVERLAP_WORDS
) -> list[str]:
    words = text.split()
    parts: list[str] = []
    start = 0
    while True:
        parts.append(" ".join(words[start : start + max_words]))
        if start + max_words >= len(words):
            return parts
        start += max_words - overlap


def sections_to_chunks(
    sections: list[Section],
    title: str,
    document_id: str,
    document_type: DocumentType,
    ingest_id: str,
) -> list[Passage]:
    pieces = [
        (section, text) for section in sections for text in _section_texts(section)
    ]
    return [
        Passage(
            passage_id=make_passage_id(document_id, ingest_id, ordinal),
            document_id=document_id,
            document_type=document_type,
            ingest_id=ingest_id,
            section_path=(path := " > ".join(section.path)),
            text=text,
            embed_text=f"{title}\n{path}\n{text}",
            origin="text",
            position=ordinal,
            anchor=section.anchor,
        )
        for ordinal, (section, text) in enumerate(pieces)
    ]


def _section_texts(section: Section) -> list[str]:
    """Blocks are packed whole into passages; only a block over the limit is cut."""
    texts: list[str] = []
    current: list[str] = []
    size = 0
    for block in (b for b in section.blocks if b.strip()):
        words = len(block.split())
        if current and size + words > MAX_WORDS:
            texts.append("\n\n".join(current))
            current, size = [], 0
        if words > MAX_WORDS:
            texts += split_words(block)
            continue
        current.append(block)
        size += words
    if current:
        texts.append("\n\n".join(current))
    return texts
