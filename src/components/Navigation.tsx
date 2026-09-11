import React from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  User as UserIcon
} from 'lucide-react';
import { TabType } from '../types';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  cartCount = 0
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      icon: Home
    },
    {
      id: 'bible' as TabType,
      label: 'Bible',
      icon: BookOpen
    },
    {
      id: 'community' as TabType,
      label: 'Community',
      icon: Users
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
      icon: UserIcon
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border py-2 px-3 safe-area-bottom shadow-lg transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer select-none',
                isActive 
                  ? 'text-primary bg-secondary/80 shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {/* Active Indicator Top Highlight */}
              {isActive && (
                <div className="absolute -top-2 w-6 h-0.5 rounded-full bg-primary" />
              )}

              <div className="relative">
                <Icon 
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive ? 'scale-110 text-primary' : 'text-muted-foreground'
                  )} 
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[15px] h-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span 
                className={cn(
                  'text-[10px] mt-1 tracking-tight',
                  isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
