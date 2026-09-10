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
  Terminal
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
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isDeveloper = currentUser.role === 'developer';
  const isGuest = currentUser.role === 'guest';

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() =>
    StorageService.getNotificationSettings(currentUser?.id)
  );

  useEffect(() => {
    const updateSettingsAndCount = () => {
      const settings = StorageService.getNotificationSettings(currentUser?.id);
      setNotifSettings(settings);
      const list = StorageService.getAppNotifications();
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
    window.addEventListener('storage', updateSettingsAndCount);
    return () => {
      window.removeEventListener('gcz_notifications_updated', updateSettingsAndCount);
      window.removeEventListener('gcz_new_notification', updateSettingsAndCount as any);
      window.removeEventListener('gcz_notification_settings_updated', updateSettingsAndCount as any);
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
    <header className="sticky top-0 z-40 h-16 sm:h-20 bg-[#001F3F] border-b border-[#D4AF37]/40 flex items-center justify-between px-3 sm:px-6 shrink-0 transition-all shadow-xl">
      
      {/* Brand & Ministry Logo - Apostle Joe Daniels Silhouette with Matching Palette */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#001122] border border-[#D4AF37]/50 flex items-center justify-center p-1.5 shadow-md shadow-[#D4AF37]/15 shrink-0">
          <img 
            src="/assets/apostle_silhouette.svg" 
            alt="Apostle Joe Daniels Ministry" 
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[#D4AF37] font-bold text-sm sm:text-base tracking-wide leading-tight">
            GATEWAY
          </span>
          <span className="text-[10px] sm:text-[11px] text-white/70 font-medium tracking-widest uppercase">
            HARARE
          </span>
        </div>
      </div>

      {/* Action Controls & User Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Live Sermon Broadcast Button (Controlled by Live Streams notification preference) */}
        {isLiveSermon && notifSettings.liveStreams && onOpenLiveSermon && (
          <button
            id="btn-live-sermon-header"
            onClick={onOpenLiveSermon}
            title="Apostle Joe Daniels Live Service • Tap to Stream"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Radio className="w-3.5 h-3.5" />
            <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">LIVE SERVICE</span>
          </button>
        )}

        {/* Instagram-style Direct Messages Button (Badge controlled by DM notification preference) */}
        {!isGuest && onOpenDirectMessages && (
          <button
            id="btn-direct-messages-header"
            onClick={onOpenDirectMessages}
            title="Direct Messages"
            className="relative p-2 rounded-full bg-[#001122] border border-white/10 hover:border-[#D4AF37]/60 text-white/80 hover:text-white transition-all shadow-sm"
          >
            <Send className="w-4 h-4 text-[#D4AF37]" />
            {unreadDmsCount > 0 && notifSettings.directMessages && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {unreadDmsCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Bell Button - Strictly for registered members/leadership (Guest accounts have no notification tab) */}
        {!isGuest && onOpenNotifications && (
          <button
            id="btn-notifications-header"
            onClick={onOpenNotifications}
            title="Notifications & Live Alerts"
            className="relative p-2 rounded-full bg-[#001122] border border-white/10 hover:border-[#D4AF37]/60 text-white/80 hover:text-white transition-all shadow-sm"
          >
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            {unreadNotifsCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow animate-pulse">
                {unreadNotifsCount}
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4AF37]/40 ring-1 ring-[#001F3F]" />
            )}
          </button>
        )}

        {/* Low-Data / HD Stream Toggle (Icon Only) */}
        <button
          id="btn-low-data-toggle"
          onClick={onToggleLowData}
          title={lowDataMode ? "Lite Low-Data Mode Active (Click for HD)" : "HD Stream Active (Click for Lite Mode)"}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            lowDataMode
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm'
              : 'bg-[#001122] text-[#D4AF37] border-[#D4AF37]/40 hover:border-[#D4AF37]'
          }`}
        >
          {lowDataMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black tracking-tight text-emerald-400">SD</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] font-black tracking-tight text-[#D4AF37]">HD</span>
            </>
          )}
        </button>

        {/* Flutter / Supabase SQL Modal Trigger - Strictly restricted to Developer Account */}
        {isDeveloper && onOpenFlutterExport && (
          <button
            id="btn-flutter-export"
            onClick={onOpenFlutterExport}
            className="flex items-center justify-center p-2 rounded-lg bg-[#001122] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs transition-all shadow-sm"
            title="Database Schema & Specs"
          >
            <Database className="w-4 h-4 text-[#D4AF37]" />
          </button>
        )}

        {/* Admin Link if Super Admin */}
        {isSuperAdmin && onOpenAdminPanel && (
          <button
            id="btn-quick-admin"
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#001F3F] hover:scale-105 text-xs font-black shadow-md shadow-[#D4AF37]/30 transition-transform"
            title="Apostolic Command Panel"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Admin</span>
          </button>
        )}

        {/* Dev Link if Developer - Sleek Console Icon */}
        {isDeveloper && onOpenDevConsole && (
          <button
            id="btn-quick-dev"
            onClick={onOpenDevConsole}
            className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
            title="Developer Console (mr_juice7)"
            aria-label="Developer Console"
          >
            <Terminal className="w-4 h-4 text-purple-300" />
          </button>
        )}

        {/* User Identity / Account Button */}
        {isGuest ? (
          /* Guest Believer: Click opens Login Float directly */
          <button
            id="btn-guest-login-header"
            onClick={onOpenAuthModal}
            title="Guest Believer - Click to Log In"
            className="flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-[#001122] border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:bg-[#001830] transition-all text-left shadow-sm group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">Guest Believer</span>
              <span className="text-xs text-white font-bold group-hover:text-[#D4AF37] transition-colors leading-none">Log In</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold text-xs shadow shrink-0">
              <LogIn className="w-3.5 h-3.5 text-[#001F3F]" />
            </div>
          </button>
        ) : (
          /* Member Account Button - Profile Picture Only (Name moved to Profile) */
          <button
            id="btn-user-profile-header"
            onClick={handleProfileClick}
            title="View Member Profile & Settings"
            className="relative p-0.5 rounded-full hover:ring-2 hover:ring-[#D4AF37] transition-all shadow-sm group shrink-0"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#D4AF37] bg-[#001F3F] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {currentUser.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                  {currentUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'GC'}
                </div>
              )}
            </div>
          </button>
        )}

      </div>
    </header>
  );
};

