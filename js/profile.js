class WalletConnector {
    constructor() {
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
                await this.connectMetaMask();
            });
        }

        if (signOutButton) {
            signOutButton.addEventListener('click', () => this.signOut());
        }

        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.signOut();
                } else {
                    this.account = accounts[0];
                    SessionManager.setWalletAddress(this.account);
                    this.loadProfileData();
                }
            });
        }
    }

    async checkExistingConnection() {
        if (SessionManager.isConnected()) {
            this.account = SessionManager.getWalletAddress();
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        this.web3 = new Web3(window.ethereum);
                        await this.loadProfileData();
                        document.getElementById('walletLogin').style.display = 'none';
                        document.getElementById('profileContent').style.display = 'block';
                        document.getElementById('signOutButton').style.display = 'block';
                    } else {
                        SessionManager.clearSession();
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error);
                    SessionManager.clearSession();
                }
            }
        }
    }

    async connectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                this.account = accounts[0];
                this.web3 = new Web3(window.ethereum);

                SessionManager.setWalletAddress(this.account);

                let profile = JSON.parse(localStorage.getItem(`profile_${this.account}`));
                if (!profile) {
                    profile = {
                        address: this.account,
                        username: `User_${this.account.substring(2, 8)}`,
                        bio: 'New to Slacker',
                        profilePicture: null,
                        bannerPicture: null
                    };
                    localStorage.setItem(`profile_${this.account}`, JSON.stringify(profile));
                }

                document.getElementById('walletLogin').style.display = 'none';
                document.getElementById('profileContent').style.display = 'block';
                document.getElementById('signOutButton').style.display = 'block';
                
                await this.loadProfileData();

            } catch (error) {
                console.error("MetaMask connection error:", error);
                alert(`Error connecting to MetaMask: ${error.message}`);
            }
        } else {
            alert('Please install MetaMask to continue!');
            window.open('https://metamask.io/download/', '_blank');
        }
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.reload();
        }
    }

    async loadProfileData() {
        const profile = JSON.parse(localStorage.getItem(`profile_${this.account}`));
        if (profile) {
            // Create postHandler instance here
            const postHandler = new PostHandler(this.account);
            
            const profileContent = document.getElementById('profileContent');
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

            // Setup event listeners
            document.getElementById('editProfileBtn').addEventListener('click', () => {
                this.showEditProfileForm(profile);
            });

            // Setup post form
            const postForm = document.querySelector('.create-post-box');
            postHandler.setupPostForm(postForm);

            // Load posts
            await postHandler.loadPosts();
        }
    }

    showEditProfileForm(profile) {
        // Your existing edit profile form code
    }
}

// Make sure PostHandler is loaded before this script
document.addEventListener('DOMContentLoaded', () => {
    new WalletConnector();
});