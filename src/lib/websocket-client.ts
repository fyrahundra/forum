import { writable } from 'svelte/store';
import { browser, dev } from '$app/environment';
import type { Forum, Message } from '@prisma/client';

export interface WebSocketForums { type: 'forum_update'; forums: Forum[]; }
export interface WebSocketMessage { type: 'message_update'; message: Message[]; }
export type WebSocketData = WebSocketForums | WebSocketMessage;

// -------------------
// Client-side stores
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
        if (!browser) return;

        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

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
            wsConnected.set(true); // <--- Track connection
            this.reconnectAttempts = 0;
            console.log('WebSocket connected');
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
                console.error('WS client parse error', err);
            }
        };

        this.ws.onclose = () => {
            wsConnected.set(false); // <--- Track disconnection
            this.attemptReconnect();
        };

        this.ws.onerror = (err) => {
            console.error('WS client error', err);
            wsConnected.set(false); // <--- Track error as disconnected
        };
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting reconnect (${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.ws) this.ws.close();
        this.ws = null;
        wsConnected.set(false); // <--- Update store
    }
}

export const wsClient = new WebSocketClient();
