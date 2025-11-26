// src/lib/websocket.ts
import { writable } from 'svelte/store';
import { browser, dev } from '$app/environment';
import type { Forum, Message } from '@prisma/client';
import type { WebSocket as NodeWebSocket } from 'ws'; // Node.js WS for server manager

// -------------------
// Types
// -------------------
export interface WebSocketForums { type: 'forum_update'; forums: Forum[]; }
export interface WebSocketMessage { type: 'message_update'; message: Message[]; }
export type WebSocketData = WebSocketForums | WebSocketMessage;

// -------------------
// Client-side Svelte stores
// -------------------
export const wsConnected = writable(false);
export const wsForums = writable<Forum[] | null>(null);
export const wsMessages = writable<Message[] | null>(null);

// -------------------
// Browser WebSocket client
// -------------------
class WebSocketClient {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	connect() {
		if (!browser) return; // Only run in browser
		if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

		try {
			let wsUrl: string;
			if (dev) {
				const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
				wsUrl = `${proto}//${window.location.hostname}:3001/websocket`;
			} else {
				const origin = window.location.origin.replace(/^http/, 'ws');
				wsUrl = `${origin.replace(/\/$/, '')}/websocket`;
			}

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('WebSocket connected (client)');
				wsConnected.set(true);
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const msg: WebSocketData = JSON.parse(event.data);
					if (msg.type === 'forum_update') wsForums.set(msg.forums);
					else if (msg.type === 'message_update') {
						const normalized = msg.message.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
						wsMessages.set(normalized);
					}
				} catch (err) {
					console.error('WS client message parse error:', err);
				}
			};

			this.ws.onclose = () => {
				wsConnected.set(false);
				this.attemptReconnect();
			};

			this.ws.onerror = (err) => {
				console.error('WS client error:', err);
				wsConnected.set(false);
			};
		} catch (err) {
			console.error('WS client connection failed:', err);
			wsConnected.set(false);
			this.attemptReconnect();
		}
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
		}
	}

	disconnect() {
		if (this.ws) this.ws.close();
		this.ws = null;
		wsConnected.set(false);
	}
}

export const wsClient = new WebSocketClient();

// -------------------
// Node.js server-side WebSocket manager
// -------------------
export class WebSocketManager {
	private clients = new Set<NodeWebSocket>();

	addClient(ws: NodeWebSocket) { this.clients.add(ws); }
	removeClient(ws: NodeWebSocket) { this.clients.delete(ws); }

	broadcast(msg: WebSocketData) {
		const msgStr = JSON.stringify(msg);
		for (const client of this.clients) {
			if (client.readyState === client.OPEN) {
				try { client.send(msgStr); } catch { this.clients.delete(client); }
			} else this.clients.delete(client);
		}
	}

	getClientCount() { return this.clients.size; }
}

export const wsManager = new WebSocketManager();
