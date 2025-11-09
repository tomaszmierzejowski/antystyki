import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { attachGlobalErrorHandlers } from './utils/clientLogger';
import { GoogleOAuthProvider } from '@react-oauth/google';

attachGlobalErrorHandlers();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const RootApp = () => {
  if (!googleClientId) {
    return <App />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RootApp />
    </ErrorBoundary>
  </StrictMode>,
);
