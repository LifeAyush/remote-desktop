import json

import pytest
from starlette.websockets import WebSocketDisconnect

from tests.conftest import TOKEN, task_by_name


def read_until(ws, needle, limit=50):
    seen = ""
    for _ in range(limit):
        seen += ws.receive_text()
        if needle in seen:
            return seen
    raise AssertionError(f"{needle!r} not in {seen!r}")


def test_shell_round_trip(client):
    web = task_by_name(client, "web")
    with client.websocket_connect(f"/ws/terminal/{web['id']}") as ws:
        ws.send_text(json.dumps({"type": "auth", "token": TOKEN}))
        read_until(ws, "demo$ ")
        ws.send_text(json.dumps({"type": "resize", "cols": 100, "rows": 30}))
        ws.send_text(json.dumps({"type": "input", "data": "hostname\r"}))
        assert web["id"] in read_until(ws, web["id"])
        ws.send_text(json.dumps({"type": "input", "data": "exit\r"}))
        read_until(ws, "logout")
        with pytest.raises(WebSocketDisconnect) as exc:
            for _ in range(5):
                ws.receive_text()
        assert exc.value.code == 1000


@pytest.mark.parametrize("first", [{"type": "auth", "token": "wrong"}, {"type": "input", "data": "ls"}])
def test_shell_requires_auth_first(client, first):
    web = task_by_name(client, "web")
    with client.websocket_connect(f"/ws/terminal/{web['id']}") as ws:
        ws.send_text(json.dumps(first))
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
        assert exc.value.code == 4401


def test_shell_on_stopped_container_is_refused(client):
    job = task_by_name(client, "nightly-report")
    with client.websocket_connect(f"/ws/terminal/{job['id']}") as ws:
        ws.send_text(json.dumps({"type": "auth", "token": TOKEN}))
        assert "not running" in ws.receive_text()
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
        assert exc.value.code == 4409
