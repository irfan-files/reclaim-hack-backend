import { CreateTunnelRequest } from '../proto/api';
import { IWitnessClient, MakeTunnelFn } from '../types';
export type TCPTunnelCreateOpts = {
    /**
     * The tunnel ID to communicate with.
     */
    tunnelId: CreateTunnelRequest['id'];
    client: IWitnessClient;
};
/**
 * Makes a tunnel communication wrapper for a TCP tunnel.
 *
 * It listens for messages and disconnect events from the server,
 * and appropriately calls the `onMessage` and `onClose` callbacks.
 */
export declare const makeRpcTcpTunnel: MakeTunnelFn<TCPTunnelCreateOpts>;
