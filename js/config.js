const API_BASE_URL = 'https://be-slacker.vercel.app/api';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}/posts`,
    users: `${API_BASE_URL}/users`,
};

const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://fe-slacker.vercel.app'
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
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

const makeApiCall = async (endpoint, options = {}) => {
    try {
        const finalOptions = {
            ...DEFAULT_FETCH_OPTIONS,
            ...options,
            headers: {
                ...DEFAULT_FETCH_OPTIONS.headers,
                ...options.headers,
            },
        };

        const response = await fetch(endpoint, finalOptions);
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};