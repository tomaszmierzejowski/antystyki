import { useCallback, useEffect, useState } from 'react';
import api from '../config/api';
import type { AdminStatisticsSummary } from '../types';

export interface UseAdminStatisticsResult {
  data: AdminStatisticsSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminStatistics = (enabled: boolean = true): UseAdminStatisticsResult => {
  const [data, setData] = useState<AdminStatisticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<AdminStatisticsSummary>('/admin/statistics/summary');
      setData(response.data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setError('Access denied');
      } else {
        setError('Nie udało się pobrać statystyk strony. Spróbuj ponownie później.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!enabled) {
        setLoading(false);
        setData(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get<AdminStatisticsSummary>('/admin/statistics/summary');
        if (!isCancelled) {
          setData(response.data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          if (err?.response?.status === 403 || err?.response?.status === 401) {
            setError('Access denied');
          } else {
            setError('Nie udało się pobrać statystyk strony. Spróbuj ponownie później.');
          }
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatistics,
  };
};

export default useAdminStatistics;
