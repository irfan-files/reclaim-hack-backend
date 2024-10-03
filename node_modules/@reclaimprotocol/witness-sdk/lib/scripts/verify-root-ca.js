"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const tls_1 = require("@reclaimprotocol/tls");
const parse_certificate_1 = require("@reclaimprotocol/tls/lib/utils/parse-certificate");
const net_1 = require("net");
const config_1 = require("../config");
const utils_1 = require("../utils");
const hostPort = process.argv[2];
async function main() {
    const [host, port] = hostPort.split(':');
    const socket = new net_1.Socket();
    let rootIssuer = '';
    let certError;
    const tls = (0, tls_1.makeTLSClient)({
        host,
        logger: utils_1.logger,
        verifyServerCertificate: false,
        async onRecvCertificates({ certificates }) {
            rootIssuer = certificates[certificates.length - 1].internal.issuer;
            utils_1.logger.info({ rootIssuer }, 'received certificates');
            try {
                await (0, parse_certificate_1.verifyCertificateChain)(certificates, host);
                utils_1.logger.info('root CA in store. Successfully verified certificate chain');
            }
            catch (err) {
                certError = err;
            }
        },
        async onHandshake() {
            await tls.end();
            socket.end();
            if (certError) {
                // wait for everything else to log
                setTimeout(() => {
                    utils_1.logger.info({ err: certError.message, rootIssuer }, 'error in cert verify');
                }, 500);
            }
        },
        async write({ header, content }) {
            socket.write(header);
            socket.write(content);
        }
    });
    socket.once('connect', () => tls.startHandshake());
    socket.on('data', tls.handleReceivedBytes);
    utils_1.logger.info(`connecting to ${hostPort}`);
    socket.connect({ host, port: +(port || config_1.DEFAULT_HTTPS_PORT) });
}
main();
