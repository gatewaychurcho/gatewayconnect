import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, CornerDownRight } from 'lucide-react';
import { User, PostComment } from '../../types';
import { StorageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface CommentEventDetail {
  postId: string;
  postAuthorId: string;
  postTitle: string;
  comment: PostComment;
}

interface FloatingCommentReplyProps {
  currentUser?: User;
}

export const FloatingCommentReply: React.FC<FloatingCommentReplyProps> = ({ currentUser }) => {
  const [activeItem, setActiveItem] = useState<CommentEventDetail | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const handleCommentReceived = (e: any) => {
      const detail = e.detail as CommentEventDetail;
      if (!detail || !currentUser) return;
      // Only display to the author of the post (and ignore if author commented on their own post)
      if (detail.postAuthorId === currentUser.id && detail.comment.author_id !== currentUser.id) {
        setActiveItem(detail);
        setIsSent(false);
        setReplyText('');
      }
    };

    window.addEventListener('gcz_post_comment_received', handleCommentReceived);
    return () => window.removeEventListener('gcz_post_comment_received', handleCommentReceived);
  }, [currentUser]);

  if (!activeItem || !currentUser) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    StorageService.addCommentToTestimony(activeItem.postId, replyText.trim(), currentUser);
    setIsSent(true);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.85 }
    });

    setTimeout(() => {
      setActiveItem(null);
      setReplyText('');
      setIsSent(false);
    }, 1800);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-32px)] max-w-sm bg-card/95 backdrop-blur-md border border-primary/40 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <p className="text-[11px] font-bold text-foreground truncate">
              New Comment on Your Post
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              "{activeItem.postTitle}"
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveItem(null)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title="Dismiss (x)"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Incoming Comment Card */}
      <div className="bg-secondary/60 rounded-xl p-2.5 mb-2.5 flex items-start gap-2">
        <img
          src={activeItem.comment.author_avatar || '/assets/apostle_joe_daniels_main.jpg'}
          alt={activeItem.comment.author_name}
          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
        />
        <div className="min-w-0 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground text-[11px]">
              {activeItem.comment.author_name}
            </span>
            <span className="text-[10px] text-muted-foreground">Just now</span>
          </div>
          <p className="text-foreground/90 mt-0.5 text-xs leading-snug break-words">
            {activeItem.comment.text}
          </p>
        </div>
      </div>

      {/* Reply Action */}
      {isSent ? (
        <div className="py-2 text-center text-xs font-bold text-emerald-500 animate-in fade-in flex items-center justify-center gap-1.5">
          <CornerDownRight className="w-3.5 h-3.5" />
          <span>Reply posted successfully!</span>
        </div>
      ) : (
        <form onSubmit={handleSendReply} className="flex items-center gap-1.5">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${activeItem.comment.author_name.split(' ')[0]}...`}
            className="flex-1 bg-secondary border border-border rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
            title="Send reply"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
