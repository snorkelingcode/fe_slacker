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

        // Only close modal when clicking outside both modal and add button
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

        this.container.appendChild(module);

        // Only handle close button clicks
        const closeButton = module.querySelector('.module-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            module.remove();
        });

        this.setupModuleDragging(module);
    }

    setupModuleDragging(module) {
        let isDragging = false;

        const handleMouseDown = (e) => {
            // Ignore if clicking the close button
            if (e.target.classList.contains('module-close')) {
                return;
            }

            isDragging = true;
            this.draggedModule = module;
            module.classList.add('dragging');

            const rect = module.getBoundingClientRect();
            this.initialX = e.clientX - rect.left;
            this.initialY = e.clientY - rect.top;

            // Add event listeners
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            
            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;

            // Keep module within viewport
            this.currentX = Math.max(0, Math.min(this.currentX, window.innerWidth - module.offsetWidth));
            this.currentY = Math.max(0, Math.min(this.currentY, window.innerHeight - module.offsetHeight));

            module.style.left = `${this.currentX}px`;
            module.style.top = `${this.currentY}px`;
        };

        const handleMouseUp = () => {
            isDragging = false;
            if (this.draggedModule) {
                this.draggedModule.classList.remove('dragging');
                this.draggedModule = null;
            }

            // Remove event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        // Add mousedown event listener to the entire module
        module.addEventListener('mousedown', handleMouseDown);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModuleHandler();
});