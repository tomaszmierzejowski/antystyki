import React, { useState, useEffect } from 'react';

const WelcomeBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('welcome_banner_dismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('welcome_banner_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 relative shadow-md z-50">
            <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-8">
                <div className="text-sm leading-relaxed">
                    <p className="font-semibold mb-1">
                        🚀 Właśnie wystartowaliśmy! (22.11.2025)
                    </p>
                    <p className="text-gray-300">
                        Daj nam chwilę na dostosowanie strony i dodanie większej ilości treści. Śmiało dodawaj własne treści, kontaktuj się z nami i wspieraj nas. Właśnie wydaliśmy pierwszą wersję i pracujemy nad ulepszeniami.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-1 text-gray-400 hover:text-white transition-colors"
                    aria-label="Zamknij baner"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default WelcomeBanner;
