import { IncomingMessage } from 'http';
import { ServiceSignatureType } from '../../proto/api';
/**
 * Sign using the witness's private key.
 */
export declare function signAsWitness(data: Uint8Array | string, scheme: ServiceSignatureType): Uint8Array | Promise<Uint8Array>;
/**
 * Get the witness's address, from the PRIVATE_KEY env var.
 */
export declare function getWitnessAddress(scheme: ServiceSignatureType): string;
/**
 * Nice parse JSON with a key.
 * If the data is empty, returns an empty object.
 * And if the JSON is invalid, throws a bad request error,
 * with the key in the error message.
 */
export declare function niceParseJsonObject(data: string, key: string): any;
/**
 * Extract any initial messages sent to the witness
 * via the query string.
 */
export declare function getInitialMessagesFromQuery(req: IncomingMessage): import("../../proto/api").RPCMessage[];
