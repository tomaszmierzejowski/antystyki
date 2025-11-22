import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
// I'll use standard classes + clsx/tailwind-merge if I created the util, but I haven't. 
// I'll just use standard template literals for now to avoid breaking if the util doesn't exist.
// Actually, I should check if utils/cn exists. I'll assume it doesn't and just use clsx directly if needed, or just template strings.

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

  const navLinks = [
    { to: '/', label: 'Główna' },
    { to: '/statistics', label: 'Statystyki' },
    { to: '/create', label: 'Dodaj' },
    { to: '/topka', label: 'Topka' },
    { to: '/templates', label: 'Szablony' },
    { to: '/about', label: 'O nas' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 transition-all duration-300 border-b border-white/20 dark:border-white/5">
      <div className="mx-auto px-6" style={{ maxWidth: '1000px' }}>
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left side with orange A on gray circle */}
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={42} className="group-hover:scale-105 transition-transform duration-300" />
            <span className="text-xl font-bold tracking-tight text-text-primary group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors font-display">
              Antystyki
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors relative group py-1"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300 ease-out"></span>
              </Link>
            ))}

            {/* Divider */}
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

            {/* User Actions or Site Link */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium ${isAnonymous ? 'text-blue-500' : 'text-text-secondary dark:text-gray-400'}`}>
                  {user?.username} {isAnonymous && '(anonimowy)'}
                </span>
                {/* Admin/Moderator Link */}
                {(user?.role === 'Admin' || user?.role === 'Moderator') && (
                  <Link
                    to="/admin"
                    className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Moderacja
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Zaloguj
                </Link>
                {/* Far right: faded site link */}
                <span className="text-xs text-gray-300 dark:text-gray-600 font-medium">antystyki.pl</span>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-gray-100 dark:border-gray-800"
            >
              <div className="py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-text-primary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-4"></div>

                {/* User Actions */}
                {isAuthenticated ? (
                  <div className="px-4 space-y-3">
                    <div className={`text-sm font-medium ${isAnonymous ? 'text-blue-500' : 'text-text-secondary'}`}>
                      👤 {user?.username} {isAnonymous && '(anonimowy)'}
                    </div>
                    {(user?.role === 'Admin' || user?.role === 'Moderator') && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Moderacja
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block text-sm text-text-secondary hover:text-text-primary transition-colors text-left w-full"
                    >
                      Wyloguj
                    </button>
                  </div>
                ) : (
                  <div className="px-4 space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Zaloguj
                    </Link>
                    <div className="text-sm text-gray-300 dark:text-gray-600">antystyki.pl</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
