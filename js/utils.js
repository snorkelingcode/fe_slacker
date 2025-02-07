// utils.js
class MediaHandler {
    static async handleImageUpload(file, maxSizeMB = 5) {
        return new Promise((resolve, reject) => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                reject(`File size should not exceed ${maxSizeMB}MB`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    const MAX_DIMENSION = 2048;
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        if (width > height) {
                            height = (height * MAX_DIMENSION) / width;
                            width = MAX_DIMENSION;
                        } else {
                            width = (width * MAX_DIMENSION) / height;
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                };
                img.onerror = () => reject('Invalid image file');
                img.src = e.target.result;
            };
            reader.onerror = () => reject('Error reading file');
            reader.readAsDataURL(file);
        });
    }

    static validateFile(file, type = 'image') {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/webm'];
        
        if (type === 'image' && !allowedImageTypes.includes(file.type)) {
            throw new Error('Invalid image type. Please use JPG, PNG, GIF, or WEBP');
        }
        if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
            throw new Error('Invalid video type. Please use MP4 or WEBM');
        }
    }
}

class ErrorHandler {
    static showError(message, container) {
        if (!container) return;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        container.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentElement === container) {
                errorDiv.remove();
            }
        }, 3000);
    }

    static showSuccess(message, container) {
        if (!container) return;
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        container.appendChild(successDiv);
        setTimeout(() => {
            if (successDiv.parentElement === container) {
                successDiv.remove();
            }
        }, 3000);
    }
}

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

// Make them available globally
window.MediaHandler = MediaHandler;
window.ErrorHandler = ErrorHandler;
window.LoadingState = LoadingState;