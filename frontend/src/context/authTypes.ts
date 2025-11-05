import type { User, LoginRequest, RegisterRequest } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  createAnonymousUser: () => void;
}

