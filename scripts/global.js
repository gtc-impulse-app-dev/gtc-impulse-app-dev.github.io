// Placeholder global functions
const Global = {
    setUserId: function(userId) {
        return new Promise((resolve) => {
            const request = indexedDB.open('GTCImpulseDB', 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('userStore');
            };
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['userStore'], 'readwrite');
                const store = transaction.objectStore('userStore');
                const putRequest = store.put(userId, 'userId');
                putRequest.onsuccess = () => resolve(true);
                putRequest.onerror = () => resolve(false);
            };
            request.onerror = () => resolve(false);
        });
    }
};

window.Global = Global;