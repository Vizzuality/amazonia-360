# ruff: noqa: D101

from enum import Enum
from typing import Annotated, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter
from pydantic_extra_types.color import Color
from sqlalchemy.sql import column, desc, nullslast, select, table


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
    var_name: str = Field(description="Column name.")
    var_dtype: str = Field(description="Column dtype.")
    label: str = Field(description="Human readable name.")
    nodata: str | None = Field(default=None, description="Nodata value used in grid")
    description: str = Field(description="Human readable indicator description.")
    unit: str | None = Field(description="Unit of the measurement")
    lineage: list[str] | None = Field(default=None, description="Source data used to compute this dataset.")
    legend: CategoricalLegend | NumericalLegend = Field(discriminator="legend_type")


class H3GridInfo(BaseModel):
    level: int = Field(ge=0, le=15)
    h3_cells_resolution: int = Field(ge=0, le=15)
    h3_cells_count: int


class MultiDatasetMeta(BaseModel):
    datasets: list[DatasetMeta] = Field(description="Variables represented in this dataset.")
    h3_grid_info: list[H3GridInfo] = Field(description="H3 related information.")


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
    column_name: str = Field(description="Name of the column to which the filter will apply.")
    operation: CategoricalOperators
    value: list[int] = Field(description="Value to compare with.")


class NumericalFilter(BaseModel):
    filter_type: Literal["numerical"]
    column_name: str = Field(description="Name of the column to which the filter will apply.")
    operation: NumericalOperators = Field(description="Operation to use in compare.")
    value: float = Field(description="Value to compare with.")


class TableFilters(BaseModel):
    filters: list[Annotated[CategoricalFilter | NumericalFilter, Field(discriminator="filter_type")]]
    limit: int = Field(Query(10, lt=1000, description="Number of records."))
    order_by: Annotated[
        list[str],
        Field(
            Query(..., description="Prepend '-' to column name to make it descending"),
        ),
    ]

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
            if _filter is None:
                continue
            col = column(_filter.column_name)
            param = getattr(col, op_to_python_dunder.get(_filter.operation, _filter.operation))(_filter.value)
            filters_to_apply.append(param)
        query = (
            select("*")
            .select_from(table(table_name))
            .where(*filters_to_apply)
            .limit(self.limit)
            .order_by(
                *[nullslast(desc(column(col[1:]))) if col.startswith("-") else column(col) for col in self.order_by]
            )
        )
        return str(query.compile(compile_kwargs={"literal_binds": True}))


H3Index = Annotated[str, Field(description="H3 cell index", examples=["81a8fffffffffff"])]


class TableResultColumn(BaseModel):
    column: Annotated[str, Field(title="column", description="Column name")]
    values: Annotated[list, Field(description="Check dataset metadata for type info")]


class TableResults(BaseModel):
    table: list[TableResultColumn]
    cells: list[H3Index]