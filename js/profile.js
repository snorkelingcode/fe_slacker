class WalletConnector {
    constructor() {
        console.log('WalletConnector initializing...');
        this.web3 = null;
        this.account = null;
        
        // Hide both containers initially
        const walletLogin = document.getElementById('walletLogin');
        const profileContent = document.getElementById('profileContent');
        if (walletLogin) walletLogin.style.display = 'none';
        if (profileContent) profileContent.style.display = 'none';
        
        this.setupEventListeners();
        this.checkExistingConnection();
    }

    setupEventListeners() {
        const metamaskButton = document.getElementById('metamaskButton');
        const signOutButton = document.getElementById('signOutButton');
        
        if (metamaskButton) {
            metamaskButton.addEventListener('click', async () => {
                LoadingState.show(metamaskButton);
                try {
                    await this.connectMetaMask();
                } finally {
                    LoadingState.hide(metamaskButton);
                }
            });
        }

        if (signOutButton) {
            signOutButton.addEventListener('click', () => this.signOut());
        }

        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', async (accounts) => {
                if (accounts.length === 0) {
                    this.signOut();
                } else {
                    this.account = accounts[0];
                    SessionManager.setWalletAddress(this.account);
                    await this.loadProfileData();
                }
            });
        }
    }

    async checkExistingConnection() {
        console.log('Checking existing connection...');
        if (SessionManager.isConnected()) {
            this.account = SessionManager.getWalletAddress();
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0 && accounts[0].toLowerCase() === this.account.toLowerCase()) {
                        this.web3 = new Web3(window.ethereum);
                        await this.loadProfileData();
                        document.getElementById('profileContent').style.display = 'block';
                        document.getElementById('signOutButton').style.display = 'block';
                    } else {
                        SessionManager.clearSession();
                        this.showLoginForm();
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                    SessionManager.clearSession();
                    this.showLoginForm();
                }
            } else {
                this.showLoginForm();
            }
        } else {
            this.showLoginForm();
        }
    }

    showLoginForm() {
        document.getElementById('walletLogin').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        document.getElementById('signOutButton').style.display = 'none';
    }

    async connectMetaMask() {
        console.log('Attempting to connect MetaMask...');
        const profileContent = document.getElementById('profileContent');

        if (typeof window.ethereum === 'undefined') {
            ErrorHandler.showError('Please install MetaMask to continue!', document.getElementById('walletLogin'));
            setTimeout(() => {
                window.open('https://metamask.io/download/', '_blank');
            }, 2000);
            return;
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.account = accounts[0];
            console.log('Connected account:', this.account);
            this.web3 = new Web3(window.ethereum);

            SessionManager.setWalletAddress(this.account);

            try {
                await this.createOrLoadProfile();
                
                // Redirect to index.html (feed page)
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error handling profile:', error);
                ErrorHandler.showError(error.message, profileContent);
            }

        } catch (error) {
            console.error("MetaMask connection error:", error);
            ErrorHandler.showError('Failed to connect to MetaMask: ' + error.message, 
                document.getElementById('walletLogin'));
        }
    }

    async createOrLoadProfile() {
        const defaultProfile = {
            walletAddress: this.account.toLowerCase(),
            username: `User_${this.account.substring(2, 8)}`,
            bio: 'New to Slacker'
        };
    
        const profileContent = document.getElementById('profileContent');
    
        try {
            // Try to fetch existing profile
            try {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${this.account.toLowerCase()}`);
                console.log('Existing profile loaded:', response);
                await this.loadProfileData();
            } catch (error) {
                // If profile doesn't exist, create new one
                if (error.message.includes('User profile not found')) {
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
            ErrorHandler.showError(error.message, profileContent);
            throw error;
        }
    }

    async loadProfileData() {
        try {
            const profileContent = document.getElementById('profileContent');
            if (!profileContent) return;

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
    
    async updateProfile(profileData) {
        try {
            LoadingState.show(document.querySelector('.edit-profile-form'));
            
            // Update profile in database
            await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                method: 'POST',
                body: JSON.stringify({
                    ...profileData,
                    walletAddress: this.account
                })
            });
    
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

    showEditProfileForm(profile) {
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
                        <textarea id="bio" maxlength="500">${profile.bio}</textarea>
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
                ErrorHandler.showError(error.message, modal.querySelector('.edit-profile-form'));
            }
        });
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.reload();
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WalletConnector...');
    new WalletConnector();
});