import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category, Antistic } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import TemplateSelector from '../components/TemplateSelector';
import ChartDataInput from '../components/ChartDataInput';
import AntisticCard from '../components/AntisticCard';
import { CARD_TEMPLATES } from '../types/templates';
import { 
  trackAntisticCreate, 
  trackCreateFormOpen
} from '../utils/analytics';

const CreateAntistic: React.FC = () => {
  // Template system state
  const [selectedTemplate, setSelectedTemplate] = useState('two-column-default');
  const [chartData, setChartData] = useState<Partial<AntisticData>>({});
  
  // Basic form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();
  const { user, isAuthenticated, isAnonymous, createAnonymousUser } = useAuth();

  useEffect(() => {
    fetchCategories();
    
    // Track that user opened the create form
    trackCreateFormOpen();
    
    // Create anonymous user if not authenticated
    if (!isAuthenticated && !isAnonymous) {
      createAnonymousUser();
    }
  }, [isAuthenticated, isAnonymous, createAnonymousUser]);

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

    // Ensure we have a user (anonymous or authenticated)
    if (!user) {
      setError('Wystąpił błąd z autentykacją');
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
        if (isAnonymous) {
          alert('Antystyk został wysłany do moderacji! Jako użytkownik anonimowy, możesz zalogować się aby śledzić status swojego antystyku.');
        }
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas zapisywania antystyku');
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
  const previewAntistic: Antistic = {
    id: 'preview',
    title: chartData.title || 'Twój tytuł...',
    reversedStatistic: chartData.description || 'Twoja odwrócona statystyka...',
    sourceUrl: chartData.source || 'https://antystyki.pl',
    imageUrl: '/placeholder.png',
    status: 'Draft',
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
    user: user || { id: 'current', username: 'Ty', email: 'user@antystyki.pl', role: 'User', createdAt: new Date().toISOString() },
    categories: categories.filter(cat => selectedCategories.includes(cat.id)),
    backgroundImageKey: 'default'
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Stwórz Antystyk</h1>
        
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

            {/* Anonymous User Notice */}
            {isAnonymous && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tryb anonimowy:</strong> Tworzysz antystyk jako użytkownik anonimowy. 
                  Możesz zalogować się lub zarejestrować, aby śledzić status swoich antystyków.
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Uwaga:</strong> Twój antystyk zostanie wysłany do moderacji. 
                Po zatwierdzeniu będzie widoczny dla innych użytkowników.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving || !chartData.title}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all"
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

