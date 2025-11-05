import type { Statistic } from '../types';
import type { AntisticData } from '../types/templates';
import { CHART_COLORS } from '../types/templates';

type ChartMode = 'pie' | 'bar' | 'line';

interface ChartSuggestionPoint {
  label?: string;
  value?: number;
}

interface StatisticChartPayload {
  chartSuggestion?: {
    type?: string;
    unit?: string;
    dataPoints?: ChartSuggestionPoint[];
  };
  metricValue?: number;
  metricUnit?: string;
}

type StatisticLike = Partial<Pick<Statistic, 'title' | 'summary' | 'description' | 'sourceUrl' | 'chartData'>>;

const normaliseChartMode = (rawType?: string | null): ChartMode => {
  switch (rawType?.toLowerCase()) {
    case 'bar':
      return 'bar';
    case 'line':
    case 'area':
      return 'line';
    default:
      return 'pie';
  }
};

const sanitisePoints = (points: ChartSuggestionPoint[] | undefined): Array<{ label: string; value: number }> => {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .map((point, index) => {
      const numericValue = typeof point.value === 'number' && Number.isFinite(point.value)
        ? point.value
        : Number.parseFloat(String(point.value ?? ''));

      if (!Number.isFinite(numericValue)) {
        return undefined;
      }

      const label = typeof point.label === 'string' && point.label.trim().length > 0
        ? point.label.trim()
        : `Punkt ${index + 1}`;

      return { label, value: numericValue };
    })
    .filter((point): point is { label: string; value: number } => point !== undefined);
};

const toPieSegments = (points: Array<{ label: string; value: number }>): Array<{ label: string; percentage: number }> => {
  if (!points.length) {
    return [];
  }

  const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  if (total <= 0) {
    return points.map((point) => ({ label: point.label, percentage: point.value }));
  }

  let accumulated = 0;
  return points.map((point, index) => {
    const base = Math.max(0, point.value);
    let percentage = (base / total) * 100;
    percentage = Math.round(percentage * 10) / 10;

    if (index === points.length - 1) {
      percentage = Math.max(0, 100 - accumulated);
    } else {
      accumulated += percentage;
    }

    return {
      label: point.label,
      percentage,
    };
  });
};

const toNumericSegments = (points: Array<{ label: string; value: number }>) =>
  points.map((point) => ({ label: point.label, percentage: point.value }));

const applyColors = (
  segments: Array<{ label: string; percentage: number }>
): Array<{ label: string; percentage: number; color: string }> =>
  segments.map((segment, index) => ({
    ...segment,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

export const buildAntisticPrefillFromStatistic = (
  statistic: StatisticLike | null | undefined
): Partial<AntisticData> => {
  const chartPayload = (statistic?.chartData ?? {}) as StatisticChartPayload;
  const suggestion = chartPayload.chartSuggestion;
  const chartMode = normaliseChartMode(suggestion?.type);
  const points = sanitisePoints(suggestion?.dataPoints);

  const baseSegments = chartMode === 'pie' ? toPieSegments(points) : toNumericSegments(points);
  const segments = applyColors(baseSegments);

  const unit = suggestion?.unit?.trim().length ? suggestion.unit.trim() : chartPayload.metricUnit;

  const baseTitle = statistic?.title ?? '';
  const baseSummary = statistic?.summary ?? statistic?.description ?? '';
  const baseSource = statistic?.sourceUrl ?? '';

  const singleChartData = {
    type: chartMode,
    title: baseTitle || 'Analiza danych',
    segments,
    points: chartMode === 'pie' ? undefined : points,
    unit: chartMode === 'pie' ? (unit ?? '%') : unit,
  };

  const sourceData = {
    type: chartMode,
    segments,
    points: chartMode === 'pie' ? undefined : points,
    unit: chartMode === 'pie' ? (unit ?? '%') : unit,
  };

  return {
    templateId: 'single-chart',
    title: baseTitle,
    description: baseSummary,
    source: baseSource,
    singleChartData,
    sourceData,
  };
};

export const buildAntisticPrefillFromSnapshot = (
  snapshot: {
    title?: string;
    summary?: string;
    description?: string | null;
    sourceUrl?: string;
    chartData?: Statistic['chartData'];
  } | null | undefined
): Partial<AntisticData> =>
  buildAntisticPrefillFromStatistic({
    title: snapshot?.title ?? '',
    summary: snapshot?.summary ?? '',
    description: snapshot?.description ?? undefined,
    sourceUrl: snapshot?.sourceUrl ?? '',
    chartData: snapshot?.chartData,
  });


