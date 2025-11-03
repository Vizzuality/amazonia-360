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

- **API** (`locustfile.py`): API load testing with dynamically generated tasks from request definitions

## Project Structure

```
load_tests/
├── config.py                  # Configuration using pydantic-settings
├── request_specs/             # Modular HTTP request definitions
│   ├── __init__.py           # Barrel export - single import point
│   ├── base.py               # Core models (RequestDefinition, etc.)
│   ├── meta.py               # Grid metadata request
│   ├── report.py             # Report grid request
│   ├── indicators.py         # Indicators request
│   └── results.py            # Results request
├── locustfile.py             # Locust test execution
├── examples.py               # Advanced parametric request examples
├── .env                      # Environment variables (create from .env.example)
└── .env.example              # Example environment variables
```

### Request Definitions

HTTP requests are defined in the `request_specs/` directory using Pydantic models. Each request has its own file for better organization. The `request_specs/__init__.py` provides a single import point (barrel export pattern).

**Basic structure** - Create `request_specs/my_request.py`:

```python
"""My endpoint request definition."""

from .base import AuthType, HttpMethod, RequestDefinition


def get_my_request() -> RequestDefinition:
    """Request definition for my endpoint."""
    return RequestDefinition(
        name="GET /api/my-endpoint",
        method=HttpMethod.GET,
        path="/api/my-endpoint",
        auth_type=AuthType.TOKEN,
    )
```

Then import in `request_specs/__init__.py` and add to `get_all_requests()`.

**Parametric requests** - Create `request_specs/user_by_id.py`:

```python
"""User by ID request definition."""

from .base import AuthType, HttpMethod, RequestDefinition


def get_custom_request(user_id: str, limit: int = 10) -> RequestDefinition:
    """Parametric request with custom parameters."""
    return RequestDefinition(
        name=f"GET /api/users/{user_id}",
        method=HttpMethod.GET,
        path=f"/api/users/{user_id}?limit={limit}",
        auth_type=AuthType.BASIC,
    )
```

Import and use with specific parameters in `get_all_requests()`.

**POST requests with payloads** - Create `request_specs/create_item.py`:

```python
"""Item creation request definition."""

from .base import AuthType, HttpMethod, RequestDefinition


def create_item_request(item_data: dict) -> RequestDefinition:
    """POST request with JSON payload."""
    return RequestDefinition(
        name="POST /api/items",
        method=HttpMethod.POST,
        path="/api/items",
        auth_type=AuthType.TOKEN,
        payload=item_data,
    )
```

**Adding new requests:**

1. Create a new file in `request_specs/` directory (e.g., `my_request.py`)
2. Define your request function that returns a `RequestDefinition`
3. Import it in `request_specs/__init__.py`
4. Add to the `__all__` list
5. Add the function call to `get_all_requests()`
6. Run locust - the task will be automatically generated

See `request_specs/README.md` for detailed examples and patterns.

### Configuration

The project uses multiple configuration methods:

- **Environment Variables**: Managed via `pydantic-settings` in `config.py`
  - Variables loaded from `.env` file (if present)
  - Overridden by process environment variables
  - Available variables: `TARGET_INSTANCE_BASE_URL`, `ACCESS_TOKEN`, `BASIC_AUTH_CREDENTIALS`

- **Dependencies**: Regular dependencies in `[project.dependencies]`
- **Dev Dependencies**: Development tools in `[dependency-groups.dev]`
- **Ruff Settings**: Code linting and formatting in `[tool.ruff]`

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```
   TARGET_INSTANCE_BASE_URL=https://your-instance.com
   ACCESS_TOKEN=your-token-here
   BASIC_AUTH_CREDENTIALS=username:password
   ```

3. You can override any variable at runtime:
   ```bash
   TARGET_INSTANCE_BASE_URL=https://staging.example.com uv run locust -f locustfile.py
   ```
