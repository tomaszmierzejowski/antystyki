import React from 'react';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';

const ButtonShowcase: React.FC = () => {
  const dropdownItems = [
    {
      label: 'Profile',
      icon: '👤',
      onClick: () => alert('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: '⚙️',
      onClick: () => alert('Settings clicked'),
    },
    {
      label: 'Help',
      icon: '❓',
      onClick: () => alert('Help clicked'),
    },
    {
      label: 'Logout',
      icon: '🚪',
      onClick: () => alert('Logout clicked'),
      variant: 'danger' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-600 via-gray-800 to-black mb-4">
            Button System
          </h1>
          <p className="text-xl text-gray-600">
            Beautiful, reusable buttons and menus in pure grayscale
          </p>
        </div>

        {/* Button Variants */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Button Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Primary */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Primary</h3>
              <p className="text-gray-600 text-sm mb-4">Main actions and CTAs</p>
              <div className="space-y-3">
                <Button variant="primary" size="sm">Small Primary</Button>
                <Button variant="primary" size="md">Medium Primary</Button>
                <Button variant="primary" size="lg">Large Primary</Button>
                <Button variant="primary" icon="✍️">With Icon</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Secondary */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Secondary</h3>
              <p className="text-gray-600 text-sm mb-4">Secondary actions</p>
              <div className="space-y-3">
                <Button variant="secondary" size="sm">Small Secondary</Button>
                <Button variant="secondary" size="md">Medium Secondary</Button>
                <Button variant="secondary" size="lg">Large Secondary</Button>
                <Button variant="secondary" icon="📊">With Icon</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Outline */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Outline</h3>
              <p className="text-gray-600 text-sm mb-4">Tertiary actions</p>
              <div className="space-y-3">
                <Button variant="outline" size="sm">Small Outline</Button>
                <Button variant="outline" size="md">Medium Outline</Button>
                <Button variant="outline" size="lg">Large Outline</Button>
                <Button variant="outline" icon="🛡️">With Icon</Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>

            {/* Ghost */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Ghost</h3>
              <p className="text-gray-600 text-sm mb-4">Subtle actions</p>
              <div className="space-y-3">
                <Button variant="ghost" size="sm">Small Ghost</Button>
                <Button variant="ghost" size="md">Medium Ghost</Button>
                <Button variant="ghost" size="lg">Large Ghost</Button>
                <Button variant="ghost" icon="👁️">With Icon</Button>
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>

            {/* Danger */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Danger</h3>
              <p className="text-gray-600 text-sm mb-4">Destructive actions</p>
              <div className="space-y-3">
                <Button variant="danger" size="sm">Small Danger</Button>
                <Button variant="danger" size="md">Medium Danger</Button>
                <Button variant="danger" size="lg">Large Danger</Button>
                <Button variant="danger" icon="🗑️">Delete</Button>
                <Button variant="danger" disabled>Disabled</Button>
              </div>
            </div>

            {/* Full Width */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Full Width</h3>
              <p className="text-gray-600 text-sm mb-4">Takes full container width</p>
              <div className="space-y-3">
                <Button variant="primary" fullWidth>Full Width Primary</Button>
                <Button variant="secondary" fullWidth>Full Width Secondary</Button>
                <Button variant="outline" fullWidth>Full Width Outline</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Dropdown Menus</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Aligned */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Left Aligned</h3>
              <Dropdown
                trigger={
                  <Button variant="outline" icon="▼">
                    Open Menu (Left)
                  </Button>
                }
                items={dropdownItems}
                align="left"
              />
            </div>

            {/* Right Aligned */}
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Right Aligned</h3>
              <div className="flex justify-end">
                <Dropdown
                  trigger={
                    <Button variant="outline" icon="▼">
                      Open Menu (Right)
                    </Button>
                  }
                  items={dropdownItems}
                  align="right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Button Groups */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Button Groups</h2>
          <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Horizontal Group</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Save</Button>
              <Button variant="secondary">Preview</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="danger">Delete</Button>
            </div>
          </div>
        </div>

        {/* Real World Examples */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Real World Examples</h2>
          
          {/* Auth Form */}
          <div className="bg-white border border-gray-300 rounded-2xl p-8 mb-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">Login Form</h3>
            <div className="max-w-md space-y-4">
              <input
                type="text"
                placeholder="Email"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900"
              />
              <Button variant="primary" fullWidth icon="🔐">
                Sign In
              </Button>
              <Button variant="ghost" fullWidth>
                Forgot Password?
              </Button>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white border border-gray-300 rounded-2xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Items Yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first item</p>
            <Button variant="primary" size="lg" icon="✨">
              Create First Item
            </Button>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button to="/" variant="ghost" icon="←">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonShowcase;

