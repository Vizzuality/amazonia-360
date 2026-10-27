import re
from urllib.parse import urlsplit

import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.models import Figure, Topic

from .backoffice_env import BASE_URL, NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

LINK = re.compile(r'<a class="link" href="([^"]+)"')


async def seed(bo: Backoffice) -> None:
    """A PDF with a text passage, an approved figure, and a second document that
    only its summary ties to the question."""
    await bo.store.upsert_topic(Topic("yasuni", "Yasuní", (), "protected_area:Yasuní"))
    await bo.store.upsert_topic(Topic("roads", "Roads"))
    await bo.store.upsert_topic(Topic("road-ecology", "Road ecology"))
    await bo.add_pdf(topic_ids=("yasuni",))
    await bo.add_figures(
        NAPO,
        [
            Figure(
                figure_id="f",
                document_id=NAPO,
                image_path=str(bo.settings.figures_dir / "f.png"),
                image_hash="f",
                section_path="Results",
                page=3,
                generated_description="Map of oil roads in block 31",
                final_description="Map of oil roads in block 31",
                review_status="approved",
            )
        ],
    )
    await bo.store.enqueue("index_figures", NAPO)
    await bo.add_pdf(
        "finer",
        sections={"Methods": "We surveyed concessions."},
        title="Oil and gas in the western Amazon",
        authors_year="Finer et al. (2008)",
        summary="Oil roads open the western Amazon to colonists.",
        summary_status="approved",
    )
    await bo.store.enqueue("index_summary", "finer")
    while await bo.worker.run_once():
        pass


async def ask(bo: Backoffice, **data: str) -> str:
    response = await bo.client.post("/ask", data=data)
    assert response.status_code == 200
    return response.text


async def test_ask_renders_passages_and_related_documents_marked(
    bo: Backoffice,
) -> None:
    await seed(bo)
    html = await ask(bo, query="oil roads Napo river")
    passages = html[html.index("Passages") : html.index("Related documents")]
    related = html[html.index("Related documents") :]
    assert "Roads along the Napo river cleared forest." in passages
    assert "Map of oil roads in block 31" in passages
    assert "figure description" in passages
    assert "Bass et al. (2010)" in passages
    assert "Oil and gas in the western Amazon" in related
    assert "Oil roads open the western Amazon to colonists." in related
    assert "matched by summary" in related
    assert html.count('class="badge kind"') >= 3


async def test_ask_shows_the_response_as_claude_receives_it(bo: Backoffice) -> None:
    await seed(bo)
    expected = await bo.search.search("oil roads Napo river")
    html = await ask(bo, query="oil roads Napo river")
    assert "&#34;related_documents&#34;" in html
    assert len(expected.passages) == html.count('class="hit passage"')
    assert len(expected.related_documents) == html.count('class="hit related"')


async def test_every_link_ask_returns_opens_from_the_back_office(
    bo: Backoffice,
) -> None:
    await seed(bo)
    html = await ask(bo, query="oil roads Napo river")
    links = set(LINK.findall(html))
    paths = {urlsplit(link).path for link in links}
    assert f"/files/uploads/{NAPO}.pdf" in paths
    assert "/files/figures/f.png" in paths
    assert "/files/uploads/finer.pdf" in paths
    for link in links:
        assert link.startswith(BASE_URL)
        response = await bo.client.get(urlsplit(link).path)
        assert response.status_code == 200, link


async def test_ask_restricted_to_a_topic(bo: Backoffice) -> None:
    await seed(bo)
    html = await ask(bo, query="oil roads", topic="yasuni")
    assert "Oil and gas in the western Amazon" not in html
    assert "Roads along the Napo river cleared forest." in html


async def test_ask_by_place_uses_the_topics_tied_to_it(bo: Backoffice) -> None:
    await seed(bo)
    html = await ask(bo, query="oil roads", place_id="protected_area:Yasuní")
    assert "Oil and gas in the western Amazon" not in html


async def test_ask_with_an_ambiguous_topic_lists_the_candidates(
    bo: Backoffice,
) -> None:
    await seed(bo)
    html = await ask(bo, query="oil", topic="road")
    assert "Several topics match" in html
    assert "Roads" in html and "Road ecology" in html


async def test_ask_shows_when_nothing_is_indexed(bo: Backoffice) -> None:
    html = await ask(bo, query="oil")
    assert "No passages." in html
    assert "No related documents." in html


async def test_ask_shows_a_search_failure(bo: Backoffice) -> None:
    async def broken(*args: object, **kwargs: object) -> object:
        raise ConnectionError("Qdrant is not reachable")

    bo.search.search = broken  # type: ignore[method-assign]
    html = await ask(bo, query="oil")
    assert "ConnectionError: Qdrant is not reachable" in html
