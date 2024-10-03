"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidateProviderParams = assertValidateProviderParams;
const ajv_1 = __importDefault(require("ajv"));
const providers_gen_1 = require("../types/providers.gen");
const error_1 = require("./error");
const PROVIDER_VALIDATOR_MAP = {};
const AJV = new ajv_1.default({
    allErrors: true,
    strict: true,
    strictRequired: false,
    formats: {
        binary(data) {
            return data instanceof Uint8Array
                || (typeof Buffer !== 'undefined'
                    && Buffer.isBuffer(data));
        },
        url(data) {
            try {
                new URL(data);
                return true;
            }
            catch (_a) {
                return false;
            }
        }
    }
});
function assertValidateProviderParams(name, params) {
    var _a;
    let validate = PROVIDER_VALIDATOR_MAP[name];
    if (!validate) {
        const schema = (_a = providers_gen_1.PROVIDER_SCHEMAS[name]) === null || _a === void 0 ? void 0 : _a.parameters;
        if (!schema) {
            throw new error_1.WitnessError('WITNESS_ERROR_BAD_REQUEST', `Invalid provider name "${name}"`);
        }
        validate = AJV.compile(schema);
    }
    if (!validate(params)) {
        throw new error_1.WitnessError('WITNESS_ERROR_BAD_REQUEST', 'Params validation failed', { errors: JSON.stringify(validate.errors) });
    }
}
