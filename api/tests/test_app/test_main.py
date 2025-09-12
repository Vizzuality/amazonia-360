from fastapi.routing import APIRoute
from tests.conftest import HEADERS
from tests.utils import test_client


def test_no_token_is_unauthorized():
    response = test_client.get("/grid/meta")
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}


def test_wrong_token_is_unauthorized():
    response = test_client.get("/grid/meta", headers={"Authorization": "Bearer BAD-TOKKI-123"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}


def test_health_is_public():
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_options_request_is_allowed_with_correct_headers():
    headers = {"Access-Control-Request-Method": "GET", "Origin": "http://example.com"}
    response = test_client.options("/grid/meta", headers=headers)
    assert response.status_code == 200
    assert "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT" in response.headers["Access-Control-Allow-Methods"]
    assert "*" in response.headers["Access-Control-Allow-Origin"]


def test_request_with_token(setup_data_folder):
    response = test_client.get("/grid/meta", headers=HEADERS)
    assert response.status_code == 200


def test_all_api_routes_require_token():
    api_routes = {r.path: r.methods for r in test_client.app.routes if isinstance(r, APIRoute)}

    # public endpoints that do not need auth:
    del api_routes["/health"]

    for route, method in api_routes.items():
        res = test_client.request(method.pop(), route)
        assert res.status_code == 401
