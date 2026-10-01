import React from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  User as UserIcon,
  Compass
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
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home,
      badge: undefined
    },
    {
      id: 'bible' as TabType,
      label: 'Bible',
      icon: BookOpen,
      badge: undefined
    },
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

  return (
    <nav 
      id="instagram-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border safe-area-bottom transition-all"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around h-14 sm:h-16 px-3">
        {tabs.map((tab) => {
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
                'relative flex flex-col items-center justify-center flex-1 py-1 px-2 transition-all duration-150 cursor-pointer select-none group active:scale-90',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Icon / Avatar Container */}
              <div className="relative flex items-center justify-center">
                {isMe ? (
                  // Instagram Profile Icon with circular avatar & active gradient ring
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
        })}
      </div>
    </nav>
  );
};
