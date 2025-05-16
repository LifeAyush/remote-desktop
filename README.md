# 🖥️ Remote Desktop Controller (React + FastAPI Integration)

A full-featured Remote Desktop Controller frontend built with **React**, **Tailwind CSS**, and **Material UI (MUI)**. This app integrates seamlessly with a FastAPI backend using a mix of REST APIs and WebSockets. It provides real-time system monitoring, container task management, SSH terminal access, and task creation via ECR-style definitions.

---

## 🚀 Features

### 📊 System Monitoring
- Live CPU and memory usage display (system-level + per-process).
- Graphs update every second for 30 seconds while viewing.
- Visualized using Recharts.
- Auto-polling via REST APIs.

### 🧠 Task Manager
- Lists all running Docker containers with metadata.
- Interactive table with sortable headers.
- Manage containers: **Stop**, **Restart**, **Kill**.
- View logs in modal (logs fetched periodically).

### 🖥️ SSH Terminal
- Stateless terminal powered by `xterm.js`.
- Connects via WebSocket.
- Real-time command execution and output.
- Dark-themed terminal matches app dark mode.

### 📦 Task Creation
- Define and launch container tasks using ECR images.
- Dropdown with metadata: name, size, creation date.
- Customize environment variables, CPU, and memory.
- Starts container and redirects to Task Manager on success.

### 🌗 Global Features
- Full **dark/light mode** support.
- Toast notifications for feedback.
- Optimized for **desktop-only** use.
- Global state managed via Context API.

---

## 🧭 Project Structure

```bash
/src
├── /components
│   ├── CPUChart.js
│   ├── MemoryChart.js
│   ├── Terminal.js
│   ├── TaskTable.js
│   ├── TaskLogsModal.js
│   ├── TaskForm.js
├── /pages
│   ├── MonitorPage.js
│   ├── TasksPage.js
│   ├── TerminalPage.js
│   ├── CreateTaskPage.js
├── /contexts
│   ├── ThemeContext.js
├── /utils
│   ├── api.js
│   ├── usePolling.js
├── App.js
├── index.js
└── routes.js
```

---

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/remote-desktop-controller.git
cd remote-desktop-controller
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

Make sure the FastAPI backend is running and accessible for API and WebSocket connections.

---

## 🌐 Environment Variables

Create a `.env` file in the root:

```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws
```

---

## 🔧 Scripts

- `npm start` — Start development server.
- `npm run build` — Create a production build.
- `npm run lint` — Lint code for formatting issues.

---

## 🙌 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Open a Pull Request

---

## 📄 License

MIT License. See [LICENSE](./LICENSE) for more details.

---

## ✨ Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material UI](https://mui.com/)
- [xterm.js](https://xtermjs.org/)
- [Recharts](https://recharts.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
```
