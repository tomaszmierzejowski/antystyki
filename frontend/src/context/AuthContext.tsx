import React, { useState, useEffect } from 'react';
import type { User, LoginRequest, RegisterRequest, LoginResponse, SocialLoginRequest } from '../types';
import api from '../config/api';
import { AuthContext } from './authContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAnonymous(false);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      setUser(null);
      setIsAnonymous(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    localStorage.removeItem('isAnonymous');
    setLoading(false);
  }, []);

  const persistAuthResponse = (response: LoginResponse) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setIsAnonymous(false);
    localStorage.removeItem('isAnonymous');
  };

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    persistAuthResponse(response.data);
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
  };

  const socialLogin = async (data: SocialLoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/social-login', data);
    persistAuthResponse(response.data);
    return response.data;
  };

  const createAnonymousUser = () => {
    const anonymousUser: User = {
      id: `anon_${Date.now()}`,
      username: 'Anonimowy',
      email: 'antystyki@gmail.com',
      role: 'User',
      createdAt: new Date().toISOString()
    };

    setUser(anonymousUser);
    setIsAnonymous(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAnonymous');
    setUser(null);
    setIsAnonymous(false);
  };

  const isLoggedIn = !!user && !isAnonymous;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        socialLogin,
        logout,
        isAuthenticated: isLoggedIn,
        isAnonymous,
        createAnonymousUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
