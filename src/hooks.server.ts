// src/hooks.server.ts
import { WebSocketServer } from 'ws';
import type { Handle } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';
import * as net from 'net';
import type { Server as HTTPServer } from 'http';

const WS_MODE = process.env.WS_MODE ?? (process.env.NODE_ENV === 'production' ? 'attach' : 'standalone');
const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

// Prevent multiple WS servers on hot reload
if (!(globalThis as any).__wssInitialized) {
	(globalThis as any).__wssInitialized = true;

	if (WS_MODE === 'standalone') {
		const probe = net.createServer()
			.once('error', (err: any) => {
				if (err.code === 'EADDRINUSE') console.warn(`WS port ${WS_PORT} in use`);
				else console.error(err);
			})
			.once('listening', () => {
				probe.close(() => {
					const wss = new WebSocketServer({ port: WS_PORT, path: '/websocket' });
					wss.on('connection', (ws) => {
						wsManager.addClient(ws);
						ws.on('close', () => wsManager.removeClient(ws));
						ws.on('error', () => wsManager.removeClient(ws));
					});
					console.log(`Standalone WS server running on port ${WS_PORT}`);
				});
			})
			.listen(WS_PORT);
	} else {
		console.log(`WS not started in hooks: WS_MODE=${WS_MODE}`);
	}
}

export function attachWebSocketServer(server: HTTPServer) {
	const wss = new WebSocketServer({ noServer: true });

	server.on('upgrade', (req, socket, head) => {
		if (!req.url?.startsWith('/websocket')) return socket.destroy();
		wss.handleUpgrade(req, socket as any, head, (ws) => wss.emit('connection', ws, req));
	});

	wss.on('connection', (ws) => {
		wsManager.addClient(ws);
		ws.on('close', () => wsManager.removeClient(ws));
		ws.on('error', () => wsManager.removeClient(ws));
	});

	console.log('WS attached to HTTP server');
	return wss;
}

export const handle: Handle = async ({ event, resolve }) => resolve(event);
