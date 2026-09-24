from typing import Literal

from pydantic import BaseModel, ConfigDict

ValueType = Literal["count", "categorical"]
Aggregation = Literal["sum", "none"]
Operation = Literal["presence", "count", "area"]

ALLOWED_OPERATIONS: dict[ValueType, frozenset[Operation]] = {
    "categorical": frozenset({"presence", "area"}),
    "count": frozenset({"count"}),
}


class Layer(BaseModel):
    model_config = ConfigDict(frozen=True)

    service_url: str
    layer_id: int
    category_field: str


class Provenance(BaseModel):
    model_config = ConfigDict(frozen=True)

    source_org: str | None = None
    source_url: str | None = None
    license: str | None = None
    source_citation: str | None = None
    data_vintage: str | None = None


class IndicatorMetadata(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    name_en: str
    name_es: str
    subtopic_id: int
    value_type: ValueType
    aggregation: Aggregation
    unit: str
    # The contract defaults this to false, so every exposed layer sets it on purpose.
    ai_answerable: bool
    available: bool
    layer: Layer | None
    arcgis_item_id: str
    provenance: Provenance = Provenance()
    caveats: tuple[str, ...] = ()

    def allows(self, operation: Operation) -> bool:
        return operation in ALLOWED_OPERATIONS[self.value_type]
