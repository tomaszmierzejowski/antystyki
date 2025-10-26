/**
 * Template Selector Component
 * 
 * Allows users to choose from different card templates when creating antistics
 */

import React from 'react';
import { CARD_TEMPLATES } from '../types/templates';

interface Props {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  className?: string;
}

const TemplateSelector: React.FC<Props> = ({ 
  selectedTemplate, 
  onTemplateSelect, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Wybierz szablon karty
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Każdy szablon oferuje inny sposób prezentacji danych i perspektywy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARD_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedTemplate === template.id
                ? 'border-accent bg-accent/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Template Icon */}
              <div className="text-2xl">{template.thumbnail}</div>
              
              {/* Template Info */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {template.description}
                </p>
                
                {/* Layout Badge */}
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    template.layout === 'two-column' ? 'bg-blue-100 text-blue-800' :
                    template.layout === 'single-chart' ? 'bg-green-100 text-green-800' :
                    template.layout === 'text-focused' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {template.layout === 'two-column' && 'Dwa wykresy'}
                    {template.layout === 'single-chart' && 'Jeden wykres'}
                    {template.layout === 'text-focused' && 'Tekst'}
                    {template.layout === 'comparison' && 'Porównanie'}
                  </span>
                </div>
              </div>
              
              {/* Selection Indicator */}
              {selectedTemplate === template.id && (
                <div className="text-accent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Podgląd szablonu
          </h4>
          <div className="text-sm text-gray-600">
            {renderTemplatePreview(selectedTemplate)}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Render a text preview of what the template will look like
 */
const renderTemplatePreview = (templateId: string): string => {
  const template = CARD_TEMPLATES.find(t => t.id === templateId);
  if (!template) return '';

  switch (template.layout) {
    case 'two-column':
      return 'Karta będzie zawierać dwa wykresy kołowe - jeden pokazujący perspektywę antystyki (np. "92% wypadków powodują trzeźwi kierowcy") oraz drugi z danymi źródłowymi pokazującymi szczegółowy podział przyczyn.';
    
    case 'single-chart':
      return 'Karta będzie zawierać jeden duży wykres kołowy z pełną analizą danych, pokazujący wszystkie kategorie i ich procentowe udziały.';
    
    case 'text-focused':
      return 'Karta będzie skupiona na tekście z wyróżnioną główną statystyką (np. duża liczba procentowa), minimalizując elementy wizualne.';
    
    case 'comparison':
      return 'Karta będzie zawierać dwa wykresy porównawcze, pokazujące sytuację "przed" i "po" lub porównanie dwóch różnych perspektyw.';
    
    default:
      return 'Szablon będzie prezentować dane w standardowy sposób.';
  }
};

export default TemplateSelector;
