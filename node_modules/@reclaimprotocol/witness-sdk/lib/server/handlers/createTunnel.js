"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTunnel = void 0;
const utils_1 = require("../../utils");
const make_tcp_tunnel_1 = require("../tunnels/make-tcp-tunnel");
const apm_1 = require("../utils/apm");
const createTunnel = async ({ id, ...opts }, { tx, logger, client }) => {
    const apm = (0, apm_1.getApm)();
    const sessionTx = (apm === null || apm === void 0 ? void 0 : apm.startTransaction('tunnel', { childOf: tx })) || undefined;
    sessionTx === null || sessionTx === void 0 ? void 0 : sessionTx.addLabels({ tunnelId: id, ...opts });
    if (client.tunnels[id]) {
        throw utils_1.WitnessError.badRequest(`Tunnel "${id}" already exists`);
    }
    try {
        const tunnel = await (0, make_tcp_tunnel_1.makeTcpTunnel)({
            ...opts,
            logger,
            onMessage(message) {
                if (!client.isOpen) {
                    logger.warn('client is closed, dropping message');
                    return;
                }
                client.sendMessage({
                    tunnelMessage: {
                        tunnelId: id,
                        message
                    }
                });
            },
            onClose(err) {
                if (err) {
                    apm === null || apm === void 0 ? void 0 : apm.captureError(err, { parent: sessionTx });
                    tx === null || tx === void 0 ? void 0 : tx.setOutcome('failure');
                }
                tx === null || tx === void 0 ? void 0 : tx.end();
                if (!client.isOpen) {
                    return;
                }
                client.sendMessage({
                    tunnelDisconnectEvent: {
                        tunnelId: id,
                        error: err
                            ? utils_1.WitnessError
                                .fromError(err)
                                .toProto()
                            : undefined
                    }
                })
                    .catch(err => {
                    logger.error({ err }, 'failed to send tunnel disconnect event');
                });
            },
        });
        client.tunnels[id] = tunnel;
        return {};
    }
    catch (err) {
        apm === null || apm === void 0 ? void 0 : apm.captureError(err, { parent: sessionTx });
        tx === null || tx === void 0 ? void 0 : tx.setOutcome('failure');
        tx === null || tx === void 0 ? void 0 : tx.end();
        throw err;
    }
};
exports.createTunnel = createTunnel;
