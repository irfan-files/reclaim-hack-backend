"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessClient = void 0;
const utils_1 = require("ethers/lib/utils");
const config_1 = require("../config");
const api_1 = require("../proto/api");
const utils_2 = require("../utils");
const ws_1 = require("../utils/ws");
const socket_1 = require("./socket");
class WitnessClient extends socket_1.WitnessSocket {
    constructor({ url, initMessages = [], signatureType = config_1.DEFAULT_METADATA.signatureType, logger = utils_2.logger, Websocket = ws_1.Websocket }) {
        const initRequest = { ...config_1.DEFAULT_METADATA, signatureType };
        const msg = (0, utils_2.packRpcMessages)({ initRequest }, ...initMessages);
        const initRequestBytes = api_1.RPCMessages.encode(msg).finish();
        const initRequestB64 = utils_1.base64.encode(initRequestBytes);
        url = new URL(url.toString());
        url.searchParams.set('messages', initRequestB64);
        super(new Websocket(url), initRequest, logger);
        this.waitForInit = () => {
            if (this.isClosed) {
                throw new utils_2.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'Client connection already closed');
            }
            return this.waitForInitPromise;
        };
        const initReqId = msg.messages[0].id;
        this.waitForInitPromise = this
            .waitForResponse(initReqId)
            .then(() => {
            logger.info('client initialised');
            this.isInitialised = true;
        });
        this.addEventListener('connection-terminated', ev => (logger.info({ err: ev.data }, 'connection terminated')));
    }
    async rpc(type, request) {
        const { messages: [{ id }] } = await this.sendMessage({ [(0, utils_2.getRpcRequestType)(type)]: request });
        const rslt = await this.waitForResponse(id);
        return rslt;
    }
    waitForResponse(id) {
        if (this.isClosed) {
            throw new utils_2.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'Client connection already closed');
        }
        // setup a promise to wait for the response
        return new Promise((resolve, reject) => {
            const handler = (event) => {
                if (event.data.id !== id) {
                    return;
                }
                removeHandlers();
                if ('error' in event.data) {
                    reject(event.data.error);
                    return;
                }
                // @ts-expect-error
                resolve(event.data.data);
            };
            const terminateHandler = (event) => {
                removeHandlers();
                // if the connection was terminated, reject the promise
                // but update the error code to reflect the network error
                if (event.data.code === 'WITNESS_ERROR_NO_ERROR') {
                    reject(new utils_2.WitnessError('WITNESS_ERROR_NETWORK_ERROR', event.data.message, event.data.data));
                    return;
                }
                reject(event.data);
            };
            const removeHandlers = () => {
                this.removeEventListener('rpc-response', handler);
                this.removeEventListener('connection-terminated', terminateHandler);
            };
            this.addEventListener('rpc-response', handler);
            this.addEventListener('connection-terminated', terminateHandler);
        });
    }
}
exports.WitnessClient = WitnessClient;
