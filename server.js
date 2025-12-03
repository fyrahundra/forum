// server.js
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { attachWebSocketServer } from './build/lib/ws-server.js';

const PORT = process.env.PORT || 3000;

const server = createServer(handler);

attachWebSocketServer(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
