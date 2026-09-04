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
  CreditCard
} from 'lucide-react';
import { User, Sermon } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { INITIAL_USERS, MOCK_SERMONS } from '../../data/mockData';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';
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
  onOpenSignUp
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'saved' | 'settings'>('videos');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaynowModal, setShowPaynowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(
    currentUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare'
  );
  const [cachedCount, setCachedCount] = useState(12);
  const [autoCacheEnabled, setAutoCacheEnabled] = useState(true);

  const isGuest = currentUser.role === 'guest';
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isDeveloper = currentUser.role === 'developer';

  const savedVerses = StorageService.getSavedVerses();

  // TikTok-Style seamless background pre-caching simulation
  useEffect(() => {
    // Automatically register sermons into offline media cache without manual intervention
    const cacheKey = 'tiktok_cached_sermons_count';
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
              You are currently browsing as a Guest Believer. Log in to access your personal Instagram-style profile, TikTok video cache, and fellowship privileges.
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
        
        {/* Top Handle / Member ID Bar */}
        <div className="flex items-center justify-between text-xs text-white/70 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-white font-bold tracking-wider">{currentUser.member_id}</span>
            <button
              onClick={handleCopyId}
              className="p-1 hover:text-[#D4AF37] transition-colors"
              title="Copy Member ID"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#001F3F] font-bold text-[10px]"
              >
                Admin
              </button>
            )}
            {isDeveloper && (
              <button
                onClick={onOpenDevConsole}
                className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px]"
              >
                Dev Console
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

          {/* Instagram 3-Stat Counters */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="cursor-pointer" onClick={() => setActiveSubTab('videos')}>
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {MOCK_SERMONS.length}
              </p>
              <p className="text-[11px] text-white/60">Sermons</p>
            </div>

            <div>
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {cachedCount}
              </p>
              <p className="text-[11px] text-white/60">Cached</p>
            </div>

            <div className="cursor-pointer" onClick={() => setActiveSubTab('saved')}>
              <p className="font-bold text-base sm:text-lg text-white leading-tight">
                {savedVerses.length}
              </p>
              <p className="text-[11px] text-white/60">Saved</p>
            </div>
          </div>

        </div>

        {/* Bio & Details Section */}
        <div className="space-y-1.5 text-left">
          
          {/* Name & Facebook-style Verified Badge */}
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base sm:text-lg text-white leading-snug">
              {currentUser.full_name}
            </h2>
            <VerifiedBadge type={currentUser.badge_type || (currentUser.is_verified ? 'gold' : 'none')} size="sm" />
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

        {/* Instagram-Style Action Buttons: Upgrade Button (Prominent) + Secondary Buttons */}
        <div className="flex items-center gap-2 pt-2">
          
          {/* ONE IMPORTANT UPGRADE BUTTON */}
          <button
            id="btn-me-upgrade-membership"
            onClick={() => setShowUpgradeModal(true)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>Upgrade</span>
          </button>

          {/* Edit Bio Button */}
          <button
            onClick={() => setIsEditingBio(!isEditingBio)}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Bio</span>
          </button>

          {/* Change Photo Button */}
          <button
            onClick={() => setShowPhotoPicker(true)}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Photo</span>
          </button>
        </div>

      </div>

      {/* TikTok-Style Seamless Video Cache Card (No hustle manual downloading) */}
      <div className="bg-[#001F3F]/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>TikTok-Style Instant Video Cache</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </h4>
              <p className="text-[11px] text-white/60">
                Videos and sermons pre-buffer in the background for zero-hustle offline playback.
              </p>
            </div>
          </div>

          <button
            onClick={() => setAutoCacheEnabled(!autoCacheEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              autoCacheEnabled 
                ? 'bg-emerald-500 text-slate-950' 
                : 'bg-white/10 text-white/60'
            }`}
          >
            {autoCacheEnabled ? 'Auto-Cache ON' : 'Paused'}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/70 pt-1 border-t border-white/5">
          <span>{cachedCount} Sermons Cached (Ready for offline travel)</span>
          <button
            onClick={() => {
              setCachedCount(0);
              localStorage.setItem('tiktok_cached_sermons_count', '0');
            }}
            className="text-white/40 hover:text-red-400 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Instagram-Style Profile Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[#001F3F]/40 rounded-2xl overflow-hidden p-1">
        <button
          onClick={() => setActiveSubTab('videos')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all ${
            activeSubTab === 'videos'
              ? 'bg-[#D4AF37] text-[#001F3F] shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Sermon Reels</span>
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
                      key={u.phone}
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

    </div>
  );
};
