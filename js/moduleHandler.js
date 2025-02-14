class ModuleHandler {
    constructor() {
        this.modules = [];
        this.draggedModule = null;
        this.initialX = 0;
        this.initialY = 0;
        this.currentX = 0;
        this.currentY = 0;

        this.addButton = document.getElementById('addModuleButton');
        this.modal = document.getElementById('moduleModal');
        this.container = document.getElementById('moduleContainer');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add button click handler
        this.addButton.addEventListener('click', () => {
            this.modal.classList.toggle('active');
        });

        // Module option click handlers
        document.querySelectorAll('.module-option').forEach(option => {
            option.addEventListener('click', () => {
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
        module.style.top = '0px';
        module.style.left = '0px';

        const titles = {
            music: 'Music Player',
            ai: 'AI Chat',
            market: 'Crypto Market',
            settings: 'Settings'
        };

        module.innerHTML = `
            <div class="module-header">
                <div class="module-title">${titles[type]}</div>
                <button class="module-close">×</button>
            </div>
            <div class="module-content">
                ${type === 'music' ? 'SoundCloud Widget Coming Soon' : ''}
                ${type === 'ai' ? 'ChatGPT Integration Coming Soon' : ''}
                ${type === 'market' ? 'Crypto Prices Coming Soon' : ''}
                ${type === 'settings' ? 'Theme Settings Coming Soon' : ''}
            </div>
        `;

        this.setupModuleDragging(module);
        this.container.appendChild(module);

        // Setup close button - only handle close button clicks
        const closeButton = module.querySelector('.module-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            module.remove();
        });
    }

    setupModuleDragging(module) {
        const handleMouseDown = (e) => {
            // Only start dragging if it's not the close button
            if (e.target.classList.contains('module-close')) {
                return;
            }

            this.draggedModule = module;
            module.classList.add('dragging');

            const rect = module.getBoundingClientRect();
            this.initialX = e.clientX - rect.left;
            this.initialY = e.clientY - rect.top;

            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragEnd);
        };

        // Add mousedown event listener to the module header only
        const moduleHeader = module.querySelector('.module-header');
        moduleHeader.addEventListener('mousedown', handleMouseDown);
    }

    handleDrag = (e) => {
        if (!this.draggedModule) return;

        e.preventDefault();
        
        this.currentX = e.clientX - this.initialX;
        this.currentY = e.clientY - this.initialY;

        // Keep module within viewport
        this.currentX = Math.max(0, Math.min(this.currentX, window.innerWidth - this.draggedModule.offsetWidth));
        this.currentY = Math.max(0, Math.min(this.currentY, window.innerHeight - this.draggedModule.offsetHeight));

        this.draggedModule.style.left = `${this.currentX}px`;
        this.draggedModule.style.top = `${this.currentY}px`;
    }

    handleDragEnd = () => {
        if (!this.draggedModule) return;

        this.draggedModule.classList.remove('dragging');
        this.draggedModule = null;

        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModuleHandler();
});