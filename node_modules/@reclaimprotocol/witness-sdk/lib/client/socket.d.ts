import { InitRequest, RPCMessage, RPCMessages } from '../proto/api';
import { IWitnessSocket, Logger, RPCEvent, RPCEventMap } from '../types';
export declare class WitnessSocket implements IWitnessSocket {
    protected socket: WebSocket;
    metadata: InitRequest;
    logger: Logger;
    private eventTarget;
    isInitialised: boolean;
    constructor(socket: WebSocket, metadata: InitRequest, logger: Logger);
    get isOpen(): boolean;
    get isClosed(): boolean;
    sendMessage(...msgs: Partial<RPCMessage>[]): Promise<RPCMessages>;
    dispatchRPCEvent<K extends keyof RPCEventMap>(type: K, data: RPCEventMap[K]): void;
    addEventListener<K extends keyof RPCEventMap>(type: K, listener: (data: RPCEvent<K>) => void): void;
    removeEventListener<K extends keyof RPCEventMap>(type: K, listener: (data: RPCEvent<K>) => void): void;
    terminateConnection(err?: Error): Promise<void>;
}
