import pytest

from mcp_server.documents.ingest.triage import BUCKETS, bucket, coverage
from mcp_server.documents.models import Figure


def fig(
    status: str = "pending_review",
    generated: str = "Bars of forest loss in four zones",
    context: str = "",
    width: int = 0,
    height: int = 0,
) -> Figure:
    return Figure(
        figure_id="f1",
        document_id="d1",
        image_path="f1.png",
        image_hash="h",
        generated_description=generated,
        review_status=status,
        context=context,
        width=width,
        height=height,
    )


def test_coverage_counts_informative_words_only() -> None:
    description = "The figure shows the legend of the map"
    assert coverage(description, "Deforestation along roads") == 0.0
    assert coverage("The figure shows the Yasuni reserve", "Yasuni reserve") == 1.0


def test_coverage_is_partial_when_description_adds_words() -> None:
    assert coverage("Yasuni reserve roads", "The Yasuni reserve") == pytest.approx(
        2 / 3
    )


def test_coverage_of_empty_description_is_zero() -> None:
    assert coverage("", "anything") == 0.0


@pytest.mark.parametrize(
    ("figure", "expected"),
    [
        (fig(status="approved"), "approved"),
        (fig(status="discarded"), "discarded"),
        (fig(generated=""), "undescribed"),
        (fig(generated="Yasuni reserve", context="Yasuni reserve"), "covered"),
        (fig(width=210, height=102), "small"),
        (fig(width=800, height=400), "needs_review"),
        (fig(width=0, height=0), "needs_review"),
    ],
)
def test_bucket(figure: Figure, expected: str) -> None:
    assert bucket(figure) == expected
    assert expected in BUCKETS
