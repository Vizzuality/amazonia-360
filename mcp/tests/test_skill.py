import re
from pathlib import Path

import pytest
from mcp import Client

from mcp_server.catalogue import load_curated
from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient

SKILL = Path(__file__).parents[1] / "skills" / "amazonia360" / "SKILL.md"


def test_frontmatter_names_the_skill_and_says_when_to_use_it() -> None:
    text = SKILL.read_text(encoding="utf-8")
    match = re.match(r"---\n(.*?)\n---\n", text, re.DOTALL)
    assert match is not None
    front = match.group(1)
    assert re.search(r"^name: amazonia360$", front, re.MULTILINE)
    assert re.search(r"^description: .{40,}", front, re.MULTILINE)


@pytest.mark.anyio
async def test_the_skill_names_every_tool(tmp_path: Path) -> None:
    text = SKILL.read_text(encoding="utf-8")
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    async with Client(server) as client:
        names = {t.name for t in (await client.list_tools()).tools}
    missing = {n for n in names if f"`{n}`" not in text}
    assert not missing


def test_every_indicator_the_skill_names_can_be_answered() -> None:
    text = SKILL.read_text(encoding="utf-8")
    answerable = {
        i["id"] for i in load_curated()["indicators"] if i.get("ai_answerable")
    }
    named = {int(n) for n in re.findall(r"\((\d{1,3})\)", text)}
    assert named, "the skill names no indicator"
    assert named <= answerable, named - answerable
