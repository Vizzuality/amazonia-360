import anyio
import pytest

from mcp_server.documents.models import Document, Figure, Topic
from mcp_server.documents.store import DECORATIVE, INTERRUPTED, DocumentStore

pytestmark = [pytest.mark.db, pytest.mark.anyio]


def doc(id_: str = "d1", **overrides: object) -> Document:
    values: dict[str, object] = {
        "id": id_,
        "type": "pdf",
        "title": "Deforestation in the Napo basin",
        "origin": "uploads/napo.pdf",
    }
    return Document(**{**values, **overrides})  # type: ignore[arg-type]


def fig(
    figure_id: str = "f1",
    description: str = "",
    hash_: str | None = None,
    document_id: str = "d1",
) -> Figure:
    return Figure(
        figure_id=figure_id,
        document_id=document_id,
        image_path=f"figures/{figure_id}.png",
        image_hash=hash_ or figure_id,
        generated_description=description,
    )


YASUNI = Topic("yasuni", "Yasuní", ("Yasuni NP",), "protected_area:Yasuní")
FORESTS = Topic("forests", "Forests")


@pytest.fixture
async def with_doc(store: DocumentStore) -> DocumentStore:
    await store.upsert_document(doc())
    await store.upsert_document(doc("d2"))
    return store


# Topics and documents


async def test_topic_roundtrip_with_aliases_and_place(store: DocumentStore) -> None:
    await store.upsert_topic(YASUNI)
    assert await store.get_topic("yasuni") == YASUNI
    assert await store.get_topic("nope") is None


async def test_upserting_a_topic_replaces_it(store: DocumentStore) -> None:
    await store.upsert_topic(YASUNI)
    await store.upsert_topic(Topic("yasuni", "Yasuní NP"))
    assert await store.list_topics() == [Topic("yasuni", "Yasuní NP", (), None)]


async def test_topics_are_listed_by_id(store: DocumentStore) -> None:
    await store.upsert_topic(YASUNI)
    await store.upsert_topic(FORESTS)
    assert [t.id for t in await store.list_topics()] == ["forests", "yasuni"]


async def test_document_roundtrip_with_topics(store: DocumentStore) -> None:
    await store.upsert_topic(YASUNI)
    await store.upsert_topic(FORESTS)
    document = doc(
        authors_year="Smith 2019",
        summary="About deforestation.",
        summary_status="pending_review",
        topic_ids=("forests", "yasuni"),
    )
    await store.upsert_document(document)
    assert await store.get_document("d1") == document
    assert await store.get_document("nope") is None


async def test_unknown_topic_is_rejected(store: DocumentStore) -> None:
    with pytest.raises(ValueError, match="nope"):
        await store.upsert_document(doc(topic_ids=("nope",)))
    assert await store.get_document("d1") is None


async def test_invalid_type_or_status_is_rejected(store: DocumentStore) -> None:
    with pytest.raises(ValueError):
        await store.upsert_document(doc(type="video"))
    await store.upsert_document(doc())
    with pytest.raises(ValueError):
        await store.set_status("d1", "done")
    with pytest.raises(ValueError):
        await store.set_summary("d1", "text", "maybe")


async def test_status_update_keeps_counts(with_doc: DocumentStore) -> None:
    await with_doc.set_counts("d1", chunks=16, figures=57)
    await with_doc.set_status("d1", "indexed")
    await with_doc.set_status("d1", "error", "boom")
    document = await with_doc.get_document("d1")
    assert document is not None
    assert (document.status, document.error_message, document.chunk_count) == (
        "error",
        "boom",
        16,
    )
    await with_doc.set_status("d1", "indexed")
    document = await with_doc.get_document("d1")
    assert document is not None
    assert (document.error_message, document.figure_count) == ("", 57)


async def test_summary_is_stored_with_its_status(with_doc: DocumentStore) -> None:
    await with_doc.set_summary("d1", "Short text.", "approved")
    document = await with_doc.get_document("d1")
    assert document is not None
    assert (document.summary, document.summary_status) == ("Short text.", "approved")


async def test_set_details_changes_title_and_citation_only(
    with_doc: DocumentStore,
) -> None:
    await with_doc.set_status("d1", "indexed")
    await with_doc.set_details("d1", "Napo roads", "Bass et al. (2010)")
    document = await with_doc.get_document("d1")
    assert document is not None
    assert (document.title, document.authors_year, document.status) == (
        "Napo roads",
        "Bass et al. (2010)",
        "indexed",
    )


async def test_setting_topics_replaces_them(with_doc: DocumentStore) -> None:
    await with_doc.upsert_topic(YASUNI)
    await with_doc.upsert_topic(FORESTS)
    await with_doc.set_document_topics("d1", ["yasuni", "forests"])
    await with_doc.set_document_topics("d1", ["forests"])
    document = await with_doc.get_document("d1")
    assert document is not None
    assert document.topic_ids == ("forests",)


async def test_documents_are_listed_by_topic(with_doc: DocumentStore) -> None:
    await with_doc.upsert_topic(YASUNI)
    await with_doc.set_document_topics("d2", ["yasuni"])
    assert [d.id for d in await with_doc.list_documents()] == ["d1", "d2"]
    assert [d.id for d in await with_doc.list_documents("yasuni")] == ["d2"]
    assert await with_doc.list_documents("forests") == []


async def test_deleting_a_topic_removes_it_from_documents(
    with_doc: DocumentStore,
) -> None:
    await with_doc.upsert_topic(YASUNI)
    await with_doc.upsert_topic(FORESTS)
    await with_doc.set_document_topics("d1", ["yasuni", "forests"])
    await with_doc.delete_topic("yasuni")
    document = await with_doc.get_document("d1")
    assert document is not None
    assert document.topic_ids == ("forests",)


async def test_deleting_a_document_removes_its_figures_and_topic_links(
    with_doc: DocumentStore,
) -> None:
    await with_doc.upsert_topic(FORESTS)
    await with_doc.set_document_topics("d1", ["forests"])
    await with_doc.replace_figures("d1", [fig()])
    await with_doc.delete_document("d1")
    assert await with_doc.get_document("d1") is None
    assert await with_doc.list_figures("d1") == []
    assert await with_doc.list_documents("forests") == []
    assert await with_doc.get_topic("forests") is not None


# Figures


async def test_figures_roundtrip_in_order(with_doc: DocumentStore) -> None:
    figures = [fig("b", "Map"), fig("a", "Chart")]
    await with_doc.replace_figures("d1", figures)
    stored = await with_doc.list_figures("d1")
    assert [f.figure_id for f in stored] == ["b", "a"]
    assert [f.final_description for f in stored] == ["Map", "Chart"]


async def test_decorative_is_discarded(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig(description=DECORATIVE)])
    assert (await with_doc.list_figures("d1"))[0].review_status == "discarded"


async def test_replacing_figures_keeps_approvals_of_unchanged_images(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("f1", hash_="a")])
    await with_doc.review("d1", "f1", "Map of Yasuní", "approved")
    await with_doc.replace_figures("d1", [fig("f1b", hash_="a"), fig("f2", hash_="b")])
    figures = {f.image_hash: f for f in await with_doc.list_figures("d1")}
    assert figures["a"].review_status == "approved"
    assert figures["a"].final_description == "Map of Yasuní"
    assert figures["b"].review_status == "pending_review"


async def test_a_changed_image_loses_its_approval(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig("f1", "Old map", hash_="a")])
    await with_doc.review("d1", "f1", "Reviewed", "approved")
    await with_doc.replace_figures("d1", [fig("f1", "New map", hash_="c")])
    figure = await with_doc.get_figure("d1", "f1")
    assert figure is not None
    assert (figure.review_status, figure.final_description) == (
        "pending_review",
        "New map",
    )


async def test_new_generated_text_does_not_override_a_reviewed_description(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("f1", "old text")])
    await with_doc.review("d1", "f1", "edited by reviewer", "approved")
    await with_doc.replace_figures("d1", [fig("f1", "new generated text")])
    figure = await with_doc.get_figure("d1", "f1")
    assert figure is not None
    assert figure.final_description == "edited by reviewer"
    assert figure.review_status == "approved"
    assert figure.generated_description == "new generated text"


async def test_only_approved_figures_are_returned(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig("a"), fig("b"), fig("c"), fig("d")])
    await with_doc.review("d1", "a", "x", "approved")
    await with_doc.review("d1", "c", None, "discarded")
    await with_doc.review("d1", "d", "  ", "approved")
    assert [f.figure_id for f in await with_doc.approved_figures("d1")] == ["a"]


async def test_auto_discarded_figure_is_reevaluated(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig("a", DECORATIVE)])
    await with_doc.replace_figures("d1", [fig("a", "Three rivers")])
    figure = await with_doc.get_figure("d1", "a")
    assert figure is not None
    assert (figure.review_status, figure.final_description) == (
        "pending_review",
        "Three rivers",
    )


async def test_rerun_keeps_the_description_of_the_same_image(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("a", "Three rivers")])
    await with_doc.replace_figures("d1", [fig("a", "")])
    figure = await with_doc.get_figure("d1", "a")
    assert figure is not None
    assert figure.generated_description == figure.final_description == "Three rivers"
    assert figure.review_status == "pending_review"


async def test_rerun_keeps_auto_discard_of_the_same_image(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("a", DECORATIVE)])
    await with_doc.replace_figures("d1", [fig("a", "")])
    figure = await with_doc.get_figure("d1", "a")
    assert figure is not None
    assert figure.review_status == "discarded"


async def test_rerun_keeps_a_reviewer_edit_of_a_pending_figure(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("a", "Three rivers")])
    await with_doc.review("d1", "a", "Two rivers meet", "pending_review")
    await with_doc.replace_figures("d1", [fig("a", "")])
    figure = await with_doc.get_figure("d1", "a")
    assert figure is not None
    assert figure.final_description == "Two rivers meet"
    assert figure.review_status == "pending_review"


async def test_rerun_drops_figures_no_longer_in_the_document(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("a"), fig("b")])
    await with_doc.replace_figures("d1", [fig("b")])
    assert [f.figure_id for f in await with_doc.list_figures("d1")] == ["b"]


async def test_set_generated_fills_final_unless_edited(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("f1"), fig("f2")])
    await with_doc.review("d1", "f2", "reviewer text", "pending_review")
    await with_doc.set_generated("d1", "f1", "River bend")
    await with_doc.set_generated("d1", "f2", "River bend")
    f1 = await with_doc.get_figure("d1", "f1")
    f2 = await with_doc.get_figure("d1", "f2")
    assert f1 is not None
    assert f2 is not None
    assert f1.final_description == "River bend"
    assert (f2.generated_description, f2.final_description) == (
        "River bend",
        "reviewer text",
    )


async def test_set_generated_decorative_discards(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig("f1")])
    await with_doc.set_generated("d1", "f1", DECORATIVE)
    figure = await with_doc.get_figure("d1", "f1")
    assert figure is not None
    assert figure.review_status == "discarded"


async def test_review_rejects_an_unknown_status(with_doc: DocumentStore) -> None:
    await with_doc.replace_figures("d1", [fig("f1")])
    with pytest.raises(ValueError):
        await with_doc.review("d1", "f1", "x", "maybe")


async def test_unknown_figure_is_an_error(with_doc: DocumentStore) -> None:
    with pytest.raises(KeyError):
        await with_doc.review("d1", "nope", "x", "approved")
    with pytest.raises(KeyError):
        await with_doc.set_ocr("d1", "nope", "x")


async def test_the_same_figure_id_in_two_documents_is_two_rows(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("f1")])
    await with_doc.replace_figures("d2", [fig("f1", document_id="d2")])
    assert len(await with_doc.list_figures("d1")) == 1
    assert len(await with_doc.list_figures("d2")) == 1


async def test_ocr_text_is_none_until_set_and_survives_a_rerun(
    with_doc: DocumentStore,
) -> None:
    await with_doc.replace_figures("d1", [fig("f1")])
    figure = await with_doc.get_figure("d1", "f1")
    assert figure is not None
    assert figure.ocr_text is None
    await with_doc.set_ocr("d1", "f1", "Río Napo | km 12")
    await with_doc.replace_figures("d1", [fig("f1")])
    figure = await with_doc.get_figure("d1", "f1")
    assert figure is not None
    assert figure.ocr_text == "Río Napo | km 12"


# Jobs


async def test_enqueue_coalesces_queued_jobs_of_the_same_kind_and_document(
    store: DocumentStore,
) -> None:
    a = await store.enqueue("index_figures", "d1")
    b = await store.enqueue("index_figures", "d1")
    assert a.id == b.id
    assert len(await store.active_jobs()) == 1


async def test_concurrent_enqueues_of_one_kind_and_document_make_one_job(
    store: DocumentStore,
) -> None:
    ids: list[int] = []

    async def enqueue() -> None:
        ids.append((await store.enqueue("index_figures", "d1")).id)

    async with anyio.create_task_group() as group:
        for _ in range(5):
            group.start_soon(enqueue)
    assert len(set(ids)) == 1
    assert len(await store.active_jobs("d1")) == 1


async def test_enqueue_adds_a_new_job_once_the_previous_is_running(
    store: DocumentStore,
) -> None:
    a = await store.enqueue("index_figures", "d1")
    await store.claim_next()
    assert (await store.enqueue("index_figures", "d1")).id != a.id


async def test_enqueue_rejects_an_unknown_kind(store: DocumentStore) -> None:
    with pytest.raises(ValueError):
        await store.enqueue("bake", "d1")


async def test_enqueue_onto_a_queued_job_takes_the_newer_payload(
    store: DocumentStore,
) -> None:
    first = await store.enqueue("ingest_pdf", "d1", {"path": "a.pdf"})
    second = await store.enqueue("ingest_pdf", "d1", {"path": "b.pdf"})
    assert second.id == first.id
    claimed = await store.claim_next()
    assert claimed is not None
    assert claimed.payload == {"path": "b.pdf"}


async def test_claim_next_is_fifo_and_marks_running(store: DocumentStore) -> None:
    first = await store.enqueue("ingest_pdf", "d1", {"path": "a.pdf"})
    await store.enqueue("index_figures", "d1")
    claimed = await store.claim_next()
    assert claimed is not None
    assert (claimed.id, claimed.status, claimed.payload) == (
        first.id,
        "running",
        {"path": "a.pdf"},
    )
    second = await store.claim_next()
    assert second is not None
    assert second.kind == "index_figures"
    assert await store.claim_next() is None


async def test_two_workers_never_claim_the_same_job(store: DocumentStore) -> None:
    for i in range(6):
        await store.enqueue("index_figures", f"d{i}")
    claimed: list[int] = []

    async def worker() -> None:
        while (job := await store.claim_next()) is not None:
            claimed.append(job.id)

    async with anyio.create_task_group() as group:
        for _ in range(3):
            group.start_soon(worker)
    assert sorted(claimed) == sorted(set(claimed))
    assert len(claimed) == 6


async def test_progress_finish_and_fail_are_recorded(store: DocumentStore) -> None:
    ok = await store.enqueue("describe_figures", "d1")
    bad = await store.enqueue("ingest_pdf", "d1")
    await store.set_progress(ok.id, 3, 10)
    running = await store.get_job(ok.id)
    assert running is not None
    assert (running.progress, running.total) == (3, 10)
    await store.finish(ok.id)
    await store.fail(bad.id, "no text")
    done = await store.get_job(ok.id)
    failed = await store.get_job(bad.id)
    assert done is not None
    assert failed is not None
    assert done.status == "done"
    assert (failed.status, failed.error_message) == ("error", "no text")


async def test_active_jobs_lists_queued_and_running_jobs_of_a_document(
    store: DocumentStore,
) -> None:
    await store.enqueue("ingest_pdf", "d1")
    await store.enqueue("index_figures", "d1")
    await store.enqueue("ingest_pdf", "d2")
    first = await store.claim_next()
    assert first is not None
    await store.finish(first.id)
    assert [j.kind for j in await store.active_jobs("d1")] == ["index_figures"]
    assert len(await store.active_jobs()) == 2


async def test_a_running_job_is_failed_with_the_interrupted_message_on_recovery(
    with_doc: DocumentStore,
) -> None:
    await with_doc.set_status("d1", "processing")
    await with_doc.set_status("d2", "processing")
    await with_doc.enqueue("ingest_pdf", "d1")
    await with_doc.enqueue("ingest_pdf", "d2")
    running = await with_doc.claim_next()
    assert running is not None
    assert await with_doc.recover_interrupted() == 1
    job = await with_doc.get_job(running.id)
    assert job is not None
    assert (job.status, job.error_message) == ("error", INTERRUPTED)
    d1 = await with_doc.get_document("d1")
    d2 = await with_doc.get_document("d2")
    assert d1 is not None
    assert d2 is not None
    assert (d1.status, d1.error_message) == ("error", INTERRUPTED)
    assert d2.status == "processing"
    assert [j.document_id for j in await with_doc.active_jobs()] == ["d2"]


async def test_recovery_leaves_finished_documents_alone(
    with_doc: DocumentStore,
) -> None:
    await with_doc.set_status("d1", "indexed")
    await with_doc.enqueue("index_summary", "d1")
    await with_doc.claim_next()
    assert await with_doc.recover_interrupted() == 1
    document = await with_doc.get_document("d1")
    assert document is not None
    assert document.status == "indexed"


async def test_latest_jobs_holds_the_newest_job_of_each_kind(
    with_doc: DocumentStore,
) -> None:
    first = await with_doc.enqueue("describe_figures", "d1")
    await with_doc.claim_next()
    await with_doc.fail(first.id, "model refused")
    await with_doc.enqueue("write_summary", "d1")
    newer = await with_doc.enqueue("describe_figures", "d1")
    await with_doc.enqueue("ingest_pdf", "d2")
    latest = await with_doc.latest_jobs(["d1"])
    assert set(latest) == {"d1"}
    by_kind = {job.kind: job for job in latest["d1"]}
    assert set(by_kind) == {"describe_figures", "write_summary"}
    assert by_kind["describe_figures"].id == newer.id
    assert await with_doc.latest_jobs([]) == {}
