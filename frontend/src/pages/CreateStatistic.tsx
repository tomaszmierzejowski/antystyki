import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createStatistic, type CreateStatisticPayload } from '../api/statistics';
import { useAuth } from '../context/useAuth';
import { parseApiError } from '../utils/apiError';
import { useSessionValidator } from '../hooks/useSessionValidator';
import ReLoginModal from '../components/ReLoginModal';

type ChartMode = 'pie' | 'bar' | 'line';

interface DataPoint {
  label: string;
  value: number;
}

const DEFAULT_POINTS: DataPoint[] = [
  { label: '2023', value: 60 },
  { label: '2024', value: 40 },
];

const createDefaultPoints = (): DataPoint[] => DEFAULT_POINTS.map((point) => ({ ...point }));

const CreateStatisticPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, sessionExpired } = useAuth();
  
  // Validate session when user returns to the tab
  useSessionValidator();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceCitation, setSourceCitation] = useState('');

  const [chartMode, setChartMode] = useState<ChartMode>('pie');
  const [chartUnit, setChartUnit] = useState('%');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(createDefaultPoints);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredPoints = useMemo(
    () =>
      dataPoints
        .map((point) => ({
          label: point.label.trim(),
          value: Number.isFinite(point.value) ? point.value : 0,
        }))
        .filter((point) => point.label.length > 0),
    [dataPoints]
  );

  const totalForPie = useMemo(
    () => filteredPoints.reduce((sum, point) => sum + point.value, 0),
    [filteredPoints]
  );

  const handleModeChange = (mode: ChartMode) => {
    setChartMode(mode);
    if (mode === 'pie') {
      setChartUnit('%');
    }
  };

  const handleAddPoint = () => {
    setDataPoints((prev) => [...prev, { label: '', value: 0 }]);
  };

  const handleUpdatePoint = (index: number, key: 'label' | 'value', value: string) => {
    setDataPoints((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (key === 'label') {
        current.label = value;
      } else {
        current.value = Number.parseFloat(value) || 0;
      }
      next[index] = current;
      return next;
    });
  };

  const handleRemovePoint = (index: number) => {
    setDataPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const buildChartPayload = (): CreateStatisticPayload['chartData'] => {
    if (!filteredPoints.length) {
      return undefined;
    }

    return {
      chartSuggestion: {
        type: chartMode,
        unit:
          chartMode === 'pie'
            ? '%'
            : chartUnit.trim().length > 0
              ? chartUnit.trim()
              : undefined,
        dataPoints: filteredPoints.map((point) => ({
          label: point.label,
          value: point.value,
        })),
      },
      metricValue: filteredPoints[0]?.value,
      metricUnit:
        chartMode === 'pie'
          ? '%'
          : chartUnit.trim().length > 0
            ? chartUnit.trim()
            : undefined,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim() || !summary.trim() || !sourceUrl.trim()) {
      setError('Tytuł, zajawka i źródło są obowiązkowe.');
      return;
    }

    if (filteredPoints.length < 2) {
      setError('Dodaj co najmniej dwa punkty danych do wizualizacji.');
      return;
    }

    if (chartMode === 'pie' && Math.abs(totalForPie - 100) > 1) {
      setError('Suma procentów dla wykresu kołowego powinna wynosić 100%.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateStatisticPayload = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim() || undefined,
        sourceUrl: sourceUrl.trim(),
        sourceCitation: sourceCitation.trim() || undefined,
        chartData: buildChartPayload(),
      };

      await createStatistic(payload);
      setSuccessMessage('Statystyka została zapisana i czeka na moderację.');

      setTitle('');
      setSummary('');
      setDescription('');
      setSourceUrl('');
      setSourceCitation('');
      setDataPoints(createDefaultPoints());
      setChartMode('pie');
      setChartUnit('%');

      setTimeout(() => {
        navigate('/admin', { replace: true, state: { tab: 'statistics' } });
      }, 800);
    } catch (submitError: unknown) {
      const { status, messages } = parseApiError(submitError);
      // Don't show error if it's a session expiration (modal will handle it)
      if (status !== 401) {
        setError(messages[0] ?? 'Nie udało się zapisać statystyki. Spróbuj ponownie.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorized = Boolean(user && (user.role === 'Admin' || user.role === 'Moderator'));

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      {/* Session Expired Modal */}
      <ReLoginModal
        isOpen={sessionExpired}
        onSuccess={() => {
          // User re-authenticated, they can now try submitting again
          setError(null);
        }}
        onCancel={() => {
          // User chose to cancel - redirect to home
          navigate('/', { replace: true });
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Dodaj statystykę</h1>
          <p className="text-gray-600">
            Wprowadź surowe dane, które następnie przejdą proces moderacji i pojawią się w hubie „Statystyki”.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
              {successMessage}
            </div>
          )}

          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Skrajne ubóstwo w Polsce spadło do 5,2%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zajawka / skrót</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="Krótko opisz kluczową informację, która ma zainteresować odbiorców."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis rozszerzony (opcjonalnie)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Dodaj kontekst, metodologię, ograniczenia badania..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Źródło (URL)</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cytowanie / publikacja (opcjonalnie)</label>
                  <input
                    type="text"
                    value={sourceCitation}
                    onChange={(e) => setSourceCitation(e.target.value)}
                    placeholder="np. GUS, Zasięg zagrożenia ubóstwem ekonomicznym 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Wizualizacja danych</h2>
              <p className="text-sm text-gray-600">
                Wybierz typ wykresu i wprowadź wartości. Dane zostaną pokazane na stronie statystyki oraz mogą zostać
                użyte jako prefill do antystyku.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['pie', 'bar', 'line'] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    chartMode === mode
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode === 'pie' ? 'Wykres kołowy' : mode === 'bar' ? 'Wykres słupkowy' : 'Wykres liniowy'}
                </button>
              ))}
            </div>

            {chartMode !== 'pie' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka wartości</label>
                <input
                  type="text"
                  value={chartUnit}
                  onChange={(e) => setChartUnit(e.target.value)}
                  placeholder="np. %, mln, punktów"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                />
              </div>
            )}

            <div className="space-y-3">
              {dataPoints.map((point, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr,1fr,auto] gap-3 p-3 border border-gray-200 rounded-xl">
                  <input
                    type="text"
                    value={point.label}
                    onChange={(e) => handleUpdatePoint(index, 'label', e.target.value)}
                    placeholder="Etykieta (np. 2024)"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-accent focus:border-accent"
                  />

                  <input
                    type="number"
                    step="0.1"
                    value={point.value}
                    onChange={(e) => handleUpdatePoint(index, 'value', e.target.value)}
                    placeholder={chartMode === 'pie' ? 'Procent' : 'Wartość'}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-accent focus:border-accent"
                  />

                  {dataPoints.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(index)}
                      className="text-rose-500 hover:text-rose-700 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <button
                type="button"
                onClick={handleAddPoint}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                + Dodaj punkt
              </button>

              {chartMode === 'pie' && (
                <span>
                  Suma: {totalForPie.toFixed(1)}%
                  {Math.abs(totalForPie - 100) > 1 && (
                    <span className="text-rose-500 ml-2">(celuj w 100%)</span>
                  )}
                </span>
              )}
            </div>
          </section>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Zapisywanie...' : 'Zapisz statystykę'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:text-gray-900"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStatisticPage;

