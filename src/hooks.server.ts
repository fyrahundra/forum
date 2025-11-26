import { WebSocketServer } from 'ws';
import type { Handle } from '@sveltejs/kit';
import { wsManager } from '$lib/websocket';

let wss: WebSocketServer | null = null;

// Initialize WebSocket server
function initWebSocketServer() {
	if (wss) return wss;

	wss = new WebSocketServer({
		port: 3001,
		path: '/websocket'
	});

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

	console.log('WebSocket server initialized on port 3001');
	return wss;
}

// Initialize on startup
initWebSocketServer();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
