"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentMemoryUsage = getCurrentMemoryUsage;
exports.generateRpcRequestId = generateRpcRequestId;
exports.getWsApiUrlFromLocation = getWsApiUrlFromLocation;
exports.mapToCreateClaimResponse = mapToCreateClaimResponse;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const utils_1 = require("../utils");
// track memory usage
async function getCurrentMemoryUsage() {
    if (!window.crossOriginIsolated) {
        return {
            available: false,
            content: 'N/A (page not cross-origin-isolated)'
        };
    }
    else if (!performance.measureUserAgentSpecificMemory) {
        return {
            available: false,
            content: 'N/A (performance.measureUserAgentSpecificMemory() is not available)',
        };
    }
    else {
        try {
            const result = await performance.measureUserAgentSpecificMemory();
            const totalmb = Math.round(result.bytes / 1024 / 1024);
            return {
                available: true,
                content: `${totalmb}mb`,
            };
        }
        catch (error) {
            if (error instanceof DOMException && error.name === 'SecurityError') {
                return {
                    available: false,
                    content: `N/A (${error.message})`,
                };
            }
            throw error;
        }
    }
}
function generateRpcRequestId() {
    return Math.random().toString(36).slice(2);
}
/**
 * The window RPC will be served from the same origin as the API server.
 * so we can get the API server's origin from the location.
 */
function getWsApiUrlFromLocation() {
    const { host, protocol } = location;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${host}${config_1.WS_PATHNAME}`;
}
function mapToCreateClaimResponse(res) {
    if (!res.claim) {
        throw utils_1.WitnessError.fromProto(res.error);
    }
    return {
        identifier: (0, utils_1.getIdentifierFromClaimInfo)(res.claim),
        claimData: res.claim,
        witnesses: [
            {
                id: res.signatures.witnessAddress,
                url: getWsApiUrlFromLocation()
            }
        ],
        signatures: [
            ethers_1.ethers.utils
                .hexlify(res.signatures.claimSignature)
                .toLowerCase()
        ]
    };
}
