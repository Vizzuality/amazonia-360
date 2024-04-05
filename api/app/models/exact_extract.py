from enum import StrEnum
from typing import List

from pydantic import BaseModel, Field


class StatsProperties(BaseModel):
    """Model for `exact_extract` statistics results.

    Deliberately avoids the `values` field since it is a
     list of all raster values for each cell that intersects the polygon.
     It is not included in the model because it can be very large and there are better ways to get this information
     in Titiler.
    """

    cell_id: List[int] | None = Field(
        None, description="Array with 0-based index of each cell that intersects the polygon, increasing left-to-right."
    )
    center_x: List[float] | None = Field(
        None,
        description="Array with cell center x-coordinate for each cell that intersects the polygon. Each cell center "
        "may or may not be inside the polygon.",
    )
    center_y: List[float] | None = Field(
        None,
        description="Array with cell center y-coordinate for each cell that intersects the polygon. Each cell center "
        "may or may not be inside the polygon.",
    )
    coefficient_of_variation: float | None = Field(
        None,
        description="Population coefficient of variation of cell values that intersect the polygon, taking into "
        "account coverage fraction.",
    )
    count: float | None = Field(None, description="Sum of all cell coverage fractions.")
    coverage: List[float] | None = Field(
        None, description="Array with coverage fraction of each cell that intersects the polygon."
    )
    frac: list[float] | None = Field(
        None, description="Fraction of covered cells that are occupied by each distinct raster value."
    )
    majority: int | None = Field(
        None,
        description="The raster value occupying the greatest number of cells, taking into account cell coverage "
        "fractions but not weighting raster values.",
    )
    max: int | None = Field(
        None,
        description="Maximum value of cells that intersect the polygon, not taking coverage fractions or weighting "
        "raster values into account.",
    )
    max_center_x: float | None = Field(
        None,
        description="Cell center x-coordinate for the cell containing the maximum value intersected by the polygon. "
        "The center of this cell may or may not be inside the polygon.",
    )
    max_center_y: float | None = Field(
        None,
        description="Cell center y-coordinate for the cell containing the maximum value intersected by the polygon. "
        "The center of this cell may or may not be inside the polygon.",
    )
    mean: float | None = Field(
        None,
        description="Mean value of cells that intersect the polygon, weighted by the percent of each cell that is "
        "covered.",
    )
    median: int | None = Field(
        None,
        description="Median value of cells that intersect the polygon, weighted by the percent of each cell that is "
        "covered.",
    )
    min: int | None = Field(
        None,
        description="Minimum value of cells that intersect the polygon, not taking coverage fractions or weighting "
        "raster values into account.",
    )
    min_center_x: float | None = Field(
        None,
        description="Cell center x-coordinate for the cell containing the minimum value intersected by the polygon. "
        "The center of this cell may or may not be inside the polygon.",
    )
    min_center_y: float | None = Field(
        None,
        description="Cell center y-coordinate for the cell containing the minimum value intersected by the polygon. "
        "The center of this cell may or may not be inside the polygon.",
    )
    minority: int | None = Field(
        None,
        description="The raster value occupying the least number of cells, taking into account cell coverage "
        "fractions but not weighting raster values.",
    )
    stdev: float | None = Field(
        None,
        description="Population standard deviation of cell values that intersect the polygon, taking into account "
        "coverage fraction.",
    )
    sum: float | None = Field(
        None,
        description="Sum of values of raster cells that intersect the polygon, with each raster value weighted by its "
        "coverage fraction.",
    )
    unique: List[int] | None = Field(
        None, description="Array of unique raster values for cells that intersect the polygon."
    )
    variance: float | None = Field(
        None,
        description="Population variance of cell values that intersect the polygon, taking into account coverage "
        "fraction.",
    )
    variety: int | None = Field(
        None, description="The number of distinct raster values in cells wholly or partially covered by the polygon."
    )
    weighted_frac: list[float] | None = Field(
        None,
        description="Fraction of covered cells that are occupied by each distinct raster value, weighted by the value "
        "of a second weighting raster.",
    )
    weighted_mean: float | None = Field(
        None,
        description="Mean value of cells that intersect the polygon, weighted by the product over the coverage "
        "fraction and the weighting raster.",
    )
    weighted_stdev: float | None = Field(None, description="Weighted version of stdev.")
    weighted_sum: float | None = Field(
        None,
        description="Sum of raster cells covered by the polygon, with each raster value weighted by its coverage "
        "fraction and weighting raster value.",
    )
    weighted_variance: float | None = Field(None, description="Weighted version of variance.")
    weights: List[int] | None = Field(
        None, description="Array of weight values for each cell that intersects the polygon."
    )


class StatsFeature(BaseModel):
    """Exactextract result model for one feature."""

    type: str
    properties: StatsProperties


class StatsFeatures(BaseModel):
    """Exactextract result model for multiple features."""

    features: List[StatsFeature]


StatsOps = StrEnum("StatsOps", list(StatsProperties.model_fields.keys()))
StatsOps.__doc__ = "Statistic operations available in `exact_extract`. See `StatsProperties` for more details."
