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
    <section className="bg-gradient-to-b from-gray-50 py-4 md:py-6 px-6" style={{ background: 'linear-gradient(to bottom, #f9fafb, #f8f9fb)' }}>
      <div className="mx-auto text-center" style={{ maxWidth: '1000px' }}>
        {/* Main Heading - Very compact */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 md:mb-3 leading-tight">
          Świat nie jest czarno-biały
        </h1>

        {/* Subtext - Minimal */}
        <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-5 max-w-xl mx-auto">
          Odkrywaj odcienie prawdy. Zatrzymaj polaryzację społeczną.
        </p>

        {/* Single primary button - Minimal */}
        <Link
          to="/create"
          className="inline-block px-5 md:px-6 py-2 text-white font-medium rounded-full transition-colors hover:shadow-md text-sm"
          style={{ backgroundColor: '#FF6A00', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55F00'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6A00'}
        >
          Dodaj Antystyk
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;

