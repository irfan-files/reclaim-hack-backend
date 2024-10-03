"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.makeLogger = makeLogger;
exports.redact = redact;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./env");
const PII_PROPERTIES = ['ownerPrivateKey', 'secretParams'];
const redactedText = '[REDACTED]';
const envLevel = (0, env_1.getEnvVariable)('LOG_LEVEL');
exports.logger = makeLogger(false, envLevel);
/**
 * Creates a logger instance with optional redaction of PII.
 * See PII_PROPERTIES for the list of properties that will be redacted.
 *
 * @param redactPii - whether to redact PII from logs
 * @param level - the log level to use
 * @param onLog - a callback to call when a log is written
 */
function makeLogger(redactPii, level, onLog) {
    const opts = {
        // Log human readable time stamps instead of epoch time
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
    };
    if (redactPii) {
        opts.formatters = { log: redact };
        opts.serializers = { redact };
        opts.browser = {
            write: {
                fatal: log => writeLog('fatal', log),
                error: log => writeLog('error', log),
                warn: log => writeLog('warn', log),
                info: log => writeLog('info', log),
                debug: log => writeLog('debug', log),
                trace: log => writeLog('trace', log),
            }
        };
    }
    const logger = (0, pino_1.default)(opts);
    logger.level = level || 'info';
    return logger;
    function writeLog(level, log) {
        log = redact(log);
        const { msg, ...obj } = log;
        if (console[level]) {
            console[level](obj, msg);
        }
        else {
            console.log(obj, msg);
        }
        onLog === null || onLog === void 0 ? void 0 : onLog(level, log);
    }
}
function isObjectProperty(property) {
    return (typeof property) === 'object'
        && !Array.isArray(property)
        && property !== null;
}
function getReplacer() {
    // Store references to previously visited objects
    const references = new WeakSet();
    return function (key, value) {
        const isObject = (typeof value) === 'object' && value !== null;
        if (isObject) {
            if (references.has(value)) {
                return '[CIRCULAR]';
            }
            references.add(value);
        }
        return value;
    };
}
function redact(json) {
    const isObject = isObjectProperty(json);
    if (!isObject && !Array.isArray(json)) {
        return json;
    }
    const redacted = JSON.parse(JSON.stringify(json, getReplacer()));
    for (const prop in redacted) {
        if (PII_PROPERTIES.includes(prop)) {
            redacted[prop] = redactedText;
        }
        if (Array.isArray(redacted[prop])) {
            redacted[prop].forEach((value, index) => {
                redacted[prop][index] = redact(value);
            });
        }
        else if (isObjectProperty(redacted[prop])) {
            redacted[prop] = redact(redacted[prop]);
        }
    }
    return redacted;
}
