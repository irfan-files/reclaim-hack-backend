import { RPCMessage } from '../proto/api';
import { IWitnessSocket } from '../types';
export declare function wsMessageHandler(this: IWitnessSocket, data: unknown): Promise<void>;
export declare function handleMessage(this: IWitnessSocket, msg: RPCMessage): Promise<void> | undefined;
