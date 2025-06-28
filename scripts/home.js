// Access global objects
// const { Config, Logger } = window;
// const Global = window.Global;

// Fetch permissions from API
async function fetchPermissions() {
    const url = `${Config.api.baseUrl}/api/home`;
    const userId = await Global.getUserId();
    if (!userId) {
        Logger.error('No userId available for permissions request');
        throw new Error('User not authenticated');
    }

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

        const data = await response.json();
        Logger.info('Permissions fetched', data);
        return data;
    } catch (error) {
        Logger.error('Permissions API error', { error: error.message });
        throw error;
    }
}

// Render home page content
function renderHome(data) {
    const greeting = document.getElementById('greeting');
    const cardContainer = document.getElementById('card-container');

    if (data && data.roleName && Array.isArray(data.screensPermissions)) {
        greeting.textContent = `Hi, ${data.roleName}`;
        const modules = [
            { name: 'Shifts', emoji: '🕒', route: '/pages/shifts.html' },
            { name: 'Scheduling', emoji: '📅', route: '/pages/scheduling.html' },
            { name: 'Delivery', emoji: '🚚', route: '/pages/delivery.html' },
            { name: 'Routes', emoji: '🗺️', route: '/pages/routes.html' },
            { name: 'Employees', emoji: '👥', route: '/pages/employees.html' },
            { name: 'Roles & Permissions', emoji: '🔐', route: '/pages/roles.html' },
            { name: 'Profile & Settings', emoji: '⚙️', route: '/pages/settings.html' },
            { name: 'Packages', emoji: '📦', route: '/pages/packages.html' },
        ];

        // Check all permissions and include Packages if any package-related permission exists
        const hasPackagePermission = data.screensPermissions.some(permission =>
            permission.toLowerCase().startsWith('package') || permission.toLowerCase().startsWith('parcels')
        );
        const permittedModules = modules.filter(module => {
            const moduleNameLower = module.name.toLowerCase();
            return moduleNameLower === 'packages' ? hasPackagePermission :
                data.screensPermissions.some(perm => perm.toLowerCase() === moduleNameLower);
        });

        cardContainer.innerHTML = '';
        permittedModules.forEach(module => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<span class="card-emoji">${module.emoji}</span><span class="card-text">${module.name}</span>`;
            // card.addEventListener('click', () => {
            //     Logger.info('Navigating to module', { module: module.name });
            //     window.location.href = module.route;
            // });
            cardContainer.appendChild(card);
        });
    } else {
        cardContainer.innerHTML = '<p>Error loading modules. Please try again or check authentication.</p>';
        Logger.error('Invalid permissions data', data);
    }
}

// Function to navigate to error page and clear stack
function navigateToErrorPage() {
    history.pushState(null, '', '/pages/errorpage.html'); // Clear stack by creating a new history entry
    window.location.href = '/pages/errorpage.html';
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
    Logger.info('Home page loaded');
    fetchPermissions()
        .then(data => renderHome(data))
        .catch(error => {
            Logger.error('Failed to load permissions', error);
            document.getElementById('card-container').innerHTML = '<p>Failed to load modules. Check your connection or authentication.</p>';
        });

    // Delayed navigation to error page after 1 second
    setTimeout(navigateToErrorPage, 1500);
});