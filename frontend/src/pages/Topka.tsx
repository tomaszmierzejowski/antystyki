import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatisticsHub from '../components/StatisticsHub';
import type { Statistic } from '../types';

const TopkaPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToCreator = (statistic: Statistic) => {
    navigate('/create', { state: { fromStatisticId: statistic.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-card border-b border-[var(--border-color)]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <span className="text-xs uppercase tracking-[0.35em] text-text-secondary">
            Ranking społeczności
          </span>
          <h1 className="mt-3 text-4xl font-bold text-text-primary sm:text-5xl">
            Topka Antystyk – najgorętsze dane tygodnia
          </h1>
          <p className="mt-4 text-base text-text-secondary sm:text-lg">
            Zobacz, które statystyki zdobywają najwięcej głosów zaufania, reakcji i przeróbek.
            To tu rodzą się najlepsze antystyki – możesz zagłosować, dodać komentarz lub
            błyskawicznie przerobić dane na własną historię.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 rounded-3xl border border-dashed border-[var(--border-color)] bg-card/70 p-6 text-sm text-text-secondary sm:p-8">
          <h2 className="mb-2 text-lg font-semibold text-text-primary sm:text-xl">
            Jak działa Topka?
          </h2>
          <ul className="space-y-2">
            <li>
              <span className="font-medium text-text-primary">•</span>{' '}
              Ranking opiera się na różnicy między głosami zaufania i „fake" oraz liczbie przeróbek.
            </li>
            <li>
              <span className="font-medium text-text-primary">•</span>{' '}
              Statystyki odświeżamy automatycznie – nowe dane wpadają codziennie po moderacji.
            </li>
            <li>
              <span className="font-medium text-text-primary">•</span>{' '}
              Możesz sortować również po najnowszych i najczęściej oglądanych, by odkrywać świeże trendy.
            </li>
          </ul>
        </div>

        <StatisticsHub variant="standalone" onNavigateToCreator={handleNavigateToCreator} />
      </div>
    </div>
  );
};

export default TopkaPage;


