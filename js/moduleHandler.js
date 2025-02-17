class ModuleHandler {
    constructor() {
        // Ensure singleton pattern
        if (ModuleHandler.instance) {
            return ModuleHandler.instance;
        }
        ModuleHandler.instance = this;

        // Reset state
        this.draggedModule = null;
        this.isDragging = false;
        this.modules = new Map();
        
        // Ensure these are set after DOM is loaded
        this.addButton = null;
        this.modal = null;
        this.container = null;

        // Load saved theme immediately
        this.currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // Initialize only if DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeModuleSystem());
        } else {
            this.initializeModuleSystem();
        }
    }

    destroy() {
        if (this.addButton) {
            this.addButton.removeEventListener('click', this.handleAddButtonClick);
        }
        
        // Remove all module option click listeners
        if (this.modal) {
            this.modal.querySelectorAll('.module-option').forEach(option => {
                option.replaceWith(option.cloneNode(true));
            });
        }
        
        this.saveModuleState();
    }

    initializeModuleSystem() {
        console.log('Initializing Module System');
        
        // Ensure module container exists on all pages
        this.ensureModuleContainer();
        
        // Find essential elements
        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');
        this.container = document.getElementById('moduleContainer');

        // Validate all required elements exist
        if (!this.addButton || !this.modal || !this.container) {
            console.warn('Module system elements not fully present', {
                addButton: !!this.addButton,
                modal: !!this.modal,
                container: !!this.container
            });
            this.createMissingElements();
        }

        // Clear existing listeners by cloning and replacing
        const newAddButton = this.addButton.cloneNode(true);
        this.addButton.parentNode.replaceChild(newAddButton, this.addButton);
        this.addButton = newAddButton;

        // Setup add button click handler with proper binding
        this.handleAddButtonClick = this.handleAddButtonClick.bind(this);
        this.addButton.addEventListener('click', this.handleAddButtonClick);

        // Clear existing module option listeners and set up new ones
        this.modal.querySelectorAll('.module-option').forEach(option => {
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            newOption.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createModuleHandler(e);
            });
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (this.modal && 
                !this.modal.contains(e.target) && 
                !this.addButton.contains(e.target)) {
                this.modal.classList.remove('active');
            }
        });

        // Load saved modules
        this.loadSavedModules();
    }

    createModuleHandler(e) {
        const moduleType = e.currentTarget.dataset.type;
        
        // Check if a module of this type already exists
        const existingModule = Array.from(this.modules.values()).find(
            module => module.dataset.type === moduleType
        );

        if (existingModule) {
            // If module already exists, just bring it to the front
            existingModule.style.zIndex = '1001';
            this.modal.classList.remove('active');
            return;
        }

        // If no module exists, create a new one
        this.createModule(moduleType);
        this.modal.classList.remove('active');
    }

    handleAddButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.modal) {
            this.modal.classList.toggle('active');
        }
    }

    saveModuleState() {
        const moduleStates = Array.from(this.modules.entries()).map(([id, module]) => {
            const rect = module.getBoundingClientRect();
            const isExpanded = module.classList.contains('module-expanded');
            return {
                id,
                type: module.dataset.type,
                position: {
                    x: rect.left,
                    y: rect.top
                },
                isExpanded
            };
        });
        localStorage.setItem('moduleStates', JSON.stringify(moduleStates));
    }

    loadSavedModules() {
        try {
            const savedStates = JSON.parse(localStorage.getItem('moduleStates') || '[]');
            savedStates.forEach(moduleState => {
                const module = this.createModule(
                    moduleState.type,
                    moduleState.position,
                    moduleState.id
                );
                if (module && moduleState.isExpanded) {
                    this.toggleModuleSize(module);
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
        
        if (this.modules.has(moduleId)) {
            console.log(`Module ${moduleId} already exists. Skipping creation.`);
            return null;
        }

        const module = document.createElement('div');
        module.className = 'module';
        module.dataset.type = type;
        module.id = moduleId;

        // Set position with mobile-aware positioning
        if (position) {
            module.style.transform = `translate(${position.x}px, ${position.y}px)`;
        } else {
            // More conservative initial positioning for mobile
            const isMobile = window.innerWidth <= 768;
            const maxWidth = isMobile ? window.innerWidth - 40 : window.innerWidth - 420;
            const maxHeight = isMobile ? window.innerHeight - 100 : window.innerHeight - 200;
            const initialX = Math.min(Math.random() * maxWidth, maxWidth - 20);
            const initialY = Math.min(Math.random() * maxHeight, maxHeight - 20);
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

        // Setup AI chat if it's an AI module
        if (type === 'ai') {
            this.setupAIChat(module);
        }

        this.setupModuleDragging(module);
        this.saveModuleState();
        return module;
    }

    setupAIChat(module) {
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
        
            addMessage(message, 'user-message');
            messageInput.value = '';
        
            try {
                module.classList.remove('dragging');
                messageInput.disabled = true;
                sendButton.disabled = true;
        
                const response = await makeApiCall(API_ENDPOINTS.aiChat, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        walletAddress: SessionManager.getWalletAddress(),
                        message 
                    })
                });
        
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

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    setupModuleDragging(module) {
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let isDragging = false;
        let lastTap = 0;
        let dragStartTime = 0;

        const getEventPosition = (e) => {
            if (e.touches && e.touches.length > 0) {
                return {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            }
            return {
                clientX: e.clientX,
                clientY: e.clientY
            };
        };

        const handleStart = (e) => {
            // Prevent dragging if clicking on close button or input
            if (e.target.closest('.module-close') || 
                e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA') {
                return;
            }

            const position = getEventPosition(e);
            const rect = module.getBoundingClientRect();
            initialX = position.clientX - rect.left;
            initialY = position.clientY - rect.top;

            dragStartTime = Date.now();
            isDragging = true;
            module.classList.add('dragging');

            // Handle double-tap for mobile
            if (e.type === 'touchstart') {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    // Double tap detected
                    this.toggleModuleSize(module);
                    e.preventDefault();
                    return;
                }
                lastTap = currentTime;
            }
        };

        const handleMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            const position = getEventPosition(e);
            
            currentX = position.clientX - initialX;
            currentY = position.clientY - initialY;

            // Keep module within viewport bounds
            const isMobile = window.innerWidth <= 768;
            const maxWidth = isMobile ? window.innerWidth - 20 : window.innerWidth - module.offsetWidth;
            const maxHeight = window.innerHeight - (isMobile ? 60 : module.offsetHeight);

            currentX = Math.max(10, Math.min(currentX, maxWidth - 10));
            currentY = Math.max(10, Math.min(currentY, maxHeight - 10));

            // Use translate3d for better performance
            module.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        };

        const handleEnd = () => {
            if (!isDragging) return;

            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            module.classList.remove('dragging');
            
            // Only save if it was a genuine drag (not a quick tap)
            if (Date.now() - dragStartTime > 100) {
                this.saveModuleState();
            }
        };

        // Use pointer events for better cross-device support
        module.addEventListener('pointerdown', handleStart, { passive: false });
        document.addEventListener('pointermove', handleMove, { passive: false });
        document.addEventListener('pointerup', handleEnd);
        document.addEventListener('pointercancel', handleEnd);

        // Prevent default touch behaviors
        module.addEventListener('touchstart', (e) => {
            if (e.target.closest('.module-close')) return;
            e.preventDefault();
        }, { passive: false });
    }

    toggleModuleSize(module) {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return; // Only toggle on mobile

        const isExpanded = module.classList.contains('module-expanded');
        
        if (isExpanded) {
            module.classList.remove('module-expanded');
            module.style.width = '';
            module.style.height = '';
        } else {
            module.classList.add('module-expanded');
            module.style.width = '95vw';
            module.style.height = '80vh';
            
            // Center the expanded module
            const rect = module.getBoundingClientRect();
            const centerX = (window.innerWidth - rect.width) / 2;
            const centerY = (window.innerHeight - rect.height) / 2;
            module.style.transform = `translate(${centerX}px, ${centerY}px)`;
        }
        
        this.saveModuleState();
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
                }
            }
        } catch (error) {
            console.error('Error setting theme:', error);
            ErrorHandler.showError('Failed to update theme', this.container);
            const previousTheme = localStorage.getItem('theme') || 'light';
            this.applyTheme(previousTheme);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

        // Initialize singleton instance
        ModuleHandler.instance = null;

        // Global initialization function
        window.initializeModuleHandler = () => {
            if (!window.moduleHandlerInstance) {
                window.moduleHandlerInstance = new ModuleHandler();
            }
            return window.moduleHandlerInstance;
        };

        // Additional styles for mobile responsiveness
        const additionalStyles = `
        .module {
            max-width: 95vw;
            max-height: 80vh;
            width: 350px; /* Slightly wider desktop modules */
            transition: transform 0.2s ease, width 0.3s ease, height 0.3s ease;
            will-change: transform; /* Hint to browser for performance */
        }
        
        @media (max-width: 768px) {
            .module {
                width: 85vw;
                height: auto;
                min-height: 200px;
            }
        
            .module-expanded {
                width: 95vw !important;
                height: 80vh !important;
                z-index: 1002;
            }
        
            .add-module-btn {
                bottom: 30px;
                right: 30px;
                left: auto;
                width: 60px;
                height: 60px;
            }
        
            .module-modal {
                bottom: 100px;
                right: 30px;
                left: auto;
                max-height: 60vh;
                overflow-y: auto;
            }
        }
        `;
        
        // Add the styles to the document
        const styleSheet = document.createElement('style');
        styleSheet.textContent = additionalStyles;
        document.head.appendChild(styleSheet);
        
        // Rest of the code remains the same...
        
        // Initialize module handler
        document.addEventListener('DOMContentLoaded', () => {
            if (window.moduleHandlerInstance) {
                window.moduleHandlerInstance.destroy();
            }
            window.moduleHandlerInstance = new ModuleHandler();
        });