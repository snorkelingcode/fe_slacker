class SessionManager {
    static WALLET_ADDRESS_KEY = 'walletAddress';
    static LAST_CONNECTED_KEY = 'lastConnected';
    static IS_GUEST_KEY = 'isGuest';
    static GUEST_ID_KEY = 'guestIdentifier';
    static GUEST_ADDRESS_KEY = 'persistentGuestAddress';
    static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Get or create a persistent guest identifier (for database tracking)
    static getGuestIdentifier() {
        let guestId = localStorage.getItem(this.GUEST_ID_KEY);
        if (!guestId) {
            guestId = 'guest_' + crypto.randomUUID();
            localStorage.setItem(this.GUEST_ID_KEY, guestId);
        }
        return guestId;
    }

    // Always return the same guest address for this browser
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

    // For consistency with previous implementation, but always returns true now
    static canCreateGuestAccount() {
        return true;
    }

    static setWalletAddress(address, isGuest = false) {
        if (!address) {
            console.error('Attempted to set empty wallet address');
            return false;
        }

        try {
            const formattedAddress = address.toLowerCase();
            localStorage.setItem(this.WALLET_ADDRESS_KEY, formattedAddress);
            localStorage.setItem(this.LAST_CONNECTED_KEY, new Date().toISOString());
            localStorage.setItem(this.IS_GUEST_KEY, isGuest.toString());
            console.log('Session saved:', {
                address: formattedAddress,
                isGuest,
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error setting wallet address:', error);
            return false;
        }
    }

    static getWalletAddress() {
        try {
            const address = localStorage.getItem(this.WALLET_ADDRESS_KEY);
            const lastConnected = new Date(localStorage.getItem(this.LAST_CONNECTED_KEY));
            const now = new Date();

            if (!address || !lastConnected) {
                console.log('No session found');
                return null;
            }

            // Check if session has expired
            if (now - lastConnected > this.SESSION_DURATION) {
                console.log('Session expired');
                this.clearSession();
                return null;
            }

            // Update last connected time to keep session alive
            localStorage.setItem(this.LAST_CONNECTED_KEY, now.toISOString());
            return address.toLowerCase();
        } catch (error) {
            console.error('Error getting wallet address:', error);
            return null;
        }
    }

    static isConnected() {
        const address = this.getWalletAddress();
        const isConnected = !!address;
        console.log('Checking connection status:', isConnected);
        return isConnected;
    }

    static clearSession() {
        try {
            console.log('Clearing session...');
            localStorage.removeItem(this.WALLET_ADDRESS_KEY);
            localStorage.removeItem(this.LAST_CONNECTED_KEY);
            localStorage.removeItem(this.IS_GUEST_KEY);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    static async validateSession() {
        const address = this.getWalletAddress();
        if (!address) return false;

        try {
            // Verify the wallet address exists in the backend
            const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${address}`);
            return !!response;
        } catch (error) {
            console.error('Session validation failed:', error);
            this.clearSession();
            return false;
        }
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}