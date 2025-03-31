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

### AI Summary


