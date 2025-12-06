/**
 * Chart Data Input Component
 * 
 * Allows users to input data for their charts based on selected template
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AntisticData } from '../types/templates';
import { CHART_COLORS } from '../types/templates';
import { generateSegmentsFromData, createPerspectiveData } from './charts/chartUtils';

interface Props {
  templateId: string;
  onDataChange: (data: Partial<AntisticData>) => void;
  className?: string;
  initialData?: Partial<AntisticData> | null;
}

type ChartMode = 'pie' | 'bar' | 'line';

type SegmentValue = number | '';
type SegmentColor = string | null;

interface Segment {
  label: string;
  percentage: SegmentValue;
  color: SegmentColor;
}

interface SanitizedSegment {
  label: string;
  percentage: number;
  color?: string;
}

type SegmentField = 'sourceSegments' | 'singleSegments' | 'comparisonLeftSegments';

const DEFAULT_SEGMENTS: Segment[] = [
  { label: 'Kategoria A', percentage: 40, color: null },
  { label: 'Kategoria B', percentage: 35, color: null },
  { label: 'Kategoria C', percentage: 25, color: null },
];

const getDefaultColor = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length];

const sanitizeSegments = (segments: Segment[]): SanitizedSegment[] =>
  segments.map((segment, index) => {
    const numeric =
      typeof segment.percentage === 'number' && Number.isFinite(segment.percentage)
        ? segment.percentage
        : 0;

    const cleanedLabel = segment.label?.trim() || `Kategoria ${index + 1}`;
    const customColor =
      segment.color && /^#([0-9a-f]{3}){1,2}$/i.test(segment.color) ? segment.color : undefined;

    return {
      label: cleanedLabel,
      percentage: numeric,
      color: customColor,
    };
  });

const segmentsToPoints = (segments: SanitizedSegment[]) =>
  segments.map((segment) => ({
    label: segment.label,
    value: segment.percentage,
  }));

const stripPercentagePrefix = (label?: string): string => {
  if (!label) return '';
  const cleaned = label.replace(/^\s*\d+(?:[.,]\d+)?%?\s*/, '').trim();
  return cleaned.length > 0 ? cleaned : label.trim();
};

interface FormState {
  title: string;
  description: string;
  source: string;
  mainPercentage: number | '';
  mainLabel: string;
  secondaryLabel: string;
  perspectiveChartMode: ChartMode;
  perspectiveUnit: string;
  sourceSegments: Segment[];
  sourceChartMode: ChartMode;
  sourceUnit: string;
  singleSegments: Segment[];
  singleChartMode: ChartMode;
  singleUnit: string;
  comparisonLeftSegments: Segment[];
  comparisonLeftMode: ChartMode;
  comparisonLeftUnit: string;
  comparisonRightMode: ChartMode;
  comparisonRightUnit: string;
}

const buildInitialState = (initialData?: Partial<AntisticData> | null): FormState => {
  const perspective = initialData?.perspectiveData;

  const cloneDefaultSegments = (): Segment[] =>
    DEFAULT_SEGMENTS.map((segment) => ({ ...segment }));

  const toSegmentState = (
    segments?: Array<{ label: string; percentage: number; color?: string }>
  ): Segment[] =>
    segments && segments.length
      ? segments.map((segment) => ({
          label: segment.label,
          percentage: segment.percentage,
          color: segment.color ?? null,
        }))
      : cloneDefaultSegments();

  const sourceSegments = toSegmentState(initialData?.sourceData?.segments);
  const singleSegments =
    initialData?.singleChartData?.segments?.length
      ? toSegmentState(initialData.singleChartData.segments)
      : sourceSegments.map((segment) => ({ ...segment }));
  const comparisonLeftSegments =
    initialData?.comparisonData?.leftChart?.segments?.length
      ? toSegmentState(initialData.comparisonData.leftChart.segments)
      : sourceSegments.map((segment) => ({ ...segment }));

  const sourceChartType = (initialData?.sourceData?.type as ChartMode | undefined)
    ?? (initialData?.sourceData?.points?.length ? 'bar' : 'pie');
  const singleChartType = (initialData?.singleChartData?.type as ChartMode | undefined)
    ?? (initialData?.singleChartData?.points?.length ? 'bar' : 'pie');
  const comparisonLeftType = (initialData?.comparisonData?.leftChart?.type as ChartMode | undefined)
    ?? (initialData?.comparisonData?.leftChart?.points?.length ? 'bar' : 'pie');
  const comparisonRightType = (initialData?.comparisonData?.rightChart?.type as ChartMode | undefined)
    ?? (initialData?.comparisonData?.rightChart?.points?.length ? 'bar' : 'pie');
  
  const perspectiveChartType = (perspective?.type as ChartMode | undefined) ?? 'pie';
  const perspectiveUnit = perspective?.unit ?? '';

  return {
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    source: initialData?.source ?? '',
    mainPercentage: perspective?.mainPercentage ?? 65,
    mainLabel: stripPercentagePrefix(perspective?.mainLabel) || 'głównej wartości',
    secondaryLabel: perspective?.secondaryLabel ?? 'Pozostałe',
    perspectiveChartMode: perspectiveChartType,
    perspectiveUnit: perspectiveUnit,
    sourceSegments,
    sourceChartMode: sourceChartType,
    sourceUnit: initialData?.sourceData?.unit ?? '',
    singleSegments,
    singleChartMode: singleChartType,
    singleUnit: initialData?.singleChartData?.unit ?? '',
    comparisonLeftSegments,
    comparisonLeftMode: comparisonLeftType,
    comparisonLeftUnit: initialData?.comparisonData?.leftChart?.unit ?? '',
    comparisonRightMode: comparisonRightType,
    comparisonRightUnit: initialData?.comparisonData?.rightChart?.unit ?? '',
  };
};

const ChartDataInput: React.FC<Props> = ({ templateId, onDataChange, className = '', initialData = null }) => {
  const [formData, setFormData] = useState<FormState>(() => buildInitialState(initialData));
  const serializedInitialData = useMemo(() => (initialData ? JSON.stringify(initialData) : null), [initialData]);
  const lastAppliedInitialData = useRef<string | null>(serializedInitialData);

  const clampPercentage = (value: number | ''): number => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  };

  const generateChartData = (template: string, data: FormState): Partial<AntisticData> => {
    const mainPercentage = clampPercentage(data.mainPercentage);

    const baseData: Partial<AntisticData> = {
      title: data.title,
      description: data.description,
      source: data.source || 'antystyki.pl',
      templateId: template,
    };

    const buildChartPayload = (
      mode: ChartMode,
      segments: Segment[],
      unit: string,
      fallbackTitle: string
    ) => {
      const sanitized = sanitizeSegments(segments);
      const pieSegments = generateSegmentsFromData(sanitized);
      if (mode === 'pie') {
        return {
          type: 'pie' as const,
          title: fallbackTitle,
          segments: pieSegments,
        };
      }

      return {
        type: mode,
        title: fallbackTitle,
        segments: pieSegments,
        points: segmentsToPoints(sanitized),
        unit: unit || undefined,
      };
    };

    switch (template) {
      case 'two-column-default': {
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage,
            mainLabel: `${mainPercentage.toFixed(1)}% ${data.mainLabel}`,
            secondaryPercentage: Math.max(0, 100 - mainPercentage),
            secondaryLabel: data.secondaryLabel,
            chartColor: '#6b7280',
            type: data.perspectiveChartMode,
            unit: data.perspectiveUnit || undefined,
          },
          sourceData: buildChartPayload(
            data.sourceChartMode,
            data.sourceSegments,
            data.sourceUnit,
            'Dane źródłowe'
          ),
          textData: undefined,
        };
      }

      case 'single-chart': {
        return {
          ...baseData,
          singleChartData: buildChartPayload(
            data.singleChartMode,
            data.singleSegments,
            data.singleUnit,
            data.title || 'Analiza danych'
          ),
        };
      }

      case 'text-focused': {
        return {
          ...baseData,
          perspectiveData: {
            mainPercentage,
            mainLabel: `${mainPercentage.toFixed(1)}% ${data.mainLabel}`,
            secondaryPercentage: Math.max(0, 100 - mainPercentage),
            secondaryLabel: data.secondaryLabel,
            chartColor: '#6b7280',
          },
          textData: {
            mainStatistic: `${mainPercentage.toFixed(1)}% ${data.mainLabel}`,
            context: data.description,
            comparison: data.secondaryLabel,
          },
        };
      }

      case 'comparison': {
        const perspectiveSegments = createPerspectiveData(
          mainPercentage,
          `${mainPercentage.toFixed(1)}% ${data.mainLabel}`,
          data.secondaryLabel,
          '#6b7280'
        );

        const buildComparisonRight = () => {
          if (data.comparisonRightMode === 'pie') {
            return {
              title: 'Porównanie B',
              type: 'pie' as const,
              segments: generateSegmentsFromData(
                perspectiveSegments.map((segment) => ({
                  label: segment.label,
                  percentage: segment.percentage,
                }))
              ),
            };
          }

          return {
            title: 'Porównanie B',
            type: data.comparisonRightMode,
            segments: generateSegmentsFromData(
              perspectiveSegments.map((segment) => ({
                label: segment.label,
                percentage: segment.percentage,
              }))
            ),
            points: segmentsToPoints(
              perspectiveSegments.map((segment) => ({
                label: segment.label,
                percentage: segment.percentage,
              }))
            ),
            unit: data.comparisonRightUnit || undefined,
          };
        };

        return {
          ...baseData,
          comparisonData: {
            leftChart: buildChartPayload(
              data.comparisonLeftMode,
              data.comparisonLeftSegments,
              data.comparisonLeftUnit,
              'Porównanie A'
            ),
            rightChart: buildComparisonRight(),
          },
          perspectiveData: {
            mainPercentage,
            mainLabel: `${mainPercentage.toFixed(1)}% ${data.mainLabel}`,
            secondaryPercentage: Math.max(0, 100 - mainPercentage),
            secondaryLabel: data.secondaryLabel,
            chartColor: '#6b7280',
          },
        };
      }

      default:
        return baseData;
    }
  };

  useEffect(() => {
    if (!serializedInitialData || serializedInitialData === lastAppliedInitialData.current) {
      return;
    }

    const nextState = buildInitialState(initialData);
    lastAppliedInitialData.current = serializedInitialData;
    setFormData(nextState);
  }, [serializedInitialData, initialData]);

  useEffect(() => {
    const chartData = generateChartData(templateId, formData);
    onDataChange({
      ...chartData,
      templateId,
    });
  }, [formData, templateId, onDataChange]);

  const updateFormData = (updates: Partial<FormState>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const updateSegmentField = (
    field: SegmentField,
    index: number,
    key: 'label' | 'percentage',
    value: string
  ) => {
    setFormData((prev) => {
      const segments = [...prev[field]];
      if (!segments[index]) {
        return prev;
      }

      const updated = { ...segments[index] };
      if (key === 'label') {
        updated.label = value;
      } else {
        if (value === '') {
          updated.percentage = '';
        } else {
          const parsed = Number.parseFloat(value);
          updated.percentage = Number.isNaN(parsed) ? '' : parsed;
        }
      }
      segments[index] = updated;
      return {
        ...prev,
        [field]: segments,
      };
    });
  };

  const addSegment = (field: SegmentField) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { label: '', percentage: '', color: null }],
    }));
  };

  const removeSegment = (field: SegmentField, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const renderChartModeSelector = (
    label: string,
    currentMode: ChartMode,
    onChange: (mode: ChartMode) => void
  ) => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-text-primary">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {(['pie', 'bar', 'line'] as ChartMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              currentMode === mode
                ? 'bg-slate-800 dark:bg-slate-600 text-white border-slate-800 dark:border-slate-600'
                : 'border-[var(--border-color)] text-text-secondary hover:text-text-primary'
            }`}
          >
            {mode === 'pie' ? 'Wykres kołowy' : mode === 'bar' ? 'Wykres słupkowy' : 'Wykres liniowy'}
          </button>
        ))}
      </div>
    </div>
  );

  const renderUnitInput = (
    mode: ChartMode,
    value: string,
    onChange: (next: string) => void
  ) =>
    mode === 'pie' ? null : (
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Jednostka (opcjonalnie)
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="np. % / mln / pkt"
          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
        />
      </div>
    );

  const renderSegmentEditor = (
    field: SegmentField,
    mode: ChartMode,
    heading: string,
    emptyMessage?: string
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{heading}</h3>
        <button
          type="button"
          onClick={() => addSegment(field)}
          className="px-3 py-1 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          + Dodaj kategorię
        </button>
      </div>

      {formData[field].length === 0 && emptyMessage ? (
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {formData[field].map((segment, index) => {
            const defaultColor = getDefaultColor(index);
            const colorValue = segment.color ?? defaultColor;

            return (
              <div
                key={`${field}-${index}`}
                className="grid grid-cols-1 gap-3 p-3 border border-[var(--border-color)] rounded-lg md:grid-cols-[2fr,1fr,auto]"
              >
                <input
                  type="text"
                  value={segment.label}
                  onChange={(e) => updateSegmentField(field, index, 'label', e.target.value)}
                  placeholder="Nazwa kategorii"
                  className="w-full px-2 py-1 border border-[var(--border-color)] rounded text-sm bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent"
                />

                <input
                  type="number"
                  step="0.1"
                  value={segment.percentage === '' ? '' : segment.percentage}
                  onChange={(e) => updateSegmentField(field, index, 'percentage', e.target.value)}
                  placeholder={mode === 'pie' ? 'Procent' : 'Wartość'}
                  className="w-full px-2 py-1 border border-[var(--border-color)] rounded text-sm bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-1 focus:ring-accent focus:border-accent"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const next = [...prev[field]];
                        if (!next[index]) {
                          return prev;
                        }
                        next[index] = {
                          ...next[index],
                          color: e.target.value,
                        };
                        return {
                          ...prev,
                          [field]: next,
                        };
                      })
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[var(--border-color)] bg-card"
                    title="Wybierz kolor segmentu"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => {
                        const next = [...prev[field]];
                        if (!next[index]) {
                          return prev;
                        }
                        next[index] = {
                          ...next[index],
                          color: null,
                        };
                        return {
                          ...prev,
                          [field]: next,
                        };
                      })
                    }
                    className="text-xs text-text-secondary hover:text-text-primary transition"
                    disabled={segment.color === null}
                  >
                    Domyślny
                  </button>

                  {formData[field].length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(field, index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'pie' && (
        <div className="text-sm text-text-secondary">
          {(() => {
            const total = formData[field].reduce(
              (sum, seg) => sum + (typeof seg.percentage === 'number' ? seg.percentage : 0),
              0
            );

            return (
              <>
                Suma: {total.toFixed(1)}%
                {Math.abs(total - 100) > 0.5 && (
                  <span className="text-red-500 dark:text-red-400 ml-2">
                    (Dla wykresu kołowego suma powinna wynosić 100%)
                  </span>
                )}
              </>
            );
          })()}
        </div>
      )}

      {mode !== 'pie' && (
        <div className="text-xs text-text-secondary/70 space-y-1">
          <p>Możesz wybrać własne kolory dla wykresów. Kliknij „Domyślny", aby przywrócić automatyczny dobór.</p>
          <p>Pozostaw pole puste, aby dodać wartość później.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Informacje podstawowe</h3>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Tytuł antystyki</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="np. Wypadki drogowe – kto naprawdę je powoduje?"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Opis kontekstu</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Wyjaśnij kontekst i znaczenie tej statystyki..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Źródło danych</label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => updateFormData({ source: e.target.value })}
            placeholder="np. WHO Global Status Report"
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {(templateId === 'two-column-default' || templateId === 'text-focused' || templateId === 'comparison') && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Perspektywa antystyki</h3>
          
          {templateId === 'two-column-default' && (
             <>
                {renderChartModeSelector('Wizualizacja perspektywy', formData.perspectiveChartMode, (mode) =>
                   updateFormData({ perspectiveChartMode: mode })
                )}
                {renderUnitInput(formData.perspectiveChartMode, formData.perspectiveUnit, (next) =>
                   updateFormData({ perspectiveUnit: next })
                )}
             </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Główny procent</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.mainPercentage === '' ? '' : formData.mainPercentage}
                onChange={(e) => {
                  const nextValue = e.target.value === '' ? '' : Number.parseFloat(e.target.value);
                  updateFormData({
                    mainPercentage:
                      typeof nextValue === 'number' && !Number.isNaN(nextValue) ? nextValue : '',
                  });
                }}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Opis głównej statystyki</label>
              <input
                type="text"
                value={formData.mainLabel}
                onChange={(e) => updateFormData({ mainLabel: e.target.value })}
                placeholder="np. powoduje trzeźwy kierowca"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Opis pozostałej części</label>
            <input
              type="text"
              value={formData.secondaryLabel}
              onChange={(e) => updateFormData({ secondaryLabel: e.target.value })}
              placeholder="np. Jazda po chodniku"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-card text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
      )}

      {templateId === 'two-column-default' && (
        <>
          {renderChartModeSelector('Wizualizacja danych źródłowych', formData.sourceChartMode, (mode) =>
            updateFormData({ sourceChartMode: mode })
          )}
          {renderUnitInput(formData.sourceChartMode, formData.sourceUnit, (next) =>
            updateFormData({ sourceUnit: next })
          )}
          {renderSegmentEditor('sourceSegments', formData.sourceChartMode, 'Dane źródłowe')}
        </>
      )}

      {templateId === 'single-chart' && (
        <>
          {renderChartModeSelector('Rodzaj wykresu', formData.singleChartMode, (mode) =>
            updateFormData({ singleChartMode: mode })
          )}
          {renderUnitInput(formData.singleChartMode, formData.singleUnit, (next) =>
            updateFormData({ singleUnit: next })
          )}
          {renderSegmentEditor('singleSegments', formData.singleChartMode, 'Dane wykresu')}
        </>
      )}

      {templateId === 'comparison' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {renderChartModeSelector('Wykres (lewa strona)', formData.comparisonLeftMode, (mode) =>
              updateFormData({ comparisonLeftMode: mode })
            )}
            {renderUnitInput(formData.comparisonLeftMode, formData.comparisonLeftUnit, (next) =>
              updateFormData({ comparisonLeftUnit: next })
            )}
            {renderSegmentEditor(
              'comparisonLeftSegments',
              formData.comparisonLeftMode,
              'Dane porównania – lewa strona'
            )}
          </div>

          <div className="space-y-4">
            {renderChartModeSelector('Wykres (prawa strona)', formData.comparisonRightMode, (mode) =>
              updateFormData({ comparisonRightMode: mode })
            )}
            {renderUnitInput(formData.comparisonRightMode, formData.comparisonRightUnit, (next) =>
              updateFormData({ comparisonRightUnit: next })
            )}
            <p className="text-sm text-text-secondary bg-background border border-[var(--border-color)] rounded-lg p-4">
              Wykres po prawej stronie bazuje na danych perspektywy (główna wartość vs. pozostałe).
              Zmieniaj procent i opisy w sekcji perspektywy, aby dostosować wykres.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartDataInput;
