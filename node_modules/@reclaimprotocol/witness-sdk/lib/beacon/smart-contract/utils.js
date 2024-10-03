"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContract = getContract;
const ethers_1 = require("ethers");
const utils_1 = require("../../utils");
const config_json_1 = __importDefault(require("./config.json"));
const types_1 = require("./types");
const existingContractsMap = {};
/**
 * get the Reclaim beacon contract for the given chain
 * @param chainId hex-encoded string prefixed by 0x
 */
function getContract(chainKey) {
    if (!existingContractsMap[chainKey]) {
        const contractData = config_json_1.default[chainKey];
        if (!contractData) {
            throw utils_1.WitnessError
                .badRequest(`Unsupported chain: "${chainKey}"`);
        }
        const rpcProvider = new ethers_1.ethers.providers.JsonRpcProvider(contractData.rpcUrl);
        existingContractsMap[chainKey] = types_1.Reclaim__factory.connect(contractData.address, rpcProvider);
    }
    return existingContractsMap[chainKey];
}
