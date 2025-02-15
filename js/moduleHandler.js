class ModuleHandler {
    constructor() {
        this.draggedModule = null;
        this.isDragging = false;
        this.modules = new Map();
        this.currentPath = window.location.pathname;
        
        // Check if we should initialize
        if (!SessionManager.isConnected()) {
            console.log('No active session, skipping module initialization');
            return;
        }

        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');
        this.container = document.getElementById('moduleContainer');

        if (!this.container) {
            console.log('Module container not found, skipping initialization');
            return;
        }

        // Initial setup
        this.initializeUIElements();
        this.setupEventListeners();
        this.loadSavedModules();
    }

    initializeUIElements() {
        // Apply current theme
        this.currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    setupEventListeners() {
        if (!this.addButton || !this.modal) {
            console.error('Required UI elements not found');
            return;
        }

        // Add Module Button Click
        this.addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleModal();
        });

        // Module Options Click
        document.querySelectorAll('.module-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.createModule(option.dataset.type);
                this.toggleModal();
            });
        });

        // Close Modal on Outside Click
        document.addEventListener('click', (e) => {
            if (!this.modal.contains(e.target) && !this.addButton.contains(e.target)) {
                this.modal.classList.remove('active');
            }
        });

        // Save States Before Page Unload
        window.addEventListener('beforeunload', () => {
            this.saveModuleState();
        });
    }

    toggleModal() {
        this.modal.classList.toggle('active');
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
                },
                isDocked: module.dataset.isDocked === 'true',
                page: this.currentPath,
                settings: module.dataset.settings || '{}'
            };
        });

        const walletAddress = SessionManager.getWalletAddress();
        if (!walletAddress) return;

        // Save to localStorage
        localStorage.setItem(`moduleStates_${walletAddress}`, JSON.stringify(moduleStates));
        this.saveModulesToBackend(moduleStates);
    }

    async saveModulesToBackend(moduleStates) {
        try {
            const walletAddress = SessionManager.getWalletAddress();
            await makeApiCall(`${API_ENDPOINTS.users}/modules`, {
                method: 'POST',
                body: JSON.stringify({
                    walletAddress,
                    modules: moduleStates
                })
            });
        } catch (error) {
            console.error('Error saving modules to backend:', error);
        }
    }

    async loadSavedModules() {
        try {
            const walletAddress = SessionManager.getWalletAddress();
            if (!walletAddress) return;

            // First try loading from localStorage
            const localStates = localStorage.getItem(`moduleStates_${walletAddress}`);
            if (localStates) {
                JSON.parse(localStates).forEach(state => {
                    if (state.page === this.currentPath || state.isDocked) {
                        this.createModule(state.type, state.position, state.id, state.isDocked, state.settings);
                    }
                });
            }

            // Then try backend
            try {
                const response = await makeApiCall(`${API_ENDPOINTS.users}/modules/${walletAddress}`);
                if (response && response.modules) {
                    this.modules.forEach(module => module.remove());
                    this.modules.clear();

                    response.modules.forEach(state => {
                        if (state.page === this.currentPath || state.isDocked) {
                            this.createModule(state.type, state.position, state.id, state.isDocked, state.settings);
                        }
                    });

                    localStorage.setItem(`moduleStates_${walletAddress}`, JSON.stringify(response.modules));
                }
            } catch (error) {
                console.error('Error fetching modules from backend:', error);
            }
        } catch (error) {
            console.error('Error loading saved modules:', error);
        }
    }

    createModule(type, position = null, id = null, isDocked = false, settings = '{}') {
        const moduleId = id || `module-${Date.now()}`;
        const module = document.createElement('div');
        module.className = 'module';
        module.dataset.type = type;
        module.dataset.isDocked = isDocked.toString();
        module.dataset.settings = settings;
        module.id = moduleId;

        // Position module
        if (position) {
            module.style.transform = `translate(${position.x}px, ${position.y}px)`;
        } else {
            const initialX = Math.random() * (window.innerWidth - 420);
            const initialY = Math.random() * (window.innerHeight - 200);
            module.style.transform = `translate(${initialX}px, ${initialY}px)`;
        }

        let content = '';
        let moduleTitle = '';

        // Module content setup
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

        // Create module HTML
        module.innerHTML = `
            <div class="module-header">
                <button class="module-dock-btn" title="${isDocked ? 'Undock Module' : 'Dock Module'}">
                    ${isDocked ? '📌' : '📍'}
                </button>
                <div class="module-title">${moduleTitle}</div>
                <button class="module-close">×</button>
            </div>
            <div class="module-content">
                ${content}
            </div>
        `;

        // Add event listeners
        const dockButton = module.querySelector('.module-dock-btn');
        const closeButton = module.querySelector('.module-close');

        dockButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const newDocked = !isDocked;
            module.dataset.isDocked = newDocked.toString();
            dockButton.innerHTML = newDocked ? '📌' : '📍';
            dockButton.title = newDocked ? 'Undock Module' : 'Dock Module';
            this.saveModuleState();
        });

        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modules.delete(moduleId);
            module.remove();
            this.saveModuleState();
        });

        this.container.appendChild(module);
        this.modules.set(moduleId, module);
        this.setupModuleDragging(module);
        this.saveModuleState();

        // Setup additional functionality based on module type
        if (type === 'settings') {
            this.setupThemeSwitcher(module);
        } else if (type === 'ai') {
            this.setupAIChat(module);
        }

        return module;
    }

    setupModuleDragging(module) {
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        let isDragging = false;

        const handleMouseDown = (e) => {
            if (e.target.classList.contains('module-close') || 
                e.target.classList.contains('module-dock-btn')) return;

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

    setupThemeSwitcher(module) {
        const themeInputs = module.querySelectorAll('input[name="theme"]');
        themeInputs.forEach(input => {
            input.addEventListener('change', async (e) => {
                await window.themeHandler.setTheme(e.target.value);
            });
        });
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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager.isConnected()) {
        console.log('Initializing ModuleHandler...');
        window.moduleHandler = new ModuleHandler();
    }
});