# AmazoniaForever360+ API

This module contains the api for the h3 grid and the AI summary. It is a FastAPI python app.

## Development

### Dependencies

The dependencies to run the app can be found at `pyproject.toml`. This project uses `uv`. To make a virtual-environment
and install the dependencies use

```bash
uv sync
```

note that this must be called from inside the `api/` folder.

### Test

Testing is done via `pytest`

from within the virtualenv, run it with

```shell
pytest
```

or

```shell
uv run pytest
```

### Linting and formatting

This project uses `ruff`. To format the code use

```shell
ruff format .
```

To lint the code use

```shell
ruff check .
```

### Running the app

To run the app use:

```bash
uv run uvicorn app.main:app
```

To run the app in development mode use the `--reload` flag.

Or use the `docker-compose.yml` from the root of the project to spin only the api service with:

```shell
docker compose up api
```

## Architecture

The application is composed of two main parts: H3 grid service and AI summary service.

### H3 Grid

H3 grid api is a custom map tiling services for h3 data. It implements the following endpoints:
- `/tile/{tile_index}`:  Get an H3 tile in arrow format fot the given `tile_index`
- `/tile/meta`: Get the metadata of the dataset
- `/tile/table`: Query the dataset and get human-readable tabular data.

#### H3 Data Format

The datasets that are consumed by this api are `.arrow` files organized in h3 tiles of resolution 1 that contain all
child cells of resolution 6. Each cell has a number of variables or columns that represent and indicator.

The generation of those h3 tiles is done by transforming and input CSV with all the cells at finest desired resolution.
The code to do can be found at [h3_csv_to_arrow_tiles.ipynb](../science/notebooks/h3_csv_to_arrow_tiles.ipynb).

The tiles location is configured with the env var `GRID_TILES_PATH`. The folder **must follow** the structure:

```
root/                               # GRID_TILES_PATH
 ├── 1/                             # Tile resolution level
 │   ├── 81a8fffffffffff.arrow
 │   └── ...
 └── meta.json                      # Dataset metadata
```

In production, the dataset is copied to the local file system of the instance form performance reasons (to avoid network) calls.
In case the dataset grows larger than a reasonable instance disk size it can be stored in any bucket without the need of
any special refactor in the code.


### AI Summary

Single endpoint application to generate AI summary based on quantitative inputs from the app. The prompt used can be found
at [openai_service.py](src/app/openai_service.py). The endpoint implementation can be found in url `/ai/`.
Note that it needs to have `OPENAI_TOKEN` defined in order to run.


## Production

The production image is defined in [`Dockerfile`](Dockerfile) and deployed with GH actions into the infrastructure
defined in [`infrastructure/`](../infrastructure).
