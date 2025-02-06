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

        mediaInput.addEventListener('change', (e) => this.handleMediaUpload(e));
        postButton.addEventListener('click', () => this.createPost(container));
    }

    async handleMediaUpload(event) {
        const file = event.target.files[0];
        if (file) {
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
        }
    }

    async createPost(container) {
        const content = container.querySelector('.post-input').value;
        const mediaElement = container.querySelector('.media-preview-content');

        if (!content && !mediaElement) {
            alert('Please add some content to your post');
            return;
        }

        const post = {
            id: `post_${Date.now()}`,
            walletAddress: this.walletAddress,
            content,
            timestamp: new Date().toISOString(),
            mediaUrl: mediaElement ? mediaElement.src : null,
            mediaType: mediaElement ? (mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image') : null,
            likes: [],
            comments: []
        };

        // Save post to localStorage
        const posts = JSON.parse(localStorage.getItem(`posts_${this.walletAddress}`)) || [];
        posts.unshift(post);
        localStorage.setItem(`posts_${this.walletAddress}`, JSON.stringify(posts));

        // Clear form
        container.querySelector('.post-input').value = '';
        container.querySelector('.media-preview').innerHTML = '';
        container.querySelector('.media-input').value = '';

        // Refresh posts display
        await this.loadPosts();
    }

    renderPost(post) {
        const isCurrentUser = post.walletAddress === this.walletAddress;
        const profile = JSON.parse(localStorage.getItem(`profile_${post.walletAddress}`));
        const username = profile ? profile.username : post.walletAddress.substring(0, 6) + '...';

        return `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-author">${username}</span>
                        <span class="post-timestamp">${new Date(post.timestamp).toLocaleString()}</span>
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

    deletePost(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            const posts = JSON.parse(localStorage.getItem(`posts_${this.walletAddress}`)) || [];
            const updatedPosts = posts.filter(post => post.id !== postId);
            localStorage.setItem(`posts_${this.walletAddress}`, JSON.stringify(updatedPosts));
            this.loadPosts();
        }
    }
}