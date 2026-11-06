import os

os.environ["API_TOKEN"] = "test-token-123"
os.environ["RUNTIME"] = "demo"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TOKEN = os.environ["API_TOKEN"]
AUTH = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture()
def client():
    # A fresh app state (and demo runtime) for every test.
    with TestClient(app) as c:
        yield c


def task_by_name(client, name):
    return next(t for t in client.get("/api/tasks", headers=AUTH).json() if t["name"] == name)
