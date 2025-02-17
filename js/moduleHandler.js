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
    
        // Positioning logic
        const isMobile = window.innerWidth <= 768;
        
        if (position) {
            // Use exact provided position (works best for desktop)
            module.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
        } else {
            // Different positioning for mobile and desktop
            if (isMobile) {
                // Center on mobile
                const moduleWidth = 300; // Approximate module width
                const moduleHeight = 400; // Approximate module height
                const centerX = (window.innerWidth - moduleWidth) / 2;
                const centerY = (window.innerHeight - moduleHeight) / 2;
                module.style.transform = `translate3d(${centerX}px, ${centerY}px, 0)`;
            } else {
                // Controlled desktop positioning
                const defaultPositions = {
                    'settings': { x: 20, y: 80 },
                    'ai': { x: window.innerWidth - 370, y: 80 },
                    'market': { x: 20, y: window.innerHeight - 500 },
                    'music': { x: window.innerWidth - 370, y: window.innerHeight - 500 }
                };
    
                const defaultPos = defaultPositions[type] || { 
                    x: Math.max(50, Math.min(Math.random() * (window.innerWidth - 400), window.innerWidth - 400)),
                    y: Math.max(50, Math.min(Math.random() * (window.innerHeight - 400), window.innerHeight - 400))
                };
    
                module.style.transform = `translate3d(${defaultPos.x}px, ${defaultPos.y}px, 0)`;
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
                    moduleTitle = 'Music Library';
                    content = `
                        <div class="music-module-container">
                            <div class="music-header">
                                <h3>Music Library</h3>
                                <div class="music-search-container">
                                    <input type="text" class="music-search-input" placeholder="Search songs...">
                                    <input type="file" class="music-upload-input" accept="audio/*" hidden>
                                    <button class="music-upload-btn">Upload</button>
                                </div>
                                <div class="music-view-selector">
                                    <button class="view-liked-btn active">Liked Songs</button>
                                    <button class="view-recent-btn">Recent Uploads</button>
                                </div>
                            </div>
                
                            <div class="music-lists">
                                <div class="liked-songs active">
                                    <h4>Liked Songs</h4>
                                    <div class="songs-list empty-list">
                                        No liked songs yet
                                    </div>
                                </div>
                                
                                <div class="recent-uploads">
                                    <h4>Recent Uploads</h4>
                                    <div class="songs-list empty-list">
                                        No recent uploads yet
                                    </div>
                                </div>
                            </div>
                
                            <div class="music-player-container" style="display: none;">
                                <div class="current-track-info">
                                    <span class="track-title">No track selected</span>
                                    <span class="track-artist">-</span>
                                </div>
                                <audio class="music-audio-player" preload="metadata"></audio>
                                
                                <div class="music-controls">
                                    <button class="prev-track-btn">⏮️</button>
                                    <button class="play-pause-btn">▶️</button>
                                    <button class="next-track-btn">⏭️</button>
                                    
                                    <input type="range" class="volume-slider" min="0" max="100" value="50">
                                    
                                    <div class="track-progress-container">
                                        <span class="current-time">0:00</span>
                                        <input type="range" class="track-progress-slider" min="0" max="100" value="0">
                                        <span class="total-time">0:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // After creating the module, set up music functionality
                    setTimeout(() => {
                        const musicModule = new MusicModule(module);
                    }, 0);
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
                
                // After creating the module, set up the chat functionality
                setTimeout(() => {
                    if (typeof window.setupAIChat === 'function') {
                        window.setupAIChat(module);
                    } else {
                        console.error('AI Chat setup function not found. Make sure aiChat.js is loaded.');
                    }
                }, 0);
                break;
// In moduleHandler.js, within the createModule method's switch statement
case 'market':
    moduleTitle = 'Markets';
    content = `
        <div class="market-header">
            <h3>Crypto Markets</h3>
            <button class="refresh-btn">↻</button>
        </div>
        <div class="market-list">
            <div class="loading-spinner"></div>
        </div>
    `;

    // After module is created, set up the market functionality
    setTimeout(() => {
        const marketList = module.querySelector('.market-list');
        const refreshBtn = module.querySelector('.refresh-btn');

        const formatPrice = (price) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(price);
        };

        const formatChange = (change) => {
            if (change === null || change === undefined) return '0.00%';
            return change.toFixed(2) + '%';
        };

        const renderCryptoList = (data) => {
            if (!data?.data || !Array.isArray(data.data)) {
                throw new Error('Invalid data format received');
            }

            marketList.innerHTML = '';
            
            // Take top 5 cryptocurrencies
            const topCryptos = data.data.slice(0, 5);

            topCryptos.forEach(crypto => {
                if (!crypto?.quote?.USD) return; // Skip invalid entries
                
                const priceChange = crypto.quote.USD.percent_change_24h || 0;
                const changeClass = priceChange >= 0 ? 'positive-change' : 'negative-change';
                const changeIcon = priceChange >= 0 ? '↑' : '↓';

                const cryptoElement = document.createElement('div');
                cryptoElement.className = 'crypto-item';
                cryptoElement.innerHTML = `
                    <div class="crypto-info">
                        <span class="crypto-symbol">${crypto.symbol || 'N/A'}</span>
                        <span class="crypto-name">${crypto.name || 'Unknown'}</span>
                    </div>
                    <div class="crypto-price">
                        <span class="price-value">${formatPrice(crypto.quote.USD.price || 0)}</span>
                        <span class="price-change ${changeClass}">
                            ${changeIcon} ${formatChange(priceChange)}
                        </span>
                    </div>
                `;
                marketList.appendChild(cryptoElement);
            });
        };

        const showError = (message) => {
            marketList.innerHTML = `
                <div class="error-message">
                    ${message}
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            
            // Add retry button handler
            const retryBtn = marketList.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', fetchCryptoData);
            }
        };

        const fetchCryptoData = async () => {
            try {
                marketList.innerHTML = '<div class="loading-spinner"></div>';
                refreshBtn.classList.add('loading');

                const response = await makeApiCall(API_ENDPOINTS.crypto.top);
                
                if (!response || !response.data) {
                    throw new Error('Invalid response from server');
                }

                renderCryptoList(response);
            } catch (error) {
                console.error('Error fetching crypto data:', error);
                showError(error.message || 'Failed to load crypto prices');
            } finally {
                refreshBtn.classList.remove('loading');
            }
        };

        // Initial fetch
        fetchCryptoData();

        // Setup refresh button
        refreshBtn.addEventListener('click', fetchCryptoData);

        // Auto refresh every 5 minutes
        const refreshInterval = setInterval(fetchCryptoData, 5 * 60 * 1000);

        // Cleanup when module is closed
        module.addEventListener('remove', () => {
            clearInterval(refreshInterval);
            refreshBtn.removeEventListener('click', fetchCryptoData);
        });
    }, 0);
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
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
    
        const dragElement = module;
    
        // Prevent dragging on interactive elements
        const interactiveSelectors = [
            '.module-close', 
            'input', 
            'textarea', 
            'button', 
            '.theme-option', 
            '.ai-send-btn', 
            '.ai-message-input'
        ];
    
        const dragStart = (e) => {
            // Check if clicked on an interactive element
            if (interactiveSelectors.some(selector => e.target.closest(selector))) {
                return;
            }
    
            // Get the initial mouse or touch position
            initialX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            initialY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
            // Get current transform
            const transformMatrix = window.getComputedStyle(dragElement).transform;
            const matrix = new DOMMatrixReadOnly(transformMatrix);
            
            // Current position
            xOffset = matrix.e;
            yOffset = matrix.f;
    
            // Start dragging
            isDragging = true;
            dragElement.classList.add('dragging');
    
            // Prevent default to stop text selection
            e.preventDefault();
        };
    
        const drag = (e) => {
            if (!isDragging) return;
    
            // Prevent default to stop scrolling
            e.preventDefault();
    
            // Get current mouse or touch position
            const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    
            // Calculate the distance moved
            currentX = clientX - initialX + xOffset;
            currentY = clientY - initialY + yOffset;
    
            // Set the new position
            setTranslate(currentX, currentY, dragElement);
        };
    
        const dragEnd = () => {
            // Reset initial positions
            initialX = currentX;
            initialY = currentY;
    
            // Stop dragging
            isDragging = false;
            dragElement.classList.remove('dragging');
    
            // Save module state
            this.saveModuleState();
        };
    
        const setTranslate = (xPos, yPos, el) => {
            // Constrain movement within viewport
            const isMobile = window.innerWidth <= 768;
            const maxWidth = isMobile ? window.innerWidth - 20 : window.innerWidth - el.offsetWidth;
            const maxHeight = window.innerHeight - el.offsetHeight;
    
            // Constrain X and Y
            xPos = Math.max(0, Math.min(xPos, maxWidth));
            yPos = Math.max(0, Math.min(yPos, maxHeight));
    
            // Apply transform
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        };
    
        // Mouse events
        module.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    
        // Touch events
        module.addEventListener('touchstart', dragStart, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', dragEnd);
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
@media (max-width: 768px) {
    body {
        overflow-y: auto;
        position: static;
    }

    .module-modal {
        bottom: 100px;
        left: 230px; /* Changed from right to left */
        right: auto !important;
        max-height: 60vh;
        max-width: 120vh;
        overflow-y: auto;
    }

    .add-module-btn {
        bottom: 30px;
        right: 30px;
        left: auto !important;
        width: 60px;
        height: 60px;
        position: fixed;
        z-index: 1000;
    }

    .module-container {
        pointer-events: none;
    }

    .module {
        pointer-events: auto;
    }

    .module-content {
        touch-action: pan-y;
        overflow-y: auto;
        max-height: 70vh;
    }
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

class MusicModule {
    constructor(moduleElement) {
        this.moduleElement = moduleElement;
        this.likedSongs = [];
        this.recentUploads = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.fetchMusicData();
    }

    initializeElements() {
        this.uploadInput = this.moduleElement.querySelector('.music-upload-input');
        this.uploadBtn = this.moduleElement.querySelector('.music-upload-btn');
        this.searchInput = this.moduleElement.querySelector('.music-search-input');
        
        this.likedSongsContainer = this.moduleElement.querySelector('.liked-songs');
        this.recentUploadsContainer = this.moduleElement.querySelector('.recent-uploads');
        
        this.viewLikedBtn = this.moduleElement.querySelector('.view-liked-btn');
        this.viewRecentBtn = this.moduleElement.querySelector('.view-recent-btn');
        
        this.playerContainer = this.moduleElement.querySelector('.music-player-container');
        this.audioPlayer = this.moduleElement.querySelector('.music-audio-player');
        this.trackTitle = this.moduleElement.querySelector('.track-title');
        this.trackArtist = this.moduleElement.querySelector('.track-artist');
    }

    setupEventListeners() {
        // Upload button click to trigger file input
        this.uploadBtn.addEventListener('click', () => {
            this.uploadInput.click();
        });

        // File upload handler
        this.uploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.uploadMusic(file);
            }
        });

        // View selector buttons
        this.viewLikedBtn.addEventListener('click', () => this.switchView('liked'));
        this.viewRecentBtn.addEventListener('click', () => this.switchView('recent'));
    }

    switchView(viewType) {
        // Toggle active classes for buttons and lists
        this.viewLikedBtn.classList.toggle('active', viewType === 'liked');
        this.viewRecentBtn.classList.toggle('active', viewType === 'recent');
        
        this.likedSongsContainer.classList.toggle('active', viewType === 'liked');
        this.recentUploadsContainer.classList.toggle('active', viewType === 'recent');
    }

    async fetchMusicData() {
        try {
            // These API calls will depend on your backend implementation
            // const likedResponse = await makeApiCall(API_ENDPOINTS.music.liked);
            // const recentResponse = await makeApiCall(API_ENDPOINTS.music.recent);
            
            // For now, we'll use empty arrays
            this.likedSongs = [];
            this.recentUploads = [];
            
            this.renderSongLists();
        } catch (error) {
            console.error('Error fetching music data:', error);
            this.showErrorMessage('Failed to load music library');
        }
    }

    async uploadMusic(file) {
        try {
            // Use MediaHandler for file upload
            const mediaUrl = await MediaHandler.uploadFile(file, 'music');
            
            // Prepare song data
            const songData = {
                title: file.name,
                url: mediaUrl,
                uploadedAt: new Date().toISOString()
            };

            // Add to recent uploads
            this.recentUploads.unshift(songData);
            this.renderSongLists();
            
            // Show success message
            ErrorHandler.showSuccess('Music uploaded successfully!', this.moduleElement);
        } catch (error) {
            console.error('Music upload error:', error);
            ErrorHandler.showError('Failed to upload music', this.moduleElement);
        }
    }

    renderSongLists() {
        this.renderSongList(this.likedSongsContainer, this.likedSongs, 'liked');
        this.renderSongList(this.recentUploadsContainer, this.recentUploads, 'recent');
    }

    renderSongList(container, songs, type) {
        const songsList = container.querySelector('.songs-list');
        
        if (songs.length === 0) {
            songsList.innerHTML = `No ${type} songs yet`;
            songsList.classList.add('empty-list');
            return;
        }

        songsList.classList.remove('empty-list');
        songsList.innerHTML = songs.map((song, index) => `
            <div class="track-item" data-index="${index}" data-type="${type}">
                <div class="track-details">
                    <span class="track-title">${song.title}</span>
                    <span class="track-artist">${song.artist || 'Unknown Artist'}</span>
                </div>
                <div class="track-actions">
                    <button class="play-track-btn">▶️</button>
                    <button class="like-track-btn">❤️</button>
                </div>
            </div>
        `).join('');

        // Add event listeners to track items
        songsList.querySelectorAll('.track-item').forEach(item => {
            const playBtn = item.querySelector('.play-track-btn');
            const likeBtn = item.querySelector('.like-track-btn');

            playBtn.addEventListener('click', () => this.playTrack(item));
            likeBtn.addEventListener('click', () => this.toggleLike(item));
        });
    }

    playTrack(trackItem) {
        const type = trackItem.dataset.type;
        const index = trackItem.dataset.index;
        const songs = type === 'liked' ? this.likedSongs : this.recentUploads;
        const song = songs[index];

        // Show player container
        this.playerContainer.style.display = 'block';

        // Update track info
        this.trackTitle.textContent = song.title;
        this.trackArtist.textContent = song.artist || 'Unknown Artist';

        // Set audio source and play
        this.audioPlayer.src = song.url;
        this.audioPlayer.play();
    }

    toggleLike(trackItem) {
        const type = trackItem.dataset.type;
        const index = trackItem.dataset.index;
        const likeBtn = trackItem.querySelector('.like-track-btn');
        const songs = type === 'liked' ? this.likedSongs : this.recentUploads;
        const song = songs[index];

        // Toggle like button style
        likeBtn.classList.toggle('liked');

        // Add or remove from liked songs
        if (likeBtn.classList.contains('liked')) {
            this.likedSongs.push(song);
        } else {
            this.likedSongs = this.likedSongs.filter(s => s !== song);
        }

        // Re-render lists
        this.renderSongLists();
    }

    showErrorMessage(message) {
        ErrorHandler.showError(message, this.moduleElement);
    }
}

// Export the class if using modules, otherwise it will be global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicModule;
}