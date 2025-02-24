# Amazonia360+ API

## Python setup

### Production

This projecty uses `uv`. To install dependencies in a virtual environment use

```bash
uv sync
```
Must be called from inside the `api/` folder. 

### Development

We use and recommend [pip-tools](https://pip-tools.readthedocs.io/en/stable/) or [uv](https://github.com/astral-sh/uv) to manage the dependencies.

First create a virtual environment with virtualenv or uv.

Then install the dependencies with the following command:

```bash
uv sync --dev
```