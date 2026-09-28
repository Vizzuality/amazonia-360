from typing import Literal

from pydantic import BaseModel, Field

from mcp_server.catalogue.models import RecordCounts
from mcp_server.geometry.aoi import Coverage


class ComputedOver(BaseModel):
    type: Literal[
        "feature_attributes", "feature_count", "clipped_polygons", "raster_pixels"
    ]
    # None when the query does not say how many polygons it read.
    features: int | None = None
    categories: int | None = None
    simplification: float | None = None
    pixels: int | None = Field(
        default=None,
        description=(
            "raster_pixels only: pixels with data inside the area, the shares' "
            "denominator. A few dozen make a coarse share."
        ),
    )
    pixel_size_deg: float | None = Field(
        default=None,
        description=(
            "raster_pixels only: pixel width in degrees, as the image service "
            "reports it; 0.009 is about 1 km. None: not read yet."
        ),
    )


class Timing(BaseModel):
    total_ms: int
    arcgis_ms: int
    clip_ms: int = 0
    vertices_sent: int
    vertices_received: int = 0


class LayerFacts(BaseModel):
    covers_module: bool | None = Field(
        description=(
            "Whether the layer's features cover the whole module. When false, a part "
            "of the area in no class is simply not mapped by this layer. None: not "
            "known."
        )
    )
    empty_result: Literal["not_mapped_here", "unexpected"] | None = Field(
        default=None,
        description=(
            "Set only when the result is empty. not_mapped_here: the layer maps "
            "only part of the module and nothing of it falls in this area, which is "
            "not missing data. unexpected: the layer covers the module, so an empty "
            "result suggests the area is outside the real module boundary."
        ),
    )


class Result(BaseModel):
    indicator_id: int
    value: list[str] | int | dict[str, float]
    unit: str | None
    computed_over: ComputedOver
    coverage: Coverage
    layer: LayerFacts
    # Left undescribed, all-null provenance was reported in the Desktop trial as a
    # defect of the layer ("no provenance metadata"), which reads as doubt about it.
    provenance: dict[str, str | None] = Field(
        description=(
            "Where the data comes from, as curated in the CMS: source organisation, "
            "licence, citation, the date the data describes. A null field has not "
            "been curated yet; it says nothing about the quality of the data."
        )
    )
    caveats: list[str] = Field(
        description=(
            "Known defects of this dataset, written by a person in the CMS. Only "
            "those: what the server computed is in the other fields."
        )
    )
    record_counts: RecordCounts | None = Field(
        default=None,
        description="Set when the source documentation and the service disagree.",
    )
    aoi_ha: float = Field(
        description="Area of the whole input area, including any part outside."
    )
    classified_ha: float | None = Field(
        default=None,
        description="area_by_category only: hectares of the area in some class.",
    )
    unclassified_ha: float | None = Field(
        default=None,
        description=(
            "area_by_category only: aoi_ha minus classified_ha. Hectares in no class "
            "of this layer; they are not a class and the layer says nothing about "
            "them. Includes any part of the area outside the module."
        ),
    )
    unclassified_share: float | None = Field(
        default=None,
        description=(
            "class_shares_in_area only: share of the area's pixels with data but in "
            "no class of the legend. Like unclassified_ha, not a class."
        ),
    )
    timing: Timing
