from typing import Literal

from pydantic import BaseModel

from mcp_server.geometry.aoi import Coverage


class ComputedOver(BaseModel):
    type: Literal["feature_attributes", "feature_count", "clipped_polygons"]
    # None when the query does not say how many polygons it read.
    features: int | None = None
    categories: int | None = None
    simplification: float | None = None


class Timing(BaseModel):
    total_ms: int
    arcgis_ms: int
    clip_ms: int = 0
    vertices_sent: int
    vertices_received: int = 0


class Result(BaseModel):
    indicator_id: int
    value: list[str] | int | dict[str, float]
    unit: str | None
    computed_over: ComputedOver
    coverage: Coverage
    provenance: dict[str, str | None]
    caveats: list[str]
    aoi_ha: float
    timing: Timing
