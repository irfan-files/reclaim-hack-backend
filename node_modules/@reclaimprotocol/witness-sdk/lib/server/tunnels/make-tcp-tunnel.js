"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeTcpTunnel = void 0;
const dns_1 = require("dns");
const https_proxy_agent_1 = require("https-proxy-agent");
const net_1 = require("net");
const config_1 = require("../../config");
const utils_1 = require("../../utils");
const env_1 = require("../../utils/env");
const iso_1 = require("../utils/iso");
const HTTPS_PROXY_URL = (0, env_1.getEnvVariable)('HTTPS_PROXY_URL');
/**
 * Builds a TCP tunnel to the given host and port.
 * If a geolocation is provided -- an HTTPS proxy is used
 * to connect to the host.
 *
 * HTTPS proxy essentially creates an opaque tunnel to the
 * host using the CONNECT method. Any data can be sent through
 * this tunnel to the end host.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
 *
 * The tunnel also retains a transcript of all messages sent and received.
 */
const makeTcpTunnel = async ({ onClose, onMessage, logger, ...opts }) => {
    const transcript = [];
    const socket = await connectTcp({ ...opts, logger });
    socket.once('error', close);
    socket.once('end', () => close(undefined));
    socket.on('data', message => {
        onMessage === null || onMessage === void 0 ? void 0 : onMessage(message);
        transcript.push({ sender: 'server', message });
    });
    return {
        transcript,
        createRequest: opts,
        async write(data) {
            transcript.push({ sender: 'client', message: data });
            await new Promise((resolve, reject) => {
                socket.write(data, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        },
        close,
    };
    function close(error) {
        if (socket.readableEnded) {
            return;
        }
        logger.debug({ err: error }, 'closing socket');
        socket.end(() => {
            // Do nothing
        });
        onClose === null || onClose === void 0 ? void 0 : onClose(error);
        onClose = undefined;
    }
};
exports.makeTcpTunnel = makeTcpTunnel;
setDnsServers();
async function connectTcp({ host, port, geoLocation, logger }) {
    let connectTimeout;
    let socket;
    try {
        await new Promise(async (resolve, reject) => {
            try {
                // add a timeout to ensure the connection doesn't hang
                // and cause our gateway to send out a 504
                connectTimeout = setTimeout(() => reject(new utils_1.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'Server connection timed out')), config_1.CONNECTION_TIMEOUT_MS);
                socket = await getSocket({
                    host,
                    port,
                    geoLocation,
                    logger
                });
                socket.once('connect', resolve);
                socket.once('error', reject);
                socket.once('end', () => (reject(new utils_1.WitnessError('WITNESS_ERROR_NETWORK_ERROR', 'connection closed'))));
            }
            catch (err) {
                reject(err);
            }
        });
        logger.debug({ addr: `${host}:${port}` }, 'connected');
        return socket;
    }
    catch (err) {
        socket === null || socket === void 0 ? void 0 : socket.end();
        throw err;
    }
    finally {
        clearTimeout(connectTimeout);
    }
}
async function getSocket(opts) {
    var _a;
    const { logger } = opts;
    try {
        return await _getSocket(opts);
    }
    catch (err) {
        // see if the proxy is blocking the connection
        // due to their own arbitrary rules,
        // if so -- we resolve hostname first &
        // connect directly via address to
        // avoid proxy knowing which host we're connecting to
        if (!(err instanceof utils_1.WitnessError)
            || ((_a = err.data) === null || _a === void 0 ? void 0 : _a.code) !== 403) {
            throw err;
        }
        const addrs = await resolveHostnames(opts.host);
        logger.info({ addrs, host: opts.host }, 'failed to connect due to restricted IP, trying via raw addr');
        for (const addr of addrs) {
            try {
                return await _getSocket({ ...opts, host: addr });
            }
            catch (err) {
                logger.error({ addr, err }, 'failed to connect to host');
            }
        }
        throw err;
    }
}
async function _getSocket({ host, port, geoLocation, logger }) {
    const socket = new net_1.Socket();
    if (geoLocation && !HTTPS_PROXY_URL) {
        logger.warn({ geoLocation }, 'geoLocation provided but no proxy URL found');
        geoLocation = '';
    }
    if (!geoLocation) {
        socket.connect({ host, port, });
        return socket;
    }
    if (!(0, iso_1.isValidCountryCode)(geoLocation)) {
        throw utils_1.WitnessError.badRequest(`Geolocation "${geoLocation}" is invalid. Must be 2 letter ISO country code`, { geoLocation });
    }
    const agentUrl = HTTPS_PROXY_URL.replace('{{geoLocation}}', (geoLocation === null || geoLocation === void 0 ? void 0 : geoLocation.toLowerCase()) || '');
    const agent = new https_proxy_agent_1.HttpsProxyAgent(agentUrl);
    const waitForProxyRes = new Promise(resolve => {
        // @ts-ignore
        socket.once('proxyConnect', resolve);
    });
    const proxySocket = await agent.connect(
    // ignore, because https-proxy-agent
    // expects an http request object
    // @ts-ignore
    socket, { host, port, timeout: config_1.CONNECTION_TIMEOUT_MS });
    const res = await waitForProxyRes;
    if (res.statusCode !== 200) {
        logger.error({ geoLocation, res }, 'Proxy geo location failed');
        throw new utils_1.WitnessError('WITNESS_ERROR_PROXY_ERROR', `Proxy via geo location "${geoLocation}" failed with status code: ${res.statusCode}, message: ${res.statusText}`, {
            code: res.statusCode,
            message: res.statusText,
        });
    }
    process.nextTick(() => {
        // ensure connect event is emitted
        // so it can be captured by the caller
        proxySocket.emit('connect');
    });
    return proxySocket;
}
async function resolveHostnames(hostname) {
    return new Promise((_resolve, reject) => {
        (0, dns_1.resolve)(hostname, (err, addresses) => {
            if (err) {
                reject(new Error(`Could not resolve hostname: ${hostname}, ${err.message}`));
            }
            else {
                _resolve(addresses);
            }
        });
    });
}
function setDnsServers() {
    (0, dns_1.setServers)(config_1.DNS_SERVERS);
}
