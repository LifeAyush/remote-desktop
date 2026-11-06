import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,62}$")
# registry/repo:tag or repo@sha256:digest, conservatively
IMAGE_REF_RE = re.compile(r"^[a-z0-9][a-z0-9._/:-]{0,254}(@sha256:[a-f0-9]{64})?$")
ENV_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,127}$")


class Task(BaseModel):
    id: str
    name: str
    image: str
    status: str
    uptime: int = 0
    cpu: float = 0.0
    memory: int = 0
    memory_limit: int = 0
    created: str
    ports: str = ""
    network: str = ""
    # Names only. Values can hold secrets and are never sent to the browser.
    env: List[str] = []
    managed: bool = False
    protected: bool = False


class ImageInfo(BaseModel):
    id: str
    tags: List[str]
    size_mb: float
    created: str


class PortMap(BaseModel):
    container_port: int = Field(ge=1, le=65535)
    host_port: int = Field(ge=1024, le=65535)


class CreateTask(BaseModel):
    name: str
    image: str
    cpus: float = Field(default=1.0, ge=0.1, le=16)
    memory_mb: int = Field(default=512, ge=32, le=65536)
    env: Dict[str, str] = {}
    ports: List[PortMap] = Field(default=[], max_length=20)
    command: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        if not NAME_RE.match(v):
            raise ValueError("letters, digits, '_', '.', '-'; must start with a letter or digit")
        return v

    @field_validator("image")
    @classmethod
    def _image(cls, v: str) -> str:
        if not IMAGE_REF_RE.match(v):
            raise ValueError("not a valid image reference")
        return v

    @field_validator("env")
    @classmethod
    def _env(cls, v: Dict[str, str]) -> Dict[str, str]:
        bad = [k for k in v if not ENV_KEY_RE.match(k)]
        if bad:
            raise ValueError(f"invalid variable names: {', '.join(bad)}")
        return v


class PullImage(BaseModel):
    ref: str

    @field_validator("ref")
    @classmethod
    def _ref(cls, v: str) -> str:
        if not IMAGE_REF_RE.match(v):
            raise ValueError("not a valid image reference")
        return v
