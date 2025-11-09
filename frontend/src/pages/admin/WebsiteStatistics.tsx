import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import useAuth from '../../context/useAuth';
import { useAdminStatistics } from '../../hooks/useAdminStatistics';
import type { AdminStatisticsSummaryBlock } from '../../types';

const ADMIN_EMAIL = 'tmierzejowski@gmail.com';
const EMPTY_BLOCK: AdminStatisticsSummaryBlock = {
  totalPageViews: 0,
  uniqueVisitors: 0,
  humanPageViews: 0,
};

const formatNumber = (value: number) => new Intl.NumberFormat('pl-PL').format(value);

const WebsiteStatistics: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const normalizedEmail = user?.email?.toLowerCase() ?? '';
  const isAuthorized = !authLoading && normalizedEmail === ADMIN_EMAIL;

  const { data, loading, error, refetch } = useAdminStatistics(isAuthorized);

  useEffect(() => {
    if (!authLoading && normalizedEmail !== ADMIN_EMAIL) {
      navigate('/?message=Access%20Denied', { replace: true });
    }
  }, [authLoading, normalizedEmail, navigate]);

  if (authLoading || normalizedEmail !== ADMIN_EMAIL) {
    return null;
  }

  const summary = data ?? {
    today: EMPTY_BLOCK,
    last7Days: EMPTY_BLOCK,
    last30Days: EMPTY_BLOCK,
    last365Days: EMPTY_BLOCK,
    overall: EMPTY_BLOCK,
  };

  const cards: Array<{ key: keyof typeof summary; label: string; description: string }> = [
    { key: 'today', label: 'Dzisiaj', description: 'Ostatnie 24 godziny' },
    { key: 'last7Days', label: '7 dni', description: 'Poprzednie 7 dni (łącznie)' },
    { key: 'last30Days', label: '30 dni', description: 'Poprzednie 30 dni (łącznie)' },
    { key: 'last365Days', label: '365 dni', description: 'Poprzednie 365 dni (łącznie)' },
    { key: 'overall', label: 'Całkowicie', description: 'Od początku pomiarów' },
  ];

  const chartData = cards.map(({ key, label }) => ({
    name: label,
    pageViews: summary[key].totalPageViews,
    uniqueVisitors: summary[key].uniqueVisitors,
    humanPageViews: summary[key].humanPageViews,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Website Statistics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Zestawienie ruchu (cookieless + GA4) przeznaczone wyłącznie dla właściciela.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              type="button"
              disabled={loading}
            >
              🔄 Odśwież
            </button>
            {loading && (
              <span className="text-xs text-gray-500">Ładuję…</span>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
            {error === 'Access denied' ? 'Brak dostępu do statystyk.' : error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map(({ key, label, description }) => {
            const block = summary[key];
            return (
              <article key={key} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</h2>
                <p className="text-xs text-gray-400 mt-1">{description}</p>
                <div className="mt-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Odsłony</p>
                    <p className="text-xl font-semibold text-gray-900">{formatNumber(block.totalPageViews)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unikalni odwiedzający</p>
                    <p className="text-lg font-medium text-gray-900">{formatNumber(block.uniqueVisitors)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Odsłony osób</p>
                    <p className="text-lg font-medium text-gray-900">{formatNumber(block.humanPageViews)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Porównanie okresów</h2>
              <p className="text-sm text-gray-500">Zestawienie odsłon całkowitych vs. unikalnych odwiedzających.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip formatter={(value: number) => formatNumber(Number(value))} />
                <Legend />
                <Bar dataKey="pageViews" name="Odsłony" fill="#1F2937" radius={[6, 6, 0, 0]} />
                <Bar dataKey="uniqueVisitors" name="Unikalni" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600 space-y-2">
          <p>
            Dane pochodzą z dwóch źródeł: cookieless visitor metrics (odsłony i unikalni odwiedzający liczeni po stronie serwera)
            oraz ścieżek zachowań w GA4 dla użytkowników, którzy wyrazili zgodę na cookies. Tabele w bazie są odświeżane codziennie.
          </p>
          <p className="text-gray-400 text-xs">Odświeżanie cache: co 15 minut.</p>
        </section>
      </div>
    </div>
  );
};

export default WebsiteStatistics;
