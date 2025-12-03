"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsManager = exports.WebSocketManager = void 0;
// -------------------
// Node.js WebSocket manager
// -------------------
// src/lib/websocket.ts
var WebSocketManager = /** @class */ (function () {
    function WebSocketManager() {
        this.clients = new Set();
        this.currentForums = []; // store latest state
        this.currentMessages = [];
    }
    WebSocketManager.prototype.addClient = function (ws) {
        this.clients.add(ws);
        // send current state when client connects
        this.sendCurrentState(ws);
    };
    WebSocketManager.prototype.removeClient = function (ws) {
        this.clients.delete(ws);
    };
    WebSocketManager.prototype.broadcast = function (msg) {
        // store the latest state for new clients
        if (msg.type === 'forum_update')
            this.currentForums = msg.forums;
        if (msg.type === 'message_update')
            this.currentMessages = msg.message;
        var msgStr = JSON.stringify(msg);
        console.log('[ws] broadcasting', msg.type, 'to', this.clients.size, 'clients');
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            if (client.readyState === client.OPEN) {
                try {
                    client.send(msgStr);
                }
                catch (e) {
                    this.clients.delete(client);
                }
            }
            else {
                this.clients.delete(client);
            }
        }
    };
    WebSocketManager.prototype.sendCurrentState = function (ws) {
        // send current forums
        if (this.currentForums.length > 0) {
            ws.send(JSON.stringify({ type: 'forum_update', forums: this.currentForums }));
        }
        // send current messages
        if (this.currentMessages.length > 0) {
            ws.send(JSON.stringify({ type: 'message_update', message: this.currentMessages }));
        }
    };
    WebSocketManager.prototype.getClientCount = function () {
        return this.clients.size;
    };
    return WebSocketManager;
}());
exports.WebSocketManager = WebSocketManager;
// single instance for whole server
exports.wsManager = globalThis.wsManager || new WebSocketManager();
if (process.env.NODE_ENV !== 'production')
    globalThis.wsManager = exports.wsManager;
