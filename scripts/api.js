const Global = window.Global;
const { Config, Logger } = window;

function getUserId() {
    return new Promise((resolve) => {
        const request = indexedDB.open('GTCImpulseDB', 1);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['userStore'], 'readonly');
            const store = transaction.objectStore('userStore');
            const getRequest = store.get('userId');
            getRequest.onsuccess = () => resolve(getRequest.result || null);
            getRequest.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
    });
}

async function apiRequest(endpoint, options = {}) {
    const url = `${Config.api.baseUrl}${endpoint}`;
    const userId = await getUserId();
    const headers = { ...Config.api.headers };

    // Exclude x-user-id for login and register
    if (!['/login', '/register'].some(path => endpoint.includes(path)) && userId) {
        headers['x-user-id'] = userId;
    }

    const fetchOptions = {
        ...options,
        headers,
        timeout: Config.api.timeout,
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        Logger.error('API request failed', { endpoint, error });
        throw error;
    }
}

window.api = { apiRequest };