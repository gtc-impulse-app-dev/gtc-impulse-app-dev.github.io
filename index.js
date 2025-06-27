// Handle PWA installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install button
    document.getElementById('install-button').style.display = 'block';
});

document.getElementById('install-button').addEventListener('click', () => {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install prompt');
            } else {
                console.log('User dismissed the PWA install prompt');
            }
            deferredPrompt = null;
        });
    } else {
        alert('PWA installation is not available at this time. Please use your browser\'s menu to install.');
    }
});

// Hide install button initially (shown only after beforeinstallprompt event)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('install-button').style.display = 'none';
});