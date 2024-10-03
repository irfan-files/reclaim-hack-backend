"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addKeepAlive = addKeepAlive;
const config_1 = require("../../config");
/**
 * Adds a keep-alive mechanism to the WebSocket
 * client
 */
function addKeepAlive(ws, logger) {
    let sendTimeout;
    let killTimeout;
    ws.on('message', () => {
        logger.trace('data recv, resetting timer');
        resetTimer();
    });
    ws.on('pong', () => {
        logger.trace('pong received, resetting timer');
        resetTimer();
    });
    ws.on('error', cleanup);
    ws.on('close', cleanup);
    function resetTimer() {
        cleanup();
        resetSendTimeout();
        killTimeout = setTimeout(() => {
            logger.warn('no data received in a while, closing connection');
            ws.close();
        }, config_1.MAX_NO_DATA_INTERVAL_MS);
    }
    function resetSendTimeout() {
        // reset ping
        sendTimeout = setTimeout(() => {
            ws.ping();
            resetSendTimeout();
        }, config_1.PING_INTERVAL_MS);
    }
    function cleanup() {
        clearTimeout(killTimeout);
        clearTimeout(sendTimeout);
    }
}
