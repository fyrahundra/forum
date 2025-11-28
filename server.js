// server.js
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { WebSocketServer } from 'ws';
import { wsManager } from './lib/websocket'; // same manager

const PORT = process.env.PORT || 3000;

// create HTTP server
const server = createServer(handler);

// attach WebSocket server
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
	if (req.url === '/websocket') {
		wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit('connection', ws, req);
		});
	} else {
		socket.destroy();
	}
});

wss.on('connection', (ws) => {
	console.log('[ws] connected');
	wsManager.addClient(ws);
	ws.isAlive = true;

	ws.on('pong', () => (ws.isAlive = true));

	ws.on('close', () => wsManager.removeClient(ws));
	ws.on('error', () => wsManager.removeClient(ws));

	// send welcome message
	ws.send(JSON.stringify({ type: 'welcome' }));
});

// heartbeat to prevent Render timeouts
setInterval(() => {
	wss.clients.forEach((ws) => {
		if (!ws.isAlive) return ws.terminate();
		ws.isAlive = false;
		ws.ping();
	});
}, 25000); // < Render timeout

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on port ${PORT}`);
});
