# ruff: noqa: D101

from enum import Enum
from typing import Literal, Self

import pydantic
from pydantic import BaseModel, ConfigDict, Field
from pydantic_extra_types.color import Color
from sqlalchemy.sql import column, desc, select, table


class LegendTypes(str, Enum):
    continuous = "continuous"
    discrete = "discrete"
    categorical = "categorical"


class LevelStats(BaseModel):
    level: int = Field(
        ge=0,
        le=15,
        description="Stats for this level. AKA Overview or zoom level in other applications",
    )
    min: int | float | None = Field(..., description="null value represents -infinity")
    max: int | float | None = Field(..., description="null value represents infinity")


class NumericalLegend(BaseModel):
    legend_type: Literal["discrete"] | Literal["continuous"]
    colormap_name: str | None = Field("viridis", description="suggestion of color map to use")
    stats: list[LevelStats]


class CategoricalLegendEntry(BaseModel):
    model_config = ConfigDict(json_encoders={Color: lambda c: c.as_hex()})
    value: int | str
    color: Color
    label: str = Field(description="human readable label")


class CategoricalLegend(BaseModel):
    legend_type: Literal["categorical"]
    entries: list[CategoricalLegendEntry]


class DatasetMeta(BaseModel):
    var_name: str = Field(description="Column name")
    var_dtype: str = Field(description="Column dtype. ")
    nodata: str
    description: str
    aggregation_method: str = Field(description="Aggregation method used to compute the overview levels")
    lineage: list[str] | None = Field(default=None, description="Source data used to compute this dataset")
    legend: CategoricalLegend | NumericalLegend = Field(discriminator="legend_type")


class H3GridInfo(BaseModel):
    level: int = Field(ge=0, le=15)
    h3_cells_resolution: int = Field(ge=0, le=15)
    h3_cells_count: int


class MultiDatasetMeta(BaseModel):
    datasets: list[DatasetMeta] = Field(description="Variables represented in this dataset")
    h3_grid_info: list[H3GridInfo] = Field(description="H3 related information")


# ===============================================
#               TABLE FILTERING
# ===============================================


class NumericalOperators(str, Enum):
    eq = "eq"
    gt = "gt"
    lt = "lt"
    gte = "gte"
    lte = "lte"
    not_eq = "not_eq"


class CategoricalOperators(str, Enum):
    in_ = "in"
    not_in = "not_in"


class CategoricalFilter(BaseModel):
    filter_type: Literal["categorical"]
    column_name: str = Field(description="Name of the column to which the filter will apply")
    operation: CategoricalOperators = Field()
    value: list[int] = Field(description="Value to compare with")


class NumericalFilter(BaseModel):
    filter_type: Literal["numerical"]
    column_name: str = Field(description="Name of the column to which the filter will apply")
    operation: NumericalOperators = Field(description="Operation to use in compare")
    value: float = Field(description="Value to compare with")


class TableFilters(BaseModel):
    filters: list[CategoricalFilter | NumericalFilter] = Field(discriminator="filter_type")
    limit: int = Field(10, lt=1000, description="Number of records")
    order_by: list[str] = Field(description="List of columns to use in order by")
    desc: list[bool] = Field(description="List of bools to set descending sorting order. Must match length of order_by")

    @pydantic.model_validator(mode="after")
    def verify_order_by_and_desc_lengths(self) -> Self:  # noqa: D102
        if len(self.order_by) != len(self.desc):
            raise ValueError("order_by and desc must have the same length")
        return self

    def to_sql_query(self, table_name: str) -> str:
        """Compile model to sql query"""
        op_to_python_dunder = {
            "eq": "__eq__",
            "gt": "__gt__",
            "lt": "__lt__",
            "gte": "__ge__",
            "lte": "__le__",
            "not_eq": "__ne__",
            "in": "in_",
        }
        filters_to_apply = []
        for _filter in self.filters:
            col = column(_filter.column_name)
            param = getattr(col, op_to_python_dunder.get(_filter.operation, _filter.operation))(_filter.value)
            filters_to_apply.append(param)
        query = (
            select("*")
            .select_from(table(table_name))
            .where(*filters_to_apply)
            .limit(self.limit)
            .order_by(*[desc(column(col)) if d else column(col) for col, d in zip(self.order_by, self.desc)])
        )
        return str(query.compile(compile_kwargs={"literal_binds": True}))
