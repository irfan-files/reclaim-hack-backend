"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWithRetries = executeWithRetries;
/**
 * Execute a function, and upon failure -- retry
 * based on specified options.
 */
async function executeWithRetries(code, { maxRetries = 3, shouldRetry, logger, }) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const result = await code(retries);
            return result;
        }
        catch (err) {
            retries += 1;
            if (retries >= maxRetries) {
                throw err;
            }
            if (!shouldRetry(err)) {
                throw err;
            }
            logger.info({ err, retries }, 'retrying failed operation');
        }
    }
    throw new Error('retries exhausted');
}
