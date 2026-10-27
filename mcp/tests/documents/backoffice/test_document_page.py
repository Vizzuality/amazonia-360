import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.models import Topic

from .backoffice_env import NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

YASUNI = Topic("yasuni", "Yasuní")
MINING = Topic("illegal-mining", "Illegal mining")
SECTIONS = {
    "Introduction": "Yasuní holds some of the richest forests on Earth.",
    "Results > Roads": "Roads along the Napo river cleared forest.",
}


async def test_page_groups_passages_by_section_with_page_links(
    bo: Backoffice,
) -> None:
    await bo.add_pdf(sections=SECTIONS, chunk_count=2)
    html = (await bo.client.get(f"/documents/{NAPO}")).text
    assert html.index("Introduction") < html.index("Results &gt; Roads")
    assert "Roads along the Napo river cleared forest." in html
    assert f'href="http://127.0.0.1:8770/files/uploads/{NAPO}.pdf#page=2"' in html
    assert f'href="http://127.0.0.1:8770/files/uploads/{NAPO}.pdf">Open' in html
    assert "PDF, Indexed, 2 passages" in html
    assert "Bass et al. (2010)" in html


async def test_a_web_document_links_to_the_page(bo: Backoffice) -> None:
    await bo.add_pdf("maap", type="web", origin="https://example.org/r")
    html = (await bo.client.get("/documents/maap")).text
    assert 'href="https://example.org/r">Open' in html
    assert "Replace the PDF" not in html


async def test_unknown_document_is_404(bo: Backoffice) -> None:
    assert (await bo.client.get("/documents/nope")).status_code == 404


async def test_saving_details_updates_title_citation_and_topics(
    bo: Backoffice,
) -> None:
    await bo.store.upsert_topic(YASUNI)
    await bo.store.upsert_topic(MINING)
    await bo.add_pdf(topic_ids=("yasuni",))
    response = await bo.client.post(
        f"/documents/{NAPO}",
        data={
            "title": " Napo roads ",
            "authors_year": "Bass (2010)",
            "topic_ids": ["illegal-mining"],
        },
    )
    assert response.headers["HX-Redirect"] == f"/documents/{NAPO}"
    document = await bo.document()
    assert (document.title, document.authors_year, document.topic_ids) == (
        "Napo roads",
        "Bass (2010)",
        ("illegal-mining",),
    )
    assert document.status == "indexed"
    (passage,) = await bo.index.list_document(NAPO)
    assert passage.topic_ids == ("illegal-mining",)


async def test_saving_details_refreshes_an_approved_summary(bo: Backoffice) -> None:
    await bo.add_pdf(summary="About roads.", summary_status="approved")
    await bo.client.post(f"/documents/{NAPO}", data={"title": "Napo roads"})
    assert await bo.jobs() == [("index_summary", "queued")]


@pytest.mark.parametrize(
    ("title", "error"),
    [
        ("   ", "A title can&#39;t be empty."),
        ("x" * 201, "Keep the title under 200 characters."),
    ],
)
async def test_bad_titles_are_refused(bo: Backoffice, title: str, error: str) -> None:
    await bo.add_pdf()
    response = await bo.client.post(f"/documents/{NAPO}", data={"title": title})
    assert response.status_code == 422
    assert error in response.text
    assert (await bo.document()).title == "Forest loss in the Napo basin"


async def test_an_unknown_topic_is_refused(bo: Backoffice) -> None:
    await bo.add_pdf()
    response = await bo.client.post(
        f"/documents/{NAPO}", data={"title": "Napo", "topic_ids": "nope"}
    )
    assert response.status_code == 422
    assert "Unknown topic" in response.text
    assert (await bo.document()).title == "Forest loss in the Napo basin"


async def test_summary_shows_for_review(bo: Backoffice) -> None:
    await bo.add_pdf(
        summary="Forest loss along roads.", summary_status="pending_review"
    )
    html = (await bo.client.get(f"/documents/{NAPO}")).text
    assert "Forest loss along roads." in html
    assert "Waiting for review" in html


async def test_approving_the_summary_queues_its_indexing(bo: Backoffice) -> None:
    await bo.add_pdf(summary="Draft.", summary_status="pending_review")
    response = await bo.client.post(
        f"/documents/{NAPO}/summary",
        data={"text": " Forest loss along roads. ", "approve": "true"},
    )
    assert response.status_code == 200
    assert "Approved" in response.text
    document = await bo.document()
    assert (document.summary, document.summary_status) == (
        "Forest loss along roads.",
        "approved",
    )
    assert await bo.jobs() == [("index_summary", "queued")]
    await bo.worker.run_once()
    related = await bo.index.search_summaries(
        await bo.embedder.embed_query("roads"), None, 5
    )
    assert [d for d, _ in related] == [NAPO]


async def test_saving_keeps_the_summary_waiting_for_review(bo: Backoffice) -> None:
    await bo.add_pdf(summary="Draft.", summary_status="pending_review")
    await bo.client.post(f"/documents/{NAPO}/summary", data={"text": "Edited."})
    document = await bo.document()
    assert (document.summary, document.summary_status) == ("Edited.", "pending_review")
    assert await bo.jobs() == []


async def test_editing_an_approved_summary_takes_it_out_of_search(
    bo: Backoffice,
) -> None:
    await bo.add_pdf(summary="Approved.", summary_status="approved")
    await bo.client.post(f"/documents/{NAPO}/summary", data={"text": "Edited."})
    assert (await bo.document()).summary_status == "pending_review"
    assert await bo.jobs() == [("index_summary", "queued")]


async def test_approving_an_empty_summary_is_refused(bo: Backoffice) -> None:
    await bo.add_pdf(summary="Draft.", summary_status="pending_review")
    response = await bo.client.post(
        f"/documents/{NAPO}/summary", data={"text": "  ", "approve": "true"}
    )
    assert response.status_code == 422
    assert "Write a summary before approving it." in response.text
    assert (await bo.document()).summary == "Draft."
    assert await bo.jobs() == []


async def test_a_pdf_that_was_never_stored_has_no_original_link(
    bo: Backoffice,
) -> None:
    await bo.add_pdf(status="error")
    (bo.settings.uploads_dir / f"{NAPO}.pdf").unlink()
    html = (await bo.client.get(f"/documents/{NAPO}")).text
    assert "Open the original" not in html
