import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export interface PoppingLiveComment {
  id: string;
  sender_name: string;
  message: string;
  avatar_url?: string;
  city?: string;
  is_decree?: boolean;
  is_current_user?: boolean;
  created_at: number;
}

interface LivePouringCommentsProps {
  isLive?: boolean;
  className?: string;
}

export const LivePouringComments: React.FC<LivePouringCommentsProps> = ({
  isLive = true,
  className = ''
}) => {
  const [poppingComments, setPoppingComments] = useState<PoppingLiveComment[]>([]);

  // Add a real comment to pop up on video screen
  const addPoppingComment = (comment: Omit<PoppingLiveComment, 'id' | 'created_at'>) => {
    // Only display if the stream is live
    if (!isLive) return;

    const newEntry: PoppingLiveComment = {
      ...comment,
      id: `live_pop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: Date.now()
    };

    setPoppingComments((prev) => {
      // Keep up to 3 recent real comments on screen so they don't block the video
      const updated = [...prev, newEntry];
      return updated.slice(-3);
    });

    // Display for 4 seconds, then smoothly dismiss
    setTimeout(() => {
      setPoppingComments((prev) => prev.filter((c) => c.id !== newEntry.id));
    }, 4200);
  };

  // Listen for real comment submissions dispatched from the comments box
  useEffect(() => {
    const handleCommentPopEvent = (e: any) => {
      if (!isLive) return;
      const detail = e.detail;
      if (!detail || !detail.message) return;

      addPoppingComment({
        sender_name: detail.sender_name || detail.user || 'Believer',
        message: detail.message || detail.text,
        city: detail.city,
        is_decree: detail.is_decree || Boolean(
          detail.message?.toLowerCase().includes('amen') || 
          detail.message?.toLowerCase().includes('receive') ||
          detail.message?.toLowerCase().includes('hallelujah')
        ),
        is_current_user: Boolean(detail.is_current_user),
        avatar_url: detail.avatar_url
      });
    };

    // Listen for liveSyncService remote comments
    const handleLiveStreamEvent = (e: any) => {
      if (!isLive) return;
      const event = e.detail;
      if (!event) return;

      if (event.type === 'stream_chat' && event.payload) {
        const payload = event.payload;
        addPoppingComment({
          sender_name: payload.user || payload.sender_name || 'Believer',
          message: payload.text || payload.message || '',
          city: payload.city,
          is_decree: Boolean(payload.is_decree),
          is_current_user: false,
          avatar_url: payload.avatar_url
        });
      }
    };

    window.addEventListener('gcz_live_comment_pop', handleCommentPopEvent);
    window.addEventListener('gcz_live_event_received', handleLiveStreamEvent);

    return () => {
      window.removeEventListener('gcz_live_comment_pop', handleCommentPopEvent);
      window.removeEventListener('gcz_live_event_received', handleLiveStreamEvent);
    };
  }, [isLive]);

  // NEVER show comments if not actively live or if there are no real comments
  if (!isLive || poppingComments.length === 0) {
    return null;
  }

  return (
    <div 
      className={`pointer-events-none flex flex-col justify-end space-y-2 overflow-hidden z-25 transition-all ${className}`}
      aria-live="polite"
    >
      {poppingComments.map((comment) => {
        const isSelf = comment.is_current_user;
        const initial = comment.sender_name ? comment.sender_name.charAt(0).toUpperCase() : 'G';

        return (
          <div
            key={comment.id}
            className={`flex items-start gap-2 px-3 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all ${
              isSelf
                ? 'bg-amber-950/85 text-white border-amber-400/50 shadow-amber-500/20'
                : 'bg-black/75 text-white border-white/20 shadow-black/60'
            }`}
          >
            {/* User Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-sm overflow-hidden ${
              isSelf 
                ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300' 
                : 'bg-gradient-to-tr from-amber-500 to-primary text-slate-950 ring-1 ring-white/30'
            }`}>
              {comment.avatar_url ? (
                <img 
                  src={comment.avatar_url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    // Fallback to initial
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            {/* Sender and real message */}
            <div className="flex flex-col min-w-0 max-w-[210px] sm:max-w-[280px]">
              <div className="flex items-center gap-1.5 leading-none mb-0.5">
                <span className={`font-black text-[11px] truncate ${isSelf ? 'text-amber-300' : 'text-primary'}`}>
                  {isSelf ? 'You' : comment.sender_name}
                </span>
                {comment.city && (
                  <span className="text-[9px] text-white/50 truncate">• {comment.city}</span>
                )}
                {comment.is_decree && (
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0 animate-pulse" />
                )}
              </div>
              <span className="text-white/95 text-[11px] leading-snug break-words">
                {comment.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
