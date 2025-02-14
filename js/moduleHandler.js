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
        
        // Set initial position
        const initialX = Math.random() * (window.innerWidth - 320); // 320 is module width
        const initialY = Math.random() * (window.innerHeight - 200); // 200 is approx module height
        module.style.transform = `translate(${initialX}px, ${initialY}px)`;

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

        // Setup close button
        const closeButton = module.querySelector('.module-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            module.remove();
        });

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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ModuleHandler();
});