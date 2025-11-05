import React, { useState } from 'react';
import type { Antistic } from '../types';
import type { AntisticData } from '../types/templates';
import { CARD_TEMPLATES, CHART_COLORS } from '../types/templates';
import { DoughnutChart, ColorfulDataChart, LineChart, BarChart, createPerspectiveData } from './charts/ChartGenerator';
import CommentsSection from './CommentsSection';
import { useLike } from '../hooks/useLike';
import AdminActions from './AdminActions';

type ChartMode = 'pie' | 'bar' | 'line';

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
}

const AntisticCard: React.FC<Props> = ({ antistic, templateId = 'two-column-default', customData, onAdminAction }) => {
  const [commentsCount, setCommentsCount] = useState(antistic.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const { likesCount, isLiked, isLoading: likeLoading, toggleLike } = useLike({
    antisticId: antistic.id,
    initialLikesCount: antistic.likesCount,
    initialIsLiked: antistic.isLikedByCurrentUser
  });

  // Check if post is new (within last 48 hours)
  const isNew = new Date(antistic.createdAt).getTime() > Date.now() - 48 * 60 * 60 * 1000;
  
  // Check if post is trending (high likes in recent time)
  const isTrending = likesCount > 10 && new Date(antistic.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  // Determine template to use - prioritize backend data, then prop, then default
  const actualTemplateId = antistic.templateId || templateId || 'two-column-default';
  const template = CARD_TEMPLATES.find(t => t.id === actualTemplateId) || CARD_TEMPLATES[0];
  
  // Generate chart data based on template and actual data from backend
  const getChartData = () => {
    // If custom data is provided (for preview), use it
    if (customData) {
      return {
        perspectiveData: customData.perspectiveData,
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
      const backendData = antistic.chartData;
      return {
        perspectiveData: backendData.perspectiveData,
        sourceData: backendData.sourceData,
        singleChartData: backendData.singleChartData,
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
            chartColor: '#6b7280'
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
            chartColor: '#6b7280'
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
  
  const resolveChartType = (chart: any): ChartMode => {
    const raw = chart?.type as ChartMode | undefined;
    if (raw === 'bar' || raw === 'line') {
      return raw;
    }
    return 'pie';
  };

  const getChartPoints = (chart: any) => {
    if (Array.isArray(chart?.points) && chart.points.length > 0) {
      return chart.points.map((point: any, index: number) => ({
        label: typeof point.label === 'string' && point.label.length > 0 ? point.label : `Punkt ${index + 1}`,
        value: Number.isFinite(point.value) ? point.value : 0,
      }));
    }

    if (Array.isArray(chart?.segments) && chart.segments.length > 0) {
      return chart.segments.map((segment: any, index: number) => ({
        label: typeof segment.label === 'string' && segment.label.length > 0 ? segment.label : `Punkt ${index + 1}`,
        value: Number.isFinite(segment.percentage) ? segment.percentage : 0,
      }));
    }

    return [];
  };

  const buildBarItems = (chart: any) => {
    const points: Array<{ label: string; value: number }> = getChartPoints(chart);
    if (!points.length) {
      return [];
    }

    const maxValue = Math.max(...points.map((point) => Math.abs(point.value)), 0) || 1;

    return points.map((point, index) => ({
      label: point.label,
      displayValue: chart?.unit
        ? `${point.value.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} ${chart.unit.trim()}`
        : point.value.toLocaleString('pl-PL', { maximumFractionDigits: 2 }),
      percentageWidth: Math.max(5, (Math.abs(point.value) / maxValue) * 100),
      color: chart?.segments?.[index]?.color ?? CHART_COLORS[index % CHART_COLORS.length],
    }));
  };

  const renderChartVisualization = (chart: any) => {
    const type = resolveChartType(chart);
    if (type === 'line') {
      const points = getChartPoints(chart);
      if (!points.length) {
        return <p className="text-sm text-gray-500">Brak danych do wyświetlenia.</p>;
      }
      return <LineChart points={points} unit={chart?.unit} />;
    }

    if (type === 'bar') {
      const items = buildBarItems(chart);
      if (!items.length) {
        return <p className="text-sm text-gray-500">Brak danych do wyświetlenia.</p>;
      }
      return <BarChart items={items} />;
    }

    const segments = chart?.segments ?? [];
    if (!segments.length) {
      return <p className="text-sm text-gray-500">Brak danych do wizualizacji.</p>;
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
  
  const renderTwoColumnTemplate = () => (
    <>
      {/* Two-column chart section */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column: Perspektywa Antystyki */}
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Perspektywa Antystyki</h4>
            <DoughnutChart segments={perspectiveSegments} />
          </div>

          {/* Right Column: Dane źródłowe */}
          <div className="flex flex-col items-center w-full">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Dane źródłowe</h4>
            <div className="w-full">
              {renderChartVisualization(chartData.sourceData)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  const renderSingleChartTemplate = () => {
    const singleChart = chartData.singleChartData;

    return (
      <div className="px-6 pb-6">
        <div className="flex flex-col items-center mb-6 w-full">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Analiza danych</h4>
          <div className="w-full">
            {renderChartVisualization(singleChart)}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTextFocusedTemplate = () => (
    <div className="px-6 pb-6">
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {chartData.textData?.mainStatistic}
        </div>
        <p className="text-lg text-gray-700 mb-2">
          {chartData.textData?.context}
        </p>
        <p className="text-sm text-gray-500">
          {chartData.textData?.comparison}
        </p>
      </div>
    </div>
  );
  
  const renderComparisonTemplate = () => (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div className="flex flex-col items-center w-full">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">{chartData.comparisonData?.leftChart.title || 'Porównanie A'}</h4>
          <div className="w-full">
            {renderChartVisualization(chartData.comparisonData?.leftChart)}
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">{chartData.comparisonData?.rightChart.title || 'Porównanie B'}</h4>
          <div className="w-full">
            {renderChartVisualization(chartData.comparisonData?.rightChart)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 transition-all duration-300 overflow-hidden hover:-translate-y-1 group" 
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
         onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'}
         onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
      
      {/* Title Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{chartData.title}</h3>
          
          {/* Badges */}
          <div className="flex gap-2 ml-4">
            {isNew && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full animate-pulse">
                NEW
              </span>
            )}
            {isTrending && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                🔥 TRENDING
              </span>
            )}
            {antistic.hiddenAt && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                HIDDEN
              </span>
            )}
          </div>
          
          {/* Admin Actions */}
          <div className="ml-auto">
            <AdminActions 
              antisticId={antistic.id} 
              isHidden={!!antistic.hiddenAt}
              type="antistic"
              onAction={onAdminAction}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {template.layout === 'two-column' && chartData.perspectiveData 
            ? `${chartData.perspectiveData.mainPercentage}% wypadków drogowych powodują trzeźwi kierowcy`
            : chartData.description}
        </p>
      </div>

      {/* Template-specific content */}
      {renderTemplate()}

      {/* Context paragraph */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {chartData.description}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Źródło: {chartData.source}
          </p>
        </div>

        {/* Interaction bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Likes */}
            <button 
              onClick={toggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 transition-colors group ${
                isLiked 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              } ${likeLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`text-base transition-transform ${likeLoading ? 'animate-pulse' : 'group-hover:scale-110'}`}>
                👍
              </span>
              <span className="text-sm font-medium">{likesCount}</span>
              <span className="text-xs">{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Comments */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-all duration-200 group ${
                showComments 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className={`text-base transition-all duration-200 ${showComments ? 'rotate-12 scale-110' : 'group-hover:scale-110'}`}>
                💬
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{commentsCount}</span>
                <span className="text-xs font-medium">{showComments ? 'Hide' : 'Discuss'}</span>
              </div>
            </button>
          </div>

          {/* Watermark - bottom right, semi-transparent */}
          <div className="text-xs text-gray-300 font-medium">
            antystyki.pl
          </div>
        </div>
      </div>

      {/* Categories - if needed */}
      {antistic.categories && antistic.categories.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {antistic.categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
            >
              {cat.namePl}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <CommentsSection 
          antisticId={antistic.id}
          commentsCount={commentsCount}
          onCommentsCountChange={setCommentsCount}
        />
      )}
    </div>
  );
};

export default AntisticCard;
