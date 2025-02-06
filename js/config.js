const API_BASE_URL = 'https://be-slacker.vercel.app/api';

const API_ENDPOINTS = {
    posts: `${API_BASE_URL}/posts`,
    users: `${API_BASE_URL}/users`,
};

const handleApiResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
};