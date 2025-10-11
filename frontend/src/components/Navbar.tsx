import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component - Refactored to match mockup design
 * 
 * Design characteristics:
 * - Fixed top bar with minimal shadow
 * - White background with subtle shadow
 * - Left: logo with gray circle icon
 * - Right: navigation links with subtle hover underline
 * - Far right: small faded site link
 */
const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
      <div className="mx-auto px-6" style={{ maxWidth: '1000px' }}>
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left side with gray circle icon */}
          <Link to="/" className="flex items-center gap-2 group">
            {/* Gray circle icon representing shades of gray */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 group-hover:scale-105 transition-transform"></div>
            <span className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
              Antystyki
            </span>
          </Link>

          {/* Navigation Links - Center/Right */}
          <div className="flex items-center gap-8">
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
                <span className="text-xs text-gray-400">👤 {user?.username}</span>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
