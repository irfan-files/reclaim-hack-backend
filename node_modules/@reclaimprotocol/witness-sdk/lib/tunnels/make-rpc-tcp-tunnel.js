"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRpcTcpTunnel = void 0;
const utils_1 = require("../utils");
/**
 * Makes a tunnel communication wrapper for a TCP tunnel.
 *
 * It listens for messages and disconnect events from the server,
 * and appropriately calls the `onMessage` and `onClose` callbacks.
 */
const makeRpcTcpTunnel = ({ tunnelId, client, onClose, onMessage, }) => {
    let closed = false;
    client.addEventListener('tunnel-message', onMessageListener);
    client.addEventListener('tunnel-disconnect-event', onDisconnectListener);
    client.addEventListener('connection-terminated', onConnectionTerminatedListener);
    return {
        write(message) {
            return client.sendMessage({
                tunnelMessage: { tunnelId, message }
            });
        },
        async close(err) {
            if (closed) {
                return;
            }
            onErrorRecv(err);
            await client.rpc('disconnectTunnel', { id: tunnelId });
        }
    };
    function onMessageListener({ data }) {
        if (data.tunnelId !== tunnelId) {
            return;
        }
        onMessage === null || onMessage === void 0 ? void 0 : onMessage(data.message);
    }
    function onDisconnectListener({ data }) {
        var _a;
        if (data.tunnelId !== tunnelId) {
            return;
        }
        onErrorRecv(((_a = data.error) === null || _a === void 0 ? void 0 : _a.code)
            ? utils_1.WitnessError.fromProto(data.error)
            : undefined);
    }
    function onConnectionTerminatedListener({ data }) {
        onErrorRecv(data);
    }
    function onErrorRecv(err) {
        var _a;
        (_a = client.logger) === null || _a === void 0 ? void 0 : _a.debug({ tunnelId, err }, 'TCP tunnel closed');
        client.removeEventListener('tunnel-message', onMessageListener);
        client.removeEventListener('tunnel-disconnect-event', onDisconnectListener);
        client.removeEventListener('connection-terminated', onConnectionTerminatedListener);
        onClose === null || onClose === void 0 ? void 0 : onClose(err);
        onClose = undefined;
        closed = true;
    }
};
exports.makeRpcTcpTunnel = makeRpcTcpTunnel;
