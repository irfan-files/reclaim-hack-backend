"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WitnessError = void 0;
const api_1 = require("../proto/api");
/**
 * Represents an error that can be thrown by the Witness SDK
 * or server. Provides a code, and optional data
 * to pass along with the error.
 */
class WitnessError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.message = message;
        this.data = data;
        this.name = 'WitnessError';
    }
    /**
     * Encodes the error as a WitnessErrorData
     * protobuf message
     */
    toProto() {
        return api_1.WitnessErrorData.create({
            code: api_1.WitnessErrorCode[this.code],
            message: this.message,
            data: JSON.stringify(this.data)
        });
    }
    static fromProto(data) {
        return new WitnessError(api_1.WitnessErrorCode[data.code], data.message, data.data ? JSON.parse(data.data) : undefined);
    }
    static fromError(err) {
        if (err instanceof WitnessError) {
            return err;
        }
        return new WitnessError('WITNESS_ERROR_INTERNAL', err.message);
    }
    static badRequest(message, data) {
        return new WitnessError('WITNESS_ERROR_BAD_REQUEST', message, data);
    }
}
exports.WitnessError = WitnessError;
