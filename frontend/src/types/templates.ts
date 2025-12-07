/**
 * Card Template System
 * 
 * This file defines the different card templates available for generating antistics
 */

export interface ChartSegment {
  label: string;
  percentage: number;
  color: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AntisticTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // CSS class or emoji for preview
  layout: 'two-column' | 'single-chart' | 'text-focused' | 'comparison';
}

export interface AntisticData {
  // Basic info
  title: string;
  description: string;
  source: string;

  // Template-specific data
  templateId: string;

  // Two-column template data
  perspectiveData?: {
    mainPercentage: number;
    mainLabel: string;
    secondaryPercentage: number;
    secondaryLabel: string;
    chartColor: string;
    type?: 'pie' | 'bar' | 'line';
    unit?: string;
    mainColor?: string;
    secondaryColor?: string;
  };

  sourceData?: {
    type?: 'pie' | 'bar' | 'line';
    segments?: ChartSegment[];
    points?: ChartPoint[];
    unit?: string;
  };

  // Single chart template data
  singleChartData?: {
    title: string;
    type?: 'pie' | 'line' | 'bar';
    segments?: ChartSegment[];
    points?: ChartPoint[];
    unit?: string;
  };

  // Text-focused template data
  textData?: {
    mainStatistic: string;
    context: string;
    comparison?: string;
  };

  // Comparison template data
  comparisonData?: {
    leftChart: {
      title: string;
      type?: 'pie' | 'bar' | 'line';
      segments?: ChartSegment[];
      points?: ChartPoint[];
      unit?: string;
    };
    rightChart: {
      title: string;
      type?: 'pie' | 'bar' | 'line';
      segments?: ChartSegment[];
      points?: ChartPoint[];
      unit?: string;
    };
  };
}

// Available templates
export const CARD_TEMPLATES: AntisticTemplate[] = [
  {
    id: 'two-column-default',
    name: 'Dwa wykresy (domyślny)',
    description: 'Wykres perspektywy antystyki + wykres danych źródłowych',
    thumbnail: '📊',
    layout: 'two-column'
  },
  {
    id: 'single-chart',
    name: 'Pojedynczy wykres',
    description: 'Jeden wykres kołowy z pełną analizą danych',
    thumbnail: '🥧',
    layout: 'single-chart'
  },
  {
    id: 'text-focused',
    name: 'Tekst z statystyką',
    description: 'Głównie tekst z wyróżnioną statystyką',
    thumbnail: '📝',
    layout: 'text-focused'
  },
  {
    id: 'comparison',
    name: 'Porównanie',
    description: 'Dwa wykresy porównawcze',
    thumbnail: '⚖️',
    layout: 'comparison'
  }
];

// Default color palette for charts
export const CHART_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange  
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#6b7280', // Gray
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
];

export default CARD_TEMPLATES;
