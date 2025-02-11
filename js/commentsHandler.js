class CommentsHandler {
    constructor() {
        this.postId = new URLSearchParams(window.location.search).get('postId');
        this.walletAddress = SessionManager.getWalletAddress();
        this.isGuest = localStorage.getItem('isGuest') === 'true';
        console.log('CommentsHandler - Wallet Address:', this.walletAddress, 'Is Guest:', this.isGuest);
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

        this.loadPost();
    }

    async loadPost() {
        if (!this.postId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            console.log('Attempting to load post with ID:', this.postId);
            
            // Use the specific post endpoint to fetch the post by ID
            const response = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`, {
                method: 'GET'
            });

            console.log('Loaded Post:', response);
            
            this.renderPage(response);
            this.setupInteractions(response);
        } catch (error) {
            console.error('Detailed error loading post:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            ErrorHandler.showError(`Failed to load post: ${error.message}`, 
                document.querySelector('.comments-page-container') || document.body);
        }
    }

    renderPage(post) {
        const commentsPageContainer = document.querySelector('.comments-page-container');
        
        commentsPageContainer.innerHTML = `
            <div class="back-button">
                <button onclick="window.history.back()" class="nav-button">← Back</button>
            </div>
            
            <div id="originalPost" class="single-post-view">
                ${this.renderOriginalPost(post)}
            </div>
            
            <div id="commentFormContainer" class="create-post-box">
                ${this.renderCommentForm()}
            </div>
            
            <div id="commentsSection">
                <h3>Comments</h3>
                <div class="comments-list">
                    ${this.renderComments(post.comments || [])}
                </div>
            </div>
        `;

        // Setup comment form interactions manually
        this.setupCommentFormInteractions(post);
    }

    renderOriginalPost(post) {
        return `
            <div class="post single-post" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${this.formatAuthor(post.author)}</span>
                        <span class="post-timestamp">${new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    ${this.canDeletePost(post) ? `
                        <button class="delete-post-btn" data-post-id="${post.id}">Delete</button>
                    ` : ''}
                </div>
                <div class="post-content">
                    <p>${this.formatPostContent(post.content || '')}</p>
                    ${this.renderMedia(post)}
                </div>
                <div class="post-interactions">
                    <button class="interaction-btn like-btn" data-post-id="${post.id}">
                        ❤️ ${post.likes ? post.likes.length : 0}
                    </button>
                    <button class="interaction-btn comment-btn" data-post-id="${post.id}">
                        💬 ${post.comments ? post.comments.length : 0}
                    </button>
                </div>
            </div>`;
    }

    renderCommentForm() {
        return `
            <div class="post-form comment-form">
                <textarea class="post-input" placeholder="Write a comment..."></textarea>
                <div class="post-actions">
                    <div class="media-options">
                        <label class="media-button">
                            <input type="file" accept="image/*,video/*" hidden class="media-input">
                            <span>Add Media</span>
                        </label>
                    </div>
                    <button class="post-button">Post Comment</button>
                </div>
                <div class="media-preview"></div>
            </div>`;
    }

    setupCommentFormInteractions(post) {
        const mediaInput = document.querySelector('.media-input');
        const postButton = document.querySelector('.post-button');
        const postInput = document.querySelector('.post-input');

        // Media upload handler
        mediaInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                MediaHandler.validateFile(file);
                MediaHandler.handleImageUpload(file).then((mediaUrl) => {
                    const mediaPreview = document.querySelector('.media-preview');
                    const isVideo = file.type.startsWith('video/');
                    mediaPreview.innerHTML = isVideo
                        ? `<video src="${mediaUrl}" controls class="media-preview-content"></video>`
                        : `<img src="${mediaUrl}" class="media-preview-content">`;
                    mediaPreview.innerHTML += '<button class="remove-media">×</button>';

                    mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
                        mediaPreview.innerHTML = '';
                        mediaInput.value = '';
                    });
                });
            } catch (error) {
                ErrorHandler.showError(error.message, mediaInput.closest('.media-options'));
            }
        });

        // Comment submission handler
        postButton.addEventListener('click', async () => {
            const content = postInput.value.trim();
            const mediaPreview = document.querySelector('.media-preview-content');

            if (!content && !mediaPreview) {
                ErrorHandler.showError('Please add a comment or media', document.querySelector('.comments-page-container'));
                return;
            }

            try {
                LoadingState.show(postButton);

                const commentData = {
                    walletAddress: this.walletAddress,
                    content,
                    mediaUrl: mediaPreview ? mediaPreview.src : null,
                    mediaType: mediaPreview 
                        ? (mediaPreview.tagName.toLowerCase() === 'video' ? 'video' : 'image') 
                        : null
                };

                const updatedPost = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}/comment`, {
                    method: 'POST',
                    body: JSON.stringify(commentData)
                });

                // Re-render comments list with only this post's comments
                const commentsList = document.querySelector('.comments-list');
                commentsList.innerHTML = this.renderComments(updatedPost.comments);

                // Clear input and media preview
                postInput.value = '';
                document.querySelector('.media-preview').innerHTML = '';

                ErrorHandler.showSuccess('Comment posted successfully!', document.querySelector('.comments-page-container'));
                
                // Refresh interactions for new comments
                this.setupInteractions(updatedPost);
            } catch (error) {
                console.error('Error posting comment:', error);
                ErrorHandler.showError('Failed to post comment: ' + error.message, document.querySelector('.comments-page-container'));
            } finally {
                LoadingState.hide(postButton);
            }
        });

        // Optional: Add support for posting comment with Ctrl/Cmd + Enter
        postInput.addEventListener('keydown', async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                postButton.click();
            }
        });
    }

    setupInteractions(post) {
        // Like button handler
        const likeButton = document.querySelector('.like-btn');
        if (likeButton) {
            likeButton.addEventListener('click', async () => {
                try {
                    const response = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}/like`, {
                        method: 'POST',
                        body: JSON.stringify({ walletAddress: this.walletAddress })
                    });
                    
                    // Update like count
                    likeButton.innerHTML = `❤️ ${response.likes.length}`;
                } catch (error) {
                    console.error('Error liking post:', error);
                    ErrorHandler.showError('Failed to like post', document.querySelector('.comments-page-container'));
                }
            });
        }

        // Delete post button handler
        const deletePostBtn = document.querySelector('.delete-post-btn');
        if (deletePostBtn) {
            deletePostBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this post?')) return;

                try {
                    LoadingState.show(deletePostBtn);
                    
                    await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`, {
                        method: 'DELETE',
                        body: JSON.stringify({ walletAddress: this.walletAddress })
                    });
                    
                    // Redirect to feed after deletion
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Error deleting post:', error);
                    ErrorHandler.showError('Failed to delete post', document.querySelector('.comments-page-container'));
                } finally {
                    LoadingState.hide(deletePostBtn);
                }
            });
        }

        // Delete comment buttons
        document.querySelectorAll('.delete-comment-btn').forEach(deleteCommentBtn => {
            deleteCommentBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this comment?')) return;

                const commentId = deleteCommentBtn.dataset.commentId;
                const commentElement = deleteCommentBtn.closest('.comment');

                try {
                    LoadingState.show(deleteCommentBtn);
                    
                    const updatedPost = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}/comments/${commentId}`, {
                        method: 'DELETE',
                        body: JSON.stringify({ walletAddress: this.walletAddress })
                    });
                    
                    // Re-render comments list with updated comments
                    const commentsList = document.querySelector('.comments-list');
                    commentsList.innerHTML = this.renderComments(updatedPost.comments);

                    // Refresh interactions
                    this.setupInteractions(updatedPost);

                    ErrorHandler.showSuccess('Comment deleted successfully', document.querySelector('.comments-page-container'));
                } catch (error) {
                    console.error('Error deleting comment:', error);
                    ErrorHandler.showError('Failed to delete comment', document.querySelector('.comments-page-container'));
                } finally {
                    LoadingState.hide(deleteCommentBtn);
                }
            });
        });
    }

    // Utility methods
    formatAuthor(author) {
        return author ? 
            `${author.username || author.walletAddress.substring(0, 6)}...` 
            : 'Anonymous';
    }

    renderMedia(item) {
        return item.mediaUrl ? `
            <div class="post-media-container">
                ${item.mediaType === 'video' 
                    ? `<video src="${item.mediaUrl}" controls class="post-media"></video>`
                    : `<img src="${item.mediaUrl}" alt="Media" class="post-media">`
                }
            </div>
        ` : '';
    }

    renderComments(comments = []) {
        return comments.length > 0 
            ? comments.map(comment => `
                <div class="comment" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${this.formatAuthor(comment.author)}</span>
                        <span class="comment-timestamp">${new Date(comment.createdAt).toLocaleString()}</span>
                        ${this.canDeleteComment(comment) ? `
                            <button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>
                        ` : ''}
                    </div>
                    <p class="comment-content">${this.formatPostContent(comment.content || '')}</p>
                    ${this.renderMedia(comment)}
                </div>
            `).join('') 
            : '<p class="no-comments">No comments yet</p>';
    }

    canDeletePost(post) {
        if (!this.walletAddress) return false;
        return post.author.walletAddress.toLowerCase() === this.walletAddress.toLowerCase();
    }

    canDeleteComment(comment) {
        if (!this.walletAddress) return false;
        return comment.author.walletAddress.toLowerCase() === this.walletAddress.toLowerCase();
    }

    formatPostContent(content) {
        if (!content) return '';
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.href = 'profile.html';
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const commentsHandler = new CommentsHandler();
    commentsHandler.init();
});