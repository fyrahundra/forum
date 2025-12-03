import { WebSocketServer, WebSocket } from 'ws';
import { wsManager } from './src/lib/websocket.js';
import { prisma } from './src/lib/index.js';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

export function attachWebSocketServer(server: any) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
        if (!req.url?.startsWith('/websocket')) {
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', async (ws: WebSocket) => {
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
