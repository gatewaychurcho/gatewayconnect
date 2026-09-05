import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Sparkles, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  Calendar,
  Radio,
  ExternalLink
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: any;
  unread: boolean;
  tag: string;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n_1',
      title: 'Apostle Joe Daniels Live Prophetic Stream 🔴',
      body: 'Live now on "Supernatural Acceleration 2026". Tap to connect to the broadcast.',
      time: '15m ago',
      icon: Radio,
      unread: true,
      tag: 'Live Broadcast'
    },
    {
      id: 'n_2',
      title: 'Milestone Reward Qualified! 🎁',
      body: 'Your fellowship activity unlocked the 5,000 Points Free VVIP Pass reward.',
      time: '1h ago',
      icon: Sparkles,
      unread: true,
      tag: 'Rewards'
    },
    {
      id: 'n_3',
      title: 'Pastor Tendai Moyo followed you',
      body: 'Harare Central Hub Overseer is now connected with your Gateway profile.',
      time: '5h ago',
      icon: UserPlus,
      unread: false,
      tag: 'Community'
    },
    {
      id: 'n_4',
      title: 'Altar Prayer Request Answered',
      body: 'Apostle Joe Daniels decreed apostolic breakthrough over your altar petition.',
      time: '1d ago',
      icon: Heart,
      unread: false,
      tag: 'Prayer'
    }
  ]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#00172e] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60">
                Follows, messages, mentions & milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#D4AF37] hover:underline font-bold"
              >
                Read All
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.map(n => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.unread
                    ? 'bg-[#00172e] border-[#D4AF37]/40 shadow-sm'
                    : 'bg-[#001428] border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    n.unread ? 'bg-[#D4AF37] text-[#001F3F]' : 'bg-white/10 text-white/60'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-white/40 font-mono shrink-0">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                        {n.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
