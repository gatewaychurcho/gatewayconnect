import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Code2, 
  FileCode, 
  LogOut,
  UserCircle,
  LogIn
} from 'lucide-react';
import { User, PushNotification } from '../types';

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
  onOpenDevConsole
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isDeveloper = currentUser.role === 'developer';
  const isGuest = currentUser.role === 'guest';

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
        
        {/* Low-Data Toggle Button */}
        <button
          id="btn-low-data-toggle"
          onClick={onToggleLowData}
          title={lowDataMode ? "Low-Data Lite Stream Active" : "Standard High Quality Stream"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            lowDataMode
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm'
              : 'bg-[#001122] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          {lowDataMode ? <WifiOff className="w-3.5 h-3.5 text-emerald-400" /> : <Wifi className="w-3.5 h-3.5 text-white/60" />}
          <span className="hidden sm:inline text-[11px]">{lowDataMode ? 'Lite 2G/3G' : 'Standard'}</span>
        </button>

        {/* Flutter / Supabase SQL Modal Trigger - Strictly restricted to Developer Account */}
        {isDeveloper && onOpenFlutterExport && (
          <button
            id="btn-flutter-export"
            onClick={onOpenFlutterExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#001122] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-semibold transition-all"
            title="Flutter Source & Supabase Schema"
          >
            <FileCode className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline text-[11px]">Flutter / SQL</span>
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

        {/* Dev Link if Developer */}
        {isDeveloper && onOpenDevConsole && (
          <button
            id="btn-quick-dev"
            onClick={onOpenDevConsole}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900 text-xs font-bold transition-all"
            title="Developer Console"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Dev</span>
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
          /* Member Account Button */
          <button
            id="btn-user-profile-header"
            onClick={handleProfileClick}
            title="View Member Profile & Settings"
            className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#001122]/80 border border-white/10 hover:border-[#D4AF37]/60 hover:bg-[#001122] transition-all text-left shadow-sm group"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs text-white font-bold max-w-[120px] truncate leading-none group-hover:text-[#D4AF37] transition-colors">
                {currentUser.full_name}
              </span>
            </div>

            <div className="relative w-8 h-8 rounded-full border-2 border-[#D4AF37] bg-[#001F3F] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
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

        {/* Quick Log Out Icon Button if Logged In */}
        {!isGuest && onLogout && (
          <button
            id="btn-quick-logout-header"
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-full bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-300 text-xs transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}

      </div>
    </header>
  );
};

