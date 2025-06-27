// Access global objects
const { Config, Logger } = window;
const Global = window.Global;

// Fetch permissions from API
async function fetchPermissions() {
    const url = `${Config.api.baseUrl}/permissions`; // Adjust endpoint as per your API
    const userId = await Global.getUserId(); // Assume getUserId is implemented in global.js
    const headers = { ...Config.api.headers };
    if (userId) {
        headers['x-user-id'] = userId; // Add userId header for authenticated requests
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        Logger.error('Permissions API error', { error: error.message });
        throw error;
    }
}

// Render home page content
function renderHome(data) {
    const greeting = document.getElementById('greeting');
    const cardContainer = document.getElementById('card-container');

    if (data.success && data.userName && data.screens) {
        greeting.textContent = `Hi, ${data.userName}`;
        const modules = [
            { name: 'Shifts', emoji: '🕒', route: '/pages/shifts.html' },
            { name: 'Scheduling', emoji: '📅', route: '/pages/scheduling.html' },
            { name: 'Delivery', emoji: '🚚', route: '/pages/delivery.html' },
            { name: 'Routes', emoji: '🗺️', route: '/pages/routes.html' },
            { name: 'Employees', emoji: '👥', route: '/pages/employees.html' },
            { name: 'Roles & Permissions', emoji: '🔐', route: '/pages/roles.html' },
            { name: 'Profile & Settings', emoji: '⚙️', route: '/pages/settings.html' },
        ];

        const hasPackagePermission = data.screens.some(p => p.startsWith('packages-'));
        let filteredModules = modules.filter(m =>
            m.name.toLowerCase() === 'packages' ? hasPackagePermission : data.screens.includes(m.name.toLowerCase())
        );
        if (hasPackagePermission && !filteredModules.some(m => m.name === 'Packages')) {
            filteredModules.push({ name: 'Packages', emoji: '📦', route: '/pages/packages.html' });
        }

        cardContainer.innerHTML = '';
        filteredModules.forEach(module => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<span class="card-emoji">${module.emoji}</span><span class="card-text">${module.name}</span>`;
            card.addEventListener('click', () => {
                Logger.info('Navigating to module', { module: module.name });
                window.location.href = module.route;
            });
            cardContainer.appendChild(card);
        });
    } else {
        cardContainer.innerHTML = '<p>Error loading modules</p>';
    }
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Home page loaded');
    fetchPermissions()
        .then(data => renderHome(data))
        .catch(error => {
            Logger.error('Failed to load permissions', error);
            document.getElementById('card-container').innerHTML = '<p>Failed to load modules. Check your connection.</p>';
        });
});