"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessServerSocket = void 0;
const util_1 = require("util");
const message_handler_1 = require("../client/message-handler");
const socket_1 = require("../client/socket");
const utils_1 = require("../utils");
const generics_1 = require("./utils/generics");
const handlers_1 = require("./handlers");
class WitnessServerSocket extends socket_1.WitnessSocket {
    constructor(socket, sessionId, logger) {
        // @ts-ignore
        super(socket, {}, logger);
        this.sessionId = sessionId;
        this.tunnels = {};
        // handle RPC requests
        this.addEventListener('rpc-request', handleRpcRequest.bind(this));
        // forward packets to the appropriate tunnel
        this.addEventListener('tunnel-message', handleTunnelMessage.bind(this));
        // close all tunnels when the connection is terminated
        // since this tunnel can no longer be written to
        this.addEventListener('connection-terminated', () => {
            for (const tunnelId in this.tunnels) {
                const tunnel = this.tunnels[tunnelId];
                tunnel.close(new Error('WS session terminated'));
            }
        });
    }
    getTunnel(tunnelId) {
        const tunnel = this.tunnels[tunnelId];
        if (!tunnel) {
            throw new utils_1.WitnessError('WITNESS_ERROR_NOT_FOUND', `Tunnel "${tunnelId}" not found`);
        }
        return tunnel;
    }
    static async acceptConnection(socket, req, logger) {
        // promisify ws.send -- so the sendMessage method correctly
        // awaits the send operation
        const bindSend = socket.send.bind(socket);
        socket.send = (0, util_1.promisify)(bindSend);
        const sessionId = (0, utils_1.generateSessionId)();
        logger = logger.child({ sessionId });
        const client = new WitnessServerSocket(socket, sessionId, logger);
        try {
            const initMsgs = (0, generics_1.getInitialMessagesFromQuery)(req);
            logger.trace({ initMsgs: initMsgs.length }, 'new connection, validating...');
            for (const msg of initMsgs) {
                await message_handler_1.handleMessage.call(client, msg);
            }
            logger.debug('connection accepted');
        }
        catch (err) {
            logger.error({ err }, 'error in new connection');
            if (client.isOpen) {
                client.terminateConnection(err instanceof utils_1.WitnessError
                    ? err
                    : utils_1.WitnessError.badRequest(err.message));
            }
            return;
        }
        return client;
    }
}
exports.WitnessServerSocket = WitnessServerSocket;
async function handleTunnelMessage({ data: { tunnelId, message } }) {
    var _a;
    try {
        const tunnel = this.getTunnel(tunnelId);
        await tunnel.write(message);
    }
    catch (err) {
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error({
            err,
            tunnelId,
        }, 'error writing to tunnel');
    }
}
async function handleRpcRequest({ data: { data, requestId, respond, type } }) {
    const logger = this.logger.child({
        rpc: type,
        requestId
    });
    try {
        logger.debug({ data }, 'handling RPC request');
        const handler = handlers_1.HANDLERS[type];
        const res = await handler(data, { client: this, logger });
        await respond(res);
        logger.debug({ res }, 'handled RPC request');
    }
    catch (err) {
        logger.error({ err }, 'error in RPC request');
        respond(utils_1.WitnessError.fromError(err));
    }
}
