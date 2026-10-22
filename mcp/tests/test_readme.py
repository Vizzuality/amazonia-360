import re
from pathlib import Path

import pytest
from mcp import Client

from mcp_server.handlers.area import AreaHandlers
from mcp_server.measurement.call_log import CallLog
from mcp_server.server import create_mcp_server
from tests.test_handlers import FakeClient

README = Path(__file__).parents[1] / "README.md"


@pytest.mark.anyio
async def test_the_tools_table_lists_every_tool_and_no_other(tmp_path: Path) -> None:
    text = README.read_text(encoding="utf-8")
    section = text.split("## Tools\n", 1)[1].split("\n## ", 1)[0]
    listed = set(re.findall(r"^\| `(\w+)` \|", section, re.MULTILINE))
    server = create_mcp_server(
        handlers=AreaHandlers(FakeClient()),  # type: ignore[arg-type]
        call_log=CallLog(tmp_path / "calls.jsonl"),
    )
    async with Client(server) as client:
        names = {t.name for t in (await client.list_tools()).tools}
    assert listed == names
