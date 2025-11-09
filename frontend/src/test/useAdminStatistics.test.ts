import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminStatistics } from '../hooks/useAdminStatistics';
import type { AdminStatisticsSummary } from '../types';

const mockedGet = vi.fn();

vi.mock('../config/api', () => ({
  __esModule: true,
  default: { get: mockedGet },
  api: { get: mockedGet },
}));

describe('useAdminStatistics', () => {
  const sampleSummary: AdminStatisticsSummary = {
    today: { totalPageViews: 10, uniqueVisitors: 5, humanPageViews: 8 },
    last7Days: { totalPageViews: 100, uniqueVisitors: 60, humanPageViews: 85 },
    last30Days: { totalPageViews: 430, uniqueVisitors: 210, humanPageViews: 360 },
    last365Days: { totalPageViews: 5200, uniqueVisitors: 1900, humanPageViews: 4200 },
    overall: { totalPageViews: 6000, uniqueVisitors: 2200, humanPageViews: 4800 },
  };

  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('loads statistics when enabled', async () => {
    mockedGet.mockResolvedValueOnce({ data: sampleSummary });

    const { result } = renderHook(() => useAdminStatistics(true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith('/admin/statistics/summary');
    expect(result.current.data).toEqual(sampleSummary);
    expect(result.current.error).toBeNull();
  });

  it('sets access denied error on 403', async () => {
    mockedGet.mockRejectedValueOnce({ response: { status: 403 } });

    const { result } = renderHook(() => useAdminStatistics(true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Access denied');
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(() => useAdminStatistics(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
