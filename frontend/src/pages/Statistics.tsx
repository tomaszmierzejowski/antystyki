import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatisticsHub from '../components/StatisticsHub';
import type { Statistic } from '../types';

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToCreator = (statistic: Statistic) => {
    navigate('/create', { state: { fromStatisticId: statistic.id } });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <StatisticsHub variant="standalone" onNavigateToCreator={handleNavigateToCreator} />
      </div>
    </div>
  );
};

export default StatisticsPage;

