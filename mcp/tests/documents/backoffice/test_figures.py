import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.models import Figure

from .backoffice_env import NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

URL = f"/documents/{NAPO}/figures"


def figure(
    bo: Backoffice,
    figure_id: str,
    generated: str = "Ring of oil platforms",
    **values: object,
) -> Figure:
    fields: dict[str, object] = {
        "figure_id": figure_id,
        "document_id": NAPO,
        "image_path": str(bo.settings.figures_dir / f"{figure_id}.png"),
        "image_hash": figure_id,
        "section_path": "Results",
        "generated_description": generated,
        "width": 800,
        "height": 400,
        **values,
    }
    return Figure(**fields)  # type: ignore[arg-type]


@pytest.fixture
async def with_figures(bo: Backoffice) -> Backoffice:
    await bo.add_pdf()
    await bo.add_figures(
        NAPO,
        [
            figure(bo, "big"),
            figure(bo, "big2"),
            figure(bo, "tiny", width=210, height=102),
            figure(bo, "cov", "Roads cleared forest", context="Roads cleared forest"),
            figure(bo, "blank", ""),
            figure(bo, "done", "Three blocks"),
            figure(bo, "gone", "Logo"),
        ],
    )
    await bo.store.review(NAPO, "done", None, "approved")
    await bo.store.review(NAPO, "gone", None, "discarded")
    return bo


async def statuses(bo: Backoffice) -> dict[str, str]:
    return {f.figure_id: f.review_status for f in await bo.store.list_figures(NAPO)}


async def test_default_tab_is_needs_review_and_counts_every_bucket(
    with_figures: Backoffice,
) -> None:
    html = (await with_figures.client.get(URL)).text
    for label, count in (
        ("Needs review", 2),
        ("Covered by text", 1),
        ("Small (icons, screens)", 1),
        ("Not described yet", 1),
        ("Approved", 1),
        ("Discarded", 1),
    ):
        assert f"{label} ({count})" in html
    assert "/files/figures/big.png" in html
    assert "/files/figures/tiny.png" not in html


async def test_tab_shows_only_its_bucket(with_figures: Backoffice) -> None:
    html = (await with_figures.client.get(URL, params={"bucket": "small"})).text
    assert "/files/figures/tiny.png" in html
    assert "/files/figures/big.png" not in html


async def test_unknown_bucket_is_400(with_figures: Backoffice) -> None:
    response = await with_figures.client.get(URL, params={"bucket": "maybe"})
    assert response.status_code == 400


async def test_approve_with_edit_stores_text_and_queues_indexing(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    response = await bo.client.post(
        f"{URL}/big", data={"action": "approve", "description": "Oil block 31"}
    )
    assert "Moved to Approved" in response.text
    f = await bo.store.get_figure(NAPO, "big")
    assert f is not None
    assert (f.review_status, f.final_description) == ("approved", "Oil block 31")
    assert await bo.jobs() == [("index_figures", "queued")]


async def test_discarding_a_pending_figure_does_not_queue_indexing(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    await bo.client.post(f"{URL}/big", data={"action": "discard", "description": "x"})
    assert (await statuses(bo))["big"] == "discarded"
    assert await bo.jobs() == []


async def test_discarding_an_approved_figure_queues_indexing(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    await bo.client.post(f"{URL}/done", data={"action": "discard", "description": "x"})
    assert (await statuses(bo))["done"] == "discarded"
    assert await bo.jobs() == [("index_figures", "queued")]


async def test_reset_restores_the_generated_description(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    await bo.client.post(
        f"{URL}/big", data={"action": "approve", "description": "edited"}
    )
    await bo.client.post(f"{URL}/big", data={"action": "reset", "description": "x"})
    f = await bo.store.get_figure(NAPO, "big")
    assert f is not None
    assert (f.review_status, f.final_description) == (
        "pending_review",
        "Ring of oil platforms",
    )


async def test_unknown_action_is_400(with_figures: Backoffice) -> None:
    response = await with_figures.client.post(f"{URL}/big", data={"action": "bake"})
    assert response.status_code == 400


async def test_bulk_acts_only_on_the_current_bucket(with_figures: Backoffice) -> None:
    bo = with_figures
    response = await bo.client.post(
        f"{URL}/bulk",
        data={"bucket": "small", "action": "discard", "figure_ids": "tiny"},
    )
    assert response.headers["HX-Redirect"] == f"{URL}?bucket=small"
    assert await statuses(bo) == {
        "big": "pending_review",
        "big2": "pending_review",
        "tiny": "discarded",
        "cov": "pending_review",
        "blank": "pending_review",
        "done": "approved",
        "gone": "discarded",
    }
    assert await bo.jobs() == []


async def test_bulk_approve_queues_indexing_once(with_figures: Backoffice) -> None:
    bo = with_figures
    await bo.client.post(
        f"{URL}/bulk",
        data={"bucket": "needs_review", "action": "approve", "figure_ids": "big,big2"},
    )
    current = await statuses(bo)
    assert current["big"] == current["big2"] == "approved"
    assert await bo.jobs() == [("index_figures", "queued")]


@pytest.mark.parametrize("bucket", ["approved", "discarded", "undescribed"])
async def test_bulk_on_a_final_or_undescribed_bucket_is_refused(
    with_figures: Backoffice, bucket: str
) -> None:
    response = await with_figures.client.post(
        f"{URL}/bulk", data={"bucket": bucket, "action": "approve", "figure_ids": "x"}
    )
    assert response.status_code == 400


async def test_bulk_acts_only_on_the_figures_that_were_shown(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    await bo.client.post(
        f"{URL}/bulk",
        data={"bucket": "needs_review", "action": "approve", "figure_ids": "big"},
    )
    current = await statuses(bo)
    assert (current["big"], current["big2"]) == ("approved", "pending_review")


async def test_bulk_without_figure_ids_is_refused(with_figures: Backoffice) -> None:
    response = await with_figures.client.post(
        f"{URL}/bulk", data={"bucket": "needs_review", "action": "approve"}
    )
    assert response.status_code == 400


async def test_bulk_buttons_carry_the_shown_ids(with_figures: Backoffice) -> None:
    assert '"figure_ids": "big,big2"' in (await with_figures.client.get(URL)).text


async def test_unknown_figure_is_404(with_figures: Backoffice) -> None:
    response = await with_figures.client.post(f"{URL}/nope", data={"action": "approve"})
    assert response.status_code == 404


async def test_figures_of_an_unknown_document_are_404(bo: Backoffice) -> None:
    assert (await bo.client.get("/documents/nope/figures")).status_code == 404


async def test_approving_an_empty_description_is_refused(
    with_figures: Backoffice,
) -> None:
    bo = with_figures
    response = await bo.client.post(
        f"{URL}/blank", data={"action": "approve", "description": "  "}
    )
    assert response.status_code == 422
    assert "Write a description" in response.text
    assert (await statuses(bo))["blank"] == "pending_review"
    assert await bo.jobs() == []


async def test_figure_card_shows_text_found_by_ocr(with_figures: Backoffice) -> None:
    bo = with_figures
    await bo.store.set_ocr(NAPO, "big", "BLOCK 31 | <ITT>")
    html = (await bo.client.get(URL)).text
    assert "Text found in the figure" in html
    assert "BLOCK 31 | &lt;ITT&gt;" in html


async def test_figure_card_without_ocr_text_has_no_ocr_block(
    with_figures: Backoffice,
) -> None:
    assert "Text found in the figure" not in (await with_figures.client.get(URL)).text
