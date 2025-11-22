import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    <section className="relative py-8 md:py-12 px-6 border-b border-border-subtle overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <div className="mx-auto text-center max-w-[1000px]">
        {/* Main Heading - Very compact */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary mb-3 md:mb-4 leading-tight tracking-tight font-display"
        >
          Świat nie jest <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-gray-100 dark:to-gray-400">czarno-biały</span>
        </motion.h1>

        {/* Subtext - Minimal */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-sm md:text-base text-text-secondary mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed"
        >
          {subheadingCopy}
        </motion.p>

        {/* Toggle + Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6"
        >
          <div className="flex items-center bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm backdrop-blur-sm">
            {([
              { key: 'antistics', label: 'Antystyki' },
              { key: 'statistics', label: 'Statystyki' },
            ] as Array<{ key: HomeView; label: string }>).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onViewChange(key)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeView === key
                  ? 'bg-dark text-white shadow-md transform scale-105'
                  : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
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
            className="inline-flex items-center justify-center px-6 py-2.5 text-white font-semibold rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5 text-sm bg-accent hover:bg-accent-hover shadow-md shadow-accent/20"
          >
            Dodaj Antystykę
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

