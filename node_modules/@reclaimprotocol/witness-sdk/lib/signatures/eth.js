"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH_SIGNATURE_PROVIDER = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
exports.ETH_SIGNATURE_PROVIDER = {
    getPublicKey(privateKey) {
        const pub = (0, utils_1.computePublicKey)(privateKey, true);
        return ethers_1.utils.arrayify(pub);
    },
    getAddress(publicKey) {
        return (0, utils_1.computeAddress)(publicKey).toLowerCase();
    },
    async sign(data, privateKey) {
        const wallet = getEthWallet(privateKey);
        const signature = await wallet.signMessage(data);
        return ethers_1.utils.arrayify(signature);
    },
    async verify(data, signature, addressBytes) {
        const address = typeof addressBytes === 'string'
            ? addressBytes
            : ethers_1.utils.hexlify(addressBytes);
        const signerAddress = ethers_1.utils.verifyMessage(data, signature);
        return signerAddress.toLowerCase() === address.toLowerCase();
    }
};
function getEthWallet(privateKey) {
    if (!privateKey) {
        throw new Error('Private key missing');
    }
    return new ethers_1.Wallet(privateKey);
}
