import React, { useMemo } from 'react';
import type { Statistic } from '../types';
import type { AntisticData, AntisticTemplate } from '../types/templates';
import { CARD_TEMPLATES, CHART_COLORS } from '../types/templates';
import { BarChart, DoughnutChart, ColorfulDataChart, LineChart, createPerspectiveData, generateSegmentsFromData } from './charts/ChartGenerator';

type SuggestionType = 'bar' | 'pie' | 'line' | 'area' | 'other';

type SuggestionInfo = {
  type: SuggestionType;
  unit?: string;
  points: Array<{ label: string; value: number }>;
};

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
        let percent = (Math.abs(entry.rawValue) / total) * 100;
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
  const raw = (statistic.chartData ?? {}) as Record<string, unknown>;
  const metadata = raw as Record<string, unknown>;
  const suggestion = metadata['chartSuggestion'] as Record<string, unknown> | undefined;

  const suggestionTypeRaw = typeof suggestion?.type === 'string' ? (suggestion.type as string).toLowerCase() : undefined;
  const suggestionType: SuggestionType = suggestionTypeRaw === 'bar'
    ? 'bar'
    : suggestionTypeRaw === 'line' || suggestionTypeRaw === 'area'
      ? 'line'
      : suggestionTypeRaw === 'pie'
        ? 'pie'
        : 'other';

  const metricUnit = typeof metadata['metricUnit'] === 'string' ? (metadata['metricUnit'] as string) : undefined;

  const suggestionPoints = Array.isArray(suggestion?.dataPoints)
    ? (suggestion!.dataPoints as unknown[])
        .map((point, index) => {
          if (typeof point !== 'object' || point === null) return undefined;
          const pointRecord = point as Record<string, unknown>;
          const rawValue = parseNumeric(pointRecord.value ?? pointRecord.y ?? pointRecord.percentage);
          if (rawValue === undefined) return undefined;
          const label = (pointRecord.label ?? pointRecord.x ?? `Punkt ${index + 1}`).toString();
          return { label, value: rawValue };
        })
        .filter((entry): entry is { label: string; value: number } => entry !== undefined && Number.isFinite(entry.value))
    : [];

  const suggestionSegments = suggestionType === 'bar' || suggestionType === 'line'
    ? undefined
    : buildSegmentsFromSuggestion(suggestion, metricUnit);

  const metadataMetricValue = toPercentageValue(
    parseNumeric(metadata['metricValue']),
    metricUnit
  );

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

  const templateId = (typeof raw.templateId === 'string' && raw.templateId.length > 0)
    ? raw.templateId
    : suggestionType === 'bar' || suggestionType === 'line'
      ? 'single-chart'
      : suggestionSegments?.length
        ? 'single-chart'
        : 'two-column-default';

  const template = CARD_TEMPLATES.find((t) => t.id === templateId) ?? CARD_TEMPLATES[0];

  const fallbackMainLabel = stripPercentagePrefix(
    typeof metadata['metricLabel'] === 'string'
      ? (metadata['metricLabel'] as string)
      : suggestionSegments?.length
        ? suggestionSegments[suggestionSegments.length - 1]?.label
        : statistic.summary
  ) || statistic.summary;

  const normalized: AntisticData = {
    templateId,
    title: typeof raw.title === 'string' && raw.title.length > 0 ? raw.title : statistic.title,
    description:
      typeof raw.description === 'string' && raw.description.length > 0
        ? raw.description
        : statistic.summary ?? statistic.description ?? statistic.title,
    source: typeof raw.source === 'string' && raw.source.length > 0 ? raw.source : statistic.sourceUrl,
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
    normalized.perspectiveData = {
      mainPercentage: Math.max(0, Math.min(100, metricValue)),
      mainLabel: perspectiveMainLabel,
      secondaryPercentage: Math.max(0, 100 - Math.max(0, Math.min(100, metricValue))),
      secondaryLabel:
        (typeof raw === 'object' && raw && (raw as Record<string, unknown>).perspectiveData
          && typeof (raw as any).perspectiveData?.secondaryLabel === 'string'
          && (raw as any).perspectiveData.secondaryLabel.length > 0
          ? (raw as any).perspectiveData.secondaryLabel
          : 'Pozostałe'),
      chartColor:
        (typeof raw === 'object' && raw && (raw as Record<string, unknown>).perspectiveData
          && typeof (raw as any).perspectiveData?.chartColor === 'string'
          ? (raw as any).perspectiveData.chartColor
          : '#6b7280'),
    };
  }

  if (template.layout === 'two-column' && suggestionType !== 'bar') {
    if (suggestionSegments?.length) {
      normalized.sourceData = { segments: suggestionSegments };
    } else if ((raw as any).sourceData?.segments) {
      normalized.sourceData = {
        segments: generateSegmentsFromData(
          ((raw as any).sourceData.segments as Array<{ label: string; percentage: number }>) ?? [],
          CHART_COLORS
        ),
      };
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
    } else if ((raw as any).singleChartData?.segments || (raw as any).singleChartData?.points) {
      const rawSingle = (raw as any).singleChartData;
      normalized.singleChartData = {
        title: rawSingle?.title ?? normalized.title,
        type: rawSingle?.type ?? (rawSingle?.points ? 'line' : 'pie'),
        segments: rawSingle?.segments
          ? generateSegmentsFromData(
              (rawSingle.segments as Array<{ label: string; percentage: number }>) ?? [],
              CHART_COLORS
            )
          : undefined,
        points: Array.isArray(rawSingle?.points)
          ? (rawSingle.points as Array<{ label: string; value: number }>).map((point, index) => ({
              label: typeof point.label === 'string' && point.label.length > 0 ? point.label : `Punkt ${index + 1}`,
              value: typeof point.value === 'number' ? point.value : Number.parseFloat(String(point.value)) || 0,
            }))
          : undefined,
        unit: rawSingle?.unit,
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
    if ((raw as any).comparisonData?.leftChart?.segments && (raw as any).comparisonData?.rightChart?.segments) {
      normalized.comparisonData = {
        leftChart: {
          title: (raw as any).comparisonData.leftChart.title ?? 'Przed',
          segments: generateSegmentsFromData(
            ((raw as any).comparisonData.leftChart.segments as Array<{ label: string; percentage: number }>) ?? [],
            CHART_COLORS
          ),
        },
        rightChart: {
          title: (raw as any).comparisonData.rightChart.title ?? 'Po',
          segments: generateSegmentsFromData(
            ((raw as any).comparisonData.rightChart.segments as Array<{ label: string; percentage: number }>) ?? [],
            CHART_COLORS
          ),
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

  return (
    <article className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">Statystyka</span>
            <span className="text-gray-400">{new Date(statistic.createdAt).toLocaleDateString('pl-PL')}</span>
            {statistic.convertedAntisticId && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px]">
                Przekształcona w antystyk
              </span>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">{statistic.title}</h2>
          <p className="text-gray-700 leading-relaxed">{statistic.summary}</p>
        </header>

        {statistic.description && (
          <p className="text-sm text-gray-600 leading-6 bg-gray-50 border border-gray-100 rounded-lg p-4">
            {statistic.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">Źródło:&nbsp;</span>
            <a
              href={statistic.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {statistic.sourceCitation || statistic.sourceUrl}
            </a>
          </div>
          <div className="text-gray-500">
            Dodane przez <span className="font-medium text-gray-700">{statistic.createdBy.username}</span>
          </div>
          <div className="text-gray-500">Wyświetlenia: {statistic.viewsCount}</div>
        </div>

        {visualizationContent && (
          <section className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
              <span className="font-semibold text-gray-700">Podgląd danych</span>
              <span className="text-gray-400">{visualizationLabel}</span>
            </div>
            {visualizationContent}
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800">Poziom zaufania</span>
            <span className="text-gray-500">
              {totalSignals === 0 ? 'Brak głosów zaufania' : `${trustPercent}% wiarygodne · ${fakePercent}% wątpliwe`}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500" style={{ width: `${trustPercent}%` }} aria-hidden></div>
            <div className="bg-rose-400" style={{ width: `${fakePercent}%` }} aria-hidden></div>
          </div>
          <p className="text-xs text-gray-500">
            Głosy zaufania i „fake” zostaną w pełni aktywowane w kolejnej fazie społecznościowej.
          </p>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('Like')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                statistic.hasLiked
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
              } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>👍</span>
              <span className="text-sm font-medium">{statistic.likeCount}</span>
            </button>
            <button
              onClick={() => handleVote('Dislike')}
              disabled={isBusy}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                statistic.hasDisliked
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'text-gray-700 border-gray-200 hover:border-rose-400 hover:text-rose-600'
              } ${isBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>👎</span>
              <span className="text-sm font-medium">{statistic.dislikeCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onConvert?.(statistic)}
              disabled={!onConvert}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                onConvert
                  ? 'text-gray-800 bg-gray-100 hover:bg-gray-200'
                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
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

