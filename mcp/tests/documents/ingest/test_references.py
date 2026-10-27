from pathlib import Path

import pytest
import yaml

from mcp_server.documents.ingest.references import (
    is_citation,
    is_reference_heading,
    reference_blocks,
)
from mcp_server.documents.ingest.sections import Section, sections_to_chunks

FIXTURE = yaml.safe_load(
    (Path(__file__).parents[1] / "fixtures" / "reference-lists.yaml").read_text()
)
CITATIONS: list[str] = FIXTURE["citations"]
BODY: list[str] = FIXTURE["not_citations"]


@pytest.mark.parametrize("text", CITATIONS)
def test_a_reference_list_entry_is_a_citation(text: str) -> None:
    assert is_citation(text)


@pytest.mark.parametrize("text", BODY)
def test_body_text_with_years_and_numbers_is_not_a_citation(text: str) -> None:
    assert not is_citation(text)


@pytest.mark.parametrize(
    "heading",
    [
        "References",
        "REFERENCES",
        "7. References",
        "VI. Bibliography",
        "Literature Cited",
        "Works cited:",
        "Referencias",
        "Referencias bibliográficas",
    ],
)
def test_reference_headings(heading: str) -> None:
    assert is_reference_heading(heading)


@pytest.mark.parametrize(
    "heading",
    ["Author Contributions", "Reference levels of deforestation", "Introduction", ""],
)
def test_other_headings(heading: str) -> None:
    assert not is_reference_heading(heading)


def test_a_run_of_citations_is_dropped_with_a_stray_entry_inside_it() -> None:
    stray = "United Nations Educational, Scientific and Cultural Organization (UNESCO)"
    blocks = [BODY[4], CITATIONS[0], CITATIONS[1], stray, CITATIONS[2], BODY[0]]
    assert reference_blocks(blocks) == {1, 2, 3, 4}


def test_a_page_break_inside_a_reference_list_does_not_end_it() -> None:
    footer, running_head = FIXTURE["page_break"]
    blocks = [CITATIONS[0], CITATIONS[1], footer, running_head, CITATIONS[2]]
    assert reference_blocks(blocks) == {0, 1, 2, 3, 4}


def test_one_or_two_citations_in_body_text_stay() -> None:
    assert reference_blocks([BODY[0], CITATIONS[0], BODY[1], CITATIONS[1]]) == set()
    assert reference_blocks([CITATIONS[0], CITATIONS[5], BODY[2]]) == set()


def test_web_passages_leave_out_reference_sections_and_lists() -> None:
    sections = [
        Section(["Report", "Results"], None, [BODY[7]]),
        Section(["Report", "References"], None, ["Anything at all."]),
        Section(["Report", "Notes"], None, [BODY[1], *CITATIONS[:3]]),
    ]
    passages = sections_to_chunks(sections, "Report", "doc", "web", "i1")
    assert [p.text for p in passages] == [BODY[7], BODY[1]]
