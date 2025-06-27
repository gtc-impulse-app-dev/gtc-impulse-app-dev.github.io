// Access global objects
// const Config = window.Config;
// const Logger = window.Logger;
// const Global = window.Global;

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password format (at least 12 characters, uppercase, lowercase, numbers, special chars)
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;
    return passwordRegex.test(password);
}

// Perform login API request
async function loginUser(email, password) {
    const url = `${Config.api.baseUrl}/api/auth/login`;
    const options = {
        method: 'POST',
        headers: Config.api.headers,
        body: JSON.stringify({ email, password }),
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.api.timeout);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return await response.json();
    } catch (error) {
        Logger.error('Login API error', { error: error.message });
        throw error;
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (form && errorMessage) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            Logger.info('Login attempt', { email, password });

            // Validate inputs
            if (!email || !isValidEmail(email)) {
                errorMessage.textContent = 'Invalid email format';
                errorMessage.style.display = 'block';
                return;
            }
            // if (!password || !isValidPassword(password)) {
            //     errorMessage.textContent = 'Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters';
            //     errorMessage.style.display = 'block';
            //     return;
            // }

            try {
                const result = await loginUser(email, password);
                Logger.info('Login successful', result);
                await Global.setUserId(result.userId);
                history.replaceState({}, '', '/pages/home.html');
                window.location.href = '/pages/home.html';
            } catch (error) {
                Logger.error('Login failed', { error: error.message });
                errorMessage.textContent = error.message || 'An unexpected error occurred';
                errorMessage.style.display = 'block';
            }
        });
    }
});