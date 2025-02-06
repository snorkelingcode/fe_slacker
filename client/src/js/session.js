class SessionManager {
    static setWalletAddress(address) {
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('lastConnected', new Date().toString());
    }

    static getWalletAddress() {
        const address = localStorage.getItem('walletAddress');
        const lastConnected = new Date(localStorage.getItem('lastConnected'));
        const now = new Date();
        
        if (lastConnected && (now - lastConnected) > (24 * 60 * 60 * 1000)) {
            this.clearSession();
            return null;
        }
        return address;
    }

    static isConnected() {
        return !!this.getWalletAddress();
    }

    static clearSession() {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastConnected');
    }

    static getProfile() {
        const walletAddress = this.getWalletAddress();
        if (!walletAddress) return null;
        const profile = localStorage.getItem(`profile_${walletAddress}`);
        return profile ? JSON.parse(profile) : null;
    }

    static updateProfile(profileData) {
        const walletAddress = this.getWalletAddress();
        if (!walletAddress) return;
        localStorage.setItem(`profile_${walletAddress}`, JSON.stringify({
            ...profileData,
            updatedAt: new Date().toISOString()
        }));
    }
}