import React from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  ShoppingBag, 
  User as UserIcon
} from 'lucide-react';
import { TabType } from '../types';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#00172e]/95 backdrop-blur-xl border-t border-white/10 py-1.5 px-2 safe-area-bottom shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-[#D4AF37] bg-[#D4AF37]/15' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute -top-1 w-5 h-0.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
              )}

              <div className="relative">
                <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'scale-105 text-[#D4AF37]' : 'text-white/50'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[15px] h-3.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[9.5px] font-semibold mt-0.5 tracking-tight ${isActive ? 'text-[#D4AF37]' : 'text-white/50'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

