import io
import logging
import os
from functools import lru_cache

import h3
import h3ronpy.polars  # noqa: F401
import polars as pl
import pyarrow as pa
from h3 import H3CellInvalidError
from h3ronpy import cells_to_string
from h3ronpy.vector import geometry_to_cells
from pydantic import ValidationError
from shapely.geometry.base import BaseGeometry

from app.models.grid import MultiDatasetMeta, TableFilters, TableResultColumn, TableResults

log = logging.getLogger(__name__)


class InvalidH3CellError(Exception):
    """H3 cell index is not valid"""


class ColumnNotFoundError(Exception):
    """Column provided does not exist in the dataset"""


class TileNotFoundError(Exception):
    """Tile does not exist in the dataset"""


class MetadataError(Exception):
    """Metadata file is non existent or malformed"""


class FilterError(Exception):
    """Table filter is not valid"""


def polars_to_string_ipc(df: pl.DataFrame) -> bytes:
    """Cast cell column of polars dataframe to arrow type `string` and return the ipc bytes."""
    # For performance reasons all the strings in polars are treated as `large_string`,
    # a custom string type. As of today, the frontend library @loadrs.gl/arrow only supports
    # `string` type so we need to downcast with pyarrow
    table: pa.Table = df.to_arrow()
    schema = table.schema.set(table.schema.get_field_index("cell"), pa.field("cell", pa.string()))
    table = table.cast(schema)
    sink = io.BytesIO()
    with pa.ipc.new_file(sink, table.schema) as writer:
        writer.write_table(table)
    return sink.getvalue()


@lru_cache
def cells_in_geojson(geometry: str, cell_resolution: int) -> pl.LazyFrame:
    """Return the cells that fill the polygon area in the geojson

    Geometry must be a shapely geometry, a wkt or wkb so the lru cache
    can hash the parameter.
    """
    cells = cells_to_string(geometry_to_cells(geometry, cell_resolution))
    return pl.LazyFrame({"cell": cells})


@lru_cache
def load_meta(path: str) -> MultiDatasetMeta:
    with open(path) as f:
        raw = f.read()
    meta = MultiDatasetMeta.model_validate_json(raw)
    return meta


class H3TilesRepository:
    def __init__(
        self,
        grid_url: str,
        tile_to_cell_res_change: int,
    ):
        self.url = grid_url
        self.tile_to_cell_res_change = tile_to_cell_res_change

    @staticmethod
    def _parse_tile_index(tile_index: str) -> int:
        try:
            z = h3.get_resolution(tile_index)
        except (H3CellInvalidError, ValueError) as e:
            raise InvalidH3CellError from e
        return z

    def tile(self, tile_index: str, columns: list[str]) -> tuple[pl.LazyFrame, int]:
        z = self._parse_tile_index(tile_index)
        tile_path = os.path.join(self.url, f"{z}/{tile_index}.arrow")
        if not os.path.exists(tile_path):
            raise TileNotFoundError("Tile {tile_path} not found")
        tile = pl.scan_ipc(tile_path).select(["cell", *columns])
        return tile, z

    def tile_as_ipc_bytes(self, tile_index: str, columns: list[str]) -> bytes:
        tile, _ = self.tile(tile_index, columns)
        try:
            tile = tile.collect()
        # we don't know if the column requested are correct until we call .collect()
        except pl.exceptions.ColumnNotFoundError:
            raise ColumnNotFoundError from None
        return polars_to_string_ipc(tile)

    def tile_in_area(self, tile_index: str, columns: list[str], geom: BaseGeometry) -> pl.DataFrame:
        tile, tile_level = self.tile(tile_index, columns)
        cells = cells_in_geojson(geom, tile_level + self.tile_to_cell_res_change)
        try:
            tile = tile.join(cells, on="cell").collect()
        # we don't know if the column requested are correct until we call .collect()
        except pl.exceptions.ColumnNotFoundError:
            raise ColumnNotFoundError from None
        if tile.is_empty():
            raise TileNotFoundError
        return tile

    def tile_in_area_as_ipc_bytes(self, tile_index: str, columns: list[str], geom: BaseGeometry) -> bytes:
        tile = self.tile_in_area(tile_index, columns, geom)
        return polars_to_string_ipc(tile)

    def get_meta(self) -> MultiDatasetMeta:
        """Get the grid dataset metadata file"""
        meta_path = os.path.join(self.url, "meta.json")
        try:
            meta = load_meta(meta_path)
        except FileNotFoundError as e:
            log.exception("Metadata file does not exist", e)
            raise MetadataError from e
        except ValidationError as e:
            log.exception("Metadata file is not valid", e)
            raise MetadataError from e
        return meta

    def meta_for_region(self, geom: BaseGeometry, columns: list[str], tile_level: int) -> MultiDatasetMeta:
        """Get the metadata and update it with the zonal stats of the geometry"""
        meta = self.get_meta().model_dump()
        tiles_path = os.path.join(self.url, str(tile_level))

        # get all cells in the geometry
        geom_cells = cells_in_geojson(geom, tile_level + self.tile_to_cell_res_change)

        # get the parents at tile level resolution
        tiles_in_geom = pl.Series(
            geom_cells.collect()  # early collect because h3ronpy is causing trubles with dtypes
            .select(pl.col("cell").h3.cells_parse().h3.change_resolution(tile_level).h3.cells_to_string())
            .unique()
        ).to_list()
        tile_files = [os.path.join(tiles_path, tile + ".arrow") for tile in tiles_in_geom]
        lf = pl.scan_ipc(tile_files)
        if columns:
            lf = lf.select(["cell", *columns])

        # keep the cells that are only in geometry
        lf = lf.join(geom_cells, on="cell")

        try:  # exception will araise in the collect
            maxs = lf.select(pl.selectors.numeric().max()).collect()
            mins = lf.select(pl.selectors.numeric().min()).collect()
        except FileNotFoundError:
            raise TileNotFoundError from None

        for dataset in meta["datasets"]:
            column = dataset["var_name"]
            if dataset["legend"]["legend_type"] == "categorical":
                continue
            stats = dataset["legend"]["stats"][0]
            stats["min"] = mins.select(pl.col(column)).item()
            stats["max"] = maxs.select(pl.col(column)).item()
        return MultiDatasetMeta.model_validate(meta)

    def get_table(self, tile_level: int, filters: TableFilters, geom: BaseGeometry | None) -> TableResults:
        """Query tile dataset and return table data"""
        tiles_path = os.path.join(self.url, str(tile_level))

        all_cells = pl.scan_ipc(tiles_path + "/*.arrow")
        if geom is not None:
            cell_res = tile_level + self.tile_to_cell_res_change
            cells_in_geom = cells_in_geojson(geom, cell_res)
            all_cells = all_cells.join(cells_in_geom, on="cell")

        query = filters.to_sql_query("frame")  # "frame" is the name of the table in polars sql engine
        try:
            res = pl.SQLContext(frame=all_cells).execute(query).collect()
        except pl.exceptions.ColumnNotFoundError as e:  # bad column in order by clause
            raise ColumnNotFoundError from e
        except pl.exceptions.ComputeError as e:  # raised if wrong type in compare.
            raise FilterError(str(e)) from e
        columns = res.to_dict(as_series=False)
        table = [TableResultColumn(column=k, values=v) for k, v in columns.items() if k != "cell"]
        return TableResults(table=table, cells=columns["cell"])
