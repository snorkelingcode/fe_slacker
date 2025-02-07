class PostHandler {
    constructor(walletAddress) {
        this.walletAddress = walletAddress;
        this.loadingPosts = false;
    }

    async handleLike(postId) {
        try {
            const button = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            if (button) button.disabled = true;

            await makeApiCall(`${API_ENDPOINTS.posts}/${postId}/like`, {
                method: 'POST',
                body: JSON.stringify({ walletAddress: this.walletAddress })
            });

            await this.loadPosts();
        } catch (error) {
            console.error('Error liking post:', error);
            ErrorHandler.showError('Failed to like post', document.querySelector('.posts-container'));
        } finally {
            if (button) button.disabled = false;
        }
    }

    async handleComment(postId, comment) {
        try {
            const button = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
            if (button) button.disabled = true;

            await makeApiCall(`${API_ENDPOINTS.posts}/${postId}/comment`, {
                method: 'POST',
                body: JSON.stringify({
                    walletAddress: this.walletAddress,
                    content: comment
                })
            });

            await this.loadPosts();
        } catch (error) {
            console.error('Error adding comment:', error);
            ErrorHandler.showError('Failed to add comment', document.querySelector('.posts-container'));
        } finally {
            if (button) button.disabled = false;
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await makeApiCall(`${API_ENDPOINTS.posts}/${postId}`, {
                method: 'DELETE',
                body: JSON.stringify({ walletAddress: this.walletAddress })
            });

            await this.loadPosts();
            ErrorHandler.showSuccess('Post deleted successfully!', document.querySelector('.posts-container'));
        } catch (error) {
            console.error('Error deleting post:', error);
            ErrorHandler.showError('Failed to delete post', document.querySelector('.posts-container'));
        }
    }

    async loadPosts() {
        if (this.loadingPosts) return;
        this.loadingPosts = true;

        try {
            const postsContainer = document.querySelector('.posts-container');
            if (!postsContainer) return;

            LoadingState.show(postsContainer);
            
            const posts = await makeApiCall(API_ENDPOINTS.posts);
            
            postsContainer.innerHTML = posts.length > 0 
                ? posts.map(post => this.renderPost(post)).join('')
                : '<p class="no-posts">No posts yet</p>';

            this.setupPostInteractions();
        } catch (error) {
            console.error('Error loading posts:', error);
            ErrorHandler.showError('Failed to load posts', document.querySelector('.posts-container'));
        } finally {
            this.loadingPosts = false;
            LoadingState.hide(document.querySelector('.posts-container'));
        }
    }

    renderPost(post) {
        const isCurrentUser = post.walletAddress === this.walletAddress;
        const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Invalid date';
        
        return `
            <div class="post" data-post-id="${post._id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${post.walletAddress.substring(0, 6)}...</span>
                        <span class="post-timestamp">${formattedDate}</span>
                    </div>
                    ${isCurrentUser ? `<button class="delete-post-btn">Delete</button>` : ''}
                </div>
                <div class="post-content">
                    <p>${this.formatPostContent(post.content)}</p>
                    ${post.mediaUrl ? `
                        <div class="post-media-container">
                            ${post.mediaType === 'video' 
                                ? `<video src="${post.mediaUrl}" controls class="post-media"></video>`
                                : `<img src="${post.mediaUrl}" alt="Post image" class="post-media">`
                            }
                        </div>
                    ` : ''}
                </div>
                <div class="post-interactions">
                    <button class="interaction-btn like-btn" data-post-id="${post._id}">
                        ❤️ ${post.likes ? post.likes.length : 0}
                    </button>
                    <button class="interaction-btn comment-btn" data-post-id="${post._id}">
                        💬 ${post.comments ? post.comments.length : 0}
                    </button>
                </div>
                <div class="comment-section" style="display: none;">
                    <textarea class="comment-input" placeholder="Write a comment..."></textarea>
                    <button class="post-comment-btn">Post Comment</button>
                    ${this.renderComments(post.comments)}
                </div>
            </div>
        `;
    }

    renderComments(comments = []) {
        return comments.length > 0 
            ? `<div class="comments-list">
                ${comments.map(comment => `
                    <div class="comment">
                        <span class="comment-author">${comment.walletAddress.substring(0, 6)}...</span>
                        <p class="comment-content">${this.formatPostContent(comment.content)}</p>
                        <span class="comment-timestamp">${new Date(comment.timestamp).toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>`
            : '';
    }

    setupPostInteractions() {
        // Delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                await this.deletePost(postId);
            });
        });

        // Like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                await this.handleLike(postId);
            });
        });

        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const post = e.target.closest('.post');
                const commentSection = post.querySelector('.comment-section');
                commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
            });
        });

        // Post comment buttons
        document.querySelectorAll('.post-comment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const post = e.target.closest('.post');
                const postId = post.dataset.postId;
                const commentInput = post.querySelector('.comment-input');
                const comment = commentInput.value.trim();
                
                if (comment) {
                    await this.handleComment(postId, comment);
                    commentInput.value = '';
                }
            });
        });
    }

    formatPostContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }
}