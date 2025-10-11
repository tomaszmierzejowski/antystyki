import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../types';
import api from '../config/api';
import BackgroundSelector from '../components/BackgroundSelector';
import { backgroundTemplates, getBackgroundByKey } from '../config/backgrounds';

const CreateAntistic: React.FC = () => {
  const [title, setTitle] = useState('');
  const [reversedStatistic, setReversedStatistic] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState(backgroundTemplates[0].id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/antistics', {
        title,
        reversedStatistic,
        sourceUrl,
        backgroundImageKey: selectedBackground,
        categoryIds: selectedCategories,
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd podczas tworzenia antystyku');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const previewBackground = getBackgroundByKey(selectedBackground);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Stwórz Antystyk</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tytuł
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="np. Antystyki - Odwrócona Statystyka"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Odwrócona statystyka
          </label>
          <textarea
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="np. 92.4% wypadków spowodowanych było przez trzeźwych kierowców"
            value={reversedStatistic}
            onChange={(e) => setReversedStatistic(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Źródło (link)
          </label>
          <input
            type="url"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-1">
            Podaj link do źródła statystyki
          </p>
        </div>

        <div>
          <BackgroundSelector
            selectedId={selectedBackground}
            onSelect={setSelectedBackground}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategorie
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'bg-primary-600 text-white shadow-md scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.namePl}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Uwaga:</strong> Twój antystyk zostanie wysłany do moderacji. 
            Po zatwierdzeniu będzie widoczny dla innych użytkowników.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {loading ? 'Wysyłanie...' : 'Wyślij do moderacji'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
          >
            Anuluj
          </button>
        </div>
      </form>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-8 h-fit">
        <h2 className="text-xl font-bold mb-4">Podgląd</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className={`relative h-80 bg-gradient-to-br ${previewBackground.gradient}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
              <h3 className="text-2xl font-bold mb-4 drop-shadow-lg">
                {title || 'Twój tytuł...'}
              </h3>
              <p className="text-lg leading-relaxed drop-shadow-md max-w-md">
                {reversedStatistic || 'Twoja odwrócona statystyka...'}
              </p>
            </div>
            <div className="absolute bottom-3 right-3 text-white text-sm opacity-60 font-medium">
              antystyki.pl
            </div>
          </div>
          <div className="p-4 bg-gradient-to-b from-white to-gray-50">
            <div className="text-sm text-gray-500">
              {selectedCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter(c => selectedCategories.includes(c.id))
                    .map(cat => (
                      <span key={cat.id} className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        {cat.namePl}
                      </span>
                    ))}
                </div>
              ) : (
                <span>Wybierz kategorie...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CreateAntistic;

