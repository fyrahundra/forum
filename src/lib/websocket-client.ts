import { writable } from 'svelte/store';
import { browser, dev } from '$app/environment';
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

export const wsConnected = writable(false);
export const wsForums = writable<Forum[] | null>(null);
export const wsMessages = writable<Message[] | null>(null);

class WebSocketClient {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	connect() {
		if (!browser) return;

		// prevent duplicate attempts if already connecting/open
		if (
			this.ws &&
			(this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
		)
			return;

		try {
			// robust URL:
			// - dev => explicit :3001 standalone server
			// - prod => same-origin wss/ws + /websocket path
			let wsUrl: string;
			if (dev) {
				const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
				wsUrl = `${proto}//${window.location.hostname}:3001/ws`;
			} else {
				// use location.origin and swap protocol -> ws/wss
				const origin = window.location.origin;
				const wsOrigin = origin.replace(/^http/, 'ws');
				wsUrl = `${wsOrigin.replace(/\/$/, '')}/ws`;
			}

			console.debug('Attempting WebSocket connection to', wsUrl);

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('WebSocket connected');
				wsConnected.set(true);
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketData = JSON.parse(event.data);
					console.debug('WS message received:', message);
					if (message.type === 'forum_update') {
						wsForums.set(message.forums);
					} else if (message.type === 'message_update') {
						// Ensure createdAt fields are Date objects for UI code that calls toLocaleString()
						const normalized = message.message.map((m) => {
							// m.createdAt may be a string (from JSON) or a Date (if already)
							const created = (m as any).createdAt;
							return {
								...m,
								createdAt: created ? new Date(created) : new Date()
							};
						});

						wsMessages.set(normalized);
					}
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			this.ws.onclose = () => {
				console.log('WebSocket disconnected');
				wsConnected.set(false);
				this.attemptReconnect();
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				wsConnected.set(false);
			};
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			wsConnected.set(false);
			this.attemptReconnect();
		}
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(
				`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
			);
			setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
		}
	}

	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		wsConnected.set(false);
	}
}

export const wsClient = new WebSocketClient();
