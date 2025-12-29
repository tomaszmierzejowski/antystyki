import api from '../config/api';

const adminApi = {
  // Hide/Unhide Antistic
  hideAntistic: async (antisticId: string): Promise<void> => {
    await api.post(`/antistics/${antisticId}/hide`);
  },

  unhideAntistic: async (antisticId: string): Promise<void> => {
    await api.post(`/antistics/${antisticId}/unhide`);
  },

  // Delete Antistic
  deleteAntistic: async (antisticId: string): Promise<void> => {
    await api.delete(`/antistics/${antisticId}`);
  },

  // Hide/Unhide Statistic
  hideStatistic: async (statisticId: string): Promise<void> => {
    await api.post(`/statistics/${statisticId}/hide`);
  },

  unhideStatistic: async (statisticId: string): Promise<void> => {
    await api.post(`/statistics/${statisticId}/unhide`);
  },

  // Delete Statistic
  deleteStatistic: async (statisticId: string): Promise<void> => {
    await api.delete(`/statistics/${statisticId}`);
  },

  // Delete Comment (Admin)
  deleteComment: async (antisticId: string, commentId: string): Promise<void> => {
    await api.delete(`/antistics/${antisticId}/comments/${commentId}/admin`);
  },
};

export default adminApi;
