// Access Config from the global scope
// const Config = window.Config;

// Determine if logging should be enabled based on environment
const isLogEnabled = [
    Config.environment === 'development',
    Config.environment === 'debug',
    Config.environment === 'testing',
    Config.environment === 'build',
    Config.environment === 'stage'
].some(Boolean); // Enable for all non-production environments

const Logger = {
    log: (...args) => {
        if (isLogEnabled) {
            console.log('[LOG]', ...args);
        }
    },
    info: (...args) => {
        if (isLogEnabled) {
            console.info('[INFO]', ...args);
        }
    },
    warn: (...args) => {
        if (isLogEnabled) {
            console.warn('[WARN]', ...args);
        }
    },
    error: (...args) => {
        if (isLogEnabled) {
            console.error('[ERROR]', ...args);
        }
    },
    debug: (...args) => {
        if (isLogEnabled) {
            console.debug('[DEBUG]', ...args);
        }
    },
};

// Expose to global scope
window.Logger = Logger;