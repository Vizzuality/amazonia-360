# Amazonia360+ API
Welcome to the Amazonia360+ API documentation. The app is done in python and FastAPI library.

## Dependencies

This project uses `uv`. To make a virtual-environment and install the dependencies use

```bash
uv sync
```

note that this must be called from inside the `api/` folder.


## Running the app

To run the app use:

```bash
uv run uvicorn app.main:app
```

To run the app in development mode use the `--reload` flag.

### In production

Use the `Dockerfile` in the module to build the image and run the app in production environments.
