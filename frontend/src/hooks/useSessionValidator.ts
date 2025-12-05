import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../config/api';

interface UseSessionValidatorOptions {
  /** Whether to validate on focus/visibility change (default: true) */
  validateOnFocus?: boolean;
  /** Minimum interval between validations in ms (default: 30000 = 30s) */
  minInterval?: number;
}

interface UseSessionValidatorResult {
  /** Manually trigger a session validation */
  validateSession: () => Promise<boolean>;
  /** Whether a validation is currently in progress */
  isValidating: boolean;
}

/**
 * Hook that validates the user's session when they return to the app.
 * Triggers validation on window focus and visibility change events.
 * If the session is invalid, it will trigger the auth context's session expired state.
 */
export const useSessionValidator = (
  options: UseSessionValidatorOptions = {}
): UseSessionValidatorResult => {
  const { validateOnFocus = true, minInterval = 30000 } = options;
  const { isAuthenticated, onSessionExpired } = useAuth();
  const isValidatingRef = useRef(false);
  const lastValidationRef = useRef<number>(0);

  const validateSession = useCallback(async (): Promise<boolean> => {
    // Don't validate if not authenticated or already validating
    if (!isAuthenticated || isValidatingRef.current) {
      return isAuthenticated;
    }

    // Check if we validated recently
    const now = Date.now();
    if (now - lastValidationRef.current < minInterval) {
      return true;
    }

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      onSessionExpired?.();
      return false;
    }

    isValidatingRef.current = true;

    try {
      await api.get('/auth/validate');
      lastValidationRef.current = Date.now();
      return true;
    } catch (error: unknown) {
      // Check if it's a 401 error
      const isUnauthorized = 
        error && 
        typeof error === 'object' && 
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401;

      if (isUnauthorized) {
        onSessionExpired?.();
        return false;
      }

      // For other errors (network issues), don't mark session as expired
      // Just log and continue - we'll try again next time
      console.warn('Session validation failed (non-auth error):', error);
      return true;
    } finally {
      isValidatingRef.current = false;
    }
  }, [isAuthenticated, minInterval, onSessionExpired]);

  useEffect(() => {
    if (!validateOnFocus || !isAuthenticated) {
      return;
    }

    const handleFocus = () => {
      validateSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validateOnFocus, isAuthenticated, validateSession]);

  return {
    validateSession,
    isValidating: isValidatingRef.current,
  };
};

export default useSessionValidator;

