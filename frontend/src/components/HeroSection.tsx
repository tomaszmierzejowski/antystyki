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
    <section className="bg-gradient-to-b from-background to-background py-4 md:py-6 px-6 border-b border-border-subtle">
      <div className="mx-auto text-center max-w-[1000px]">
        {/* Main Heading - Very compact */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-2 md:mb-3 leading-tight tracking-tight">
          Świat nie jest czarno-biały
        </h1>

        {/* Subtext - Minimal */}
        <p className="text-xs md:text-sm text-text-secondary mb-4 md:mb-5 max-w-xl mx-auto">
          {subheadingCopy}
        </p>

        {/* Toggle + Primary CTA */}
        <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <div className="flex items-center bg-background border border-border-subtle rounded-full p-1 shadow-sm backdrop-blur-sm">
            {([
              { key: 'antistics', label: 'Antystyki' },
              { key: 'statistics', label: 'Statystyki' },
            ] as Array<{ key: HomeView; label: string }>).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewChange(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeView === key
                    ? 'bg-dark text-white shadow'
                    : 'text-text-secondary hover:text-text-primary'
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
            className="inline-flex items-center justify-center px-5 md:px-6 py-2 text-white font-medium rounded-full transition-all hover:shadow-md text-sm bg-accent hover:bg-accent-hover shadow-sm"
          >
            Dodaj Antystykę
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

