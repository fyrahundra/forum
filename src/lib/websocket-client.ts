import { writable } from 'svelte/store';
import { browser } from '$app/environment';
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

		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const host = window.location.hostname;
			const wsUrl = browser 
				?`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`
				: null//`${protocol}//${host}:3001/websocket`;

			this.ws = new WebSocket(wsUrl);

			this.ws.onopen = () => {
				console.log('WebSocket connected');
				wsConnected.set(true);
				this.reconnectAttempts = 0;
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketData = JSON.parse(event.data);
					if (message.type === 'forum_update') {
						wsForums.set(message.forums);
					} else if (message.type === 'message_update') {
						wsMessages.set(message.message);
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
