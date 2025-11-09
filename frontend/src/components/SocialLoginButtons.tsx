import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import type { TokenResponse } from '@react-oauth/google';
import useAuth from '../context/useAuth';
import { trackUserLogin, trackUserRegistration } from '../utils/analytics';
import { getPrimaryErrorMessage } from '../utils/apiError';

type SocialProvider = 'google';

type SocialLoginButtonsProps = {
  mode: 'login' | 'register';
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

type ExtendedTokenResponse = TokenResponse & {
  id_token?: string;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const providerLabels: Record<SocialProvider, string> = {
  google: 'Google',
};

const SocialLoginButtons = ({ mode, onSuccess, onError }: SocialLoginButtonsProps) => {
  const { socialLogin } = useAuth();
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null);

  const resetState = () => {
    setActiveProvider(null);
  };

  const handleAnalytics = (provider: SocialProvider) => {
    trackUserLogin(provider);
    if (mode === 'register') {
      trackUserRegistration(provider);
    }
  };

  const handleServiceError = (error: unknown, provider: SocialProvider) => {
    const message = getPrimaryErrorMessage(
      error,
      `Nie udało się zalogować przez ${providerLabels[provider]}. Spróbuj ponownie.`,
    );
    onError?.(message);
  };

  const executeSocialLogin = async (provider: SocialProvider, token: string) => {
    try {
      if (!token) {
        throw new Error('Brak tokenu logowania');
      }
      onError?.('');
      setActiveProvider(provider);
      await socialLogin({ provider, token });
      handleAnalytics(provider);
      onSuccess?.();
    } catch (error: unknown) {
      handleServiceError(error, provider);
    } finally {
      resetState();
    }
  };

  const renderGoogleButton = () => {
    if (!googleClientId) {
      return (
        <p className="text-center text-sm text-gray-500">
          Integracja Google jest chwilowo niedostępna (brak identyfikatora klienta).
        </p>
      );
    }

    const googleLoginRaw = useGoogleLogin({
      flow: 'implicit',
      scope: 'openid email profile',
      onSuccess: (response: TokenResponse) => {
        const extended = response as ExtendedTokenResponse;
        const token = extended.id_token ?? extended.access_token ?? '';
        void executeSocialLogin('google', token);
      },
      onError: () => {
        resetState();
        onError?.('Nie udało się uwierzytelnić konta Google.');
      },
    });

    const handleGoogleClick = () => {
      onError?.('');
      setActiveProvider('google');
      if (typeof googleLoginRaw === 'function') {
        googleLoginRaw();
        return;
      }
      resetState();
      onError?.('Integracja Google jest chwilowo niedostępna.');
    };

    return (
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={activeProvider !== null}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center">
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.23 9.21 3.64l6.86-6.86C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.54 13.32 17.77 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.15-3.1-.42-4.5H24v9h12.6c-.55 2.9-2.2 5.3-4.7 6.9l7.47 5.8C42.98 37.52 46.5 31.43 46.5 24.5z" />
            <path fill="#FBBC05" d="M10.54 28.42a14.48 14.48 0 010-8.84l-7.98-6.2C.92 17.52 0 20.63 0 24c0 3.37.92 6.48 2.56 9.62l7.98-6.2z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.47-5.8c-2.08 1.4-4.74 2.2-8.43 2.2-6.23 0-11.46-3.82-13.46-9.2l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </span>
        {activeProvider === 'google' ? 'Łączenie z Google...' : 'Kontynuuj z Google'}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {renderGoogleButton()}
      <p className="text-center text-xs text-gray-500">
        Kontynuując, akceptujesz naszą{' '}
        <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
          Politykę prywatności
        </Link>
        .
      </p>
    </div>
  );
};

export default SocialLoginButtons;


