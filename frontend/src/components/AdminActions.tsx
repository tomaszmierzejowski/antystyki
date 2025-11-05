import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import adminApi from '../api/admin';

interface AdminActionsProps {
  antisticId: string;
  commentId?: string;
  isHidden?: boolean;
  onAction?: () => void;
  type: 'antistic' | 'comment';
}

const AdminActions: React.FC<AdminActionsProps> = ({ 
  antisticId, 
  commentId, 
  isHidden = false, 
  onAction,
  type 
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has admin privileges
  if (!user || (user.role !== 'Admin' && user.role !== 'Moderator')) {
    return null;
  }

  const handleHide = async () => {
    if (!confirm('Are you sure you want to hide this content?')) return;
    
    setIsLoading(true);
    try {
      if (type === 'antistic') {
        if (isHidden) {
          await adminApi.unhideAntistic(antisticId);
        } else {
          await adminApi.hideAntistic(antisticId);
        }
      }
      onAction?.();
    } catch (error) {
      console.error('Failed to hide/unhide:', error);
      alert('Failed to update content visibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this content? This action cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      if (type === 'antistic') {
        await adminApi.deleteAntistic(antisticId);
      } else if (type === 'comment' && commentId) {
        await adminApi.deleteComment(antisticId, commentId);
      }
      onAction?.();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete content');
    } finally {
      setIsLoading(false);
    }
  };

  if (type === 'antistic') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleHide}
          disabled={isLoading}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            isHidden 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          } disabled:opacity-50`}
        >
          {isLoading ? '...' : (isHidden ? 'Unhide' : 'Hide')}
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? '...' : 'Delete'}
        </button>
      </div>
    );
  }

  if (type === 'comment') {
    return (
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
      >
        {isLoading ? '...' : 'Delete'}
      </button>
    );
  }

  return null;
};

export default AdminActions;
