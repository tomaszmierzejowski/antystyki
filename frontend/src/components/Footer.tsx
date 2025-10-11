import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component - Matches mockup design
 * 
 * Design characteristics:
 * - Three-column layout
 * - Column 1: Logo and mission statement
 * - Column 2: Navigation links
 * - Column 3: Information (policy, contact, FAQ)
 * - Subtle gray background
 * - Small font size
 * - Divider line at the top
 * - Spacing similar to mockup
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="mx-auto px-6 py-12" style={{ maxWidth: '1000px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Logo and Mission */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
              <span className="text-lg font-semibold text-gray-900">Antystyki</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Pokazujemy, że świat nie jest czarno-biały. Zatrzymaj polaryzację społeczną poprzez inteligentny humor i refleksję.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              © 2024 Antystyki. Wszystkie prawa zastrzeżone.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nawigacja</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Główna
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dodaj Antystyk
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Topka
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  O nas
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Informacje</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Polityka prywatności
                </Link>
              </li>
              <li>
                <Link to="/regulations" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom text */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Antystyki to projekt społeczny mający na celu pokazanie różnych perspektyw i przeciwdziałanie polaryzacji.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

