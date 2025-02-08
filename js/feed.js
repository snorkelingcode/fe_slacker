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
        const feedContent = document.getElementById('feedContent');
        feedContent.innerHTML = this.postHandler.renderPostForm() + '<div class="posts-container"></div>';
        
        const postForm = document.querySelector('.create-post-box');
        this.postHandler.setupPostForm(postForm);
    }

    async loadPosts() {
        try {
            LoadingState.show(document.querySelector('.posts-container'));
            
            const posts = await makeApiCall(API_ENDPOINTS.posts);
            const postsContainer = document.querySelector('.posts-container');
            
            postsContainer.innerHTML = posts.length > 0 
                ? posts.map(post => this.postHandler.renderPost(post)).join('')
                : '<p class="no-posts">No posts yet. Be the first to post!</p>';
            
            this.setupPostInteractions(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            ErrorHandler.showError('Failed to load posts', document.querySelector('.posts-container'));
        } finally {
            LoadingState.hide(document.querySelector('.posts-container'));
        }
    }

    setupPostInteractions(posts) {
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                this.postHandler.deletePost(postId);
            });
        });

        document.querySelectorAll('.interaction-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                const type = e.target.classList.contains('like-btn') ? 'like' : 'comment';
                
                if (type === 'like') {
                    this.postHandler.handleLike(postId);
                } else {
                    // Future implementation for comments
                    console.log('Comment functionality coming soon');
                }
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