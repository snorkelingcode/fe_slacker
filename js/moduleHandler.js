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

        // Initialize theme based on user profile or localStorage
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
        
        // Set initial position with some randomness to prevent stacking
        const initialX = Math.random() * (window.innerWidth - 420); // Account for module width
        const initialY = Math.random() * (window.innerHeight - 200); // Account for module height
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
            const currentTheme = window.themeHandler.getCurrentTheme();
            content = `
                <div class="settings-content">
                    <div class="settings-section">
                        <h3 class="settings-title">Theme</h3>
                        <div class="theme-switcher">
                            <label class="theme-option">
                                <input type="radio" name="theme" value="light" ${currentTheme === 'light' ? 'checked' : ''}>
                                <span>☀️ Light Mode</span>
                            </label>
                            <label class="theme-option">
                                <input type="radio" name="theme" value="dark" ${currentTheme === 'dark' ? 'checked' : ''}>
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
            setTimeout(() => {
                const themeInputs = document.querySelectorAll('input[name="theme"]');
                themeInputs.forEach(input => {
                    input.addEventListener('change', async (e) => {
                        const newTheme = e.target.value;
                        await window.themeHandler.setTheme(newTheme);
                    });
                });
            }, 0);
        }

        this.setupModuleDragging(module);
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

        // Add event listeners to the module
        module.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModuleHandler();
});