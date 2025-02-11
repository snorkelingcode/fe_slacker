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
    
            // Add like button handlers
            document.querySelectorAll('.like-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const postId = button.closest('.post').dataset.postId;
                    try {
                        const response = await makeApiCall(`${API_ENDPOINTS.posts}/${postId}/like`, {
                            method: 'POST',
                            body: JSON.stringify({ walletAddress: this.walletAddress })
                        });
                        
                        // Update like count
                        button.innerHTML = `❤️ ${response.likes.length}`;
                    } catch (error) {
                        console.error('Error liking post:', error);
                        ErrorHandler.showError('Failed to like post', postsContainer);
                    }
                });
            });
    
            // Add delete button handlers
            document.querySelectorAll('.delete-post-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const post = button.closest('.post');
                    const postId = post.dataset.postId;
                    
                    try {
                        LoadingState.show(button);
                        
                        await makeApiCall(`${API_ENDPOINTS.posts}/${postId}`, {
                            method: 'DELETE',
                            body: JSON.stringify({ 
                                walletAddress: SessionManager.getWalletAddress() 
                            })
                        });
                        
                        // Remove the post from the UI
                        post.remove();
                        
                        // Show success message
                        ErrorHandler.showSuccess('Post deleted successfully!', document.querySelector('.posts-container'));
                    } catch (error) {
                        console.error('Error deleting post:', error);
                        ErrorHandler.showError('Failed to delete post', post);
                    } finally {
                        LoadingState.hide(button);
                    }
                });
            });
    
            // Add comment button handlers
            document.querySelectorAll('.comment-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const post = e.target.closest('.post');
                    const postId = post.dataset.postId;
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