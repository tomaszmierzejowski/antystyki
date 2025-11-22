import React, { useMemo } from 'react';
import type { Statistic } from '../types';
import type { AntisticData, AntisticTemplate } from '../types/templates';
import { CARD_TEMPLATES, CHART_COLORS } from '../types/templates';
import { BarChart, DoughnutChart, ColorfulDataChart, LineChart } from './charts/ChartGenerator';
import { createPerspectiveData, generateSegmentsFromData } from './charts/chartUtils';
import ShareMenu from './ShareMenu';

type ChartMode = 'pie' | 'bar' | 'line';

type SuggestionType = 'bar' | 'pie' | 'line' | 'area' | 'other';

type SuggestionInfo = {
  type: SuggestionType;
  unit?: string;
  points: Array<{ label: string; value: number }>;
};

interface RawPerspectiveData {
  secondaryLabel?: string;
  chartColor?: string;
}

interface RawSourceData {
  segments?: Array<{ label: string; percentage: number }>;
}

interface RawSingleChartData {
  title?: string;
  type?: string;
  segments?: Array<{ label: string; percentage: number }>;
  points?: Array<{ label?: string; value?: number } | Record<string, unknown>>;
  unit?: string;
}

interface RawComparisonChartData {
  title?: string;
  segments?: Array<{ label: string; percentage: number }>;
}

interface RawComparisonData {
  leftChart?: RawComparisonChartData;
  rightChart?: RawComparisonChartData;
}

interface RawStatisticChartMetadata {
  templateId?: string;
  title?: string;
  description?: string;
  source?: string;
  metricValue?: unknown;
  metricUnit?: string;
  metricLabel?: string;
  chartSuggestion?: Record<string, unknown>;
  perspectiveData?: RawPerspectiveData;
  sourceData?: RawSourceData;
  singleChartData?: RawSingleChartData;
  comparisonData?: RawComparisonData;
}

interface StatisticCardProps {
  statistic: Statistic;
  onVote: (statisticId: string, voteType: 'Like' | 'Dislike', remove: boolean) => Promise<void>;
  onConvert?: (statistic: Statistic) => void;
  isBusy?: boolean;
}

const NUMBER_WITH_DECIMALS = /^(?:-)?\d+(?:[.,]\d+)?$/;
const PERCENTAGE_REGEX = /(\d+(?:[.,]\d+)?)/;

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const sanitized = trimmed
      .replace(/[^0-9,.-]/g, '')
      .replace(/,(?=\d{3}(?:\D|$))/g, '') // remove thousands separators
      .replace(',', '.');

    if (!NUMBER_WITH_DECIMALS.test(sanitized)) {
      return undefined;
    }

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const toPercentageValue = (value: number | undefined, unit?: string): number | undefined => {
  if (value === undefined || !Number.isFinite(value)) return undefined;

  const normalizedUnit = unit?.toLowerCase()?.trim();
  let result = value;

  if (normalizedUnit?.includes('%')) {
    if (result <= 1) {
      result *= 100;
    }
  } else if (!normalizedUnit) {
    if (result <= 1) {
      result *= 100;
    }
  }

  return result;
};

const formatValueWithUnit = (value: number, unit?: string): string => {
  const normalizedUnit = unit?.trim();
  const absValue = Number.isFinite(value) ? value : 0;
  const formatted = absValue.toLocaleString('pl-PL', {
    minimumFractionDigits: absValue % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });

  if (!normalizedUnit) {
    return formatted;
  }

  if (normalizedUnit.startsWith('%')) {
    return `${formatted}${normalizedUnit}`;
  }

  return `${formatted} ${normalizedUnit}`;
};

const inferPercentageFromText = (text?: string, unitHint?: string): number | null => {
  if (!text) return null;
  const match = text.match(PERCENTAGE_REGEX);
  if (!match) return null;

  const parsed = parseNumeric(match[1]);
  if (parsed === undefined) return null;

  const normalizedUnit = unitHint?.toLowerCase();
  const following = text.slice(match.index! + match[0].length).trim();
  const hasPercentSuffix = following.startsWith('%');
  const treatedUnit = normalizedUnit ?? (hasPercentSuffix ? '%' : undefined);

  return toPercentageValue(parsed, treatedUnit ?? '%') ?? parsed;
};

const stripPercentagePrefix = (label?: string): string => {
  if (!label) return '';
  const cleaned = label.replace(/^\s*\d+(?:[.,]\d+)?%?\s*/, '').trim();
  return cleaned.length > 0 ? cleaned : label.trim();
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeSimpleSegments = (
  value: unknown
): Array<{ label: string; percentage: number; color?: string }> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const segments: Array<{ label: string; percentage: number; color?: string }> = [];

  value.forEach((segment) => {
    if (!isRecord(segment)) {
      return;
    }

    const label = getTrimmedString(segment['label']);
    const rawPercentage = segment['percentage'];
    const percentage = parseNumeric(rawPercentage);

    if (!label || percentage === undefined) {
      return;
    }

    const colorValue = getTrimmedString(segment['color']);
    const color = colorValue && /^#([0-9a-f]{3}){1,2}$/i.test(colorValue) ? colorValue : undefined;

    segments.push({ label, percentage, color });
  });

  return segments.length ? segments : undefined;
};

const normalizeChartPoints = (value: unknown): Array<{ label: string; value: number }> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const points: Array<{ label: string; value: number }> = [];

  value.forEach((point, index) => {
    if (!isRecord(point)) {
      return;
    }

    const labelCandidate = getTrimmedString(point['label']) ?? getTrimmedString(point['x']);
    const label = labelCandidate ?? `Punkt ${index + 1}`;
    const rawValue = point['value'] ?? point['y'] ?? point['percentage'];
    const numericValue = parseNumeric(rawValue);

    if (numericValue === undefined) {
      return;
    }

    points.push({ label, value: numericValue });
  });

  return points.length ? points : undefined;
};

const normalizeChartModeValue = (value: unknown, fallback: ChartMode): ChartMode => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'line') {
    return 'line';
  }
  if (normalized === 'bar') {
    return 'bar';
  }
  if (normalized === 'pie') {
    return 'pie';
  }

  return fallback;
};

const buildSegmentsFromSuggestion = (suggestion: Record<string, unknown> | undefined, unit?: string) => {
  const rawPoints = (suggestion?.dataPoints as unknown[]) ?? [];

  const entries = rawPoints
    .map((point, index) => {
      if (typeof point !== 'object' || point === null) return undefined;
      const pointRecord = point as Record<string, unknown>;
      const rawValue = parseNumeric(pointRecord.value ?? pointRecord.percentage ?? pointRecord.y);
      if (rawValue === undefined) return undefined;
      const label = (pointRecord.label ?? pointRecord.x ?? `Punkt ${index + 1}`).toString();
      return { label, rawValue };
    })
    .filter((entry): entry is { label: string; rawValue: number } => entry !== undefined && Number.isFinite(entry.rawValue));

  if (!entries.length) {
    return undefined;
  }

  const total = entries.reduce((sum, entry) => sum + Math.abs(entry.rawValue), 0);
  let accumulated = 0;

  const segmentCandidates = total > 0
    ? entries.map((entry, index) => {
      const percent = (Math.abs(entry.rawValue) / total) * 100;
      let rounded = Math.round(percent * 10) / 10;
      if (index === entries.length - 1) {
        rounded = Math.max(0, 100 - accumulated);
      } else {
        accumulated += rounded;
      }
      return {
        label: `${entry.label}: ${formatValueWithUnit(entry.rawValue, unit)}`,
        percentage: rounded,
      };
    })
    : entries.map((entry, index) => ({
      label: `${entry.label}: ${formatValueWithUnit(entry.rawValue, unit)}`,
      percentage: index === 0 ? 100 : 0,
    }));

  return generateSegmentsFromData(segmentCandidates, CHART_COLORS);
};

const buildVisualizationData = (
  statistic: Statistic
): { template: AntisticTemplate; chartData: AntisticData; suggestionInfo: SuggestionInfo } => {
  const metadata = (statistic.chartData ?? {}) as RawStatisticChartMetadata;
  const suggestion = metadata.chartSuggestion;

  const suggestionTypeRaw = typeof suggestion?.type === 'string' ? suggestion.type.toLowerCase() : undefined;
  const suggestionType: SuggestionType = suggestionTypeRaw === 'bar'
    ? 'bar'
    : suggestionTypeRaw === 'line' || suggestionTypeRaw === 'area'
      ? 'line'
      : suggestionTypeRaw === 'pie'
        ? 'pie'
        : 'other';

  const metricUnit = metadata.metricUnit?.trim();

  const suggestionPoints = normalizeChartPoints(suggestion?.dataPoints) ?? [];

  const suggestionSegments = suggestionType === 'bar' || suggestionType === 'line'
    ? undefined
    : buildSegmentsFromSuggestion(suggestion, metricUnit);

  const metadataMetricValue = toPercentageValue(parseNumeric(metadata.metricValue), metricUnit);

  const metricValueFromSuggestion = suggestionType === 'bar'
    ? suggestionPoints.at(-1)?.value
    : suggestionSegments?.length
      ? suggestionSegments[suggestionSegments.length - 1]?.percentage
      : undefined;

  const metricValue = metadataMetricValue
    ?? metricValueFromSuggestion
    ?? inferPercentageFromText(statistic.summary, metricUnit)
    ?? inferPercentageFromText(statistic.description, metricUnit)
    ?? 50;

  const templateIdCandidate = metadata.templateId;
  const templateId = (typeof templateIdCandidate === 'string' && templateIdCandidate.length > 0)
    ? templateIdCandidate
    : suggestionType === 'bar' || suggestionType === 'line'
      ? 'single-chart'
      : suggestionSegments?.length
        ? 'single-chart'
        : 'two-column-default';

  const template = CARD_TEMPLATES.find((t) => t.id === templateId) ?? CARD_TEMPLATES[0];

  const fallbackMainLabel = stripPercentagePrefix(
    typeof metadata.metricLabel === 'string'
      ? metadata.metricLabel
      : suggestionSegments?.length
        ? suggestionSegments[suggestionSegments.length - 1]?.label
        : statistic.summary
  ) || statistic.summary;

  const normalized: AntisticData = {
    templateId,
    title: typeof metadata.title === 'string' && metadata.title.length > 0 ? metadata.title : statistic.title,
    description:
      typeof metadata.description === 'string' && metadata.description.length > 0
        ? metadata.description
        : statistic.summary ?? statistic.description ?? statistic.title,
    source: typeof metadata.source === 'string' && metadata.source.length > 0 ? metadata.source : statistic.sourceUrl,
    perspectiveData: undefined,
    sourceData: undefined,
    singleChartData: undefined,
    textData: undefined,
    comparisonData: undefined,
  };

  const perspectiveMainLabel = `${metricValue.toLocaleString('pl-PL', {
    minimumFractionDigits: metricValue % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })}% ${fallbackMainLabel}`.trim();

  const shouldGeneratePerspective = suggestionType !== 'bar' && suggestionType !== 'line'
    && (template.layout === 'two-column' || template.layout === 'text-focused' || template.layout === 'comparison');

  if (shouldGeneratePerspective) {
    const perspectiveRaw = metadata.perspectiveData;
    const perspectiveSecondaryLabel = perspectiveRaw?.secondaryLabel && perspectiveRaw.secondaryLabel.trim().length > 0
      ? perspectiveRaw.secondaryLabel
      : 'Pozostałe';
    const perspectiveChartColor = perspectiveRaw?.chartColor && perspectiveRaw.chartColor.trim().length > 0
      ? perspectiveRaw.chartColor
      : '#6b7280';

    normalized.perspectiveData = {
      mainPercentage: Math.max(0, Math.min(100, metricValue)),
      mainLabel: perspectiveMainLabel,
      secondaryPercentage: Math.max(0, 100 - Math.max(0, Math.min(100, metricValue))),
      secondaryLabel: perspectiveSecondaryLabel,
      chartColor: perspectiveChartColor,
    };
  }

  if (template.layout === 'two-column' && suggestionType !== 'bar') {
    if (suggestionSegments?.length) {
      normalized.sourceData = { segments: suggestionSegments };
    } else if (metadata.sourceData?.segments) {
      const segments = normalizeSimpleSegments(metadata.sourceData.segments);
      if (segments?.length) {
        normalized.sourceData = {
          segments: generateSegmentsFromData(segments, CHART_COLORS),
        };
      }
    } else {
      normalized.sourceData = {
        segments: generateSegmentsFromData(
          [
            {
              label: fallbackMainLabel,
              percentage: Math.max(0, Math.min(100, metricValue)),
            },
            {
              label: 'Pozostałe',
              percentage: Math.max(0, 100 - Math.max(0, Math.min(100, metricValue))),
            },
          ],
          CHART_COLORS
        ),
      };
    }
  }

  if (template.layout === 'single-chart') {
    if (suggestionType === 'line' && suggestionPoints.length) {
      normalized.singleChartData = {
        title: typeof suggestion?.title === 'string'
          ? (suggestion.title as string)
          : normalized.title,
        type: 'line',
        points: suggestionPoints,
        unit: metricUnit,
      };
    } else if (suggestionSegments?.length) {
      normalized.singleChartData = {
        title: typeof suggestion?.title === 'string'
          ? (suggestion.title as string)
          : normalized.title,
        type: 'pie',
        segments: suggestionSegments,
      };
    } else if (metadata.singleChartData) {
      const singleSegments = normalizeSimpleSegments(metadata.singleChartData.segments);
      const singlePoints = normalizeChartPoints(metadata.singleChartData.points);
      const singleUnit = getTrimmedString(metadata.singleChartData.unit);
      const singleTitle = getTrimmedString(metadata.singleChartData.title) ?? normalized.title;
      const inferredFallback: ChartMode = singlePoints ? 'line' : 'pie';
      const mode = normalizeChartModeValue(metadata.singleChartData.type, inferredFallback);

      normalized.singleChartData = {
        title: singleTitle,
        type: mode,
        segments: singleSegments ? generateSegmentsFromData(singleSegments, CHART_COLORS) : undefined,
        points: singlePoints,
        unit: singleUnit,
      };
    }
  }

  if (template.layout === 'text-focused' && suggestionType !== 'bar') {
    normalized.textData = {
      mainStatistic: perspectiveMainLabel,
      context: normalized.description,
      comparison: normalized.perspectiveData?.secondaryLabel ?? 'Pozostałe',
    };
  }

  if (template.layout === 'comparison' && suggestionType !== 'bar') {
    if (metadata.comparisonData?.leftChart?.segments && metadata.comparisonData?.rightChart?.segments) {
      const leftSegments = normalizeSimpleSegments(metadata.comparisonData.leftChart.segments);
      const rightSegments = normalizeSimpleSegments(metadata.comparisonData.rightChart.segments);

      normalized.comparisonData = {
        leftChart: {
          title: getTrimmedString(metadata.comparisonData.leftChart.title) ?? 'Przed',
          segments: generateSegmentsFromData(leftSegments ?? [], CHART_COLORS),
        },
        rightChart: {
          title: getTrimmedString(metadata.comparisonData.rightChart.title) ?? 'Po',
          segments: generateSegmentsFromData(rightSegments ?? [], CHART_COLORS),
        },
      };
    } else if (suggestionSegments?.length) {
      const half = Math.floor(suggestionSegments.length / 2) || 1;
      normalized.comparisonData = {
        leftChart: {
          title: 'Porównanie A',
          segments: suggestionSegments.slice(0, half),
        },
        rightChart: {
          title: 'Porównanie B',
          segments: suggestionSegments.slice(half),
        },
      };
    }
  }

  const suggestionInfo: SuggestionInfo = {
    type: suggestionType,
    unit: metricUnit,
    points: suggestionPoints,
  };

  return { template, chartData: normalized, suggestionInfo };
};

const renderVisualization = (template: AntisticTemplate, chartData: AntisticData, suggestionInfo: SuggestionInfo) => {
  if (suggestionInfo.type === 'bar' && suggestionInfo.points.length) {
    const maxValue = Math.max(...suggestionInfo.points.map((point) => Math.abs(point.value)), 0);
    const items = suggestionInfo.points.map((point, index) => {
      const baseWidth = maxValue > 0 ? (Math.abs(point.value) / maxValue) * 100 : 0;
      const percentageWidth = point.value === 0 ? 0 : Math.max(5, baseWidth);
      return {
        label: point.label,
        displayValue: formatValueWithUnit(point.value, suggestionInfo.unit),
        percentageWidth,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Porównanie wartości</h4>
        <BarChart items={items} />
      </div>
    );
  }

  if (suggestionInfo.type === 'line' && suggestionInfo.points.length) {
    const points = chartData.singleChartData?.type === 'line' && chartData.singleChartData.points?.length
      ? chartData.singleChartData.points
      : suggestionInfo.points;

    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Trend danych</h4>
        <LineChart points={points} unit={chartData.singleChartData?.unit ?? suggestionInfo.unit} />
      </div>
    );
  }

  switch (template.layout) {
    case 'two-column': {
      const perspectiveSegments = chartData.perspectiveData
        ? createPerspectiveData(
          chartData.perspectiveData.mainPercentage,
          chartData.perspectiveData.mainLabel,
          chartData.perspectiveData.secondaryLabel,
          chartData.perspectiveData.chartColor
        )
        : [];

      return (
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <DoughnutChart segments={perspectiveSegments} />
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Podział źródłowy</h4>
            {chartData.sourceData?.segments?.length ? (
              <ColorfulDataChart segments={chartData.sourceData.segments} showLegend />
            ) : (
              <p className="text-sm text-gray-500">Dodaj dane źródłowe, aby zobaczyć wykres.</p>
            )}
          </div>
        </div>
      );
    }

    case 'single-chart':
      return (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Wykres danych</h4>
          {chartData.singleChartData?.segments?.length ? (
            <ColorfulDataChart segments={chartData.singleChartData.segments} showLegend />
          ) : (
            <p className="text-sm text-gray-500">Dodaj segmenty, aby zobaczyć wykres.</p>
          )}
        </div>
      );

    case 'text-focused':
      return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 text-center">
          <div className="text-4xl font-bold text-gray-900">
            {chartData.textData?.mainStatistic ?? chartData.description}
          </div>
          <p className="text-sm text-gray-600">
            {chartData.textData?.context ?? chartData.title}
          </p>
          <p className="text-xs text-gray-500">
            {chartData.textData?.comparison ?? chartData.source}
          </p>
        </div>
      );

    case 'comparison':
      return (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{chartData.comparisonData?.leftChart.title ?? 'Porównanie 1'}</h4>
            {chartData.comparisonData?.leftChart.segments?.length ? (
              <ColorfulDataChart segments={chartData.comparisonData.leftChart.segments} showLegend />
            ) : (
              <p className="text-sm text-gray-500">Dodaj segmenty dla wykresu „Przed”.</p>
            )}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{chartData.comparisonData?.rightChart.title ?? 'Porównanie 2'}</h4>
            {chartData.comparisonData?.rightChart.segments?.length ? (
              <ColorfulDataChart segments={chartData.comparisonData.rightChart.segments} showLegend />
            ) : (
              <p className="text-sm text-gray-500">Dodaj segmenty dla wykresu „Po”.</p>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

const StatisticCard: React.FC<StatisticCardProps> = ({ statistic, onVote, onConvert, isBusy = false }) => {
  const totalSignals = Math.max(0, statistic.trustPoints) + Math.max(0, statistic.fakePoints);
  const trustPercent = totalSignals > 0 ? Math.round((Math.max(0, statistic.trustPoints) / totalSignals) * 100) : 0;
  const fakePercent = totalSignals > 0 ? Math.max(0, 100 - trustPercent) : 0;

  const { template, chartData, suggestionInfo } = useMemo(() => buildVisualizationData(statistic), [statistic]);
  const visualizationContent = useMemo(
    () => renderVisualization(template, chartData, suggestionInfo),
    [template, chartData, suggestionInfo]
  );
  const visualizationLabel = suggestionInfo.type === 'bar'
    ? 'Wizualizacja: wykres słupkowy'
    : suggestionInfo.type === 'line'
      ? 'Wizualizacja: wykres liniowy'
      : `Szablon: ${template.name}`;

  const handleVote = async (voteType: 'Like' | 'Dislike') => {
    if (isBusy) return;
    const remove = voteType === 'Like' ? statistic.hasLiked : statistic.hasDisliked;
    try {
      await onVote(statistic.id, voteType, remove);
    } catch (error) {
      console.error('Failed to update statistic vote', error);
    }
  };

  const canShare = statistic.status === 'Approved' && Boolean(statistic.publishedAt) && Boolean(statistic.canonicalUrl);
  const shareStatCopy = useMemo(() => {
    const sourceLine = statistic.sourceCitation || statistic.sourceUrl;
    const extraDescription = statistic.description ? `\n${statistic.description}` : '';
    return `${statistic.summary}${extraDescription}\nŹródło: ${sourceLine}`;
  }, [statistic.description, statistic.sourceCitation, statistic.sourceUrl, statistic.summary]);

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 transition-all duration-300 overflow-hidden hover:-translate-y-1 group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
    >
      <div className="p-6 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
            <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200 rounded-full font-medium">Statystyka</span>
            <span className="text-gray-400 dark:text-gray-400">{new Date(statistic.createdAt).toLocaleDateString('pl-PL')}</span>
            {statistic.convertedAntisticId && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-medium">
                Przekształcona w antystyk
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{statistic.title}</h2>
          <p className="text-gray-600 dark:text-gray-200 leading-relaxed text-lg">{statistic.summary}</p>
        </header>

        {statistic.description && (
          <p className="text-sm text-gray-600 dark:text-gray-200 leading-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-600 rounded-lg p-4">
            {statistic.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-300">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100">Źródło:&nbsp;</span>
            <a
              href={statistic.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 transition-colors break-all font-medium"
            >
              {statistic.sourceCitation || statistic.sourceUrl}
            </a>
          </div>
          <div className="text-gray-400 dark:text-gray-400">
            Dodane przez <span className="font-medium text-gray-600 dark:text-gray-100">{statistic.createdBy.username}</span>
          </div>
          <div className="text-gray-400 dark:text-gray-400">Wyświetlenia: {statistic.viewsCount}</div>
        </div>

        {visualizationContent && (
          <section className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-600 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400 dark:text-gray-300">
              <span className="font-semibold text-gray-500 dark:text-gray-200">Podgląd danych</span>
              <span className="text-gray-400 dark:text-gray-300">{visualizationLabel}</span>
            </div>
            {visualizationContent}
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">Poziom zaufania</span>
            <span className="text-gray-500 dark:text-gray-300">
              {totalSignals === 0 ? 'Brak głosów zaufania' : `${trustPercent}% wiarygodne · ${fakePercent}% wątpliwe`}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500" style={{ width: `${trustPercent}%` }} aria-hidden></div>
            <div className="bg-rose-400" style={{ width: `${fakePercent}%` }} aria-hidden></div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-400">
            Głosy zaufania i „fake” zostaną w pełni aktywowane w kolejnej fazie społecznościowej.
          </p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('Like')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${statistic.hasLiked
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>👍</span>
              <span className="text-sm font-medium">{statistic.likeCount}</span>
            </button>
            <button
              onClick={() => handleVote('Dislike')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${statistic.hasDisliked
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>👎</span>
              <span className="text-sm font-medium">{statistic.dislikeCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {canShare && (
              <ShareMenu
                canonicalUrl={statistic.canonicalUrl}
                entityId={statistic.id}
                entityType="statistic"
                title={statistic.title}
                summary={statistic.summary}
                statCopyText={shareStatCopy}
              />
            )}
            <button
              onClick={() => onConvert?.(statistic)}
              disabled={!onConvert}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${onConvert
                ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-sm hover:shadow-md'
                : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                }`}
              type="button"
            >
              Stwórz antystyk
              <span aria-hidden>→</span>
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};

export default StatisticCard;

