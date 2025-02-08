// Error Handler Class
class ErrorHandler {
    static showError(message, container) {
        if (!container) return;
        
        // Remove any existing error messages
        const existingError = container.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Insert at the top of the container
        container.insertBefore(errorDiv, container.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement === container) {
                errorDiv.remove();
            }
        }, 5000);
    }

    static showSuccess(message, container) {
        if (!container) return;
        
        // Remove any existing success messages
        const existingSuccess = container.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        // Insert at the top of the container
        container.insertBefore(successDiv, container.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentElement === container) {
                successDiv.remove();
            }
        }, 5000);
    }
}

// Loading State Handler
class LoadingState {
    static show(element) {
        if (!element) return;
        element.classList.add('loading');
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        element.appendChild(spinner);
        element.disabled = true;
    }

    static hide(element) {
        if (!element) return;
        element.classList.remove('loading');
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
        element.disabled = false;
    }
}

// Media Handler Class
class MediaHandler {
    static validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];

        if (!file) {
            throw new Error('No file selected');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not supported. Please use JPG, PNG, GIF, or MP4.');
        }

        if (file.size > maxSize) {
            throw new Error('File is too large. Maximum size is 5MB.');
        }
    }

    static async handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                resolve(reader.result);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// File Upload Handler
document.addEventListener('DOMContentLoaded', function() {
    const postInput = document.querySelector('.post-input');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Create an image preview
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'uploaded-image';
                    
                    // Create a container for the image
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    
                    // Add remove button
                    const removeButton = document.createElement('button');
                    removeButton.innerHTML = '×';
                    removeButton.className = 'remove-image';
                    removeButton.onclick = function() {
                        imageContainer.remove();
                    };
                    
                    // Add image and remove button to container
                    imageContainer.appendChild(img);
                    imageContainer.appendChild(removeButton);
                    
                    // Insert the image container before the textarea
                    if (postInput) {
                        postInput.parentNode.insertBefore(imageContainer, postInput);
                    }
                };
                
                reader.readAsDataURL(file);
            }
        });
    });
});