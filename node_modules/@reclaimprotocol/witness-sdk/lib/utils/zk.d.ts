import { EncryptionAlgorithm, PrivateInput, PublicInput, ZKOperator } from '@reclaimprotocol/circom-symmetric-crypto';
import { CipherSuite } from '@reclaimprotocol/tls';
import { MessageReveal_MessageRevealZk as ZKReveal, MessageReveal_ZKProof as ZKProof } from '../proto/api';
import { CompleteTLSPacket, Logger, PrepareZKProofsBaseOpts, ZKEngine, ZKOperators, ZKRevealInfo } from '../types';
type PrepareZKProofsOpts = {
    logger?: Logger;
    cipherSuite: CipherSuite;
} & PrepareZKProofsBaseOpts;
type ZKVerifyOpts = {
    cipherSuite: CipherSuite;
    ciphertext: Uint8Array;
    zkReveal: ZKReveal;
    logger?: Logger;
    /** get ZK operator for specified algorithm */
    zkOperators?: ZKOperators;
    zkEngine?: ZKEngine;
};
type ZKProofToGenerate = {
    startIdx: number;
    redactedPlaintext: Uint8Array;
    privateInput: PrivateInput;
    publicInput: PublicInput;
};
type ZKPacketToProve = {
    onGeneratedProofs(proofs: ZKProof[]): void;
    algorithm: EncryptionAlgorithm;
    proofsToGenerate: ZKProofToGenerate[];
};
export declare function makeZkProofGenerator({ zkOperators, logger, zkProofConcurrency, maxZkChunks, cipherSuite, zkEngine }: PrepareZKProofsOpts): Promise<{
    /**
     * Adds the given packet to the list of packets to
     * generate ZK proofs for.
     *
     * Call `generateProofs()` to finally generate the proofs
     */
    addPacketToProve(packet: CompleteTLSPacket, reveal: ZKRevealInfo, onGeneratedProofs: ZKPacketToProve["onGeneratedProofs"]): Promise<void>;
    getTotalChunksToProve(): number;
    generateProofs(onChunkDone?: () => void): Promise<void>;
}>;
/**
 * Verify the given ZK proof
 */
export declare function verifyZkPacket({ cipherSuite, ciphertext, zkReveal, zkOperators, logger, zkEngine }: ZKVerifyOpts): Promise<{
    redactedPlaintext: Uint8Array;
}>;
export declare function makeDefaultZkOperator(algorithm: EncryptionAlgorithm, zkEngine: ZKEngine, logger: Logger): Promise<ZKOperator>;
export {};
