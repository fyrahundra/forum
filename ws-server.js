// ws-server.js
import { WebSocketServer } from 'ws';
import { wsManager } from './src/lib/websocket.js';
import { prisma } from './src/lib/index.js';

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/websocket')) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', async (ws) => {
    console.log('[ws] client connected');
    wsManager.addClient(ws);

    try {
      const forums = await prisma.forum.findMany({
        include: { _count: { select: { messages: true } } },
        orderBy: { createdAt: 'desc' }
      });
      ws.send(JSON.stringify({ type: 'forum_update', forums }));
    } catch (err) {
      console.error('[ws] error sending initial data', err);
    }

    ws.on('close', () => wsManager.removeClient(ws));
    ws.on('error', () => wsManager.removeClient(ws));
  });

  console.log('[ws] WebSocket server ready');
}
