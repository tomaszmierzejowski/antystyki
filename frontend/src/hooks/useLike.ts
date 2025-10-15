import { useState } from 'react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

interface UseLikeProps {
  antisticId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
}

export const useLike = ({ antisticId, initialLikesCount, initialIsLiked }: UseLikeProps) => {
  const { isAuthenticated } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show auth modal
      window.location.href = '/login';
      return;
    }

    if (isLoading) return;

    // Optimistic update
    const previousLikesCount = likesCount;
    const previousIsLiked = isLiked;
    
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setIsLoading(true);

    try {
      if (isLiked) {
        await api.delete(`/antistics/${antisticId}/like`);
      } else {
        await api.post(`/antistics/${antisticId}/like`);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error('Error toggling like:', error);
      alert('Failed to update like. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    likesCount,
    isLiked,
    isLoading,
    toggleLike
  };
};
