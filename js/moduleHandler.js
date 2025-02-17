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

    // New method to ensure module container exists
    ensureModuleContainer() {
        // Check if module container exists on the current page
        let moduleContainer = document.getElementById('moduleContainer');
        if (!moduleContainer) {
            // Create module container if it doesn't exist
            moduleContainer = document.createElement('div');
            moduleContainer.id = 'moduleContainer';
            moduleContainer.className = 'module-container';
            
            // Append to main or body
            const mainContent = document.querySelector('main') || document.body;
            mainContent.appendChild(moduleContainer);
        }

        // Ensure add module button exists
        let addModuleButton = document.getElementById('addModuleButton');
        if (!addModuleButton) {
            addModuleButton = document.createElement('button');
            addModuleButton.id = 'addModuleButton';
            addModuleButton.className = 'add-module-btn';
            addModuleButton.innerHTML = '<span>+</span>';
            document.body.appendChild(addModuleButton);
        }

        // Ensure module modal exists
        let moduleModal = document.getElementById('moduleModal');
        if (!moduleModal) {
            moduleModal = document.createElement('div');
            moduleModal.id = 'moduleModal';
            moduleModal.className = 'module-modal';
            moduleModal.innerHTML = `
                <button class="module-option" data-type="music">
                    <span>🎵</span> Music
                </button>
                <button class="module-option" data-type="ai">
                    <span>🤖</span> AI
                </button>
                <button class="module-option" data-type="market">
                    <span>📈</span> Market
                </button>
                <button class="module-option" data-type="settings">
                    <span>⚙️</span> Settings
                </button>
            `;
            document.body.appendChild(moduleModal);
        }
    }

    createMissingElements() {
        // If any core elements are missing, recreate them
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'moduleContainer';
            this.container.className = 'module-container';
            document.body.appendChild(this.container);
        }

        if (!this.addButton) {
            this.addButton = document.createElement('button');
            this.addButton.id = 'addModuleButton';
            this.addButton.className = 'add-module-btn';
            this.addButton.innerHTML = '<span>+</span>';
            document.body.appendChild(this.addButton);
        }

        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.id = 'moduleModal';
            this.modal.className = 'module-modal';
            this.modal.innerHTML = `
                <button class="module-option" data-type="music">
                    <span>🎵</span> Music
                </button>
                <button class="module-option" data-type="ai">
                    <span>🤖</span> AI
                </button>
                <button class="module-option" data-type="market">
                    <span>📈</span> Market
                </button>
                <button class="module-option" data-type="settings">
                    <span>⚙️</span> Settings
                </button>
            `;
            document.body.appendChild(this.modal);
        }
    }

    handleAddButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.modal) {
            this.modal.classList.toggle('active');
        }
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
            module.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
        } else {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // Center on mobile
                const moduleWidth = 300; // Approximate module width
                const moduleHeight = 400; // Approximate module height
                const centerX = (window.innerWidth - moduleWidth) / 2;
                const centerY = (window.innerHeight - moduleHeight) / 2;
                module.style.transform = `translate3d(${centerX}px, ${centerY}px, 0)`;
            } else {
                // Random positioning with more constraints on desktop
                const maxWidth = window.innerWidth - 400;
                const maxHeight = window.innerHeight - 400;
                const initialX = Math.max(50, Math.min(Math.random() * maxWidth, maxWidth - 50));
                const initialY = Math.max(50, Math.min(Math.random() * maxHeight, maxHeight - 50));
                module.style.transform = `translate3d(${initialX}px, ${initialY}px, 0)`;
            }
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

    setupModuleDragging(module) {
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let isDragging = false;
        let lastTap = 0;
        let dragStartTime = 0;
        let startX = 0;
        let startY = 0;
    
        const getEventPosition = (e) => {
            const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
            return { clientX, clientY };
        };
    
        const handleStart = (e) => {
            // Prevent dragging if clicking on close button or input
            if (e.target.closest('.module-close') || 
                e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA') {
                return;
            }
    
            const { clientX, clientY } = getEventPosition(e);
            if (!clientX || !clientY) return;
    
            // Prevent text selection during drag
            e.preventDefault();
    
            // Get current transform
            const transform = window.getComputedStyle(module).transform;
            const matrix = new DOMMatrixReadOnly(transform);
            
            // Calculate initial positions
            startX = clientX;
            startY = clientY;
            initialX = matrix.e;
            initialY = matrix.f;
    
            dragStartTime = Date.now();
            isDragging = true;
            module.classList.add('dragging');
    
            // Capture pointer for smooth dragging
            module.setPointerCapture(e.pointerId);
    
            // Handle double-tap for mobile
            if (e.type === 'touchstart') {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                    // Double tap detected
                    this.toggleModuleSize(module);
                    return;
                }
                lastTap = currentTime;
            }
        };
    
        const handleMove = (e) => {
            if (!isDragging) return;
    
            const { clientX, clientY } = getEventPosition(e);
            if (!clientX || !clientY) return;
    
            // Prevent default to stop text selection
            e.preventDefault();
    
            // Calculate delta
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
    
            // Update position
            currentX = initialX + deltaX;
            currentY = initialY + deltaY;
    
            // Keep module within viewport bounds
            const isMobile = window.innerWidth <= 768;
            const maxWidth = isMobile ? window.innerWidth - 20 : window.innerWidth - module.offsetWidth;
            const maxHeight = window.innerHeight - (isMobile ? 60 : module.offsetHeight);
    
            currentX = Math.max(10, Math.min(currentX, maxWidth - 10));
            currentY = Math.max(10, Math.min(currentY, maxHeight - 10));
    
            // Smooth transform with hardware acceleration
            module.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        };
    
        const handleEnd = (e) => {
            if (!isDragging) return;
    
            // Release pointer capture
            module.releasePointerCapture(e.pointerId);
    
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
            module.style.transform = `translate3d(${centerX}px, ${centerY}px, 0)`;
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

// Additional styles to support the changes
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

.module-option span {
    margin-right: 10px;
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize module handler
document.addEventListener('DOMContentLoaded', async () => {
    if (window.moduleHandlerInstance) {
        window.moduleHandlerInstance.destroy();
    }
    window.moduleHandlerInstance = new ModuleHandler();
    
    // Try to initialize theme
    try {
        if (window.moduleHandlerInstance.initializeTheme) {
            await window.moduleHandlerInstance.initializeTheme();
        }
    } catch (error) {
        console.error('Error initializing theme:', error);
    }
});