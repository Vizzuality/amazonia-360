import argparse
import json
import pathlib

import h3ronpy.polars  # noqa F401
import polars as pl

from app.models.grid import MultiDatasetMeta

CELLS_RES = 6
OVERVIEW_LEVEL = CELLS_RES - 5
IGNORE_COLS = ("cell", "tile_id")


def column_to_metadata_json(col: pl.Series) -> dict:
    return {
        "var_name": col.name,
        "var_dtype": str(col.dtype),
        "label": "",
        "description": "",
        "unit": "",
        "legend": {
            "legend_type": "continuous",
            "colormap_name": "viridis",
            "stats": [
                {
                    "level": OVERVIEW_LEVEL,
                    "min": col.min(),
                    "max": col.max(),
                }
            ],
        },
    }


def check_resolution(df: pl.DataFrame) -> None:
    resolution = df.select(pl.col("cell").h3.cells_parse().h3.cells_resolution()).unique()
    if len(resolution) > 1:
        raise ValueError(f"CSV has more than one H3 resolution. found {resolution}")
    if resolution.item() != CELLS_RES:
        raise ValueError(f"H3 resolution must be 6, found {resolution}")


def check_types(df: pl.DataFrame) -> pl.DataFrame:
    """Convert any string type to float"""
    if pl.String in df.select(pl.exclude(IGNORE_COLS)).dtypes:
        df = df.with_columns(pl.selectors.string().exclude(IGNORE_COLS).cast(pl.Float32))
    return df


def main(file: pathlib.Path, outdir: pathlib.Path) -> None:
    df = pl.read_csv(file)
    check_resolution(df)
    df = check_types(df)
    df = df.with_columns(
        pl.col("cell").h3.cells_parse().h3.change_resolution(OVERVIEW_LEVEL).h3.cells_to_string().alias("tile_id"),  # type: ignore[attr-defined]
        pl.col("cell").h3.cells_parse().h3.cells_to_string(),
    )
    partition_dfs = df.partition_by(["tile_id"], as_dict=True, include_key=False)
    # make grid directory structure
    level_path = outdir / str(OVERVIEW_LEVEL)
    level_path.mkdir(exist_ok=True, parents=True)

    metadata = {
        "datasets": [column_to_metadata_json(df[col_name]) for col_name in df.columns if col_name not in IGNORE_COLS],
        "h3_grid_info": [{"level": OVERVIEW_LEVEL, "h3_cells_resolution": CELLS_RES, "h3_cells_count": len(df)}],
    }

    with open(outdir / "meta.json", "w") as f:
        json.dump(MultiDatasetMeta.model_validate(metadata).model_dump(), f)

    seen_tiles = set()
    for tile_group, tile_df in partition_dfs.items():
        tile_id = tile_group[0]
        filename = level_path / (str(tile_id) + ".arrow")
        if tile_id in seen_tiles:
            # debt: would this even ever happen?
            print(f"Tile {tile_id} has already been visited. Appending...")
            tile_df = pl.concat([pl.read_ipc(filename), tile_df], how="vertical_relaxed").unique(subset=["cell"])
            tile_df.write_ipc(filename)
        else:
            seen_tiles.add(tile_id)
            tile_df.write_ipc(filename)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=pathlib.Path)
    parser.add_argument("outdir", type=pathlib.Path)
    args = parser.parse_args()
    main(args.file, args.outdir)
