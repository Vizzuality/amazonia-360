from collections.abc import AsyncIterator
from importlib.util import find_spec
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from .backoffice_env import Backoffice

# The back office is part of the ingest extra; the base install skips it.
collect_ignore_glob = [] if find_spec("fastapi") else ["test_*.py"]


@pytest.fixture
async def bo(clean_docs_database: str, tmp_path: Path) -> AsyncIterator["Backoffice"]:
    from .backoffice_env import build

    backoffice, engine, client = await build(clean_docs_database, tmp_path)
    async with backoffice.client:
        yield backoffice
    await client.close()
    await engine.dispose()
