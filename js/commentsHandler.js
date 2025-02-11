class CommentsHandler {
    constructor() {
        this.postId = new URLSearchParams(window.location.search).get('postId');
        this.walletAddress = SessionManager.getWalletAddress();
        this.isGuest = localStorage.getItem('isGuest') === 'true';
        console.log('CommentsHandler - Wallet Address:', this.walletAddress, 'Is Guest:', this.isGuest);
        
        this.postHandler = new PostHandler(this.walletAddress);
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

    async loadPost() {
        if (!this.postId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            // Use the specific post endpoint to fetch the post by ID
            const post = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`);
            
            if (!post) {
                throw new Error('Post not found');
            }

            console.log('Loaded Post:', post);
            this.renderPage(post);
            this.setupInteractions(post);
        } catch (error) {
            console.error('Error loading post:', error);
            ErrorHandler.showError('Failed to load post', document.querySelector('.comments-page-container'));
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
        this.setupCommentFormInteractions();
    }

    setupCommentFormInteractions() {
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

                // Re-render the entire comments section
                const commentsList = document.querySelector('.comments-list');
                commentsList.innerHTML = this.renderComments(updatedPost.comments);

                // Clear input and media preview
                postInput.value = '';
                document.querySelector('.media-preview').innerHTML = '';

                ErrorHandler.showSuccess('Comment posted successfully!', document.querySelector('.comments-page-container'));
                
                // Setup interactions for new comments
                this.setupInteractions(updatedPost);
            } catch (error) {
                console.error('Error posting comment:', error);
                ErrorHandler.showError('Failed to post comment', document.querySelector('.comments-page-container'));
            } finally {
                LoadingState.hide(postButton);
            }
        });
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            SessionManager.clearSession();
            window.location.href = 'profile.html';
        }
    }

    formatPostContent(content) {
        if (!content) return '';
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const commentsHandler = new CommentsHandler();
    commentsHandler.init();
});