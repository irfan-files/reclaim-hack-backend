"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRpcTlsTunnel = void 0;
const tls_1 = require("@reclaimprotocol/tls");
const config_1 = require("../config");
const utils_1 = require("../utils");
const make_rpc_tcp_tunnel_1 = require("./make-rpc-tcp-tunnel");
/**
 * Makes a TLS tunnel that connects to the server via RPC protocol
 */
const makeRpcTlsTunnel = async ({ onMessage, onClose, tlsOpts, request, connect, logger }) => {
    const transcript = [];
    const tunnelId = request.id || (0, utils_1.generateTunnelId)();
    let tunnel;
    let client;
    let handshakeResolve;
    let handshakeReject;
    const waitForHandshake = new Promise((resolve, reject) => {
        handshakeResolve = resolve;
        handshakeReject = reject;
    });
    const tls = (0, tls_1.makeTLSClient)({
        host: request.host,
        ...tlsOpts,
        logger,
        onHandshake() {
            handshakeResolve === null || handshakeResolve === void 0 ? void 0 : handshakeResolve();
        },
        onApplicationData(plaintext) {
            return onMessage === null || onMessage === void 0 ? void 0 : onMessage(plaintext);
        },
        onTlsEnd: onConnectionClose,
        async write(packet, ctx) {
            const message = (0, tls_1.concatenateUint8Arrays)([
                packet.header,
                packet.content
            ]);
            transcript.push({
                sender: 'client',
                message: { ...ctx, data: message }
            });
            if (!tunnel) {
                // sends the packet as the initial message
                // to the plaintext tunnel. Prevents another
                // round trip to the server as we send the packet
                // in the same message as the tunnel creation.
                const createTunnelReqId = (0, utils_1.generateRpcMessageId)();
                client = connect([
                    {
                        id: createTunnelReqId,
                        createTunnelRequest: {
                            host: request.host || '',
                            port: request.port || config_1.DEFAULT_HTTPS_PORT,
                            geoLocation: request.geoLocation || '',
                            id: tunnelId
                        },
                    },
                    { tunnelMessage: { tunnelId, message } }
                ]);
                try {
                    await makeTunnel();
                    // wait for tunnel to be successfully created
                    await client.waitForResponse(createTunnelReqId);
                }
                catch (err) {
                    onConnectionClose(err);
                }
                return;
            }
            return tunnel.write(message);
        },
        onRead(packet, ctx) {
            transcript.push({
                sender: 'server',
                message: {
                    ...ctx,
                    data: (0, tls_1.concatenateUint8Arrays)([
                        packet.header,
                        // the TLS package sends us the decrypted
                        // content, so we need to get the orginal
                        // ciphertext received from the server
                        // as that's part of the true transcript.
                        ctx.type === 'ciphertext'
                            ? ctx.ciphertext
                            : packet.content
                    ])
                }
            });
        },
    });
    await tls.startHandshake();
    // wait for handshake completion
    await waitForHandshake;
    handshakeResolve = handshakeReject = undefined;
    return {
        transcript,
        tls,
        write(data) {
            return tls.write(data);
        },
        async close(err) {
            onConnectionClose(err);
            try {
                await tunnel.close(err);
            }
            catch (err) {
                logger === null || logger === void 0 ? void 0 : logger.error({ err }, 'err in close tunnel');
            }
        },
    };
    function onConnectionClose(err) {
        onClose === null || onClose === void 0 ? void 0 : onClose(err);
        // once the TLS connection is closed, we no longer
        // want to send `onClose` events back to the caller
        // of this function.
        onClose = undefined;
        handshakeReject === null || handshakeReject === void 0 ? void 0 : handshakeReject(err);
    }
    async function makeTunnel() {
        tunnel = await (0, make_rpc_tcp_tunnel_1.makeRpcTcpTunnel)({
            tunnelId,
            client: client,
            onMessage(data) {
                tls.handleReceivedBytes(data);
            },
            onClose(err) {
                tls.end(err);
            },
        });
        logger === null || logger === void 0 ? void 0 : logger.debug('plaintext tunnel created');
        return tunnel;
    }
};
exports.makeRpcTlsTunnel = makeRpcTlsTunnel;
