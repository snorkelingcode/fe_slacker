// Update your config.js
const API_BASE_URL = 'https://be-slacker.vercel.app/api';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}/posts`,
    users: `${API_BASE_URL}/users`,
};

const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    },
    mode: 'cors',
    credentials: 'include'
};

const handleApiResponse = async (response) => {
    console.log(`API Response Status: ${response.status} for ${response.url}`);
    
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            errorMessage = errorData.message || errorData.error || `Error: ${response.status}`;
        } catch (e) {
            console.error('Error parsing error response:', e);
            errorMessage = `Network error: ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    
    try {
        const data = await response.json();
        console.log('API Response Data:', data);
        return data;
    } catch (e) {
        console.error('Error parsing success response:', e);
        throw new Error('Invalid response format');
    }
};

const makeApiCall = async (endpoint, options = {}) => {
    try {
        console.log(`Making API call to: ${endpoint}`, options);
        
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