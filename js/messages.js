class MessagesHandler {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is connected
        if (!SessionManager.isConnected()) {
            window.location.href = 'profile.html';
            return;
        }

        // Show sign out button
        const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.style.display = 'block';
            signOutButton.addEventListener('click', () => this.signOut());
        }
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.href = 'profile.html';
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MessagesHandler();
});