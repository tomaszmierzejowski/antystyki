import type { ChartSegment } from '../../types/templates';

export const generateSegmentsFromData = (
  data: Array<{ label: string; percentage: number; color?: string }>,
  colorPalette: string[] = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']
): ChartSegment[] =>
  data.map((item, index) => ({
    label: item.label,
    percentage: item.percentage,
    color: item.color ?? colorPalette[index % colorPalette.length],
  }));

export const createPerspectiveData = (
  mainPercentage: number,
  mainLabel: string,
  secondaryLabel: string = 'Pozostałe',
  color: string = '#6b7280',
  secondaryColor: string = '#e5e7eb'
): ChartSegment[] => [
  {
    label: mainLabel,
    percentage: mainPercentage,
    color,
  },
  {
    label: secondaryLabel,
    percentage: Math.max(0, 100 - mainPercentage),
    color: secondaryColor,
  },
];

