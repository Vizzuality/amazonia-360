from typing import Literal

from pydantic import BaseModel, Field, computed_field

PlaceKind = Literal["province", "canton", "protected_area"]


class PlaceSource(BaseModel):
    """Where the boundary is read from when a tool uses the place."""

    url: str
    layer_id: int
    where: str


class PlaceSummary(BaseModel):
    id: str = Field(description="Pass as place_id to any area tool.")
    name: str
    kind: PlaceKind
    province: str | None = Field(
        default=None, description="canton only: the province it belongs to."
    )
    category: str | None = Field(
        default=None, description="protected_area only: its category in the SNAP."
    )
    area_ha: float
    bbox: list[float] = Field(description="[min_lon, min_lat, max_lon, max_lat].")


class Place(PlaceSummary):
    source: PlaceSource

    def summary(self) -> PlaceSummary:
        return PlaceSummary.model_validate(self.model_dump(exclude={"source"}))


class PlaceMatches(BaseModel):
    places: list[PlaceSummary]
    note: str | None = None

    # Models miscount long lists: on 40 protected areas several answered 41.
    @computed_field(
        description="How many places are listed. When saying how many places were "
        "checked, give this number."
    )
    @property
    def count(self) -> int:
        return len(self.places)


class PlacesSnapshot(BaseModel):
    generated_at: str
    places: list[Place]
