// server.js
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { attachWebSocketServer } from './.svelte-kit/output/server/chunks/hooks.server.js'; // <- JS output

const PORT = process.env.PORT || 3000;

const server = createServer(handler);

// attach the WS server
attachWebSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
