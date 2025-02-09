class CommentsHandler {
    constructor() {
        this.init();
        this.postId = new URLSearchParams(window.location.search).get('postId');
        
        // Add detailed logging for wallet address
        this.walletAddress = SessionManager.getWalletAddress();
        console.log('CommentsHandler - Wallet Address:', this.walletAddress);
        console.log('CommentsHandler - Wallet Address Type:', typeof this.walletAddress);
        
        this.postHandler = null;
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

        this.postHandler = new PostHandler(this.walletAddress);
        this.loadPost();
    }

    async loadPost() {
        if (!this.postId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const post = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`);
            
            // Additional logging to verify post and wallet address
            console.log('Loaded Post:', post);
            console.log('Post Author Wallet Address:', post.author.walletAddress);
            console.log('Current User Wallet Address:', this.walletAddress);

            this.renderPage(post);
            this.setupInteractions(post);
        } catch (error) {
            console.error('Error loading post:', error);
            ErrorHandler.showError('Failed to load post', document.querySelector('.comments-page-container'));
        }
    }

    // ... rest of the existing code remains the same
}class CommentsHandler {
    constructor() {
        this.init();
        this.postId = new URLSearchParams(window.location.search).get('postId');
        this.walletAddress = SessionManager.getWalletAddress();
        this.postHandler = null;
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

        this.postHandler = new PostHandler(this.walletAddress);
        this.loadPost();
    }

    async loadPost() {
        if (!this.postId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const post = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`);
            this.renderPage(post);
            this.setupInteractions(post);
        } catch (error) {
            console.error('Error loading post:', error);
            ErrorHandler.showError('Failed to load post', document.querySelector('.comments-page-container'));
        }
    }

    renderPage(post) {
        const commentsPageContainer = document.querySelector('.comments-page-container');
        
        // Create a container with only the specific post
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
                    ${this.renderComments(post.comments)}
                </div>
            </div>
        `;

        // Setup comment form interactions
        const commentContainer = document.getElementById('commentFormContainer');
        this.postHandler.setupPostForm(commentContainer, true); // Pass true to indicate it's a comment form
    }

    renderOriginalPost(post) {
        return `
            <div class="post single-post" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${post.author.walletAddress.substring(0, 6)}...</span>
                        <span class="post-timestamp">${new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    ${post.author.walletAddress.toLowerCase() === this.walletAddress.toLowerCase() ? `
                        <button class="delete-post-btn">Delete</button>
                    ` : ''}
                </div>
                <div class="post-content">
                    <p>${this.formatPostContent(post.content || '')}</p>
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
                    <button class="interaction-btn like-btn" data-post-id="${post.id}">
                        ❤️ ${post.likes ? post.likes.length : 0}
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

    renderComments(comments = []) {
        return comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${comment.author.walletAddress.substring(0, 6)}...</span>
                    <span class="comment-timestamp">${new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p class="comment-content">${this.formatPostContent(comment.content)}</p>
                ${comment.mediaUrl ? `
                    <div class="comment-media">
                        ${comment.mediaType === 'video' 
                            ? `<video src="${comment.mediaUrl}" controls></video>`
                            : `<img src="${comment.mediaUrl}" alt="Comment image">`
                        }
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    formatPostContent(content) {
        if (!content) return '';
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    setupInteractions(post) {
        // Like button handler
        const likeButton = document.querySelector('.like-btn');
        if (likeButton) {
            likeButton.addEventListener('click', async (e) => {
                const postId = e.target.dataset.postId;
                try {
                    const response = await makeApiCall(`${API_ENDPOINTS.posts}/${postId}/like`, {
                        method: 'POST',
                        body: JSON.stringify({ walletAddress: this.walletAddress })
                    });
                    
                    // Update like count
                    e.target.innerHTML = `❤️ ${response.likes.length}`;
                } catch (error) {
                    console.error('Error liking post:', error);
                    ErrorHandler.showError('Failed to like post', document.querySelector('.comments-page-container'));
                }
            });
        }

        // Comment submission handler
        const postButton = document.querySelector('.post-button');
        const postInput = document.querySelector('.post-input');
        const mediaInput = document.querySelector('.media-input');
        const mediaPreview = document.querySelector('.media-preview');

        postButton.addEventListener('click', async () => {
            const content = postInput.value.trim();
            const mediaElement = mediaPreview.querySelector('.media-preview-content');

            if (!content && !mediaElement) {
                ErrorHandler.showError('Please add a comment', document.querySelector('.comments-page-container'));
                return;
            }

            try {
                const commentData = {
                    walletAddress: this.walletAddress,
                    content,
                    mediaUrl: mediaElement ? mediaElement.src : null,
                    mediaType: mediaElement ? (mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image') : null
                };

                const comment = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}/comment`, {
                    method: 'POST',
                    body: JSON.stringify(commentData)
                });

                // Add new comment to list
                const commentsList = document.querySelector('.comments-list');
                commentsList.insertAdjacentHTML('afterbegin', this.renderComments([comment]));
                
                // Clear input and media preview
                postInput.value = '';
                mediaPreview.innerHTML = '';
                mediaInput.value = '';

                ErrorHandler.showSuccess('Comment posted successfully!', document.querySelector('.comments-page-container'));
            } catch (error) {
                console.error('Error posting comment:', error);
                ErrorHandler.showError('Failed to post comment', document.querySelector('.comments-page-container'));
            }
        });
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
    new CommentsHandler();
});