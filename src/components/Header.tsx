import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Code2, 
  FileCode, 
  Database,
  UserCircle,
  LogIn,
  Send,
  Radio,
  Bell,
  Terminal,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { User, PushNotification, NotificationSettings } from '../types';
import { StorageService } from '../services/storageService';

interface HeaderProps {
  currentUser: User;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
  onOpenFlutterExport: () => void;
  onOpenAdminPanel?: () => void;
  onOpenDevConsole?: () => void;
  onOpenDirectMessages?: () => void;
  onOpenNotifications?: () => void;
  onOpenLiveSermon?: () => void;
  isLiveSermon?: boolean;
  unreadDmsCount?: number;
  pushNotifications?: PushNotification[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  lowDataMode,
  onToggleLowData,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
  onOpenFlutterExport,
  onOpenAdminPanel,
  onOpenDevConsole,
  onOpenDirectMessages,
  onOpenNotifications,
  onOpenLiveSermon,
  isLiveSermon,
  unreadDmsCount = 0
}) => {
  const isDeveloper = currentUser.role === 'developer' || currentUser.phone === '0780699988' || currentUser.id === 'usr_developer';
  const isSuperAdmin = currentUser.role === 'super_admin' || isDeveloper;
  const isGuest = currentUser.role === 'guest';

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    StorageService.getNotificationSettings(currentUser?.id)
  );

  useEffect(() => {
    StorageService.initTheme();
    const handleThemeChange = (e: any) => {
      if (e?.detail?.theme) setTheme(e.detail.theme);
    };
    window.addEventListener('gcz_theme_changed', handleThemeChange);
    return () => window.removeEventListener('gcz_theme_changed', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const next = StorageService.toggleTheme();
    setTheme(next);
  };

  useEffect(() => {
    const updateSettingsAndCount = () => {
      const settings = StorageService.getNotificationSettings(currentUser?.id);
      setNotifSettings(settings);
      const list = StorageService.getAppNotifications(currentUser?.id);
      const count = list.filter(n => {
        if (n.is_read) return false;
        if (n.title.toLowerCase().includes('milestone') || n.message.toLowerCase().includes('milestone')) return false;
        if (!settings.liveStreams && ((n.type as string) === 'stream' || (n.type as string) === 'broadcast' || n.title.toLowerCase().includes('live') || n.message.toLowerCase().includes('stream'))) return false;
        if (!settings.prayerRequests && ((n.type as string) === 'prayer' || n.title.toLowerCase().includes('prayer') || n.message.toLowerCase().includes('prayer'))) return false;
        if (!settings.directMessages && ((n.type as string) === 'dm' || (n.type as string) === 'chat' || n.title.toLowerCase().includes('message') || n.title.toLowerCase().includes('dm'))) return false;
        return true;
      }).length;
      setUnreadNotifsCount(count);
    };

    updateSettingsAndCount();
    window.addEventListener('gcz_notifications_updated', updateSettingsAndCount);
    window.addEventListener('gcz_new_notification', updateSettingsAndCount as any);
    window.addEventListener('gcz_notification_settings_updated', updateSettingsAndCount as any);
    window.addEventListener('gcz_group_messages_updated', updateSettingsAndCount as any);
    window.addEventListener('storage', updateSettingsAndCount);
    return () => {
      window.removeEventListener('gcz_notifications_updated', updateSettingsAndCount);
      window.removeEventListener('gcz_new_notification', updateSettingsAndCount as any);
      window.removeEventListener('gcz_notification_settings_updated', updateSettingsAndCount as any);
      window.removeEventListener('gcz_group_messages_updated', updateSettingsAndCount as any);
      window.removeEventListener('storage', updateSettingsAndCount);
    };
  }, [currentUser?.id]);

  const handleProfileClick = () => {
    if (isGuest) {
      onOpenAuthModal();
      return;
    }
    if (onOpenProfileModal) {
      onOpenProfileModal();
    } else {
      onOpenAuthModal();
    }
  };

  return (
    <header className="gcz-header sticky top-0 z-40 h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 shrink-0 transition-all">
      
      {/* Brand & Ministry Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/60 border border-border flex items-center justify-center p-1.5 shadow-sm shrink-0">
          <img 
            src="/assets/apostle_silhouette.svg" 
            alt="Apostle Joe Daniels Ministry" 
            className="w-full h-full object-contain filter drop-shadow opacity-90"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-primary font-bold text-sm sm:text-base tracking-wide leading-tight">
            GATEWAY
          </span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">
            HARARE
          </span>
        </div>
      </div>

      {/* Action Controls & User Identity */}
      <div className="gcz-header-actions flex items-center gap-1 sm:gap-2 shrink-0">
        
        {/* Direct Messages & Groups Button */}
        {!isGuest && onOpenDirectMessages && (
          <button
            id="btn-direct-messages-header"
            onClick={onOpenDirectMessages}
            title="Chats & Groups"
            className="relative p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 text-primary" />
            {unreadDmsCount > 0 && notifSettings.directMessages && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {unreadDmsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Bell Button (Only visible when unread notifications > 0) */}
        {!isGuest && onOpenNotifications && unreadNotifsCount > 0 && (
          <button
            id="btn-notifications-header"
            onClick={onOpenNotifications}
            title="Notifications & Live Alerts"
            className="relative p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition-all shadow-sm cursor-pointer animate-in fade-in shrink-0"
          >
            <Bell className="w-4 h-4 text-primary" />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
              {unreadNotifsCount}
            </span>
          </button>
        )}

        {/* Low-Data / HD Stream Toggle */}
        <button
          id="btn-low-data-toggle"
          onClick={onToggleLowData}
          title={lowDataMode ? "Lite Low-Data Mode Active (Click for HD)" : "HD Stream Active (Click for Lite Mode)"}
          aria-label={lowDataMode ? "Lite Low-Data Mode" : "HD Stream Mode"}
          className={`p-1.5 sm:p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
            lowDataMode
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
              : 'bg-secondary/50 text-foreground/80 border-border hover:bg-secondary'
          }`}
        >
          {lowDataMode ? (
            <WifiOff className="w-4 h-4 text-emerald-500" />
          ) : (
            <Wifi className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={handleToggleTheme}
          title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
          className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-primary transition-all shadow-sm cursor-pointer shrink-0"
          aria-label="Toggle Dark / Light Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-primary" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* Developer Button */}
        {isDeveloper && onOpenFlutterExport && (
          <button
            id="btn-flutter-export"
            onClick={onOpenFlutterExport}
            className="hidden md:flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border text-foreground hover:bg-secondary text-xs transition-all shadow-sm cursor-pointer shrink-0"
            title="Database Schema & Specs"
            aria-label="Database Schema & Specs"
          >
            <Database className="w-4 h-4 text-primary" />
          </button>
        )}

        {/* Admin Link if Super Admin */}
        {isSuperAdmin && onOpenAdminPanel && (
          <button
            id="btn-quick-admin"
            onClick={onOpenAdminPanel}
            className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-105 shadow-sm transition-all cursor-pointer shrink-0"
            title="Apostolic Command Panel"
            aria-label="Apostolic Command Panel"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* Dev Console */}
        {isDeveloper && onOpenDevConsole && (
          <button
            id="btn-quick-dev"
            onClick={onOpenDevConsole}
            className="flex p-1.5 sm:p-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 transition-all items-center justify-center cursor-pointer shadow-sm shrink-0"
            title="Developer Console"
            aria-label="Developer Console"
          >
            <Terminal className="w-4 h-4 text-purple-400" />
          </button>
        )}

        {/* User Identity / Account Button */}
        {isGuest ? (
          <button
            id="btn-guest-login-header"
            onClick={onOpenAuthModal}
            title="Guest Believer - Click to Log In"
            aria-label="Sign In / Log In"
            className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-105 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <LogIn className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="btn-user-profile-header"
            onClick={handleProfileClick}
            title="View Member Profile & Settings"
            className="relative p-0.5 rounded-full hover:ring-2 hover:ring-primary/60 transition-all shadow-sm group shrink-0 cursor-pointer"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {currentUser.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                  {(currentUser?.full_name || 'GC').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'GC'}
                </div>
              )}
            </div>
          </button>
        )}

        {/* Quick Log Out Action */}
        {!isGuest && onLogout && (
          <button
            id="btn-header-quick-logout"
            onClick={onLogout}
            title="Log Out of Account"
            aria-label="Log Out of Account"
            className="p-1.5 sm:p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

      </div>
    </header>
  );
};

