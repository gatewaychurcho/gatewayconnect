import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Users, 
  Search, 
  CheckCircle2, 
  Gift, 
  ExternalLink, 
  Edit3, 
  LogOut, 
  Phone, 
  MapPin, 
  MessageSquare,
  Crown,
  ChevronRight,
  Share2
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { VerifiedBadge } from '../common/VerifiedBadge';
import confetti from 'canvas-confetti';

interface ProfileBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenChatDev?: () => void;
  onLogout?: () => void;
  onEditProfile?: () => void;
  onRefreshUser?: () => void;
}

export const ProfileBadgesModal: React.FC<ProfileBadgesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenChatDev,
  onLogout,
  onEditProfile,
  onRefreshUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'find_follow' | 'verification' | 'followers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingList, setFollowingList] = useState<string[]>(StorageService.getFollowingList(currentUser.id));
  const [usersList, setUsersList] = useState<User[]>(StorageService.getAllUsers());
  const [claimedReward, setClaimedReward] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';
  const points = isSuperAdmin ? 8500 : (currentUser.is_premium ? 5400 : 1250);
  const rankTitle = isSuperAdmin ? 'GATEWAY OVERSEER' : 
                    currentUser.role === 'pastor' ? 'PASTORAL SHEPHERD' : 
                    currentUser.role === 'developer' ? 'PLATFORM ARCHITECT' : 'GATEWAY CHAMPION';

  const handleToggleFollow = (targetUserId: string) => {
    const res = StorageService.toggleFollowUser(targetUserId);
    setFollowingList(StorageService.getFollowingList(currentUser.id));
    setUsersList(StorageService.getAllUsers());
    if (res.isFollowing) {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    }
    if (onRefreshUser) onRefreshUser();
  };

  const otherUsers = usersList.filter(u => u.id !== currentUser.id);
  const filteredUsers = otherUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const realFollowers = otherUsers.filter(u => followingList.includes(u.id) || u.role === 'super_admin');

  const handleClaimMilestone = () => {
    setClaimedReward(true);
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white flex flex-col max-h-[92vh]">
        
        {/* Top Header Banner with Red/Magenta/Gold Gradient */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-[#800020] via-[#5B0E2D] to-[#1A0B2E] p-4 flex items-start justify-between shrink-0">
          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-[10px] sm:text-xs font-bold tracking-wider uppercase text-white shadow">
            {rankTitle} ({points.toLocaleString()} PTS)
          </div>

          <button
            id="btn-close-profile-badges"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar and Header Info */}
        <div className="px-4 sm:px-6 pt-0 pb-3 -mt-12 sm:-mt-14 shrink-0 flex items-end justify-between border-b border-white/10">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#D4AF37] via-amber-200 to-yellow-500 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#001122] border-2 border-[#001F3F]">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-2xl">
                    {currentUser.full_name[0] || 'G'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* User Identity Details */}
        <div className="px-4 sm:px-6 py-2.5 space-y-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base sm:text-lg text-white leading-snug">
              {currentUser.full_name}
            </h2>
            <VerifiedBadge type={currentUser.verified_badge || currentUser.badge_type || (currentUser.is_verified ? 'gold' : 'none')} size="sm" />
          </div>

          <p className="text-xs text-white/60 font-mono">
            {currentUser.handle || `@${currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}`}
          </p>

          <p className="text-[11px] text-white/70 flex items-center gap-2 pt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#D4AF37]" /> {currentUser.location || 'Harare, Zimbabwe'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-[#D4AF37]" /> {currentUser.phone}
            </span>
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center border-y border-white/10 bg-[#00172e] px-2 py-1 shrink-0 overflow-x-auto text-xs font-bold gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'find_follow', label: 'Find & Follow' },
            { id: 'verification', label: 'Verification' },
            { id: 'followers', label: `Followers (${currentUser.followers_count || realFollowers.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Rank Status Card */}
              <div className="bg-[#00172e] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                    GATEWAY RANK STATUS
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {points.toLocaleString()} Points
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-300 to-yellow-500 rounded-full"
                    style={{ width: `${Math.min(100, (points / 5000) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span>Goal: 5,000 pts</span>
                  <span className="text-emerald-400 font-bold">Milestone Unlocked! 🚀</span>
                </div>
              </div>

              {/* Created By Innovative Technology Card */}
              <div className="bg-[#00172e] border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      Created by Innovative Technology
                    </span>
                    <VerifiedBadge type="blue" size="xs" />
                  </div>
                  <p className="text-[11px] text-white/60">
                    Developer: @mr_juice7 • 0780699988
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onOpenChatDev) onOpenChatDev();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow"
                >
                  <span>VIEW & CHAT</span>
                  <span>→</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: FIND & FOLLOW */}
          {activeTab === 'find_follow' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by username (@mr_juice7)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#00172e] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Users List with Realistic Follower Count */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredUsers.map(user => {
                  const isFollowing = followingList.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="bg-[#00172e] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                              {user.full_name[0]}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-bold text-white truncate">
                              {user.full_name}
                            </h4>
                            <VerifiedBadge type={user.verified_badge || user.badge_type || 'none'} size="xs" />
                          </div>
                          <p className="text-[11px] text-white/50 truncate font-mono">
                            {user.handle || `@${user.full_name.toLowerCase().replace(/\s+/g, '_')}`}
                          </p>
                          <p className="text-[10px] text-[#D4AF37]">
                            {user.followers_count || 1} followers • {user.role === 'super_admin' ? 'Apostle' : user.role === 'pastor' ? 'Pastor' : user.role === 'developer' ? 'Developer' : 'Member'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {user.role === 'developer' && onOpenChatDev && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenChatDev();
                            }}
                            title="Chat with Dev"
                            className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            isFollowing
                              ? 'bg-white/10 text-white/80 hover:bg-rose-500/20 hover:text-rose-300'
                              : 'bg-[#D4AF37] text-[#001F3F] hover:bg-amber-400 shadow'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-3">
              {/* Blue Checkmark Card */}
              <div className="bg-[#00172e] border border-blue-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VerifiedBadge type="blue" size="md" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        OFFICIAL VERIFIED CHECKMARK
                      </h4>
                      <p className="text-[11px] text-blue-300">
                        Feeds, Testimonies, Comments & Directory
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {currentUser.is_verified ? 'ACTIVE ✓' : '$50 USD / Once'}
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Establish kingdom credibility across all Gateway Church interactive feeds. Displays an authenticated official checkmark on your posts and prayer petitions.
                </p>
              </div>

              {/* Gold Checkmark Card */}
              <div className="bg-[#00172e] border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VerifiedBadge type="gold" size="md" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        MASTER ADMIN GOLD CHECKMARK
                      </h4>
                      <p className="text-[11px] text-amber-300">
                        Reserved for Apostleship & Directorate
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] font-mono">
                    {isSuperAdmin ? 'ASSIGNED 🕊️' : 'PROTECTED'}
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Strictly designated for General Overseer Apostle Joe Daniels, ordained Pastors, and platform security architects. Protected by cryptographic signature.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOWERS */}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              <p className="text-xs text-white/60 mb-2">
                People in Gateway Church following your profile:
              </p>

              {realFollowers.map(follower => (
                <div
                  key={follower.id}
                  className="bg-[#00172e] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                      {follower.avatar_url ? (
                        <img src={follower.avatar_url} alt={follower.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                          {follower.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {follower.full_name}
                        </h4>
                        <VerifiedBadge type={follower.verified_badge || follower.badge_type || 'none'} size="xs" />
                      </div>
                      <p className="text-[11px] text-white/50 truncate font-mono">
                        {follower.handle || `@${follower.full_name.toLowerCase().replace(/\s+/g, '_')}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(follower.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      followingList.includes(follower.id)
                        ? 'bg-white/10 text-white/80'
                        : 'bg-[#D4AF37] text-[#001F3F] hover:bg-amber-400'
                    }`}
                  >
                    {followingList.includes(follower.id) ? 'Following' : 'Follow Back'}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
