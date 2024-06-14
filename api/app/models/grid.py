# ruff: noqa: D101

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.color import Color


class LegendTypes(str, Enum):
    continuous = "continuous"
    discrete = "discrete"
    categorical = "categorical"


class LevelStats(BaseModel):
    level: int = Field(
        ge=0, le=15, description="Stats for this level. AKA Overview or zoom level in other applications"
    )
    min: int | float
    max: int | float


class NumericalLegend(BaseModel):
    legend_type: Literal["discrete"] | Literal["continuous"]
    stats: list[LevelStats]
    colormap_name: str = Field(default=None, description="suggestion of color map to use")


class CategoricalLegendEntry(BaseModel):
    model_config = ConfigDict(json_encoders={Color: lambda c: c.as_hex()})

    value: int | str
    color: Color
    label: str = Field(description="human readable label")


class CategoricalLegend(BaseModel):
    legend_type: Literal["categorical"]
    categories: list[CategoricalLegendEntry]


class Dataset(BaseModel):
    var_name: str = Field(description="Column name")
    var_dtype: str = Field(description="Column dtype. ")
    description: str
    legend: CategoricalLegend | NumericalLegend = Field(discriminator="legend_type")
    aggregation_method: str = Field(description="Aggregation method used to compute the overview levels")
    lineage: list[str] = Field(default=None, description="Source data used to compute this dataset")


class H3GridInfo(BaseModel):
    level: int = Field(ge=0, le=15)
    h3_cells_resolution: int = Field(ge=0, le=15)
    h3_cells_count: int


class TileDatasetMeta(BaseModel):
    datasets: list[Dataset] = Field(description="Variables represented in this dataset")
    h3_grid_info: list[H3GridInfo] = Field(description="H3 related information")
