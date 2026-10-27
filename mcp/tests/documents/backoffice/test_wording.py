import re
from pathlib import Path

import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.ingest.triage import BUCKETS
from mcp_server.documents.models import Figure, Topic

from .backoffice_env import NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

# The back office is a port: none of the original's vocabulary may show through.
BANNED = re.compile(r"device|manual|gear|synth|studio", re.IGNORECASE)
DOCUMENTS_SRC = Path(__file__).parents[3] / "src" / "mcp_server" / "documents"


async def seed(bo: Backoffice) -> None:
    await bo.store.upsert_topic(Topic("yasuni", "Yasuní", (), "protected_area:Yasuní"))
    await bo.add_pdf(topic_ids=("yasuni",), summary="Roads.", summary_status="none")
    await bo.add_pdf("maap", type="web", origin="https://example.org/r", title="MAAP")
    await bo.add_figures(
        NAPO,
        [
            Figure(
                figure_id=f"f{i}",
                document_id=NAPO,
                image_path=str(bo.settings.figures_dir / f"f{i}.png"),
                image_hash=f"f{i}",
                generated_description=text,
                review_status=status,
                width=side,
                height=side,
                ocr_text="BLOCK 31",
            )
            for i, (text, status, side) in enumerate(
                [
                    ("Map of roads", "pending_review", 800),
                    ("Map of roads", "pending_review", 120),
                    ("", "pending_review", 800),
                    ("Map of roads", "approved", 800),
                    ("Logo", "discarded", 800),
                ]
            )
        ],
    )
    await bo.store.enqueue("describe_figures", NAPO)


async def pages(bo: Backoffice) -> dict[str, str]:
    c = bo.client
    rendered = {
        "/": (await c.get("/")).text,
        "/?topic": (await c.get("/", params={"topic": "yasuni"})).text,
        "/topics": (await c.get("/topics")).text,
        "/document": (await c.get(f"/documents/{NAPO}")).text,
        "/web document": (await c.get("/documents/maap")).text,
        "/document-rows": (await c.get("/document-rows")).text,
        "/ask": (await c.post("/ask", data={"query": "roads"})).text,
        "/ask ambiguous": (
            await c.post("/ask", data={"query": "x", "topic": "y"})
        ).text,
        "upload error": (
            await c.post("/documents/pdf", files={"file": ("a.pdf", b"x")})
        ).text,
        "topic error": (await c.post("/topics", data={"name": " "})).text,
    }
    for bucket in BUCKETS:
        response = await c.get(f"/documents/{NAPO}/figures", params={"bucket": bucket})
        rendered[f"figures {bucket}"] = response.text
    for name, text in rendered.items():
        assert text, name
    return rendered


async def test_no_page_uses_the_vocabulary_of_the_original(bo: Backoffice) -> None:
    await seed(bo)
    bo.qdrant_up = False
    for name, html in (await pages(bo)).items():
        found = BANNED.findall(html)
        assert not found, f"{name}: {found}"


def test_no_source_file_uses_the_vocabulary_of_the_original() -> None:
    offending = [
        f"{path.relative_to(DOCUMENTS_SRC)}: {sorted(set(BANNED.findall(text)))}"
        for path in sorted(DOCUMENTS_SRC.rglob("*"))
        if path.is_file()
        and path.suffix in (".py", ".html", ".css", ".js")
        and BANNED.search(text := path.read_text(encoding="utf-8"))
    ]
    assert offending == []


async def test_every_page_says_when_qdrant_is_down(bo: Backoffice) -> None:
    bo.qdrant_up = False
    for path in ("/", "/topics"):
        html = (await bo.client.get(path)).text
        assert "Qdrant is not running" in html
        assert "docker compose -f docker-compose.docs.yml up -d" in html


async def test_no_notice_while_qdrant_answers(bo: Backoffice) -> None:
    assert "Qdrant is not running" not in (await bo.client.get("/")).text
