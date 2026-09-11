import { useState, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { StorageService } from '../services/storageService';

export interface OptimisticComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  status: 'pending' | 'synced' | 'failed';
  createdAt: string;
  error?: string;
}

export function useOptimisticComments(postId: string, initialComments: OptimisticComment[] = []) {
  const [comments, setComments] = useState<OptimisticComment[]>(initialComments);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = useCallback(
    async (
      text: string,
      user: { id: string; full_name: string; avatar_url?: string }
    ): Promise<{ success: boolean; restoredText?: string }> => {
      const cleanText = text.trim();
      if (!cleanText) return { success: false };

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticComment: OptimisticComment = {
        id: tempId,
        postId,
        userId: user.id,
        userName: user.full_name,
        userAvatar: user.avatar_url,
        text: cleanText,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // 1. Snapshot previous state for rollback
      const previousComments = [...comments];

      // 2. Immediately render in UI (Zero Latency)
      setComments((prev) => [optimisticComment, ...prev]);
      setIsSubmitting(true);

      try {
        const supabase = getSupabase();
        let createdRecord: any = null;

        if (supabase) {
          const { data, error } = await supabase
            .from('post_comments')
            .insert({
              post_id: postId,
              user_id: user.id,
              user_name: user.full_name,
              user_avatar: user.avatar_url,
              text: cleanText,
            })
            .select()
            .single();

          if (error) {
            throw error;
          }
          createdRecord = data;
        }

        // Also save to StorageService for local offline resilience
        StorageService.addCommentToTestimony(postId, cleanText, {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        } as any);

        // 3. Swap tempId with confirmed database record
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? {
                  ...c,
                  id: createdRecord?.id || tempId,
                  status: 'synced',
                }
              : c
          )
        );

        setIsSubmitting(false);
        return { success: true };
      } catch (err: any) {
        console.warn('Comment submission network error, rolling back:', err);
        // 4. Roll back optimistic comment & return text so user doesn't lose their input
        setComments(previousComments);
        setIsSubmitting(false);
        return { success: false, restoredText: cleanText };
      }
    },
    [comments, postId]
  );

  return {
    comments,
    setComments,
    addComment,
    isSubmitting,
  };
}
