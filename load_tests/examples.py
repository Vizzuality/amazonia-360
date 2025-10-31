"""
Advanced examples for parametric request definitions.

This module demonstrates various patterns for creating dynamic, parametric
request definitions that can be used in load testing scenarios.
"""

from typing import Any

from request_specs import AuthType, HttpMethod, RequestDefinition


# Example 1: Simple parametric request with single parameter
def get_user_by_id(user_id: int) -> RequestDefinition:
    """Get a specific user by ID.

    Args:
        user_id: The user ID to fetch

    Returns:
        RequestDefinition for getting a user
    """
    return RequestDefinition(
        name=f"GET /api/users/{user_id}",
        method=HttpMethod.GET,
        path=f"/api/users/{user_id}",
        auth_type=AuthType.TOKEN,
    )


# Example 2: Request with multiple query parameters
def get_reports_filtered(
    start_date: str,
    end_date: str,
    status: str = "active",
    limit: int = 100,
) -> RequestDefinition:
    """Get filtered reports with query parameters.

    Args:
        start_date: Start date for filtering (ISO format)
        end_date: End date for filtering (ISO format)
        status: Report status filter
        limit: Maximum number of results

    Returns:
        RequestDefinition with query parameters
    """
    query_params = (
        f"start_date={start_date}&end_date={end_date}&status={status}&limit={limit}"
    )

    return RequestDefinition(
        name=f"GET /api/reports (filtered {status})",
        method=HttpMethod.GET,
        path=f"/api/reports?{query_params}",
        auth_type=AuthType.BASIC,
    )


# Example 3: POST request with complex GeoJSON payload
def create_area_of_interest(
    name: str,
    coordinates: list[list[float]],
    buffer_km: float = 0,
) -> RequestDefinition:
    """Create an area of interest with GeoJSON geometry.

    Args:
        name: Name of the area
        coordinates: List of [longitude, latitude] coordinates
        buffer_km: Buffer distance in kilometers

    Returns:
        RequestDefinition for creating an AOI
    """
    # Construct GeoJSON payload
    payload = {
        "type": "Feature",
        "properties": {
            "name": name,
            "buffer": buffer_km * 1000,  # Convert to meters
            "created_at": "{{$timestamp}}",  # Could be replaced at runtime
        },
        "geometry": {
            "type": "Polygon" if len(coordinates) > 2 else "Point",
            "coordinates": coordinates,
        },
    }

    return RequestDefinition(
        name=f"POST /api/aoi (name={name})",
        method=HttpMethod.POST,
        path="/api/areas-of-interest",
        auth_type=AuthType.TOKEN,
        payload=payload,
    )


# Example 4: Request with external file payload
def upload_geojson_file(
    file_path: str,
    feature_type: str = "polygon",
) -> RequestDefinition:
    """Upload a GeoJSON file from disk.

    Note: The payload would need to be loaded from file at runtime.

    Args:
        file_path: Path to the GeoJSON file
        feature_type: Type of features in the file

    Returns:
        RequestDefinition for file upload
    """
    # In a real scenario, you might load the file content here
    # For now, we'll use a placeholder that indicates where to load from
    payload_placeholder = f"{{LOAD_FROM_FILE: {file_path}}}"

    return RequestDefinition(
        name=f"POST /api/upload ({feature_type})",
        method=HttpMethod.POST,
        path="/api/upload/geojson",
        auth_type=AuthType.TOKEN,
        payload=payload_placeholder,
        headers={"Content-Type": "application/geo+json"},
    )


# Example 5: Batch request generator
def generate_indicator_requests(
    indicator_ids: list[int],
    bbox: str,
) -> list[RequestDefinition]:
    """Generate multiple request definitions for a list of indicators.

    Args:
        indicator_ids: List of indicator IDs to fetch
        bbox: Bounding box coordinates

    Returns:
        List of RequestDefinitions, one for each indicator
    """
    requests = []

    for indicator_id in indicator_ids:
        req = RequestDefinition(
            name=f"GET /api/indicators/{indicator_id}",
            method=HttpMethod.GET,
            path=f"/api/indicators/{indicator_id}?bbox={bbox}",
            auth_type=AuthType.BASIC,
        )
        requests.append(req)

    return requests


# Example 6: Request with different payloads based on environment
def create_test_data(environment: str = "staging") -> RequestDefinition:
    """Create test data with environment-specific payloads.

    Args:
        environment: Target environment (staging, production, etc.)

    Returns:
        RequestDefinition with environment-appropriate data
    """
    # Different payloads for different environments
    payloads = {
        "staging": {
            "test_mode": True,
            "data_size": "small",
            "items": ["test1", "test2"],
        },
        "production": {
            "test_mode": False,
            "data_size": "full",
            "items": ["real_data_1", "real_data_2", "real_data_3"],
        },
    }

    payload = payloads.get(environment, payloads["staging"])

    return RequestDefinition(
        name=f"POST /api/test-data ({environment})",
        method=HttpMethod.POST,
        path="/api/test-data",
        auth_type=AuthType.TOKEN,
        payload=payload,
    )


# Example 7: PATCH request for partial updates
def update_indicator_settings(
    indicator_id: int,
    settings: dict[str, Any],
) -> RequestDefinition:
    """Update specific settings for an indicator.

    Args:
        indicator_id: The indicator to update
        settings: Dictionary of settings to update

    Returns:
        RequestDefinition for partial update
    """
    return RequestDefinition(
        name=f"PATCH /api/indicators/{indicator_id}",
        method=HttpMethod.PATCH,
        path=f"/api/indicators/{indicator_id}",
        auth_type=AuthType.TOKEN,
        payload=settings,
        headers={"Content-Type": "application/json"},
    )


# Example 8: Request with authentication variations
def get_protected_resource(
    resource_id: str,
    use_basic_auth: bool = False,
) -> RequestDefinition:
    """Get a protected resource with configurable auth type.

    Args:
        resource_id: Resource identifier
        use_basic_auth: If True, use basic auth; otherwise use token auth

    Returns:
        RequestDefinition with appropriate auth type
    """
    return RequestDefinition(
        name=f"GET /api/resources/{resource_id}",
        method=HttpMethod.GET,
        path=f"/api/resources/{resource_id}",
        auth_type=AuthType.BASIC if use_basic_auth else AuthType.TOKEN,
    )


# Example 9: Complex query string builder
def search_locations(
    query: str,
    filters: dict[str, Any] | None = None,
) -> RequestDefinition:
    """Search locations with complex filters.

    Args:
        query: Search query string
        filters: Optional dictionary of filters (e.g., {'type': 'city', 'population_gt': 1000000})

    Returns:
        RequestDefinition with constructed query string
    """
    query_parts = [f"q={query}"]

    if filters:
        for key, value in filters.items():
            query_parts.append(f"{key}={value}")

    query_string = "&".join(query_parts)

    return RequestDefinition(
        name=f"GET /api/search (q={query[:20]}...)",
        method=HttpMethod.GET,
        path=f"/api/search?{query_string}",
        auth_type=AuthType.TOKEN,
    )


# Example usage in get_all_requests():
#
# def get_all_requests() -> list[RequestDefinition]:
#     return [
#         # Static requests
#         get_meta_request(),
#         get_report_request(),
#
#         # Parametric requests with specific values
#         get_user_by_id(user_id=123),
#         get_reports_filtered(
#             start_date="2024-01-01",
#             end_date="2024-12-31",
#             status="completed"
#         ),
#
#         # Create AOI for a specific location
#         create_area_of_interest(
#             name="Amazon Test Area",
#             coordinates=[[-60.0, -3.0], [-59.0, -3.0], [-59.0, -2.0], [-60.0, -2.0], [-60.0, -3.0]],
#             buffer_km=5.0
#         ),
#
#         # Batch requests
#         *generate_indicator_requests(
#             indicator_ids=[1, 2, 3, 4, 5],
#             bbox="-60,-3,-59,-2"
#         ),
#
#         # Environment-specific
#         create_test_data(environment="staging"),
#
#         # With different auth types
#         get_protected_resource("sensitive-data-123", use_basic_auth=True),
#     ]
