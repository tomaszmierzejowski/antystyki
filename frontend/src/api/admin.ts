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

  // Delete Comment (Admin)
  deleteComment: async (antisticId: string, commentId: string): Promise<void> => {
    await api.delete(`/antistics/${antisticId}/comments/${commentId}/admin`);
  },
};

export default adminApi;
