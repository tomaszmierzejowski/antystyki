import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Dropdown from './Dropdown';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      label: 'Mój profil',
      icon: '👤',
      onClick: () => navigate(`/user/${user?.id}`),
    },
    {
      label: 'Moje antystyki',
      icon: '📊',
      onClick: () => navigate('/my-antistics'),
    },
    {
      label: 'Ustawienia',
      icon: '⚙️',
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Wyloguj się',
      icon: '🚪',
      onClick: handleLogout,
      variant: 'danger' as const,
    },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-300 sticky top-0 z-50">
      {/* Top menu like Demotywatory */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Compact */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-600 via-gray-800 to-black group-hover:scale-105 transition-transform">
              Antystyki
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-black group-hover:animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </Link>

          {/* Navigation - Compact like Demotywatory */}
          <div className="flex items-center gap-4">
            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-gray-700 hover:text-black font-medium text-sm transition-colors">
                Główna
              </Link>
              <Link to="/create" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                Dodaj
              </Link>
              <Link to="/categories" className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                Kategorie
              </Link>
            </div>

            {/* User Actions */}
            {isAuthenticated ? (
              <>
                <Button
                  to="/create"
                  variant="primary"
                  size="sm"
                  icon="✍️"
                >
                  Dodaj
                </Button>
                
                {(user?.role === 'Admin' || user?.role === 'Moderator') && (
                  <Button
                    to="/admin"
                    variant="outline"
                    size="sm"
                    icon="🛡️"
                  >
                    Panel
                  </Button>
                )}

                {/* User Dropdown */}
                <Dropdown
                  trigger={
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-500 transition-all cursor-pointer group">
                      <span className="text-sm group-hover:scale-110 transition-transform">👤</span>
                      <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors text-sm">{user?.username}</span>
                      <span className="text-gray-400 group-hover:text-gray-600 transition-colors text-xs">▼</span>
                    </div>
                  }
                  items={userMenuItems}
                  align="right"
                />
              </>
            ) : (
              <>
                <Button
                  to="/login"
                  variant="ghost"
                  size="sm"
                >
                  Zaloguj
                </Button>
                <Button
                  to="/register"
                  variant="primary"
                  size="sm"
                >
                  Zarejestruj
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;



