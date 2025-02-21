import axios from 'axios';


axios.interceptors.request.use((token, config) => {
    config.baseURL = 'http://localhost:3000';
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
}, (error) => {
    return Promise.reject(error);
})


const register = async (firstName, lastName, email, password) => {
    try {
        const response = await axios.post('/auth/register', { firstName, lastName, email, password });
        return [response.status, null];
    } catch (error) {
        if (error.status === 409)
            return [null, 'User already exists'];
        return [null, 'Something went wrong'];
    }
}

const login = async (email, password) => {
    try {
        const response = await axios.post('/auth/login', { email, password });
        return [response.status, response.data.accessToken];
    } catch (error) {
        if (error.status === 404)
            return [null, 'User not found'];
        if (error.status === 401)
            return [null, 'Invalid password'];
        return [null, 'Something went wrong'];
    }
}