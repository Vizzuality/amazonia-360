from datetime import datetime

from pydantic import BaseModel


class LayerManifest(BaseModel):
    """What a stored layer copy was built from; written last, so its presence
    means the copy is complete."""

    indicator_id: int
    layer_last_edit: datetime | None
    # The maxAllowableOffset the geometry was downloaded with; None for full detail.
    simplification: float | None
    cell_deg: float
    features: int
    pieces: int
    built_at: datetime


class PlaceFigures(BaseModel):
    """Hectares per class for each place, computed when the layer was built."""

    indicator_id: int
    layer_last_edit: datetime | None
    places_generated_at: str
    hectares: dict[str, dict[str, float]]
