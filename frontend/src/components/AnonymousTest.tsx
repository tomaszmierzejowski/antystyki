/**
 * Anonymous User Test Component
 * 
 * Simple component to test anonymous user functionality
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AnonymousTest: React.FC = () => {
  const { user, isAuthenticated, isAnonymous, createAnonymousUser, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Anonymous User Test</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Status:</h3>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Anonymous:</strong> {isAnonymous ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? user.username : 'None'}</p>
          <p><strong>User ID:</strong> {user ? user.id : 'None'}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={createAnonymousUser}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Anonymous User
          </button>
          
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>

        <div className="space-y-2">
          <Link
            to="/create"
            className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
          >
            Test Create Page
          </Link>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Click "Create Anonymous User"</li>
            <li>2. Click "Test Create Page"</li>
            <li>3. Should work without redirecting to login</li>
            <li>4. Check navbar - should show "Anonimowy (anonimowy)"</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AnonymousTest;
