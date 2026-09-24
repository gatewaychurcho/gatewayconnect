import React, { useState, useEffect } from 'react';
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
  Share2,
  Lock
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
  onOpenDirectChat?: (userId: string) => void;
}

export const ProfileBadgesModal: React.FC<ProfileBadgesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenChatDev,
  onLogout,
  onEditProfile,
  onRefreshUser,
  onOpenDirectChat
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'find_follow' | 'verification' | 'followers'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingList, setFollowingList] = useState<string[]>(StorageService.getFollowingList(currentUser.id));
  const [usersList, setUsersList] = useState<User[]>(StorageService.getAllUsers());

  useEffect(() => {
    const refreshUsersList = () => setUsersList(StorageService.getAllUsers());
    if (isOpen) refreshUsersList();
    window.addEventListener('gcz_users_synced', refreshUsersList);
    return () => window.removeEventListener('gcz_users_synced', refreshUsersList);
  }, [isOpen]);

  const [claimedReward, setClaimedReward] = useState(false);
  const [followToast, setFollowToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';

  const handleToggleFollow = (targetUserId: string) => {
    const res = StorageService.toggleFollowUser(targetUserId);
    setFollowingList(StorageService.getFollowingList(currentUser.id));
    setUsersList(StorageService.getAllUsers());
    if (res.blocked) {
      setFollowToast(res.reason || 'Super Admins and Ministry Developers are foundational accounts and cannot be unfollowed.');
      setTimeout(() => setFollowToast(null), 3500);
      return;
    }
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

  // Instagram-style recommendations: Users not yet followed
  const recommendedUsers = otherUsers.filter(u => !followingList.includes(u.id)).slice(0, 4);

  const realFollowers = otherUsers.filter(u => followingList.includes(u.id) || u.role === 'super_admin');

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-foreground flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Banner */}
        <div className="relative h-24 sm:h-28 bg-secondary p-4 flex items-start justify-between shrink-0">
          <div className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-xs border border-border text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-foreground shadow-xs">
            GATEWAY BELIEVER PROFILE
          </div>

          <button
            id="btn-close-profile-badges"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background/80 hover:bg-background text-foreground flex items-center justify-center transition-colors border border-border cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar and Header Info */}
        <div className="px-4 sm:px-6 pt-0 pb-3 -mt-12 sm:-mt-14 shrink-0 flex items-end justify-between border-b border-border">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-primary/40 shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-background border-2 border-card">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
                    {currentUser?.full_name?.[0] || 'G'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* User Identity Details */}
        <div className="px-4 sm:px-6 py-2.5 space-y-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base sm:text-lg text-foreground leading-snug">
              {currentUser.full_name}
            </h2>
            <VerifiedBadge type={currentUser.verified_badge || currentUser.badge_type || (currentUser.is_verified ? 'gold' : 'none')} size="sm" />
          </div>

          <p className="text-xs text-muted-foreground font-mono">
            {currentUser.handle || `@${currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}`}
          </p>

          <p className="text-[11px] text-muted-foreground flex items-center gap-2 pt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" /> {currentUser.location || 'Harare, Zimbabwe'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-primary" /> {currentUser.phone}
            </span>
          </p>
        </div>

        {/* Unfollow Protected Notification */}
        {followToast && (
          <div className="mx-4 mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Lock className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="flex-1">{followToast}</span>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center border-y border-border bg-secondary/50 px-2 py-1 shrink-0 overflow-x-auto text-xs font-semibold gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'find_follow', label: 'Find & Follow' },
            { id: 'verification', label: 'Verification' },
            { id: 'followers', label: `Followers (${currentUser.followers_count || realFollowers.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
              
              {/* Created By Innovative Technology Card */}
              <div className="bg-secondary/40 border border-border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Created by Innovative Technology
                    </span>
                    <VerifiedBadge type="blue" size="xs" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Developer: @mr_juice7
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onOpenChatDev) onOpenChatDev();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-xs cursor-pointer hover:bg-primary/90"
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
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by username (@mr_juice7)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Instagram-Style "Suggested For You" Recommendations */}
              {!searchQuery && recommendedUsers.length > 0 && (
                <div className="bg-secondary/30 border border-border rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Suggested For You
                    </span>
                    <span className="text-[10px] text-muted-foreground">Gateway Network</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {recommendedUsers.map(rec => (
                      <div key={rec.id} className="bg-card border border-border rounded-xl p-2.5 flex flex-col items-center text-center relative group">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border mb-1.5">
                          {rec.avatar_url ? (
                            <img src={rec.avatar_url} alt={rec.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-xs">
                              {rec.full_name?.[0] || 'U'}
                            </div>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-foreground truncate w-full">{rec.full_name}</h5>
                        <p className="text-[10px] text-muted-foreground truncate w-full font-mono">{rec.handle || `@${rec.full_name.toLowerCase().replace(/\s+/g, '_')}`}</p>
                        <div className="flex items-center gap-1 mt-2 w-full">
                          <button
                            onClick={() => handleToggleFollow(rec.id)}
                            className="flex-1 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-[10px] hover:bg-primary/90 transition-colors cursor-pointer"
                          >
                            Follow
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenDirectChat) {
                                onOpenDirectChat(rec.id);
                              } else if (rec.role === 'developer' && onOpenChatDev) {
                                onOpenChatDev();
                              }
                            }}
                            title={`Chat with ${rec.full_name}`}
                            className="p-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users List with Realistic Follower Count & Chat on ALL Accounts */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredUsers.map(user => {
                  const isFollowing = followingList.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="bg-secondary/30 border border-border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-foreground/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-sm">
                              {user.full_name?.[0] || 'U'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {user.full_name}
                            </h4>
                            <VerifiedBadge type={user.verified_badge || user.badge_type || 'none'} size="xs" />
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {user.handle || `@${user.full_name.toLowerCase().replace(/\s+/g, '_')}`}
                          </p>
                          <p className="text-[10px] text-primary">
                            {user.followers_count || 1} followers • {user.role === 'super_admin' ? 'Apostle' : user.role === 'pastor' ? 'Pastor' : user.role === 'developer' ? 'Developer' : 'Member'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Chat button for ALL accounts as requested */}
                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenDirectChat) {
                              onOpenDirectChat(user.id);
                            } else if (user.role === 'developer' && onOpenChatDev) {
                              onOpenChatDev();
                            }
                          }}
                          title={`Chat with ${user.full_name}`}
                          className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive border border-border'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
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
              <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VerifiedBadge type="blue" size="md" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        OFFICIAL VERIFIED CHECKMARK
                      </h4>
                      <p className="text-[11px] text-primary">
                        Feeds, Testimonies, Comments & Directory
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 font-mono">
                    {currentUser.is_verified ? 'ACTIVE ✓' : '$50 USD / Once'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establish kingdom credibility across all Gateway Church interactive feeds. Displays an authenticated official checkmark on your posts and prayer petitions.
                </p>
              </div>

              {/* Gold Checkmark Card */}
              <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VerifiedBadge type="gold" size="md" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        MASTER ADMIN GOLD CHECKMARK
                      </h4>
                      <p className="text-[11px] text-primary">
                        Reserved for Apostleship & Directorate
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary font-mono">
                    {isSuperAdmin ? 'ASSIGNED 🕊️' : 'PROTECTED'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Strictly designated for General Overseer Apostle Joe Daniels, ordained Pastors, and platform security architects. Protected by cryptographic signature.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOWERS */}
          {activeTab === 'followers' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                People in Gateway Church following your profile:
              </p>

              {realFollowers.map(follower => (
                <div
                  key={follower.id}
                  className="bg-secondary/30 border border-border rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border">
                      {follower.avatar_url ? (
                        <img src={follower.avatar_url} alt={follower.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-sm">
                              {follower.full_name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {follower.full_name}
                        </h4>
                        <VerifiedBadge type={follower.verified_badge || follower.badge_type || 'none'} size="xs" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {follower.handle || `@${follower.full_name.toLowerCase().replace(/\s+/g, '_')}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(follower.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      followingList.includes(follower.id)
                        ? 'bg-secondary text-foreground border border-border'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs'
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
