"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeLocalGnarkZkOperator = makeLocalGnarkZkOperator;
const koffi = __importStar(require("koffi"));
// define object GoSlice to map to:
// C type struct { void *data; GoInt len; GoInt cap; }
koffi.reset(); //otherwise tests will fail
const GoSlice = koffi.struct('GoSlice', {
    data: 'void *',
    len: 'longlong',
    cap: 'longlong'
});
const ProveReturn = koffi.struct('ProveReturn', {
    r0: 'void *',
    r1: 'longlong',
});
const libVerify = koffi.load('./gnark/libverify.so');
const libProve = koffi.load('./gnark/libprove.so');
const verify = libVerify.func('Verify', 'unsigned char', [GoSlice]);
const init = libProve.func('Init', 'void', []);
const free = libProve.func('Free', 'void', ['void *']);
const initComplete = libProve.func('InitComplete', 'unsigned char', []);
const prove = libProve.func('Prove', ProveReturn, [GoSlice]);
function makeLocalGnarkZkOperator(type) {
    return Promise.resolve({
        async generateWitness(input) {
            //input is already in bits, sometimes groups of bits
            const proofParams = {
                cipher: type,
                key: input.key,
                nonce: input.nonce,
                counter: input.counter,
                input: input.in,
            };
            const paramsJson = JSON.stringify(proofParams);
            return new Uint8Array(Buffer.from(paramsJson));
        },
        async groth16Prove(witness) {
            init(); // safe to call multiple times
            while (initComplete() !== 1) {
                await sleep(100);
            }
            const wtns = {
                data: Buffer.from(witness),
                len: witness.length,
                cap: witness.length
            };
            const res = prove(wtns);
            const resJson = Buffer.from(koffi.decode(res.r0, 'unsigned char', res.r1)).toString();
            free(res.r0); // Avoid memory leak!
            const { proofJson, publicSignals } = JSON.parse(resJson);
            return Promise.resolve({
                proof: { proofJson: proofJson },
                publicSignals: publicSignals
            });
        },
        async groth16Verify(publicSignals, proof) {
            const proofStr = proof.proofJson;
            const verifyParams = {
                cipher: type,
                proof: proofStr,
                publicSignals: publicSignals,
            };
            const paramsJson = JSON.stringify(verifyParams);
            const paramsBuf = Buffer.from(paramsJson);
            const params = {
                data: paramsBuf,
                len: paramsJson.length,
                cap: paramsJson.length
            };
            return verify(params) === 1;
        },
    });
    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
