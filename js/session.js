class SessionManager {
    static GUEST_ID_KEY = 'guestIdentifier';
    static GUEST_ADDRESS_KEY = 'guestWalletAddress';
    static GUEST_ACCOUNTS_KEY = 'guestAccounts';
    static MAX_GUEST_ACCOUNTS = 3; // Maximum number of guest accounts per 24 hours

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
    static trackGuestAccount(address) {
        const now = new Date().getTime();
        const guestAccounts = this.getGuestAccounts();
        
        // Add new guest account with timestamp
        guestAccounts.push({
            address: address,
            timestamp: now
        });
        
        // Store updated list
        localStorage.setItem(this.GUEST_ACCOUNTS_KEY, JSON.stringify(guestAccounts));
    }

    // Get list of guest accounts created in the last 24 hours
    static getGuestAccounts() {
        const accounts = JSON.parse(localStorage.getItem(this.GUEST_ACCOUNTS_KEY) || '[]');
        const now = new Date().getTime();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        // Filter out accounts older than 24 hours
        const recentAccounts = accounts.filter(account => account.timestamp > oneDayAgo);
        
        // Update storage with only recent accounts
        localStorage.setItem(this.GUEST_ACCOUNTS_KEY, JSON.stringify(recentAccounts));
        
        return recentAccounts;
    }

    // Check if user can create a new guest account
    static canCreateGuestAccount() {
        const recentAccounts = this.getGuestAccounts();
        return recentAccounts.length < this.MAX_GUEST_ACCOUNTS;
    }

    // Get or create a persistent guest wallet address
    static getGuestWalletAddress() {
        let guestAddress = localStorage.getItem(this.GUEST_ADDRESS_KEY);
        if (!guestAddress) {
            const randomBytes = new Uint8Array(20);
            window.crypto.getRandomValues(randomBytes);
            guestAddress = '0x' + Array.from(randomBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            localStorage.setItem(this.GUEST_ADDRESS_KEY, guestAddress);
        }
        return guestAddress;
    }

    static setWalletAddress(address, isGuest = false) {
        console.log('Setting wallet address:', address, 'isGuest:', isGuest);
        if (isGuest) {
            // Store the guest ID for this session
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
        // Don't remove guest identifier or address - we want to reuse them
        const keysToRemove = ['walletAddress', 'lastConnected', 'isGuest'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('Session storage after clear:', {
            walletAddress: localStorage.getItem('walletAddress'),
            lastConnected: localStorage.getItem('lastConnected'),
            isGuest: localStorage.getItem('isGuest')
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