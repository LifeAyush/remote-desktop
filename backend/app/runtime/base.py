from abc import ABC, abstractmethod
from typing import List

from app.schemas import CreateTask, ImageInfo, Task

ACTIONS = ("start", "stop", "restart", "kill")


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


class BadRequest(Exception):
    pass


class Shell(ABC):
    """An interactive TTY inside a container. Methods block; call them off the event loop."""

    @abstractmethod
    def read(self) -> bytes:
        """Next chunk of output. b"" means the shell has exited."""

    @abstractmethod
    def write(self, data: bytes) -> None: ...

    @abstractmethod
    def resize(self, cols: int, rows: int) -> None: ...

    @abstractmethod
    def close(self) -> None: ...


class ContainerRuntime(ABC):
    """Everything the API needs from a container engine. Methods block."""

    name: str

    @abstractmethod
    def list_tasks(self) -> List[Task]: ...

    @abstractmethod
    def get_task(self, task_id: str) -> Task: ...

    @abstractmethod
    def act(self, task_id: str, action: str) -> Task: ...

    @abstractmethod
    def remove(self, task_id: str) -> None: ...

    @abstractmethod
    def logs(self, task_id: str, tail: int) -> str: ...

    @abstractmethod
    def list_images(self) -> List[ImageInfo]: ...

    @abstractmethod
    def pull_image(self, ref: str) -> ImageInfo: ...

    @abstractmethod
    def create_task(self, spec: CreateTask) -> Task: ...

    @abstractmethod
    def open_shell(self, task_id: str) -> Shell: ...

    def start(self) -> None:
        """Start background work, such as stats sampling."""

    def close(self) -> None:
        """Stop background work and release clients."""

    def _guard(self, task: Task, action: str) -> None:
        if task.protected and action in ("stop", "kill", "restart", "remove"):
            done = {"stop": "stopped", "kill": "killed", "restart": "restarted", "remove": "removed"}[action]
            raise Conflict(f"{task.name} is part of this stack and cannot be {done} from the UI")
