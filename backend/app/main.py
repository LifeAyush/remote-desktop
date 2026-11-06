import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import metrics
from app.config import get_settings
from app.routes import api, terminal
from app.runtime.base import BadRequest, Conflict, NotFound

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def build_runtime(settings):
    if settings.RUNTIME == "demo":
        from app.runtime.demo import DemoRuntime

        return DemoRuntime()
    from app.runtime.docker_runtime import DockerRuntime

    return DockerRuntime(publish_host=settings.PUBLISH_HOST, stats_interval=settings.STATS_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.runtime = build_runtime(settings)
    app.state.runtime.start()
    metrics.prime()
    logger.info("runtime: %s", app.state.runtime.name)
    yield
    app.state.runtime.close()


app = FastAPI(title="Remote Desktop API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

for exc_type, code in ((NotFound, 404), (Conflict, 409), (BadRequest, 400)):
    def handler(request: Request, exc: Exception, code: int = code):
        return JSONResponse(status_code=code, content={"detail": str(exc)})

    app.add_exception_handler(exc_type, handler)

app.include_router(api.router)
app.include_router(terminal.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
