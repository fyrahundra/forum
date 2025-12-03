// src/server/ws-server.ts
import { WebSocketServer } from 'ws';
import { wsManager } from '../lib/websocket.js';
import { prisma } from '../lib/index.js';

export function attachWebSocketServer(server: any) {
    // Create WebSocket server with manual upgrade
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req: any, socket: any, head: any) => {
        // Only handle our WS endpoint
        if (!req.url?.startsWith('/websocket')) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', async (ws) => {
        console.log('[ws] client connected');
        wsManager.addClient(ws);

        // Send initial state immediately
        try {
            const forums = await prisma.forum.findMany({
                include: {
                    _count: { select: { messages: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            ws.send(JSON.stringify({
                type: 'forum_update',
                forums
            }));
        } catch (err) {
            console.error('[ws] error sending initial data:', err);
        }

        ws.on('close', () => {
            wsManager.removeClient(ws);
            console.log('[ws] client disconnected');
        });

        ws.on('error', (err) => {
            wsManager.removeClient(ws);
            console.log('[ws] client error', err);
        });
    });

    console.log('[ws] WebSocket server ready');
}
