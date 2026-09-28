"""The indicator the MCP takes in: what the CMS sends it when an editor publishes.

This is not Payload's REST response. The CMS maps its document to this shape in the
publish callback (see the MCP design, "Catalogue intake"): one resource object instead
of a one-item blocks list, integer ids, caveats as plain ``{text}`` rows, and locale
``en`` only.

Field names and vocabularies follow the contract on
``feat/cms-indicator-metadata-contract`` (``client/src/cms/fields/metadata.ts`` and
``metadata-vocabularies.ts``). The vocabularies are copied, not imported, because
this service does not share code with the client; keep them in step by hand.

Fields marked as a proposal in their description are not in the contract yet.
"""

import math
from datetime import datetime
from typing import Annotated, Any, Literal
from urllib.parse import urlsplit

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StrictInt,
    computed_field,
    model_validator,
)

ValueType = Literal[
    "count",
    "area",
    "length",
    "distance",
    "ratio",
    "index",
    "density",
    "categorical",
]
Aggregation = Literal["sum", "mean", "area_weighted_mean", "min", "none"]
Sensitivity = Literal["public", "restricted", "restricted_review", "indigenous_data"]
UpdateCadence = Literal[
    "monthly", "quarterly", "biannual", "annual", "irregular", "one_off", "unknown"
]
SyncStatus = Literal["ok", "error", "item_inaccessible"]
AdminLevel = Literal["0", "1", "2"]
# From COUNTRIES in client/src/lib/country/index.ts.
CountryCode = Literal["ECU", "BOL", "BRA", "COL", "GUF", "GUY", "PER", "SUR", "VEN"]
Operation = Literal["presence", "count", "area", "class_share"]
ResourceType = Literal["feature", "imagery"]

# Only the value types this phase has tools for; any other pair allows nothing.
ALLOWED_OPERATIONS: dict[tuple[ResourceType, str], frozenset[Operation]] = {
    ("feature", "categorical"): frozenset({"presence", "area"}),
    ("feature", "count"): frozenset({"count"}),
    ("imagery", "categorical"): frozenset({"class_share"}),
}

_PROPOSAL = "Proposal: not in the CMS contract yet."


class _Model(BaseModel):
    # Forbidding extras is what turns a typo in the JSON file into a load error.
    model_config = ConfigDict(frozen=True, extra="forbid")


def _service_url(url: str) -> str:
    # A catalogue record picks the host the server fetches from. https only, which
    # rules out the plain-http metadata endpoints of a cloud host, and no query or
    # fragment: a fragment would drop the path the client appends to the URL.
    parts = urlsplit(url)
    if parts.scheme != "https" or not parts.hostname:
        raise ValueError(f"A service URL must be https with a host, got {url!r}.")
    if parts.query or parts.fragment or parts.username or parts.password:
        raise ValueError(f"A service URL takes no query, fragment or user: {url!r}.")
    return url


def _hex_colour(colour: str) -> str:
    # It goes into a style attribute on the map page, so nothing but a colour.
    digits = colour[1:]
    if (
        len(colour) != 7
        or colour[0] != "#"
        or not all(c in "0123456789abcdefABCDEF" for c in digits)
    ):
        raise ValueError(f"A legend colour must be #rrggbb, got {colour!r}.")
    return colour


ServiceUrl = Annotated[str, AfterValidator(_service_url)]


class Layer(_Model):
    """What the ArcGIS client needs to query one layer. Derived, never stored."""

    service_url: str
    layer_id: StrictInt
    category_field: str


class FeatureResource(_Model):
    type: Literal["feature"]
    url: ServiceUrl
    layer_id: StrictInt


class LegendItem(_Model):
    label: str
    color: Annotated[str, AfterValidator(_hex_colour)]


class Legend(_Model):
    type: Literal["basic"]
    items: list[LegendItem]


class ImageryResource(_Model):
    """An image service, as Payload's imagery block holds it.

    raster_function is the front end's, in the JS SDK's form. When it is a Colormap,
    its entries are the classes, in the legend's order. A function the MCP cannot
    read by class still loads: raster_problem() says why, and the indicator reports
    itself unavailable instead of stopping the whole catalogue.
    """

    type: Literal["imagery"]
    url: ServiceUrl
    raster_function: dict[str, Any]
    legend: Legend
    aggregation: Literal["sum", "mean", "none"] | None = None

    def raster_problem(self) -> str | None:
        values = colormap_values(self.raster_function)
        labels = [item.label for item in self.legend.items]
        if values is None:
            return "the raster function is not a Colormap with explicit entries"
        if not values:
            return "the colormap lists no classes"
        if len(values) != len(labels):
            return (
                f"the colormap has {len(values)} classes and the legend "
                f"{len(labels)} items"
            )
        if len(set(values)) != len(values):
            return "the colormap repeats a pixel value"
        if len(set(labels)) != len(labels):
            return "the legend repeats a label"
        return None


def colormap_values(raster_function: dict[str, Any]) -> list[int] | None:
    """The pixel value of each class, when the function is a Colormap with explicit
    entries. None for anything else, a named colormap included; never raises."""
    if raster_function.get("functionName") != "Colormap":
        return None
    arguments = raster_function.get("functionArguments")
    entries = arguments.get("colormap") if isinstance(arguments, dict) else None
    if not isinstance(entries, list):
        return None
    values = []
    for entry in entries:
        if not isinstance(entry, list) or not entry:
            return None
        value = entry[0]
        if isinstance(value, bool) or not isinstance(value, int | float):
            return None
        if not math.isfinite(value) or value != int(value):
            return None
        values.append(int(value))
    return values


Resource = Annotated[FeatureResource | ImageryResource, Field(discriminator="type")]


class Raster(_Model):
    """What reading one raster by class needs. Derived, never stored."""

    url: str
    raster_function: dict[str, Any]
    values: list[int]
    legend: list[LegendItem]

    @property
    def classified(self) -> Any:
        """What the colormap reads: a function to classify with, or "$$" for the
        stored values. In the JS SDK a missing argument means the stored values."""
        return self.raster_function["functionArguments"].get("raster", "$$")


class Caveat(_Model):
    text: str


class Provenance(_Model):
    source_org: str | None = None
    source_url: str | None = None
    license: str | None = None
    source_citation: str | None = None
    data_vintage: str | None = None
    update_cadence: UpdateCadence | None = None
    method_url: str | None = None


class Sync(_Model):
    arcgis_item_id: str | None = None
    queryable_fields: list[str] | None = None
    layer_last_edit: datetime | None = None
    schema_last_edit: datetime | None = None
    item_modified: datetime | None = None
    synced_at: datetime | None = None
    sync_status: SyncStatus | None = None
    published_count: StrictInt | None = Field(
        default=None,
        description=f"Records in the published layer, read by the sync. {_PROPOSAL}",
    )
    pixel_size_deg: float | None = Field(
        default=None,
        description=(
            "Image services only: the pixel width in degrees, as the service reports "
            "it. What a share of pixels over a small area rests on, and not always "
            f"what the documentation says. {_PROPOSAL}"
        ),
    )


class CuratedIndicator(_Model):
    """Everything a person decides, as written in ``ecuador.json``.

    The sync group is left out because a job writes it, never a person: in the CMS
    its ArcGIS sync job, locally ``amazonia360-mcp-catalogue sync``.

    Only identity is required, as in the contract: an incomplete indicator loads and
    reports why it is unavailable instead of stopping the whole catalogue.
    """

    id: StrictInt
    name: str
    # Collection fields in Payload (Indicators.ts), not part of the metadata contract.
    description_short: str | None = None
    description: str | None = Field(default=None, description="Markdown.")
    subtopic: StrictInt
    unit: str | None = None
    country: CountryCode | None = None
    resource: Resource | None = None
    value_type: ValueType | None = None
    aggregation: Aggregation | None = None
    decimals: StrictInt | None = Field(default=None, ge=0, le=6)
    spatial_coverage: list[CountryCode] = []
    collected_at_level: AdminLevel | None = None
    sensitivity: Sensitivity | None = None
    ai_answerable: bool = False
    caveats: list[Caveat] = []
    provenance: Provenance = Provenance()
    category_field: str | None = Field(
        default=None,
        description=(
            "The attribute that holds each feature's class, used to list and group "
            "by class. Belongs in Payload's feature resource block, next to "
            f"layer_id. {_PROPOSAL}"
        ),
    )
    covers_module: bool | None = Field(
        default=None,
        description=(
            "Whether the layer's features cover the whole module, so that every point "
            "falls in some class. Tells an empty answer that means 'nothing mapped "
            "here' from one that should not happen. Would sit next to "
            f"spatial_coverage. {_PROPOSAL}"
        ),
    )
    documented_count: StrictInt | None = Field(
        default=None,
        description=(
            "Records the source documentation says the layer has. Compared with "
            "sync.published_count to warn about a mismatch. Belongs in Payload's "
            f"provenance group. {_PROPOSAL}"
        ),
    )


class IndicatorMetadata(CuratedIndicator):
    sync: Sync = Field(
        default=Sync(),
        description=(
            "The contract's sync group (SyncFields in metadata.ts), written by the "
            "CMS's ArcGIS sync job and sent with the rest of the indicator. Until that "
            "job exists the MCP fills it locally."
        ),
    )

    @computed_field
    @property
    def available(self) -> bool:
        return self.unavailable_reason() is None

    def unavailable_reason(self) -> str | None:
        if self.resource is None:
            return "no published resource"
        if self.sync.sync_status is None:
            return "not synced"
        if self.sync.sync_status != "ok":
            return f"sync status is {self.sync.sync_status}"
        if self.value_type is None:
            return "no value_type"
        if self.resource.type == "feature" and self.category_field is None:
            return "no category_field"
        if isinstance(self.resource, ImageryResource):
            return self.resource.raster_problem()
        return None

    def allows(self, operation: Operation) -> bool:
        if self.value_type is None or self.resource is None:
            return False
        key = (self.resource.type, self.value_type)
        return operation in ALLOWED_OPERATIONS.get(key, frozenset())

    def raster(self) -> Raster | None:
        if not isinstance(self.resource, ImageryResource):
            return None
        if self.resource.raster_problem() is not None:
            return None
        values = colormap_values(self.resource.raster_function)
        assert values is not None
        return Raster(
            url=self.resource.url,
            raster_function=self.resource.raster_function,
            values=values,
            legend=self.resource.legend.items,
        )

    def query_layer(self) -> Layer | None:
        if (
            not isinstance(self.resource, FeatureResource)
            or self.category_field is None
        ):
            return None
        return Layer(
            service_url=self.resource.url,
            layer_id=self.resource.layer_id,
            category_field=self.category_field,
        )

    def record_counts(self) -> "RecordCounts | None":
        documented, published = self.documented_count, self.sync.published_count
        if documented is None or published is None or documented == published:
            return None
        return RecordCounts(documented=documented, published=published)


class RecordCounts(_Model):
    """A disagreement between the source documentation and the published service."""

    documented: int = Field(description="Records the source documentation lists.")
    published: int = Field(
        description="Records in the published service, which answers are computed from."
    )


class CatalogueDocument(_Model):
    """The whole published catalogue, as the CMS exports it on every change.

    Sending everything each time is what keeps the MCP from drifting: a missed or
    out-of-order export is corrected by the next one, and an indicator that is
    deleted or unpublished simply stops appearing.
    """

    locale: Literal["en"]
    generated_at: datetime = Field(
        description="When the export was built. The MCP keeps the newest it has seen."
    )
    indicators: list[IndicatorMetadata] = Field(
        description="Every published indicator, drafts excluded."
    )

    # build_document checks this too, earlier and with a CatalogueError, for the
    # local files; this is the check the CMS export goes through.
    @model_validator(mode="after")
    def _unique_ids(self) -> "CatalogueDocument":
        seen: set[int] = set()
        for indicator in self.indicators:
            if indicator.id in seen:
                raise ValueError(f"Indicator {indicator.id} appears twice.")
            seen.add(indicator.id)
        return self
