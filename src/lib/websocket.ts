// src/lib/websocket.ts
import type { WebSocket as NodeWebSocket } from 'ws';
import type { Forum, Message } from '@prisma/client';

// -------------------
// Types
// -------------------
export interface WebSocketForums {
	type: 'forum_update';
	forums: Forum[];
}
export interface WebSocketMessage {
	type: 'message_update';
	message: Message[];
}
export type WebSocketData = WebSocketForums | WebSocketMessage;

// -------------------
// Node.js WebSocket manager
// -------------------
// src/lib/websocket.ts
export class WebSocketManager {
	private clients = new Set<NodeWebSocket>();
	private currentForums: Forum[] = []; // store latest state
	private currentMessages: Message[] = [];

	addClient(ws: NodeWebSocket) {
		this.clients.add(ws);
		// send current state when client connects
		this.sendCurrentState(ws);
	}

	removeClient(ws: NodeWebSocket) {
		this.clients.delete(ws);
	}

	broadcast(msg: WebSocketData) {
		// store the latest state for new clients
		if (msg.type === 'forum_update') this.currentForums = msg.forums;
		if (msg.type === 'message_update') this.currentMessages = msg.message;

		const msgStr = JSON.stringify(msg);
		console.log('[ws] broadcasting', msg.type, 'to', this.clients.size, 'clients');
		for (const client of this.clients) {
			if (client.readyState === client.OPEN) {
				try {
					client.send(msgStr);
				} catch (e) {
					this.clients.delete(client);
				}
			} else {
				this.clients.delete(client);
			}
		}
	}

	sendCurrentState(ws: NodeWebSocket) {
		// send current forums
		if (this.currentForums.length > 0) {
			ws.send(JSON.stringify({ type: 'forum_update', forums: this.currentForums }));
		}
		// send current messages
		if (this.currentMessages.length > 0) {
			ws.send(JSON.stringify({ type: 'message_update', message: this.currentMessages }));
		}
	}

	getClientCount() {
		return this.clients.size;
	}
}

// single instance for whole server
export const wsManager = new WebSocketManager();
