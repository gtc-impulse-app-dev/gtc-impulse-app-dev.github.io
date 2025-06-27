// Constant for minimum wait time in seconds
const MIN_WAIT_TIME = 5; // Adjust this value as needed

// Access global functions
const Global = window.Global;
const { Config, Logger } = window;

// IndexedDB setup
const dbName = 'GTCImpulseDB';
const storeName = 'userStore';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(storeName);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getUserId() {
    return new Promise((resolve) => {
        openDB().then((db) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get('userId');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        }).catch(() => resolve(null));
    });
}

// Navigation function
function navigateTo(path) {
    if (path.startsWith('/')) path = path.substring(1);
    history.pushState({}, '', '/' + path);
    renderContent();
}

// Render content (placeholder)
function renderContent() {
    const path = window.location.pathname;
    if (path !== '/splash.html') {
        const splash = document.querySelector('.splash-container');
        if (splash) splash.style.display = 'none';
    }
    // Additional rendering logic will be in other pages' scripts
}

// Check userId after minimum wait
document.addEventListener('DOMContentLoaded', () => {
    const startTime = Date.now();
    const minWaitMs = MIN_WAIT_TIME * 1000;

    Logger.info('Splash screen loaded', { minWaitMs });
    setTimeout(() => {
        getUserId().then((userId) => {
            Logger.info('UserId check completed', { userId });
            history.replaceState({}, '', userId ? '/home.html' : '/login.html');
            window.location.href = userId ? '/home.html' : '/login.html';
        }).catch((error) => {
            Logger.error('Error checking userId', error);
            history.replaceState({}, '', '/login.html');
            window.location.href = '/login.html';
        });
    }, minWaitMs - (Date.now() - startTime));
});