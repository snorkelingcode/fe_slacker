class WalletConnector {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.postHandler = null;
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
                        this.postHandler = new PostHandler(this.account);
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
                this.postHandler = new PostHandler(this.account);

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
                ${this.postHandler.renderPostForm()}
                <div class="posts-container"></div>
            `;

            // Setup event listeners
            document.getElementById('editProfileBtn').addEventListener('click', () => {
                this.showEditProfileForm(profile);
            });

            // Setup post form
            const postForm = document.querySelector('.create-post-box');
            this.postHandler.setupPostForm(postForm);

            // Load posts
            await this.loadPosts();
        }
    }

    async loadPosts() {
        const posts = JSON.parse(localStorage.getItem(`posts_${this.account}`)) || [];
        const postsContainer = document.querySelector('.posts-container');
        
        if (postsContainer) {
            postsContainer.innerHTML = posts.length > 0 
                ? posts.map(post => this.postHandler.renderPost(post)).join('')
                : '<p class="no-posts">No posts yet</p>';
            
            this.setupPostInteractions();
        }
    }

    setupPostInteractions() {
        // Setup delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                this.postHandler.deletePost(postId);
            });
        });

        // Setup like and comment buttons
        document.querySelectorAll('.interaction-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Will be implemented with backend
                e.preventDefault();
            });
        });
    }

    // ... [Rest of the profile editing code remains the same]
}

document.addEventListener('DOMContentLoaded', () => {
    new WalletConnector();
});