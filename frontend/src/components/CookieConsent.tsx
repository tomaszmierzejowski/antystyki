/**
 * Cookie Consent Banner
 * 
 * GDPR-compliant cookie consent banner for analytics tracking.
 * Displays a banner at the bottom of the screen asking for user consent.
 * Supports Polish and English languages.
 * Stores consent in localStorage for persistence.
 */

import { useState, useEffect } from 'react';
import { setAnalyticsConsent, initializeGA4 } from '../utils/analytics';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('analytics_consent');
    
    if (consentGiven === null) {
      // No choice made yet, show banner
      setShowBanner(true);
    } else if (consentGiven === 'granted') {
      // User previously accepted, initialize analytics
      setAnalyticsConsent(true);
      initializeGA4();
    }

    // Detect language from browser or localStorage
    const savedLang = localStorage.getItem('preferred_language');
    const browserLang = navigator.language.startsWith('pl') ? 'pl' : 'en';
    setLanguage((savedLang as 'pl' | 'en') || browserLang);
  }, []);

  const handleAccept = () => {
    setAnalyticsConsent(true);
    initializeGA4();
    setShowBanner(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  const content = {
    pl: {
      title: 'Używamy plików cookie',
      description:
        'Używamy Google Analytics do analizy ruchu na stronie i poprawy Twojego doświadczenia. Nie zbieramy danych osobowych. Możesz zmienić swoje preferencje w każdej chwili.',
      learnMore: 'Dowiedz się więcej',
      accept: 'Akceptuję',
      decline: 'Odrzuć',
    },
    en: {
      title: 'We use cookies',
      description:
        'We use Google Analytics to analyze website traffic and improve your experience. We do not collect personal data. You can change your preferences at any time.',
      learnMore: 'Learn more',
      accept: 'Accept',
      decline: 'Decline',
    },
  };

  const text = content[language];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 shadow-2xl"
      role="dialog"
      aria-live="polite"
      aria-label={text.title}
    >
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🍪 {text.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {text.description}
            </p>
            <a
              href="/privacy"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              onClick={() => setShowBanner(false)}
            >
              {text.learnMore}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              aria-label={text.decline}
            >
              {text.decline}
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label={text.accept}
            >
              {text.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

