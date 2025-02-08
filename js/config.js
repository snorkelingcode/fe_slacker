const API_BASE_URL = 'https://be-slacker.vercel.app/api/';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}posts`,
    users: `${API_BASE_URL}users`,
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
        console.log('API Call Details:', {
            endpoint,
            method: options.method || 'GET',
            headers: {
                ...DEFAULT_FETCH_OPTIONS.headers,
                ...options.headers
            },
            body: options.body ? JSON.parse(options.body) : null
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        console.error('Detailed API Call Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};