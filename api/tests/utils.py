from fastapi.testclient import TestClient

from app.main import app

test_client = TestClient(app)
