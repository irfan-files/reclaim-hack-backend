import { ZKOperator } from '@reclaimprotocol/circom-symmetric-crypto';
import { EncryptionAlgorithm } from '@reclaimprotocol/circom-symmetric-crypto/lib/types';
export declare function makeLocalGnarkZkOperator(type: EncryptionAlgorithm): Promise<ZKOperator>;
