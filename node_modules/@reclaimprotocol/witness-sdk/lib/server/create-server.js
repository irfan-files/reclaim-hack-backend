"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const http_1 = require("http");
const serve_static_1 = __importDefault(require("serve-static"));
const ws_1 = require("ws");
const config_1 = require("../config");
const utils_1 = require("../utils");
const env_1 = require("../utils/env");
const keep_alive_1 = require("./utils/keep-alive");
const socket_1 = require("./socket");
const PORT = +((0, env_1.getEnvVariable)('PORT') || config_1.API_SERVER_PORT);
/**
 * Creates the WebSocket API server,
 * creates a fileserver to serve the browser RPC client,
 * and listens on the given port.
 */
async function createServer(port = PORT) {
    const http = (0, http_1.createServer)();
    const serveBrowserRpc = (0, serve_static_1.default)('browser', { index: ['index.html'] });
    const wss = new ws_1.WebSocketServer({ noServer: true });
    http.on('upgrade', handleUpgrade.bind(wss));
    http.on('request', (req, res) => {
        var _a;
        // simple way to serve files at the browser RPC path
        if (!((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith(config_1.BROWSER_RPC_PATHNAME))) {
            res.statusCode = 404;
            res.end('Not found');
            return;
        }
        req.url = req.url.slice(config_1.BROWSER_RPC_PATHNAME.length) || '/';
        serveBrowserRpc(req, res, (err) => {
            var _a, _b;
            if (err) {
                utils_1.logger.error({ err, url: req.url }, 'Failed to serve file');
            }
            res.statusCode = (_a = err === null || err === void 0 ? void 0 : err.statusCode) !== null && _a !== void 0 ? _a : 404;
            res.end((_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : 'Not found');
        });
    });
    // wait for us to start listening
    http.listen(port);
    await new Promise((resolve, reject) => {
        http.once('listening', () => resolve());
        http.once('error', reject);
    });
    wss.on('connection', handleNewClient);
    utils_1.logger.info({
        port,
        apiPath: config_1.WS_PATHNAME,
        browserRpcPath: config_1.BROWSER_RPC_PATHNAME
    }, 'WS server listening');
    const wssClose = wss.close.bind(wss);
    wss.close = (cb) => {
        wssClose(() => http.close(cb));
    };
    return wss;
}
async function handleNewClient(ws, req) {
    const client = await socket_1.WitnessServerSocket
        .acceptConnection(ws, req, utils_1.logger);
    // if initialisation fails, don't store the client
    if (!client) {
        return;
    }
    ws.serverSocket = client;
    (0, keep_alive_1.addKeepAlive)(ws, utils_1.logger.child({ sessionId: client.sessionId }));
}
function handleUpgrade(request, socket, head) {
    const { pathname } = new URL(request.url, 'wss://base.url');
    if (pathname === config_1.WS_PATHNAME) {
        this.handleUpgrade(request, socket, head, (ws) => {
            this.emit('connection', ws, request);
        });
        return;
    }
    socket.destroy();
}
