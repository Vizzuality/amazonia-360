import httpx
import pytest

from mcp_server.arcgis.client import ArcGISClient
from mcp_server.catalogue import list_indicators
from mcp_server.catalogue.models import IndicatorMetadata
from mcp_server.handlers.area import AreaHandlers
from tests.test_handlers import TENA

pytestmark = [pytest.mark.live, pytest.mark.anyio]

AVAILABLE = [i for i in list_indicators() if i.available]


@pytest.fixture
def handlers() -> AreaHandlers:
    return AreaHandlers(ArcGISClient(httpx.AsyncClient(timeout=120)))


@pytest.mark.parametrize("indicator", AVAILABLE, ids=lambda i: str(i.id))
async def test_every_available_layer_answers_its_cheap_question(
    handlers: AreaHandlers, indicator: IndicatorMetadata
) -> None:
    if indicator.allows("presence"):
        result = await handlers.categories_in_area(indicator.id, TENA)
    else:
        result = await handlers.count_in_area(indicator.id, TENA)
    assert result.timing.arcgis_ms > 0


async def test_ecosystems_area_is_clipped(handlers: AreaHandlers) -> None:
    result = await handlers.area_by_category(210, TENA)
    assert isinstance(result.value, dict)
    assert sum(result.value.values()) <= result.aoi_ha * 1.001
