const API_BASE_URL = 'https://be-slacker-git-main-snorkelingcodes-projects.vercel.app/api';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}/posts`,
    users: `${API_BASE_URL}/users`,
};

const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
    },
};

const handleApiResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
};

// Helper function to make API calls
const makeApiCall = async (endpoint, options = {}) => {
    const finalOptions = {
        ...DEFAULT_FETCH_OPTIONS,
        ...options,
        headers: {
            ...DEFAULT_FETCH_OPTIONS.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(endpoint, finalOptions);
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};