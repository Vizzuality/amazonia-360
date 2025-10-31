# Development Guide

This guide explains the architecture and development workflow for the load testing framework.

## Architecture Overview

The load testing framework is built with a clean separation of concerns:

```
┌─────────────────────────┐
│   locustfile.py         │  ← Locust entry point (dynamic task generation)
└───────────┬─────────────┘
            │
            ├─→ ┌──────────────────────┐
            │   │ request_specs/       │  ← Request specs (verb, path, payload, auth)
            │   │  ├── __init__.py     │     (modular - one file per request)
            │   │  ├── base.py         │
            │   │  ├── meta.py         │
            │   │  ├── report.py       │
            │   │  └── ...             │
            │   └──────────────────────┘
            │
            └─→ ┌──────────────────────┐
                │ config.py             │  ← Settings (pydantic-settings)
                └──────────────────────┘
                           │
                           └─→ .env file (optional)
```

### Key Components

#### 1. `request_specs/` (Modular Request Definitions)

Request definitions are organized in a modular structure with one file per request:

**Structure:**
- `base.py`: Core models (`RequestDefinition`, `HttpMethod`, `AuthType`)
- `__init__.py`: Barrel export - single import point with `get_all_requests()`
- Individual files: `meta.py`, `report.py`, `indicators.py`, etc.

**Why modular structure?**
- Each request in its own file = easy to find and edit
- Long payloads don't clutter other code
- Easy to add/remove requests (just add/remove file + update `__init__.py`)
- Functions can be parametric (accept arguments for variations)
- Type-safe with Pydantic validation
- Clean barrel import pattern - everything imports from one place

#### 2. `locustfile.py`

Dynamically generates Locust tasks from request definitions:

- Imports from `request_specs` module
- Reads all requests from `get_all_requests()`
- Creates a task method for each request
- Handles HTTP method routing (GET, POST, PUT, etc.)
- Manages authentication headers
- Implements response validation

**Dynamic task generation** means you only need to:
1. Create a new file in `request_specs/` directory
2. Import it in `request_specs/__init__.py`
3. Call it in `get_all_requests()`
4. The task is automatically created when Locust starts

#### 3. `config.py`

Uses `pydantic-settings` for configuration management:

- Loads from `.env` file (if exists)
- Overridden by environment variables
- Type-safe settings with validation
- Computed fields (e.g., `BASE_AUTH_TOKEN`)

## Development Workflow

### Adding a New Request

#### Example 1: Simple GET Request

**Step 1:** Create `request_specs/statistics.py`:

```python
"""Statistics endpoint request definition."""

from .base import AuthType, HttpMethod, RequestDefinition


def get_statistics() -> RequestDefinition:
    """Get system statistics."""
    return RequestDefinition(
        name="GET /api/statistics",
        method=HttpMethod.GET,
        path="/api/statistics",
        auth_type=AuthType.TOKEN,
    )
```

**Step 2:** Import in `request_specs/__init__.py`:

```python
from .statistics import get_statistics
```

**Step 3:** Add to `__all__` and `get_all_requests()`:

```python
__all__ = [
    # ... existing items ...
    "get_statistics",
]

def get_all_requests() -> list[RequestDefinition]:
    return [
        # ... existing requests ...
        get_statistics(),
    ]
```

That's it! The task will be automatically created.

#### Example 2: POST Request with JSON Payload

Create `request_specs/analysis.py`:

```python
"""Analysis creation request definition."""

from .base import AuthType, HttpMethod, RequestDefinition


def create_analysis() -> RequestDefinition:
    """Create a new analysis job."""
    payload = {
        "type": "deforestation",
        "area": {
            "type": "Polygon",
            "coordinates": [
                [[-60.0, -3.0], [-59.0, -3.0], [-59.0, -2.0], [-60.0, -3.0]]
            ],
        },
        "settings": {
            "resolution": "high",
            "years": [2020, 2021, 2022],
        },
    }

    return RequestDefinition(
        name="POST /api/analysis",
        method=HttpMethod.POST,
        path="/api/analysis",
        auth_type=AuthType.TOKEN,
        payload=payload,
    )
```

Then import in `request_specs/__init__.py` and add to `get_all_requests()`.

#### Example 3: Parametric Request

Create `request_specs/indicator_data.py`:

```python
"""Parametric indicator data request."""

from .base import AuthType, HttpMethod, RequestDefinition


def get_indicator_data(
    indicator_id: int,
    bbox: str,
    year: int = 2024
) -> RequestDefinition:
    """Get indicator data for specific parameters."""
    return RequestDefinition(
        name=f"GET /api/indicators/{indicator_id} (year={year})",
        method=HttpMethod.GET,
        path=f"/api/indicators/{indicator_id}?bbox={bbox}&year={year}",
        auth_type=AuthType.BASIC,
    )
```

Import in `request_specs/__init__.py`, then use in `get_all_requests()`:

```python
def get_all_requests() -> list[RequestDefinition]:
    return [
        # Test multiple indicators and years
        get_indicator_data(indicator_id=1, bbox="-60,-3,-59,-2", year=2023),
        get_indicator_data(indicator_id=2, bbox="-60,-3,-59,-2", year=2024),
    ]
```

### Working with Large Payloads

For very large payloads (e.g., complex GeoJSON), you have several options:

#### Option 1: Multi-line strings in Python

Create `request_specs/complex_query.py`:

```python
"""Complex query request with long URL."""

from .base import AuthType, HttpMethod, RequestDefinition


def complex_query_request() -> RequestDefinition:
    # Build the query string across multiple lines for readability
    query_parts = [
        "topics={...long_encoded_string...}",
        "&location={...location_data...}",
        "&aiSummary={...summary_config...}",
    ]
    query_string = "".join(query_parts)

    return RequestDefinition(
        name="GET /api/complex-query",
        method=HttpMethod.GET,
        path=f"/api/query?{query_string}",
        auth_type=AuthType.BASIC,
    )
```

#### Option 2: Load from external file

Create `request_specs/upload_geojson.py`:

```python
"""GeoJSON upload request with external file."""

import json
from pathlib import Path

from .base import AuthType, HttpMethod, RequestDefinition


def upload_geojson_request() -> RequestDefinition:
    # Load payload from file
    payload_file = Path(__file__).parent / "payloads" / "test_area.geojson"
    with open(payload_file) as f:
        payload = json.load(f)

    return RequestDefinition(
        name="POST /api/upload",
        method=HttpMethod.POST,
        path="/api/upload",
        auth_type=AuthType.TOKEN,
        payload=payload,
    )
```

#### Option 3: Generate programmatically

Create `request_specs/bulk_upload.py`:

```python
"""Bulk upload with programmatically generated payload."""

from .base import AuthType, HttpMethod, RequestDefinition


def generate_large_payload() -> dict:
    """Generate a large test payload."""
    return {
        "features": [
            {
                "type": "Feature",
                "id": i,
                "geometry": {
                    "type": "Point",
                    "coordinates": [-60.0 + i*0.1, -3.0 + i*0.1],
                },
                "properties": {"value": i * 10},
            }
            for i in range(1000)  # Generate 1000 features
        ]
    }


def bulk_upload_request() -> RequestDefinition:
    return RequestDefinition(
        name="POST /api/bulk-upload",
        method=HttpMethod.POST,
        path="/api/bulk-upload",
        auth_type=AuthType.TOKEN,
        payload=generate_large_payload(),
    )
```

### Configuration Management

#### Environment Variables

Create or edit `.env` in the `load_tests` directory:

```bash
# .env
TARGET_INSTANCE_BASE_URL=https://dev.amazoniaforever360.org
ACCESS_TOKEN=your_token_here
BASIC_AUTH_CREDENTIALS=username:password
```

#### Runtime Override

Override environment variables when running tests:

```bash
# Override target URL
TARGET_INSTANCE_BASE_URL=https://staging.example.com uv run locust -f locustfile.py

# Override multiple variables
TARGET_INSTANCE_BASE_URL=https://prod.example.com \
ACCESS_TOKEN=prod_token \
uv run locust -f locustfile.py
```

#### Adding New Configuration

1. Add field to `Settings` class in `config.py`:

```python
class Settings(BaseSettings):
    # ... existing fields ...

    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30
```

2. Use in your code:

```python
from config import settings

def my_request() -> RequestDefinition:
    # Can reference settings if needed
    timeout = settings.TIMEOUT_SECONDS
    # ...
```

## Testing Your Changes

### 1. Validate Request Definitions

```bash
# Test that all request definitions load correctly
uv run python -c "from request_specs import get_all_requests; \
  reqs = get_all_requests(); \
  print(f'✓ Loaded {len(reqs)} requests'); \
  [print(f'  - {r.name}') for r in reqs]"
```

### 2. Verify Task Generation

```bash
# Check that tasks are created from definitions
uv run python -c "from locustfile import APIUser; \
  tasks = [m for m in dir(APIUser) if m.startswith('task_')]; \
  print(f'✓ Generated {len(tasks)} tasks'); \
  [print(f'  - {t}') for t in tasks]"
```

### 3. Dry Run with Locust

```bash
# Run a short test to verify everything works
uv run locust -f locustfile.py --headless -u 1 -r 1 -t 10s
```

### 4. Run with Web UI

```bash
# Start Locust web interface
uv run locust -f locustfile.py

# Then open http://localhost:8089 in your browser
```

## Advanced Patterns

### Pattern 1: Request Variants

Generate multiple variants of the same request:

```python
Create `request_specs/bbox_variants.py`:

```python
"""Multiple bounding box variant requests."""

from .base import AuthType, HttpMethod, RequestDefinition


def generate_bbox_variants() -> list[RequestDefinition]:
    """Test different bounding boxes."""
    bboxes = [
        ("small", "-60.1,-3.1,-60.0,-3.0"),
        ("medium", "-61.0,-4.0,-59.0,-2.0"),
        ("large", "-65.0,-6.0,-55.0,-1.0"),
    ]

    return [
        RequestDefinition(
            name=f"GET /api/data (bbox={name})",
            method=HttpMethod.GET,
            path=f"/api/data?bbox={bbox}",
            auth_type=AuthType.TOKEN,
        )
        for name, bbox in bboxes
    ]
```

Import in `request_specs/__init__.py`, then use in `get_all_requests()`:

```python
def get_all_requests() -> list[RequestDefinition]:
    return [
        # ... other requests ...
        *generate_bbox_variants(),  # Unpack the list
    ]
```

### Pattern 2: Conditional Requests

Include/exclude requests based on configuration:

```python
from config import settings

def get_all_requests() -> list[RequestDefinition]:
    requests = [
        get_meta_request(),
        get_report_request(),
    ]

    # Only include admin requests if we have admin credentials
    if settings.ACCESS_TOKEN and "admin" in settings.ACCESS_TOKEN:
        requests.extend([
            get_admin_stats(),
            delete_test_data(),
        ])

    return requests
```

### Pattern 3: Weighted Testing

Different requests can have different frequencies (handled by Locust tasks):

```python
# In locustfile.py, modify task generation to add weights:

def _create_task_method(request_def: RequestDefinition, weight: int = 1):
    """Factory function to create a task method."""

    @task(weight)  # Add weight parameter
    def task_method(self):
        self._make_request(request_def)

    task_method.__name__ = (
        f"task_{request_def.name.replace('/', '_').replace(' ', '_').lower()}"
    )
    return task_method

# Then use different weights:
for req_def in get_all_requests():
    # Heavy traffic on read endpoints
    weight = 10 if req_def.method == HttpMethod.GET else 1
    task_method = _create_task_method(req_def, weight=weight)
    setattr(APIUser, task_method.__name__, task_method)
```

## Best Practices

1. **One request per file**: Keep files focused and easy to navigate
2. **Descriptive file names**: Use clear names like `statistics.py`, `create_report.py`
3. **Use descriptive request names**: The `name` field appears in Locust reports
4. **Parameterize when needed**: Use function arguments for variations
5. **Document your requests**: Add docstrings explaining what each request tests
6. **Import from `.base`**: Always use relative imports in request files
7. **Update barrel exports**: Don't forget to add new requests to `__init__.py`
8. **Version large payloads**: Consider storing them in separate files with version info
9. **Test incrementally**: Add one request at a time and verify it works
10. **Use type hints**: They help catch errors early and improve IDE support

## Troubleshooting

### Issue: Tasks not appearing in Locust

**Solution**:
1. Check that your request function is imported in `request_specs/__init__.py`
2. Verify it's added to the `__all__` list
3. Make sure it's called in `get_all_requests()`

### Issue: Authentication errors

**Solution**: Verify your `.env` file has correct credentials and check `config.py` settings

### Issue: Import errors

**Solution**: Make sure you're using absolute imports (`from config import ...` not `from .config import ...`)

### Issue: Payload too large

**Solution**: Consider loading from external file or generating dynamically

### Issue: Request timing out

**Solution**: Adjust `timeout` in `APIUser` class or make it configurable via settings

## Examples Repository

See these files for comprehensive examples:
- `request_specs/README.md` - Complete guide to the modular structure
- `request_specs/example_parametric.py.example` - Parametric request patterns
- `examples.py` - Advanced patterns and use cases

## Contributing

When adding new functionality:

1. Add examples to `examples.py` if introducing a new pattern
2. Update this guide with your use case
3. Test with both web UI and headless modes
4. Document any new configuration options

## Resources

- [Locust Documentation](https://docs.locust.io/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
