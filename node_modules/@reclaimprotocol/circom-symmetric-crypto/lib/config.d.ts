import { bitsToUint8Array, uint8ArrayToBits } from "./utils";
export declare const CONFIG: {
    chacha20: {
        chunkSize: number;
        bitsPerWord: number;
        keySizeBytes: number;
        ivSizeBytes: number;
        startCounter: number;
        blocksPerChunk: number;
        isLittleEndian: boolean;
        uint8ArrayToBits: (arr: Uint8Array) => number[][];
        bitsToUint8Array: (bits: number[]) => Uint8Array;
    };
    'aes-256-ctr': {
        chunkSize: number;
        bitsPerWord: number;
        keySizeBytes: number;
        ivSizeBytes: number;
        startCounter: number;
        blocksPerChunk: number;
        isLittleEndian: boolean;
        uint8ArrayToBits: typeof uint8ArrayToBits;
        bitsToUint8Array: typeof bitsToUint8Array;
    };
    'aes-128-ctr': {
        chunkSize: number;
        bitsPerWord: number;
        keySizeBytes: number;
        ivSizeBytes: number;
        startCounter: number;
        blocksPerChunk: number;
        isLittleEndian: boolean;
        uint8ArrayToBits: typeof uint8ArrayToBits;
        bitsToUint8Array: typeof bitsToUint8Array;
    };
};
