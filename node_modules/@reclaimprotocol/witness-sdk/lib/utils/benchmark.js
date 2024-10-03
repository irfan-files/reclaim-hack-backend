"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Benchmark = Benchmark;
const tls_1 = require("@reclaimprotocol/tls");
const logger_1 = require("./logger");
const zk_1 = require("./zk");
const ZK_CIPHER_SUITES = [
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256'
];
async function Benchmark() {
    let benchmarkRes = '';
    for (const cipherSuite of ZK_CIPHER_SUITES) {
        const now = Date.now();
        const alg = cipherSuite.includes('CHACHA20')
            ? 'CHACHA20-POLY1305'
            : (cipherSuite.includes('AES_256_GCM')
                ? 'AES-256-GCM'
                : 'AES-128-GCM');
        const keylength = alg === 'AES-128-GCM' ? 16 : 32;
        const key = Buffer.alloc(keylength, 0);
        const { ivLength: fixedIvLength, } = tls_1.SUPPORTED_CIPHER_SUITE_MAP[cipherSuite];
        const fixedIv = Buffer.alloc(fixedIvLength, 0);
        const encKey = await tls_1.crypto.importKey(alg, key);
        const vectors = [
            {
                plaintext: 'My cool API secret is "my name jeff". Please don\'t reveal it'
            }
        ];
        const proofGenerator = await (0, zk_1.makeZkProofGenerator)({
            logger: logger_1.logger,
            cipherSuite,
        });
        for (const { plaintext } of vectors) {
            const plaintextArr = (0, tls_1.strToUint8Array)(plaintext);
            const { ciphertext, iv } = await (0, tls_1.encryptWrappedRecord)(plaintextArr, {
                key: encKey,
                iv: fixedIv,
                recordNumber: 0,
                recordHeaderOpts: {
                    type: 'WRAPPED_RECORD'
                },
                cipherSuite,
                version: cipherSuite.includes('ECDHE_')
                    ? 'TLS1_2'
                    : 'TLS1_3',
            });
            const packet = {
                type: 'ciphertext',
                encKey,
                iv,
                recordNumber: 0,
                plaintext: plaintextArr,
                ciphertext,
                fixedIv: new Uint8Array(0),
                data: ciphertext
            };
            await proofGenerator.addPacketToProve(packet, {
                type: 'zk',
                redactedPlaintext: plaintextArr,
            }, () => { });
            await proofGenerator.generateProofs();
        }
        benchmarkRes = benchmarkRes + `Benchmark ${alg} ok. Took ${Date.now() - now} ms \n`;
    }
    logger_1.logger.info(benchmarkRes);
    return benchmarkRes;
}
