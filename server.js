// server.js
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { attachWebSocketServer } from './build/server/chunks/hooks.server-BaIpZ9G8.js';

const PORT = process.env.PORT || 3000;

// create HTTP server
const server = createServer(handler);

// attach WebSocket server
attachWebSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on port ${PORT}`);
});
