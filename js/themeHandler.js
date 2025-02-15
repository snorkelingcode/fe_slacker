class ThemeHandler {
    constructor() {
        // Apply theme immediately on class instantiation
        this.applyInitialTheme();
        this.init();
    }

    applyInitialTheme() {
        // Get theme from localStorage and apply it immediately
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.currentTheme = savedTheme;
    }

    init() {
        // If user is logged in, fetch their saved theme
        if (SessionManager.isConnected()) {
            this.fetchUserTheme();
        }

        // Listen for theme changes across tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                this.applyTheme(e.newValue || 'light');
            }
        });
    }

    async fetchUserTheme() {
        try {
            const walletAddress = SessionManager.getWalletAddress();
            if (!walletAddress) return;

            const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${walletAddress.toLowerCase()}`);
            
            if (response.theme && response.theme !== this.currentTheme) {
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
                const userResponse = await makeApiCall(`${API_ENDPOINTS.users}/profile/${walletAddress}`);
                
                await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                    method: 'POST',
                    body: JSON.stringify({
                        walletAddress: walletAddress.toLowerCase(),
                        username: userResponse.username,
                        bio: userResponse.bio || 'New to Slacker',
                        theme: theme,
                        profilePicture: userResponse.profilePicture,
                        bannerPicture: userResponse.bannerPicture
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

// Initialize theme handler as early as possible
const themeHandler = new ThemeHandler();
window.themeHandler = themeHandler;