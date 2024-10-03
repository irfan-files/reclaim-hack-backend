import { PrivateInput, Proof, PublicInput, VerificationKey } from "./types";
export declare function generateProof({ key, iv, }: PrivateInput, { ciphertext, }: PublicInput, zkey: any): Promise<Proof>;
export declare function verifyProof({ proofJson }: Proof, publicInput: PublicInput, zkey: VerificationKey): Promise<boolean>;
