console.log('PostHandler is loading...');
class PostHandler {
    constructor(walletAddress) {
        this.walletAddress = walletAddress;
        this.apiUrl = 'https:/be-slacker.vercel.app/api'; // Replace with your actual backend URL
    }

    async createPost(container) {
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
        try {
            const response = await fetch(`${this.apiUrl}/posts`);
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const posts = await response.json();
            
            // Render posts
            const postsContainer = document.querySelector('.posts-container');
            postsContainer.innerHTML = posts.map(post => this.renderPost(post)).join('');

            // Add event listeners for post interactions
            this.setupPostInteractions(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    async deletePost(postId) {
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

    // Your existing renderPost and formatPostContent methods can remain the same
}