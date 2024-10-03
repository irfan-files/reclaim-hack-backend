"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimTunnel = void 0;
const config_1 = require("../../config");
const api_1 = require("../../proto/api");
const utils_1 = require("../../utils");
const assert_valid_claim_request_1 = require("../utils/assert-valid-claim-request");
const generics_1 = require("../utils/generics");
const claimTunnel = async (claimRequest, { logger, client }) => {
    var _a, _b, _c;
    const { request, data: { timestampS } = {}, } = claimRequest;
    const tunnel = client.getTunnel(request === null || request === void 0 ? void 0 : request.id);
    // we throw an error for cases where the witness cannot prove
    // the user's request is faulty. For eg. if the user sends a
    // "createRequest" that does not match the tunnel's actual
    // create request -- the witness cannot prove that the user
    // is lying. In such cases, we throw a bad request error.
    // Same goes for matching the transcript.
    if (((_a = tunnel.createRequest) === null || _a === void 0 ? void 0 : _a.host) !== (request === null || request === void 0 ? void 0 : request.host)
        || ((_b = tunnel.createRequest) === null || _b === void 0 ? void 0 : _b.port) !== (request === null || request === void 0 ? void 0 : request.port)
        || ((_c = tunnel.createRequest) === null || _c === void 0 ? void 0 : _c.geoLocation) !== (request === null || request === void 0 ? void 0 : request.geoLocation)) {
        throw utils_1.WitnessError.badRequest('Tunnel request does not match');
    }
    (0, assert_valid_claim_request_1.assertTranscriptsMatch)(claimRequest.transcript, tunnel.transcript);
    const res = api_1.ClaimTunnelResponse.create({ request: claimRequest });
    try {
        const now = (0, utils_1.unixTimestampSeconds)();
        if (Math.floor(timestampS - now) > config_1.MAX_CLAIM_TIMESTAMP_DIFF_S) {
            throw new utils_1.WitnessError('WITNESS_ERROR_INVALID_CLAIM', `Timestamp provided ${timestampS} is too far off. Current time is ${now}`);
        }
        const claim = await (0, assert_valid_claim_request_1.assertValidClaimRequest)(claimRequest, client.metadata, logger);
        res.claim = {
            ...claim,
            identifier: (0, utils_1.getIdentifierFromClaimInfo)(claim),
            // hardcode for compatibility with V1 claims
            epoch: 1
        };
    }
    catch (err) {
        logger.error({ err }, 'invalid claim request');
        const witnessErr = utils_1.WitnessError.fromError(err);
        witnessErr.code = 'WITNESS_ERROR_INVALID_CLAIM';
        res.error = witnessErr.toProto();
    }
    res.signatures = {
        witnessAddress: await (0, generics_1.getWitnessAddress)(client.metadata.signatureType),
        claimSignature: res.claim
            ? await (0, generics_1.signAsWitness)((0, utils_1.createSignDataForClaim)(res.claim), client.metadata.signatureType)
            : new Uint8Array(),
        resultSignature: await (0, generics_1.signAsWitness)(api_1.ClaimTunnelResponse.encode(res).finish(), client.metadata.signatureType)
    };
    return res;
};
exports.claimTunnel = claimTunnel;
