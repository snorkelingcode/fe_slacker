class SessionManager {
    static GUEST_ID_KEY = 'guestIdentifier';
    static GUEST_ACCOUNTS_KEY = 'guestAccounts';
    static MAX_GUEST_ACCOUNTS = 3; // Maximum number of guest accounts per browser
    static GUEST_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Get or create a persistent guest identifier
    static getGuestIdentifier() {
        let guestId = localStorage.getItem(this.GUEST_ID_KEY);
        if (!guestId) {
            guestId = 'guest_' + crypto.randomUUID();
            localStorage.setItem(this.GUEST_ID_KEY, guestId);
        }
        return guestId;
    }

    // Track guest account creation
    static trackGuestAccount(walletAddress) {
        const now = Date.now();
        let guestAccounts = JSON.parse(localStorage.getItem(this.GUEST_ACCOUNTS_KEY) || '[]');
        
        // Remove expired accounts
        guestAccounts = guestAccounts.filter(account => 
            (now - account.timestamp) < this.GUEST_TIMEOUT
        );

        // Add new account
        guestAccounts.push({
            walletAddress,
            timestamp: now,
            guestId: this.getGuestIdentifier()
        });

        localStorage.setItem(this.GUEST_ACCOUNTS_KEY, JSON.stringify(guestAccounts));
        return guestAccounts.length;
    }

    // Check if user can create new guest account
    static canCreateGuestAccount() {
        const guestAccounts = JSON.parse(localStorage.getItem(this.GUEST_ACCOUNTS_KEY) || '[]');
        const now = Date.now();
        
        // Filter to only include accounts created within the timeout period
        const activeAccounts = guestAccounts.filter(account => 
            (now - account.timestamp) < this.GUEST_TIMEOUT
        );

        return activeAccounts.length < this.MAX_GUEST_ACCOUNTS;
    }

    static setWalletAddress(address, isGuest = false) {
        console.log('Setting wallet address:', address, 'isGuest:', isGuest);
        if (isGuest) {
            const guestId = this.getGuestIdentifier();
            localStorage.setItem('guestId', guestId);
        }
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('lastConnected', new Date().toString());
        localStorage.setItem('isGuest', isGuest.toString());
        console.log('Session storage after set:', {
            walletAddress: localStorage.getItem('walletAddress'),
            lastConnected: localStorage.getItem('lastConnected'),
            isGuest: localStorage.getItem('isGuest'),
            guestId: localStorage.getItem('guestId')
        });
    }

    static getWalletAddress() {
        console.log('Getting wallet address from session...');
        const address = localStorage.getItem('walletAddress');
        const lastConnected = new Date(localStorage.getItem('lastConnected'));
        const now = new Date();
        const isGuest = localStorage.getItem('isGuest') === 'true';
        
        console.log('Session data:', {
            address,
            lastConnected,
            timeSinceLastConnection: now - lastConnected,
            isGuest
        });

        if (lastConnected && (now - lastConnected) > (24 * 60 * 60 * 1000)) {
            console.log('Session expired, clearing...');
            this.clearSession();
            return null;
        }
        return address;
    }

    static isConnected() {
        const isConnected = !!this.getWalletAddress();
        console.log('Checking connection status:', isConnected);
        return isConnected;
    }

    static clearSession() {
        console.log('Clearing session...');
        const isGuest = localStorage.getItem('isGuest') === 'true';
        const walletAddress = localStorage.getItem('walletAddress');

        if (isGuest && walletAddress) {
            // Keep track of the guest account in history but remove active session
            this.trackGuestAccount(walletAddress);
        }

        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastConnected');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestId');
        
        console.log('Session storage after clear:', {
            walletAddress: localStorage.getItem('walletAddress'),
            lastConnected: localStorage.getItem('lastConnected'),
            isGuest: localStorage.getItem('isGuest'),
            guestId: localStorage.getItem('guestId')
        });
    }

    static getProfile() {
        console.log('Getting profile from session...');
        const walletAddress = this.getWalletAddress();
        if (!walletAddress) return null;
        
        const profile = localStorage.getItem(`profile_${walletAddress}`);
        console.log('Profile data:', profile ? JSON.parse(profile) : null);
        return profile ? JSON.parse(profile) : null;
    }

    static updateProfile(profileData) {
        console.log('Updating profile in session:', profileData);
        const walletAddress = this.getWalletAddress();
        if (!walletAddress) {
            console.log('No wallet address found, cannot update profile');
            return;
        }
        
        localStorage.setItem(`profile_${walletAddress}`, JSON.stringify({
            ...profileData,
            updatedAt: new Date().toISOString()
        }));
        
        console.log('Profile updated in session');
    }
}