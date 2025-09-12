import io
import logging
import os
import pathlib
from collections import defaultdict
from functools import cached_property, lru_cache

import h3
import h3ronpy.polars  # noqa: F401
import polars as pl
import pyarrow as pa
from h3ronpy import cells_to_string
from h3ronpy.vector import ContainmentMode, geometry_to_cells
from obstore.store import from_url
from pydantic import ValidationError
from shapely.geometry.base import BaseGeometry

from app.errors import ColumnNotFoundError, FilterError, MetadataError, TileNotFoundError
from app.models.grid import MultiDatasetMeta, TableFilters, TableResultColumn, TableResults

log = logging.getLogger(__name__)


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
    cells = cells_to_string(geometry_to_cells(geometry, cell_resolution, ContainmentMode.IntersectsBoundary))
    return pl.LazyFrame({"cell": cells})


@lru_cache
def load_meta(path: str) -> MultiDatasetMeta:
    with open(path) as f:
        raw = f.read()
    meta = MultiDatasetMeta.model_validate_json(raw)
    return meta


class H3TilesRepository:
    meta_path = "meta.json"

    def __init__(
        self,
        grid_url: str,
        tile_to_cell_res_change: int,
    ):
        self.url = grid_url
        self.tile_to_cell_res_change = tile_to_cell_res_change
        self.store = from_url(grid_url)

    @cached_property
    def meta(self) -> MultiDatasetMeta:
        try:
            resp = self.store.get(self.meta_path)
            meta = MultiDatasetMeta.model_validate_json(bytes(resp.bytes()))
        except FileNotFoundError as e:
            log.exception("Metadata file does not exist", e)
            raise MetadataError("Metadata file does not exist") from e
        except ValidationError as e:
            log.exception("Metadata file is not valid", e)
            raise MetadataError("Metadata file is not valid") from e
        return meta

    @cached_property
    def available_tiles(self) -> dict[int, set[str]]:
        result = defaultdict(set)
        for list_item in self.store.list().collect():
            list_item = pathlib.Path(list_item["path"])
            if str(list_item) != self.meta_path:
                result[int(list_item.parent.name)].add(list_item.stem)
        return result

    @cached_property
    def available_tiles_flat(self) -> set[str]:
        return {tile for level in self.available_tiles.values() for tile in level}

    def tile(self, tile_index: str, columns: list[str]) -> tuple[pl.LazyFrame, int]:
        z = h3.get_resolution(tile_index)  # also validates that tile index is valid.
        tile_path = os.path.join(self.url, f"{z}/{tile_index}.arrow")
        if tile_index not in self.available_tiles_flat:
            raise TileNotFoundError(f"Tile {tile_path} not found")
        tile = pl.scan_ipc(tile_path).select(["cell", *columns])
        return tile, z

    async def tile_as_ipc_bytes(self, tile_index: str, columns: list[str]) -> bytes:
        tile, _ = self.tile(tile_index, columns)
        try:
            tile = await tile.collect_async()
        # we don't know if the column requested are correct until we call .collect()
        except pl.exceptions.ColumnNotFoundError:
            raise ColumnNotFoundError("One or more of the specified columns is not valid") from None
        return polars_to_string_ipc(tile)

    async def tile_in_area(self, tile_index: str, columns: list[str], geom: BaseGeometry) -> pl.DataFrame:
        tile, tile_level = self.tile(tile_index, columns)
        cells = cells_in_geojson(geom, tile_level + self.tile_to_cell_res_change)
        try:
            tile = await tile.join(cells, on="cell").collect_async()
        # we don't know if the column requested are correct until we call .collect()
        except pl.exceptions.ColumnNotFoundError:
            raise ColumnNotFoundError("One or more of the specified columns is not valid") from None
        return tile

    async def tile_in_area_as_ipc_bytes(self, tile_index: str, columns: list[str], geom: BaseGeometry) -> bytes:
        tile = await self.tile_in_area(tile_index, columns, geom)
        return polars_to_string_ipc(tile)

    async def meta_for_region(self, geom: BaseGeometry, columns: list[str], tile_level: int) -> MultiDatasetMeta:
        """Get the metadata and update it with the zonal stats of the geometry"""
        meta = self.meta.model_dump()
        geom_cells = cells_in_geojson(geom, tile_level + self.tile_to_cell_res_change)
        # get the parents at tile level resolution of the cells in geom
        tiles_in_geom = pl.Series(
            geom_cells.collect()  # early collect because h3ronpy is causing troubles with dtypes
            .select(pl.col("cell").h3.cells_parse().h3.change_resolution(tile_level).h3.cells_to_string())
            .unique()
        ).to_list()
        tile_files = [
            os.path.join(os.path.join(self.url, str(tile_level)), tile + ".arrow")
            for tile in tiles_in_geom
            if tile in self.available_tiles[tile_level]
        ]
        lf = pl.scan_ipc(tile_files)
        if columns:
            lf = lf.select(["cell", *columns])

        # keep the cells that are only in geometry
        lf = lf.join(geom_cells, on="cell")

        try:  # exception will araise in the collect
            maxs = await lf.select(pl.selectors.numeric().max()).collect_async()
            mins = await lf.select(pl.selectors.numeric().min()).collect_async()
        except FileNotFoundError as e:
            raise TileNotFoundError(str(e)) from e

        for dataset in meta["datasets"]:
            column = dataset["var_name"]
            if dataset["legend"]["legend_type"] == "categorical":
                continue
            stats = dataset["legend"]["stats"][0]
            stats["min"] = mins.select(pl.col(column)).item()
            stats["max"] = maxs.select(pl.col(column)).item()
        return MultiDatasetMeta.model_validate(meta)

    async def get_table(self, tile_level: int, filters: TableFilters, geom: BaseGeometry | None) -> TableResults:
        """Query tile dataset and return table data"""
        tiles_path = os.path.join(self.url, str(tile_level))

        all_cells = pl.scan_ipc(tiles_path + "/*.arrow")
        if geom is not None:
            cell_res = tile_level + self.tile_to_cell_res_change
            cells_in_geom = cells_in_geojson(geom, cell_res)
            all_cells = all_cells.join(cells_in_geom, on="cell")

        query = filters.to_sql_query("frame")  # "frame" is the name of the table in polars sql engine
        try:
            res = await pl.SQLContext(frame=all_cells).execute(query).collect_async()
        except pl.exceptions.ColumnNotFoundError as e:  # bad column in order by clause
            raise ColumnNotFoundError from e
        except pl.exceptions.ComputeError as e:  # raised if wrong type in compare.
            raise FilterError(str(e)) from e
        columns = res.to_dict(as_series=False)
        table = [TableResultColumn(column=k, values=v) for k, v in columns.items() if k != "cell"]
        return TableResults(table=table, cells=columns["cell"])
