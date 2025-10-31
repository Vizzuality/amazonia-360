import random

h3_grid_tiles = [
    "815f3ffffffffff",
    "815f7ffffffffff",
    "815fbffffffffff",
    "81667ffffffffff",
    "8166fffffffffff",
    "81803ffffffffff",
    "81807ffffffffff",
    "81813ffffffffff",
    "81817ffffffffff",
    "818a3ffffffffff",
    "818a7ffffffffff",
    "818abffffffffff",
    "818afffffffffff",
    "818b3ffffffffff",
    "818b7ffffffffff",
    "818bbffffffffff",
    "818e7ffffffffff",
    "818f3ffffffffff",
    "818f7ffffffffff",
    "81a87ffffffffff",
    "81a8fffffffffff",
    "81b33ffffffffff",
    "81b37ffffffffff",
]


def get_random_h3_tile_id() -> str:
    return random.choice(h3_grid_tiles)
