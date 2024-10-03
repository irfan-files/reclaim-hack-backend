"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeReclaimTrustedBeacon = makeReclaimTrustedBeacon;
const api_1 = require("../../proto/api");
const config_json_1 = __importDefault(require("./config.json"));
function makeReclaimTrustedBeacon(id) {
    if (config_json_1.default.id !== id) {
        throw new Error(`Invalid reclaim trusted beacon id: ${id}`);
    }
    return {
        identifier: {
            type: api_1.BeaconType.BEACON_TYPE_RECLAIM_TRUSTED,
            id,
        },
        getState() {
            return {
                witnesses: [config_json_1.default],
                epoch: 1,
                witnessesRequiredForClaim: 1,
                nextEpochTimestampS: 0,
            };
        },
    };
}
