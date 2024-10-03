"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessSocket = void 0;
const api_1 = require("../proto/api");
const utils_1 = require("../utils");
const message_handler_1 = require("./message-handler");
class WitnessSocket {
    constructor(socket, metadata, logger) {
        this.socket = socket;
        this.metadata = metadata;
        this.logger = logger;
        this.eventTarget = new EventTarget();
        this.isInitialised = false;
        socket.addEventListener('error', (event) => {
            const witErr = utils_1.WitnessError.fromError(event.error
                || new Error(event.message));
            witErr.code = 'WITNESS_ERROR_NETWORK_ERROR';
            this.dispatchRPCEvent('connection-terminated', witErr);
        });
        socket.addEventListener('close', () => (this.dispatchRPCEvent('connection-terminated', new utils_1.WitnessError('WITNESS_ERROR_NO_ERROR', 'connection closed'))));
        socket.addEventListener('message', async ({ data }) => {
            try {
                await message_handler_1.wsMessageHandler.call(this, data);
            }
            catch (err) {
                this.logger.error({ err }, 'error processing message');
            }
        });
    }
    get isOpen() {
        return this.socket.readyState === this.socket.OPEN;
    }
    get isClosed() {
        return this.socket.readyState === this.socket.CLOSED
            || this.socket.readyState === this.socket.CLOSING;
    }
    async sendMessage(...msgs) {
        if (this.isClosed) {
            throw new utils_1.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'Connection closed, cannot send message');
        }
        if (!this.isOpen) {
            throw new utils_1.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'Wait for connection to open before sending message');
        }
        const msg = (0, utils_1.packRpcMessages)(...msgs);
        const bytes = api_1.RPCMessages.encode(msg).finish();
        await this.socket.send(bytes);
        return msg;
    }
    dispatchRPCEvent(type, data) {
        const event = (0, utils_1.makeRpcEvent)(type, data);
        this.eventTarget.dispatchEvent(event);
    }
    addEventListener(type, listener) {
        this.eventTarget.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
        this.eventTarget.removeEventListener(type, listener);
    }
    async terminateConnection(err) {
        var _a;
        // connection already closed
        if (this.isClosed) {
            return;
        }
        try {
            const witErr = err
                ? utils_1.WitnessError.fromError(err)
                : new utils_1.WitnessError('WITNESS_ERROR_NO_ERROR', '');
            this.dispatchRPCEvent('connection-terminated', witErr);
            if (this.isOpen) {
                await this.sendMessage({
                    connectionTerminationAlert: witErr.toProto()
                });
            }
        }
        catch (err) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error({ err }, 'error terminating connection');
        }
        finally {
            this.socket.close();
        }
    }
}
exports.WitnessSocket = WitnessSocket;
