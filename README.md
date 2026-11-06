# Remote Desktop

A web console for one Docker host. It shows live CPU, memory and processes, manages containers, streams their logs, and opens a real shell inside any running container from the browser.

React + MUI frontend, FastAPI backend on the Docker socket, nginx in front. One `docker compose up` runs it.

## What it does

- **Monitoring.** Host CPU (user, system, idle), memory, load and uptime every 2 s, with a rolling chart. The process list shows top processes by CPU, can be sorted and filtered, and is split into host and in-container processes.
- **Containers.** Every container on the host, with live CPU and memory, refreshed every 3 s. You can start, stop, restart, kill and remove containers. Kill and remove ask for confirmation first. Logs can be followed, copied or downloaded.
- **New container.** Pick a local image or pull one, then set the name, CPU and memory limits, command, environment variables and published ports. Review before anything starts.
- **Terminal.** An `xterm.js` session over a WebSocket into `docker exec` with a real TTY: bash if the image has it, otherwise sh. Resizing works.

## Safety

Anything that can reach the Docker socket is root on the host, so:

- **Token on every call.** Every API call needs `Authorization: Bearer <API_TOKEN>`. The terminal sends the token in its first WebSocket frame, never in the URL, so it stays out of access logs. The browser keeps it in `sessionStorage`.
- **Nothing exposed beyond localhost.** The backend is not published. Only nginx is, on `127.0.0.1:8080`. Ports you publish for new containers also bind to `127.0.0.1`.
- **The stack protects itself.** Its own containers carry `rdc.protected=true`, and the API refuses to stop, kill, restart or remove them.
- **Environment values stay on the server.** The API returns variable names only, never their values.
- **Validated input.** Container names, image references, environment variable names and port ranges are checked before Docker sees them.

Put it behind your own VPN or SSH tunnel if you need it beyond localhost.

## Run it

```bash
export API_TOKEN=$(openssl rand -hex 24)
docker compose up --build
```

Open http://localhost:8080 and paste the token.

`RUNTIME=demo docker compose up --build` swaps the Docker engine for an in-memory set of fake containers. The header shows a `demo` badge, and the demo terminal is a small stub shell.

### Develop

```bash
# backend, on :8000
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
API_TOKEN=dev-token-123 RUNTIME=demo uvicorn app.main:app --reload   # or RUNTIME=docker
pytest

# frontend, on :3000; /api and /ws are proxied to :8000
cd frontend
npm install
npm start
npx react-scripts test
```

## Layout

```text
backend/
  app/main.py                  FastAPI app, error mapping
  app/routes/api.py            REST: metrics, containers, logs, images
  app/routes/terminal.py       WebSocket shell bridge
  app/runtime/base.py          ContainerRuntime interface
  app/runtime/docker_runtime.py  Docker SDK implementation, background stats sampler
  app/runtime/demo.py          in-memory runtime for tests and demos
  app/metrics.py               psutil host metrics
frontend/
  src/pages/                   Monitoring, Containers, New Container, Terminal, Login
  src/utils/api.js             API client and polling hook
  nginx.conf                   static files plus /api and /ws proxy
docker-compose.yml
```

## API

| Method | Path | |
|---|---|---|
| GET | `/api/session` | runtime and host name, used to check a token |
| GET | `/api/metrics/system` | CPU, memory, load, uptime |
| GET | `/api/metrics/processes` | top processes |
| GET, POST | `/api/tasks` | list containers, create and start one |
| GET, DELETE | `/api/tasks/{id}` | inspect, remove |
| POST | `/api/tasks/{id}/{start\|stop\|restart\|kill}` | lifecycle |
| GET | `/api/tasks/{id}/logs?tail=500` | recent logs with timestamps |
| GET | `/api/images` | tagged local images |
| POST | `/api/images/pull` | `{"ref": "nginx:1.27-alpine"}` |
| WS | `/ws/terminal/{id}` | `{"type":"auth"}`, then `input` and `resize` frames |

Errors come back as `{"detail": "..."}` with 400, 401, 404 or 409.

## Credits

Aniket Mohanty (Cole-Randolph) worked on the original frontend integration.

## License

MIT
