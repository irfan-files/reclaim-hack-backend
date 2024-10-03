"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsMessageHandler = wsMessageHandler;
exports.handleMessage = handleMessage;
const api_1 = require("../proto/api");
const utils_1 = require("../utils");
async function wsMessageHandler(data) {
    // extract array buffer from WS data & decode proto
    const buff = await (0, utils_1.extractArrayBufferFromWsData)(data);
    const { messages } = api_1.RPCMessages.decode(buff);
    for (const msg of messages) {
        await handleMessage.call(this, msg);
    }
}
function handleMessage(msg) {
    var _a;
    // handle connection termination alert
    if (msg.connectionTerminationAlert) {
        const err = utils_1.WitnessError.fromProto(msg.connectionTerminationAlert);
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn({
            err: err.code !== 'WITNESS_ERROR_NO_ERROR'
                ? err
                : undefined
        }, 'received connection termination alert');
        this.dispatchRPCEvent('connection-terminated', err);
        return;
    }
    const rpcRequest = (0, utils_1.getRpcRequest)(msg);
    if (rpcRequest) {
        if (rpcRequest.direction === 'response'
            && rpcRequest.type === 'error') {
            this.dispatchRPCEvent('rpc-response', {
                id: msg.id,
                error: utils_1.WitnessError.fromProto(msg.requestError)
            });
            return;
        }
        const resType = (0, utils_1.getRpcResponseType)(rpcRequest.type);
        if (rpcRequest.direction === 'response') {
            this.dispatchRPCEvent('rpc-response', {
                id: msg.id,
                type: rpcRequest.type,
                data: msg[resType]
            });
            return;
        }
        if (!this.isInitialised && rpcRequest.type !== 'init') {
            this.logger.warn({ type: rpcRequest.type }, 'RPC request received before initialisation');
            this.sendMessage({
                id: msg.id,
                requestError: utils_1.WitnessError
                    .badRequest('Initialise connection first')
                    .toProto()
            });
            return;
        }
        return new Promise((resolve, reject) => {
            this.dispatchRPCEvent('rpc-request', {
                requestId: msg.id,
                type: rpcRequest.type,
                data: msg[(0, utils_1.getRpcRequestType)(rpcRequest.type)],
                respond: (res) => {
                    var _a;
                    if (!this.isOpen) {
                        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug({ type: rpcRequest.type, res }, 'connection closed before responding');
                        reject(new Error('connection closed'));
                        return;
                    }
                    if ('code' in res) {
                        reject(res);
                        return this.sendMessage({
                            id: msg.id,
                            requestError: res.toProto()
                        });
                    }
                    resolve();
                    return this
                        .sendMessage({ id: msg.id, [resType]: res });
                },
            });
        });
    }
    if (msg.tunnelMessage) {
        this.dispatchRPCEvent('tunnel-message', msg.tunnelMessage);
        return;
    }
    if (msg.tunnelDisconnectEvent) {
        this.dispatchRPCEvent('tunnel-disconnect-event', msg.tunnelDisconnectEvent);
        return;
    }
    this.logger.warn({ msg }, 'unhandled message');
}
