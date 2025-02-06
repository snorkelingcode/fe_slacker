console.log('PostHandler is loading...');

class PostHandler {
    constructor(walletAddress) {
        console.log('PostHandler constructor called with address:', walletAddress);
        this.walletAddress = walletAddress;
        this.apiUrl = 'https://be-slacker.vercel.app/api';
        console.log('API URL:', this.apiUrl);
    }

    renderPostForm() {
        console.log('Rendering post form...');
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
        console.log('Setting up post form...');
        const mediaInput = container.querySelector('.media-input');
        const postButton = container.querySelector('.post-button');

        mediaInput.addEventListener('change', (e) => this.handleMediaUpload(e));
        postButton.addEventListener('click', () => this.createPost(container));
    }

    async handleMediaUpload(event) {
        console.log('Handling media upload...');
        const file = event.target.files[0];
        if (file) {
            try {
                MediaHandler.validateFile(file, file.type.startsWith('video/') ? 'video' : 'image');
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaPreview = document.querySelector('.media-preview');
                    const isVideo = file.type.startsWith('video/');
                    mediaPreview.innerHTML = isVideo
                        ? `<video src="${e.target.result}" controls class="media-preview-content"></video>`
                        : `<img src="${e.target.result}" class="media-preview-content">`;
                    mediaPreview.innerHTML += '<button class="remove-media">×</button>';

                    mediaPreview.querySelector('.remove-media').addEventListener('click', () => {
                        mediaPreview.innerHTML = '';
                        event.target.value = '';
                    });
                };
                reader.readAsDataURL(file);
            } catch (error) {
                alert(error.message);
            }
        }
    }

    async createPost(container) {
        console.log('Creating post...');
        const content = container.querySelector('.post-input').value;
        const mediaElement = container.querySelector('.media-preview-content');

        if (!content && !mediaElement) {
            alert('Please add some content to your post');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress: this.walletAddress,
                    content,
                    mediaUrl: mediaElement ? mediaElement.src : null,
                    mediaType: mediaElement ? (mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image') : null
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            // Clear form
            container.querySelector('.post-input').value = '';
            container.querySelector('.media-preview').innerHTML = '';
            container.querySelector('.media-input').value = '';

            // Refresh posts display
            await this.loadPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    }

    async loadPosts() {
        console.log('Loading posts...');
        try {
            const response = await fetch(`${this.apiUrl}/posts`);
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const posts = await response.json();
            console.log('Posts loaded:', posts);
            
            // Render posts
            const postsContainer = document.querySelector('.posts-container');
            postsContainer.innerHTML = posts.map(post => this.renderPost(post)).join('');

            // Add event listeners for post interactions
            this.setupPostInteractions(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPost(post) {
        const isCurrentUser = post.walletAddress === this.walletAddress;
        
        return `
            <div class="post" data-post-id="${post._id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${post.walletAddress.substring(0, 6)}...${post.walletAddress.slice(-4)}</span>
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
                    <button class="interaction-btn like-btn">
                        ❤️ ${post.likes ? post.likes.length : 0}
                    </button>
                    <button class="interaction-btn">
                        💬 ${post.comments ? post.comments.length : 0}
                    </button>
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
        console.log('Deleting post:', postId);
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                const response = await fetch(`${this.apiUrl}/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        walletAddress: this.walletAddress
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to delete post');
                }

                await this.loadPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Failed to delete post. Please try again.');
            }
        }
    }

    async likePost(postId) {
        console.log('Liking/unliking post:', postId);
        try {
            const response = await fetch(`${this.apiUrl}/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress: this.walletAddress
                })
            });

            if (!response.ok) {
                throw new Error('Failed to like/unlike post');
            }

            await this.loadPosts();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }

    setupPostInteractions(posts) {
        console.log('Setting up post interactions...');
        // Setup delete buttons
        document.querySelectorAll('.delete-post-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                this.deletePost(postId);
            });
        });

        // Setup like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.closest('.post').dataset.postId;
                this.likePost(postId);
            });
        });
    }
}

// Make PostHandler available globally
if (typeof window !== 'undefined') {
    window.PostHandler = PostHandler;
}