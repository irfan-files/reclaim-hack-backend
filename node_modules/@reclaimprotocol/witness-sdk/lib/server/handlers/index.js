"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HANDLERS = void 0;
const claimTunnel_1 = require("./claimTunnel");
const createTunnel_1 = require("./createTunnel");
const disconnectTunnel_1 = require("./disconnectTunnel");
const init_1 = require("./init");
exports.HANDLERS = {
    createTunnel: createTunnel_1.createTunnel,
    disconnectTunnel: disconnectTunnel_1.disconnectTunnel,
    claimTunnel: claimTunnel_1.claimTunnel,
    init: init_1.init
};
