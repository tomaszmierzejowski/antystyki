import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse } from '../types';
import type { AntisticData } from '../types/templates';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AntisticCard from '../components/AntisticCard';

const AdminPanel: React.FC = () => {
  const [pendingAntistics, setPendingAntistics] = useState<Antistic[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingAntistics();
  }, []);

  const fetchPendingAntistics = async () => {
    try {
      const response = await api.get<AntisticListResponse>('/admin/antistics/pending');
      setPendingAntistics(response.data.items);
    } catch (error) {
      console.error('Error fetching pending antistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: string, approve: boolean) => {
    try {
      await api.post(`/admin/antistics/${id}/moderate`, {
        approve,
        rejectionReason: approve ? null : 'Odrzucone przez moderatora',
      });
      
      // Remove from list
      setPendingAntistics(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error moderating antistic:', error);
      alert('Błąd podczas moderacji');
    }
  };

  // Only Admin and Moderator can access
  if (!user || (user.role !== 'Admin' && user.role !== 'Moderator')) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel Moderatora</h1>
          <div className="text-sm text-gray-600">
            Moderator: <span className="font-semibold">{user.username}</span>
            {user.role && (
              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                {user.role}
              </span>
            )}
          </div>
        </div>
        
        {pendingAntistics.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Brak antystyków do moderacji
            </h3>
            <p className="text-gray-600">
              Wszystkie antystyki zostały już przeglądnięte!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-lg text-gray-700">
                <strong>{pendingAntistics.length}</strong> antystyków oczekuje na moderację
              </p>
            </div>

            {pendingAntistics.map((antistic) => {
              // Extract chart data from antistic if available
              const chartData: Partial<AntisticData> = {
                title: antistic.title,
                description: antistic.reversedStatistic,
                source: antistic.sourceUrl || 'antystyki.pl',
                // Add template data if available in the antistic object
                templateId: (antistic as any).templateId || 'two-column-default',
                perspectiveData: (antistic as any).perspectiveData,
                sourceData: (antistic as any).sourceData,
              };

              return (
                <div key={antistic.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Card Preview */}
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Podgląd karty
                      </h3>
                      <div className="max-w-md mx-auto">
                        <AntisticCard
                          antistic={antistic}
                          templateId={chartData.templateId}
                          customData={chartData}
                        />
                      </div>
                    </div>

                    {/* Moderation Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Informacje o antystyku
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                          <div>
                            <strong className="text-gray-700">Tytuł:</strong>
                            <p className="text-gray-900 mt-1">{antistic.title}</p>
                          </div>
                          
                          <div>
                            <strong className="text-gray-700">Statystyka:</strong>
                            <p className="text-gray-900 mt-1">{antistic.reversedStatistic}</p>
                          </div>
                          
                          {antistic.sourceUrl && (
                            <div>
                              <strong className="text-gray-700">Źródło:</strong>
                              <a
                                href={antistic.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:text-blue-800 mt-1 break-all"
                              >
                                {antistic.sourceUrl}
                              </a>
                            </div>
                          )}
                          
                          <div>
                            <strong className="text-gray-700">Autor:</strong>
                            <p className="text-gray-900 mt-1">{antistic.user.username}</p>
                          </div>
                          
                          <div>
                            <strong className="text-gray-700">Data utworzenia:</strong>
                            <p className="text-gray-900 mt-1">
                              {new Date(antistic.createdAt).toLocaleDateString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>

                          {antistic.categories.length > 0 && (
                            <div>
                              <strong className="text-gray-700">Kategorie:</strong>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {antistic.categories.map((cat) => (
                                  <span
                                    key={cat.id}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                  >
                                    {cat.namePl}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Moderation Actions */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Akcje moderacji</h4>
                        <div className="space-y-3">
                          <button
                            onClick={() => handleModerate(antistic.id, true)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            ✅ Zatwierdź i opublikuj
                          </button>
                          <button
                            onClick={() => handleModerate(antistic.id, false)}
                            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            ❌ Odrzuć
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

