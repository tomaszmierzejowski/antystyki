import axios from 'axios';

// In production, use relative URL since nginx proxies /api to backend
// In development, use VITE_API_URL from env or default to localhost
const API_URL = import.meta.env.PROD 
  ? '/api'  // Production: relative URL (nginx handles proxy)
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'); // Development

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
      // Don't redirect to login if we're already on login page, create page, or if user is anonymous
      const isAnonymous = localStorage.getItem('isAnonymous') === 'true';
      const isOnCreatePage = window.location.pathname === '/create';
      const isOnLoginPage = window.location.pathname === '/login';
      const isOnRegisterPage = window.location.pathname === '/register';
      
      if (!isAnonymous && !isOnCreatePage && !isOnLoginPage && !isOnRegisterPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;


