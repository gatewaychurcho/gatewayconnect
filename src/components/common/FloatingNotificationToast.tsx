import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Sparkles, 
  MessageSquare, 
  HandHeart, 
  Calendar, 
  Bell, 
  X,
  ChevronRight
} from 'lucide-react';
import { User, AppNotification } from '../../types';
import { StorageService } from '../../services/storageService';

interface ToastItem {
  id: string;
  type: 'live' | 'post' | 'message' | 'prayer' | 'event' | 'alert';
  title: string;
  subtitle: string;
  targetType: string;
  targetId?: string;
  timestamp: number;
}

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
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentKeysRef = useRef<Map<string, number>>(new Map());

  // Track recent user interaction in the app to determine if user is actively using it
  const lastActiveRef = useRef<number>(Date.now());
  useEffect(() => {
    const markActive = () => {
      lastActiveRef.current = Date.now();
    };
    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('mousedown', markActive, { passive: true });
    window.addEventListener('keydown', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });
    window.addEventListener('scroll', markActive, { passive: true });
    return () => {
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('scroll', markActive);
    };
  }, []);

  const isUserActivelyUsingApp = (): boolean => {
    if (typeof document === 'undefined') return false;
    if (document.hidden) return false;
    if (typeof document.hasFocus === 'function' && !document.hasFocus()) return false;
    if (typeof window !== 'undefined' && Boolean((window as any).AndroidBridge?.isAppInBackground?.())) return false;
    // Interacted within the last 15 seconds while window has focus
    return Date.now() - lastActiveRef.current < 15000;
  };

  const triggerToast = (
    type: ToastItem['type'],
    title: string,
    subtitle: string,
    targetType: string,
    targetId?: string
  ) => {
    // Only important events (live, message, post) can trigger toasts
    if (!['live', 'message', 'post'].includes(type)) {
      return;
    }

    const now = Date.now();
    const dedupKey = `${type}_${targetId || title}`;
    const lastSeen = recentKeysRef.current.get(dedupKey) || 0;

    // Deduplication: prevent identical alert within 15 seconds
    if (now - lastSeen < 15000) {
      return;
    }
    recentKeysRef.current.set(dedupKey, now);

    // Clean up old keys older than 30s
    if (recentKeysRef.current.size > 50) {
      recentKeysRef.current.forEach((time, key) => {
        if (now - time > 30000) recentKeysRef.current.delete(key);
      });
    }

    // Check if app is in background (minimized/closed screen/different tab)
    const isBackground = typeof document !== 'undefined' && document.hidden;
    const isAndroidBackground = typeof window !== 'undefined' && 
      Boolean((window as any).AndroidBridge?.isAppInBackground?.());

    if (isBackground || isAndroidBackground) {
      // 1. Android Native Background Notification with Sound + Vibration + Launcher Icon Badge
      try {
        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.showSystemNotification) {
          (window as any).AndroidBridge.showSystemNotification(
            title,
            subtitle,
            1,
            targetType,
            targetId || ''
          );
        }
      } catch (err) {
        console.warn('Native background notification warning:', err);
      }

      // 2. Web browser background push / system notification
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: subtitle,
            icon: '/assets/church_logo.png'
          });
        }
      } catch {}

      return;
    }

    // While user is actively using the app/web: NO pop-up/toast notifications.
    // They go only into the bell notification system.
    if (isUserActivelyUsingApp()) {
      return;
    }

    // Top-screen pop-up shown ONLY when the user is NOT actively using the app/web
    const newToast: ToastItem = {
      id: `toast_${now}`,
      type,
      title,
      subtitle,
      targetType,
      targetId,
      timestamp: now
    };

    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveToast(newToast);
    setIsVisible(true);

    // Audio chime + haptic feedback
    try {
      StorageService.playNotificationChime();
    } catch {}

    try {
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.vibrate) {
        (window as any).AndroidBridge.vibrate(35);
      }
    } catch {}

    // Auto-dismiss after 4.5 seconds
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 4500);
  };

  useEffect(() => {
    // 1. LIVE Video Broadcast Started
    const handleLiveBroadcast = (e: any) => {
      const status = e?.detail || StorageService.getLiveSermonStatus();
      if (status?.isLive) {
        triggerToast(
          'live',
          'Live Broadcast Started',
          'Sanctuary service is now live • Tap to watch',
          'live'
        );
      }
    };

    // 2. LIVE Status Updated (checks if transitioned to live)
    const handleLiveStatus = (e: any) => {
      const status = e?.detail;
      if (status?.isLive) {
        triggerToast(
          'live',
          'Live Broadcast Started',
          'Sanctuary service is now live • Tap to watch',
          'live'
        );
      }
    };

    // 3. New Community Post Published
    const handleNewPost = (e: any) => {
      const post = e?.detail;
      if (!post) return;
      const activeUser = currentUser || StorageService.getCurrentUser();
      // Do not notify author for their own submission
      if (activeUser && post.user_id === activeUser.id) return;

      triggerToast(
        'post',
        'New Community Post',
        'A new post was published to the feed',
        'testimony',
        post.id
      );
    };

    // 4. New App Notifications (Messages and Live only trigger toasts; likes/reactions/follows go purely into the bell system)
    const handleNewNotif = (e: CustomEvent<AppNotification>) => {
      const notif = e.detail;
      if (!notif) return;
      const activeUser = currentUser || StorageService.getCurrentUser();
      const activeUserId = activeUser?.id;

      // Recipient check
      if (notif.recipient_id && activeUserId && notif.recipient_id !== activeUserId) return;
      if (notif.actor_id && activeUserId && notif.actor_id === activeUserId) return;

      const lowerTitle = (notif.title || '').toLowerCase();
      const lowerType = (notif.type || '').toLowerCase();

      // Only important events trigger a toast (when inactive). Small activity (likes, reactions, follows, prayers) goes only to the bell icon!
      if (lowerType === 'broadcast' || lowerTitle.includes('live')) {
        triggerToast(
          'live',
          'Live Broadcast Started',
          'Sanctuary service is now live • Tap to watch',
          'live'
        );
      } else if (lowerType === 'chat' || notif.target_type === 'dm' || notif.target_type === 'group') {
        triggerToast(
          'message',
          'New Message',
          'Tap to open conversation',
          notif.target_type || 'chat',
          notif.target_id || notif.actor_id
        );
      }
    };

    window.addEventListener('gcz_live_broadcast_started' as any, handleLiveBroadcast);
    window.addEventListener('gcz_live_status_updated' as any, handleLiveStatus);
    window.addEventListener('gcz_testimony_created' as any, handleNewPost);
    window.addEventListener('gcz_new_notification' as any, handleNewNotif);

    return () => {
      window.removeEventListener('gcz_live_broadcast_started' as any, handleLiveBroadcast);
      window.removeEventListener('gcz_live_status_updated' as any, handleLiveStatus);
      window.removeEventListener('gcz_testimony_created' as any, handleNewPost);
      window.removeEventListener('gcz_new_notification' as any, handleNewNotif);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentUser?.id]);

  if (!isVisible || !activeToast) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleToastClick = () => {
    setIsVisible(false);

    switch (activeToast.type) {
      case 'live':
        if (onOpenLiveSermon) onOpenLiveSermon();
        else onNavigateTab('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case 'post':
        onNavigateTab('community', 'feed');
        break;

      case 'message':
        if (activeToast.targetType === 'group' && activeToast.targetId) {
          onOpenGroupChat(activeToast.targetId);
        } else if (activeToast.targetId) {
          onOpenDirectChat(activeToast.targetId);
        } else {
          onNavigateTab('community', 'groups');
        }
        break;

      case 'prayer':
        onNavigateTab('community', 'prayers');
        break;

      case 'event':
        onNavigateTab('community', 'events');
        break;

      default:
        onOpenAllNotifications();
        break;
    }
  };

  const renderIcon = () => {
    switch (activeToast.type) {
      case 'live':
        return (
          <div className="relative w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            <span className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <Radio className="w-4 h-4 text-red-500 relative z-10" />
          </div>
        );
      case 'post':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
        );
      case 'prayer':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <HandHeart className="w-4 h-4 text-amber-400" />
          </div>
        );
      case 'event':
        return (
          <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
        );
    }
  };

  return (
    <aside 
      aria-label="Notification Alert"
      className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 max-w-[340px] w-[calc(100vw-24px)] pointer-events-auto transition-all animate-in slide-in-from-top-4 fade-in duration-200"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => setIsVisible(false), 2500);
      }}
    >
      <div 
        id="notification-floating-toast"
        role="button"
        tabIndex={0}
        onClick={handleToastClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToastClick();
          }
        }}
        className="group relative bg-[#111B21]/95 dark:bg-[#111B21]/95 text-white border border-[#222E35] hover:border-emerald-500/60 rounded-2xl pl-2.5 pr-2 py-2 shadow-2xl backdrop-blur-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-98 flex items-center gap-2.5 text-left"
      >
        {/* Minimal Category Icon */}
        {renderIcon()}

        {/* Minimal WhatsApp-Style Label (No full message, no post content, no sender details) */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-white truncate leading-tight">
              {activeToast.title}
            </span>
            <span className="text-[10px] text-[#8696A0] shrink-0 font-medium">
              now
            </span>
          </div>
          <p className="text-[11px] text-[#8696A0] truncate leading-tight mt-0.5">
            {activeToast.subtitle}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          id="btn-dismiss-floating-toast"
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-[#8696A0] hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
