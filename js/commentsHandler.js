class CommentsHandler {
    constructor() {
        this.init();
        this.postId = new URLSearchParams(window.location.search).get('postId');
        this.walletAddress = SessionManager.getWalletAddress();
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
            const post = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}`);
            this.renderPost(post);
            this.setupInteractions();
        } catch (error) {
            console.error('Error loading post:', error);
            ErrorHandler.showError('Failed to load post', document.querySelector('.comments-page-container'));
        }
    }

    renderPost(post) {
        const originalPostElement = document.getElementById('originalPost');
        const commentsSection = document.getElementById('commentsSection');

        // Render original post
        originalPostElement.innerHTML = `
            <div class="post" data-post-id="${post.id}">
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

        // Render comments section
        commentsSection.innerHTML = `
            <div class="comment-form">
                <textarea class="comment-input" placeholder="Write a comment..."></textarea>
                <button class="post-comment-btn">Post Comment</button>
            </div>
            <div class="comments-list">
                ${this.renderComments(post.comments)}
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
            </div>
        `).join('');
    }

    formatPostContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    setupInteractions() {
        // Like button handler
        document.querySelector('.like-btn').addEventListener('click', async (e) => {
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

        // Comment form handler
        const commentForm = document.querySelector('.comment-form');
        const commentInput = commentForm.querySelector('.comment-input');
        const submitButton = commentForm.querySelector('.post-comment-btn');

        submitButton.addEventListener('click', async () => {
            const content = commentInput.value.trim();
            if (!content) return;

            try {
                const comment = await makeApiCall(`${API_ENDPOINTS.posts}/${this.postId}/comment`, {
                    method: 'POST',
                    body: JSON.stringify({
                        walletAddress: this.walletAddress,
                        content
                    })
                });

                // Add new comment to list
                const commentsList = document.querySelector('.comments-list');
                commentsList.insertAdjacentHTML('afterbegin', this.renderComments([comment]));
                
                // Clear input
                commentInput.value = '';
            } catch (error) {
                console.error('Error posting comment:', error);
                ErrorHandler.showError('Failed to post comment', commentForm);
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