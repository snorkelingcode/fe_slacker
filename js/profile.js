// Error Handler Class
class ErrorHandler {
    static showError(message, container) {
        if (!container) return;
        
        // Remove any existing error messages
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insert at the top of the container
        container.insertBefore(errorDiv, container.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement === container) {
                errorDiv.remove();
            }
        }, 5000);
    }

    static showSuccess(message, container) {
        if (!container) return;
        
        // Remove any existing success messages
        const existingSuccess = container.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        // Insert at the top of the container
        container.insertBefore(successDiv, container.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentElement === container) {
                successDiv.remove();
            }
        }, 5000);
    }
}

// Loading State Handler
class LoadingState {
    static show(element) {
        if (!element) return;
        element.classList.add('loading');
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        element.appendChild(spinner);
        element.disabled = true;
    }

    static hide(element) {
        if (!element) return;
        element.classList.remove('loading');
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
        element.disabled = false;
    }
}

class WalletConnector {
    constructor() {
        console.log('WalletConnector initializing...');
        this.web3 = null;
        this.account = null;
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
                        document.getElementById('walletLogin').style.display = 'none';
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
                document.getElementById('walletLogin').style.display = 'none';
                document.getElementById('profileContent').style.display = 'block';
                document.getElementById('signOutButton').style.display = 'block';
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
            walletAddress: this.account.toLowerCase(), // Ensure lowercase
            username: `User_${this.account.substring(2, 8)}`,
            bio: 'New to Slacker'
        };
    
        const profileContent = document.getElementById('profileContent');
    
        try {
            console.log('Attempting to create/load profile with:', defaultProfile);
    
            // First try to load existing profile
            try {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${this.account.toLowerCase()}`);
                console.log('Existing profile loaded:', response);
                await this.loadProfileData();
            } catch (error) {
                console.error('Profile fetch error:', error);
    
                // If profile doesn't exist, create a new one
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
            console.error('Complete error in createOrLoadProfile:', error);
            ErrorHandler.showError(error.message, profileContent);
            throw error;
        }
    }

    async loadProfileData() {
        console.log('Loading profile data...');
        const profileContent = document.getElementById('profileContent');
        
        try {
            LoadingState.show(profileContent);
            
            const profile = await makeApiCall(`${API_ENDPOINTS.users}/profile/${this.account}`);
            console.log('Profile data loaded:', profile);
            
            if (!profile) {
                throw new Error('Failed to load profile data');
            }

            const postHandler = new PostHandler(this.account);
            
            profileContent.innerHTML = `
                <div class="profile-header">
                    <div class="profile-cover" style="background-image: url('${profile.bannerPicture || ''}')">
                        ${!profile.bannerPicture ? '<span class="no-banner">No Banner Image</span>' : ''}
                    </div>
                    <div class="profile-info">
                        <div class="profile-picture">
                            ${profile.profilePicture ? 
                                `<img src="${profile.profilePicture}" alt="Profile" class="profile-img">` : 
                                'No Image'}
                        </div>
                        <h1 class="profile-name">${profile.username}</h1>
                        <p class="profile-wallet">${this.account}</p>
                        <p class="profile-bio">${profile.bio}</p>
                        <div class="profile-actions">
                            <button id="editProfileBtn" class="edit-profile-btn">Edit Profile</button>
                        </div>
                    </div>
                </div>
                ${postHandler.renderPostForm()}
                <div class="posts-container"></div>
            `;

            document.getElementById('editProfileBtn').addEventListener('click', () => {
                this.showEditProfileForm(profile);
            });

            const postForm = document.querySelector('.create-post-box');
            if (postForm) {
                postHandler.setupPostForm(postForm);
                await postHandler.loadPosts();
            }

        } catch (error) {
            console.error('Error loading profile:', error);
            ErrorHandler.showError(error.message, profileContent);
        } finally {
            LoadingState.hide(profileContent);
        }
    }

    async updateProfile(profileData) {
        try {
            LoadingState.show(document.querySelector('.edit-profile-form'));
            
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