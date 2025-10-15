/**
 * Template Showcase Component
 * 
 * Demonstrates different card templates with example data
 * Useful for testing and showing template capabilities
 */

import React, { useState } from 'react';
import AntisticCard from './AntisticCard';
import TemplateSelector from './TemplateSelector';
import ChartDataInput from './ChartDataInput';
import type { Antistic } from '../types';
import type { AntisticData } from '../types/templates';

/**
 * Example antistic data for showcasing
 */
const EXAMPLE_ANTISTIC: Antistic = {
  id: 'example-1',
  title: 'Wypadki drogowe - kto naprawdę je powoduje?',
  reversedStatistic: 'Podczas gdy media skupiają się na pijanym kierowcy, większość wypadków drogowych powodują trzeźwi kierowcy.',
  originalStatistic: 'WHO Global Status Report',
  likesCount: 312,
  viewsCount: 1247,
  createdAt: new Date().toISOString(),
  user: {
    id: 'user-1',
    username: 'antystyk_creator',
    email: 'creator@antystyki.pl'
  },
  categories: [
    { id: 'cat-1', namePl: 'Transport', nameEn: 'Transport' },
    { id: 'cat-2', namePl: 'Bezpieczeństwo', nameEn: 'Safety' }
  ],
  backgroundImageKey: 'default'
};

/**
 * Example data for different templates
 */
const EXAMPLE_DATA: Record<string, Partial<AntisticData>> = {
  'two-column-default': {
    title: 'Wypadki drogowe - kto naprawdę je powoduje?',
    description: 'Podczas gdy media skupiają się na pijanym kierowcy, większość wypadków drogowych powodują trzeźwi kierowcy.',
    source: 'WHO Global Status Report',
    perspectiveData: {
      mainPercentage: 92.4,
      mainLabel: '92.4% wypadków powodują trzeźwi kierowcy',
      secondaryPercentage: 7.6,
      secondaryLabel: 'Jazda po chodniku',
      chartColor: '#6b7280'
    },
    sourceData: {
      segments: [
        { label: 'Jazda po chodniku', percentage: 7, color: '#ef4444' },
        { label: 'Nieostrożna jazda', percentage: 28, color: '#f97316' },
        { label: 'Nieuważna jazda', percentage: 25, color: '#3b82f6' },
        { label: 'Niewłaściwa pozycja', percentage: 18, color: '#10b981' },
        { label: 'Zdrowy rozsądek', percentage: 14, color: '#8b5cf6' },
        { label: 'Pozostałe', percentage: 8, color: '#eab308' },
      ]
    }
  },
  
  'single-chart': {
    title: 'Emisje CO₂ - szczegółowy podział',
    description: 'Energia dominuje w emisjach, ale transport nie jest głównym winowajcą.',
    source: 'IPCC Climate Change Report',
    sourceData: {
      segments: [
        { label: 'Energia', percentage: 35, color: '#1f2937' },
        { label: 'Przemysł', percentage: 21, color: '#f97316' },
        { label: 'Transport', percentage: 16, color: '#3b82f6' },
        { label: 'Rolnictwo', percentage: 14, color: '#22c55e' },
        { label: 'Budynki', percentage: 10, color: '#eab308' },
        { label: 'Inne', percentage: 4, color: '#8b5cf6' },
      ]
    }
  },
  
  'text-focused': {
    title: '84% emisji CO₂ to inne sektory niż transport',
    description: 'Podczas gdy debaty klimatyczne często koncentrują się na transporcie, większość emisji pochodzi z innych sektorów.',
    source: 'IPCC Climate Change Report',
    perspectiveData: {
      mainPercentage: 84,
      mainLabel: 'emisji CO₂ to inne sektory niż transport',
      secondaryPercentage: 16,
      secondaryLabel: 'Transport',
      chartColor: '#6b7280'
    }
  },
  
  'comparison': {
    title: 'Zmiany w emisjach - przed i po',
    description: 'Porównanie emisji CO₂ przed i po wprowadzeniu nowych regulacji.',
    source: 'Environmental Agency Report',
    sourceData: {
      segments: [
        { label: 'Energia', percentage: 40, color: '#1f2937' },
        { label: 'Transport', percentage: 25, color: '#3b82f6' },
        { label: 'Przemysł', percentage: 20, color: '#f97316' },
        { label: 'Inne', percentage: 15, color: '#6b7280' },
      ]
    },
    comparisonData: {
      leftChart: {
        title: 'Przed regulacjami',
        segments: [
          { label: 'Energia', percentage: 40, color: '#1f2937' },
          { label: 'Transport', percentage: 25, color: '#3b82f6' },
          { label: 'Przemysł', percentage: 20, color: '#f97316' },
          { label: 'Inne', percentage: 15, color: '#6b7280' },
        ]
      },
      rightChart: {
        title: 'Po regulacjach',
        segments: [
          { label: 'Energia', percentage: 35, color: '#1f2937' },
          { label: 'Transport', percentage: 20, color: '#3b82f6' },
          { label: 'Przemysł', percentage: 18, color: '#f97316' },
          { label: 'Inne', percentage: 27, color: '#6b7280' },
        ]
      }
    }
  }
};

const TemplateShowcase: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('two-column-default');
  const [customData, setCustomData] = useState<Partial<AntisticData>>({});

  const currentData = customData && Object.keys(customData).length > 0 
    ? customData 
    : EXAMPLE_DATA[selectedTemplate] || {};

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Szablony kart Antystyków
        </h1>
        <p className="text-lg text-gray-600">
          Wybierz szablon i dostosuj dane, aby stworzyć idealną kartę
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Template Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
            />
          </div>

          {/* Data Input */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ChartDataInput
              templateId={selectedTemplate}
              onDataChange={setCustomData}
            />
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Podgląd karty
            </h3>
            <div className="max-w-md mx-auto">
              <AntisticCard
                antistic={EXAMPLE_ANTISTIC}
                templateId={selectedTemplate}
                customData={currentData}
              />
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Informacje o szablonie
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>ID:</strong> {selectedTemplate}</p>
              <p><strong>Layout:</strong> {EXAMPLE_DATA[selectedTemplate] ? 'Z przykładowymi danymi' : 'Z niestandardowymi danymi'}</p>
              <p><strong>Wykresy:</strong> {
                selectedTemplate === 'two-column-default' ? 'Dwa wykresy (perspektywa + źródło)' :
                selectedTemplate === 'single-chart' ? 'Jeden wykres' :
                selectedTemplate === 'text-focused' ? 'Tekst z wyróżnioną statystyką' :
                selectedTemplate === 'comparison' ? 'Dwa wykresy porównawcze' :
                'Nieznany'
              }</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Jak używać systemu szablonów
        </h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>1. <strong>Wybierz szablon</strong> - Kliknij na jeden z dostępnych szablonów</p>
          <p>2. <strong>Wprowadź dane</strong> - Uzupełnij pola w sekcji "Dane źródłowe"</p>
          <p>3. <strong>Podgląd</strong> - Zobacz jak będzie wyglądać Twoja karta</p>
          <p>4. <strong>Dostosuj</strong> - Zmieniaj wartości i obserwuj zmiany w czasie rzeczywistym</p>
          <p>5. <strong>Zapisz</strong> - Gdy jesteś zadowolony, zapisz antystykę</p>
        </div>
      </div>
    </div>
  );
};

export default TemplateShowcase;
