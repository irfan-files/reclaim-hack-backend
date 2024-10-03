import { Reclaim } from './types';
/**
 * get the Reclaim beacon contract for the given chain
 * @param chainId hex-encoded string prefixed by 0x
 */
export declare function getContract(chainKey: string): Reclaim;
