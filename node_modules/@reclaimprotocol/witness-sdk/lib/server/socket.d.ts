import { IncomingMessage } from 'http';
import { WebSocket as WS } from 'ws';
import { WitnessSocket } from '../client/socket';
import { IWitnessServerSocket, Logger } from '../types';
export declare class WitnessServerSocket extends WitnessSocket implements IWitnessServerSocket {
    sessionId: number;
    tunnels: IWitnessServerSocket['tunnels'];
    private constructor();
    getTunnel(tunnelId: number): import("../types").Tunnel<import("../types").TCPSocketProperties>;
    static acceptConnection(socket: WS, req: IncomingMessage, logger: Logger): Promise<WitnessServerSocket | undefined>;
}
