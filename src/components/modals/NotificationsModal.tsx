import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  Radio, 
  ChevronRight,
  Users,
  Calendar,
  HandHeart
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { AppNotification } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveSermon?: () => void;
  onOpenDirectChat?: (recipientId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
  onNavigateTab?: (tab: 'home' | 'bible' | 'community' | 'store' | 'me', subTab?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenLiveSermon,
  onOpenDirectChat,
  onOpenGroupChat,
  onNavigateTab
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [allReadCleared, setAllReadCleared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const list = StorageService.getAppNotifications();
      // Ensure milestones are purged
      const cleaned = list.filter(n => !n.title.toLowerCase().includes('milestone') && !n.message.toLowerCase().includes('milestone'));
      setNotifications(cleaned);
      setAllReadCleared(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    StorageService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setAllReadCleared(true);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (n: AppNotification) => {
    StorageService.markNotificationRead(n.id);
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    onClose();

    // 1. Live stream / broadcast
    if (n.target_type === 'live' || n.type === 'broadcast' || n.title.toLowerCase().includes('live')) {
      if (onOpenLiveSermon) {
        onOpenLiveSermon();
        return;
      }
    }

    // 2. Group chat / Cell group
    if (n.target_type === 'group' || (n.target_id && (n.target_id.startsWith('grp_') || n.target_id.startsWith('group_')))) {
      const groupId = n.target_id || 'group_ignite_worship';
      if (onOpenGroupChat) {
        onOpenGroupChat(groupId);
        return;
      }
    }

    // 3. User Profile (Follower notification)
    if (n.type === 'follow' || n.target_type === 'profile') {
      const targetUserId = n.target_id || n.actor_id;
      if (targetUserId) {
        window.dispatchEvent(new CustomEvent('gcz_open_user_profile', { detail: { userId: targetUserId } }));
        onClose();
        return;
      }
    }

    // 4. Direct Message
    if (n.target_type === 'dm' || n.type === 'chat') {
      const targetUserId = n.target_id || n.actor_id;
      if (targetUserId && onOpenDirectChat) {
        onOpenDirectChat(targetUserId);
        return;
      }
    }

    // 4. Prayer request
    if (n.target_type === 'prayer' || n.title.toLowerCase().includes('prayer') || n.message.toLowerCase().includes('prayer')) {
      if (onNavigateTab) {
        onNavigateTab('community', 'prayers');
        return;
      }
    }

    // 5. Testimony / Fellowship
    if (n.target_type === 'testimony' || n.title.toLowerCase().includes('testimony') || n.message.toLowerCase().includes('testimony')) {
      if (onNavigateTab) {
        onNavigateTab('community', 'feed');
        return;
      }
    }

    // 6. Events
    if (n.target_type === 'event' || n.title.toLowerCase().includes('event') || n.message.toLowerCase().includes('event')) {
      if (onNavigateTab) {
        onNavigateTab('community', 'events');
        return;
      }
    }

    // 7. Store / Altar seed
    if (n.target_type === 'store' || n.title.toLowerCase().includes('seed') || n.title.toLowerCase().includes('moors')) {
      if (onNavigateTab) {
        onNavigateTab('store');
        return;
      }
    }

    // Fallback: If actor_id is present, open chat with them
    if (n.actor_id && onOpenDirectChat) {
      onOpenDirectChat(n.actor_id);
    }
  };

  const getRedirectLabel = (n: AppNotification) => {
    if (n.target_type === 'live' || n.type === 'broadcast' || n.title.toLowerCase().includes('live')) {
      return 'Join Live Stream';
    }
    if (n.target_type === 'group' || (n.target_id && (n.target_id.startsWith('grp_') || n.target_id.startsWith('group_')))) {
      return 'Open Group Chat';
    }
    if (n.type === 'chat' || n.target_type === 'dm') {
      return 'Reply in Chat';
    }
    if (n.type === 'follow') {
      return 'Send Blessings';
    }
    if (n.title.toLowerCase().includes('prayer')) {
      return 'View Prayers';
    }
    if (n.title.toLowerCase().includes('testimony')) {
      return 'View Testimony';
    }
    if (n.title.toLowerCase().includes('event')) {
      return 'View Event';
    }
    return 'Open';
  };

  const getIcon = (n: AppNotification) => {
    if (n.target_type === 'group' || (n.target_id && (n.target_id.startsWith('grp_') || n.target_id.startsWith('group_')))) {
      return Users;
    }
    if (n.type === 'broadcast' || n.target_type === 'live' || n.title.toLowerCase().includes('live')) {
      return Radio;
    }
    if (n.title.toLowerCase().includes('prayer')) {
      return HandHeart;
    }
    if (n.title.toLowerCase().includes('event')) {
      return Calendar;
    }
    switch (n.type) {
      case 'chat':
        return MessageSquare;
      case 'like':
        return Heart;
      case 'follow':
        return UserPlus;
      default:
        return Sparkles;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#00172e] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60">
                Tap any notification to redirect to the conversation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                id="btn-read-all-notifications"
                onClick={handleMarkAllRead}
                className="text-xs text-[#D4AF37] hover:underline font-bold"
              >
                Mark Read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List Body */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[160px]">
          {notifications.length === 0 ? (
            <div className="text-center py-10 px-4 text-white/40 space-y-2">
              <CheckCheck className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-white/70">All messages are read</p>
              <p className="text-xs text-white/40">You're completely caught up.</p>
            </div>
          ) : (
            notifications.map(n => {
              const Icon = getIcon(n);
              const actionLabel = getRedirectLabel(n);
              return (
                <div
                  key={n.id}
                  id={`notif-item-${n.id}`}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer text-left hover:scale-[1.01] ${
                    !n.is_read
                      ? 'bg-[#00172e] border-[#D4AF37]/50 shadow-md hover:border-[#D4AF37] hover:bg-[#002244]'
                      : 'bg-[#001428] border-white/5 opacity-85 hover:opacity-100 hover:border-white/20 hover:bg-[#001830]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      !n.is_read 
                        ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm' 
                        : 'bg-white/10 text-white/60 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors">
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono shrink-0">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-white/75 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 capitalize">
                            {n.type}
                          </span>
                          {n.actor_name && (
                            <span className="text-[10px] text-white/50 truncate">
                              {n.actor_name}
                            </span>
                          )}
                        </div>

                        {/* Redirect indicator */}
                        <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>{actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

