from collections.abc import Iterator

import pytest

from mcp_server import catalogue
from mcp_server.catalogue.models import IndicatorMetadata


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def _fixed_indicators() -> dict[int, IndicatorMetadata]:
    from tests.test_models import indicator

    return {
        i.id: i
        for i in (
            indicator(),
            indicator(
                id=202,
                subtopic=4,
                value_type="count",
                aggregation="sum",
                unit="restoration actions",
                category_field="Practica",
                sync={"sync_status": "ok", "queryable_fields": ["Practica"]},
            ),
            indicator(
                id=211,
                subtopic=1,
                category_field="Relieve",
                sync={"sync_status": "ok", "queryable_fields": ["Relieve"]},
            ),
        )
    }


@pytest.fixture
def fixed_catalogue(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """A catalogue that does not move when the committed snapshot is re-synced."""
    monkeypatch.setattr(catalogue, "_catalogue", _fixed_indicators)
    yield
