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
  LogOut,
  MoreVertical
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
  const [menuOpen, setMenuOpen] = useState(false);
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
      try {
        if (typeof window !== 'undefined' && (window as any).AndroidBridge?.updateBadgeCount) {
          (window as any).AndroidBridge.updateBadgeCount(count);
        }
      } catch {}
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
            JOE DANIELS
          </span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">
            CONNECT
          </span>
        </div>
      </div>

      {/* Action Controls & User Identity */}
      <div className="gcz-header-actions relative flex items-center gap-1.5 sm:gap-2 shrink-0">
        
        {/* Direct Messages & Groups Button */}
        {!isGuest && onOpenDirectMessages && (
          <button
            id="btn-direct-messages-header"
            onClick={onOpenDirectMessages}
            title="Chats & Groups"
            className="relative p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 text-primary" />
            {unreadDmsCount > 0 && notifSettings.directMessages && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {unreadDmsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Bell Button */}
        {!isGuest && onOpenNotifications && (
          <button
            id="btn-notifications-header"
            onClick={onOpenNotifications}
            title="Notifications & Live Alerts"
            className="relative p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Bell className="w-4 h-4 text-primary" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        )}

        {/* User Identity / Account Button */}
        {isGuest ? (
          <button
            id="btn-guest-login-header"
            onClick={onOpenAuthModal}
            title="Guest Believer - Click to Log In"
            aria-label="Sign In / Log In"
            className="flex items-center justify-center p-2 rounded-xl bg-primary text-primary-foreground hover:brightness-105 shadow-sm transition-all cursor-pointer shrink-0"
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

        {/* 3-Dot Quick Options Dropdown Toggle Button */}
        <div className="relative">
          <button
            id="btn-header-quick-menu"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Quick Options & Tools"
            className="relative p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary text-foreground/80 hover:text-foreground transition-all shadow-sm cursor-pointer shrink-0"
          >
            <MoreVertical className="w-4 h-4 text-foreground/80" />
          </button>

          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
                onClick={() => setMenuOpen(false)} 
              />
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-[#0B0F19]/95 dark:bg-[#0B0F19]/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-1 text-left">
                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleTheme();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-foreground/90 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono">{theme}</span>
                </button>

                {/* Data Saver Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleLowData();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-foreground/90 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {lowDataMode ? <WifiOff className="w-4 h-4 text-emerald-400" /> : <Wifi className="w-4 h-4 text-primary" />}
                    <span>Data Saver</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${lowDataMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                    {lowDataMode ? 'Lite' : 'HD'}
                  </span>
                </button>

                {/* Apostolic Command Panel (Admin) */}
                {isSuperAdmin && onOpenAdminPanel && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAdminPanel();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Command Panel</span>
                  </button>
                )}

                {/* Developer Console */}
                {isDeveloper && onOpenDevConsole && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDevConsole();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer border border-purple-500/20"
                  >
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <span>Developer Console</span>
                  </button>
                )}

                {/* Database Specs / Flutter Export */}
                {isDeveloper && onOpenFlutterExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFlutterExport();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground/80 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-primary" />
                    <span>Database Specs</span>
                  </button>
                )}

                {/* Sign Out Action */}
                {!isGuest && onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border-t border-white/5 pt-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

