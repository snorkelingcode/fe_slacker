class NotificationsHandler {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is connected
        if (!SessionManager.isConnected()) {
            window.location.href = 'profile.html';
            return;
        }

        const signOutButton = document.getElementById('signOutButton');
        if (signOutButton) {
            signOutButton.style.display = 'block';
            signOutButton.addEventListener('click', () => this.signOut());
        }

        this.walletAddress = SessionManager.getWalletAddress();
        this.setupNotifications();
        this.loadNotifications();
    }

    async setupNotifications() {
        const container = document.querySelector('.notifications-container');
        if (!container) return;

        container.innerHTML = `
            <div class="notifications-header">
                <h2>Notifications</h2>
                <button class="mark-all-read-btn">Mark All as Read</button>
            </div>
            <div class="notifications-list">
                <div class="loading-spinner"></div>
            </div>
        `;

        // Setup mark all as read handler
        const markAllReadBtn = container.querySelector('.mark-all-read-btn');
        markAllReadBtn.addEventListener('click', async () => {
            try {
                LoadingState.show(markAllReadBtn);
                await makeApiCall(`${API_ENDPOINTS.notifications}/mark-all-read`, {
                    method: 'POST',
                    body: JSON.stringify({ walletAddress: this.walletAddress })
                });
                await this.loadNotifications();
                ErrorHandler.showSuccess('All notifications marked as read', container);
            } catch (error) {
                console.error('Error marking all as read:', error);
                ErrorHandler.showError(error.message, container);
            } finally {
                LoadingState.hide(markAllReadBtn);
            }
        });
    }

    async loadNotifications() {
        const container = document.querySelector('.notifications-list');
        if (!container) return;

        try {
            LoadingState.show(container);
            const notifications = await makeApiCall(`${API_ENDPOINTS.notifications}/${this.walletAddress}`);
            
            if (notifications.length === 0) {
                container.innerHTML = `
                    <div class="no-notifications">
                        <p>No notifications yet</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = notifications
                .map(notification => this.renderNotification(notification))
                .join('');

            // Setup individual notification handlers
            this.setupNotificationHandlers();

        } catch (error) {
            console.error('Error loading notifications:', error);
            container.innerHTML = `
                <div class="error-message">
                    Failed to load notifications. ${error.message}
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>
            `;
        } finally {
            LoadingState.hide(container);
        }
    }

    renderNotification(notification) {
        const timeAgo = this.getTimeAgo(new Date(notification.createdAt));
        const unreadClass = notification.read ? '' : 'unread';
        
        return `
            <div class="notification ${unreadClass}" data-id="${notification.id}">
                <div class="notification-content">
                    <div class="notification-icon">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-details">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
                ${!notification.read ? `
                    <button class="mark-read-btn" data-id="${notification.id}">
                        Mark as Read
                    </button>
                ` : ''}
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'like': '❤️',
            'comment': '💬',
            'mention': '@',
            'follow': '👤',
            'system': '🔔'
        };
        return icons[type] || '🔔';
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        
        return 'Just now';
    }

    setupNotificationHandlers() {
        // Setup mark as read handlers
        document.querySelectorAll('.mark-read-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const notificationId = button.dataset.id;
                const notification = button.closest('.notification');

                try {
                    LoadingState.show(button);
                    await makeApiCall(`${API_ENDPOINTS.notifications}/${notificationId}/mark-read`, {
                        method: 'POST',
                        body: JSON.stringify({ walletAddress: this.walletAddress })
                    });
                    
                    notification.classList.remove('unread');
                    button.remove();
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                    ErrorHandler.showError(error.message, notification);
                } finally {
                    LoadingState.hide(button);
                }
            });
        });

        // Setup notification click handlers
        document.querySelectorAll('.notification').forEach(notification => {
            notification.addEventListener('click', () => {
                const notificationData = notification.dataset;
                // Handle navigation based on notification type
                if (notificationData.postId) {
                    window.location.href = `comments.html?postId=${notificationData.postId}`;
                } else if (notificationData.profileId) {
                    window.location.href = `profile.html?address=${notificationData.profileId}`;
                }
            });
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
    new NotificationsHandler();
});