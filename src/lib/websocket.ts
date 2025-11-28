// src/lib/websocket.ts
import type { WebSocket as NodeWebSocket } from 'ws';
import type { Forum, Message } from '@prisma/client';

// Existing types
export interface WebSocketForums { type: 'forum_update'; forums: Forum[]; }
export interface WebSocketMessage { type: 'message_update'; message: Message[]; }
export type WebSocketData = WebSocketForums | WebSocketMessage;

export class WebSocketManager {
    private clients = new Set<NodeWebSocket>();

    addClient(ws: NodeWebSocket) { this.clients.add(ws); console.log('[wsManager] added client, total:', this.clients.size);
}
    removeClient(ws: NodeWebSocket) { this.clients.delete(ws); console.log('[wsManager] removed client, total:', this.clients.size);
}

    broadcast(msg: WebSocketData) {
        try {
			const msgStr = JSON.stringify(msg);

			// DEBUG: Log number of clients before sending
			console.log('[ws] broadcasting', msg.type, 'to', this.clients.size, 'clients');
			if (this.clients.size === 0) console.warn('[ws] No clients to broadcast to!');

			for (const client of this.clients) {
				console.log('[ws] client readyState:', client.readyState); // DEBUG
				if (client.readyState === client.OPEN) {
					try { 
						client.send(msgStr); 
						console.log('[ws] message sent to client'); // DEBUG
					} catch (e) { 
						console.warn('[ws] send failed, removing client', e);
						this.clients.delete(client);
					}
				} else {
					console.log('[ws] client not open, removing');
					this.clients.delete(client);
				}
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
