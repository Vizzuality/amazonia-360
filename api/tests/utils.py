from fastapi.testclient import TestClient

from app.config.config import get_settings
from app.main import app

test_client = TestClient(app)


