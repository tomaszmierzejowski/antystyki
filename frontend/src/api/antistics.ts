import api from '../config/api';
import type { Antistic, UpdateAntisticRequest } from '../types';

export const fetchAntistic = async (id: string): Promise<Antistic> => {
  const response = await api.get<Antistic>(`/antistics/${id}`);
  return response.data;
};

export const updateAntistic = async (id: string, data: UpdateAntisticRequest): Promise<Antistic | { message: string, draftId?: string }> => {
  const response = await api.put<Antistic | { message: string, draftId?: string }>(`/antistics/${id}`, data);
  return response.data;
};

export default {
  fetchAntistic,
  updateAntistic,
};


