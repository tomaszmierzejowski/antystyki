import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../config/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Brak tokenu weryfikacyjnego');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email zweryfikowany pomyślnie!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Błąd podczas weryfikacji emaila');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Weryfikacja Email
          </h2>
        </div>

        <div className="mt-8">
          {status === 'loading' && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Weryfikacja emaila...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <div className="flex items-center mb-2">
                <svg className="h-6 w-6 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-bold">Sukces!</span>
              </div>
              <p className="mb-2">{message}</p>
              <p className="text-sm">Zostaniesz przekierowany na stronę logowania...</p>
              <div className="mt-4 text-center">
                <Link to="/login" className="font-medium text-green-700 hover:text-green-600 underline">
                  Przejdź do logowania teraz
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <div className="flex items-center mb-2">
                <svg className="h-6 w-6 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-bold">Błąd</span>
              </div>
              <p className="mb-4">{message}</p>
              <div className="flex flex-col space-y-2">
                <Link to="/register" className="text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Zarejestruj się ponownie
                </Link>
                <Link to="/login" className="text-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                  Przejdź do logowania
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

