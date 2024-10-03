"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectedServiceSignature = exports.SelectedServiceSignatureType = exports.SIGNATURES = void 0;
const api_1 = require("../proto/api");
const eth_1 = require("./eth");
exports.SIGNATURES = {
    [api_1.ServiceSignatureType.SERVICE_SIGNATURE_TYPE_ETH]: eth_1.ETH_SIGNATURE_PROVIDER,
};
exports.SelectedServiceSignatureType = api_1.ServiceSignatureType.SERVICE_SIGNATURE_TYPE_ETH;
exports.SelectedServiceSignature = exports.SIGNATURES[exports.SelectedServiceSignatureType];
