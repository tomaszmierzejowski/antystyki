import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7240/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect to login if we're on the create page or if user is anonymous
      const isAnonymous = localStorage.getItem('isAnonymous') === 'true';
      const isOnCreatePage = window.location.pathname === '/create';
      
      if (!isAnonymous && !isOnCreatePage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


