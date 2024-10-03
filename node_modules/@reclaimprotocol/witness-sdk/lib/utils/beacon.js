"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWitnessListForClaim = fetchWitnessListForClaim;
exports.getWitnessIdFromPrivateKey = getWitnessIdFromPrivateKey;
exports.makeBeaconCacheable = makeBeaconCacheable;
const tls_1 = require("@reclaimprotocol/tls");
const ethers_1 = require("ethers");
const signatures_1 = require("../signatures");
const claims_1 = require("./claims");
/**
 * Compute the list of witnesses that need to be
 * contacted for a claim
 *
 * @param state current beacon state
 * @param identifier params of the claim
 * @param timestampS timestamp of the claim
 */
function fetchWitnessListForClaim({ witnesses, witnessesRequiredForClaim, epoch }, params, timestampS) {
    const identifier = typeof params === 'string'
        ? params
        : (0, claims_1.getIdentifierFromClaimInfo)(params);
    // include the epoch and
    // witnessesRequiredForClaim in the hash
    // so the same claim can be made multiple times
    // with different witnesses
    const completeInput = [
        identifier,
        epoch.toString(),
        witnessesRequiredForClaim.toString(),
        timestampS.toString(),
    ]
        .join('\n');
    const completeHashStr = ethers_1.ethers.utils.keccak256((0, tls_1.strToUint8Array)(completeInput));
    const completeHash = ethers_1.ethers.utils.arrayify(completeHashStr);
    const completeHashView = (0, tls_1.uint8ArrayToDataView)(completeHash);
    const witnessesLeft = [...witnesses];
    const selectedWitnesses = [];
    // we'll use 32 bits of the hash to select
    // each witness
    let byteOffset = 0;
    for (let i = 0; i < witnessesRequiredForClaim; i++) {
        const randomSeed = completeHashView.getUint32(byteOffset);
        const witnessIndex = randomSeed % witnessesLeft.length;
        const witness = witnessesLeft[witnessIndex];
        selectedWitnesses.push(witness);
        // Remove the selected witness from the list of witnesses left
        witnessesLeft[witnessIndex] = witnessesLeft[witnessesLeft.length - 1];
        witnessesLeft.pop();
        byteOffset = (byteOffset + 4) % completeHash.length;
    }
    return selectedWitnesses;
}
/**
 * Get the ID (address on chain) from a private key
*/
async function getWitnessIdFromPrivateKey(privateKey) {
    const pubKey = await signatures_1.SelectedServiceSignature.getPublicKey(privateKey);
    const id = await signatures_1.SelectedServiceSignature.getAddress(pubKey);
    return id;
}
function makeBeaconCacheable(beacon) {
    const cache = {};
    return {
        ...beacon,
        async getState(epochId) {
            if (!epochId) {
                // TODO: add cache here
                const state = await beacon.getState();
                return state;
            }
            const key = epochId;
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            if (!cache[key]) {
                cache[key] = beacon.getState(epochId);
            }
            return cache[key];
        },
    };
}
