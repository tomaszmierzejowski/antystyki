import React from 'react';
import { Link } from 'react-router-dom';

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
const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 py-20 px-6" style={{ background: 'linear-gradient(to bottom, #f9fafb, #f8f9fb)' }}>
      <div className="mx-auto text-center" style={{ maxWidth: '1000px' }}>
        {/* Main Heading - Bold, black text */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Świat nie jest czarno-biały
        </h1>

        {/* Subtext - Single paragraph of muted gray text */}
        <p className="text-base md:text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Odkrywaj odcienie prawdy. Zatrzymaj polaryzację społeczną poprzez inteligentny humor i refleksję.
        </p>

        {/* Two centered buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary button - Accent color */}
          <Link
            to="/create"
            className="px-8 py-3 text-white font-medium rounded-full transition-colors hover:shadow-lg"
            style={{ backgroundColor: '#FF6A00', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55F00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6A00'}
          >
            Dodaj Antystyk
          </Link>

          {/* Secondary button - Outlined */}
          <Link
            to="/about"
            className="px-8 py-3 bg-transparent border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium rounded-full transition-all"
          >
            Dowiedz się więcej
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

