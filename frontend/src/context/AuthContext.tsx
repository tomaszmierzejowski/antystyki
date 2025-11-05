import React, { useState, useEffect } from 'react';
import type { User, LoginRequest, RegisterRequest, LoginResponse } from '../types';
import api from '../config/api';
import { AuthContext } from './authContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const isAnonymousUser = localStorage.getItem('isAnonymous') === 'true';
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAnonymous(false);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAnonymous');
      }
    } else if (isAnonymousUser) {
      // Create anonymous user for temporary access
      const anonymousUser: User = {
        id: `anon_${Date.now()}`,
        username: 'Anonimowy',
        email: 'anonymous@antystyki.pl',
        role: 'User',
        createdAt: new Date().toISOString()
      };
      
      setUser(anonymousUser);
      setIsAnonymous(true);
      localStorage.setItem('user', JSON.stringify(anonymousUser));
      localStorage.setItem('isAnonymous', 'true');
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
  };

  const createAnonymousUser = () => {
    const anonymousUser: User = {
      id: `anon_${Date.now()}`,
      username: 'Anonimowy',
      email: 'anonymous@antystyki.pl',
      role: 'User',
      createdAt: new Date().toISOString()
    };
    
    setUser(anonymousUser);
    setIsAnonymous(true);
    localStorage.setItem('user', JSON.stringify(anonymousUser));
    localStorage.setItem('isAnonymous', 'true');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAnonymous');
    setUser(null);
    setIsAnonymous(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAnonymous,
        createAnonymousUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
