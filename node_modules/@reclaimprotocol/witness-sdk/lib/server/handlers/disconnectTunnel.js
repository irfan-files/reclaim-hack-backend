"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectTunnel = void 0;
const disconnectTunnel = async ({ id }, { client }) => {
    const tunnel = client.getTunnel(id);
    await tunnel.close(new Error('Tunnel disconnected'));
    return {};
};
exports.disconnectTunnel = disconnectTunnel;
