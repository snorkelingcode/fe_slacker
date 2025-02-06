class PostHandler {
    constructor(walletAddress) {
        this.walletAddress = walletAddress;
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
                LoadingState.show(postButton);
                await this.createPost(container);
                LoadingState.hide(postButton);
            } catch (error) {
                LoadingState.hide(postButton);
                ErrorHandler.showError(error.message, container);
            }
        });

        // Add keydown event for Ctrl/Cmd + Enter to submit
        postInput.addEventListener('keydown', async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                try {
                    LoadingState.show(postButton);
                    await this.createPost(container);
                    LoadingState.hide(postButton);
                } catch (error) {
                    LoadingState.hide(postButton);
                    ErrorHandler.showError(error.message, container);
                }
            }
        });
    }

    async handleMediaUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            MediaHandler.validateFile(file);
            const mediaUrl = await MediaHandler.handleImageUpload(file);
            
            const mediaPreview = document.querySelector('.media-preview');
            const isVideo = file.type.startsWith('video/');
            mediaPreview.innerHTML = isVideo
                ? `<video src="${mediaUrl}" controls class="media-preview-content"></video>`
                : `<img src="${mediaUrl}" class="media-preview-content">`;
            mediaPreview.innerHTML += '<button class="remove-media">×</button>';

            mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
                mediaPreview.innerHTML = '';
                event.target.value = '';
            });
        } catch (error) {
            ErrorHandler.showError(error.message, event.target.parentElement);
            event.target.value = '';
        }
    }

    async createPost(container) {
        const content = container.querySelector('.post-input').value;
        const mediaElement = container.querySelector('.media-preview-content');

        if (!content && !mediaElement) {
            throw new Error('Please add some content to your post');
        }

        try {
            const postData = {
                walletAddress: this.walletAddress,
                content,
                mediaUrl: mediaElement ? mediaElement.src : null,
                mediaType: mediaElement ? (mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image') : null
            };

            const response = await fetch(API_ENDPOINTS.posts, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });

            const result = await handleApiResponse(response);

            // Clear form
            container.querySelector('.post-input').value = '';
            container.querySelector('.media-preview').innerHTML = '';
            container.querySelector('.media-input').value = '';

            // Show success message
            ErrorHandler.showSuccess('Post created successfully!', container);

            // Refresh posts display
            await this.loadPosts();
        } catch (error) {
            throw new Error(`Failed to create post: ${error.message}`);
        }
    }

    async loadPosts() {
        try {
            const response = await fetch(API_ENDPOINTS.posts);
            const posts = await handleApiResponse(response);
            
            // Render posts
            const postsContainer = document.querySelector('.posts-container');
            if (postsContainer) {
                postsContainer.innerHTML = posts.length > 0 
                    ? posts.map(post => this.renderPost(post)).join('')
                    : '<p class="no-posts">No posts yet</p>';

                this.setupPostInteractions();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            ErrorHandler.showError('Failed to load posts', document.querySelector('.posts-container'));
        }
    }

    async loadUserPosts(walletAddress) {
        try {
            const response = await fetch(`${API_ENDPOINTS.posts}/user/${walletAddress}`);
            const posts = await handleApiResponse(response);
            
            const postsContainer = document.querySelector('.posts-container');
            if (postsContainer) {
                postsContainer.innerHTML = posts.length > 0 
                    ? posts.map(post => this.renderPost(post)).join('')
                    : '<p class="no-posts">No posts yet</p>';

                this.setupPostInteractions();
            }
        } catch (error) {
            console.error('Error loading user posts:', error);
            ErrorHandler.showError('Failed to load posts', document.querySelector('.posts-container'));
        }
    }

    renderPost(post) {
        const isCurrentUser = post.walletAddress === this.walletAddress;
        
        return `
            <div class="post" data-post-id="${post._id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${post.walletAddress.substring(0, 6)}...</span>
                        <span class="post-timestamp">${new Date(post.createdAt).toLocaleString()}</span>
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
                    <button class="interaction-btn">❤️ ${post.likes.length}</button>
                    <button class="interaction-btn">💬 ${post.comments.length}</button>
                </div>
            </div>
        `;
    }

    formatPostContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.posts}/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress: this.walletAddress })
            });

            await handleApiResponse(response);
            await this.loadPosts();
            ErrorHandler.showSuccess('Post deleted successfully!', document.querySelector('.posts-container'));
        } catch (error) {
            console.error('Error deleting post:', error);
            ErrorHandler.showError('Failed to delete post', document.querySelector('.posts-container'));
        }
    }

    setupPostInteractions() {
        // Setup delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                this.deletePost(postId);
            });
        });

        // Setup like and comment buttons - to be implemented later
        document.querySelectorAll('.interaction-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // Future implementation
            });
        });
    }
}