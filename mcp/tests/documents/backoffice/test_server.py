from pathlib import Path

import pytest

pytest.importorskip("fastapi")

import httpx
from qdrant_client import AsyncQdrantClient

from mcp_server.db import create_engine, session_maker
from mcp_server.documents.backoffice.app import create_backoffice
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.ingest.pipeline import Pipeline
from mcp_server.documents.search import DocumentSearch
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore
from mcp_server.places import load_places

from ..fakes import FakeEmbedder
from ..ingest.conftest import FakeDescriber, FakeSummaryWriter
from .backoffice_env import BASE_URL

pytestmark = pytest.mark.anyio


def client(tmp_path: Path) -> httpx.AsyncClient:
    """No database: these requests never reach the store."""
    settings = DocsSettings(
        database_url="unused", qdrant_url="unused", data_dir=tmp_path / "data"
    )
    store = DocumentStore(
        session_maker(create_engine("postgresql://nobody@127.0.0.1:1/none_test"))
    )
    embedder = FakeEmbedder()
    index = DocumentIndex(AsyncQdrantClient(":memory:"), embedder)
    search = DocumentSearch(store, index, embedder, settings, load_places())
    pipeline = Pipeline(
        store, index, embedder, FakeDescriber(), FakeSummaryWriter(), settings
    )
    settings.uploads_dir.mkdir(parents=True)
    settings.figures_dir.mkdir(parents=True)
    (settings.uploads_dir / "x.pdf").write_bytes(b"%PDF-1.7 report")
    (settings.figures_dir / "f.png").write_bytes(b"\x89PNG figure")
    (settings.data_dir / "settings.py").write_bytes(b"secret")
    app = create_backoffice(settings, store, index, search, pipeline)
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=BASE_URL)


async def test_serves_an_uploaded_pdf(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        response = await c.get("/files/uploads/x.pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content == b"%PDF-1.7 report"


async def test_serves_a_figure_crop(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        response = await c.get("/files/figures/f.png")
    assert response.status_code == 200
    assert response.content == b"\x89PNG figure"


@pytest.mark.parametrize(
    "path",
    [
        "/files/uploads/../settings.py",
        "/files/uploads/..%2Fsettings.py",
        "/files/figures/%2E%2E/settings.py",
        "/files/settings.py",
        "/files/incoming/x.pdf",
        "/files/uploads/missing.pdf",
    ],
)
async def test_nothing_outside_uploads_and_figures_is_served(
    tmp_path: Path, path: str
) -> None:
    async with client(tmp_path) as c:
        response = await c.get(path)
    assert response.status_code == 404
    assert b"secret" not in response.content


async def test_static_files_are_served(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        assert (await c.get("/static/htmx.min.js")).status_code == 200
        assert (await c.get("/static/app.css")).status_code == 200


async def test_a_post_without_origin_is_allowed(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        # Refused by the handler (no name), so it got past the guard.
        response = await c.post("/topics", data={"name": ""})
    assert response.status_code == 422


async def test_a_same_origin_post_is_allowed(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        response = await c.post(
            "/topics",
            data={"name": ""},
            headers={"Origin": BASE_URL, "Sec-Fetch-Site": "same-origin"},
        )
    assert response.status_code == 422


@pytest.mark.parametrize(
    "headers",
    [
        {"Origin": "https://evil.example"},
        {"Origin": "null"},
        {"Origin": "http://localhost:3000"},
        {"Sec-Fetch-Site": "cross-site"},
        {"Sec-Fetch-Site": "same-site"},
    ],
)
async def test_a_cross_site_post_is_refused(
    tmp_path: Path, headers: dict[str, str]
) -> None:
    async with client(tmp_path) as c:
        response = await c.post("/topics/x/delete", headers=headers)
    assert response.status_code == 403


async def test_a_foreign_host_is_refused(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        response = await c.get(
            "/files/figures/f.png", headers={"Host": "evil.example:8770"}
        )
    assert response.status_code == 400


async def test_localhost_is_allowed(tmp_path: Path) -> None:
    async with client(tmp_path) as c:
        response = await c.get(
            "/files/figures/f.png", headers={"Host": "localhost:8770"}
        )
    assert response.status_code == 200
