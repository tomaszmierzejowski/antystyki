import api from '../config/api';
import type { StatisticListResponse, Statistic } from '../types';

export type StatisticsSortOption = 'top' | 'new' | 'views';

export interface StatisticsQueryParams {
  page?: number;
  pageSize?: number;
  sort?: StatisticsSortOption;
}

export interface StatisticVoteResponse {
  likeCount: number;
  dislikeCount: number;
}

export interface CreateStatisticPayload {
  title: string;
  summary: string;
  description?: string;
  sourceUrl: string;
  sourceCitation?: string;
  chartData?: any;
}

export const fetchStatistics = async (params: StatisticsQueryParams = {}): Promise<StatisticListResponse> => {
  const response = await api.get<StatisticListResponse>('/statistics', { params });
  return response.data;
};

export const fetchStatistic = async (id: string): Promise<Statistic> => {
  const response = await api.get<Statistic>(`/statistics/${id}`);
  return response.data;
};

export const voteOnStatistic = async (
  id: string,
  voteType: 'Like' | 'Dislike',
  remove: boolean = false
): Promise<StatisticVoteResponse> => {
  const response = await api.post<StatisticVoteResponse>(`/statistics/${id}/vote`, {
    voteType,
    remove,
  });
  return response.data;
};

export const fetchPendingStatistics = async (): Promise<StatisticListResponse> => {
  const response = await api.get<StatisticListResponse>('/admin/statistics/pending');
  return response.data;
};

export const moderateStatistic = async (
  id: string,
  approve: boolean,
  moderatorNotes?: string | null
): Promise<void> => {
  await api.post(`/admin/statistics/${id}/moderate`, {
    approve,
    moderatorNotes: moderatorNotes ?? null,
  });
};

export const createStatistic = async (payload: CreateStatisticPayload): Promise<Statistic> => {
  const response = await api.post<Statistic>('/statistics', payload);
  return response.data;
};

export default {
  fetchStatistics,
  fetchStatistic,
  voteOnStatistic,
  fetchPendingStatistics,
  moderateStatistic,
  createStatistic,
};

