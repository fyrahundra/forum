// src/lib/websocket-client.ts
import { writable } from 'svelte/store';
import { browser, dev } from '$app/environment';
import type { Forum, Message } from '@prisma/client';
import type { WebSocketData, WebSocketForums, WebSocketMessage } from './websocket';

export const wsConnected = writable(false);
export const wsForums = writable<Forum[] | null>(null);
export const wsMessages = writable<Message[] | null>(null);

class WebSocketClient {
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private heartbeatInterval: number | null = null;

	connect() {
		if (!browser) return;
		if (
			this.ws &&
			(this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
		)
			return;

		let wsUrl = '';
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		wsUrl = `${protocol}//${window.location.host}/websocket`;

		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			wsConnected.set(true);
			this.reconnectAttempts = 0;
			console.log('WebSocket connected (client)');

			// heartbeat
			this.heartbeatInterval = window.setInterval(() => {
				if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'ping' }));
			}, 30000);
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
			console.log('WebSocket disconnected (client)');
			if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
			this.attemptReconnect();
		};

		this.ws.onerror = (err) => {
			console.error('WS client error:', err);
			wsConnected.set(false);
		};
	}

	private attemptReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			console.log(`WS reconnect attempt ${this.reconnectAttempts}`);
			setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
		}
	}

	disconnect() {
		if (this.ws) this.ws.close();
		this.ws = null;
		wsConnected.set(false);
		if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
	}
}

export const wsClient = new WebSocketClient();
