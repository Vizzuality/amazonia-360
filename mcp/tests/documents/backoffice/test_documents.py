from pathlib import Path

import pytest

pytest.importorskip("fastapi")

from mcp_server.documents.ingest.pipeline import incoming_dir
from mcp_server.documents.models import Figure, Topic

from .backoffice_env import NAPO, Backoffice

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]

PDF = b"%PDF-1.7 new report"
YASUNI = Topic("yasuni", "Yasuní", ("Yasuni NP",), "protected_area:Yasuní")
MINING = Topic("illegal-mining", "Illegal mining")


async def with_topics(bo: Backoffice) -> None:
    await bo.store.upsert_topic(YASUNI)
    await bo.store.upsert_topic(MINING)


def figure(figure_id: str, bo: Backoffice) -> Figure:
    return Figure(
        figure_id=figure_id,
        document_id=NAPO,
        image_path=str(bo.settings.figures_dir / f"{figure_id}.png"),
        image_hash=figure_id,
        generated_description="Map of roads",
        width=800,
        height=400,
    )


def queued_uploads(bo: Backoffice) -> list[Path]:
    incoming = incoming_dir(bo.settings)
    return sorted(incoming.iterdir()) if incoming.is_dir() else []


async def test_all_documents_lists_every_document(bo: Backoffice) -> None:
    await with_topics(bo)
    await bo.add_pdf(chunk_count=12, topic_ids=("yasuni",))
    await bo.add_pdf("finer", title="Oil and gas in the western Amazon")
    html = (await bo.client.get("/")).text
    assert "Forest loss in the Napo basin" in html
    assert "Oil and gas in the western Amazon" in html
    assert "Text: searchable, 12 passages" in html
    assert 'class="led indexed"' in html


async def test_a_topic_lists_only_its_documents(bo: Backoffice) -> None:
    await with_topics(bo)
    await bo.add_pdf(topic_ids=("yasuni",))
    await bo.add_pdf("finer", title="Oil and gas in the western Amazon")
    html = (await bo.client.get("/", params={"topic": "yasuni"})).text
    assert "Forest loss in the Napo basin" in html
    assert "Oil and gas in the western Amazon" not in html
    assert "also known as Yasuni NP" in html


async def test_an_unknown_topic_is_404(bo: Backoffice) -> None:
    assert (await bo.client.get("/", params={"topic": "nope"})).status_code == 404


async def test_sidebar_lists_all_documents_and_topics_with_counts(
    bo: Backoffice,
) -> None:
    await with_topics(bo)
    await bo.add_pdf(topic_ids=("yasuni",))
    page = (await bo.client.get("/", params={"topic": "yasuni"})).text
    sidebar = page[page.index('id="sidebar"') : page.index("</nav>")]
    assert sidebar.index("All documents") < sidebar.index("Illegal mining")
    assert sidebar.index("Illegal mining") < sidebar.index("Yasuní")
    assert 'href="/?topic=yasuni" aria-current="page"' in sidebar
    assert "Yasuní <small>1</small>" in sidebar


async def test_upload_creates_the_document_and_queues_its_ingest(
    bo: Backoffice,
) -> None:
    await with_topics(bo)
    response = await bo.client.post(
        "/documents/pdf",
        files={"file": ("napo.pdf", PDF)},
        data={
            "title": "Roads and forest loss in the Napo basin",
            "authors_year": "Bass et al. (2010)",
            "topic_ids": ["yasuni", "illegal-mining"],
        },
    )
    assert response.status_code == 200
    document = await bo.document("roads-and-forest-loss-in-the-napo-basin")
    assert (document.type, document.status, document.authors_year) == (
        "pdf",
        "pending",
        "Bass et al. (2010)",
    )
    assert document.origin == f"uploads/{document.id}.pdf"
    assert document.topic_ids == ("illegal-mining", "yasuni")
    (job,) = await bo.store.active_jobs(document.id)
    assert job.kind == "ingest_pdf"
    upload = Path(job.payload["path"])
    assert upload.parent == incoming_dir(bo.settings)
    assert upload.read_bytes() == PDF
    assert "Roads and forest loss in the Napo basin" in response.text


async def test_an_upload_without_title_is_named_after_the_file(
    bo: Backoffice,
) -> None:
    await bo.client.post("/documents/pdf", files={"file": ("Finer 2008.pdf", PDF)})
    assert (await bo.document("finer-2008")).title == "Finer 2008"


async def test_two_uploads_with_the_same_title_get_different_ids(
    bo: Backoffice,
) -> None:
    for _ in range(2):
        await bo.client.post(
            "/documents/pdf", files={"file": ("a.pdf", PDF)}, data={"title": "Napo"}
        )
    assert [d.id for d in await bo.store.list_documents()] == ["napo", "napo-2"]


async def test_upload_rejects_a_file_that_is_not_a_pdf(bo: Backoffice) -> None:
    response = await bo.client.post(
        "/documents/pdf", files={"file": ("napo.pdf", b"hello")}
    )
    assert response.status_code == 422
    assert "Not a PDF" in response.text
    assert await bo.store.list_documents() == []
    assert queued_uploads(bo) == []


async def test_upload_with_an_unknown_topic_is_refused(bo: Backoffice) -> None:
    response = await bo.client.post(
        "/documents/pdf",
        files={"file": ("napo.pdf", PDF)},
        data={"topic_ids": ["nope"]},
    )
    assert response.status_code == 422
    assert "Unknown topic" in response.text
    assert await bo.store.list_documents() == []
    assert queued_uploads(bo) == []


async def test_add_a_web_report(bo: Backoffice) -> None:
    await with_topics(bo)
    url = "https://www.maaproject.org/2026/yasuni-roads/"
    response = await bo.client.post(
        "/documents/web",
        data={"url": f" {url} ", "authors_year": "MAAP (2026)", "topic_ids": "yasuni"},
    )
    assert response.status_code == 200
    (document,) = await bo.store.list_documents()
    assert (document.id, document.type, document.origin, document.title) == (
        "www-maaproject-org-2026-yasuni-roads",
        "web",
        url,
        "",
    )
    assert document.topic_ids == ("yasuni",)
    assert await bo.jobs(document.id) == [("ingest_web", "queued")]


@pytest.mark.parametrize("url", ["", "ftp://example.org/x", "example.org/report"])
async def test_a_web_address_that_is_not_http_is_refused(
    bo: Backoffice, url: str
) -> None:
    response = await bo.client.post("/documents/web", data={"url": url})
    assert response.status_code == 422
    assert "Not a web address" in response.text
    assert await bo.store.list_documents() == []


async def test_the_same_web_page_is_not_added_twice(bo: Backoffice) -> None:
    url = "https://example.org/report"
    await bo.client.post("/documents/web", data={"url": url, "title": "Report"})
    response = await bo.client.post("/documents/web", data={"url": url})
    assert response.status_code == 422
    assert "already added as Report" in response.text
    assert len(await bo.store.list_documents()) == 1


async def test_rows_poll_only_while_jobs_are_active(bo: Backoffice) -> None:
    await bo.add_pdf()
    assert "every 2s" not in (await bo.client.get("/document-rows")).text
    await bo.store.enqueue("describe_figures", NAPO)
    assert "every 2s" in (await bo.client.get("/document-rows")).text


async def test_polling_keeps_the_topic_and_leaves_the_forms_alone(
    bo: Backoffice,
) -> None:
    await with_topics(bo)
    await bo.add_pdf(topic_ids=("yasuni",))
    await bo.store.enqueue("describe_figures", NAPO)
    html = (await bo.client.get("/", params={"topic": "yasuni"})).text
    rows = html[html.index('id="document-rows"') :]
    rows = rows[: rows.index("</div><!-- document-rows -->")]
    assert 'hx-get="/document-rows?topic=yasuni"' in rows
    assert 'name="url"' not in rows and 'name="file"' not in rows
    polled = (await bo.client.get("/document-rows", params={"topic": "yasuni"})).text
    assert "every 2s" in polled and 'name="url"' not in polled


async def test_rows_show_progress_and_the_errors_of_each_job_kind(
    bo: Backoffice,
) -> None:
    await bo.add_pdf()
    describe = await bo.store.enqueue("describe_figures", NAPO)
    await bo.store.claim_next()
    await bo.store.set_progress(describe.id, 12, 31)
    assert "Describing figures 12/31" in (await bo.client.get("/document-rows")).text
    await bo.store.fail(describe.id, "The model refused the image")
    summary = await bo.store.enqueue("write_summary", NAPO)
    await bo.store.claim_next()
    await bo.store.finish(summary.id)
    html = (await bo.client.get("/document-rows")).text
    assert "Describing figures failed: The model refused the image" in html


async def test_rows_count_figures_by_review_state(bo: Backoffice) -> None:
    await bo.add_pdf()
    await bo.add_figures(NAPO, [figure(f, bo) for f in ("a", "b", "c")])
    await bo.store.review(NAPO, "a", None, "approved")
    html = (await bo.client.get("/document-rows")).text
    assert "Figures: 1 searchable, 2 waiting for review" in html
    assert f'href="/documents/{NAPO}/figures"' in html


async def test_rows_say_what_is_searchable(bo: Backoffice) -> None:
    await bo.add_pdf()
    html = (await bo.client.get("/document-rows")).text
    assert "Text: searchable" in html
    assert "Summary: not written yet" in html
    await bo.store.set_summary(NAPO, "Oil roads in Yasuní.", "pending_review")
    html = (await bo.client.get("/document-rows")).text
    assert "Summary: waiting for review" in html


async def test_rerun_a_pdf_ingests_the_stored_file(bo: Backoffice) -> None:
    await bo.add_pdf()
    response = await bo.client.post(f"/documents/{NAPO}/rerun")
    assert response.status_code == 200
    (job,) = await bo.store.active_jobs(NAPO)
    assert (job.kind, job.payload) == ("ingest_pdf", {})


async def test_rerun_keeps_an_upload_that_is_waiting(bo: Backoffice) -> None:
    await bo.add_pdf()
    await bo.client.post(
        "/documents/pdf", files={"file": ("new.pdf", PDF)}, data={"document_id": NAPO}
    )
    await bo.client.post(f"/documents/{NAPO}/rerun")
    (job,) = await bo.store.active_jobs(NAPO)
    assert Path(job.payload["path"]).read_bytes() == PDF


async def test_rerun_of_a_pdf_never_stored_asks_for_the_file(bo: Backoffice) -> None:
    await bo.add_pdf(status="error")
    (bo.settings.uploads_dir / f"{NAPO}.pdf").unlink()
    response = await bo.client.post(f"/documents/{NAPO}/rerun")
    assert response.status_code == 409
    assert "upload it again" in response.text
    assert await bo.jobs() == []


async def test_rerun_a_web_page_fetches_it_again(bo: Backoffice) -> None:
    await bo.add_pdf("maap", type="web", origin="https://example.org/r")
    await bo.client.post("/documents/maap/rerun")
    assert await bo.jobs("maap") == [("ingest_web", "queued")]


async def test_replacing_the_pdf_keeps_the_document_and_its_title(
    bo: Backoffice,
) -> None:
    await bo.add_pdf()
    response = await bo.client.post(
        "/documents/pdf",
        files={"file": ("other name.pdf", PDF)},
        data={"document_id": NAPO, "back": "document"},
    )
    assert response.headers["HX-Redirect"] == f"/documents/{NAPO}"
    assert [d.id for d in await bo.store.list_documents()] == [NAPO]
    assert (await bo.document()).title == "Forest loss in the Napo basin"
    (job,) = await bo.store.active_jobs(NAPO)
    assert Path(job.payload["path"]).read_bytes() == PDF


async def test_a_second_upload_while_queued_replaces_the_first(
    bo: Backoffice,
) -> None:
    await bo.add_pdf()
    for content in (b"%PDF-1.7 wrong", PDF):
        await bo.client.post(
            "/documents/pdf",
            files={"file": ("r.pdf", content)},
            data={"document_id": NAPO},
        )
    (job,) = await bo.store.active_jobs(NAPO)
    assert Path(job.payload["path"]).read_bytes() == PDF
    assert len(queued_uploads(bo)) == 1


async def test_replacing_a_document_that_does_not_exist_is_404(
    bo: Backoffice,
) -> None:
    response = await bo.client.post(
        "/documents/pdf", files={"file": ("r.pdf", PDF)}, data={"document_id": "nope"}
    )
    assert response.status_code == 404
    assert queued_uploads(bo) == []


async def test_delete_queues_the_removal(bo: Backoffice) -> None:
    await bo.add_pdf()
    response = await bo.client.post(f"/documents/{NAPO}/delete")
    assert response.status_code == 200
    assert await bo.jobs() == [("delete_document", "queued")]
    assert "Waiting: deleting" in response.text
    await bo.worker.run_once()
    assert await bo.store.list_documents() == []


async def test_delete_from_the_document_page_goes_back_to_the_list(
    bo: Backoffice,
) -> None:
    await bo.add_pdf()
    response = await bo.client.post(
        f"/documents/{NAPO}/delete", data={"back": "document"}
    )
    assert response.headers["HX-Redirect"] == "/"


async def test_actions_on_an_unknown_document_are_404(bo: Backoffice) -> None:
    for path in ("/documents/nope/rerun", "/documents/nope/delete"):
        assert (await bo.client.post(path)).status_code == 404


async def test_an_uploaded_pdf_reaches_indexed(bo: Backoffice) -> None:
    await bo.client.post(
        "/documents/pdf", files={"file": ("napo.pdf", PDF)}, data={"title": "Napo"}
    )
    while await bo.worker.run_once():
        pass
    document = await bo.document()
    assert document.status == "indexed"
    assert (bo.settings.uploads_dir / "napo.pdf").read_bytes() == PDF
    assert (await bo.client.get("/files/uploads/napo.pdf")).content == PDF


async def test_pages_link_static_files_by_version(bo: Backoffice) -> None:
    html = (await bo.client.get("/")).text
    assert "/static/app.css?v=" in html
    assert "/static/htmx.min.js?v=" in html
