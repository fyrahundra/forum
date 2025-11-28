import { WebSocketServer } from 'ws';
import type { Server as HTTPServer } from 'http';
import { wsManager } from '$lib/websocket';
import { prisma } from '$lib'; // make sure prisma client is imported

export function attachWebSocketServer(server: HTTPServer) {
	const wss = new WebSocketServer({ noServer: true });

	server.on('upgrade', (req, socket, head) => {
		if (!req.url?.startsWith('/websocket')) return socket.destroy();
		wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
	});

	wss.on('connection', async (ws) => {
		console.log('[hooks] ws connection (attached)');
		wsManager.addClient(ws);
		console.log('[hooks] total clients now:', wsManager.getClientCount());

		// Send current state immediately
		const forums = await prisma.forum.findMany();
		const messages = await prisma.message.findMany();
		wsManager.sendCurrentState(ws);

		ws.on('close', () => {
			console.log('[hooks] ws close');
			wsManager.removeClient(ws);
		});
		ws.on('error', (err) => {
			console.log('[hooks] ws error', err);
			wsManager.removeClient(ws);
		});
	});

	console.log('WS attached to HTTP server');
	return wss;
}
