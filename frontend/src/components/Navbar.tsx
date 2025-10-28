import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

/**
 * Navbar Component - Refactored to match mockup design
 * 
 * Design characteristics:
 * - Fixed top bar with minimal shadow
 * - White background with subtle shadow
 * - Left: logo with orange A on gray circle
 * - Right: navigation links with subtle hover underline
 * - Far right: small faded site link
 */
const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, isAnonymous } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: '1000px' }}>
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left side with orange A on gray circle */}
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={48} className="group-hover:scale-105 transition-transform" />
            <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
              Antystyki
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className="text-sm font-normal text-gray-900 hover:text-gray-600 transition-colors relative group"
            >
              Główna
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/create" 
              className="text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors relative group"
            >
              Dodaj
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/categories" 
              className="text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors relative group"
            >
              Topka
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/templates" 
              className="text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors relative group"
            >
              Szablony
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors relative group"
            >
              O nas
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-gray-300"></div>

            {/* User Actions or Site Link */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className={`text-xs ${isAnonymous ? 'text-blue-500' : 'text-gray-400'}`}>
                  👤 {user?.username} {isAnonymous && '(anonimowy)'}
                </span>
                {/* Admin/Moderator Link */}
                {(user?.role === 'Admin' || user?.role === 'Moderator') && (
                  <Link 
                    to="/admin"
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Moderacja
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Wyloguj
                </button>
              </div>
          ) : (
            <>
              <Link 
                to="/login"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Zaloguj
              </Link>
              {/* Far right: faded site link */}
              <span className="text-xs text-gray-300">antystyki.pl</span>
            </>
          )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              {/* Navigation Links */}
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-normal text-gray-900 hover:text-gray-600 transition-colors py-2"
              >
                Główna
              </Link>
              <Link 
                to="/create" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Dodaj
              </Link>
              <Link 
                to="/categories" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Topka
              </Link>
              <Link 
                to="/templates" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Szablony
              </Link>
              <Link 
                to="/about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                O nas
              </Link>

              {/* Divider */}
              <div className="h-px bg-gray-200 my-4"></div>

              {/* User Actions */}
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className={`text-sm ${isAnonymous ? 'text-blue-500' : 'text-gray-600'}`}>
                    👤 {user?.username} {isAnonymous && '(anonimowy)'}
                  </div>
                  {/* Admin/Moderator Link */}
                  {(user?.role === 'Admin' || user?.role === 'Moderator') && (
                    <Link 
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                    >
                      Moderacja
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 text-left"
                  >
                    Wyloguj
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link 
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                  >
                    Zaloguj
                  </Link>
                  <div className="text-sm text-gray-300 pt-2">antystyki.pl</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
