// AI Chat Module Setup Function
function setupAIChat(module) {
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
            // Disable input while processing
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Close any existing event source
            if (eventSource) {
                eventSource.close();
            }

            // Create query parameters
            const params = new URLSearchParams({
                message: message,
                walletAddress: walletAddress
            });

            // Create event source for streaming
            eventSource = new EventSource(`${API_ENDPOINTS.aiChat}/stream?${params}`);

            // Create container for AI's response
            let currentResponse = '';

            eventSource.onmessage = (event) => {
                if (event.data === '[DONE]') {
                    eventSource.close();
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    messageInput.focus();
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (data.content) {
                        currentResponse += data.content;
                        
                        // Update or create the AI message
                        const aiMessage = messagesContainer.lastElementChild;
                        if (aiMessage && aiMessage.classList.contains('ai-message')) {
                            aiMessage.textContent = currentResponse;
                        } else {
                            addMessage(currentResponse, 'ai-message');
                        }
                        
                        // Scroll to bottom
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                eventSource.close();
                messageInput.disabled = false;
                sendButton.disabled = false;
                addMessage('Sorry, I couldn\'t process your request.', 'ai-message');
            };

        } catch (error) {
            console.error('Chat error:', error);
            addMessage('Sorry, I couldn\'t process your request.', 'ai-message');
            messageInput.disabled = false;
            sendButton.disabled = false;
        }
    };

    // Add event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Clean up function
    return () => {
        if (eventSource) {
            eventSource.close();
        }
        sendButton.removeEventListener('click', sendMessage);
        messageInput.removeEventListener('keypress', sendMessage);
    };
}