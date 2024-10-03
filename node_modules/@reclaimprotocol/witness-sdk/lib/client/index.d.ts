import { IWitnessClient, IWitnessClientCreateOpts, RPCRequestData, RPCResponseData, RPCType } from '../types';
import { WitnessSocket } from './socket';
export declare class WitnessClient extends WitnessSocket implements IWitnessClient {
    private waitForInitPromise;
    constructor({ url, initMessages, signatureType, logger, Websocket }: IWitnessClientCreateOpts);
    rpc<T extends RPCType>(type: T, request: Partial<RPCRequestData<T>>): Promise<Exclude<import("../proto/api").RPCMessage[`${T}Response`], undefined>>;
    waitForResponse<T extends RPCType>(id: number): Promise<RPCResponseData<T>>;
    waitForInit: () => Promise<void>;
}
