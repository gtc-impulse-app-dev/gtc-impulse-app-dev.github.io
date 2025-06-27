// Enum for environment stages
const Env = {
    DEVELOPMENT: 'development',
    DEBUG: 'debug',
    TESTING: 'testing',
    BUILD: 'build',
    STAGE: 'stage',
    PRODUCTION: 'production'
};

// Set environment (manually adjust this value as needed)
const currentEnv = Env.DEVELOPMENT; // Default to development; change for other stages

const Config = {
    environment: currentEnv,
    api: {
        baseUrl: 'https://gtc-impulse-dev.azurewebsites.net',
            // currentEnv === Env.DEVELOPMENT ? 'http://localhost:3000' :
            // currentEnv === Env.STAGE ? 'https://stage-api.gtc-impulse.com' :
            //     'https://api.gtc-impulse.com',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        },
    },
    app: {
        name: 'GTC-Impulse',
        version: '1.0.0',
    },
    storage: {
        keys: {
            userId: 'GTCImpulse:userId',
            authToken: 'GTCImpulse:authToken',
        },
    },
};

// Expose to global scope
window.Config = Config;
window.Env = Env;