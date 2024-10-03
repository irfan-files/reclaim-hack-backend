import { WitnessErrorCode, WitnessErrorData } from '../proto/api';
/**
 * Represents an error that can be thrown by the Witness SDK
 * or server. Provides a code, and optional data
 * to pass along with the error.
 */
export declare class WitnessError extends Error {
    code: keyof typeof WitnessErrorCode;
    message: string;
    data?: {
        [_: string]: any;
    } | undefined;
    readonly name = "WitnessError";
    constructor(code: keyof typeof WitnessErrorCode, message: string, data?: {
        [_: string]: any;
    } | undefined);
    /**
     * Encodes the error as a WitnessErrorData
     * protobuf message
     */
    toProto(): WitnessErrorData;
    static fromProto(data: WitnessErrorData): WitnessError;
    static fromError(err: Error): WitnessError;
    static badRequest(message: string, data?: {
        [_: string]: any;
    }): WitnessError;
}
