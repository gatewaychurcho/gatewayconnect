import React from 'react';
import { 
  Home, 
  Clapperboard,
  BookOpen, 
  Users, 
  ShoppingBag, 
  User as UserIcon
} from 'lucide-react';
import { TabType, User } from '../types';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount?: number;
  currentUser?: User | null;
  communityBadge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  cartCount = 0,
  currentUser,
  communityBadge = 0
}) => {
  const leftTabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
      badge: undefined
    },
    {
      id: 'sermons' as TabType,
      label: 'Reels',
      icon: Clapperboard,
      badge: undefined
    },
    {
      id: 'bible' as TabType,
      label: 'Bible',
      icon: BookOpen,
      badge: undefined
    }
  ];

  const rightTabs = [
    {
      id: 'community' as TabType,
      label: 'Community',
      icon: Users,
      badge: communityBadge > 0 ? communityBadge : undefined
    },
    {
      id: 'store' as TabType,
      label: 'Store',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined
    },
    {
      id: 'me' as TabType,
      label: 'Me',
      icon: UserIcon,
      badge: undefined
    }
  ];

  const renderTab = (tab: { id: TabType; label: string; icon: any; badge?: number }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    const isMe = tab.id === 'me';
    const avatarUrl = currentUser?.avatar_url;

    return (
      <button
        key={tab.id}
        id={`tab-btn-${tab.id}`}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          'relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-150 cursor-pointer select-none group active:scale-90',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {/* Icon / Avatar Container */}
        <div className="relative flex items-center justify-center">
          {isMe ? (
            <div
              className={cn(
                'rounded-full transition-all duration-200 flex items-center justify-center',
                isActive 
                  ? 'w-7 h-7 p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-xs' 
                  : 'w-6 h-6 p-[1px] bg-border group-hover:bg-muted-foreground/40'
              )}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-card flex items-center justify-center">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={currentUser?.full_name || 'Me'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-foreground uppercase">
                    {currentUser?.full_name ? currentUser.full_name[0] : 'M'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Icon 
              className={cn(
                'w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200',
                isActive 
                  ? 'scale-110 text-primary stroke-[2.4] fill-primary/20 drop-shadow-[0_0_8px_rgba(0,149,246,0.4)]' 
                  : 'stroke-[1.8] group-hover:scale-105'
              )} 
            />
          )}

          {/* Badge Notification Bubble */}
          {tab.badge !== undefined && (
            <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-md animate-pulse">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </div>

        {/* Subtle Active Indicator Dot */}
        {isActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-in fade-in" />
        ) : (
          <span className="w-1.5 h-1.5 mt-1" />
        )}
      </button>
    );
  };

  return (
    <nav 
      id="instagram-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-t border-border/60 dark:border-white/10 safe-area-bottom transition-all"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-between h-14 sm:h-16 px-1 relative">
        {leftTabs.map(renderTab)}

        {/* Center Elevated Giving FAB (Hand + Coin Graphic) */}
        <button
          id="fab-giving-button"
          onClick={() => onTabChange('giving')}
          title="Giving, Offerings & Tithing"
          aria-label="Giving, Offerings & Tithing"
          className={cn(
            "relative -top-3.5 sm:-top-4 flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full text-white border-2 border-white/60 active:scale-90 hover:scale-105 transition-all cursor-pointer select-none shrink-0 group z-20",
            activeTab === 'giving'
              ? "bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 ring-4 ring-amber-400/50 shadow-[0_4px_25px_rgba(245,158,11,0.85)] scale-105"
              : "bg-gradient-to-tr from-[#0055FF] via-[#1E60FF] to-[#3B82F6] ring-4 ring-[#1E60FF]/30 shadow-[0_4px_20px_rgba(30,96,255,0.7)]"
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110"
          >
            <circle cx="12" cy="6" r="3.2" stroke="white" strokeWidth="2.2" fill="none" />
            <path d="M3 17h3.6a2 2 0 0 1 1.6.8l1.3 1.7a2 2 0 0 0 1.6.8h4.4a2 2 0 0 0 1.9-1.4l1.2-3.8a1.8 1.8 0 0 0-1.7-2.3h-5.4" />
            <path d="M6.5 17v-3.8a1.8 1.8 0 0 1 1.8-1.8H12" />
          </svg>
        </button>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
};
