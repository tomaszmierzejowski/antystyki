/**
 * Simple event system for session expiration.
 * This allows the API interceptor to notify the auth context about 401 errors
 * without direct coupling to React.
 */

type SessionExpiredListener = () => void;

const listeners: Set<SessionExpiredListener> = new Set();

/**
 * Subscribe to session expired events.
 * Returns an unsubscribe function.
 */
export const onSessionExpired = (listener: SessionExpiredListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Emit a session expired event to all listeners.
 */
export const emitSessionExpired = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('Error in session expired listener:', error);
    }
  });
};

/**
 * Check if there are any listeners registered.
 * Useful for determining if we should show modal vs redirect.
 */
export const hasSessionExpiredListeners = (): boolean => {
  return listeners.size > 0;
};

