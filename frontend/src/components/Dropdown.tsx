import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignmentClasses = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute ${alignmentClasses} mt-2 w-56
            bg-gray-900 border-2 border-gray-700 rounded-2xl shadow-2xl
            py-2 z-50
            animate-fade-in-up
          `}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-3 text-left
                flex items-center gap-3
                transition-all duration-200
                ${
                  item.variant === 'danger'
                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
                ${index !== items.length - 1 ? 'border-b border-gray-800' : ''}
              `}
            >
              {item.icon && <span className="text-xl">{item.icon}</span>}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;

