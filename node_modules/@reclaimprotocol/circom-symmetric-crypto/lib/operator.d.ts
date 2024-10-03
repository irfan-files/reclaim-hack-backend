import { EncryptionAlgorithm, ZKOperator, ZKParams } from "./types";
/**
 * Make a ZK operator from the snarkjs dependency
 * @param logger
 * @returns
 */
export declare function makeLocalSnarkJsZkOperator(type: EncryptionAlgorithm): Promise<ZKOperator>;
/**
 * Make a SnarkJS ZK operator from the provided
 * fns to get the circuit wasm and zkey
 */
export declare function makeSnarkJsZKOperator({ getCircuitWasm, getZkey }: ZKParams): ZKOperator;
