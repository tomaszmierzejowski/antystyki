/**
 * Chart Data Test Component
 * 
 * Test component to verify that chart data from backend is properly displayed
 */

import React from 'react';
import AntisticCard from './AntisticCard';
import type { Antistic } from '../types';

const ChartDataTest: React.FC = () => {
  // Test antistic with mock backend data
  const testAntistic: Antistic = {
    id: 'test-1',
    title: 'Test Chart Data',
    reversedStatistic: '85% of the universe\'s mass is invisible to us',
    sourceUrl: 'https://example.com/source',
    imageUrl: '/placeholder.png',
    templateId: 'two-column-default',
    chartData: {
      perspectiveData: {
        mainPercentage: 85,
        mainLabel: '85% of the universe\'s mass is invisible to us',
        secondaryPercentage: 15,
        secondaryLabel: 'Visible matter',
        chartColor: '#6b7280'
      },
      sourceData: {
        segments: [
          { label: 'Dark Energy', percentage: 68, color: '#FF6A00' },
          { label: 'Dark Matter', percentage: 27, color: '#1A2238' },
          { label: 'Visible Matter', percentage: 5, color: '#6b7280' }
        ]
      }
    },
    status: 'Approved',
    likesCount: 42,
    viewsCount: 1234,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    user: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'TestUser',
      role: 'User',
      createdAt: new Date().toISOString()
    },
    categories: [
      { id: 'cat-1', namePl: 'Nauka', nameEn: 'Science', slug: 'science' }
    ]
  };

  // Test antistic without chart data (should show fallback)
  const testAntisticNoData: Antistic = {
    id: 'test-2',
    title: 'Test Without Chart Data',
    reversedStatistic: '75% of statistics are made up',
    sourceUrl: 'https://example.com/source2',
    imageUrl: '/placeholder.png',
    status: 'Approved',
    likesCount: 15,
    viewsCount: 567,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    user: {
      id: 'user-2',
      email: 'test2@example.com',
      username: 'TestUser2',
      role: 'User',
      createdAt: new Date().toISOString()
    },
    categories: [
      { id: 'cat-2', namePl: 'Humor', nameEn: 'Humor', slug: 'humor' }
    ]
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fb' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chart Data Test</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test 1: Antistic with Chart Data from Backend
            </h2>
            <p className="text-gray-600 mb-4">
              This should show the custom chart data (85% dark energy/matter, 5% visible matter)
            </p>
            <div className="max-w-md mx-auto">
              <AntisticCard antistic={testAntistic} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test 2: Antistic without Chart Data (Fallback)
            </h2>
            <p className="text-gray-600 mb-4">
              This should show a fallback chart based on the percentage in the text (75%)
            </p>
            <div className="max-w-md mx-auto">
              <AntisticCard antistic={testAntisticNoData} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Test 3: Antistic with No Percentage (Final Fallback)
            </h2>
            <p className="text-gray-600 mb-4">
              This should show default chart data (50% + generic segments)
            </p>
            <div className="max-w-md mx-auto">
              <AntisticCard antistic={{
                ...testAntisticNoData,
                id: 'test-3',
                title: 'Test Without Percentage',
                reversedStatistic: 'This statistic has no percentage in it'
              }} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Expected Results:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>✅ Test 1: Shows 85% chart with dark energy/matter segments</li>
              <li>✅ Test 2: Shows 75% chart extracted from text</li>
              <li>✅ Test 3: Shows 50% default chart with generic segments</li>
              <li>✅ All tests show TWO charts (left: perspective, right: source data)</li>
              <li>✅ No more identical mock data on all cards</li>
              <li>✅ Each antistic shows its own unique chart data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartDataTest;
