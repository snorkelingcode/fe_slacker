// config.js
const API_BASE_URL = 'https://be-slacker.vercel.app';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}/posts`,
    users: `${API_BASE_URL}/users`,
};

const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    mode: 'cors'
};

const handleApiResponse = async (response) => {
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || `Error: ${response.status}`;
        } catch (e) {
            errorMessage = `Network error: ${response.status}`;
            if (response.status === 504) {
                errorMessage = 'Request timed out. Please try again.';
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

const makeApiCall = async (endpoint, options = {}) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const finalOptions = {
            ...DEFAULT_FETCH_OPTIONS,
            ...options,
            headers: {
                ...DEFAULT_FETCH_OPTIONS.headers,
                ...options.headers,
            },
            signal: controller.signal
        };

        const response = await fetch(endpoint, finalOptions);
        clearTimeout(timeoutId);
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API call failed:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw error;
    }
};