import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Camera, 
  Copy, 
  Check, 
  Crown, 
  Sparkles, 
  Grid, 
  Bookmark, 
  Settings, 
  LogOut, 
  Play, 
  Share2, 
  Edit3, 
  Zap, 
  Wifi, 
  WifiOff, 
  Trash2, 
  ShieldCheck,
  Code2,
  CheckCircle2,
  LogIn,
  UserPlus,
  Video,
  CreditCard,
  ChevronDown,
  Download,
  Award,
  MessageCircle,
  Lock,
  X,
  Bell,
  Radio,
  HeartHandshake
} from 'lucide-react';
import { User, Sermon, NotificationSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { INITIAL_USERS, MOCK_SERMONS } from '../../data/mockData';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';
import { DownloadedSermonsModal } from '../modals/DownloadedSermonsModal';
import { ProfileBadgesModal } from '../modals/ProfileBadgesModal';
import { ChatDevModal } from '../modals/ChatDevModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import confetti from 'canvas-confetti';

interface MeTabProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenAdminPanel: () => void;
  onOpenDevConsole: () => void;
  onOpenFlutterExport: () => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onLogout?: () => void;
  onUpdateUser?: (user: User) => void;
  onOpenLogin?: () => void;
  onOpenSignUp?: () => void;
  onOpenDirectChat?: () => void;
}

export const MeTab: React.FC<MeTabProps> = ({
  currentUser,
  onSwitchUser,
  onOpenAdminPanel,
  onOpenDevConsole,
  onOpenFlutterExport,
  lowDataMode,
  onToggleLowData,
  onLogout,
  onUpdateUser,
  onOpenLogin,
  onOpenSignUp,
  onOpenDirectChat
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'downloads' | 'saved' | 'settings'>('videos');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaynowModal, setShowPaynowModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showChatDevModal, setShowChatDevModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(
    currentUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare'
  );
  const [downloadedSermons, setDownloadedSermons] = useState<Sermon[]>(StorageService.getDownloadedSermons());
  const [playingOfflineSermon, setPlayingOfflineSermon] = useState<Sermon | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    StorageService.getNotificationSettings(currentUser.id)
  );
  const [notificationSavedToast, setNotificationSavedToast] = useState(false);
  const [, setFollowRefreshTick] = useState(0);

  useEffect(() => {
    const handleFollowChange = () => {
      setFollowRefreshTick(t => t + 1);
    };
    window.addEventListener('gcz_follow_updated', handleFollowChange);
    window.addEventListener('gcz_user_profile_updated', handleFollowChange);
    return () => {
      window.removeEventListener('gcz_follow_updated', handleFollowChange);
      window.removeEventListener('gcz_user_profile_updated', handleFollowChange);
    };
  }, []);

  useEffect(() => {
    setNotificationSettings(StorageService.getNotificationSettings(currentUser.id));
  }, [currentUser.id]);

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    const updated: NotificationSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(updated);
    StorageService.setNotificationSettings(updated, currentUser.id);
    setNotificationSavedToast(true);
    setTimeout(() => setNotificationSavedToast(false), 2000);
  };

  useEffect(() => {
    setBioText(currentUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
  }, [currentUser.bio]);

  const isGuest = currentUser.role === 'guest';
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isDeveloper = currentUser.role === 'developer';

  // Actual followers and following calculation - strictly real user interactions updating instantly
  const realFollowersCount = StorageService.getFollowersList(currentUser.id).length;
  const realFollowingCount = StorageService.getFollowingList(currentUser.id).length;
  const downloadQuota = StorageService.getDownloadQuota(currentUser);

  const savedVerses = StorageService.getSavedVerses();
  const myPostsCount = StorageService.getTestimonies().filter(
    t => t.user_id === currentUser.id || t.user_name === currentUser.full_name
  ).length || (currentUser.role === 'super_admin' ? 3 : 1);

  // Background sermon pre-caching simulation
  useEffect(() => {
    // Automatically register sermons into offline media cache without manual intervention
    const cacheKey = 'gcz_cached_sermons_count';
    const stored = localStorage.getItem(cacheKey);
    if (!stored) {
      localStorage.setItem(cacheKey, '12');
    }
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentUser.member_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveBio = () => {
    setIsEditingBio(false);
    const updated = StorageService.updateUserProfile({ bio: bioText });
    if (onUpdateUser) onUpdateUser(updated);
  };

  const handleSaveAvatar = (newUrl: string) => {
    const updated = StorageService.updateUserProfile({ avatar_url: newUrl });
    if (onUpdateUser) onUpdateUser(updated);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.5 } });
  };

  // Guest Restriction View
  if (isGuest) {
    return (
      <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-10 text-center">
        <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#001122] border-2 border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37] shadow-inner">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Gateway Connect Account
            </h2>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
              You are currently browsing as a Guest Believer. Log in to access your personal profile, offline sermon cache, and fellowship privileges.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              id="btn-guest-login-me"
              onClick={onOpenLogin}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Account</span>
            </button>

            <button
              id="btn-guest-signup-me"
              onClick={onOpenSignUp}
              className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 text-[#D4AF37]" />
              <span>Create New Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-1">
      
      {/* Instagram-Style Profile Top Card */}
      <div className="bg-[#001F3F]/90 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        
        {/* Top Handle / Account Identity Bar */}
        <div className="flex items-center justify-between text-xs text-white/70 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm">
              @{currentUser.handle || currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}
            </span>
            {currentUser.verified_badge && (
              <VerifiedBadge type={currentUser.verified_badge} size="xs" />
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 ml-1 font-semibold">
              <Lock className="w-2.5 h-2.5" />
              <span>Private Account</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono text-[11px] text-white/50">
              <span>{currentUser.member_id}</span>
              <button
                onClick={handleCopyId}
                className="p-1 hover:text-[#D4AF37] transition-colors"
                title="Copy Member ID"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {isSuperAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="p-1 px-2 rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold text-[10px] flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                title="Admin Panel"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}
            {isDeveloper && (
              <button
                onClick={onOpenDevConsole}
                className="p-1 px-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                title="Developer Console (mr_juice7)"
              >
                <Code2 className="w-3 h-3" />
                <span>Console</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 text-red-400 hover:text-red-300"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Instagram Profile Header: Avatar on Left, Stats on Right */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Avatar with Instagram-Style Story Ring */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => setShowPhotoPicker(true)}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-gradient-to-tr from-[#D4AF37] via-amber-200 to-yellow-500 shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#001122] border-2 border-[#001F3F]">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D4AF37] font-bold text-2xl">
                    {currentUser.full_name[0] || 'G'}
                  </div>
                )}
              </div>
            </div>

            {/* Camera Edit Badge */}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#D4AF37] text-[#001F3F] flex items-center justify-center shadow-lg border-2 border-[#001F3F]">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Instagram 3-Stat Counters - Normalized Real User Logic */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveSubTab('videos')}>
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {myPostsCount}
              </p>
              <p className="text-[11px] text-white/60">Posts</p>
            </div>

            <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowBadgesModal(true)} title="View Believers & Followers">
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {realFollowersCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-white/60">Followers</p>
            </div>

            <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowBadgesModal(true)} title="View Following List">
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {realFollowingCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-white/60">Following</p>
            </div>
          </div>

        </div>

        {/* Bio & Details Section */}
        <div className="space-y-1.5 text-left">
          
          {/* Name & Facebook/Instagram-style Verified Badge */}
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base sm:text-lg text-white leading-snug">
              {currentUser.full_name}
            </h2>
            <VerifiedBadge type={currentUser.verified_badge || currentUser.badge_type || (currentUser.is_verified ? 'gold' : 'none')} size="sm" />
          </div>

          {/* Role Tag */}
          <div className="text-xs font-semibold text-[#D4AF37]">
            {currentUser.role === 'super_admin' ? 'Lead Apostle & General Overseer 🕊️' :
             currentUser.role === 'pastor' ? 'Church Pastor • Shepherd Altar 📖' :
             currentUser.role === 'elder' ? 'Church Elder & Altar Council 🛡️' :
             currentUser.role === 'youth' ? 'Gateway Ignite Youth Fellowship 🔥' :
             currentUser.role === 'developer' ? 'Chief Systems Engineer 💻' : 'Believer & Gateway Fellow 🌟'}
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-mono">{currentUser.phone}</span>
          </div>

          {/* Location with MapPin Favicon only */}
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>{currentUser.cell_group || 'Belvedere / Samora Machel Ave, Harare, Zimbabwe'}</span>
          </div>

          {/* Short Bio */}
          {isEditingBio ? (
            <div className="pt-1 flex gap-1.5">
              <input
                type="text"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="flex-1 bg-[#001122] border border-[#D4AF37]/50 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleSaveBio}
                className="px-3 py-1 bg-[#D4AF37] text-[#001F3F] font-bold text-xs rounded-xl"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/70 leading-relaxed pt-0.5">
              {currentUser.bio || bioText}
            </p>
          )}

        </div>

        {/* Action Buttons: Upgrade (Omitted for Super Admin) + Profile Actions */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          
          {/* UPGRADE BUTTON (Omitted for Super Admin because he is the Lead Apostle) */}
          {isSuperAdmin ? (
            <button
              id="btn-me-admin-center"
              onClick={onOpenAdminPanel}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#001F3F] font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-3.5 h-3.5 fill-[#001F3F]" />
              <span className="truncate">Admin</span>
            </button>
          ) : (
            <button
              id="btn-me-upgrade-membership"
              onClick={() => setShowUpgradeModal(true)}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span className="truncate">Upgrade</span>
            </button>
          )}

          {/* Edit Bio Button */}
          <button
            onClick={() => setIsEditingBio(!isEditingBio)}
            className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="truncate">Edit Bio</span>
          </button>

          {/* Share Profile Button */}
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}?user=${currentUser.member_id}`;
              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Connect with ${currentUser.full_name} on Gateway International Church App: ${shareUrl}`
              )}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Share</span>
          </button>

          {/* Change Password Button */}
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
            title="Change Account Password"
          >
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="truncate">Password</span>
          </button>
        </div>

      </div>

      {/* Quick Action Cards: YouTube-Style Downloads (Passes) & Badges Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        
        {/* DOWNLOADS PASS CARD */}
        <button
          id="btn-me-downloads-pass"
          onClick={() => setShowDownloadsModal(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-[#001F3F] to-[#00172e] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-left transition-all group shadow-lg flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-bold text-xs text-white">Downloads</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                {downloadedSermons.length} Ready
              </span>
            </div>
            <p className="text-[11px] text-white/70 truncate">
              {downloadQuota.isUnlimited
                ? 'Unlimited Offline Passes (Apostolic Partner)'
                : `${downloadQuota.remaining}/${downloadQuota.limit} downloads left this month`}
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 group-hover:bg-[#D4AF37] group-hover:text-[#001F3F] text-[#D4AF37] flex items-center justify-center transition-colors shrink-0 ml-2 shadow">
            <Download className="w-4 h-4" />
          </div>
        </button>

        {/* VERIFICATION & BADGES DIRECTORY CARD */}
        <button
          id="btn-me-badges-directory"
          onClick={() => setShowBadgesModal(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-[#001F3F] to-[#00172e] border border-purple-500/30 hover:border-purple-400 text-left transition-all group shadow-lg flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-xs text-white">Verified Badges & Members</span>
            </div>
            <p className="text-[11px] text-purple-300/80 truncate">
              Find believers, explore roles & get verified
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 group-hover:bg-purple-600 group-hover:text-white text-purple-300 flex items-center justify-center transition-colors shrink-0 ml-2 shadow">
            <VerifiedBadge type={currentUser.verified_badge || 'blue'} size="xs" />
          </div>
        </button>

      </div>

      {/* Instagram-Style Profile Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[#001F3F]/40 rounded-2xl overflow-hidden p-1 gap-1">
        <button
          onClick={() => setActiveSubTab('videos')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
            activeSubTab === 'videos'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sermon</span> Reels
        </button>

        <button
          id="tab-me-downloads"
          onClick={() => setActiveSubTab('downloads')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
            activeSubTab === 'downloads'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Downloads ({downloadedSermons.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
            activeSubTab === 'saved'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved ({savedVerses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
            activeSubTab === 'settings'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* SUB-TAB 1: Instagram-Style 3-Column Video Thumbnail Grid */}
      {activeSubTab === 'videos' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOCK_SERMONS.map(s => (
            <div
              key={s.id}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#001122] border border-white/10 cursor-pointer shadow-md hover:border-[#D4AF37]/60 transition-all"
            >
              <img
                src={s.thumbnail_url}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-white font-mono">
                    {s.duration}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/80 text-black font-bold">
                    Cached
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-white/60 mt-0.5 truncate">
                    {s.speaker}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: YouTube-Style Offline Downloaded Sermons */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-3">
          {/* Quota & Policy Banner */}
          <div className="p-3.5 bg-[#001F3F] border border-[#D4AF37]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-md">
            <div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-bold text-white">Offline Downloads Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                  {downloadQuota.isUnlimited ? 'Unlimited' : `${downloadQuota.remaining}/${downloadQuota.limit} Remaining`}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mt-0.5">
                {downloadQuota.isUnlimited
                  ? 'Super Admin & Partners enjoy unlimited monthly offline sermon downloads.'
                  : 'Free members get 5 offline downloads/month. Upgrade to Partner for unlimited access.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!isSuperAdmin && !currentUser.is_premium && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-[11px] hover:brightness-110 transition-all shadow"
                >
                  Get Unlimited
                </button>
              )}
              <button
                onClick={() => setShowDownloadsModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] border border-white/10 transition-colors"
              >
                Manage Vault
              </button>
            </div>
          </div>

          {/* Inline Active Offline Sermon Player */}
          {playingOfflineSermon && (
            <div className="p-4 bg-[#00172e] border border-[#D4AF37]/50 rounded-2xl space-y-3 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-white truncate">
                    Offline Player: {playingOfflineSermon.title}
                  </span>
                </div>
                <button
                  onClick={() => setPlayingOfflineSermon(null)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                  title="Close Player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                <iframe
                  title={playingOfflineSermon.title}
                  src={`https://www.youtube-nocookie.com/embed/${StorageService.extractYoutubeId(playingOfflineSermon.youtube_id || playingOfflineSermon.video_url)}?autoplay=1&controls=1&rel=0&playsinline=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>{playingOfflineSermon.speaker} • {playingOfflineSermon.series || 'Apostolic Series'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                  Zero-Data Offline Vault
                </span>
              </div>
            </div>
          )}

          {/* Downloaded Sermons List */}
          {downloadedSermons.length === 0 ? (
            <div className="p-8 text-center bg-[#001F3F]/40 rounded-2xl border border-white/10 text-xs text-white/60 space-y-2">
              <Download className="w-8 h-8 text-[#D4AF37] mx-auto opacity-50" />
              <p className="font-bold text-white">No Downloaded Sermons Yet</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Like YouTube, you can download any sermon to listen or watch completely offline with zero data consumption.
              </p>
              <button
                onClick={() => setShowDownloadsModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-xs hover:bg-[#c29e2e] transition-colors"
              >
                Browse Church Sermons to Download
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedSermons.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-[#001F3F] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                      <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[8px] text-white font-mono rounded">
                        {s.duration}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white truncate">{s.title}</h4>
                      <p className="text-[11px] text-white/60 truncate">{s.speaker}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Saved for offline • 14.8 MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPlayingOfflineSermon(s)}
                      className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-[11px] hover:bg-[#c29e2e] transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </button>
                    <button
                      onClick={() => {
                        StorageService.deleteDownloadedSermon(s.id);
                        setDownloadedSermons(StorageService.getDownloadedSermons());
                        if (playingOfflineSermon?.id === s.id) {
                          setPlayingOfflineSermon(null);
                        }
                      }}
                      className="p-1.5 rounded-xl text-white/40 hover:text-red-400 transition-colors"
                      title="Delete offline copy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Saved Scriptures & Notes */}
      {activeSubTab === 'saved' && (
        <div className="space-y-2">
          {savedVerses.length === 0 ? (
            <div className="p-8 text-center bg-[#001F3F]/40 rounded-2xl border border-white/10 text-xs text-white/50">
              No saved scriptures yet. Tap the bookmark icon in the Bible reader to save verses here!
            </div>
          ) : (
            savedVerses.map((verseRef, i) => (
              <div
                key={i}
                className="p-3 bg-[#001F3F] border border-white/10 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="font-bold text-white">{verseRef}</span>
                </div>
                <button
                  onClick={() => {
                    StorageService.removeSavedVerse(verseRef);
                  }}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 3: Settings & Account Management */}
      {activeSubTab === 'settings' && (
        <div className="space-y-3">
          
          {/* Notification Settings Panel */}
          <div className="p-4 bg-[#001F3F] border border-white/10 rounded-2xl space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Notification Settings</h4>
                  <p className="text-[11px] text-white/60">Configure real-time push & in-app ministry alerts</p>
                </div>
              </div>
              {notificationSavedToast ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-fade-in">
                  Saved
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20">
                  Active
                </span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              {/* 1. Live Streams Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0 mt-0.5 border border-red-500/30">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Live Streams</p>
                    <p className="text-[11px] text-white/60 leading-tight">Instant alerts when Apostle Joe Daniels goes live in the sanctuary</p>
                  </div>
                </div>
                <button
                  id="btn-toggle-notif-livestreams"
                  type="button"
                  onClick={() => handleToggleNotification('liveStreams')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                    notificationSettings.liveStreams ? 'bg-[#D4AF37]' : 'bg-white/15'
                  }`}
                  aria-label="Toggle Live Stream Notifications"
                >
                  <div
                    className={`bg-[#001F3F] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      notificationSettings.liveStreams ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. New Prayer Requests Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 border border-[#D4AF37]/30">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">New Prayer Requests</p>
                    <p className="text-[11px] text-white/60 leading-tight">Alerts when new prayer petitions or answered testimonies are posted</p>
                  </div>
                </div>
                <button
                  id="btn-toggle-notif-prayer"
                  type="button"
                  onClick={() => handleToggleNotification('prayerRequests')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                    notificationSettings.prayerRequests ? 'bg-[#D4AF37]' : 'bg-white/15'
                  }`}
                  aria-label="Toggle Prayer Request Notifications"
                >
                  <div
                    className={`bg-[#001F3F] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      notificationSettings.prayerRequests ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Direct Messages Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Direct Messages</p>
                    <p className="text-[11px] text-white/60 leading-tight">Notifications for private pastoral messages and covenant partner chats</p>
                  </div>
                </div>
                <button
                  id="btn-toggle-notif-dms"
                  type="button"
                  onClick={() => handleToggleNotification('directMessages')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                    notificationSettings.directMessages ? 'bg-[#D4AF37]' : 'bg-white/15'
                  }`}
                  aria-label="Toggle Direct Message Notifications"
                >
                  <div
                    className={`bg-[#001F3F] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      notificationSettings.directMessages ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Low-Data Saver */}
          <div className="p-4 bg-[#001F3F] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {lowDataMode ? <WifiOff className="w-4 h-4 text-emerald-400" /> : <Wifi className="w-4 h-4 text-white/60" />}
              <div>
                <p className="font-bold text-white">Low-Data Saver (Zimbabwe 2G/3G)</p>
                <p className="text-[11px] text-white/60">Switches live streams to 24kbps audio stream</p>
              </div>
            </div>
            <button
              onClick={onToggleLowData}
              className={`px-3 py-1 rounded-xl font-bold ${lowDataMode ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'}`}
            >
              {lowDataMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Developer-Only Controls: Paynow Gateway & Test Profile Switching */}
          {currentUser.role === 'developer' && (
            <div className="space-y-3 pt-2 border-t border-purple-500/30">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                  Developer Portal Controls
                </span>
              </div>

              {/* Paynow Zimbabwe Gateway Configuration (Developer Only) */}
              <div className="p-4 bg-slate-900 border border-purple-500/40 rounded-2xl flex items-center justify-between text-xs shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white">Paynow Zimbabwe Gateway</p>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        PaynowService.getConfig().isConfigured 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {PaynowService.getConfig().isConfigured ? 'Active' : 'Setup Required'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {PaynowService.getConfig().isConfigured 
                        ? `ID: ${PaynowService.getConfig().integrationId} • EcoCash / OneMoney` 
                        : 'Enter your Paynow Integration ID & Auth Key for live giving'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaynowModal(true)}
                  className="px-3 py-1.5 rounded-xl font-bold bg-[#D4AF37] text-[#001F3F] hover:bg-[#c29e2e] transition-colors"
                >
                  {PaynowService.getConfig().isConfigured ? 'Edit Keys' : 'Setup Keys'}
                </button>
              </div>

              {/* Quick Switch Accounts for testing (Developer Only) */}
              <div className="p-4 bg-slate-900 border border-purple-500/30 rounded-2xl space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-purple-300">Switch Test Profile (Developer Mode)</p>
                  <span className="text-[10px] text-slate-400 font-mono">Dev ID: 0780699988</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {INITIAL_USERS.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        StorageService.setCurrentUser(u);
                        onSwitchUser(u);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        currentUser.phone === u.phone
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold truncate">{u.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u.phone} ({u.role})</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Log Out */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/50 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Account</span>
            </button>
          )}

        </div>
      )}

      {/* Modals */}
      <ImagePickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelectImage={handleSaveAvatar}
        currentImage={currentUser.avatar_url}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
      />

      <PaynowConfigModal
        isOpen={showPaynowModal}
        onClose={() => setShowPaynowModal(false)}
      />

      <DownloadedSermonsModal
        isOpen={showDownloadsModal}
        onClose={() => {
          setShowDownloadsModal(false);
          setDownloadedSermons(StorageService.getDownloadedSermons());
        }}
        currentUser={currentUser}
        onUpgradeClick={() => {
          setShowDownloadsModal(false);
          if (!isSuperAdmin) setShowUpgradeModal(true);
        }}
      />

      <ProfileBadgesModal
        isOpen={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        currentUser={currentUser}
        onOpenChatDev={() => {
          setShowBadgesModal(false);
          setShowChatDevModal(true);
        }}
        onLogout={onLogout}
        onEditProfile={() => setIsEditingBio(true)}
        onOpenDirectChat={onOpenDirectChat}
        onRefreshUser={() => {
          if (onUpdateUser) onUpdateUser(StorageService.getCurrentUser() || currentUser);
        }}
      />

      <ChatDevModal
        isOpen={showChatDevModal}
        onClose={() => setShowChatDevModal(false)}
      />

      {/* FLOATING "CHAT DEV" ACTION BUTTON */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          id="btn-chat-dev-float"
          onClick={() => setShowChatDevModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-purple-400/50 shadow-purple-900/60 active:scale-95 transition-all group"
          title="Chat with Lead Developer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Code2 className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
          <span className="font-mono">Chat Dev</span>
        </button>
      </div>

      {/* USER CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

    </div>
  );
};
