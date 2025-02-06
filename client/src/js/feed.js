class FeedHandler {
    constructor() {
        this.init();
    }

    init() {
        if (!SessionManager.isConnected()) {
            window.location.href = 'profile.html';
            return;
        }

        const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.style.display = 'block';
            signOutButton.addEventListener('click', () => this.signOut());
        }

        this.walletAddress = SessionManager.getWalletAddress();
        this.postHandler = new PostHandler(this.walletAddress);
        
        this.setupFeed();
        this.loadPosts();
    }

    setupFeed() {
        // Add post form to feed content
        const feedContent = document.getElementById('feedContent');
        feedContent.innerHTML = this.postHandler.renderPostForm() + '<div class="posts-container"></div>';
        
        // Setup post form handlers
        const postForm = document.querySelector('.create-post-box');
        this.postHandler.setupPostForm(postForm);
    }

    async loadPosts() {
        const posts = [];
        // Get all posts from all users
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('posts_')) {
                const userPosts = JSON.parse(localStorage.getItem(key)) || [];
                posts.push(...userPosts);
            }
        }

        // Sort posts by timestamp
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Render posts
        const postsContainer = document.querySelector('.posts-container');
        postsContainer.innerHTML = posts.map(post => this.postHandler.renderPost(post)).join('');

        // Add event listeners for post interactions
        this.setupPostInteractions(posts);
    }

    setupPostInteractions(posts) {
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
                // This will be implemented when we add backend support
                e.preventDefault();
            });
        });
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.href = 'profile.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FeedHandler();
});