/**
 * Chart Data Input Component
 * 
 * Allows users to input data for their charts based on selected template
 */

import React, { useState } from 'react';
import type { AntisticData, ChartSegment } from '../types/templates';
import { generateSegmentsFromData, createPerspectiveData } from './charts/ChartGenerator';

interface Props {
  templateId: string;
  onDataChange: (data: Partial<AntisticData>) => void;
  className?: string;
}

const ChartDataInput: React.FC<Props> = ({ templateId, onDataChange, className = "" }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: '',
    mainPercentage: 92.4,
    mainLabel: 'wypadków powodują trzeźwi kierowcy',
    secondaryLabel: 'Jazda po chodniku',
    sourceSegments: [
      { label: 'Jazda po chodniku', percentage: 7 },
      { label: 'Nieostrożna jazda', percentage: 28 },
      { label: 'Nieuważna jazda', percentage: 25 },
      { label: 'Niewłaściwa pozycja', percentage: 18 },
      { label: 'Zdrowy rozsądek', percentage: 14 },
      { label: 'Pozostałe', percentage: 8 },
    ]
  });

  // Update form data and notify parent
  const updateFormData = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    
    // Generate chart data based on template
    const chartData = generateChartData(templateId, newData);
    onDataChange(chartData);
  };

  // Generate chart data based on template
  const generateChartData = (template: string, data: typeof formData): Partial<AntisticData> => {
    const baseData = {
      title: data.title,
      description: data.description,
      source: data.source || 'antystyki.pl'
    };

    switch (template) {
      case 'two-column-default':
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage: data.mainPercentage,
            mainLabel: `${data.mainPercentage}% ${data.mainLabel}`,
            secondaryPercentage: 100 - data.mainPercentage,
            secondaryLabel: data.secondaryLabel,
            chartColor: '#6b7280'
          },
          sourceData: {
            segments: generateSegmentsFromData(data.sourceSegments)
          }
        };

      case 'single-chart':
        return {
          ...baseData,
          sourceData: {
            segments: generateSegmentsFromData(data.sourceSegments)
          }
        };

      case 'text-focused':
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage: data.mainPercentage,
            mainLabel: `${data.mainPercentage}% ${data.mainLabel}`,
            secondaryPercentage: 100 - data.mainPercentage,
            secondaryLabel: data.secondaryLabel,
            chartColor: '#6b7280'
          }
        };

      case 'comparison':
        return {
          ...baseData,
          sourceData: {
            segments: generateSegmentsFromData(data.sourceSegments)
          },
          comparisonData: {
            leftChart: {
              title: 'Przed',
              segments: generateSegmentsFromData(data.sourceSegments)
            },
            rightChart: {
              title: 'Po',
              segments: createPerspectiveData(data.mainPercentage, `${data.mainPercentage}% ${data.mainLabel}`)
            }
          }
        };

      default:
        return baseData;
    }
  };

  // Add new source segment
  const addSourceSegment = () => {
    const newSegments = [...formData.sourceSegments, { label: '', percentage: 0 }];
    updateFormData({ sourceSegments: newSegments });
  };

  // Update source segment
  const updateSourceSegment = (index: number, field: 'label' | 'percentage', value: string | number) => {
    const newSegments = [...formData.sourceSegments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    updateFormData({ sourceSegments: newSegments });
  };

  // Remove source segment
  const removeSourceSegment = (index: number) => {
    const newSegments = formData.sourceSegments.filter((_, i) => i !== index);
    updateFormData({ sourceSegments: newSegments });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informacje podstawowe
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tytuł antystyki
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="np. Wypadki drogowe - kto naprawdę je powoduje?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis kontekstu
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Wyjaśnij kontekst i znaczenie tej statystyki..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Źródło danych
          </label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => updateFormData({ source: e.target.value })}
            placeholder="np. WHO Global Status Report"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Perspective Data (for templates that need it) */}
      {(templateId === 'two-column-default' || templateId === 'text-focused' || templateId === 'comparison') && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Perspektywa antystyki
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Główny procent
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.mainPercentage}
                onChange={(e) => updateFormData({ mainPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis głównej statystyki
              </label>
              <input
                type="text"
                value={formData.mainLabel}
                onChange={(e) => updateFormData({ mainLabel: e.target.value })}
                placeholder="np. wypadków powodują trzeźwi kierowcy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis pozostałej części
            </label>
            <input
              type="text"
              value={formData.secondaryLabel}
              onChange={(e) => updateFormData({ secondaryLabel: e.target.value })}
              placeholder="np. Jazda po chodniku"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
      )}

      {/* Source Data Segments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Dane źródłowe
          </h3>
          <button
            onClick={addSourceSegment}
            className="px-3 py-1 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
          >
            + Dodaj kategorię
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.sourceSegments.map((segment, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  value={segment.label}
                  onChange={(e) => updateSourceSegment(index, 'label', e.target.value)}
                  placeholder="Nazwa kategorii"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              
              <div className="w-20">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={segment.percentage}
                  onChange={(e) => updateSourceSegment(index, 'percentage', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              
              <span className="text-sm text-gray-500">%</span>
              
              {formData.sourceSegments.length > 1 && (
                <button
                  onClick={() => removeSourceSegment(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Total percentage indicator */}
        <div className="text-sm text-gray-600">
          Suma: {formData.sourceSegments.reduce((sum, seg) => sum + seg.percentage, 0).toFixed(1)}%
          {Math.abs(formData.sourceSegments.reduce((sum, seg) => sum + seg.percentage, 0) - 100) > 0.1 && (
            <span className="text-red-500 ml-2">(Powinno wynosić 100%)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartDataInput;
