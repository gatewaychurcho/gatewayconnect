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
      label: 'HOME',
      icon: Home
    },
    {
      id: 'bible' as TabType,
      label: 'BIBLE',
      icon: BookOpen
    },
    {
      id: 'community' as TabType,
      label: 'COMMUNITY',
      icon: Users
    },
    {
      id: 'store' as TabType,
      label: 'STORE/GIVE',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined
    },
    {
      id: 'me' as TabType,
      label: 'ME / ADMIN',
      icon: UserIcon
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#001F3F]/95 backdrop-blur-xl border-t border-white/10 sm:border-[#D4AF37]/30 py-2 px-3 safe-area-bottom shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-[#D4AF37] bg-[#D4AF37]/15 border border-[#D4AF37]/40 shadow-sm' 
                  : 'text-white/40 hover:text-[#D4AF37] hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-1 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#D4AF37]' : 'text-white/40'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#D4AF37] text-[#001F3F] text-[10px] font-black">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

