// Access global objects
// const { Config, Logger } = window;
// const Global = window.Global;

// Navigation functions
function navigateTo(path) {
    if (path.startsWith('/')) path = path.substring(1);
    history.pushState({}, '', '/' + path);
    renderContent();
}

function goBack() {
    navigateTo('/home.html'); // Direct navigation to home.html
}

function navigateToNewAvailability() {
    navigateTo('/pages/newavailability.html');
    Logger.info('Navigating to new availability page');
}

// API: Get Current Active or Upcoming Shift
async function getCurrentShift() {
    const url = `${Config.api.baseUrl}/api/shifts/current`;
    const userId = await Global.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const headers = { ...Config.api.headers, 'x-user-id': userId };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        Logger.error('Get current shift error', { error: error.message });
        throw error;
    }
}

// API: Get Current Week’s Shift and Availability Details
async function getCurrentWeekDetails() {
    const url = `${Config.api.baseUrl}/api/shifts/week`;
    const userId = await Global.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const headers = { ...Config.api.headers, 'x-user-id': userId };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        Logger.error('Get current week details error', { error: error.message });
        throw error;
    }
}

function renderShiftDetails(shift) {
    const shiftDetails = document.getElementById('current-shift-details');
    const startButton = document.getElementById('start-shift');
    const endButton = document.getElementById('end-shift');

    if (shift && shift.status) {
        shiftDetails.style.display = 'block';
        shiftDetails.innerHTML = `
            <p>Shift ID: ${shift.shiftId}</p>
            <p>Reporting Time: ${new Date(shift.reportingTime).toLocaleString()}</p>
            <p>Location: ${shift.reportingLocation.fullAddress}</p>
            <p>Reporting To: ${shift.reportingUser.fullName}</p>
            <p>Status: ${shift.status}</p>
        `;

        if (shift.status === 'active') {
            startButton.disabled = true;
            endButton.disabled = false;
        } else if (shift.status === 'pending') {
            startButton.disabled = false;
            endButton.disabled = true;
        } else {
            shiftDetails.innerHTML = '<p>No Active or Upcoming Shift</p>';
            startButton.disabled = true;
            endButton.disabled = true;
        }
    } else {
        shiftDetails.style.display = 'block';
        shiftDetails.innerHTML = '<p>No Active or Upcoming Shift</p>';
        startButton.disabled = true;
        endButton.disabled = true;
    }

    startButton.onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    startShift(shift.shiftId, latitude, longitude).then(() => {
                        Logger.info('Shift started', { shiftId: shift.shiftId });
                        getCurrentShift().then(renderShiftDetails);
                    }).catch(error => alert(error.message));
                },
                () => alert('Geolocation access denied. Please enable location services.')
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    endButton.onclick = () => {
        const notes = prompt('Enter shift notes (optional, max 500 characters):') || '';
        endShift(shift.shiftId, notes).then(() => {
            Logger.info('Shift ended', { shiftId: shift.shiftId, notes });
            getCurrentShift().then(renderShiftDetails);
        }).catch(error => alert(error.message));
    };
}

// API: Start Shift with GPS Verification
async function startShift(shiftId, latitude, longitude) {
    const url = `${Config.api.baseUrl}/api/shifts/start`;
    const userId = await Global.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const headers = { ...Config.api.headers, 'x-user-id': userId };
    const body = JSON.stringify({
        shiftId,
        location: { latitude, longitude },
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        Logger.error('Start shift error', { error: error.message });
        throw error;
    }
}

// API: End Shift with Notes
async function endShift(shiftId, notes = '') {
    const url = `${Config.api.baseUrl}/api/shifts/end`;
    const userId = await Global.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const headers = { ...Config.api.headers, 'x-user-id': userId };
    const body = JSON.stringify({
        shiftId,
        notes: notes.substring(0, 500), // Limit to 500 characters
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        Logger.error('End shift error', { error: error.message });
        throw error;
    }
}

function renderAvailability(data) {
    const currentWeek = document.getElementById('current-week');
    const nextWeek = document.getElementById('next-week');

    if (data && data.shifts_availabilities) {
        currentWeek.innerHTML = '';
        nextWeek.innerHTML = '';

        // Current week data
        data.shifts_availabilities.forEach(entry => {
            const p = document.createElement('p');
            p.textContent = `${entry.day}: ${entry.status} ${entry.shiftId ? `(Shift: ${entry.shiftStatus})` : ''}`;
            currentWeek.appendChild(p);
        });

        // Next week data (mocked for now, adjust with API-4.2 if needed)
        const nextWeekStart = new Date(data.weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekData = data.shifts_availabilities.map(entry => {
            const nextDate = new Date(entry.date);
            nextDate.setDate(nextDate.getDate() + 7);
            return {
                ...entry,
                date: nextDate.toISOString().split('T')[0],
                day: new Date(nextDate).toLocaleDateString('en-US', { weekday: 'long' })
            };
        });
        nextWeekData.forEach(entry => {
            const p = document.createElement('p');
            p.textContent = `${entry.day}: ${entry.status} ${entry.shiftId ? `(Shift: ${entry.shiftStatus})` : ''}`;
            nextWeek.appendChild(p);
        });
    } else {
        currentWeek.innerHTML = '<p>Failed to load current week data</p>';
        nextWeek.innerHTML = '<p>Failed to load next week data</p>';
    }
}

// Initialize shifts page
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Shifts page loaded');
    getCurrentShift().then(renderShiftDetails).catch(error => {
        document.getElementById('current-shift-details').innerHTML = `<p>${error.message}</p>`;
        document.getElementById('start-shift').disabled = true;
        document.getElementById('end-shift').disabled = true;
    });
    getCurrentWeekDetails().then(renderAvailability).catch(error => {
        document.getElementById('current-week').innerHTML = `<p>${error.message}</p>`;
        document.getElementById('next-week').innerHTML = `<p>${error.message}</p>`;
    });
});