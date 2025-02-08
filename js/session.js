class SessionManager {
    static async setWalletAddress(address) {
        try {
            // Call backend to create/validate session
            const response = await makeApiCall(`${API_ENDPOINTS.users}/session`, {
                method: 'POST',
                body: JSON.stringify({ 
                    walletAddress: address.toLowerCase(),
                    timestamp: new Date().toISOString()
                })
            });

            // Backend returns a secure token
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                localStorage.setItem('walletAddress', address.toLowerCase());
                localStorage.setItem('lastConnected', new Date().toString());
                
                // Store user profile information
                if (response.user) {
                    localStorage.setItem('userProfile', JSON.stringify(response.user));
                }
            }

            return response;
        } catch (error) {
            console.error('Session creation failed:', error);
            throw error;
        }
    }

    static async getWalletAddress() {
        const token = localStorage.getItem('authToken');
        const address = localStorage.getItem('walletAddress');
        
        if (!token || !address) return null;

        try {
            // Validate token with backend
            await makeApiCall(`${API_ENDPOINTS.users}/validate-session`, {
                method: 'POST',
                body: JSON.stringify({ token })
            });

            return address;
        } catch (error) {
            this.clearSession();
            return null;
        }
    }

    static isConnected() {
        return !!this.getWalletAddress();
    }

    static clearSession() {
        // Optionally call backend to invalidate session
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (walletAddress) {
            makeApiCall(`${API_ENDPOINTS.users}/logout`, {
                method: 'POST',
                body: JSON.stringify({ walletAddress })
            }).catch(console.error);
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastConnected');
        localStorage.removeItem('userProfile');
    }

    static getProfile() {
        const profile = localStorage.getItem('userProfile');
        return profile ? JSON.parse(profile) : null;
    }

    static updateProfile(profileData) {
        const currentProfile = this.getProfile();
        if (currentProfile) {
            const updatedProfile = { ...currentProfile, ...profileData };
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        }
    }
}