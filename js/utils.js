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
                    postInput.parentNode.insertBefore(imageContainer, postInput);
                };
                
                reader.readAsDataURL(file);
            }
            // Make them available globally
                window.MediaHandler = MediaHandler;
                window.ErrorHandler = ErrorHandler;
                window.LoadingState = LoadingState;
        });
    });
});