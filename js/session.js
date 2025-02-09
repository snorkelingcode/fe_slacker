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
    //track burner account expiration
    static setBurnerAccount(address) {
        this.setWalletAddress(address);
        localStorage.setItem(this.ACCOUNT_TYPE_KEY, this.BURNER_ACCOUNT_TYPE);
        // Set expiration to 24 hours from now
        localStorage.setItem('burnerExpiration', 
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        );
    }
    
    static checkBurnerExpiration() {
        const expiration = localStorage.getItem('burnerExpiration');
        if (expiration) {
            const expirationDate = new Date(expiration);
            if (expirationDate < new Date()) {
                this.clearSession();
                return false;
            }
        }
        return true;
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