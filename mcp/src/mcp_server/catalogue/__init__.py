from mcp_server.catalogue.ecuador import INDICATORS
from mcp_server.catalogue.models import IndicatorMetadata

_BY_ID = {i.id: i for i in INDICATORS}


def get_indicator_metadata(indicator_id: int) -> IndicatorMetadata | None:
    return _BY_ID.get(indicator_id)


def list_indicators(subtopic_id: int | None = None) -> list[IndicatorMetadata]:
    return [
        i for i in INDICATORS if subtopic_id is None or i.subtopic_id == subtopic_id
    ]
