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
  /** Whether the user's session has expired (token invalid) */
  sessionExpired: boolean;
  /** Call this when a 401 error is received to show re-login modal */
  onSessionExpired: () => void;
  /** Call this after successful re-login to clear the expired state */
  clearSessionExpired: () => void;
}

