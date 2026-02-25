import axios from 'axios';

const instance = axios.create({
    baseURL: '/api',
    timeout: 5000,
});

// 요청마다 JWT 토큰 자동 첨부
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default instance;