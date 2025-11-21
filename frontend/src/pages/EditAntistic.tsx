import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Category, Antistic } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/useAuth';
import TemplateSelector from '../components/TemplateSelector';
import ChartDataInput from '../components/ChartDataInput';
import AntisticCard from '../components/AntisticCard';
import { CARD_TEMPLATES } from '../types/templates';
import { updateAntistic, fetchAntistic } from '../api/antistics';
import { getPrimaryErrorMessage } from '../utils/apiError';

const EditAntistic: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Template system state
  const [selectedTemplate, setSelectedTemplate] = useState('two-column-default');
  const [chartData, setChartData] = useState<Partial<AntisticData>>({});
  const [initialData, setInitialData] = useState<Partial<AntisticData> | undefined>(undefined);
  
  // Basic form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [originalAntistic, setOriginalAntistic] = useState<Antistic | null>(null);
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isModerator = user?.role === 'Admin' || user?.role === 'Moderator';

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    if (id) {
      loadData(id);
    }
  }, [id, isAuthenticated]);

  const loadData = async (antisticId: string) => {
    try {
      setFetching(true);
      const [categoriesResponse, antistic] = await Promise.all([
        api.get<Category[]>('/categories'),
        fetchAntistic(antisticId)
      ]);
      
      setCategories(categoriesResponse.data);
      setOriginalAntistic(antistic);

      // Check permissions
      if (user?.id !== antistic.user.id && !isModerator) {
        setError('Nie masz uprawnień do edycji tego antystyku.');
        setFetching(false);
        return;
      }

      // Populate form
      setSelectedCategories(antistic.categories.map(c => c.id));
      if (antistic.templateId) {
        setSelectedTemplate(antistic.templateId);
      }
      
      const antisticChartData = antistic.chartData ?? {};
      const data: Partial<AntisticData> = {
        title: antistic.title,
        description: antistic.reversedStatistic,
        source: antistic.sourceUrl,
        templateId: antistic.templateId ?? 'two-column-default',
        perspectiveData: antisticChartData.perspectiveData,
        sourceData: antisticChartData.sourceData,
        singleChartData: antisticChartData.singleChartData,
        textData: antisticChartData.textData,
        comparisonData: antisticChartData.comparisonData,
      };

      setChartData(data);
      setInitialData(data);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Nie udało się załadować danych antystyku.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!id) return;
    
    setError('');
    
    if (!chartData.title) {
      setError('Tytuł jest wymagany');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Zaloguj się, aby edytować antystyki.');
      return;
    }

    const submitLoading = setLoading;
    submitLoading(true);

    try {
      const payload = {
        title: chartData.title,
        reversedStatistic: chartData.description || '',
        sourceUrl: chartData.source || '',
        templateId: selectedTemplate,
        chartData: chartData,
        categoryIds: selectedCategories,
        backgroundImageKey: originalAntistic?.backgroundImageKey
      };
      
      const result = await updateAntistic(id, payload);
      
      if ('message' in result && result.message === "Changes sent to moderation") {
        alert('Zmiany zostały wysłane do moderacji!');
        navigate('/');
      } else {
        alert('Zapisano zmiany!');
        if (isModerator) {
           navigate(`/antistic/${id}`); // Go back to antistic
        } else {
           navigate('/');
        }
      }
    } catch (error: unknown) {
      const errorMessage = getPrimaryErrorMessage(error, 'Błąd podczas zapisywania zmian');
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

  const previewAntistic: Antistic = {
    ...(originalAntistic as Antistic), // Keep other fields like ID, created at etc.
    title: chartData.title || 'Twój tytuł...',
    reversedStatistic: chartData.description || 'Twoja odwrócona statystyka...',
    sourceUrl: chartData.source || 'https://antystyki.pl',
    categories: categories.filter(cat => selectedCategories.includes(cat.id)),
    templateId: selectedTemplate,
    chartData: chartData
  };

  if (!isAuthenticated) {
     return (
         <div className="flex justify-center items-center h-screen">
             <p>Musisz się zalogować.</p>
         </div>
     )
  }

  if (fetching) {
      return (
          <div className="flex justify-center items-center h-screen">
              <p>Ładowanie...</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edytuj Antystykę</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Template Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
              />
            </div>

            {/* Chart Data Input */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ChartDataInput
                templateId={selectedTemplate}
                onDataChange={setChartData}
                initialData={initialData}
              />
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorie</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedCategories.includes(category.id)
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category.namePl}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning for regular users editing approved cards */}
            {!isModerator && originalAntistic?.status === 'Approved' && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <strong>Uwaga:</strong> Edycja opublikowanego antystyku stworzy szkic, który trafi do ponownej moderacji. Oryginalny antystyk pozostanie widoczny do czasu zatwierdzenia zmian.
                </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading || !chartData.title}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#FF6A00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E55F00'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF6A00'}
              >
                {loading ? 'Wysyłanie...' : (isModerator ? 'Zapisz zmiany (Natychmiast)' : 'Wyślij zmiany')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                Anuluj
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Podgląd</h2>
              <div className="max-w-md mx-auto">
                <AntisticCard
                  antistic={previewAntistic}
                  templateId={selectedTemplate}
                  customData={chartData}
                />
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Szablon:</strong> {CARD_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</p>
                <p><strong>Kategorie:</strong> {selectedCategories.length > 0 ? selectedCategories.length : 'Brak'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAntistic;

