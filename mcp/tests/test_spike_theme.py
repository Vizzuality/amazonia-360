import re
from pathlib import Path

import pytest

from mcp_server import spike_maps

THEME = Path(spike_maps.__file__).parent / "theme.css"
FRONT = Path(__file__).parents[2] / "client" / "src" / "styles" / "globals.css"
# Composed differently on the front end (var(--montserrat) from next/font).
NOT_COPIED = {"--font-sans"}


def declarations(css: str) -> dict[str, str]:
    found = re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", css)
    return {name: " ".join(value.split()) for name, value in found}


@pytest.mark.skipif(not FRONT.exists(), reason="the front end is not checked out")
def test_the_copied_tokens_match_the_front_end() -> None:
    front = declarations(FRONT.read_text())
    copied = declarations(THEME.read_text())
    stale = {
        name: (value, front.get(name))
        for name, value in copied.items()
        if name not in NOT_COPIED and front.get(name) != value
    }
    assert stale == {}
