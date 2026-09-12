import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Radio, 
  Users, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  Sparkles, 
  ChevronRight,
  HandHeart,
  Calendar
} from 'lucide-react';
import { AppNotification } from '../../types';
import { StorageService } from '../../services/storageService';

interface FloatingNotificationToastProps {
  onOpenLiveSermon: () => void;
  onOpenDirectChat: (recipientId: string) => void;
  onOpenGroupChat: (groupId: string) => void;
  onNavigateTab: (tab: 'home' | 'bible' | 'community' | 'store' | 'me', subTab?: string) => void;
  onOpenAllNotifications: () => void;
}

export const FloatingNotificationToast: React.FC<FloatingNotificationToastProps> = ({
  onOpenLiveSermon,
  onOpenDirectChat,
  onOpenGroupChat,
  onNavigateTab,
  onOpenAllNotifications
}) => {
  const [currentNotif, setCurrentNotif] = useState<AppNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (notif: AppNotification) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentNotif(notif);
    setIsVisible(true);

    // Auto-dismiss after 8 seconds
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 8000);
  };

  useEffect(() => {
    // 1. Listen for new real-time notifications
    const handleNewNotif = (e: CustomEvent<AppNotification>) => {
      if (e.detail) {
        showNotification(e.detail);
      }
    };

    window.addEventListener('gcz_new_notification' as any, handleNewNotif);

    // 2. On mount, if there's an unread notification, preview the latest one once after 2.5s
    const previewTimer = setTimeout(() => {
      const all = StorageService.getAppNotifications();
      const latestUnread = all.find(n => !n.is_read);
      if (latestUnread) {
        showNotification(latestUnread);
      }
    }, 2500);

    return () => {
      window.removeEventListener('gcz_new_notification' as any, handleNewNotif);
      clearTimeout(previewTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isVisible || !currentNotif) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleRedirect = () => {
    setIsVisible(false);
    StorageService.markNotificationRead(currentNotif.id);

    // 1. Live stream
    if (currentNotif.target_type === 'live' || currentNotif.type === 'broadcast' || currentNotif.title.toLowerCase().includes('live')) {
      onOpenLiveSermon();
      return;
    }

    // 2. Cell group / Group chat
    if (currentNotif.target_type === 'group' || (currentNotif.target_id && (currentNotif.target_id.startsWith('grp_') || currentNotif.target_id.startsWith('group_')))) {
      const groupId = currentNotif.target_id || 'group_ignite_worship';
      onOpenGroupChat(groupId);
      return;
    }

    // 3. User Profile (Follow notifications)
    if (currentNotif.type === 'follow' || currentNotif.target_type === 'profile') {
      const targetUserId = currentNotif.target_id || currentNotif.actor_id;
      if (targetUserId) {
        window.dispatchEvent(new CustomEvent('gcz_open_user_profile', { detail: { userId: targetUserId } }));
        return;
      }
    }

    // 4. Direct Message
    if (currentNotif.target_type === 'dm' || currentNotif.type === 'chat') {
      const targetUserId = currentNotif.target_id || currentNotif.actor_id;
      if (targetUserId) {
        onOpenDirectChat(targetUserId);
        return;
      }
    }

    // 4. Prayer request
    if (currentNotif.target_type === 'prayer' || currentNotif.title.toLowerCase().includes('prayer') || currentNotif.message.toLowerCase().includes('prayer')) {
      onNavigateTab('community', 'prayers');
      return;
    }

    // 5. Testimony
    if (currentNotif.target_type === 'testimony' || currentNotif.title.toLowerCase().includes('testimony') || currentNotif.message.toLowerCase().includes('testimony')) {
      onNavigateTab('community', 'feed');
      return;
    }

    // 6. Events
    if (currentNotif.target_type === 'event' || currentNotif.title.toLowerCase().includes('event')) {
      onNavigateTab('community', 'events');
      return;
    }

    // Fallback: If actor_id is present, open chat
    if (currentNotif.actor_id) {
      onOpenDirectChat(currentNotif.actor_id);
    } else {
      onOpenAllNotifications();
    }
  };

  const getIcon = () => {
    if (currentNotif.target_type === 'group' || (currentNotif.target_id && (currentNotif.target_id.startsWith('grp_') || currentNotif.target_id.startsWith('group_')))) {
      return Users;
    }
    if (currentNotif.type === 'broadcast' || currentNotif.target_type === 'live' || currentNotif.title.toLowerCase().includes('live')) {
      return Radio;
    }
    if (currentNotif.title.toLowerCase().includes('prayer')) {
      return HandHeart;
    }
    if (currentNotif.title.toLowerCase().includes('event')) {
      return Calendar;
    }
    switch (currentNotif.type) {
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

  const getActionLabel = () => {
    if (currentNotif.target_type === 'live' || currentNotif.type === 'broadcast' || currentNotif.title.toLowerCase().includes('live')) {
      return 'Join Live Stream';
    }
    if (currentNotif.target_type === 'group' || (currentNotif.target_id && (currentNotif.target_id.startsWith('grp_') || currentNotif.target_id.startsWith('group_')))) {
      return 'Open Group';
    }
    if (currentNotif.type === 'chat' || currentNotif.target_type === 'dm') {
      return 'Reply in Chat';
    }
    if (currentNotif.type === 'follow') {
      return 'View Profile';
    }
    if (currentNotif.title.toLowerCase().includes('prayer')) {
      return 'View Prayer';
    }
    if (currentNotif.title.toLowerCase().includes('testimony')) {
      return 'View Testimony';
    }
    return 'View Now';
  };

  const Icon = getIcon();
  const actionLabel = getActionLabel();

  return (
    <aside 
      aria-label="New Alert"
      className="fixed top-18 right-3 sm:right-6 z-50 max-w-sm w-[calc(100vw-24px)] animate-in slide-in-from-top-4 fade-in duration-300"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setIsVisible(false), 4000);
      }}
    >
      <div 
        id="notification-floating-toast"
        role="button"
        tabIndex={0}
        onClick={handleRedirect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRedirect();
          }
        }}
        className="group relative bg-[#00172e] border-2 border-[#D4AF37] hover:border-[#F4C430] text-white rounded-2xl p-3.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] flex items-start gap-3 text-left"
      >
        {/* Glow accent */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#D4AF37] animate-ping" />

        {/* Icon / Avatar */}
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center shrink-0 shadow-md">
          {currentNotif.actor_avatar ? (
            <img 
              src={currentNotif.actor_avatar} 
              alt={currentNotif.actor_name || 'User'} 
              className="w-10 h-10 rounded-xl object-cover"
              onError={(e) => {
                // fallback to icon if image fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
              New Notification
            </span>
            <button
              id="btn-dismiss-floating-toast"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition-colors">
            {currentNotif.title}
          </h4>

          <p className="text-xs text-white/70 line-clamp-2 leading-snug">
            {currentNotif.message}
          </p>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-white/40">
              Tap float to redirect
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] font-bold group-hover:translate-x-1 transition-transform">
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
