from mcp_server.documents.ingest.sections import (
    Section,
    sections_to_chunks,
    split_words,
)
from mcp_server.documents.models import make_passage_id


def test_split_words_overlaps() -> None:
    parts = split_words(" ".join(str(i) for i in range(700)), max_words=300, overlap=50)
    assert [len(p.split()) for p in parts] == [300, 300, 200]
    assert parts[1].split()[0] == "250"


def test_passages_carry_paths_ids_and_embed_text() -> None:
    sections = [
        Section(["causes", "roads"], "h_roads", ["Roads open the forest.", "Then."]),
        Section(["empty"], None, []),
    ]
    passages = sections_to_chunks(sections, "Forest loss", "doc-1", "web", "i1")
    assert len(passages) == 1
    passage = passages[0]
    assert passage.passage_id == make_passage_id("doc-1", "i1", 0)
    assert (passage.document_id, passage.document_type) == ("doc-1", "web")
    assert (passage.ingest_id, passage.origin, passage.position) == ("i1", "text", 0)
    assert passage.section_path == "causes > roads"
    assert passage.anchor == "h_roads"
    assert passage.text == "Roads open the forest.\n\nThen."
    assert passage.embed_text == (
        "Forest loss\ncauses > roads\nRoads open the forest.\n\nThen."
    )


def test_a_sections_paragraphs_stay_together_up_to_the_limit() -> None:
    first = " ".join(["a"] * 200)
    second = " ".join(["b"] * 150)
    short = [first, " ".join(["c"] * 50)]
    sections = [Section(["A"], None, [first, second]), Section(["B"], None, short)]
    passages = sections_to_chunks(sections, "T", "d", "web", "i1")
    assert [p.text for p in passages] == [
        first,
        second,
        "\n\n".join(short),
    ]
    assert [p.position for p in passages] == [0, 1, 2]


def test_an_oversized_block_is_cut_with_overlap() -> None:
    sections = [Section(["A"], None, [" ".join(["w"] * 400)])]
    passages = sections_to_chunks(sections, "T", "d", "pdf", "i1")
    assert [len(p.text.split()) for p in passages] == [300, 150]
    assert all(p.document_type == "pdf" for p in passages)
