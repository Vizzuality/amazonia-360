# Amazonia360+ API

## Python setup

### Production

Use the `requirements.txt` file to install the required packages.

```bash
pip install -r requirements.txt
```

### Development

We use and recommend [pip-tools](https://pip-tools.readthedocs.io/en/stable/) or [uv](https://github.com/astral-sh/uv) to manage the dependencies.

First create a virtual environment with virtualenv or uv.

Then install the dependencies with the following command:

```bash
pip-sync requirements.txt requirements-dev.txt
```

or with `uv`:

```bash
uv pip sync requirements.txt requirements-dev.txt
```

To add a new production dependency, add it to the `requirements.in` file and
run `uv pip compile requirements.in -o requirements.txt` (or `pip-compile requirements.in -o requirements.txt`).
To add a new development dependency repeat the same process with the `requirements-dev.in` and `requirement-dev.txt` file.
