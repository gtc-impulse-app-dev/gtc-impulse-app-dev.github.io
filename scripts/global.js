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
    },
    getUserId: function() {
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
};

window.Global = Global;