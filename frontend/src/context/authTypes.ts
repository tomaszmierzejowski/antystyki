import type { User, LoginRequest, RegisterRequest, SocialLoginRequest, LoginResponse } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  socialLogin: (data: SocialLoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  createAnonymousUser: () => void;
}

