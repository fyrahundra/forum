import { WebSocketServer } from 'ws';
import type { Handle } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';

// guard to avoid multiple servers during hot reloads
// @ts-ignore
if (!(globalThis as any).__wssInitialized) {
	// mark initialized immediately to avoid races on re-evaluation
	// @ts-ignore
	(globalThis as any).__wssInitialized = true;

	try {
		const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
		const wss = new WebSocketServer({ port: WS_PORT, path: '/websocket' });

		wss.on('connection', (ws) => {
			console.log('New WebSocket connection');
			(wsManager as any).addClient(ws);

			ws.on('close', () => {
				console.log('WebSocket connection closed');
				(wsManager as any).removeClient(ws);
			});

			ws.on('error', (error) => {
				console.error('WebSocket error:', error);
				(wsManager as any).removeClient(ws);
			});
		});

		console.log(`WebSocket server initialized on port ${WS_PORT} (path /websocket)`);
	} catch (err) {
		console.error('Failed to initialize WebSocket server:', err);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
