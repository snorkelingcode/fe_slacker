class ModuleHandler {
    constructor() {
        console.log('ModuleHandler constructor called');
        this.draggedModule = null;
        this.isDragging = false;
        this.modules = new Map(); // Track active modules
        
        // Ensure these are set after DOM is loaded
        this.addButton = null;
        this.modal = null;
        this.container = null;

        // Load saved theme immediately
        this.currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // Defer event listener setup
        this.setupDOMEventListeners();
    }

    setupDOMEventListeners() {
        console.log('setupDOMEventListeners called');
        // Immediate check
        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');
        this.container = document.getElementById('moduleContainer');

        console.log('Initial elements:', {
            addButton: this.addButton,
            modal: this.modal,
            container: this.container
        });

        // Use multiple event listeners to ensure capture
        if (this.addButton) {
            // Multiple ways to attach listeners
            this.addButton.addEventListener('click', this.handleAddButtonClick.bind(this));
            this.addButton.onclick = this.handleAddButtonClick.bind(this);
        }

        // Fallback to DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded event fired');
            
            // Recheck elements
            this.addButton = document.getElementById('addModuleButton');
            this.modal = document.getElementById('moduleModal');
            this.container = document.getElementById('moduleContainer');

            console.log('DOMContentLoaded elements:', {
                addButton: this.addButton,
                modal: this.modal,
                container: this.container
            });

            // Setup event listeners again
            this.setupEventListeners();
        });

        // Fallback to window load
        window.addEventListener('load', () => {
            console.log('Window load event fired');
            
            // Recheck elements
            this.addButton = document.getElementById('addModuleButton');
            this.modal = document.getElementById('moduleModal');
            this.container = document.getElementById('moduleContainer');

            console.log('Window load elements:', {
                addButton: this.addButton,
                modal: this.modal,
                container: this.container
            });

            // Setup event listeners again
            this.setupEventListeners();
        });
    }

    handleAddButtonClick(e) {
        console.log('Add button clicked!', {
            event: e,
            addButton: this.addButton,
            modal: this.modal
        });

        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (this.modal) {
            this.modal.classList.toggle('active');
            console.log('Modal toggle attempted');
        } else {
            console.error('Modal element not found!');
        }
    }

    setupEventListeners() {
        console.log('setupEventListeners called');

        // Recheck elements
        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');

        if (this.addButton) {
            console.log('Setting up add button listeners');
            // Remove existing listeners
            const oldAddButton = this.addButton;
            const newAddButton = oldAddButton.cloneNode(true);
            oldAddButton.parentNode.replaceChild(newAddButton, oldAddButton);
            this.addButton = newAddButton;

            // Multiple listener approaches
            this.addButton.addEventListener('click', this.handleAddButtonClick.bind(this));
            this.addButton.onclick = this.handleAddButtonClick.bind(this);
        } else {
            console.error('Add button not found during setupEventListeners');
        }

        // Module option listeners
        document.querySelectorAll('.module-option').forEach(option => {
            console.log('Setting up module option listener');
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Module option clicked:', option.dataset.type);
                this.createModule(option.dataset.type);
                if (this.modal) {
                    this.modal.classList.remove('active');
                }
            });
        });
    }

    saveModuleState() {
        const moduleStates = Array.from(this.modules.entries()).map(([id, module]) => {
            const rect = module.getBoundingClientRect();
            return {
                id,
                type: module.dataset.type,
                position: {
                    x: rect.left,
                    y: rect.top
                }
            };
        });
        localStorage.setItem('moduleStates', JSON.stringify(moduleStates));
    }

    loadSavedModules() {
        try {
            const savedStates = JSON.parse(localStorage.getItem('moduleStates') || '[]');
            
            // Clear existing modules first to prevent duplicates
            this.container.innerHTML = '';
            this.modules.clear();

            savedStates.forEach(state => {
                // Check if this module doesn't already exist
                if (!this.modules.has(state.id)) {
                    this.createModule(state.type, 
                        { x: state.position.x, y: state.position.y }, 
                        state.id
                    );
                }
            });
        } catch (error) {
            console.error('Error loading saved modules:', error);
        }
    }

    async initializeTheme() {
        try {
            const walletAddress = SessionManager.getWalletAddress();
            if (walletAddress) {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/profile/${walletAddress}`);
                if (response && response.theme) {
                    this.currentTheme = response.theme;
                    localStorage.setItem('theme', response.theme);
                    this.applyTheme(response.theme);
                }
            }
        } catch (error) {
            console.error('Error loading user theme:', error);
        }
    }

    createModule(type, position = null, id = null) {
        const moduleId = id || `module-${Date.now()}`;
        
        // Check if module already exists
        if (this.modules.has(moduleId)) {
            console.log(`Module ${moduleId} already exists. Skipping creation.`);
            return null;
        }

        const module = document.createElement('div');
        module.className = 'module';
        module.dataset.type = type;
        module.id = moduleId;

        // Set position
        if (position) {
            module.style.transform = `translate(${position.x}px, ${position.y}px)`;
        } else {
            const initialX = Math.random() * (window.innerWidth - 420);
            const initialY = Math.random() * (window.innerHeight - 200);
            module.style.transform = `translate(${initialX}px, ${initialY}px)`;
        }

        let content = '';
        let moduleTitle = '';

        switch (type) {
            case 'settings':
                moduleTitle = 'Settings';
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
                break;
            case 'music':
                moduleTitle = 'Music Player';
                content = 'SoundCloud Widget Coming Soon';
                break;
            case 'ai':
                moduleTitle = 'AI Chat';
                content = `
                    <div class="ai-chat-container">
                        <div class="ai-messages"></div>
                        <div class="ai-input-area">
                            <input type="text" class="ai-message-input" placeholder="Ask me anything...">
                            <button class="ai-send-btn">Send</button>
                        </div>
                    </div>
                `;
                
                // Slight delay to ensure DOM is ready
                setTimeout(() => {
                    const messagesContainer = module.querySelector('.ai-messages');
                    const messageInput = module.querySelector('.ai-message-input');
                    const sendButton = module.querySelector('.ai-send-btn');
    
                    const addMessage = (message, sender) => {
                        const messageEl = document.createElement('div');
                        messageEl.classList.add('ai-message', sender);
                        messageEl.textContent = message;
                        messagesContainer.appendChild(messageEl);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    };
    
                    const sendMessage = async () => {
                        const message = messageInput.value.trim();
                        if (!message) return;
                    
                        // Show user message
                        addMessage(message, 'user-message');
                        messageInput.value = '';
                    
                        try {
                            // Prevent dragging during API call
                            module.classList.remove('dragging');
                    
                            // Disable input during request
                            messageInput.disabled = true;
                            sendButton.disabled = true;
                    
                            // Send message to backend
                            const response = await makeApiCall(API_ENDPOINTS.aiChat, {
                                method: 'POST',
                                body: JSON.stringify({ 
                                    walletAddress: SessionManager.getWalletAddress(),
                                    message 
                                })
                            });
                    
                            // Show AI response
                            addMessage(response.message, 'ai-message');
                        } catch (error) {
                            addMessage('Sorry, I couldn\'t process your request.', 'ai-message');
                            console.error('AI Chat Error:', error);
                        } finally {
                            messageInput.disabled = false;
                            sendButton.disabled = false;
                            messageInput.focus();
                        }
                    };
    
                    // Send on button click
                    sendButton.addEventListener('click', sendMessage);
    
                    // Send on Enter key
                    messageInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                }, 100);
                break;
            case 'market':
                moduleTitle = 'Crypto Market';
                content = 'Crypto Prices Coming Soon';
                break;
            default:
                moduleTitle = 'Module';
                content = 'Content Coming Soon';
        }

        module.innerHTML = `
            <div class="module-header">
                <div class="module-title">${moduleTitle}</div>
                <button class="module-close">×</button>
            </div>
            <div class="module-content">
                ${content}
            </div>
        `;

        this.container.appendChild(module);
        this.modules.set(moduleId, module);

        // Setup close button
        const closeButton = module.querySelector('.module-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modules.delete(moduleId);
            module.remove();
            this.saveModuleState();
        });

        // Setup theme switcher if it's a settings module
        if (type === 'settings') {
            const themeInputs = module.querySelectorAll('input[name="theme"]');
            themeInputs.forEach(input => {
                input.addEventListener('change', async (e) => {
                    await this.setTheme(e.target.value);
                });
            });
        }

        this.setupModuleDragging(module);
        this.saveModuleState();
        return module;
    }

    async setTheme(theme) {
        try {
            this.currentTheme = theme;
            localStorage.setItem('theme', theme);
            this.applyTheme(theme);

            const walletAddress = SessionManager.getWalletAddress();
            if (walletAddress) {
                try {
                    const userResponse = await makeApiCall(`${API_ENDPOINTS.users}/profile/${walletAddress}`);
                    await makeApiCall(`${API_ENDPOINTS.users}/profile`, {
                        method: 'POST',
                        body: JSON.stringify({
                            walletAddress,
                            username: userResponse.username,
                            bio: userResponse.bio || 'New to Slacker',
                            theme: theme,
                            profilePicture: userResponse.profilePicture,
                            bannerPicture: userResponse.bannerPicture
                        })
                    });
                    ErrorHandler.showSuccess('Theme updated successfully!', this.container);
                } catch (error) {
                    console.error('Error updating theme on server:', error);
                    // Still keep the theme locally even if server update fails
                }
            }
        } catch (error) {
            console.error('Error setting theme:', error);
            ErrorHandler.showError('Failed to update theme', this.container);

            // Revert theme in localStorage if update fails
            const previousTheme = localStorage.getItem('theme') || 'light';
            this.applyTheme(previousTheme);
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
            this.saveModuleState();
        };

        module.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
}

// Additional styles for modules
const additionalStyles = `
.module-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.module-option:hover {
    background-color: var(--bg-accent);
}

.module-option span {
    margin-right: 10px;
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const moduleHandler = new ModuleHandler();
    await moduleHandler.initializeTheme();
});