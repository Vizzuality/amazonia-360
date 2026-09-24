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

from datetime import datetime
from typing import Literal

from pydantic import (
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
Operation = Literal["presence", "count", "area"]

# Only the value types this phase has tools for; any other type allows nothing.
ALLOWED_OPERATIONS: dict[str, frozenset[Operation]] = {
    "categorical": frozenset({"presence", "area"}),
    "count": frozenset({"count"}),
}

_PROPOSAL = "Proposal: not in the CMS contract yet."


class _Model(BaseModel):
    # Forbidding extras is what turns a typo in the JSON file into a load error.
    model_config = ConfigDict(frozen=True, extra="forbid")


class Layer(_Model):
    """What the ArcGIS client needs to query one layer. Derived, never stored."""

    service_url: str
    layer_id: StrictInt
    category_field: str


class Resource(_Model):
    type: Literal["feature"]
    url: str
    layer_id: StrictInt


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


class CuratedIndicator(_Model):
    """Everything a person decides, as written in ``ecuador.json``.

    The sync group is left out because a job writes it, never a person: in the CMS
    its ArcGIS sync job, locally ``amazonia360-mcp-catalogue sync``.

    Only identity is required, as in the contract: an incomplete indicator loads and
    reports why it is unavailable instead of stopping the whole catalogue.
    """

    id: StrictInt
    name: str
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
        if self.category_field is None:
            return "no category_field"
        return None

    def allows(self, operation: Operation) -> bool:
        if self.value_type is None:
            return False
        return operation in ALLOWED_OPERATIONS.get(self.value_type, frozenset())

    def query_layer(self) -> Layer | None:
        if self.resource is None or self.category_field is None:
            return None
        return Layer(
            service_url=self.resource.url,
            layer_id=self.resource.layer_id,
            category_field=self.category_field,
        )

    def count_mismatch(self) -> str | None:
        documented, published = self.documented_count, self.sync.published_count
        if documented is None or published is None or documented == published:
            return None
        return (
            f"The source documentation lists {documented} records for this layer; "
            f"the published service has {published}."
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
