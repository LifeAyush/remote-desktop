import os
import threading
import time
from typing import Dict, List

import psutil

CONTAINER_MARKERS = ("docker", "containerd", "kubepods", "libpod")


def prime() -> None:
    """psutil reports CPU since the previous call, so take one reading at startup."""
    psutil.cpu_percent(None)
    psutil.cpu_times_percent(None)
    with _lock:
        _last["at"] = time.monotonic()


_MIN_INTERVAL = 1.0
_lock = threading.Lock()
_last: Dict = {"at": 0.0, "cpu": None}


def _cpu() -> Dict:
    """CPU split since the previous reading, at most once a second.

    psutil measures from the previous call. Two clients polling a few
    milliseconds apart would otherwise read ~0%, so recent readings are reused.
    """
    with _lock:
        now = time.monotonic()
        if _last["cpu"] is None or now - _last["at"] >= _MIN_INTERVAL:
            times = psutil.cpu_times_percent(None)
            _last["cpu"] = {
                "total": psutil.cpu_percent(None),
                "user": times.user,
                "system": times.system,
                "idle": times.idle,
            }
            _last["at"] = now
        return dict(_last["cpu"])


def system() -> Dict:
    vm = psutil.virtual_memory()
    load = os.getloadavg() if hasattr(os, "getloadavg") else (0.0, 0.0, 0.0)
    return {
        "cpu": {
            **_cpu(),
            "cores": psutil.cpu_count() or 1,
            "load": [round(x, 2) for x in load],
        },
        "memory": {
            "total": vm.total,
            "used": vm.total - vm.available,
            "free": vm.available,
            "percent": vm.percent,
        },
        "uptime": int(time.time() - psutil.boot_time()),
    }


def _kind(pid: int) -> str:
    try:
        with open(f"/proc/{pid}/cgroup") as f:
            cgroup = f.read()
    except OSError:
        return "system"
    return "container" if any(m in cgroup for m in CONTAINER_MARKERS) else "system"


def processes(limit: int) -> List[Dict]:
    """Top processes by CPU, then memory.

    psutil.process_iter caches Process objects between calls, so cpu_percent
    is measured since the previous request. The first request reads 0 for all.
    """
    now = time.time()
    rows = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info", "create_time", "username"]):
        info = p.info
        mem = info.get("memory_info")
        rows.append({
            "pid": info["pid"],
            "name": info.get("name") or "?",
            "user": info.get("username") or "",
            "cpu": round(info.get("cpu_percent") or 0.0, 1),
            "memory": mem.rss if mem else 0,
            "uptime": int(now - (info.get("create_time") or now)),
            "type": _kind(info["pid"]),
        })
    rows.sort(key=lambda r: (r["cpu"], r["memory"]), reverse=True)
    return rows[:limit]
