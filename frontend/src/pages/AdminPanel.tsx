import React, { useEffect, useState } from 'react';
import type { Antistic, AntisticListResponse } from '../types';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Panel Moderatora</h1>
      
      {pendingAntistics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Brak antystyków oczekujących na moderację</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingAntistics.map((antistic) => (
            <div key={antistic.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">{antistic.title}</h3>
                  <p className="text-gray-700 mb-4">{antistic.reversedStatistic}</p>
                  
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Źródło:</strong>{' '}
                      <a
                        href={antistic.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {antistic.sourceUrl}
                      </a>
                    </p>
                    <p>
                      <strong>Autor:</strong> {antistic.user.username}
                    </p>
                    <p>
                      <strong>Data:</strong> {new Date(antistic.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {antistic.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded"
                      >
                        {cat.namePl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-full h-64 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white p-6 text-center">
                    <div>
                      <p className="text-lg font-bold mb-2">{antistic.title}</p>
                      <p>{antistic.reversedStatistic}</p>
                      <p className="text-sm mt-4 opacity-75">antystyki.pl</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => handleModerate(antistic.id, true)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  ✓ Zatwierdź
                </button>
                <button
                  onClick={() => handleModerate(antistic.id, false)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  ✗ Odrzuć
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

