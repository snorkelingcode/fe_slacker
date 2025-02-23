class PostHandler {
    constructor(walletAddress) {
        this.walletAddress = walletAddress.toLowerCase();
        this.loadingPosts = false;

        // Check if required utilities are available
        if (typeof LoadingState === 'undefined') {
            console.error('LoadingState is not defined. Make sure utils.js is loaded properly.');
        }
        if (typeof ErrorHandler === 'undefined') {
            console.error('ErrorHandler is not defined. Make sure utils.js is loaded properly.');
        }
        if (typeof MediaHandler === 'undefined') {
            console.error('MediaHandler is not defined. Make sure utils.js is loaded properly.');
        }
    }

    renderPostForm() {
        return `
            <div class="create-post-box">
                <div class="post-form">
                    <textarea class="post-input" placeholder="What's on your mind?"></textarea>
                    <div class="post-actions">
                        <div class="media-options">
                            <label class="media-button">
                                <input type="file" accept="image/*,video/*" hidden class="media-input">
                                <span>Add Media</span>
                            </label>
                        </div>
                        <button class="post-button">Post</button>
                    </div>
                    <div class="media-preview"></div>
                </div>
            </div>
        `;
    }

    setupPostForm(container) {
        const mediaInput = container.querySelector('.media-input');
        const postButton = container.querySelector('.post-button');
        const postInput = container.querySelector('.post-input');

        mediaInput.addEventListener('change', (e) => this.handleMediaUpload(e));
        postButton.addEventListener('click', async () => {
            try {
                if (typeof LoadingState !== 'undefined') {
                    LoadingState.show(postButton);
                }

                await this.createPost(container);

                if (typeof LoadingState !== 'undefined') {
                    LoadingState.hide(postButton);
                }
            } catch (error) {
                if (typeof LoadingState !== 'undefined') {
                    LoadingState.hide(postButton);
                }
                if (typeof ErrorHandler !== 'undefined') {
                    ErrorHandler.showError(error.message, container);
                } else {
                    console.error('Error:', error.message);
                }
            }
        });

        postInput.addEventListener('keydown', async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                try {
                    if (typeof LoadingState !== 'undefined') {
                        LoadingState.show(postButton);
                    }

                    await this.createPost(container);

                    if (typeof LoadingState !== 'undefined') {
                        LoadingState.hide(postButton);
                    }
                } catch (error) {
                    if (typeof LoadingState !== 'undefined') {
                        LoadingState.hide(postButton);
                    }
                    if (typeof ErrorHandler !== 'undefined') {
                        ErrorHandler.showError(error.message, container);
                    } else {
                        console.error('Error:', error.message);
                    }
                }
            }
        });
    }

async handleMediaUpload(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const mediaPreview = document.querySelector('.media-preview');
        mediaPreview.innerHTML = '<div class="loading-spinner"></div>';

        // Upload the file using MediaHandler
        const mediaUrl = await MediaHandler.uploadFile(file);
        
        const isVideo = file.type.startsWith('video/');
        mediaPreview.innerHTML = isVideo
            ? `<video src="${mediaUrl}" controls class="media-preview-content"></video>`
            : `<img src="${mediaUrl}" class="media-preview-content">`;
        mediaPreview.innerHTML += '<button class="remove-media">×</button>';

        // Add remove media handler
        mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
            mediaPreview.innerHTML = '';
            event.target.value = '';
        });
    } catch (error) {
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.showError(error.message, event.target.parentElement);
        } else {
            console.error('Error:', error.message);
        }
        event.target.value = '';
    }
}

// Inside PostHandler class:
async createPost(container) {
    console.log('Current Wallet Address', this.walletAddress);
    const content = container.querySelector('.post-input').value;
    const mediaElement = container.querySelector('.media-preview-content');

    if (!content && !mediaElement) {
        throw new Error('Please add some content to your post');
    }

    try {
        const postData = {
            walletAddress: this.walletAddress.toLowerCase(),
            content,
            mediaUrl: mediaElement ? mediaElement.src : null,
            mediaType: mediaElement ? (mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image') : null
        };

        // Send post to backend API
        await makeApiCall(API_ENDPOINTS.posts, {
            method: 'POST',
            body: JSON.stringify(postData)
        });

        // Clear form
        container.querySelector('.post-input').value = '';
        container.querySelector('.media-preview').innerHTML = '';
        container.querySelector('.media-input').value = '';

        // Show success message
        ErrorHandler.showSuccess('Post created successfully!', container);
        
        // Reload posts from database
        await this.loadPosts();
    } catch (error) {
        throw new Error(`Failed to create post: ${error.message}`);
    }
}

async loadPosts() {
    if (this.loadingPosts) return;
    this.loadingPosts = true;

    try {
        const postsContainer = document.querySelector('.posts-container');
        if (!postsContainer) return;

        LoadingState.show(postsContainer);
        
        // Fetch posts from backend API
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

async handleLike(postId) {
    try {
        const button = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
        if (button) button.disabled = true;

        const response = await makeApiCall(`${API_ENDPOINTS.posts}/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({ walletAddress: this.walletAddress })
        });
        
        // Dispatch event that post was liked
        document.dispatchEvent(new CustomEvent('postInteraction'));

        // Update like count directly
        if (button) {
            button.innerHTML = `❤️ ${response.likes ? response.likes.length : 0}`;
            button.disabled = false;
        }

    } catch (error) {
        console.error('Error liking post:', error);
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.showError('Failed to like post', document.querySelector('.posts-container'));
        }
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
            if (typeof ErrorHandler !== 'undefined') {
                ErrorHandler.showError('Failed to add comment', document.querySelector('.posts-container'));
            }
        } finally {
            const button = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
            if (button) button.disabled = false;
        }
    }

    async deletePost(postId) {
        if (!postId) {
            console.error('No post ID provided for deletion');
            return;
        }
    
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }
    
        const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
        if (!postElement) return;
    
        try {
            LoadingState.show(postElement);
    
            // Make API call to delete the post with wallet address
            const response = await makeApiCall(`${API_ENDPOINTS.posts}/${postId}`, {
                method: 'DELETE',
                body: JSON.stringify({ 
                    walletAddress: this.walletAddress 
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Remove the post from UI
            postElement.remove();
            
            // Show success message
            const postsContainer = document.querySelector('.posts-container');
            if (postsContainer) {
                ErrorHandler.showSuccess('Post deleted successfully!', postsContainer);
            }
    
        } catch (error) {
            console.error('Error deleting post:', error);
            ErrorHandler.showError(`Failed to delete post: ${error.message}`, postElement);
        } finally {
            LoadingState.hide(postElement);
        }
    }

    renderPost(post) {
        // Add null checks and default values
        const isCurrentUser = post.author && post.author.walletAddress 
            ? post.author.walletAddress.toLowerCase() === this.walletAddress.toLowerCase() 
            : false;
        
        const formattedDate = post.createdAt 
            ? new Date(post.createdAt).toLocaleString() 
            : 'Invalid date';
        
        const authorAddress = post.author 
            ? post.author.walletAddress.substring(0, 6) 
            : 'Unknown';
        
        return `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${authorAddress}...</span>
                        <span class="post-timestamp">${formattedDate}</span>
                    </div>
                    ${isCurrentUser ? `<button class="delete-post-btn">Delete</button>` : ''}
                </div>
                <div class="post-content">
                    <p>${this.formatPostContent(post.content)}</p>
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
            </div>
        `;
    }
    
    renderMedia(item) {
        if (!item.mediaUrl) return '';
        
        return `
            <div class="post-media-container">
                ${item.mediaType === 'video' 
                    ? `<video src="${item.mediaUrl}" controls class="post-media"></video>`
                    : `<img src="${item.mediaUrl}" alt="Post media" class="post-media">`
                }
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

    formatPostContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    setupPostInteractions() {
        // Delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.replaceWith(button.cloneNode(true));
            const newButton = document.querySelector(`.delete-post-btn`);
            if (newButton) {
                newButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const postId = e.target.closest('.post').dataset.postId;
                    await this.deletePost(postId);
                });
            }
        });
    
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.replaceWith(button.cloneNode(true));
            const newButton = document.querySelector(`.like-btn[data-post-id="${button.dataset.postId}"]`);
            if (newButton) {
                newButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const postId = e.target.closest('.post').dataset.postId;
                    await this.handleLike(postId);
                });
            }
        });
    
        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(button => {
            button.replaceWith(button.cloneNode(true));
            const newButton = document.querySelector(`.comment-btn`);
            if (newButton) {
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const post = e.target.closest('.post');
                    if (!post) return;
                    
                    const postId = post.dataset.postId;
                    if (!postId) return;
                    
                    window.location.href = `comments.html?postId=${postId}`;
                });
            }
        });
    }
}