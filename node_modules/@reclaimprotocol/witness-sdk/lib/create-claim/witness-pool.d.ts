import { IWitnessClient, IWitnessClientCreateOpts } from '../types';
/**
 * Get a witness client from the pool,
 * if it doesn't exist, create one.
 */
export declare function getWitnessClientFromPool(url: string | URL, getCreateOpts?: () => Omit<IWitnessClientCreateOpts, 'url'>): IWitnessClient;
