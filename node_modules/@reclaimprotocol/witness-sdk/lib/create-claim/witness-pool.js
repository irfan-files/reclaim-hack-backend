"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWitnessClientFromPool = getWitnessClientFromPool;
const client_1 = require("../client");
const POOL = {};
/**
 * Get a witness client from the pool,
 * if it doesn't exist, create one.
 */
function getWitnessClientFromPool(url, getCreateOpts = () => ({})) {
    var _a;
    const key = url.toString();
    let client = POOL[key];
    let createReason;
    if (client === null || client === void 0 ? void 0 : client.isClosed) {
        createReason = 'closed';
    }
    else if (!client) {
        createReason = 'non-existent';
    }
    if (createReason) {
        const createOpts = getCreateOpts();
        (_a = createOpts === null || createOpts === void 0 ? void 0 : createOpts.logger) === null || _a === void 0 ? void 0 : _a.info({ key, createReason }, 'creating new witness client');
        client = (POOL[key] = new client_1.WitnessClient({ ...createOpts, url }));
    }
    return client;
}
