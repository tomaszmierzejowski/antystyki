import { useEffect } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import WebsiteStatistics from '../pages/admin/WebsiteStatistics';
import { AuthContext } from '../context/authContextValue';
import type { AuthContextType } from '../context/authTypes';
import type { AdminStatisticsSummary } from '../types';
import { useAdminStatistics } from '../hooks/useAdminStatistics';

vi.mock('../hooks/useAdminStatistics');

const mockedUseAdminStatistics = vi.mocked(useAdminStatistics);

const LocationObserver = ({ onChange }: { onChange: (path: string, search: string) => void }) => {
  const location = useLocation();
  useEffect(() => {
    onChange(location.pathname, location.search);
  }, [location, onChange]);
  return null;
};

const baseAuthValue: AuthContextType = {
  user: {
    id: '1',
    email: 'tmierzejowski@gmail.com',
    username: 'Admin Owner',
    role: 'Admin',
    createdAt: new Date().toISOString(),
  },
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: true,
  isAnonymous: false,
  createAnonymousUser: () => {},
};

describe('WebsiteStatistics page', () => {
  const sampleSummary: AdminStatisticsSummary = {
    today: { totalPageViews: 12, uniqueVisitors: 7, humanPageViews: 10 },
    last7Days: { totalPageViews: 144, uniqueVisitors: 80, humanPageViews: 120 },
    last30Days: { totalPageViews: 620, uniqueVisitors: 250, humanPageViews: 500 },
    last365Days: { totalPageViews: 7200, uniqueVisitors: 2100, humanPageViews: 6500 },
    overall: { totalPageViews: 8000, uniqueVisitors: 2400, humanPageViews: 7200 },
  };

  beforeEach(() => {
    mockedUseAdminStatistics.mockReset();
  });

  it('renders KPI cards when authorized', async () => {
    mockedUseAdminStatistics.mockReturnValue({
      data: sampleSummary,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <AuthContext.Provider value={baseAuthValue}>
        <MemoryRouter initialEntries={["/admin/statistics"]}>
          <Routes>
            <Route path="/admin/statistics" element={<WebsiteStatistics />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText('Website Statistics')).toBeInTheDocument();
    expect(screen.getByText('Dzisiaj')).toBeInTheDocument();
    expect(screen.getByText(/Odsłony/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('144')).toBeInTheDocument();
  });

  it('redirects unauthorized users to home', async () => {
    mockedUseAdminStatistics.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    let observedPath = '/admin/statistics';
    let observedSearch = '';

    const unauthorizedContext: AuthContextType = {
      ...baseAuthValue,
      user: {
        ...baseAuthValue.user!,
        email: 'other@example.com',
      },
    };

    render(
      <AuthContext.Provider value={unauthorizedContext}>
        <MemoryRouter initialEntries={['/admin/statistics']}>
          <LocationObserver onChange={(path, search) => { observedPath = path; observedSearch = search; }} />
          <Routes>
            <Route path="/admin/statistics" element={<WebsiteStatistics />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(observedPath).toBe('/');
      expect(observedSearch).toContain('Access%20Denied');
    });
  });
});
