// src/lib/websocket.ts
import type { WebSocket as NodeWebSocket } from 'ws';
import type { Forum, Message } from '@prisma/client';

// Existing types
export interface WebSocketForums { type: 'forum_update'; forums: Forum[]; }
export interface WebSocketMessage { type: 'message_update'; message: Message[]; }
export type WebSocketData = WebSocketForums | WebSocketMessage;

export class WebSocketManager {
    private clients = new Set<NodeWebSocket>();

    addClient(ws: NodeWebSocket) { this.clients.add(ws); }
    removeClient(ws: NodeWebSocket) { this.clients.delete(ws); }

    broadcast(msg: WebSocketData) {
        try {
            const msgStr = JSON.stringify(msg);
            console.log('[ws] broadcasting', msg.type, 'to', this.clients.size, 'clients');
            for (const client of this.clients) {
                if (client.readyState === client.OPEN) {
                    try { client.send(msgStr); } catch {
                        this.clients.delete(client);
                    }
                } else this.clients.delete(client);
            }
        } catch (err) {
            console.error('[ws] broadcast error', err);
        }
    }

    // Send current state to a single client
    sendCurrentState(ws: NodeWebSocket, forums: Forum[], messages: Message[]) {
        try {
            ws.send(JSON.stringify({ type: 'forum_update', forums }));
            ws.send(JSON.stringify({ type: 'message_update', message: messages }));
        } catch (err) {
            console.error('[ws] sendCurrentState error', err);
        }
    }

    getClientCount() { return this.clients.size; }
}

export const wsManager = new WebSocketManager();
