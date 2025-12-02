import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { Category, Antistic, StatisticChartData } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/useAuth';
import TemplateSelector from '../components/TemplateSelector';
import ChartDataInput from '../components/ChartDataInput';
import AntisticCard from '../components/AntisticCard';
import { CARD_TEMPLATES } from '../types/templates';
import {
  trackAntisticCreate,
  trackCreateFormOpen
} from '../utils/analytics';
import { buildAntisticPrefillFromSnapshot } from '../utils/statisticPrefill';
import { getPrimaryErrorMessage } from '../utils/apiError';

const CreateAntistic: React.FC = () => {
  // Template system state
  const [selectedTemplate, setSelectedTemplate] = useState('two-column-default');
  const [chartData, setChartData] = useState<Partial<AntisticData>>({});
  const [prefillData, setPrefillData] = useState<Partial<AntisticData> | null>(null);
  const [chartPrefillKey, setChartPrefillKey] = useState<string>('initial');

  // Basic form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isAnonymous } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    fetchCategories();
    trackCreateFormOpen();

    const navigationState = location.state as { fromStatisticId?: string } | null;
    if (!navigationState?.fromStatisticId) {
      return;
    }

    const rawPrefill = localStorage.getItem('statistics:prefill');

    if (rawPrefill) {
      try {
        const parsed = JSON.parse(rawPrefill) as {
          statisticId?: string;
          antisticData?: Partial<AntisticData>;
          statisticSnapshot?: {
            title?: string;
            summary?: string;
            description?: string | null;
            sourceUrl?: string;
            chartData?: unknown;
          };
          title?: string;
          summary?: string;
          sourceUrl?: string;
          chartData?: unknown;
        };

        const snapshot =
          parsed.statisticSnapshot
            ? {
              ...parsed.statisticSnapshot,
              chartData: parsed.statisticSnapshot.chartData as StatisticChartData | undefined,
            }
            : {
              title: parsed.title,
              summary: parsed.summary,
              description: null,
              sourceUrl: parsed.sourceUrl,
              chartData: parsed.chartData as StatisticChartData | undefined,
            };

        const antisticData: Partial<AntisticData> = parsed.antisticData
          ?? buildAntisticPrefillFromSnapshot(snapshot);

        const templateFromData = antisticData?.templateId ?? 'single-chart';

        setSelectedTemplate(templateFromData);
        setPrefillData(antisticData ?? null);
        setChartPrefillKey(`stat-${navigationState.fromStatisticId}-${Date.now()}`);
        setChartData((prev) => ({
          ...prev,
          ...(antisticData ?? {}),
          templateId: templateFromData,
        }));
      } catch (error) {
        console.warn('Nie udało się odczytać danych statystyki do wstępnego wypełnienia', error);
      }
    }

    localStorage.removeItem('statistics:prefill');
    navigate(location.pathname, { replace: true, state: {} });
  }, [isAuthenticated, location.pathname, location.state, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default categories if API fails (for anonymous users)
      setCategories([
        { id: '1', namePl: 'Społeczeństwo', nameEn: 'Society', slug: 'spoleczenstwo' },
        { id: '2', namePl: 'Technologia', nameEn: 'Technology', slug: 'technologia' },
        { id: '3', namePl: 'Zdrowie', nameEn: 'Health', slug: 'zdrowie' },
        { id: '4', namePl: 'Ekonomia', nameEn: 'Economics', slug: 'ekonomia' },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setError('');

    if (!chartData.title) {
      setError('Tytuł jest wymagany');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Zaloguj się, aby tworzyć antystyki.');
      return;
    }

    const submitLoading = isDraft ? setSaving : setLoading;
    submitLoading(true);

    try {
      const payload = {
        title: chartData.title,
        reversedStatistic: chartData.description || '',
        sourceUrl: chartData.source || '',
        templateId: selectedTemplate,
        chartData: chartData,
        categoryIds: selectedCategories,
        isDraft: isDraft,
        isAnonymous: isAnonymous,
        userId: user.id,
      };

      await api.post('/antistics', payload);

      // Track successful creation
      const categoryName = categories.find(c => selectedCategories.includes(c.id))?.namePl;
      trackAntisticCreate(categoryName, selectedTemplate !== 'two-column-default');

      if (isDraft) {
        // Show success message for draft
        setError('');
        alert('Szkic został zapisany!');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      const errorMessage = getPrimaryErrorMessage(error, 'Błąd podczas zapisywania antystyku');
      setError(errorMessage);
    } finally {
      submitLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Create mock antistic for preview
  const previewOwner =
    user ??
    {
      id: 'preview-user',
      username: 'Ty',
      email: 'antystyki@gmail.com',
      role: 'User' as const,
      createdAt: new Date().toISOString(),
    };

  const previewAntistic: Antistic = {
    id: 'preview',
    title: chartData.title || 'Twój tytuł...',
    reversedStatistic: chartData.description || 'Twoja odwrócona statystyka...',
    sourceUrl: chartData.source || 'https://antystyki.pl',
    imageUrl: '/placeholder.png',
    slug: 'podglad-antystyk',
    canonicalUrl: 'https://antystyki.pl/antistics/preview',
    status: 'Draft',
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
    user: previewOwner,
    categories: categories.filter(cat => selectedCategories.includes(cat.id)),
    backgroundImageKey: 'default'
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Stwórz Antystykę</h1>
          <p className="mt-4 text-text-secondary sm:text-lg">
            Aby tworzyć antystyki, zaloguj się lub załóż konto. Dzięki temu będziesz mógł śledzić status swoich zgłoszeń
            i wracać do szkiców.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 dark:hover:bg-slate-600"
            >
              Zaloguj się
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border-color)] px-5 py-2 text-sm font-medium text-text-secondary transition hover:border-text-primary hover:text-text-primary"
            >
              Załóż konto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Stwórz Antystykę</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Template Selection */}
            <div className="bg-card rounded-lg border border-[var(--border-color)] p-6">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
              />
            </div>

            {/* Chart Data Input */}
            <div className="bg-card rounded-lg border border-[var(--border-color)] p-6">
              <ChartDataInput
                key={chartPrefillKey}
                templateId={selectedTemplate}
                onDataChange={setChartData}
                initialData={prefillData ?? undefined}
              />
            </div>

            {/* Categories */}
            <div className="bg-card rounded-lg border border-[var(--border-color)] p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Kategorie</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${selectedCategories.includes(category.id)
                        ? 'bg-slate-800 dark:bg-slate-600 text-white'
                        : 'bg-background text-text-secondary hover:bg-[var(--border-color)]'
                      }`}
                  >
                    {category.namePl}
                  </button>
                ))}
              </div>
            </div>

            {/* Anonymous User Notice */}
            {isAnonymous && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Tryb anonimowy:</strong> Tworzysz antystyk jako użytkownik anonimowy.
                  Możesz zalogować się lub zarejestrować, aby śledzić status swoich antystyków.
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Uwaga:</strong> Twój antystyk zostanie wysłany do moderacji.
                Po zatwierdzeniu będzie widoczny dla innych użytkowników.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving || !chartData.title}
                className="flex-1 px-4 py-2 border-2 border-[var(--border-color)] text-text-secondary rounded-lg hover:border-text-primary hover:text-text-primary disabled:opacity-50 transition-all"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz szkic'}
              </button>
              <button
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || !chartData.title}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#FF6A00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55F00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6A00'}
              >
                {loading ? 'Wysyłanie...' : 'Wyślij do moderacji'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-[var(--border-color)] text-text-secondary rounded-lg hover:bg-card transition-all"
              >
                Anuluj
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-card rounded-lg border border-[var(--border-color)] p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Podgląd</h2>
              <div className="max-w-md mx-auto">
                <AntisticCard
                  antistic={previewAntistic}
                  templateId={selectedTemplate}
                  customData={chartData}
                />
              </div>

              {/* Preview Info */}
              <div className="mt-4 text-sm text-text-secondary">
                <p><strong>Szablon:</strong> {CARD_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
                <p><strong>Kategorie:</strong> {selectedCategories.length > 0 ? selectedCategories.length : 'Brak'}</p>
                <p><strong>Status:</strong> {chartData.title ? 'Gotowy do wysłania' : 'Wypełnij dane'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAntistic;

