"""Convert a raster to h3 chunks."""

from enum import Enum
from math import ceil
from pathlib import Path
from typing import Annotated, Iterator

import polars as pl
import rasterio as rio
import typer
from h3ronpy.polars.raster import nearest_h3_resolution, raster_to_dataframe
from rasterio.windows import Window
from rich import print
from rich.progress import Progress

cli = typer.Typer(pretty_exceptions_short=True, pretty_exceptions_show_locals=False)


class AvailableAggFunctions(str, Enum):  # noqa: D101
    sum = "sum"
    mean = "mean"
    count = "count"  # type: ignore
    relative_area = "relative_area"


def chunk_generator(splits: int, height: int, width: int) -> Iterator[Window]:
    """Window generator for a given number of splits of a raster with width and height

    For example, using splits = 2 and raster with height and width of 512,
    will provide 4 windows of 256 as:

           256     256
        +-------+-------+
        |       |       |  256
        |       |       |
        +-------+-------+
        |       |       |  256
        |       |       |
        +-------+-------+
    """

    h_chunk_size = ceil(height / splits)
    w_chunk_size = ceil(width / splits)
    for j in range(splits):
        row_offset = j * h_chunk_size
        for i in range(splits):
            col_offset = i * w_chunk_size
            yield (i, j), Window(col_offset, row_offset, w_chunk_size, h_chunk_size)


def aggregate_cells(
    df: pl.LazyFrame, h3res: int, agg_func: str, h3index_col_name: str
) -> pl.LazyFrame:
    """Computes h3 aggregation of `df` at `h3res`.
    Returns columns in the order h3index, value.
    """
    agg_expression = pl.col("value")
    if agg_func == "sum":
        agg_expression = agg_expression.sum()
    elif agg_func == "mean":
        agg_expression = agg_expression.mean()
    elif agg_func == "count":
        agg_expression = agg_expression.count()
    elif agg_func == "relative_area":
        agg_expression = (
            (pl.col(h3index_col_name).h3.cells_area_km2() * pl.col("value")).sum()
            / pl.col("area_parent").first()
        ).cast(pl.Float64)
    else:
        raise ValueError(f"`agg_func` {agg_func} not found.")

    overview = (
        df.with_columns(
            pl.col(h3index_col_name).h3.change_resolution(h3res).alias("h3index_parent")
        )
        .group_by("h3index_parent")
        .agg(value=agg_expression)
    )
    return overview.select(
        [pl.col("h3index_parent").alias(h3index_col_name), pl.col("value")]
    )


@cli.command()
def main(
    input_file: Path,
    output_path: Path,
    nodata: Annotated[int, typer.Option(help="Set nodata value.")] = 0,
    agg_func: Annotated[
        AvailableAggFunctions, typer.Option(help="Overview aggregation function.")
    ] = AvailableAggFunctions.mean,
    splits: Annotated[
        int,
        typer.Option(
            help="Dive and process the raster in chunks to reduce the memory usage."
        ),
    ] = 2,
    use_hex: Annotated[
        bool, typer.Option(help="Output h3 index as hex string.")
    ] = False,
    h3_res: Annotated[int, typer.Option(help="Output h3 resolution.")] = None,
) -> None:
    """Convert a raster to a h3 file."""
    seen_tiles = set()

    with rio.open(input_file) as src:
        h3res = (
            h3_res
            if h3_res is not None
            else nearest_h3_resolution(src.shape, src.transform)
        )
        n_chunks = splits**2

        # Resolution of the tile index. A tile is a h3 cell that contains all the
        # cells that are 5 resolutions below it.
        tile_index_res = h3res - 5

        output_path_base = output_path / str(tile_index_res)
        output_path_base.mkdir(exist_ok=True, parents=True)

        progress = Progress(transient=True)
        progress.start()
        read_chunk_task = progress.add_task("Sampling raster to h3", total=n_chunks)

        for i, (_, window) in enumerate(chunk_generator(splits, src.height, src.width)):
            progress.update(
                read_chunk_task, description=f"Processing chunk {i+1} of {n_chunks}"
            )
            data = src.read(1, window=window)
            win_transform = src.window_transform(window)
            nodata = nodata if nodata is not None else src.nodata
            df = raster_to_dataframe(
                data,
                win_transform,
                h3res,
                nodata_value=nodata,
                compact=False,
            )

            df = (
                df.with_columns(
                    pl.col("cell").h3.change_resolution(tile_index_res).alias("tile")
                )
                .filter(
                    pl.col("value") > 0  # NOTE: shouldn't it be dealt with nodata?
                )
                .unique(subset=["cell"])
            )
            if use_hex:
                df = df.with_columns(
                    pl.col("cell").cast(pl.Utf8).h3.cells_parse().h3.cells_to_string()
                )

            partition_dfs = df.partition_by(["tile"], as_dict=True, include_key=False)
            write_task = progress.add_task(
                "Writing tiles", total=len(partition_dfs.items()), visible=True
            )
            for tile_group, tile_df in partition_dfs.items():
                tile_id = tile_group[0]
                filename = output_path_base / (hex(tile_id)[2:] + ".arrow")
                if tile_id in seen_tiles:
                    pl.concat([pl.read_ipc(filename), tile_df]).unique(
                        subset=["cell"]
                    ).write_ipc(filename)
                else:
                    tile_df.write_ipc(filename)
                seen_tiles.add(tile_id)
                progress.update(write_task, advance=1)

            progress.update(write_task, visible=False)
            progress.update(read_chunk_task, advance=1)

        progress.stop()
        print("")

        # while tile_index_res >= 0:
        #     overview_res = tile_index_res + 5
        #
        #     if (
        #         overview_res < h3res
        #     ):  # aggregate to correct overview resolution if not the first write
        #         print(f"Aggregating to resolution {overview_res}")
        #         df = aggregate_cells(
        #             df, overview_res, agg_func.value, h3index_col_name="cell"
        #         ).with_columns(
        #             pl.col("cell").h3.change_resolution(tile_index_res).alias("tile")
        #         )
        #
        #     overview_output_path = output_path / str(tile_index_res)
        #     overview_output_path.mkdir(exist_ok=True, parents=True)
        #
        #     # make tiles
        #     partition_dfs = df.partition_by(["tile"], as_dict=True, include_key=False)
        #
        #     for tile_group, tile_df in track(
        #         partition_dfs.items(), description="Writing tiles"
        #     ):
        #         if tile_df.shape[0] == 0:  # todo: skip empty tiles ?
        #             continue
        #         tile_id = tile_group[0]
        #         filename = overview_output_path / (hex(tile_id)[2:] + ".arrow")
        #         if tile_id in seen_tiles:
        #             pl.concat([pl.read_ipc(filename), tile_df]).unique(
        #                 subset=["cell"]
        #             ).write_ipc(filename)
        #         else:
        #             tile_df.write_ipc(filename)
        #         seen_tiles.add(tile_id)
        #
        #     tile_index_res -= 1


if __name__ == "__main__":
    cli()
