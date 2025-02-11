class SessionManager {
    static setWalletAddress(address) {
        console.log('Setting wallet address:', address);
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('lastConnected', new Date().toString());
        console.log('Session storage after set:', {
            walletAddress: localStorage.getItem('walletAddress'),
            lastConnected: localStorage.getItem('lastConnected')
        });
    }

    static getWalletAddress() {
        console.log('Getting wallet address from session...');
        const address = localStorage.getItem('walletAddress');
        const lastConnected = new Date(localStorage.getItem('lastConnected'));
        const now = new Date();
        
        console.log('Session data:', {
            address,
            lastConnected,
            timeSinceLastConnection: now - lastConnected
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
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastConnected');
        console.log('Session storage after clear:', {
            walletAddress: localStorage.getItem('walletAddress'),
            lastConnected: localStorage.getItem('lastConnected')
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