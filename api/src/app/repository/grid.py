import io
import os

import h3
import polars as pl
import pyarrow as pa
from h3 import H3CellInvalidError


class InvalidH3CellError(Exception):
    """H3 cell index is not valid"""

    pass


class ColumnNotFoundError(Exception):
    """Column provided does not exist in the dataset"""

    pass


class TileNotFoundError(Exception):
    """Tile does not exist in the dataset"""

    pass


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


class H3TilesRepository:
    def __init__(self, grid_url: str):
        self.url = grid_url

    def get_tile(self, tile_index: str, columns: list[str]) -> tuple[pl.LazyFrame, int]:
        try:
            z = h3.get_resolution(tile_index)
        except (H3CellInvalidError, ValueError) as e:
            raise InvalidH3CellError from e
        tile_path = os.path.join(self.url, f"{z}/{tile_index}.arrow")
        if not os.path.exists(tile_path):
            raise TileNotFoundError("Tile {tile_path} not found")
        tile = pl.scan_ipc(tile_path).select(["cell", *columns])
        return tile, z

    def get_tile_bytes(self, tile_index: str, columns: list[str]) -> bytes:
        tile, _ = self.get_tile(tile_index, columns)
        try:
            tile = tile.collect()
        # we don't know if the column requested are correct until we call .collect()
        except pl.exceptions.ColumnNotFoundError:
            raise ColumnNotFoundError from None
        return polars_to_string_ipc(tile)
