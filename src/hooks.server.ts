import { WebSocketServer } from 'ws';
import type { Handle } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';
import * as net from 'net';

// Decide mode:
// - 'standalone' => start a separate WS server on WS_PORT (only when explicitly set)
// - 'attach' => don't start here; use attachWebSocketServer(server) from adapter entry (recommended for prod)
// - 'disabled' => do not start a WS server here
const WS_MODE = process.env.WS_MODE ?? (process.env.NODE_ENV === 'production' ? 'attach' : 'standalone');
const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

// guard to avoid multiple servers during hot reloads
// @ts-ignore
if (!(globalThis as any).__wssInitialized) {
	// mark initialized immediately to avoid races on re-evaluation
	// @ts-ignore
	(globalThis as any).__wssInitialized = true;

	try {
		if (WS_MODE === 'standalone') {
			// Probe the port first to avoid throwing EADDRINUSE synchronously.
			const probe = net.createServer()
				.once('error', (err: any) => {
					if (err && err.code === 'EADDRINUSE') {
						console.warn(`WebSocket standalone mode requested but port ${WS_PORT} is already in use. Skipping standalone WS server.`);
					} else {
						console.error('Error while probing WS port:', err);
					}
				})
				.once('listening', () => {
					// port is available; close probe then create the real WSS
					probe.close(() => {
						try {
							const wss = new WebSocketServer({ port: WS_PORT, path: '/websocket' });

							// defensive error listener to avoid unhandled exceptions
							wss.on('error', (err) => {
								console.error('WebSocketServer error:', err);
							});

							wss.on('connection', (ws) => {
								console.log('New WebSocket connection (standalone)');
								(wsManager as any).addClient(ws);

								ws.on('close', () => {
									console.log('WebSocket connection closed');
									(wsManager as any).removeClient(ws);
								});

								ws.on('error', (error) => {
									console.error('WebSocket error (client):', error);
									(wsManager as any).removeClient(ws);
								});
							});

							console.log(`WebSocket server initialized on port ${WS_PORT} (path /websocket)`);
						} catch (err) {
							console.error('Failed to initialize standalone WebSocket server (port may be in use):', err);
						}
					});
				})
				.listen(WS_PORT);
		} else {
			console.log(`WebSocket server not started in hooks: WS_MODE=${WS_MODE}`);
		}
	} catch (err) {
		console.error('Unexpected error while initializing WebSocket server:', err);
	}
}

/**
 * Attach a WebSocketServer to an existing HTTP server (adapter-node).
 * Call this from your adapter-node entry file so the WSS runs on the same port as your HTTP server.
 *
 * Example (adapter-node entry):
 *   import { createServer } from 'http';
 *   import { handler } from './build/handler.js';
 *   import { attachWebSocketServer } from './src/hooks.server';
 *
 *   const server = createServer((req, res) => handler(req, res));
 *   attachWebSocketServer(server);
 *   server.listen(process.env.PORT || 3000);
 */
export function attachWebSocketServer(server: import('http').Server) {
	const wss = new WebSocketServer({ noServer: true });

	server.on('upgrade', (req, socket, head) => {
		if (!req.url) return socket.destroy();
		// Only handle our websocket path
		if (!req.url.startsWith('/websocket')) {
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket as any, head, (ws) => {
			wss.emit('connection', ws, req);
		});
	});

	wss.on('connection', (ws) => {
		console.log('Attached WebSocket connection');
		(wsManager as any).addClient(ws);

		ws.on('close', () => {
			console.log('Attached WebSocket closed');
			(wsManager as any).removeClient(ws);
		});

		ws.on('error', (err) => {
			console.error('Attached WebSocket error:', err);
			(wsManager as any).removeClient(ws);
		});
	});

	console.log('WebSocket server attached to existing HTTP server (path /websocket)');
	return wss;
}

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
