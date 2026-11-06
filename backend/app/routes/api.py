import socket
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.concurrency import run_in_threadpool

from app import metrics
from app.auth import require_token
from app.config import get_settings
from app.runtime.base import ACTIONS, ContainerRuntime
from app.schemas import CreateTask, ImageInfo, PullImage, Task

router = APIRouter(prefix="/api", dependencies=[Depends(require_token)])


def runtime(request: Request) -> ContainerRuntime:
    return request.app.state.runtime


@router.get("/session")
async def session(request: Request):
    return {"runtime": runtime(request).name, "host": socket.gethostname()}


@router.get("/metrics/system")
async def system_metrics():
    return metrics.system()


@router.get("/metrics/processes")
async def process_metrics():
    return await run_in_threadpool(metrics.processes, get_settings().PROCESS_LIMIT)


@router.get("/tasks", response_model=List[Task])
async def list_tasks(rt: ContainerRuntime = Depends(runtime)):
    return await run_in_threadpool(rt.list_tasks)


@router.post("/tasks", response_model=Task, status_code=201)
async def create_task(spec: CreateTask, rt: ContainerRuntime = Depends(runtime)):
    return await run_in_threadpool(rt.create_task, spec)


@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, rt: ContainerRuntime = Depends(runtime)):
    return await run_in_threadpool(rt.get_task, task_id)


@router.delete("/tasks/{task_id}", status_code=204)
async def remove_task(task_id: str, rt: ContainerRuntime = Depends(runtime)):
    await run_in_threadpool(rt.remove, task_id)
    return Response(status_code=204)


@router.post("/tasks/{task_id}/{action}", response_model=Task)
async def task_action(task_id: str, action: str, rt: ContainerRuntime = Depends(runtime)):
    if action not in ACTIONS:
        raise HTTPException(404, f"unknown action {action}")
    return await run_in_threadpool(rt.act, task_id, action)


@router.get("/tasks/{task_id}/logs")
async def task_logs(task_id: str, tail: int = Query(500, ge=1, le=5000), rt: ContainerRuntime = Depends(runtime)):
    return {"logs": await run_in_threadpool(rt.logs, task_id, tail)}


@router.get("/images", response_model=List[ImageInfo])
async def list_images(rt: ContainerRuntime = Depends(runtime)):
    return await run_in_threadpool(rt.list_images)


@router.post("/images/pull", response_model=ImageInfo)
async def pull_image(body: PullImage, rt: ContainerRuntime = Depends(runtime)):
    return await run_in_threadpool(rt.pull_image, body.ref)
