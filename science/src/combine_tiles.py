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

import math
from pathlib import Path
from typing import Annotated

import typer
from rich import print

cli = typer.Typer(rich_markup_mode="markdown")


def check_correct_tiles_format(tile_source: Path) -> None:
    """Simple sanity check to ensure that all tile sources are valid."""
    if not tile_source.exists():
        raise FileNotFoundError
    if tile_source.is_file():
        raise ValueError("Tile source should be directory")
    # TODO: Check that tiles are correct format.
    for d in tile_source.iterdir():
        if d.is_dir():
            try:
                int(d.name)
            except ValueError as e:
                raise ValueError("Folders in tile source should be integers") from e


def tiles_level(tile_source: Path) -> tuple[int, int]:
    """Min and max level of tile source."""
    levels = [int(d.name) for d in tile_source.iterdir() if d.is_dir()]
    return min(levels), max(levels)


@cli.command()
def main(filenames: Annotated[list[Path], typer.Argument()]) -> None:
    """Combine different tile sources to a single one
    with n columns (one per tile source)."""
    common_min_level = 0  # normally will be 0 or 1, the coarser resolution
    common_max_level = (
        math.inf
    )  # depends on the dataset and will be set to the coarser level
    trimmed_tile_source = []
    for file in filenames:
        check_correct_tiles_format(file)
        min_tile_level, max_tile_level = tiles_level(file)
        common_min_level = max(common_min_level, min_tile_level)
        common_max_level = min(common_max_level, max_tile_level)
        if common_max_level < max_tile_level:
            trimmed_tile_source.append((file, max_tile_level - common_max_level, True))
        elif common_min_level > min_tile_level:
            trimmed_tile_source.append(
                (file, common_min_level - common_min_level, False)
            )

    print(
        f"Combingin {len(filenames)} tile sources to a single tile from "
        f"level {common_min_level} to level {common_max_level}"
    )


if __name__ == "__main__":
    cli()
