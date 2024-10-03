import { Beacon, BeaconState, ClaimInfo, WitnessData } from '../types';
/**
 * Compute the list of witnesses that need to be
 * contacted for a claim
 *
 * @param state current beacon state
 * @param identifier params of the claim
 * @param timestampS timestamp of the claim
 */
export declare function fetchWitnessListForClaim({ witnesses, witnessesRequiredForClaim, epoch }: BeaconState, params: string | ClaimInfo, timestampS: number): WitnessData[];
/**
 * Get the ID (address on chain) from a private key
*/
export declare function getWitnessIdFromPrivateKey(privateKey: string): Promise<string>;
export declare function makeBeaconCacheable(beacon: Beacon): Beacon;
