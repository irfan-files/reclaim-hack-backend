"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Websocket = void 0;
exports.setWebsocket = setWebsocket;
const env_1 = require("./env");
/**
 * Default WebSocket implementation, uses `ws` package
 * for Node.js and the native WebSocket for the browser & other
 * environments.
 */
exports.Websocket = ((0, env_1.detectEnvironment)() === 'node'
    ? require('ws').WebSocket
    : WebSocket);
/**
 * Replace the default WebSocket implementation utilised
 * by the Witness client.
 */
function setWebsocket(ws) {
    exports.Websocket = ws;
}
