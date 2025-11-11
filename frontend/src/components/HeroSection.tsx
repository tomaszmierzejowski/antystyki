import React from 'react';
import { Link } from 'react-router-dom';

type HomeView = 'antistics' | 'statistics';

interface HeroSectionProps {
  activeView: HomeView;
  onViewChange: (view: HomeView) => void;
}

/**
 * HeroSection Component - Matches mockup design
 * 
 * Design characteristics:
 * - Large centered heading: "Świat nie jest czarno-biały"
 * - Subtext in muted gray
 * - Two centered buttons (primary accent and outlined secondary)
 * - Soft gradient background or very light gray
 * - Generous whitespace and clean typography
 */
const HeroSection: React.FC<HeroSectionProps> = ({ activeView, onViewChange }) => {
  const subheadingCopy =
    activeView === 'statistics'
      ? 'Zobacz gotowe dane i podbij feed ironicznych historii.'
      : 'Odkrywaj odcienie prawdy. Zatrzymaj polaryzację społeczną.';

  return (
    <section className="bg-gradient-to-b from-gray-50 py-4 md:py-6 px-6" style={{ background: 'linear-gradient(to bottom, #f9fafb, #f8f9fb)' }}>
      <div className="mx-auto text-center" style={{ maxWidth: '1000px' }}>
        {/* Main Heading - Very compact */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3 leading-tight">
          Świat nie jest czarno-biały
        </h1>

        {/* Subtext - Minimal */}
        <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-5 max-w-xl mx-auto">
          {subheadingCopy}
        </p>

        {/* Toggle + Primary CTA */}
        <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            {([
              { key: 'antistics', label: 'Antystyki' },
              { key: 'statistics', label: 'Statystyki' },
            ] as Array<{ key: HomeView; label: string }>).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewChange(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeView === key
                    ? 'bg-gray-900 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeView === key}
                aria-label={`Przełącz na widok ${label.toLowerCase()}`}
              >
                {label}
              </button>
            ))}
          </div>

          <Link
            to="/create"
            className="inline-flex items-center justify-center px-5 md:px-6 py-2 text-white font-medium rounded-full transition-colors hover:shadow-md text-sm"
            style={{ backgroundColor: '#FF6A00', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E55F00')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF6A00')}
          >
            Dodaj Antystykę
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

