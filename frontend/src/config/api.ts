import axios from 'axios';
import { emitSessionExpired, hasSessionExpiredListeners } from '../utils/sessionEvents';

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
      // Don't clear token here - let the session expired handler decide
      const isAnonymous = localStorage.getItem('isAnonymous') === 'true';
      const isOnLoginPage = window.location.pathname === '/login';
      const isOnRegisterPage = window.location.pathname === '/register';
      const isValidationRequest = error.config?.url?.includes('/auth/validate');
      
      // Skip handling for login/register pages and validation requests
      if (!isAnonymous && !isOnLoginPage && !isOnRegisterPage && !isValidationRequest) {
        // If there are listeners (components showing re-login modal), emit event
        // Otherwise, fall back to redirect behavior
        if (hasSessionExpiredListeners()) {
          emitSessionExpired();
        } else {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;


