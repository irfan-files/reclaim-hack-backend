"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preparePacketsForReveal = preparePacketsForReveal;
const tls_1 = require("@reclaimprotocol/tls");
const api_1 = require("../proto/api");
const zk_1 = require("./zk");
/**
 * Prepares the packets for reveal to the server
 * according to the specified reveal type
 */
async function preparePacketsForReveal(tlsTranscript, reveals, { onZkProgress, ...opts }) {
    const transcript = [];
    const proofGenerator = await (0, zk_1.makeZkProofGenerator)(opts);
    let zkPacketsDone = 0;
    await Promise.all(tlsTranscript.map(async ({ message, sender }) => {
        const msg = {
            sender: sender === 'client'
                ? api_1.TranscriptMessageSenderType.TRANSCRIPT_MESSAGE_SENDER_TYPE_CLIENT
                : api_1.TranscriptMessageSenderType.TRANSCRIPT_MESSAGE_SENDER_TYPE_SERVER,
            message: message.data,
            reveal: undefined
        };
        transcript.push(msg);
        const reveal = reveals.get(message);
        if (!reveal || message.type === 'plaintext') {
            return;
        }
        switch (reveal === null || reveal === void 0 ? void 0 : reveal.type) {
            case 'complete':
                msg.reveal = {
                    directReveal: {
                        key: await tls_1.crypto.exportKey(message.encKey),
                        iv: message.fixedIv,
                        recordNumber: message.recordNumber,
                    },
                };
                break;
            case 'zk':
                // the redacted section can be smaller than the actual
                // plaintext encrypted, in case of TLS1.3 as it has a
                // content type suffix
                reveal.redactedPlaintext = (0, tls_1.concatenateUint8Arrays)([
                    reveal.redactedPlaintext,
                    message.plaintext.slice(reveal.redactedPlaintext.length)
                ]);
                await proofGenerator.addPacketToProve(message, reveal, proofs => (msg.reveal = { zkReveal: { proofs } }));
                break;
            default:
                // no reveal
                break;
        }
    }));
    const zkPacketsTotal = proofGenerator.getTotalChunksToProve();
    onZkProgress === null || onZkProgress === void 0 ? void 0 : onZkProgress(zkPacketsDone, zkPacketsTotal);
    await proofGenerator.generateProofs(() => {
        zkPacketsDone += 1;
        onZkProgress === null || onZkProgress === void 0 ? void 0 : onZkProgress(zkPacketsDone, zkPacketsTotal);
    });
    return transcript;
}
