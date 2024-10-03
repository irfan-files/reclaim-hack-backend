"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBeacon = getBeacon;
const api_1 = require("../proto/api");
const reclaim_trusted_1 = require("./reclaim-trusted");
const smart_contract_1 = __importDefault(require("./smart-contract"));
const BEACON_MAP = {};
const BEACON_TYPE_MAP = {
    [api_1.BeaconType.BEACON_TYPE_SMART_CONTRACT]: smart_contract_1.default,
    [api_1.BeaconType.BEACON_TYPE_UNKNOWN]: () => {
        throw new Error('Unknown beacon type');
    },
    [api_1.BeaconType.UNRECOGNIZED]: () => {
        throw new Error('Unrecognized beacon type');
    },
    [api_1.BeaconType.BEACON_TYPE_RECLAIM_TRUSTED]: reclaim_trusted_1.makeReclaimTrustedBeacon
};
/**
 * Get the beacon for a given identifier
 */
function getBeacon(identifier) {
    const uqId = `${identifier.type}-${identifier.id}`;
    if (BEACON_MAP[uqId]) {
        return BEACON_MAP[uqId];
    }
    const beacon = BEACON_TYPE_MAP[identifier.type](identifier.id);
    BEACON_MAP[uqId] = beacon;
    return beacon;
}
