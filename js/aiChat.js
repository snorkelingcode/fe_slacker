// aiChat.js
window.setupAIChat = function(module) {
    const messagesContainer = module.querySelector('.ai-messages');
    const messageInput = module.querySelector('.ai-message-input');
    const sendButton = module.querySelector('.ai-send-btn');
    let eventSource = null;

    const addMessage = (message, sender) => {
        const messageEl = document.createElement('div');
        messageEl.classList.add('ai-message', sender);
        messageEl.textContent = message;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

// In aiChat.js, update the sendMessage function:
const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user-message');
    messageInput.value = '';

    // Get wallet address
    const walletAddress = SessionManager.getWalletAddress();
    if (!walletAddress) {
        addMessage('Please connect your wallet to use the chat feature.', 'ai-message');
        return;
    }

    try {
        module.classList.remove('dragging');
        messageInput.disabled = true;
        sendButton.disabled = true;

        console.log('Sending chat request:', {
            endpoint: API_ENDPOINTS.aiChat,
            message,
            walletAddress
        });

        const response = await makeApiCall(`${API_ENDPOINTS.aiChat}/stream`, {
            method: 'POST',
            body: JSON.stringify({ 
                walletAddress: walletAddress,
                message 
            })
        });

        console.log('Chat response:', response);
        addMessage(response.message, 'ai-message');
    } catch (error) {
        console.error('AI Chat Error:', {
            error,
            endpoint: API_ENDPOINTS.aiChat,
            message,
            walletAddress
        });
        addMessage('Sorry, I couldn\'t process your request.', 'ai-message');
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
};

    // Clean up function
    return () => {
        if (eventSource) {
            eventSource.close();
        }
        sendButton.removeEventListener('click', sendMessage);
        messageInput.removeEventListener('keypress', sendMessage);
    };
};