import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.models import Topic

from .backoffice_env import NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

YASUNI = Topic("yasuni", "Yasuní", ("Yasuni NP",), "protected_area:Yasuní")
NEW_TOPIC = {
    "id": "oil-and-gas",
    "name": "Oil and gas",
    "aliases": "oil, petróleo, ",
    "place_id": "",
}


async def test_topics_page_lists_topics_with_their_place_and_documents(
    bo: Backoffice,
) -> None:
    await bo.store.upsert_topic(YASUNI)
    await bo.add_pdf(topic_ids=("yasuni",))
    html = (await bo.client.get("/topics")).text
    assert 'value="Yasuni NP"' in html
    assert 'value="protected_area:Yasuní"' in html
    assert "Parque Nacional Yasuní" in html
    assert "1 document" in html


async def test_create_a_topic(bo: Backoffice) -> None:
    response = await bo.client.post("/topics", data=NEW_TOPIC)
    assert response.headers["HX-Redirect"] == "/topics"
    assert await bo.store.get_topic("oil-and-gas") == Topic(
        "oil-and-gas", "Oil and gas", ("oil", "petróleo"), None
    )


async def test_a_topic_without_id_takes_one_from_its_name(bo: Backoffice) -> None:
    await bo.client.post("/topics", data={**NEW_TOPIC, "id": ""})
    assert await bo.store.get_topic("oil-and-gas") is not None


async def test_a_topic_tied_to_a_place_of_the_module(bo: Backoffice) -> None:
    response = await bo.client.post(
        "/topics", data={**NEW_TOPIC, "place_id": " protected_area:Yasuní "}
    )
    assert response.headers["HX-Redirect"] == "/topics"
    topic = await bo.store.get_topic("oil-and-gas")
    assert topic is not None
    assert topic.place_id == "protected_area:Yasuní"


async def test_an_unknown_place_is_refused_with_the_reason(bo: Backoffice) -> None:
    response = await bo.client.post(
        "/topics", data={**NEW_TOPIC, "place_id": "province:Atlantis"}
    )
    assert response.status_code == 422
    assert "No place of the Ecuador module has the id" in response.text
    assert "province:Atlantis" in response.text
    assert await bo.store.list_topics() == []


@pytest.mark.parametrize(
    ("values", "error"),
    [
        ({"id": "Oil Gas"}, "Invalid topic id"),
        ({"name": "  "}, "A topic needs a name."),
    ],
)
async def test_invalid_topics_are_refused(
    bo: Backoffice, values: dict[str, str], error: str
) -> None:
    response = await bo.client.post("/topics", data={**NEW_TOPIC, **values})
    assert response.status_code == 422
    assert error in response.text
    assert await bo.store.list_topics() == []


async def test_an_existing_id_is_refused(bo: Backoffice) -> None:
    await bo.store.upsert_topic(YASUNI)
    response = await bo.client.post("/topics", data={**NEW_TOPIC, "id": "yasuni"})
    assert response.status_code == 422
    assert "already exists" in response.text
    assert await bo.store.get_topic("yasuni") == YASUNI


async def test_edit_a_topic(bo: Backoffice) -> None:
    await bo.store.upsert_topic(YASUNI)
    response = await bo.client.post(
        "/topics/yasuni",
        data={"name": "Yasuní National Park", "aliases": "", "place_id": ""},
    )
    assert response.headers["HX-Redirect"] == "/topics"
    assert await bo.store.get_topic("yasuni") == Topic(
        "yasuni", "Yasuní National Park", (), None
    )


async def test_editing_with_an_unknown_place_is_refused(bo: Backoffice) -> None:
    await bo.store.upsert_topic(YASUNI)
    response = await bo.client.post(
        "/topics/yasuni", data={"name": "Yasuní", "place_id": "nowhere"}
    )
    assert response.status_code == 422
    assert "No place of the Ecuador module has the id" in response.text
    assert await bo.store.get_topic("yasuni") == YASUNI


async def test_editing_an_unknown_topic_is_404(bo: Backoffice) -> None:
    response = await bo.client.post("/topics/nope", data={"name": "x"})
    assert response.status_code == 404


async def test_deleting_a_topic_takes_it_off_its_documents_and_their_passages(
    bo: Backoffice,
) -> None:
    await bo.store.upsert_topic(YASUNI)
    await bo.store.upsert_topic(Topic("roads", "Roads"))
    await bo.add_pdf(topic_ids=("roads", "yasuni"))
    response = await bo.client.post("/topics/yasuni/delete")
    assert response.headers["HX-Redirect"] == "/topics"
    assert await bo.store.get_topic("yasuni") is None
    assert (await bo.document()).topic_ids == ("roads",)
    (passage,) = await bo.index.list_document(NAPO)
    assert passage.topic_ids == ("roads",)


async def test_deleting_an_unknown_topic_is_404(bo: Backoffice) -> None:
    assert (await bo.client.post("/topics/nope/delete")).status_code == 404
