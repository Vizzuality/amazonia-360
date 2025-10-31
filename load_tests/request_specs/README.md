# Request Specifications Directory

This directory contains modular request definitions for load testing. Each request is defined in its own file for better organization and maintainability.

## Structure

```
request_specs/
├── __init__.py                    # Barrel export - single import point
├── base.py                        # Base models (RequestDefinition, HttpMethod, AuthType)
├── <request_name>.py              # Spec for <request_name>
├── ... etc.                       # More request specifications
├── example_parametric.py.example  # Example of parametric requests
```

## Quick Start

### Import everything you need from one place:

```python
from request_specs import (
    # Base types
    RequestDefinition,
    HttpMethod,
    AuthType,
    # Registry
    get_all_requests,
    # Individual requests
    get_meta_request,
    get_report_request,
)
```

## Adding a New Request

### Step 1: Create a new file

Create a new Python file in this directory. For example, `statistics.py`:

```python
"""
Statistics endpoint request definition.
"""

from .base import AuthType, HttpMethod, RequestDefinition


def get_statistics_request() -> RequestDefinition:
    """Request definition for getting system statistics."""
    return RequestDefinition(
        name="GET /api/statistics",
        method=HttpMethod.GET,
        path="/api/statistics",
        auth_type=AuthType.TOKEN,
    )
```

### Step 2: Import in `__init__.py`

Add the import at the top of `__init__.py`:

```python
from .statistics import get_statistics_request
```

### Step 3: Add to `__all__` list

```python
__all__ = [
    # ... existing items ...
    "get_statistics_request",
]
```

### Step 4: Add to `get_all_requests()`

```python
def get_all_requests() -> list[RequestDefinition]:
    return [
        # ... existing requests ...
        get_statistics_request(),
    ]
```

That's it! The request will automatically become a Locust task.

## Request Types

### Simple GET Request

```python
def get_simple_request() -> RequestDefinition:
    return RequestDefinition(
        name="GET /api/endpoint",
        method=HttpMethod.GET,
        path="/api/endpoint",
        auth_type=AuthType.TOKEN,
    )
```

### POST Request with JSON Payload

```python
def create_item_request() -> RequestDefinition:
    payload = {
        "name": "Test Item",
        "value": 123,
        "metadata": {
            "key": "value"
        }
    }

    return RequestDefinition(
        name="POST /api/items",
        method=HttpMethod.POST,
        path="/api/items",
        auth_type=AuthType.TOKEN,
        payload=payload,
        headers={"Content-Type": "application/json"},
    )
```

### Parametric Request

Accepts parameters to generate different variations:

```python
def get_user_by_id(user_id: int) -> RequestDefinition:
    return RequestDefinition(
        name=f"GET /api/users/{user_id}",
        method=HttpMethod.GET,
        path=f"/api/users/{user_id}",
        auth_type=AuthType.TOKEN,
    )

# Use in get_all_requests():
def get_all_requests() -> list[RequestDefinition]:
    return [
        get_user_by_id(user_id=123),
        get_user_by_id(user_id=456),
    ]
```

### Request with Complex Query String

For readability, build query strings across multiple lines:

```python
def get_filtered_data(
    start_date: str,
    end_date: str,
    status: str = "active",
) -> RequestDefinition:
    query_params = (
        f"start_date={start_date}"
        f"&end_date={end_date}"
        f"&status={status}"
    )

    return RequestDefinition(
        name=f"GET /api/data (status={status})",
        method=HttpMethod.GET,
        path=f"/api/data?{query_params}",
        auth_type=AuthType.BASIC,
    )
```

### Batch Request Generation

Generate multiple requests from a list:

```python
def generate_region_requests(region_ids: list[int]) -> list[RequestDefinition]:
    return [
        RequestDefinition(
            name=f"GET /api/regions/{region_id}",
            method=HttpMethod.GET,
            path=f"/api/regions/{region_id}",
            auth_type=AuthType.TOKEN,
        )
        for region_id in region_ids
    ]

# Use with unpacking in get_all_requests():
def get_all_requests() -> list[RequestDefinition]:
    return [
        # Regular requests
        get_meta_request(),

        # Unpack batch requests
        *generate_region_requests([1, 2, 3, 4, 5]),
    ]
```

## Working with Large Payloads

### Option 1: Multi-line string in Python

```python
def complex_request() -> RequestDefinition:
    query = (
        "topics={...very_long_encoded_data...}"
        "&location={...location_data...}"
        "&filters={...filter_config...}"
    )

    return RequestDefinition(
        name="GET /api/complex",
        method=HttpMethod.GET,
        path=f"/api/complex?{query}",
        auth_type=AuthType.BASIC,
    )
```

### Option 2: Load from external file

```python
import json
from pathlib import Path

def upload_geojson_request() -> RequestDefinition:
    payload_file = Path(__file__).parent / "payloads" / "area.geojson"
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

### Option 3: Generate programmatically

```python
def generate_bulk_data() -> dict:
    return {
        "items": [
            {"id": i, "value": i * 10}
            for i in range(1000)
        ]
    }

def bulk_upload_request() -> RequestDefinition:
    return RequestDefinition(
        name="POST /api/bulk",
        method=HttpMethod.POST,
        path="/api/bulk",
        auth_type=AuthType.TOKEN,
        payload=generate_bulk_data(),
    )
```

## Authentication Types

### Token Authentication (Bearer)

```python
auth_type=AuthType.TOKEN
# Uses: Authorization: Bearer {ACCESS_TOKEN}
```

### Basic Authentication

```python
auth_type=AuthType.BASIC
# Uses: Authorization: Basic {BASE64_ENCODED_CREDENTIALS}
```

### No Authentication

```python
auth_type=AuthType.NONE
# No Authorization header
```

## Best Practices

1. **One request per file**: Keep files focused and easy to navigate
2. **Descriptive names**: Use clear, descriptive names for both files and functions
3. **Document parameters**: Add docstrings explaining what the request does
4. **Group related requests**: Consider creating subdirectories for related endpoints
5. **Use type hints**: Always include return type `-> RequestDefinition`
6. **Keep it simple**: Don't add complex logic to request definitions
7. **Test incrementally**: Add one request at a time and verify it works

## File Naming Conventions

- Use lowercase with underscores: `my_request.py`
- Name should reflect the endpoint or action: `indicators.py`, `create_report.py`
- For parametric requests, use descriptive names: `user_by_id.py`, `filtered_data.py`

## Organizing Large Projects

For projects with many requests, consider organizing into subdirectories:

```
request_specs/
├── __init__.py
├── base.py
├── grid/
│   ├── __init__.py
│   ├── meta.py
│   └── statistics.py
├── reports/
│   ├── __init__.py
│   ├── create.py
│   ├── list.py
│   └── results.py
└── indicators/
    ├── __init__.py
    ├── by_id.py
    └── by_region.py
```

Then import and re-export in the main `__init__.py`:

```python
from .grid import get_meta_request, get_statistics_request
from .reports import create_report_request, get_results_request
from .indicators import get_indicator_by_id, get_indicator_by_region
```

## Examples

See `example_parametric.py.example` for comprehensive examples of:
- Simple parametric requests
- POST requests with complex payloads
- Batch request generation
- Different authentication patterns

To use the examples:
1. Rename `example_parametric.py.example` to `example_parametric.py`
2. Import the functions you want in `__init__.py`
3. Add them to `get_all_requests()`

## Troubleshooting

### Request not appearing in Locust

- Check that the request function is called in `get_all_requests()`
- Verify the import in `__init__.py`
- Make sure it's added to the `__all__` list

### Import errors

- All request files must import from `.base` (with dot prefix)
- Make sure `__init__.py` exists in the directory

### Type errors

- Always use `RequestDefinition` as return type
- Use the `HttpMethod` and `AuthType` enums from `base.py`

## Reference

For more information, see:
- `../DEVELOPMENT.md` - Comprehensive development guide
- `../examples.py` - Advanced patterns and use cases
- `base.py` - Core type definitions
