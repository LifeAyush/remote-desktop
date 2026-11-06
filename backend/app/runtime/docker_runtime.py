import logging
import os
import socket
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import docker
from docker.errors import APIError, ImageNotFound, NotFound as DockerNotFound
from docker.utils import parse_repository_tag

from app.runtime.base import ACTIONS, BadRequest, Conflict, ContainerRuntime, NotFound, Shell
from app.schemas import CreateTask, ImageInfo, Task

logger = logging.getLogger(__name__)

MANAGED_LABEL = "rdc.managed"
PROTECTED_LABEL = "rdc.protected"
SHELL_CMD = ["/bin/sh", "-c", "if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi"]


def _parse_time(value: str) -> Optional[datetime]:
    if not value or value.startswith("0001-"):
        return None
    # Docker uses RFC 3339 with nanoseconds; Python wants at most microseconds.
    head, _, frac = value.rstrip("Z").partition(".")
    try:
        return datetime.fromisoformat(f"{head}.{frac[:6] or '0'}+00:00")
    except ValueError:
        return None


def cpu_percent(stats: dict) -> float:
    """Same formula as `docker stats`."""
    try:
        cpu, pre = stats["cpu_stats"], stats["precpu_stats"]
        cpu_delta = cpu["cpu_usage"]["total_usage"] - pre["cpu_usage"]["total_usage"]
        sys_delta = cpu["system_cpu_usage"] - pre.get("system_cpu_usage", 0)
        cores = cpu.get("online_cpus") or len(cpu["cpu_usage"].get("percpu_usage") or [1])
    except (KeyError, TypeError):
        return 0.0
    if cpu_delta <= 0 or sys_delta <= 0:
        return 0.0
    return round(cpu_delta / sys_delta * cores * 100.0, 2)


def memory_usage(stats: dict) -> Tuple[int, int]:
    """(used bytes, limit bytes), excluding page cache like `docker stats`."""
    mem = stats.get("memory_stats") or {}
    usage = mem.get("usage", 0)
    inner = mem.get("stats") or {}
    cache = inner.get("inactive_file", inner.get("total_inactive_file", 0))
    return max(usage - cache, 0), mem.get("limit", 0)


def format_ports(ports: Optional[dict]) -> str:
    out = []
    for container_port, bindings in sorted((ports or {}).items()):
        if not bindings:
            out.append(container_port)
            continue
        for b in bindings:
            host = b.get("HostIp", "")
            prefix = f"{host}:" if host not in ("", "0.0.0.0", "::") else ""
            out.append(f"{prefix}{b.get('HostPort')}->{container_port}")
    return ", ".join(dict.fromkeys(out))


class DockerShell(Shell):
    def __init__(self, api, exec_id: str, sock):
        self.api = api
        self.exec_id = exec_id
        self.sock = sock
        self.raw: socket.socket = getattr(sock, "_sock", sock)

    def read(self) -> bytes:
        try:
            return self.raw.recv(4096)
        except OSError:
            return b""

    def write(self, data: bytes) -> None:
        self.raw.sendall(data)

    def resize(self, cols: int, rows: int) -> None:
        try:
            self.api.exec_resize(self.exec_id, height=rows, width=cols)
        except APIError as exc:
            logger.debug("resize failed: %s", exc)

    def close(self) -> None:
        for fn in (lambda: self.raw.shutdown(socket.SHUT_RDWR), self.raw.close, self.sock.close):
            try:
                fn()
            except Exception:
                pass


class DockerRuntime(ContainerRuntime):
    name = "docker"

    def __init__(self, publish_host: str = "127.0.0.1", stats_interval: float = 2.0, client=None):
        self.client = client or docker.from_env()
        self.api = self.client.api
        self.publish_host = publish_host
        self.stats_interval = stats_interval
        self.own_id = os.environ.get("HOSTNAME", "")
        self._stats: Dict[str, Tuple[float, int, int]] = {}
        self._stop = threading.Event()
        self._pool = ThreadPoolExecutor(max_workers=8, thread_name_prefix="stats")
        self._thread: Optional[threading.Thread] = None

    # -- lifecycle -----------------------------------------------------------

    def start(self) -> None:
        self.client.ping()
        self._thread = threading.Thread(target=self._sample_loop, name="stats-sampler", daemon=True)
        self._thread.start()

    def close(self) -> None:
        self._stop.set()
        self._pool.shutdown(wait=False, cancel_futures=True)
        self.client.close()

    def _sample_loop(self) -> None:
        while not self._stop.is_set():
            try:
                running = self.client.containers.list(filters={"status": "running"})
                results = self._pool.map(self._sample_one, running)
                self._stats = {cid: s for cid, s in results if s is not None}
            except Exception as exc:
                logger.warning("stats sampling failed: %s", exc)
            self._stop.wait(self.stats_interval)

    @staticmethod
    def _sample_one(container):
        try:
            stats = container.stats(stream=False)
        except Exception:
            return container.id, None
        used, limit = memory_usage(stats)
        return container.id, (cpu_percent(stats), used, limit)

    # -- tasks ---------------------------------------------------------------

    def _container(self, task_id: str):
        try:
            return self.client.containers.get(task_id)
        except DockerNotFound:
            raise NotFound(f"no container {task_id}")

    def _task(self, c) -> Task:
        attrs = c.attrs
        state = attrs.get("State", {})
        labels = c.labels or {}
        started = _parse_time(state.get("StartedAt", ""))
        uptime = 0
        if state.get("Running") and started:
            uptime = int((datetime.now(timezone.utc) - started).total_seconds())
        cpu, mem, limit = self._stats.get(c.id, (0.0, 0, 0))
        networks = list((attrs.get("NetworkSettings", {}).get("Networks") or {}).keys())
        env = [e.partition("=")[0] for e in (attrs.get("Config", {}).get("Env") or [])]
        image = attrs.get("Config", {}).get("Image") or (c.image.tags[0] if c.image and c.image.tags else c.image.short_id)
        return Task(
            id=c.short_id if hasattr(c, "short_id") else c.id[:12],
            name=c.name,
            image=image,
            status=c.status,
            uptime=max(uptime, 0),
            cpu=cpu,
            memory=mem,
            memory_limit=limit,
            created=attrs.get("Created", ""),
            ports=format_ports(attrs.get("NetworkSettings", {}).get("Ports")),
            network=", ".join(networks),
            env=env,
            managed=labels.get(MANAGED_LABEL) == "true",
            protected=labels.get(PROTECTED_LABEL) == "true" or bool(self.own_id and c.id.startswith(self.own_id)),
        )

    def list_tasks(self) -> List[Task]:
        return [self._task(c) for c in self.client.containers.list(all=True)]

    def get_task(self, task_id: str) -> Task:
        return self._task(self._container(task_id))

    def act(self, task_id: str, action: str) -> Task:
        if action not in ACTIONS:
            raise BadRequest(f"unknown action {action}")
        c = self._container(task_id)
        self._guard(self._task(c), action)
        try:
            if action == "kill" and c.status != "running":
                raise Conflict(f"{c.name} is not running")
            getattr(c, action)()
        except APIError as exc:
            raise Conflict(exc.explanation or str(exc))
        c.reload()
        return self._task(c)

    def remove(self, task_id: str) -> None:
        c = self._container(task_id)
        self._guard(self._task(c), "remove")
        try:
            c.remove(force=True)
        except APIError as exc:
            raise Conflict(exc.explanation or str(exc))

    def logs(self, task_id: str, tail: int) -> str:
        c = self._container(task_id)
        return c.logs(tail=tail, timestamps=True).decode("utf-8", errors="replace")

    # -- images --------------------------------------------------------------

    @staticmethod
    def _image(img) -> ImageInfo:
        return ImageInfo(
            id=img.short_id.replace("sha256:", ""),
            tags=img.tags,
            size_mb=round(img.attrs.get("Size", 0) / 1_000_000, 2),
            created=img.attrs.get("Created", ""),
        )

    def list_images(self) -> List[ImageInfo]:
        images = [self._image(i) for i in self.client.images.list() if i.tags]
        return sorted(images, key=lambda i: i.created, reverse=True)

    def pull_image(self, ref: str) -> ImageInfo:
        repo, tag = parse_repository_tag(ref)
        try:
            # An explicit tag, so a bare name never pulls every tag of a repo.
            img = self.client.images.pull(repo, tag=tag or "latest")
        except (ImageNotFound, DockerNotFound):
            raise NotFound(f"image {ref} not found in its registry")
        except APIError as exc:
            raise BadRequest(exc.explanation or str(exc))
        return self._image(img)

    # -- create --------------------------------------------------------------

    def create_task(self, spec: CreateTask) -> Task:
        try:
            self.client.images.get(spec.image)
        except ImageNotFound:
            raise BadRequest(f"image {spec.image} is not on this host; pull it first")
        ports = {f"{p.container_port}/tcp": (self.publish_host, p.host_port) for p in spec.ports}
        try:
            c = self.client.containers.run(
                spec.image,
                command=spec.command or None,
                name=spec.name,
                detach=True,
                environment=spec.env,
                ports=ports,
                nano_cpus=int(spec.cpus * 1e9),
                mem_limit=f"{spec.memory_mb}m",
                labels={MANAGED_LABEL: "true"},
            )
        except APIError as exc:
            msg = exc.explanation or str(exc)
            raise Conflict(msg) if exc.status_code == 409 else BadRequest(msg)
        c.reload()
        return self._task(c)

    # -- terminal ------------------------------------------------------------

    def open_shell(self, task_id: str) -> Shell:
        c = self._container(task_id)
        if c.status != "running":
            raise Conflict(f"{c.name} is not running")
        exec_id = self.api.exec_create(
            c.id, SHELL_CMD, stdin=True, tty=True, environment={"TERM": "xterm-256color"}
        )["Id"]
        sock = self.api.exec_start(exec_id, tty=True, socket=True)
        return DockerShell(self.api, exec_id, sock)
