// moduleHandler.js
class ModuleHandler {
    constructor() {
        this.draggedModule = null;
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.xOffset = 0;
        this.yOffset = 0;

        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');
        this.container = document.getElementById('moduleContainer');

        // Initialize theme from localStorage
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(this.currentTheme);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add button click handler
        this.addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modal.classList.toggle('active');
        });

        // Module option click handlers
        document.querySelectorAll('.module-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createModule(option.dataset.type);
                this.modal.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.modal.contains(e.target) && !this.addButton.contains(e.target)) {
                this.modal.classList.remove('active');
            }
        });
    }

    createModule(type) {
        const module = document.createElement('div');
        module.className = 'module';
        
        // Set initial position with some randomness
        const initialX = Math.random() * (window.innerWidth - 420);
        const initialY = Math.random() * (window.innerHeight - 200);
        module.style.transform = `translate(${initialX}px, ${initialY}px)`;

        const titles = {
            music: 'Music Player',
            ai: 'AI Chat',
            market: 'Crypto Market',
            settings: 'Settings'
        };

        // Special content for settings module
        let content = '';
        if (type === 'settings') {
            content = `
                <div class="settings-content">
                    <div class="settings-section">
                        <h3 class="settings-title">Theme</h3>
                        <div class="theme-switcher">
                            <label class="theme-option">
                                <input type="radio" name="theme" value="light" ${this.currentTheme === 'light' ? 'checked' : ''}>
                                <span>☀️ Light Mode</span>
                            </label>
                            <label class="theme-option">
                                <input type="radio" name="theme" value="dark" ${this.currentTheme === 'dark' ? 'checked' : ''}>
                                <span>🌙 Dark Mode</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content = `
                ${type === 'music' ? 'SoundCloud Widget Coming Soon' : ''}
                ${type === 'ai' ? 'ChatGPT Integration Coming Soon' : ''}
                ${type === 'market' ? 'Crypto Prices Coming Soon' : ''}
            `;
        }

        module.innerHTML = `
            <div class="module-header">
                <div class="module-title">${titles[type]}</div>
                <button class="module-close">×</button>
            </div>
            <div class="module-content">
                ${content}
            </div>
        `;

        this.container.appendChild(module);

        // Setup close button
        const closeButton = module.querySelector('.module-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            module.remove();
        });

        // Setup theme switcher if it's a settings module
        if (type === 'settings') {
            const themeInputs = module.querySelectorAll('input[name="theme"]');
            themeInputs.forEach(input => {
                input.addEventListener('change', async (e) => {
                    const newTheme = e.target.value;
                    await this.setTheme(newTheme);
                });
            });
        }

        this.setupModuleDragging(module);
    }

    async setTheme(theme) {
        try {
            this.currentTheme = theme;
            this.applyTheme(theme);
            localStorage.setItem('theme', theme);

            // Save theme to user profile if logged in
            const walletAddress = SessionManager.getWalletAddress();
            if (walletAddress) {
                await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                    method: 'POST',
                    body: JSON.stringify({
                        walletAddress,
                        theme
                    })
                });
            }

            // Show success message
            ErrorHandler.showSuccess('Theme updated successfully!', this.container);
        } catch (error) {
            console.error('Error setting theme:', error);
            ErrorHandler.showError('Failed to update theme', this.container);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    setupModuleDragging(module) {
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let xOffset = 0;
        let yOffset = 0;
        let isDragging = false;

        const handleMouseDown = (e) => {
            if (e.target.classList.contains('module-close')) return;

            const rect = module.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;

            if (e.target === module || module.contains(e.target)) {
                isDragging = true;
                module.classList.add('dragging');
            }
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Keep module within viewport bounds
            currentX = Math.max(0, Math.min(currentX, window.innerWidth - module.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, window.innerHeight - module.offsetHeight));

            module.style.transform = `translate(${currentX}px, ${currentY}px)`;
        };

        const handleMouseUp = () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            module.classList.remove('dragging');
        };

        module.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModuleHandler();
});

// Additional styles for the modules
const additionalStyles = `
.settings-section {
    padding: 10px;
}

.settings-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-primary);
}

.theme-switcher {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.theme-option:hover {
    background-color: var(--bg-primary);
}

.settings-content {
    width: 100%;
}

.module {
    position: absolute;
    background: var(--bg-secondary);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-width: 300px;
    max-width: 500px;
    overflow: hidden;
    cursor: move;
}

.module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
}

.module-title {
    font-weight: 600;
    color: var(--text-primary);
}

.module-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 18px;
    padding: 4px 8px;
    border-radius: 4px;
}

.module-close:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
}

.module-content {
    padding: 16px;
    color: var(--text-primary);
}

.module.dragging {
    opacity: 0.8;
    cursor: grabbing;
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);