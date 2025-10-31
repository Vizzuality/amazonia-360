# load-testing

PoC Load Testing framework using [Locust](https://locust.io/) and [uv](https://github.com/astral-sh/uv) package manager.

## Setup

This project uses `uv` for dependency management and `ruff` for code linting.

### Prerequisites

- Python 3.14
- uv package manager

### Installation

Install dependencies:
   ```bash
   uv sync
   ```

## Usage

### Running Load Tests with WebUI

```bash
uv run locust -f locustfile.py
```

### Available Scenarios

- **Basic** (`locustfile.py`): Web application load testing with different user types
- **API** (`tests/scenarios/api_scenario.py`): REST API testing with various HTTP methods (not implemented yet)

## Configuration

The project uses `pyproject.toml` for configuration:

- **Dependencies**: Regular dependencies in `[project.dependencies]`
- **Dev Dependencies**: Development tools in `[dependency-groups.dev]`
- **Ruff Settings**: Code linting and formatting in `[tool.ruff]`
