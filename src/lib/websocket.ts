import type { Forum, Message } from '@prisma/client';

export interface WebSocketForums {
	type: 'forum_update';
	forums: Forum[];
}

export interface WebSocketMessage {
	type: 'message_update';
	message: Message[];
}

export type WebSocketData = WebSocketForums | WebSocketMessage;

class WebSocketManager {
	private clients = new Set<any>();

	addClient(ws: any) {
		this.clients.add(ws);
	}

	removeClient(ws: any) {
		this.clients.delete(ws);
	}

	broadcast(forumsMessage: WebSocketData) {
		const forumsMessageString = JSON.stringify(forumsMessage);

		for (const client of this.clients) {
			if (client.readyState === 1) {
				// WebSocket.OPEN
				try {
					client.send(forumsMessageString);
				} catch (error) {
					console.error('Error sending WebSocket message:', error);
					this.clients.delete(client);
				}
			} else {
				this.clients.delete(client);
			}
		}
	}

	getClientCount() {
		return this.clients.size;
	}
}

export const wsManager = new WebSocketManager();
