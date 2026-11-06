import pytest

from tests.conftest import AUTH, task_by_name


def test_health_needs_no_token(client):
    assert client.get("/health").json() == {"status": "ok"}


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer wrong"}, {"Authorization": "test-token-123"}])
def test_api_rejects_missing_or_bad_token(client, headers):
    assert client.get("/api/tasks", headers=headers).status_code == 401


def test_session_reports_runtime(client):
    assert client.get("/api/session", headers=AUTH).json()["runtime"] == "demo"


def test_system_metrics_shape(client):
    data = client.get("/api/metrics/system", headers=AUTH).json()
    assert {"total", "user", "system", "idle", "cores"} <= data["cpu"].keys()
    assert data["memory"]["total"] >= data["memory"]["used"] > 0


def test_processes_are_real_and_sorted(client):
    rows = client.get("/api/metrics/processes", headers=AUTH).json()
    assert rows and {"pid", "name", "cpu", "memory", "uptime", "type"} <= rows[0].keys()
    keys = [(r["cpu"], r["memory"]) for r in rows]
    assert keys == sorted(keys, reverse=True)


def test_list_tasks_hides_env_values(client):
    db = task_by_name(client, "db")
    assert db["env"] == ["POSTGRES_PASSWORD", "PGDATA"]
    assert db["status"] == "running" and db["uptime"] > 0 and db["cpu"] >= 0


def test_stop_start_restart_kill_cycle(client):
    web = task_by_name(client, "web")
    assert client.post(f"/api/tasks/{web['id']}/stop", headers=AUTH).json()["status"] == "exited"
    assert client.post(f"/api/tasks/{web['id']}/kill", headers=AUTH).status_code == 409  # not running
    assert client.post(f"/api/tasks/{web['id']}/start", headers=AUTH).json()["status"] == "running"
    assert client.post(f"/api/tasks/{web['id']}/restart", headers=AUTH).json()["status"] == "running"
    assert client.post(f"/api/tasks/{web['id']}/kill", headers=AUTH).json()["status"] == "exited"


def test_unknown_action_and_task(client):
    web = task_by_name(client, "web")
    assert client.post(f"/api/tasks/{web['id']}/explode", headers=AUTH).status_code == 404
    assert client.post("/api/tasks/nope/stop", headers=AUTH).status_code == 404


@pytest.mark.parametrize("action", ["stop", "kill", "restart"])
def test_protected_container_cannot_be_stopped(client, action):
    me = task_by_name(client, "rdc-backend")
    assert me["protected"]
    res = client.post(f"/api/tasks/{me['id']}/{action}", headers=AUTH)
    assert res.status_code == 409 and "part of this stack" in res.json()["detail"]
    assert client.delete(f"/api/tasks/{me['id']}", headers=AUTH).status_code == 409


def test_remove(client):
    job = task_by_name(client, "nightly-report")
    assert client.delete(f"/api/tasks/{job['id']}", headers=AUTH).status_code == 204
    assert client.get(f"/api/tasks/{job['id']}", headers=AUTH).status_code == 404


def test_logs_tail(client):
    web = task_by_name(client, "web")
    logs = client.get(f"/api/tasks/{web['id']}/logs?tail=3", headers=AUTH).json()["logs"]
    assert len(logs.strip().splitlines()) == 3


def test_create_needs_a_local_image_then_runs(client):
    spec = {"name": "hello", "image": "busybox:1.36", "cpus": 0.5, "memory_mb": 64,
            "env": {"GREETING": "hi"}, "ports": [{"container_port": 80, "host_port": 18080}]}
    res = client.post("/api/tasks", json=spec, headers=AUTH)
    assert res.status_code == 400 and "pull it first" in res.json()["detail"]

    pulled = client.post("/api/images/pull", json={"ref": "busybox:1.36"}, headers=AUTH).json()
    assert pulled["tags"] == ["busybox:1.36"]
    assert "busybox:1.36" in [t for i in client.get("/api/images", headers=AUTH).json() for t in i["tags"]]

    task = client.post("/api/tasks", json=spec, headers=AUTH).json()
    assert task["managed"] and task["status"] == "running"
    assert task["env"] == ["GREETING"] and task["ports"] == "127.0.0.1:18080->80/tcp"
    assert client.post("/api/tasks", json=spec, headers=AUTH).status_code == 409  # name taken


@pytest.mark.parametrize("patch", [
    {"name": "-bad"}, {"name": "has space"}, {"image": "UPPER/case"}, {"cpus": 0},
    {"memory_mb": 1}, {"env": {"1BAD": "x"}}, {"ports": [{"container_port": 80, "host_port": 80}]},
])
def test_create_validation(client, patch):
    spec = {"name": "ok", "image": "nginx:1.27-alpine", **patch}
    assert client.post("/api/tasks", json=spec, headers=AUTH).status_code == 422


def test_pull_rejects_bad_refs(client):
    assert client.post("/api/images/pull", json={"ref": "rm -rf /"}, headers=AUTH).status_code == 422


def test_back_to_back_cpu_reads_share_one_sample(client):
    a = client.get("/api/metrics/system", headers=AUTH).json()["cpu"]
    b = client.get("/api/metrics/system", headers=AUTH).json()["cpu"]
    assert (a["total"], a["user"]) == (b["total"], b["user"])
