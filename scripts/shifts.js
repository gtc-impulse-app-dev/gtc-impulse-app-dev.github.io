// Access global objects
const { Config, Logger } = window;
const Global = window.Global;

// Navigation functions
function navigateTo(path) {
    if (path.startsWith('/')) path = path.substring(1);
    history.pushState({}, '', '/' + path);
    renderContent();
}

function goBack() {
    history.back();
    renderContent();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.tab-button[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
    Logger.info('Switched to tab', { tab });
    if (tab === 'shifts') renderShiftDetails();
    else renderAvailability();
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

// API: Start Shift with GPS Verification
async function startShift(shiftId, latitude, longitude) {
    const url = `${Config.api.baseUrl}/api/shifts/start`;
    const userId = await Global.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const headers = { ...Config.api.headers, 'x-user-id': userId };
    const body = JSON.stringify({
        userId,
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
        userId,
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

function navigateToNewAvailability() {
    window.location.href = '/pages/newavailability.html';
    Logger.info('Navigating to new availability page');
}

function renderShiftDetails() {
    getCurrentShift().then(shift => {
        const currentShiftSpan = document.getElementById('current-shift');
        const startButton = document.getElementById('start-shift');
        const endButton = document.getElementById('end-shift');

        if (shift.status === 'active') {
            currentShiftSpan.textContent = `In Progress (Started: ${new Date(shift.reportingTime).toLocaleString()})`;
            startButton.disabled = true;
            endButton.disabled = false;
        } else if (shift.status === 'pending') {
            currentShiftSpan.textContent = `Upcoming (Reporting: ${new Date(shift.reportingTime).toLocaleString()})`;
            startButton.disabled = false;
            endButton.disabled = true;
        } else {
            currentShiftSpan.textContent = 'No Active or Upcoming Shift';
            startButton.disabled = false;
            endButton.disabled = true;
        }

        startButton.onclick = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        startShift(shift.shiftId, latitude, longitude).then(() => {
                            Logger.info('Shift started', { shiftId: shift.shiftId });
                            renderShiftDetails();
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
                renderShiftDetails();
            }).catch(error => alert(error.message));
        };
    }).catch(error => {
        document.getElementById('current-shift').textContent = error.message;
        document.getElementById('start-shift').disabled = true;
        document.getElementById('end-shift').disabled = true;
    });
}

function renderAvailability() {
    getCurrentWeekDetails().then(data => {
        if (data.shifts_availabilities) {
            const currentWeek = document.getElementById('current-week');
            const nextWeek = document.getElementById('next-week');
            currentWeek.innerHTML = '';
            nextWeek.innerHTML = '';

            // Current week data
            data.shifts_availabilities.forEach(entry => {
                const p = document.createElement('p');
                p.textContent = `${entry.day}: ${entry.status} ${entry.shiftId ? `(Shift: ${entry.shiftStatus})` : ''}`;
                currentWeek.appendChild(p);
            });

            // Next week data (mocked for now, to be fetched separately if needed)
            const nextWeekData = data.shifts_availabilities.map(entry => ({
                ...entry,
                date: new Date(entry.date).setDate(new Date(entry.date).getDate() + 7),
                day: new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })
            }));
            nextWeekData.forEach(entry => {
                const p = document.createElement('p');
                p.textContent = `${entry.day}: ${entry.status} ${entry.shiftId ? `(Shift: ${entry.shiftStatus})` : ''}`;
                nextWeek.appendChild(p);
            });
        } else {
            document.getElementById('next-week').innerHTML = '<p>No availability data</p>';
        }
    }).catch(error => {
        document.getElementById('current-week').innerHTML = '<p>Failed to load current week data</p>';
        document.getElementById('next-week').innerHTML = '<p>Failed to load next week data</p>';
    });
}

// Initialize shifts page
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Shifts page loaded');
    switchTab('shifts');
    renderShiftDetails();
    renderAvailability();
});