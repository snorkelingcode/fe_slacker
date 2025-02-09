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
            }
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

    static clearSession() {
        // Optionally call backend to invalidate session
        makeApiCall(`${API_ENDPOINTS.users}/logout`, {
            method: 'POST',
            body: JSON.stringify({ 
                walletAddress: localStorage.getItem('walletAddress') 
            })
        }).catch(console.error);

        localStorage.removeItem('authToken');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('lastConnected');
    }

    // Other methods remain similar...
}