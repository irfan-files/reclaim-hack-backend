import { CreateClaimOnWitnessOpts, ProviderName } from '../types';
/**
 * Create a claim on a witness server
 */
export declare function createClaimOnWitness<N extends ProviderName>({ logger: _logger, ...opts }: CreateClaimOnWitnessOpts<N>): Promise<import("../proto/api").ClaimTunnelResponse>;
