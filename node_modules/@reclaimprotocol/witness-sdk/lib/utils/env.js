"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEnvironment = detectEnvironment;
exports.getEnvVariable = getEnvVariable;
function detectEnvironment() {
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
        return 'react-native';
    }
    if (typeof window !== 'undefined') {
        return 'browser';
    }
    return 'node';
}
function getEnvVariable(name) {
    if (typeof process === 'undefined') {
        return undefined;
    }
    return process === null || process === void 0 ? void 0 : process.env[name];
}
