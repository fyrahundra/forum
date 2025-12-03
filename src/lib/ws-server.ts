import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { WebSocketServer } from 'ws';
import { wsManager } from './websocket';

export function attachWebSocketServer(server: import('http').Server) {
    // avoid double-attach (HMR / repeated imports)
    if ((globalThis as any).__wsAttached) return;
    (globalThis as any).__wsAttached = true;

    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws, req: IncomingMessage) => {
        console.log('[ws] connection from', req.socket?.remoteAddress);
        wsManager.addClient(ws);

        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(String(data));
                if (parsed?.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
            } catch {
                // ignore non-JSON payloads
            }
        });

        ws.on('close', () => wsManager.removeClient(ws));
        ws.on('error', () => wsManager.removeClient(ws));
    });

    server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
        if (req.url !== '/websocket') {
            socket.destroy();
            return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    });

    console.log('[ws] WebSocket server attached');
}
