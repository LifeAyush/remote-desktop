"""In-memory runtime with a few fake containers.

It exists so the API, the UI and the tests run without a Docker daemon. CPU
and memory drift a little on every read so the charts move. The terminal is a
small line-based stub shell, not a real one.
"""

import queue
import random
import threading
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from app.runtime.base import ACTIONS, BadRequest, Conflict, ContainerRuntime, NotFound, Shell
from app.schemas import CreateTask, ImageInfo, Task

MB = 1024 * 1024


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DemoShell(Shell):
    PROMPT = "demo$ "

    def __init__(self, task: Task):
        self.task = task
        self.out: "queue.Queue[bytes]" = queue.Queue()
        self.line = ""
        self.closed = False
        self.out.put(f"Demo shell for {task.name}. Type 'help'.\r\n{self.PROMPT}".encode())

    def read(self) -> bytes:
        return self.out.get()

    def write(self, data: bytes) -> None:
        for ch in data.decode("utf-8", errors="replace"):
            if ch in "\r\n":
                self.out.put(b"\r\n")
                self._run(self.line.strip())
                self.line = ""
            elif ch in "\x7f\b":
                if self.line:
                    self.line = self.line[:-1]
                    self.out.put(b"\b \b")
            elif ch == "\x03":
                self.line = ""
                self.out.put(f"^C\r\n{self.PROMPT}".encode())
            elif ch == "\x04" and not self.line:
                self._run("exit")
            elif ch.isprintable():
                self.line += ch
                self.out.put(ch.encode())

    def _run(self, cmd: str) -> None:
        name, _, arg = cmd.partition(" ")
        replies = {
            "": "",
            "help": "commands: help, hostname, whoami, uname, date, env, echo <text>, exit",
            "hostname": self.task.id,
            "whoami": "root",
            "uname": "Linux",
            "date": _now().strftime("%a %b %d %H:%M:%S UTC %Y"),
            "env": "\r\n".join(self.task.env) or "(none)",
            "echo": arg,
        }
        if name == "exit":
            self.out.put(b"logout\r\n")
            self.close()
            return
        reply = replies.get(name, f"{name}: command not found (this is the demo runtime)")
        self.out.put((reply + "\r\n" if reply else "").encode() + self.PROMPT.encode())

    def resize(self, cols: int, rows: int) -> None:
        pass

    def close(self) -> None:
        if not self.closed:
            self.closed = True
            self.out.put(b"")


class DemoRuntime(ContainerRuntime):
    name = "demo"

    def __init__(self, seed: int = 7):
        self._rng = random.Random(seed)
        self._lock = threading.Lock()
        self._images: Dict[str, ImageInfo] = {}
        self._tasks: Dict[str, Task] = {}
        self._started: Dict[str, datetime] = {}
        for ref, size in [("nginx:1.27-alpine", 48.3), ("redis:7-alpine", 41.2), ("postgres:16-alpine", 274.6), ("python:3.11-slim", 131.9)]:
            self._add_image(ref, size)
        now = _now()
        self._add("web", "nginx:1.27-alpine", "running", now - timedelta(hours=5), "127.0.0.1:8081->80/tcp", ["NGINX_VERSION"], 6 * MB)
        self._add("cache", "redis:7-alpine", "running", now - timedelta(hours=26), "", ["REDIS_VERSION"], 9 * MB)
        self._add("db", "postgres:16-alpine", "running", now - timedelta(days=3), "", ["POSTGRES_PASSWORD", "PGDATA"], 58 * MB)
        self._add("nightly-report", "python:3.11-slim", "exited", now - timedelta(days=1), "", ["REPORT_DATE"], 0)
        self._add("rdc-backend", "remote-desktop-backend", "running", now - timedelta(minutes=12), "", ["API_TOKEN"], 64 * MB, protected=True)

    def _new_id(self) -> str:
        return f"{self._rng.getrandbits(48):012x}"

    def _add_image(self, ref: str, size: float) -> ImageInfo:
        img = ImageInfo(id=self._new_id(), tags=[ref], size_mb=size, created=(_now() - timedelta(days=self._rng.randint(3, 90))).isoformat())
        self._images[ref] = img
        return img

    def _add(self, name, image, status, created, ports, env, memory, protected=False, managed=False) -> Task:
        task = Task(
            id=self._new_id(), name=name, image=image, status=status, created=created.isoformat(),
            ports=ports, network="bridge", env=env, memory=memory, memory_limit=512 * MB,
            managed=managed, protected=protected,
        )
        self._tasks[task.id] = task
        if status == "running":
            self._started[task.id] = created
        return task

    def _live(self, task: Task) -> Task:
        if task.status != "running":
            return task.model_copy(update={"cpu": 0.0, "memory": 0, "uptime": 0})
        base_cpu = (sum(map(ord, task.name)) % 20) / 2 + 0.5
        cpu = round(max(0.0, base_cpu + self._rng.uniform(-1.5, 1.5)), 2)
        mem = max(int(task.memory * self._rng.uniform(0.97, 1.03)), 4 * MB)
        uptime = int((_now() - self._started[task.id]).total_seconds())
        return task.model_copy(update={"cpu": cpu, "memory": mem, "uptime": uptime})

    def _find(self, task_id: str) -> Task:
        for tid, task in self._tasks.items():
            if tid.startswith(task_id) or task.name == task_id:
                return task
        raise NotFound(f"no container {task_id}")

    def list_tasks(self) -> List[Task]:
        with self._lock:
            return [self._live(t) for t in self._tasks.values()]

    def get_task(self, task_id: str) -> Task:
        with self._lock:
            return self._live(self._find(task_id))

    def act(self, task_id: str, action: str) -> Task:
        if action not in ACTIONS:
            raise BadRequest(f"unknown action {action}")
        with self._lock:
            task = self._find(task_id)
            self._guard(task, action)
            if action == "kill" and task.status != "running":
                raise Conflict(f"{task.name} is not running")
            status = "running" if action in ("start", "restart") else "exited"
            if status == "running" and (action == "restart" or task.status != "running"):
                self._started[task.id] = _now()
            task = task.model_copy(update={"status": status})
            self._tasks[task.id] = task
            return self._live(task)

    def remove(self, task_id: str) -> None:
        with self._lock:
            task = self._find(task_id)
            self._guard(task, "remove")
            del self._tasks[task.id]
            self._started.pop(task.id, None)

    def logs(self, task_id: str, tail: int) -> str:
        task = self.get_task(task_id)
        start = datetime.fromisoformat(task.created)
        lines = [
            f"{(start + timedelta(seconds=i * 7)).isoformat()} {task.name}: {msg}"
            for i, msg in enumerate(["starting", "config loaded", "listening", "ready"] + [f"heartbeat {n}" for n in range(1, 40)])
        ]
        return "\n".join(lines[-tail:]) + "\n"

    def list_images(self) -> List[ImageInfo]:
        return sorted(self._images.values(), key=lambda i: i.created, reverse=True)

    def pull_image(self, ref: str) -> ImageInfo:
        if ":" not in ref.rsplit("/", 1)[-1] and "@" not in ref:
            ref += ":latest"
        with self._lock:
            return self._images.get(ref) or self._add_image(ref, round(self._rng.uniform(5, 300), 1))

    def create_task(self, spec: CreateTask) -> Task:
        with self._lock:
            if spec.image not in self._images:
                raise BadRequest(f"image {spec.image} is not on this host; pull it first")
            if any(t.name == spec.name for t in self._tasks.values()):
                raise Conflict(f'the container name "{spec.name}" is already in use')
            ports = ", ".join(f"127.0.0.1:{p.host_port}->{p.container_port}/tcp" for p in spec.ports)
            task = self._add(spec.name, spec.image, "running", _now(), ports, sorted(spec.env), 16 * MB, managed=True)
            task = task.model_copy(update={"memory_limit": spec.memory_mb * MB})
            self._tasks[task.id] = task
            return self._live(task)

    def open_shell(self, task_id: str) -> Shell:
        task = self.get_task(task_id)
        if task.status != "running":
            raise Conflict(f"{task.name} is not running")
        return DemoShell(task)
