from dataclasses import replace
from pathlib import Path

from mcp_server.documents.links import document_link, file_url, passage_link
from mcp_server.documents.models import Document, Passage
from mcp_server.documents.settings import DocsSettings

SETTINGS = DocsSettings(
    database_url="x",
    qdrant_url="y",
    public_url="http://127.0.0.1:8770/",
    data_dir=Path("data"),
)
PDF = Document("finer-2008", "pdf", "Finer 2008", "uploads/finer-2008.pdf")
WEB = Document("page", "web", "Page", "https://example.org/report/")
PASSAGE = Passage("p", "finer-2008", "pdf", "i", "Intro", "t", "t", "text")


def test_pdf_passage_links_to_page() -> None:
    assert (
        passage_link(replace(PASSAGE, page=62), PDF, SETTINGS)
        == "http://127.0.0.1:8770/files/uploads/finer-2008.pdf#page=62"
    )


def test_pdf_passage_without_page_links_to_file() -> None:
    assert (
        passage_link(PASSAGE, PDF, SETTINGS)
        == "http://127.0.0.1:8770/files/uploads/finer-2008.pdf"
    )


def test_figure_passage_links_to_crop_whatever_the_data_dir() -> None:
    passage = replace(PASSAGE, origin="figure", figure_path="/abs/figures/abc.png")
    assert (
        passage_link(passage, PDF, SETTINGS)
        == "http://127.0.0.1:8770/files/figures/abc.png"
    )


def test_web_passage_links_to_its_anchor() -> None:
    passage = replace(PASSAGE, anchor="h_water")
    assert passage_link(passage, WEB, SETTINGS) == "https://example.org/report/#h_water"


def test_web_passage_without_anchor_links_to_page() -> None:
    assert passage_link(PASSAGE, WEB, SETTINGS) == "https://example.org/report/"


def test_document_link() -> None:
    assert document_link(WEB, SETTINGS) == "https://example.org/report/"
    assert (
        document_link(PDF, SETTINGS)
        == "http://127.0.0.1:8770/files/uploads/finer-2008.pdf"
    )


def test_file_url_refuses_paths_that_leave_the_files_dir() -> None:
    assert file_url("/etc/passwd", SETTINGS) is None
    assert file_url("../secret", SETTINGS) is None
    assert (
        file_url("figures/a.png", SETTINGS)
        == "http://127.0.0.1:8770/files/figures/a.png"
    )
