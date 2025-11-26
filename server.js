// server.js (adapter-node production entry)
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { attachWebSocketServer } from './src/hooks.server.js';

const server = createServer((req, res) => handler(req, res));
attachWebSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
