"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const signatures_1 = require("../../signatures");
const utils_1 = require("../../utils");
const init = async (initRequest, { client }) => {
    if (client.isInitialised) {
        throw utils_1.WitnessError.badRequest('Client already initialised');
    }
    if (!signatures_1.SIGNATURES[initRequest.signatureType]) {
        throw utils_1.WitnessError.badRequest('Unsupported signature type');
    }
    if (initRequest.clientVersion <= 0) {
        throw utils_1.WitnessError.badRequest('Unsupported client version');
    }
    client.metadata = initRequest;
    client.isInitialised = true;
    return {};
};
exports.init = init;
