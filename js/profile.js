class WalletConnector {
    constructor() {
        console.log('=== WalletConnector Constructor Start ===');
        this.web3 = null;
        this.account = null;
        this.isConnecting = false;
        this.connectionAttempts = 0;
        this.maxAttempts = 3;
        
        const walletLogin = document.getElementById('walletLogin');
        const profileContent = document.getElementById('profileContent');
        if (walletLogin) walletLogin.style.display = 'none';
        if (profileContent) profileContent.style.display = 'none';
        
        this.setupEventListeners();
        this.checkExistingConnection();
    }

    initializeUI() {
        console.log('Initializing UI elements...');
        const walletLogin = document.getElementById('walletLogin');
        const profileContent = document.getElementById('profileContent');
        const signOutButton = document.getElementById('signOutButton');

        console.log('Initial elements found:', {
            walletLogin: !!walletLogin,
            profileContent: !!profileContent,
            signOutButton: !!signOutButton
        });

        if (walletLogin) walletLogin.style.display = 'none';
        if (profileContent) profileContent.style.display = 'none';
        if (signOutButton) signOutButton.style.display = 'none';
    }

    setupEventListeners() {
        const metamaskButton = document.getElementById('metamaskButton');
        const guestButton = document.getElementById('guestButton');
        const signOutButton = document.getElementById('signOutButton');
        
        if (metamaskButton) {
            metamaskButton.addEventListener('click', async () => {
                if (this.isConnecting) {
                    console.log('Connection already in progress, please wait...');
                    ErrorHandler.showError('Connection in progress, please check MetaMask popup', document.getElementById('walletLogin'));
                    return;
                }
                
                LoadingState.show(metamaskButton);
                metamaskButton.disabled = true;
                
                try {
                    this.isConnecting = true;
                    await this.connectMetaMask();
                } catch (error) {
                    console.error('MetaMask connection error:', error);
                    ErrorHandler.showError(
                        error.code === -32002 
                            ? 'MetaMask connection pending. Please open MetaMask and connect.' 
                            : error.message,
                        document.getElementById('walletLogin')
                    );
                } finally {
                    this.isConnecting = false;
                    metamaskButton.disabled = false;
                    LoadingState.hide(metamaskButton);
                }
            });
        }

        if (guestButton) {
            console.log('Adding guest button listener');
            guestButton.addEventListener('click', async () => {
                LoadingState.show(guestButton);
                try {
                    await this.connectAsGuest();
                } catch (error) {
                    console.error('Guest connection error:', error);
                    ErrorHandler.showError(error.message, document.getElementById('walletLogin'));
                } finally {
                    LoadingState.hide(guestButton);
                }
            });
        }

        if (signOutButton) {
            console.log('Adding sign out button listener');
            signOutButton.addEventListener('click', () => this.signOut());
        }
    }

    async checkExistingConnection() {
        console.log('=== Checking Existing Connection ===');
        console.log('SessionManager connected:', SessionManager.isConnected());
        const storedAddress = SessionManager.getWalletAddress();
        console.log('Stored wallet address:', storedAddress);
        
        if (SessionManager.isConnected()) {
            this.account = storedAddress;
            console.log('Found existing account:', this.account);
            
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    console.log('Current MetaMask accounts:', accounts);
                    
                    if (accounts.length > 0 && accounts[0].toLowerCase() === this.account.toLowerCase()) {
                        console.log('MetaMask account matches stored account');
                        this.web3 = new Web3(window.ethereum);
                        await this.loadProfileData();
                        document.getElementById('profileContent').style.display = 'block';
                        document.getElementById('signOutButton').style.display = 'block';
                    } else {
                        console.log('MetaMask account mismatch or not found');
                        SessionManager.clearSession();
                        this.showLoginForm();
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                    SessionManager.clearSession();
                    this.showLoginForm();
                }
            } else {
                // Handle guest user case
                if (this.account && this.account.startsWith('0x')) {
                    console.log('Guest user detected, loading profile');
                    try {
                        await this.loadProfileData();
                        document.getElementById('profileContent').style.display = 'block';
                        document.getElementById('signOutButton').style.display = 'block';
                    } catch (error) {
                        console.error('Error loading guest profile:', error);
                        SessionManager.clearSession();
                        this.showLoginForm();
                    }
                } else {
                    console.log('No valid account found, showing login form');
                    this.showLoginForm();
                }
            }
        } else {
            console.log('No existing connection found, showing login form');
            this.showLoginForm();
        }
    }

    showLoginForm() {
        console.log('=== Showing Login Form ===');
        const walletLogin = document.getElementById('walletLogin');
        const profileContent = document.getElementById('profileContent');
        const signOutButton = document.getElementById('signOutButton');

        console.log('Elements found:', {
            walletLogin: !!walletLogin,
            profileContent: !!profileContent,
            signOutButton: !!signOutButton
        });

        if (walletLogin) walletLogin.style.display = 'block';
        if (profileContent) profileContent.style.display = 'none';
        if (signOutButton) signOutButton.style.display = 'none';
    }

    async connectAsGuest() {
        console.log('=== Connecting as Guest ===');
        try {
            // Get the persistent guest address for this browser
            this.account = SessionManager.getGuestWalletAddress();
            console.log('Using guest address:', this.account);
    
            // Set wallet address with guest flag
            SessionManager.setWalletAddress(this.account, true);
    
            // Create guest profile with identifier
            const guestId = SessionManager.getGuestIdentifier();
            const guestProfile = {
                walletAddress: this.account,
                username: `Guest_${this.account.substring(2, 6)}`,
                bio: 'Browsing as a guest',
                guestId: guestId,
                accountType: 'guest'
            };
    
            console.log('Creating guest profile:', guestProfile);
    
            try {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                    method: 'POST',
                    body: JSON.stringify(guestProfile)
                });
                console.log('Guest profile created:', response);
    
                // Guest account is now tracked via localStorage
    
                // Redirect to feed page
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error creating guest profile:', error);
                ErrorHandler.showError('Failed to create guest profile', document.getElementById('walletLogin'));
            }
        } catch (error) {
            console.error('Error in guest connection:', error);
            ErrorHandler.showError(error.message, document.getElementById('walletLogin'));
        }
    }

    async connectMetaMask() {
        console.log('=== Connecting MetaMask ===');
        
        if (typeof window.ethereum === 'undefined') {
            ErrorHandler.showError('Please install MetaMask to continue!', document.getElementById('walletLogin'));
            setTimeout(() => {
                window.open('https://metamask.io/download/', '_blank');
            }, 2000);
            return;
        }

        // Reset connection state
        await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
        }).catch(() => {
            console.log('Permissions reset attempted');
        });

        // Wait a moment before attempting connection
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            console.log('Requesting MetaMask accounts...');
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts',
                params: []
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.account = accounts[0];
            this.web3 = new Web3(window.ethereum);

            console.log('Setting wallet address in session:', this.account);
            SessionManager.setWalletAddress(this.account);

            try {
                console.log('Creating/loading profile...');
                await this.createOrLoadProfile();
                console.log('Profile handled successfully, redirecting...');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error handling profile:', error);
                ErrorHandler.showError(error.message, document.getElementById('profileContent'));
            }

        } catch (error) {
            console.error('MetaMask connection error:', error);
            if (error.code === -32002) {
                ErrorHandler.showError('Please check MetaMask for pending connection request', 
                    document.getElementById('walletLogin'));
            }
            throw error;
        }
    }

    async createOrLoadProfile() {
        console.log('=== Creating/Loading Profile ===');
        console.log('Current account:', this.account);

        const defaultProfile = {
            walletAddress: this.account.toLowerCase(),
            username: `User_${this.account.substring(2, 8)}`,
            bio: 'New to Slacker'
        };

        console.log('Default profile:', defaultProfile);

        try {
            // Try to fetch existing profile
            console.log('Attempting to fetch existing profile...');
            try {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${this.account.toLowerCase()}`);
                console.log('Existing profile loaded:', response);
                await this.loadProfileData();
            } catch (error) {
                console.log('Profile fetch error:', error);
                // If profile doesn't exist, create new one
                if (error.message.includes('User profile not found')) {
                    console.log('Creating new profile...');
                    const newProfile = await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                        method: 'POST',
                        body: JSON.stringify(defaultProfile)
                    });
                    console.log('New profile created:', newProfile);
                    await this.loadProfileData();
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error in createOrLoadProfile:', error);
            throw error;
        }
    }

    async loadProfileData() {
        console.log('=== Loading Profile Data ===');
        console.log('Current account:', this.account);
        
        try {
            const profileContent = document.getElementById('profileContent');
            if (!profileContent) {
                console.error('Profile content element not found');
                return;
            }

            LoadingState.show(profileContent);

            // Fetch user profile
            const profile = await makeApiCall(`${API_ENDPOINTS.users}/profile/${this.account.toLowerCase()}`);
            console.log('Loaded Profile:', profile);

            // Render profile information
            profileContent.innerHTML = `
                <div class="profile-header">
                    <div class="profile-cover" style="background-image: url(${profile.bannerPicture || 'default-banner.jpg'})">
                        ${profile.bannerPicture ? '' : '<span>Add Banner</span>'}
                    </div>
                    <div class="profile-info">
                        <div class="profile-picture" style="background-image: url(${profile.profilePicture || 'default-profile.png'})">
                            ${profile.profilePicture ? '' : '<span>Add Profile Picture</span>'}
                        </div>
                        <h2 class="profile-name">${profile.username}</h2>
                        <p class="profile-wallet">${this.account}</p>
                        <p class="profile-bio">${profile.bio || 'No bio yet'}</p>
                        <div class="profile-actions">
                            <button class="edit-profile-btn">Edit Profile</button>
                        </div>
                    </div>
                </div>
            `;

            // Fetch and render user posts
            const userPosts = await makeApiCall(`${API_ENDPOINTS.users}/${this.account.toLowerCase()}/posts`);
            console.log('User posts loaded:', userPosts);
            
            const postsContainer = document.createElement('div');
            postsContainer.className = 'posts-section';
            postsContainer.innerHTML = '<h3>Your Posts</h3>';
            
            const postHandler = new PostHandler(this.account);
            userPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.innerHTML = postHandler.renderPost(post);
                postsContainer.appendChild(postElement);
            });

            profileContent.appendChild(postsContainer);

            // Setup edit profile button
            const editProfileBtn = profileContent.querySelector('.edit-profile-btn');
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', () => this.showEditProfileForm(profile));
            }

        } catch (error) {
            console.error('Error loading profile:', error);
            ErrorHandler.showError('Failed to load profile: ' + error.message, 
                document.getElementById('profileContent'));
        } finally {
            LoadingState.hide(document.getElementById('profileContent'));
        }
    }

    showEditProfileForm(profile) {
        console.log('=== Showing Edit Profile Form ===', profile);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content edit-profile-form">
                <span class="close-modal">&times;</span>
                <h2>Edit Profile</h2>
                <form id="editProfileForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" value="${profile.username}" maxlength="50" required>
                    </div>
                    <div class="form-group">
                        <label for="bio">Bio</label>
                        <textarea id="bio" maxlength="500">${profile.bio || ''}</textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="save-profile-btn">Save Changes</button>
                        <button type="button" class="cancel-edit-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
        };

        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.cancel-edit-btn').addEventListener('click', closeModal);

        modal.querySelector('#editProfileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = modal.querySelector('#username').value;
            const bio = modal.querySelector('#bio').value;

            try {
                await this.updateProfile({ username, bio });
                closeModal();
            } catch (error) {
                console.error('Error updating profile:', error);
                ErrorHandler.showError(error.message, modal.querySelector('.edit-profile-form'));
            }
        });
    }

    async updateProfile(profileData) {
        console.log('=== Updating Profile ===', profileData);
        try {
            LoadingState.show(document.querySelector('.edit-profile-form'));
            
            // Update profile in database
            const updatedProfile = await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                method: 'POST',
                body: JSON.stringify({
                    ...profileData,
                    walletAddress: this.account
                })
            });
            
            console.log('Profile updated:', updatedProfile);
            await this.loadProfileData();
            ErrorHandler.showSuccess('Profile updated successfully!', document.getElementById('profileContent'));
        } catch (error) {
            console.error('Error updating profile:', error);
            ErrorHandler.showError('Failed to update profile: ' + error.message, 
                document.querySelector('.edit-profile-form'));
        } finally {
            LoadingState.hide(document.querySelector('.edit-profile-form'));
        }
    }

    signOut() {
        console.log('=== Signing Out ===');
        if (confirm('Are you sure you want to sign out?')) {
            console.log('Clearing session...');
            SessionManager.clearSession();
            window.location.href = 'profile.html';
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WalletConnector...');
    new WalletConnector();
});














                