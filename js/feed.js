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
        const postsContainer = document.querySelector('.posts-container');
        if (!postsContainer) return;

        try {
            LoadingState.show(postsContainer);
            
            // Fetch posts from API
            const posts = await makeApiCall(API_ENDPOINTS.posts);
            
            // Sort posts by timestamp
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Render posts
            postsContainer.innerHTML = posts.length > 0 
                ? posts.map(post => this.postHandler.renderPost(post)).join('')
                : '<p class="no-posts">No posts yet</p>';

            // Add event listeners for post interactions
            this.setupPostInteractions(posts);
            
        } catch (error) {
            console.error('Error loading posts:', error);
            postsContainer.innerHTML = `
                <div class="error-message">
                    Failed to load posts. ${error.message}
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>`;
        } finally {
            LoadingState.hide(postsContainer);
        }
    }

    setupPostInteractions(posts) {
        // Setup delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                await this.postHandler.deletePost(postId);
                await this.loadPosts(); // Reload posts after deletion
            });
        });

        // Setup like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                await this.postHandler.handleLike(postId);
                await this.loadPosts(); // Reload posts after liking
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