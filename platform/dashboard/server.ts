// =============================================================================
// OpenTwin Dashboard — Express + WebSocket Server
// =============================================================================

import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createTwinRoutes } from './routes/twins';
import { createAlertRoutes } from './routes/alerts';
import { createWorkflowRoutes } from './routes/workflows';

// Re-use core types
import { OpenTwinPlatform } from '../core/src/platform';

export function createDashboardServer(platform: OpenTwinPlatform, port = 3000) {
  const app = express();
  const server = http.createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'static')));

  // API routes
  app.use('/api/twins', createTwinRoutes(platform));
  app.use('/api/alerts', createAlertRoutes(platform));
  app.use('/api/workflows', createWorkflowRoutes(platform));

  // Platform status
  app.get('/api/status', (_req, res) => {
    res.json(platform.status());
  });

  // Ontology schema
  app.get('/api/ontology', (_req, res) => {
    res.json(platform.ontology.export_schema());
  });

  // Bindings
  app.get('/api/bindings', (_req, res) => {
    res.json(platform.binder.get_all_bindings());
  });

  // WebSocket for real-time twin updates
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  // Broadcast twin changes to all connected clients
  platform.twins.on_change((event) => {
    const message = JSON.stringify({
      type: 'twin_update',
      data: event,
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
  });

  return {
    app,
    server,
    start: () => {
      server.listen(port, () => {
        console.log(`OpenTwin Dashboard running on http://localhost:${port}`);
      });
    },
  };
}
