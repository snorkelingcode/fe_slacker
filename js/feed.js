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

        // Add event listener for post interactions
        document.addEventListener('postInteraction', () => {
            this.loadPosts();
        });
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

            // Add event listeners for post interactions directly
            document.querySelectorAll('.comment-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    console.log('Comment button clicked in feed.js');
                    const post = e.target.closest('.post');
                    const postId = post.dataset.postId;
                    console.log('Post ID:', postId);
                    window.location.href = `comments.html?postId=${postId}`;
                });
            });

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