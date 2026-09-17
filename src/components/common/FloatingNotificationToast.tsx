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
import { User, AppNotification } from '../../types';
import { StorageService } from '../../services/storageService';
import { cn } from '../../lib/utils';

interface FloatingNotificationToastProps {
  currentUser?: User | null;
  onOpenLiveSermon?: () => void;
  onOpenDirectChat: (recipientId: string) => void;
  onOpenGroupChat: (groupId: string) => void;
  onNavigateTab: (tab: 'home' | 'bible' | 'community' | 'store' | 'me', subTab?: string) => void;
  onOpenAllNotifications: () => void;
}

export const FloatingNotificationToast: React.FC<FloatingNotificationToastProps> = ({
  currentUser,
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
    const activeUser = currentUser || StorageService.getCurrentUser();
    const activeUserId = activeUser?.id;

    // Strict recipient isolation:
    // If notification has a recipient_id, ONLY display if it matches the current user
    if (notif.recipient_id) {
      if (!activeUserId || notif.recipient_id !== activeUserId) {
        return;
      }
    } else {
      // If no recipient_id, only general church broadcasts can appear app-wide
      if (notif.type !== 'broadcast') {
        return;
      }
    }

    // Do NOT show notification to the user who triggered the action
    if (notif.actor_id && activeUserId && notif.actor_id === activeUserId) {
      return;
    }

    // Suppress any "join live stream" or viewer join toasts; leave only the official live broadcast toast
    const lowerTitle = (notif.title || '').toLowerCase();
    const lowerMsg = (notif.message || '').toLowerCase();
    if (
      lowerTitle.includes('join live') || 
      lowerMsg.includes('join live') || 
      lowerTitle.includes('joined stream') || 
      lowerMsg.includes('joined stream') || 
      lowerTitle.includes('joined live') || 
      lowerMsg.includes('joined live')
    ) {
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentNotif(notif);
    setIsVisible(true);
    StorageService.playNotificationChime();

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

    // Listen for live broadcast starting
    const handleLiveBroadcast = (e: any) => {
      const status = e?.detail || StorageService.getLiveSermonStatus();
      if (status?.isLive) {
        showNotification({
          id: `broadcast_${Date.now()}`,
          actor_id: 'apostle_joe_daniels',
          actor_name: 'Apostle Joe Daniels',
          actor_avatar: '/assets/apostle_joe_daniels_main.jpg',
          title: 'Apostle Joe Daniels Live Broadcast',
          message: status.title || 'Sanctuary broadcast is now live on Home. Tap to watch.',
          type: 'broadcast',
          target_type: 'live',
          created_at: new Date().toISOString(),
          is_read: false
        });
      }
    };
    window.addEventListener('gcz_live_broadcast_started' as any, handleLiveBroadcast);

    // 2. On mount, preview the latest unread notification for this specific user
    const previewTimer = setTimeout(() => {
      const activeUser = currentUser || StorageService.getCurrentUser();
      if (!activeUser || activeUser.id === 'guest') return;
      const all = StorageService.getAppNotifications(activeUser.id);
      const latestUnread = all.find(n => !n.is_read && n.recipient_id === activeUser.id);
      if (latestUnread) {
        showNotification(latestUnread);
      }
    }, 2500);

    return () => {
      window.removeEventListener('gcz_new_notification' as any, handleNewNotif);
      window.removeEventListener('gcz_live_broadcast_started' as any, handleLiveBroadcast);
      clearTimeout(previewTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentUser?.id]);

  if (!isVisible || !currentNotif) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleRedirect = () => {
    setIsVisible(false);
    StorageService.markNotificationRead(currentNotif.id);

    // 1. Live stream - stream directly on home
    if (currentNotif.target_type === 'live' || currentNotif.type === 'broadcast' || currentNotif.title.toLowerCase().includes('live')) {
      onNavigateTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      return 'Live Broadcast';
    }
    if (currentNotif.target_type === 'group' || (currentNotif.target_id && (currentNotif.target_id.startsWith('grp_') || currentNotif.target_id.startsWith('group_')))) {
      return 'Open Group Chat';
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
      className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 max-w-[360px] w-[calc(100vw-32px)] animate-in slide-in-from-top-3 fade-in duration-200"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setIsVisible(false), 3500);
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
        className="group relative bg-card/95 border border-border hover:border-primary/60 text-foreground rounded-full pl-2 pr-3 py-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-[1.01] active:scale-98 flex items-center gap-2.5 text-left"
      >
        {/* Avatar / Icon */}
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 overflow-hidden">
          {currentNotif.actor_avatar ? (
            <img 
              src={currentNotif.actor_avatar} 
              alt={currentNotif.actor_name || 'User'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Icon className="w-4 h-4 text-primary" />
          )}
        </div>

        {/* 1-line Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground truncate">
              {currentNotif.title}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">
            {currentNotif.message}
          </p>
        </div>

        <button
          id="btn-dismiss-floating-toast"
          onClick={handleDismiss}
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
