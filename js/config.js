const API_BASE_URL = '/api/';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}posts`,
    users: `${API_BASE_URL}users`,
    comments: (postId) => `${API_BASE_URL}posts/${postId}/comments`,
    aiChat: `${API_BASE_URL}ai/chat`,
    upload: `${API_BASE_URL}upload`
};

const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    mode: 'cors'
};

const handleApiResponse = async (response) => {
    console.log('Full API Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
    });

    try {
        const responseBody = await response.text(); // Get raw response text
        console.log('Response Body:', responseBody);

        // Try to parse JSON
        const data = responseBody ? JSON.parse(responseBody) : {};

        if (!response.ok) {
            // Log detailed error information
            console.error('API Error Details:', {
                status: response.status,
                body: data,
                message: data.message || 'Unknown error'
            });

            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('Response Processing Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const makeApiCall = async (endpoint, options = {}) => {
    try {
        console.log('Making API call to:', endpoint);
        
        const finalOptions = {
            ...DEFAULT_FETCH_OPTIONS,
            ...options,
            headers: {
                ...DEFAULT_FETCH_OPTIONS.headers,
                ...options.headers,
            },
            credentials: 'include' // Add this line
        };

        const response = await fetch(endpoint, finalOptions);
        
        // Log full response details for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Handle non-JSON responses
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Invalid response format: ${text}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', {
            endpoint,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};