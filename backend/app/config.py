from functools import lru_cache
from typing import List, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Every API call and terminal session must present this token. There is
    # no default: anything that can reach the Docker socket is root on the host.
    API_TOKEN: str = Field(min_length=8)

    # "docker" talks to the Docker socket. "demo" serves an in-memory set of
    # fake containers, for tests and for trying the UI without Docker.
    RUNTIME: Literal["docker", "demo"] = "docker"

    # Only used when the frontend is served from another origin (local dev).
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Host ports for new containers are bound to this address.
    PUBLISH_HOST: str = "127.0.0.1"

    STATS_INTERVAL: float = 2.0
    PROCESS_LIMIT: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
