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
              © 2025 Antystyki. Wszystkie prawa zastrzeżone.
            </p>
            {/* Buy Me a Coffee Widget */}
            <div className="mt-4">
              <a
                href="https://buymeacoffee.com/antystyki"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.783.174 1.167.283.191.054.383.112.573.181.302.11.604.251.867.465.263.214.489.503.57.858.085.37-.002.748-.126 1.106-.227.66-.551 1.273-.918 1.846-.383.598-.214.369-.383.943-.09.306-.065.571.088.792.111.161.299.266.49.312.548.13 1.126.075 1.661-.123.424-.156.832-.346 1.191-.644.359-.298.656-.662.859-1.088.101-.213.174-.441.22-.676.067-.354.098-.717.097-1.079 0-.471-.067-.94-.196-1.391z"/>
                </svg>
                Wesprzyj nas
              </a>
            </div>
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
                <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
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

