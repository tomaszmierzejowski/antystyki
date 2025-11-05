import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuth } from '../context/useAuth';
import { trackAntisticLike, trackAntisticUnlike } from '../utils/analytics';

interface UseLikeProps {
  antisticId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
}

// Generate or get anonymous user ID
const getAnonymousUserId = (): string => {
  const storageKey = 'anonymousUserId';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    // Generate a unique ID for this browser/device
    userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
};

// Track liked antistics for anonymous users
const ANONYMOUS_LIKES_KEY = 'anonymousLikes';

const getAnonymousLikes = (): Set<string> => {
  try {
    const stored = localStorage.getItem(ANONYMOUS_LIKES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveAnonymousLikes = (likes: Set<string>) => {
  try {
    localStorage.setItem(ANONYMOUS_LIKES_KEY, JSON.stringify([...likes]));
  } catch (error) {
    console.error('Failed to save anonymous likes:', error);
  }
};

export const useLike = ({ antisticId, initialLikesCount, initialIsLiked }: UseLikeProps) => {
  const { isAuthenticated } = useAuth();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Check if anonymous user has already liked this antistic
  useEffect(() => {
    if (!isAuthenticated) {
      const anonymousLikes = getAnonymousLikes();
      setIsLiked(anonymousLikes.has(antisticId));
    }
  }, [antisticId, isAuthenticated]);

  const toggleLike = async () => {
    if (isLoading) return;

    // Optimistic update
    const previousLikesCount = likesCount;
    const previousIsLiked = isLiked;
    
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        // Authenticated user - use API
        if (isLiked) {
          await api.delete(`/antistics/${antisticId}/like`);
          trackAntisticUnlike(antisticId);
        } else {
          await api.post(`/antistics/${antisticId}/like`);
          trackAntisticLike(antisticId);
        }
      } else {
        // Anonymous user - track locally and send to API with anonymous ID
        const anonymousLikes = getAnonymousLikes();
        const anonymousUserId = getAnonymousUserId();
        
        if (isLiked) {
          // Unlike
          anonymousLikes.delete(antisticId);
          await api.delete(`/antistics/${antisticId}/like`, {
            headers: { 'X-Anonymous-User-Id': anonymousUserId }
          });
          trackAntisticUnlike(antisticId);
        } else {
          // Like
          anonymousLikes.add(antisticId);
          await api.post(`/antistics/${antisticId}/like`, {}, {
            headers: { 'X-Anonymous-User-Id': anonymousUserId }
          });
          trackAntisticLike(antisticId);
        }
        
        saveAnonymousLikes(anonymousLikes);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error('Error toggling like:', error);
      
      // Don't alert for anonymous users - silent fail is better UX
      if (isAuthenticated) {
        alert('Failed to update like. Please try again.');
      }
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
