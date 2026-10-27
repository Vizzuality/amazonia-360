import json
import re
from pathlib import Path
from typing import Any

import pytest
from mcp import Client
from mcp.types import TextContent

from mcp_server.documents.search import (
    PassageOut,
    SearchResult,
    Section,
    TopicList,
)
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.places import Places
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient
from tests.test_places import SNAPSHOT

pytestmark = [pytest.mark.anyio, pytest.mark.usefixtures("fixed_catalogue")]

README = Path(__file__).parents[2] / "README.md"
NAMES = {"list_topics", "search_documents", "get_document_section"}


class FakeDocuments:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.searches: list[tuple[str, str | None, str | None, int]] = []

    async def list_topics(self) -> TopicList:
        return TopicList(topics=[], documents=[])

    async def search(
        self,
        query: str,
        topic: str | None = None,
        place_id: str | None = None,
        limit: int = 8,
    ) -> SearchResult:
        if self.error:
            raise self.error
        self.searches.append((query, topic, place_id, limit))
        return SearchResult(
            passages=[
                PassageOut(
                    document_id="d1",
                    title="Title",
                    authors_year="Doe 2020",
                    section="Intro",
                    origin="text",
                    text="Forest cover fell.",
                )
            ],
            related_documents=[],
        )

    async def section(self, document_id: str, section_path: str) -> Section:
        if self.error:
            raise self.error
        return Section(
            document_id=document_id, title="Title", section=section_path, text="Body."
        )


def server(tmp_path: Path, documents: FakeDocuments | None) -> Any:
    places = Places(SNAPSHOT)
    return create_mcp_server(
        handlers=AreaHandlers(FakeClient(), places=places),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
        places=places,
        documents=documents,  # type: ignore[arg-type]
    )


async def tool_names(client: Client) -> set[str]:
    return {t.name for t in (await client.list_tools()).tools}


async def test_a_server_with_documents_lists_the_three_tools(tmp_path: Path) -> None:
    async with Client(server(tmp_path, FakeDocuments())) as client:
        assert NAMES <= await tool_names(client)
        instructions = client.instructions
    assert instructions is not None
    assert "call search_documents" in instructions
    assert "\n\nDocuments: papers" in instructions


async def test_a_server_without_documents_has_neither(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("DOCS_DATABASE_URL", raising=False)
    monkeypatch.delenv("DOCS_QDRANT_URL", raising=False)
    async with Client(server(tmp_path, None)) as client:
        assert not NAMES & await tool_names(client)
        instructions = client.instructions
    assert instructions is not None
    assert "search_documents" not in instructions


async def test_the_readme_table_lists_the_document_tools(tmp_path: Path) -> None:
    text = README.read_text(encoding="utf-8")
    section = text.split("## Document tools\n", 1)[1].split("\n## ", 1)[0]
    listed = set(re.findall(r"^\| `(\w+)` \|", section, re.MULTILINE))
    async with Client(server(tmp_path, FakeDocuments())) as client:
        docs_tools = NAMES & await tool_names(client)
    assert listed == docs_tools == NAMES


async def test_search_documents_returns_the_structured_result(tmp_path: Path) -> None:
    documents = FakeDocuments()
    async with Client(server(tmp_path, documents)) as client:
        result = await client.call_tool(
            "search_documents", {"query": "forest", "topic": "t1"}
        )
    assert not result.is_error
    assert result.structured_content is not None
    assert result.structured_content["passages"][0]["document_id"] == "d1"
    assert documents.searches == [("forest", "t1", None, 8)]


async def test_a_search_error_is_a_tool_error(tmp_path: Path) -> None:
    documents = FakeDocuments(RuntimeError("qdrant is down"))
    async with Client(server(tmp_path, documents)) as client:
        result = await client.call_tool("search_documents", {"query": "forest"})
    assert result.is_error
    assert isinstance(result.content[0], TextContent)
    assert "qdrant is down" in result.content[0].text
    line = json.loads((tmp_path / "calls.jsonl").read_text().splitlines()[-1])
    assert line["tool"] == "search_documents"
    assert line["ok"] is False


async def test_an_unknown_section_is_a_tool_error_with_its_cause(
    tmp_path: Path,
) -> None:
    documents = FakeDocuments(LookupError("No document has the id 'x'."))
    async with Client(server(tmp_path, documents)) as client:
        result = await client.call_tool(
            "get_document_section", {"document_id": "x", "section_path": "A"}
        )
    assert result.is_error
    assert isinstance(result.content[0], TextContent)
    assert "No document has the id 'x'." in result.content[0].text


async def test_limit_is_bounded(tmp_path: Path) -> None:
    async with Client(server(tmp_path, FakeDocuments())) as client:
        result = await client.call_tool(
            "search_documents", {"query": "forest", "limit": 21}
        )
    assert result.is_error
