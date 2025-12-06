import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Antistic, AntisticChartData } from '../types';
import type { AntisticData, ChartPoint, ChartSegment } from '../types/templates';
import { CARD_TEMPLATES, CHART_COLORS } from '../types/templates';
import { ColorfulDataChart, LineChart, BarChart } from './charts/ChartGenerator';
import { createPerspectiveData } from './charts/chartUtils';
import CommentsSection from './CommentsSection';
import { useLike } from '../hooks/useLike';
import { useAuth } from '../context/useAuth';
import AdminActions from './AdminActions';
import ShareMenu from './ShareMenu';

type ChartMode = 'pie' | 'bar' | 'line';

type ComparisonData = NonNullable<AntisticData['comparisonData']>;

type ChartDefinition =
  | NonNullable<AntisticData['singleChartData']>
  | NonNullable<AntisticData['sourceData']>
  | ComparisonData['leftChart']
  | ComparisonData['rightChart'];

interface NormalizedChart {
  type?: ChartMode;
  segments?: ChartSegment[];
  points?: ChartPoint[];
  unit?: string;
}

/**
 * AntisticCard Component - Template-based card generation
 * 
 * Supports multiple templates:
 * - Two-column (default): Perspective chart + source data chart
 * - Single chart: One comprehensive chart
 * - Text-focused: Mainly text with highlighted statistics
 * - Comparison: Two comparative charts
 */

interface Props {
  antistic: Antistic;
  templateId?: string;
  customData?: Partial<AntisticData>;
  onAdminAction?: () => void;
  onCategoryClick?: (categoryId: string) => void;
}

const AntisticCard: React.FC<Props> = ({
  antistic,
  templateId = 'two-column-default',
  customData,
  onAdminAction,
  onCategoryClick
}) => {
  const [commentsCount, setCommentsCount] = useState(antistic.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const { likesCount, isLiked, isLoading: likeLoading, toggleLike } = useLike({
    antisticId: antistic.id,
    initialLikesCount: antistic.likesCount,
    initialIsLiked: antistic.isLikedByCurrentUser
  });
  const { user } = useAuth();
  const isOwner = user?.id === antistic.user.id;
  const isModerator = user?.role === 'Admin' || user?.role === 'Moderator';
  const canEdit = isOwner || isModerator;

  // Check if post is new (within last 48 hours)
  const isNew = new Date(antistic.createdAt).getTime() > Date.now() - 48 * 60 * 60 * 1000;

  // Check if post is trending (high likes in recent time)
  const isTrending =
    likesCount > 10 && new Date(antistic.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Determine template to use - prioritize backend data, then prop, then default
  const actualTemplateId = antistic.templateId || templateId || 'two-column-default';
  const template = CARD_TEMPLATES.find(t => t.id === actualTemplateId) || CARD_TEMPLATES[0];

  const normalizePerspective = (p?: AntisticData['perspectiveData']) => {
    if (!p) return undefined;
    return {
      ...p,
      type: p.type ?? 'pie',
      unit: p.unit ?? (p.type && p.type !== 'pie' ? '' : undefined),
    };
  };

  // Generate chart data based on template and actual data from backend
  const getChartData = (): Partial<AntisticData> => {
    // If custom data is provided (for preview), use it
    if (customData) {
      return {
        perspectiveData: normalizePerspective(customData.perspectiveData),
        sourceData: customData.sourceData,
        singleChartData: customData.singleChartData,
        textData: customData.textData,
        comparisonData: customData.comparisonData,
        title: customData.title || antistic.title,
        description: customData.description || antistic.reversedStatistic,
        source: customData.source || 'antystyki.pl'
      };
    }

    // Use actual data from backend if available
    if (antistic.chartData) {
      const backendData = antistic.chartData as AntisticChartData;
      return {
        perspectiveData: normalizePerspective(backendData.perspectiveData),
        sourceData: backendData.sourceData as AntisticData['sourceData'],
        singleChartData: backendData.singleChartData as AntisticData['singleChartData'],
        textData: backendData.textData,
        comparisonData: backendData.comparisonData,
        title: antistic.title,
        description: antistic.reversedStatistic,
        source: antistic.sourceUrl || 'antystyki.pl'
      };
    }

    // Generate template-specific data based on the template type
    const percentageMatch = antistic.reversedStatistic.match(/(\d+(?:\.\d+)?)%/);
    const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 50;

    const baseData = {
      title: antistic.title,
      description: antistic.reversedStatistic,
      source: antistic.sourceUrl || 'antystyki.pl'
    };

    // Generate data based on template layout
    switch (template.layout) {
      case 'two-column':
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage: percentage,
            mainLabel: antistic.reversedStatistic,
            secondaryPercentage: 100 - percentage,
            secondaryLabel: 'Pozostałe',
            chartColor: '#6b7280',
            type: 'pie',
          },
          sourceData: {
            type: 'pie',
            segments: [
              { label: 'Główna kategoria', percentage: percentage, color: '#FF6A00' },
              { label: 'Pozostałe kategorie', percentage: 100 - percentage, color: '#6b7280' }
            ]
          }
        };

      case 'single-chart':
        return {
          ...baseData,
          singleChartData: {
            type: 'pie',
            title: antistic.title,
            segments: [
              { label: 'Główna kategoria', percentage: percentage, color: '#FF6A00' },
              { label: 'Druga kategoria', percentage: Math.min(30, 100 - percentage), color: '#3b82f6' },
              { label: 'Pozostałe', percentage: Math.max(10, 100 - percentage - 30), color: '#6b7280' }
            ]
          }
        };

      case 'text-focused':
        return {
          ...baseData,
          textData: {
            mainStatistic: antistic.reversedStatistic,
            context: antistic.title,
            comparison: `To stanowi ${percentage}% wszystkich przypadków`
          }
        };

      case 'comparison':
        return {
          ...baseData,
          comparisonData: {
            leftChart: {
              title: 'Przed',
              type: 'pie',
              segments: [
                { label: 'Kategoria A', percentage: percentage, color: '#ef4444' },
                { label: 'Kategoria B', percentage: 100 - percentage, color: '#6b7280' }
              ]
            },
            rightChart: {
              title: 'Po',
              type: 'pie',
              segments: [
                { label: 'Kategoria A', percentage: Math.max(10, percentage - 20), color: '#22c55e' },
                { label: 'Kategoria B', percentage: Math.min(90, 100 - percentage + 20), color: '#6b7280' }
              ]
            }
          }
        };

      default:
        // Fallback to two-column
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage: percentage,
            mainLabel: antistic.reversedStatistic,
            secondaryPercentage: 100 - percentage,
            secondaryLabel: 'Pozostałe',
            chartColor: '#6b7280',
            type: 'pie',
          },
          sourceData: {
            type: 'pie',
            segments: [
              { label: 'Główna kategoria', percentage: percentage, color: '#FF6A00' },
              { label: 'Pozostałe kategorie', percentage: 100 - percentage, color: '#6b7280' }
            ]
          }
        };
    }
  };

  const chartData = getChartData();

  const canShare = antistic.status === 'Approved' && !antistic.hiddenAt && Boolean(antistic.publishedAt) && Boolean(antistic.canonicalUrl);
  const shareStatCopy = useMemo(() => {
    const sourceLine = antistic.sourceUrl ? `\nŹródło: ${antistic.sourceUrl}` : '';
    return `${antistic.reversedStatistic}${sourceLine}`;
  }, [antistic.reversedStatistic, antistic.sourceUrl]);

  const normalizeChart = (chart: ChartDefinition | undefined): NormalizedChart => {
    if (!chart) {
      return {};
    }

    const { type, segments, points, unit } = chart;

    return {
      type,
      segments,
      points,
      unit,
    };
  };

  const resolveChartType = (chart: ChartDefinition | undefined): ChartMode => {
    const { type } = normalizeChart(chart);
    if (type === 'bar' || type === 'line') {
      return type;
    }
    return 'pie';
  };

  const getChartPoints = (chart: ChartDefinition | undefined) => {
    const normalized = normalizeChart(chart);
    if (normalized.points && normalized.points.length > 0) {
      return normalized.points.map((point, index) => {
        const label = point.label.trim().length > 0 ? point.label : `Punkt ${index + 1}`;
        const value = Number.isFinite(point.value) ? point.value : 0;
        return { label, value };
      });
    }

    if (normalized.segments && normalized.segments.length > 0) {
      return normalized.segments.map((segment, index) => {
        const label = segment.label.trim().length > 0 ? segment.label : `Punkt ${index + 1}`;
        const value = Number.isFinite(segment.percentage) ? segment.percentage : 0;
        return { label, value };
      });
    }

    return [];
  };

  const buildBarItems = (chart: ChartDefinition | undefined) => {
    const normalized = normalizeChart(chart);
    const points: Array<{ label: string; value: number }> = getChartPoints(chart);
    if (!points.length) {
      return [];
    }

    const maxValue = Math.max(...points.map((point) => Math.abs(point.value)), 0) || 1;
    const unit = normalized.unit?.trim();

    return points.map((point, index) => ({
      label: point.label,
      displayValue: unit
        ? `${point.value.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} ${unit}`
        : point.value.toLocaleString('pl-PL', { maximumFractionDigits: 2 }),
      percentageWidth: Math.max(5, (Math.abs(point.value) / maxValue) * 100),
      color: normalized.segments?.[index]?.color ?? CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  const renderChartVisualization = (chart: ChartDefinition | undefined) => {
    const normalized = normalizeChart(chart);
    const type = resolveChartType(chart);
    if (type === 'line') {
      const points = normalized.points;
      if (!points || points.length === 0) {
        return <p className="text-sm text-text-secondary">Brak danych do wyświetlenia.</p>;
      }
      return <LineChart points={points} unit={normalized.unit} />;
    }

    if (type === 'bar') {
      const items = buildBarItems(chart);
      if (!items.length) {
        return <p className="text-sm text-text-secondary">Brak danych do wyświetlenia.</p>;
      }
      return <BarChart items={items} />;
    }

    const segments = normalized.segments ?? [];
    if (segments.length === 0) {
      return <p className="text-sm text-text-secondary">Brak danych do wizualizacji.</p>;
    }
    return <ColorfulDataChart segments={segments} showLegend />;
  };

  // Generate perspective segments
  const perspectiveSegments = chartData.perspectiveData ?
    createPerspectiveData(
      chartData.perspectiveData.mainPercentage,
      chartData.perspectiveData.mainLabel,
      chartData.perspectiveData.secondaryLabel,
      chartData.perspectiveData.chartColor
    ) : [];

  // Render different templates
  const renderTemplate = () => {
    switch (template.layout) {
      case 'two-column':
        return renderTwoColumnTemplate();
      case 'single-chart':
        return renderSingleChartTemplate();
      case 'text-focused':
        return renderTextFocusedTemplate();
      case 'comparison':
        return renderComparisonTemplate();
      default:
        return renderTwoColumnTemplate();
    }
  };

  const renderTwoColumnTemplate = () => {
    const perspectivePoints = perspectiveSegments.map((segment) => ({
      label: segment.label,
      value: segment.percentage,
    }));

    // Construct chart definition for perspective data
    const perspectiveChartDefinition = {
      type: chartData.perspectiveData?.type || 'pie',
      segments: perspectiveSegments,
      points: perspectivePoints,
      unit: chartData.perspectiveData?.unit,
    } as ChartDefinition;

    return (
    <>
      {/* Two-column chart section */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column: Perspektywa Antystyki */}
          <div className="flex flex-col items-center w-full">
            <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Perspektywa Antystyki</h4>
            <div className="w-full">
              {renderChartVisualization(perspectiveChartDefinition)}
            </div>
          </div>

          {/* Right Column: Dane źródłowe */}
          <div className="flex flex-col items-center w-full">
            <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Dane źródłowe</h4>
            <div className="w-full">
              {renderChartVisualization(chartData.sourceData as ChartDefinition | undefined)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  };

  const renderSingleChartTemplate = () => {
    const singleChart = chartData.singleChartData;

    return (
      <div className="px-6 pb-6">
        <div className="flex flex-col items-center mb-6 w-full">
          <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Analiza danych</h4>
          <div className="w-full">
            {renderChartVisualization(singleChart as ChartDefinition | undefined)}
          </div>
        </div>
      </div>
    );
  };

  const renderTextFocusedTemplate = () => (
    <div className="px-6 pb-6">
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-text-primary mb-2 font-display">
          {chartData.textData?.mainStatistic}
        </div>
        <p className="text-lg text-text-primary mb-2">
          {chartData.textData?.context}
        </p>
        <p className="text-sm text-text-secondary">
          {chartData.textData?.comparison}
        </p>
      </div>
    </div>
  );

  const renderComparisonTemplate = () => (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div className="flex flex-col items-center w-full">
          <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
            {chartData.comparisonData?.leftChart.title || 'Porównanie A'}
          </h4>
          <div className="w-full">
            {renderChartVisualization(chartData.comparisonData?.leftChart as ChartDefinition | undefined)}
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <h4 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">
            {chartData.comparisonData?.rightChart.title || 'Porównanie B'}
          </h4>
          <div className="w-full">
            {renderChartVisualization(chartData.comparisonData?.rightChart as ChartDefinition | undefined)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -5, boxShadow: "var(--shadow-medium)" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card rounded-2xl overflow-hidden group"
    >
      {/* Title Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-text-primary flex-1 font-display leading-tight">{chartData.title}</h3>

          {/* Badges */}
          <div className="flex gap-2 ml-4">
            {isNew && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full animate-pulse">
                NEW
              </span>
            )}
            {isTrending && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-full">🔥 TRENDING</span>
            )}
            {antistic.hiddenAt && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">HIDDEN</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {canEdit && (
              <Link
                to={`/antistic/${antistic.id}/edit`}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edytuj antystyk"
              >
                ✏️
              </Link>
            )}
            <AdminActions antisticId={antistic.id} isHidden={!!antistic.hiddenAt} type="antistic" onAction={onAdminAction} />
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {chartData.description}
        </p>
      </div>

      {/* Template-specific content */}
      {renderTemplate()}

      {/* Context paragraph */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 mb-4 border border-gray-100 dark:border-white/5">
          <p className="text-xs text-text-secondary flex items-center gap-1">
            <span>Źródło:</span>
            {antistic.sourceStatisticId && antistic.sourceStatisticSlug ? (
              <Link 
                to={`/statystyki/${antistic.sourceStatisticSlug}`}
                className="font-medium text-orange-600 hover:text-orange-700 hover:underline truncate max-w-[300px] transition-colors"
              >
                antystyki.pl
              </Link>
            ) : chartData.source?.startsWith('http') ? (
              <a 
                href={chartData.source}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-orange-600 hover:text-orange-700 hover:underline truncate max-w-[300px] transition-colors"
              >
                {chartData.source}
              </a>
            ) : (
              <span className="font-medium truncate max-w-[300px]">{chartData.source}</span>
            )}
          </p>
        </div>

        {/* Interaction bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-4">
            {/* Likes */}
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 transition-all duration-200 group ${isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                } ${likeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <motion.span
                whileTap={{ scale: 0.8 }}
                className={`text-base ${likeLoading ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`}
              >
                👍
              </motion.span>
              <span className="text-sm font-medium">{likesCount}</span>
              <span className="text-xs opacity-70">{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Comments */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-all duration-200 group ${showComments ? 'text-blue-600 dark:text-blue-400' : 'text-text-secondary hover:text-blue-600 dark:hover:text-blue-400'
                }`}
            >
              <span className={`text-base transition-all duration-200 ${showComments ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`}>
                💬
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{commentsCount}</span>
                <span className="text-xs opacity-70">{showComments ? 'Hide' : 'Discuss'}</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {canShare && (
              <ShareMenu
                canonicalUrl={antistic.canonicalUrl}
                entityId={antistic.id}
                entityType="antistic"
                title={antistic.title}
                summary={antistic.reversedStatistic}
                statCopyText={shareStatCopy}
              />
            )}
            <div className="text-xs text-gray-300 dark:text-gray-600 font-medium">antystyki.pl</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {antistic.categories && antistic.categories.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {antistic.categories.map(cat => {
            const label = `#${cat.namePl.replace(/\s+/g, '')}`;

            if (onCategoryClick) {
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryClick(cat.id)}
                  className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-text-secondary text-xs font-medium rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-white/10 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                  title={`Pokaż więcej z kategorii ${cat.namePl}`}
                >
                  {label}
                </button>
              );
            }

            return (
              <span key={cat.id} className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-text-secondary text-xs font-medium rounded-full">
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CommentsSection antisticId={antistic.id} commentsCount={commentsCount} onCommentsCountChange={setCommentsCount} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AntisticCard;
