class ThemeHandler {
    constructor() {
        // Initialize with system default or saved theme
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply theme on initialization
        this.applyTheme(this.currentTheme);
        
        // If user is logged in, fetch their saved theme
        if (SessionManager.isConnected()) {
            this.fetchUserTheme();
        }
    }

    async fetchUserTheme() {
        try {
            const walletAddress = SessionManager.getWalletAddress();
            const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${walletAddress.toLowerCase()}`);
            
            if (response.theme) {
                this.setTheme(response.theme);
            }
        } catch (error) {
            console.error('Error fetching user theme:', error);
        }
    }

    async setTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('theme', theme);

        // If user is logged in, save theme to their profile
        if (SessionManager.isConnected()) {
            try {
                const walletAddress = SessionManager.getWalletAddress();
                await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                    method: 'POST',
                    body: JSON.stringify({
                        walletAddress: walletAddress.toLowerCase(),
                        theme: theme
                    })
                });
            } catch (error) {
                console.error('Error saving theme to profile:', error);
            }
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme handler globally
window.themeHandler = new ThemeHandler();