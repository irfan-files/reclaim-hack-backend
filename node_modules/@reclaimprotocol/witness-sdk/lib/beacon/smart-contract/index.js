"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = makeSmartContractBeacon;
const api_1 = require("../../proto/api");
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
function makeSmartContractBeacon(chainId) {
    const contract = (0, utils_2.getContract)(chainId);
    return (0, utils_1.makeBeaconCacheable)({
        identifier: {
            type: api_1.BeaconType.BEACON_TYPE_SMART_CONTRACT,
            id: chainId.toString()
        },
        async getState(epochId) {
            const epoch = await contract.fetchEpoch(epochId || 0);
            if (!epoch.id) {
                throw new Error(`Invalid epoch ID: ${epochId}`);
            }
            return {
                epoch: epoch.id,
                witnesses: epoch.witnesses.map(w => ({
                    id: w.addr.toLowerCase(),
                    url: w.host
                })),
                witnessesRequiredForClaim: epoch.minimumWitnessesForClaimCreation,
                nextEpochTimestampS: epoch.timestampEnd
            };
        }
    });
}
