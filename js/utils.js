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

class MediaHandler {
    static UPLOAD_ENDPOINT = `${API_BASE_URL}upload`;

    static validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'video/mp4', 
            'video/quicktime'
        ];

        if (!file) {
            throw new Error('No file selected');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not supported. Please use JPG, PNG, GIF, MP4, or MOV.');
        }

        if (file.size > maxSize) {
            throw new Error('File is too large. Maximum size is 10MB.');
        }
    }

    static async uploadFile(file, type = 'general') {
        try {
            this.validateFile(file);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(
                type === 'general' 
                    ? this.UPLOAD_ENDPOINT 
                    : `${this.UPLOAD_ENDPOINT}/${type}`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        // Don't set Content-Type here, let the browser set it with the boundary
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || 'Upload failed';
                } catch (e) {
                    errorMessage = errorText || 'Upload failed';
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    static async handleProfileImageUpload(file, walletAddress) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('walletAddress', walletAddress);

            const response = await fetch(`${this.UPLOAD_ENDPOINT}/profile`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || 'Profile image upload failed';
                } catch (e) {
                    errorMessage = errorText || 'Profile image upload failed';
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('Profile image upload error:', error);
            throw error;
        }
    }

    static async handleBannerImageUpload(file, walletAddress) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('walletAddress', walletAddress);

            const response = await fetch(`${this.UPLOAD_ENDPOINT}/banner`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || 'Banner image upload failed';
                } catch (e) {
                    errorMessage = errorText || 'Banner image upload failed';
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result.url;
        } catch (error) {
            console.error('Banner image upload error:', error);
            throw error;
        }
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