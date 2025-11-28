import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handler } from './build/handler.js';

const PORT = process.env.PORT || 3000;
const server = createServer(handler);

// Create WS server
const wss = new WebSocketServer({ noServer: true });

// Attach upgrade handler
server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
        wss.handleUpgrade(req, socket, head, ws => {
            wss.emit('connection', ws, req);
        });
    } else {
        socket.destroy();
    }
});

// Keep sockets alive
wss.on('connection', (ws) => {
    console.log('[ws] connected');

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    ws.send(JSON.stringify({ type: 'welcome' }));
});

// Heartbeat to prevent Render timeouts
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 25000); // must be < Render timeout

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
