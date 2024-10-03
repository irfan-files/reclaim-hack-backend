"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAsWitness = signAsWitness;
exports.getWitnessAddress = getWitnessAddress;
exports.niceParseJsonObject = niceParseJsonObject;
exports.getInitialMessagesFromQuery = getInitialMessagesFromQuery;
const tls_1 = require("@reclaimprotocol/tls");
const api_1 = require("../../proto/api");
const signatures_1 = require("../../signatures");
const utils_1 = require("../../utils");
const env_1 = require("../../utils/env");
const PRIVATE_KEY = (0, env_1.getEnvVariable)('PRIVATE_KEY');
/**
 * Sign using the witness's private key.
 */
function signAsWitness(data, scheme) {
    const { sign } = signatures_1.SIGNATURES[scheme];
    return sign(typeof data === 'string' ? (0, tls_1.strToUint8Array)(data) : data, PRIVATE_KEY);
}
/**
 * Get the witness's address, from the PRIVATE_KEY env var.
 */
function getWitnessAddress(scheme) {
    const { getAddress, getPublicKey } = signatures_1.SIGNATURES[scheme];
    const publicKey = getPublicKey(PRIVATE_KEY);
    return getAddress(publicKey);
}
/**
 * Nice parse JSON with a key.
 * If the data is empty, returns an empty object.
 * And if the JSON is invalid, throws a bad request error,
 * with the key in the error message.
 */
function niceParseJsonObject(data, key) {
    if (!data) {
        return {};
    }
    try {
        return JSON.parse(data);
    }
    catch (e) {
        throw utils_1.WitnessError.badRequest(`Invalid JSON in ${key}: ${e.message}`);
    }
}
/**
 * Extract any initial messages sent to the witness
 * via the query string.
 */
function getInitialMessagesFromQuery(req) {
    const url = new URL(req.url, 'http://localhost');
    const messagesB64 = url.searchParams.get('messages');
    if (!(messagesB64 === null || messagesB64 === void 0 ? void 0 : messagesB64.length)) {
        return [];
    }
    const msgsBytes = Buffer.from(messagesB64, 'base64');
    const msgs = api_1.RPCMessages.decode(msgsBytes);
    return msgs.messages;
}
