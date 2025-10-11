import React from 'react';
import { backgroundTemplates } from '../config/backgrounds';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

const BackgroundSelector: React.FC<Props> = ({ selectedId, onSelect }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Wybierz tło
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {backgroundTemplates.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onSelect(bg.id)}
            className={`group relative h-20 rounded-lg overflow-hidden transition-all duration-200 ${
              selectedId === bg.id
                ? 'ring-4 ring-primary-500 scale-105 shadow-lg'
                : 'ring-2 ring-gray-200 hover:ring-primary-300 hover:scale-105 shadow-md'
            }`}
            title={bg.namePl}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${bg.gradient}`}></div>
            
            {/* Checkmark for selected */}
            {selectedId === bg.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                <div className="bg-white rounded-full p-1">
                  <svg 
                    className="w-6 h-6 text-primary-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Hover tooltip */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              {bg.namePl}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BackgroundSelector;
