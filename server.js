// server.js
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { attachWebSocketServer } from './.svelte-kit/output/server/chunks/hooks.server.js'; // compiled JS

const PORT = process.env.PORT || 3000;

// Create HTTP server with SvelteKit handler
const server = createServer((req, res) => {
    handler(req, res);
});

// Attach standalone WebSocket server
attachWebSocketServer(server);

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

