"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultTlsOptions = getDefaultTlsOptions;
const tls_1 = require("@reclaimprotocol/tls");
const env_1 = require("./env");
// we only support the following cipher suites
// for ZK proof generation
const ZK_CIPHER_SUITES = [
    // chacha-20
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
    'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
    // aes-256
    'TLS_AES_256_GCM_SHA384',
    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    // aes-128
    'TLS_AES_128_GCM_SHA256',
    'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
];
const NAMED_CURVE_LIST = (0, env_1.detectEnvironment)() === 'node'
    ? tls_1.SUPPORTED_NAMED_CURVES
    // X25519 is not supported in the browser
    : tls_1.SUPPORTED_NAMED_CURVES.filter(c => c !== 'X25519');
function getDefaultTlsOptions() {
    return {
        cipherSuites: ZK_CIPHER_SUITES,
        namedCurves: NAMED_CURVE_LIST,
    };
}
