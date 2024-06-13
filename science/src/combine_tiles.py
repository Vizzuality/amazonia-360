"""
Tiles must have unique column names and be folders with the format:
```
.
└── tile
    ├── 0
    │   ├── 80a9fffffffffff.arrow
    │   ├── 80b3fffffffffff.arrow
    │   └── ...
    ├── 1
    ├── 2
    └── ...
```
"""

import json
import logging
import math
from pathlib import Path
from typing import Annotated

import polars as pl
import typer
from rich import print
from rich.logging import RichHandler
from rich.progress import track

logging.basicConfig(level=logging.INFO, handlers=[RichHandler()])
log = logging.getLogger("combine_tiles")

cli = typer.Typer(rich_markup_mode="markdown", pretty_exceptions_show_locals=False)


def check_dataset_format(tile_source: Path) -> None:
    """Simple sanity check to ensure that all tile sources are valid."""
    if not tile_source.exists():
        raise FileNotFoundError
    if tile_source.is_file():
        raise ValueError("Tile source should be directory")
    # TODO: Check that tiles are correct format.
    files = []
    for d in tile_source.iterdir():
        if d.is_dir():
            try:
                int(d.name)
            except ValueError as e:
                raise ValueError("Folders in tile source should be integers") from e
        else:
            files.append(d.name)

    if "meta.json" not in files:
        raise ValueError(f"Dataset {tile_source} does not have meta file.")
        # TODO: Check meta schema


def dataset_minmax_level(tile_source: Path) -> tuple[int, int]:
    """Min and max level of tile source."""
    levels = [int(d.name) for d in tile_source.iterdir() if d.is_dir()]
    return min(levels), max(levels)


def make_polars_schema(metas: list[dict]) -> dict:
    """build polars schema from meta files"""
    return {e["var_name"]: e["var_dtype"] for e in metas}


@cli.command()
def main(
    datasets: Annotated[list[Path], typer.Argument()],
    out_path: Annotated[Path, typer.Argument()],
) -> None:
    """Combine different tile sources to a single one.

    The maximum level of tiling of the resulting dataset will be set
    by the dataset with the minimum number of levels. Same for the minimum
    level. Tiles that are only present in one dataset will have only
    one non-null column and the rest will be null values.
    """
    metas = []
    common_min_level = 0
    common_max_level = math.inf
    datasets_to_trim = []
    for dataset in datasets:
        check_dataset_format(dataset)
        min_tile_level, max_tile_level = dataset_minmax_level(dataset)
        common_min_level = max(common_min_level, min_tile_level)
        common_max_level = min(common_max_level, max_tile_level)
        if common_max_level < max_tile_level:
            datasets_to_trim.append((dataset, max_tile_level - common_max_level))
        elif common_min_level > min_tile_level:
            datasets_to_trim.append((dataset, common_min_level - common_min_level))
        with open(dataset / "meta.json") as f:
            metas.extend(json.load(f))

    print(
        f"Combining {len(datasets)} tile sources to a single tile from "
        f"level {common_min_level} to level {common_max_level}"
    )

    if datasets_to_trim:
        print("Tile sources will be trimmed")
        for f, n in datasets_to_trim:
            print(f"\t {f} will loose {n} level")

    for level in range(common_min_level, common_max_level + 1):
        tiles = set()
        for dataset in datasets:
            tiles.update([f.name for f in (dataset / str(level)).glob("*.arrow")])

        for tile_name in track(tiles, description=f"dealing with level {level}", transient=True):
            dfs = []
            for dataset in datasets:
                tile_file = dataset / str(level) / tile_name
                if not tile_file.exists():
                    continue
                dfs.append(pl.scan_ipc(tile_file))
            tile_df = pl.concat(dfs, how="diagonal", parallel=True)
            # Weird chungus oneliner to stack repeated cell indices that does
            # ┌──────┬──────┬──────┐
            # │ cell ┆ b    ┆ c    │
            # │ ---  ┆ ---  ┆ ---  │     ┌──────┬──────┬─────┐
            # │ u64  ┆ f32  ┆ str  │     │ cell ┆ b    ┆ c   │
            # ╞══════╪══════╪══════╡     │ ---  ┆ ---  ┆ --- │
            # │ 1    ┆ 9.0  ┆ null │     │ u64  ┆ f32  ┆ str │
            # │ 2    ┆ 9.0  ┆ null │     ╞══════╪══════╪═════╡
            # │ 3    ┆ 9.0  ┆ null │     │ 1    ┆ 9.0  ┆ a   │
            # │ 1    ┆ null ┆ a    │ ==> │ 2    ┆ 9.0  ┆ b   │
            # │ 2    ┆ null ┆ b    │     │ 3    ┆ 9.0  ┆ c   │
            # │ 3    ┆ null ┆ c    │     │ 4    ┆ null ┆ a   │
            # │ 4    ┆ null ┆ a    │     │ 5    ┆ null ┆ b   │
            # │ 5    ┆ null ┆ b    │     │ 6    ┆ null ┆ c   │
            # │ 6    ┆ null ┆ c    │     └──────┴──────┴─────┘
            # └──────┴──────┴──────┘
            # Must be more idiomatic way to do this
            tile_df = (
                tile_df.group_by("cell", maintain_order=True)
                .all()
                .with_columns(pl.col("*").exclude("cell").list.drop_nulls().list.first())
            )

            out_dataset_path = out_path / str(level)
            out_dataset_path.mkdir(parents=True, exist_ok=True)
            tile_df.collect().write_ipc(out_dataset_path / tile_name, compression="zstd")

    with open(out_path / "meta.json", "w") as f:
        json.dump(metas, f)

    print("Done!")


if __name__ == "__main__":
    cli()
