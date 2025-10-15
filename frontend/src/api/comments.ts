import api from '../config/api';
import type { Comment, CommentListResponse, CreateCommentRequest } from '../types';

export const commentsApi = {
  // Get comments for an antistic
  async getComments(antisticId: string, page: number = 1, pageSize: number = 20): Promise<CommentListResponse> {
    const response = await api.get(`/antistics/${antisticId}/comments`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  // Create a new comment
  async createComment(antisticId: string, data: CreateCommentRequest): Promise<Comment> {
    const response = await api.post(`/antistics/${antisticId}/comments`, data);
    return response.data;
  },

  // Delete a comment
  async deleteComment(antisticId: string, commentId: string): Promise<void> {
    await api.delete(`/antistics/${antisticId}/comments/${commentId}`);
  }
};

export default commentsApi;
