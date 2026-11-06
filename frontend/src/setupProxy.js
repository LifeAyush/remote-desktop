// Dev server only: forward API and terminal traffic to the backend so the
// browser sees one origin, exactly as it does behind nginx in Docker.
const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.BACKEND_URL || 'http://localhost:8000';

module.exports = (app) => {
  app.use(createProxyMiddleware(['/api', '/ws'], { target, ws: true, changeOrigin: true }));
};
