import api from '../config/api';
import type { Antistic } from '../types';

export const fetchAntistic = async (id: string): Promise<Antistic> => {
  const response = await api.get<Antistic>(`/antistics/${id}`);
  return response.data;
};

export default {
  fetchAntistic,
};


