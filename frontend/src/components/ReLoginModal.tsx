import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { getPrimaryErrorMessage } from '../utils/apiError';
import SocialLoginButtons from './SocialLoginButtons';

interface ReLoginModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user successfully re-authenticates */
  onSuccess?: () => void;
  /** Called when the user chooses to cancel and lose their work */
  onCancel?: () => void;
}

/**
 * Modal that appears when the user's session expires.
 * Allows them to re-authenticate without losing their form data.
 */
const ReLoginModal: React.FC<ReLoginModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const { login, clearSessionExpired, user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      clearSessionExpired();
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = getPrimaryErrorMessage(err, 'Nieprawidłowe dane logowania');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLoginSuccess = () => {
    clearSessionExpired();
    onSuccess?.();
  };

  const handleCancel = () => {
    clearSessionExpired();
    onCancel?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleCancel()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                  <span className="text-xl">⏰</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sesja wygasła
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Zaloguj się ponownie, aby kontynuować
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                Twoja sesja wygasła z powodu braku aktywności. Zaloguj się ponownie, 
                aby nie stracić wprowadzonych danych.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="relogin-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="relogin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="twoj@email.pl"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="relogin-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Hasło
                  </label>
                  <input
                    id="relogin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </form>

              <div className="mt-5">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      lub
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <SocialLoginButtons
                    mode="login"
                    onSuccess={handleSocialLoginSuccess}
                    onError={(err) => setError(err)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                Anuluj i porzuć zmiany
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReLoginModal;

