"""Interactive shell inside a container over a WebSocket.

Protocol:
  client -> server, JSON text frames:
    {"type": "auth", "token": "..."}          must be the first frame, within 5 s
    {"type": "input", "data": "ls\\r"}
    {"type": "resize", "cols": 120, "rows": 40}
  server -> client: text frames with raw terminal output.

The token goes in the first frame, not the URL, so it never lands in access logs.
"""

import asyncio
import codecs
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool

from app.auth import token_matches
from app.config import get_settings
from app.runtime.base import Conflict, NotFound

router = APIRouter()
logger = logging.getLogger(__name__)

AUTH_TIMEOUT = 5.0


@router.websocket("/ws/terminal/{task_id}")
async def terminal(ws: WebSocket, task_id: str):
    await ws.accept()
    try:
        first = json.loads(await asyncio.wait_for(ws.receive_text(), AUTH_TIMEOUT))
    except (asyncio.TimeoutError, ValueError, WebSocketDisconnect):
        await ws.close(code=4401, reason="auth required")
        return
    if first.get("type") != "auth" or not token_matches(first.get("token"), get_settings()):
        await ws.close(code=4401, reason="invalid token")
        return

    runtime = ws.app.state.runtime
    try:
        shell = await run_in_threadpool(runtime.open_shell, task_id)
    except (NotFound, Conflict) as exc:
        await ws.send_text(f"\r\n\x1b[31m{exc}\x1b[0m\r\n")
        await ws.close(code=4404 if isinstance(exc, NotFound) else 4409, reason=str(exc)[:120])
        return

    loop = asyncio.get_running_loop()
    decoder = codecs.getincrementaldecoder("utf-8")(errors="replace")

    async def pump_output():
        while True:
            chunk = await loop.run_in_executor(None, shell.read)
            if not chunk:
                break
            text = decoder.decode(chunk)
            if text:
                await ws.send_text(text)

    async def pump_input():
        while True:
            msg = json.loads(await ws.receive_text())
            if msg.get("type") == "input":
                await loop.run_in_executor(None, shell.write, str(msg.get("data", "")).encode())
            elif msg.get("type") == "resize":
                cols, rows = int(msg.get("cols", 80)), int(msg.get("rows", 24))
                if 0 < cols <= 1000 and 0 < rows <= 1000:
                    await loop.run_in_executor(None, shell.resize, cols, rows)

    out_task = asyncio.create_task(pump_output())
    in_task = asyncio.create_task(pump_input())
    try:
        done, _ = await asyncio.wait({out_task, in_task}, return_when=asyncio.FIRST_COMPLETED)
        for t in done:
            if t.exception() and not isinstance(t.exception(), (WebSocketDisconnect, ValueError)):
                logger.warning("terminal session ended with %r", t.exception())
    finally:
        in_task.cancel()
        shell.close()
        out_task.cancel()
        try:
            await ws.close(code=1000, reason="shell exited")
        except RuntimeError:
            pass
