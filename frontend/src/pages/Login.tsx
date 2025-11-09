import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../config/api';
import { trackUserLogin } from '../utils/analytics';
import { getPrimaryErrorMessage } from '../utils/apiError';
import SocialLoginButtons from '../components/SocialLoginButtons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailUnverified(false);
    setResendSuccess(false);
    setLoading(true);

    try {
      await login({ email, password });
      
      // Track successful login
      trackUserLogin('email');
      
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = getPrimaryErrorMessage(error, 'Błąd logowania');
      setError(errorMessage);

      if (errorMessage.toLowerCase().includes('verify your email')) {
        setIsEmailUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      await api.post('/auth/resend-verification-email', { email });
      setResendSuccess(true);
      setError('Email weryfikacyjny został wysłany ponownie. Sprawdź swoją skrzynkę pocztową.');
    } catch (error: unknown) {
      const errorMessage = getPrimaryErrorMessage(error, 'Błąd podczas wysyłania emaila weryfikacyjnego');
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zaloguj się
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          <SocialLoginButtons
            mode="login"
            onSuccess={() => navigate('/')}
            onError={(message) => setError(message)}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-3 text-sm text-gray-500">lub zaloguj się mailem</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`${resendSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded`}>
                <p className="mb-2">{error}</p>
                {isEmailUnverified && !resendSuccess && (
                  <button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={resendLoading}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? 'Wysyłanie...' : 'Wyślij ponownie email weryfikacyjny'}
                  </button>
                )}
              </div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Hasło
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Zapomniałeś hasła?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </div>

            <div className="text-center">
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Nie masz konta? Zarejestruj się
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;


