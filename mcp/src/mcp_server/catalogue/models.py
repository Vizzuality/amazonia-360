"""The indicator shape the MCP consumes, as the CMS will serve it with ``?locale=en``.

Field names and vocabularies follow the contract on
``feat/cms-indicator-metadata-contract`` (``client/src/cms/fields/metadata.ts`` and
``metadata-vocabularies.ts``). The vocabularies are copied, not imported, because
this service does not share code with the client; keep them in step by hand.

Fields marked as a proposal in their description are not in the contract yet.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

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
    layer_id: int
    category_field: str


class Resource(_Model):
    type: Literal["feature"]
    url: str
    layer_id: int


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
    published_count: int | None = Field(
        default=None,
        description=f"Records in the published layer, read by the sync. {_PROPOSAL}",
    )


class CuratedIndicator(_Model):
    """Everything a person decides. The sync group is written by a job, never here."""

    id: int
    name: str
    unit: str | None
    subtopic: int
    country: str
    resource: Resource | None
    value_type: ValueType
    aggregation: Aggregation
    decimals: int | None = None
    spatial_coverage: list[str] = []
    collected_at_level: AdminLevel | None = None
    sensitivity: Sensitivity | None = None
    ai_answerable: bool = False
    caveats: list[Caveat] = []
    provenance: Provenance = Provenance()
    category_field: str | None = Field(
        default=None,
        description=(
            "The attribute that holds each feature's class, used to list and group "
            f"by class. {_PROPOSAL}"
        ),
    )
    documented_count: int | None = Field(
        default=None,
        description=(
            "Records the source documentation says the layer has. Compared with "
            f"sync.published_count to warn about a mismatch. {_PROPOSAL}"
        ),
    )


class IndicatorMetadata(CuratedIndicator):
    sync: Sync = Sync()

    @computed_field
    @property
    def available(self) -> bool:
        return self.resource is not None and self.sync.sync_status == "ok"

    def allows(self, operation: Operation) -> bool:
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
