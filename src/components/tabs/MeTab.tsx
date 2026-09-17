import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Camera, 
  Copy, 
  Check, 
  Crown, 
  Sparkles, 
  Grid3X3, 
  Bookmark, 
  Settings, 
  LogOut, 
  Play, 
  Share2, 
  Edit3, 
  Trash2, 
  ShieldCheck,
  Code2,
  LogIn,
  UserPlus,
  CreditCard,
  Download,
  Award,
  MessageCircle,
  Lock,
  X,
  Bell,
  Radio,
  HeartHandshake,
  Sun,
  Moon,
  Plus,
  MoreHorizontal,
  Link as LinkIcon,
  Heart,
  ExternalLink,
  QrCode,
  Users,
  Search,
  CheckCircle2,
  UserCheck,
  Flag,
  RotateCcw
} from 'lucide-react';
import { User, Sermon, NotificationSettings, Testimony, PostComment, ChurchPage } from '../../types';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { MOCK_SERMONS, INITIAL_USERS } from '../../data/mockData';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';
import { DownloadedSermonsModal } from '../modals/DownloadedSermonsModal';
import { ProfileBadgesModal } from '../modals/ProfileBadgesModal';
import { ChatDevModal } from '../modals/ChatDevModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { ChurchPagesSection } from '../common/ChurchPagesSection';
import { ChurchPageViewModal } from '../modals/ChurchPageViewModal';
import { PageCreationModal } from '../modals/PageCreationModal';
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

interface StoryHighlight {
  id: string;
  title: string;
  img: string;
}

const DEFAULT_HIGHLIGHTS: StoryHighlight[] = [
  { id: 'h1', title: 'Altar Fire', img: '/assets/apostle_joe_daniels_preach.jpg' },
  { id: 'h2', title: 'Miracles', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { id: 'h3', title: "Harare '26", img: '/assets/apostle_joe_daniels_main.jpg' },
  { id: 'h4', title: 'Praise Choir', img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&auto=format&fit=crop&q=80' },
  { id: 'h5', title: 'Sunday Live', img: '/assets/apostle_joe_daniels_podcast.jpg' },
];

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
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'reels' | 'pages' | 'downloads' | 'saved' | 'settings'>('posts');
  const [selectedChurchPage, setSelectedChurchPage] = useState<ChurchPage | null>(null);
  
  // Real-time user & lists state
  const [localUser, setLocalUser] = useState<User>(currentUser);
  const [myPosts, setMyPosts] = useState<Testimony[]>([]);
  const [downloadedSermons, setDownloadedSermons] = useState<Sermon[]>(() => StorageService.getDownloadedSermons());
  const [playingOfflineSermon, setPlayingOfflineSermon] = useState<Sermon | null>(null);
  const [savedVerses, setSavedVerses] = useState<string[]>(() => StorageService.getSavedVerses());
  const [followersList, setFollowersList] = useState<string[]>([]);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [followersUsers, setFollowersUsers] = useState<User[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    StorageService.getNotificationSettings(currentUser.id)
  );

  // Modals & Drawers state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaynowModal, setShowPaynowModal] = useState(false);
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showChatDevModal, setShowChatDevModal] = useState(false);
  const [showPageCreationModal, setShowPageCreationModal] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showMemberIdCard, setShowMemberIdCard] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [notificationSavedToast, setNotificationSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Followers / Following Modal Drawer
  const [showFollowersDrawer, setShowFollowersDrawer] = useState<'followers' | 'following' | null>(null);
  const [followSearchQuery, setFollowSearchQuery] = useState('');

  // Story Highlights State & Story Viewer
  const [storyHighlights, setStoryHighlights] = useState<StoryHighlight[]>(() => {
    try {
      const saved = localStorage.getItem('gcz_story_highlights_custom');
      return saved ? JSON.parse(saved) : DEFAULT_HIGHLIGHTS;
    } catch {
      return DEFAULT_HIGHLIGHTS;
    }
  });
  const [activeStoryHighlight, setActiveStoryHighlight] = useState<StoryHighlight | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [showAddHighlightModal, setShowAddHighlightModal] = useState<boolean>(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState<string>('');
  const [newHighlightImg, setNewHighlightImg] = useState<string>('');
  const highlightFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleHighlightCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewHighlightImg(reader.result);
        showToast('Cover photo attached from device');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Post Detail Modal
  const [activeDetailPost, setActiveDetailPost] = useState<Testimony | null>(null);
  const [postCommentText, setPostCommentText] = useState<string>('');
  const [postHeartAnim, setPostHeartAnim] = useState<boolean>(false);

  // Full Edit Profile Drawer State
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editFullName, setEditFullName] = useState(currentUser.full_name);
  const [editHandle, setEditHandle] = useState(currentUser.handle || `@${currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}`);
  const [editBio, setEditBio] = useState(currentUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
  const [editLocation, setEditLocation] = useState(currentUser.location || currentUser.city_location || 'Harare, Zimbabwe');
  const [editWebsite, setEditWebsite] = useState('https://gatewaychurchzim.org');
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatar_url || '');

  // Keep localUser in sync when prop changes
  useEffect(() => {
    setLocalUser(currentUser);
    setEditFullName(currentUser.full_name);
    setEditHandle(currentUser.handle || `@${currentUser.full_name.toLowerCase().replace(/\s+/g, '_')}`);
    setEditBio(currentUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare');
    setEditLocation(currentUser.location || currentUser.city_location || 'Harare, Zimbabwe');
    setEditPhone(currentUser.phone);
    setEditAvatarUrl(currentUser.avatar_url || '');
  }, [currentUser]);

  // Load user posts, followers, following in real-time
  const refreshUserData = () => {
    const freshUser = StorageService.getCurrentUser() || currentUser;
    setLocalUser(freshUser);

    // Filter posts for this user
    const allTestimonies = StorageService.getTestimonies();
    const userTestimonies = allTestimonies.filter(
      t => t.user_id === freshUser.id || 
           (t.user_handle && t.user_handle === freshUser.handle) || 
           t.user_name === freshUser.full_name
    );
    setMyPosts(userTestimonies);

    // Followers & Following
    setFollowersList(StorageService.getFollowersList(freshUser.id));
    setFollowingList(StorageService.getFollowingList(freshUser.id));
    setFollowersUsers(StorageService.getFollowersUsers(freshUser.id));

    // Offline downloads & saved verses
    setDownloadedSermons(StorageService.getDownloadedSermons());
    setSavedVerses(StorageService.getSavedVerses());
  };

  useEffect(() => {
    refreshUserData();

    const handleProfileUpdated = (e: any) => {
      const updated = e?.detail || StorageService.getCurrentUser();
      if (updated) {
        setLocalUser(updated);
        setEditFullName(updated.full_name);
        setEditHandle(updated.handle || '');
        setEditBio(updated.bio || '');
        setEditLocation(updated.location || updated.city_location || '');
        setEditPhone(updated.phone || '');
        setEditAvatarUrl(updated.avatar_url || '');
      }
      refreshUserData();
    };

    const handleFollowChange = () => {
      refreshUserData();
    };

    const handleThemeChange = (e: any) => {
      if (e?.detail?.theme) setTheme(e.detail.theme);
    };

    window.addEventListener('gcz_user_profile_updated', handleProfileUpdated);
    window.addEventListener('gcz_follow_updated', handleFollowChange);
    window.addEventListener('gcz_testimony_updated', refreshUserData);
    window.addEventListener('gcz_theme_changed', handleThemeChange);

    return () => {
      window.removeEventListener('gcz_user_profile_updated', handleProfileUpdated);
      window.removeEventListener('gcz_follow_updated', handleFollowChange);
      window.removeEventListener('gcz_testimony_updated', refreshUserData);
      window.removeEventListener('gcz_theme_changed', handleThemeChange);
    };
  }, [currentUser.id]);

  // Story Viewer Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStoryHighlight) {
      setStoryProgress(0);
      const interval = 50; // ms
      const step = 100 / (4000 / interval); // 4 seconds total
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            // Move to next highlight or close
            const currIdx = storyHighlights.findIndex(h => h.id === activeStoryHighlight.id);
            if (currIdx < storyHighlights.length - 1) {
              setActiveStoryHighlight(storyHighlights[currIdx + 1]);
              return 0;
            } else {
              setActiveStoryHighlight(null);
              return 0;
            }
          }
          return prev + step;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [activeStoryHighlight, storyHighlights]);

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Copy Member ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(localUser.member_id);
    setCopiedId(true);
    showToast('Member ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Save Full Profile Edits in Real Time
  const handleSaveProfileEdits = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanHandle = editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`;
    const updates = {
      full_name: editFullName.trim() || localUser.full_name,
      handle: cleanHandle,
      bio: editBio.trim(),
      location: editLocation.trim(),
      city_location: editLocation.trim(),
      phone: editPhone.trim(),
      avatar_url: editAvatarUrl.trim() || localUser.avatar_url
    };

    const updated = StorageService.updateUserProfile(updates);
    setLocalUser(updated);
    if (onUpdateUser) onUpdateUser(updated);
    setShowEditDrawer(false);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
    showToast('Profile updated in real-time');
  };

  // Direct avatar change from photo picker
  const handleAvatarChosen = (newUrl: string) => {
    const updated = StorageService.updateUserProfile({ avatar_url: newUrl });
    setLocalUser(updated);
    setEditAvatarUrl(newUrl);
    if (onUpdateUser) onUpdateUser(updated);
    setShowPhotoPicker(false);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
    showToast('Profile photo updated');
  };

  // Add Custom Story Highlight
  const handleCreateHighlight = () => {
    if (!newHighlightTitle.trim()) return;
    const newHighlight: StoryHighlight = {
      id: `hl_${Date.now()}`,
      title: newHighlightTitle.trim(),
      img: newHighlightImg.trim() || localUser.avatar_url || '/assets/apostle_joe_daniels_preach.jpg'
    };
    const updated = [...storyHighlights, newHighlight];
    setStoryHighlights(updated);
    try {
      localStorage.setItem('gcz_story_highlights_custom', JSON.stringify(updated));
    } catch {}
    setNewHighlightTitle('');
    setNewHighlightImg('');
    setShowAddHighlightModal(false);
    confetti({ particleCount: 20, spread: 45 });
    showToast('Story highlight created');
  };

  // Share via WhatsApp
  const handleShareProfileWhatsApp = () => {
    const shareUrl = `${window.location.origin}?member=${encodeURIComponent(localUser.member_id)}`;
    const msg = `Connect with ${localUser.full_name} (${localUser.handle || '@believer'}) on Gateway Church App:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    setShowOptionsSheet(false);
  };

  // Copy Profile Link
  const handleCopyProfileLink = () => {
    const shareUrl = `${window.location.origin}?member=${encodeURIComponent(localUser.member_id)}`;
    navigator.clipboard.writeText(shareUrl);
    setShowOptionsSheet(false);
    showToast('Profile link copied to clipboard');
  };

  // Post detail like toggle
  const handleTogglePostLike = (post: Testimony) => {
    const res = StorageService.likeTestimony(post.id, localUser.id);
    const isNowLiked = res.user_liked;
    if (isNowLiked) {
      setPostHeartAnim(true);
      setTimeout(() => setPostHeartAnim(false), 800);
      confetti({ particleCount: 15, spread: 40 });
    }

    const updatedPost: Testimony = {
      ...post,
      user_liked: res.user_liked,
      likes_count: res.likes_count,
      liked_user_ids: isNowLiked
        ? [...(post.liked_user_ids || []).filter(id => id !== localUser.id), localUser.id]
        : (post.liked_user_ids || []).filter(id => id !== localUser.id)
    };

    setActiveDetailPost(updatedPost);
    setMyPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
  };

  // Submit comment on post
  const handleAddPostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailPost || !postCommentText.trim()) return;

    const comment = StorageService.addCommentToTestimony(activeDetailPost.id, postCommentText.trim(), localUser);
    if (comment) {
      const updatedComments = [...(activeDetailPost.comments || []), comment];
      const updatedPost: Testimony = {
        ...activeDetailPost,
        comments: updatedComments,
        comments_count: updatedComments.length
      };

      setActiveDetailPost(updatedPost);
      setMyPosts(prev => prev.map(p => p.id === activeDetailPost.id ? updatedPost : p));
      setPostCommentText('');
      showToast('Comment posted');
    }
  };

  // Toggle notification setting
  const handleToggleNotification = (key: keyof NotificationSettings) => {
    const updated: NotificationSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(updated);
    StorageService.setNotificationSettings(updated, localUser.id);
    setNotificationSavedToast(true);
    setTimeout(() => setNotificationSavedToast(false), 2000);
  };

  // Toggle App Theme
  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    StorageService.setTheme(newTheme);
    setTheme(newTheme);
    showToast(`Appearance switched to ${newTheme} mode`);
  };

  // Guest restriction view
  if (localUser.role === 'guest') {
    return (
      <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-10 text-center animate-in fade-in">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-primary shadow-xs">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Gateway Believer Account</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              You are currently browsing as a Guest Believer. Log in to view your profile, save messages, and join fellowship.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Account</span>
            </button>

            <button
              onClick={onOpenSignUp}
              className="w-full py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs uppercase tracking-wider border border-border flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Create Believer Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = localUser.role === 'super_admin';
  const isDeveloper = localUser.role === 'developer';
  const downloadQuota = StorageService.getDownloadQuota(localUser);

  return (
    <div id="instagram-me-page" className="space-y-4 pb-24 max-w-2xl mx-auto px-3 sm:px-4 pt-1 w-full">
      
      {/* Real-time floating toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-card text-primary border border-border px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* INSTAGRAM PROFILE CONTAINER */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-5 text-foreground">
        
        {/* 1. TOP INSTAGRAM IDENTITY BAR */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg text-foreground tracking-tight">
              {localUser.handle || `@${localUser.full_name.toLowerCase().replace(/\s+/g, '_')}`}
            </span>
            <VerifiedBadge type={localUser.verified_badge || localUser.badge_type || (localUser.is_verified ? 'gold' : 'blue')} size="xs" />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
              <Check className="w-2.5 h-2.5" />
              <span>{localUser.is_verified ? 'Verified' : 'Member'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Member ID chip with copy button */}
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 font-mono text-[11px] bg-secondary hover:bg-secondary/80 border border-border px-2 py-1 rounded-lg text-muted-foreground transition-colors"
              title="Copy Member ID"
            >
              <span>{localUser.member_id}</span>
              {copiedId ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>

            {/* Admin Badge */}
            {isSuperAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs hover:bg-primary/90 active:scale-95 transition-all"
                title="Admin Control Center"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
            )}

            {/* Dev Badge */}
            {isDeveloper && (
              <button
                onClick={onOpenDevConsole}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 font-semibold text-[10px] flex items-center gap-1 hover:bg-purple-500/20 active:scale-95 transition-all"
                title="Developer Console"
              >
                <Code2 className="w-3 h-3" />
                <span>Console</span>
              </button>
            )}

            {/* 3-Dots Options Menu */}
            <button
              onClick={() => setShowOptionsSheet(true)}
              className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors active:scale-95 border border-border"
              title="Profile Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. INSTAGRAM PROFILE HEADER (Avatar on Left, Stats on Right) */}
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          
          {/* Avatar with Story Ring */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => setShowPhotoPicker(true)}>
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full rounded-full overflow-hidden bg-card border-2 border-card flex items-center justify-center">
                {localUser.avatar_url ? (
                  <img
                    src={localUser.avatar_url}
                    alt={localUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    {localUser.full_name ? localUser.full_name[0] : 'G'}
                  </span>
                )}
              </div>
            </div>

            {/* Camera badge to change photo */}
            <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs border-2 border-card group-hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>

          {/* Instagram 3 Stats Counters */}
          <div className="flex-1 flex items-center justify-around text-center">
            
            {/* Posts */}
            <button 
              onClick={() => setActiveSubTab('posts')}
              className="group cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center"
            >
              <p className="font-bold text-lg sm:text-xl text-foreground leading-tight group-hover:text-primary transition-colors">
                {myPosts.length}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Posts</p>
            </button>

            {/* Followers */}
            <button 
              onClick={() => setShowFollowersDrawer('followers')}
              className="group cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center"
            >
              <p className="font-bold text-lg sm:text-xl text-foreground leading-tight group-hover:text-primary transition-colors">
                {followersList.length}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Followers</p>
            </button>

            {/* Following */}
            <button 
              onClick={() => setShowFollowersDrawer('following')}
              className="group cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center"
            >
              <p className="font-bold text-lg sm:text-xl text-foreground leading-tight group-hover:text-primary transition-colors">
                {followingList.length}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Following</p>
            </button>

          </div>
        </div>

        {/* 3. BIO & DETAILS SECTION */}
        <div className="space-y-2 text-left pt-1">
          
          {/* Name & Verified Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="font-bold text-base sm:text-lg text-foreground leading-tight">
              {localUser.full_name}
            </h2>
            <VerifiedBadge type={localUser.verified_badge || localUser.badge_type || (localUser.is_verified ? 'gold' : 'none')} size="sm" />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              {localUser.role === 'super_admin' ? 'Admin' :
               localUser.role === 'developer' ? 'Mod' :
               localUser.role === 'pastor' ? 'Pastor' :
               localUser.role === 'elder' ? 'Elder' :
               localUser.role === 'youth' ? 'Youth' :
               localUser.is_verified ? 'Verified' : 'Member'}
            </span>
          </div>

          {/* Phone & Location */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono">{localUser.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{localUser.location || localUser.city_location || 'Harare, Zimbabwe'}</span>
            </div>
          </div>

          {/* Bio text */}
          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line pt-0.5">
            {localUser.bio || 'Walking in supernatural dominion & apostolic grace • Gateway Church Harare'}
          </p>

          {/* Link in bio */}
          <a
            href="https://gatewaychurchzim.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>gatewaychurchzim.org</span>
          </a>

          {/* Social Proof Mutuals row (Real followers from database) */}
          {followersUsers.length === 0 ? (
            <button
              onClick={() => setShowFollowersDrawer('followers')}
              className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>0 followers</span>
            </button>
          ) : followersUsers.length === 1 ? (
            <button
              onClick={() => setShowFollowersDrawer('followers')}
              className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
            >
              <img 
                src={followersUsers[0].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                alt="" 
                className="w-4 h-4 rounded-full border border-card object-cover" 
              />
              <span>
                Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong>
              </span>
            </button>
          ) : followersUsers.length === 2 ? (
            <button
              onClick={() => setShowFollowersDrawer('followers')}
              className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
            >
              <div className="flex -space-x-1.5">
                <img 
                  src={followersUsers[0].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                  alt="" 
                  className="w-4 h-4 rounded-full border border-card object-cover" 
                />
                <img 
                  src={followersUsers[1].avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                  alt="" 
                  className="w-4 h-4 rounded-full border border-card object-cover" 
                />
              </div>
              <span>
                Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong> and <strong className="text-foreground font-semibold">{(followersUsers[1].handle || followersUsers[1].full_name).replace('@', '')}</strong>
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowFollowersDrawer('followers')}
              className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
            >
              <div className="flex -space-x-1.5">
                {followersUsers.slice(0, 2).map((u, i) => (
                  <img 
                    key={u.id || i} 
                    src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                    alt="" 
                    className="w-4 h-4 rounded-full border border-card object-cover" 
                  />
                ))}
              </div>
              <span>
                Followed by <strong className="text-foreground font-semibold">{(followersUsers[0].handle || followersUsers[0].full_name).replace('@', '')}</strong>, <strong className="text-foreground font-semibold">{(followersUsers[1].handle || followersUsers[1].full_name).replace('@', '')}</strong>, and {followersUsers.length - 2} other{followersUsers.length - 2 === 1 ? '' : 's'}
              </span>
            </button>
          )}

        </div>

        {/* 4. INSTAGRAM ACTION BUTTONS (Compact Instagram Mobile Style) */}
        <div className="flex items-center gap-2 pt-1">
          
          {/* 1. Edit Profile Button */}
          <button
            id="btn-me-edit-profile"
            onClick={() => setShowEditDrawer(true)}
            className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>Edit</span>
          </button>

          {/* 2. Share Profile Button */}
          <button
            id="btn-me-share-profile"
            onClick={handleShareProfileWhatsApp}
            className="flex-1 h-8 px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Share</span>
          </button>

          {/* 3. Member ID Card Icon Button */}
          <button
            id="btn-me-member-card"
            onClick={() => setShowMemberIdCard(true)}
            className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            title="Digital Member ID"
            aria-label="Digital Member ID"
          >
            <QrCode className="w-4 h-4 text-primary" />
          </button>

          {/* 4. Church Pages Shortcut */}
          <button
            id="btn-me-pages-shortcut"
            onClick={() => setActiveSubTab('pages')}
            className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 ${
              activeSubTab === 'pages'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
            }`}
            title="Church Pages & Ministries"
          >
            <Flag className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          {/* 5. Create Page Action Button */}
          <button
            id="btn-me-create-page"
            onClick={() => setShowPageCreationModal(true)}
            className="h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Create Official Church Page"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Page</span>
          </button>

          {/* 5. Role Status / Admin / Mod Button */}
          {isSuperAdmin ? (
            <button
              onClick={onOpenAdminPanel}
              className="h-8 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Admin Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          ) : localUser.role === 'developer' ? (
            <button
              onClick={onOpenAdminPanel}
              className="h-8 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Moderator Tools"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mod</span>
            </button>
          ) : (
            <button
              id="btn-me-upgrade-partner"
              onClick={() => setShowUpgradeModal(true)}
              className="h-8 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Partner"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Partner</span>
            </button>
          )}

        </div>

        {/* 5. INSTAGRAM STORY HIGHLIGHTS TRAY */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Story Highlights</span>
            <button 
              onClick={() => setShowAddHighlightModal(true)}
              className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Highlight</span>
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
            
            {/* Story Highlight Bubbles */}
            {storyHighlights.map((hl) => (
              <button
                key={hl.id}
                onClick={() => setActiveStoryHighlight(hl)}
                className="flex flex-col items-center gap-1 group shrink-0 cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full overflow-hidden bg-card border border-border">
                    <img src={hl.img} alt={hl.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] text-foreground/80 font-medium truncate max-w-[56px] text-center">
                  {hl.title}
                </span>
              </button>
            ))}

            {/* "+ New" Highlight Add Bubble */}
            <button
              onClick={() => setShowAddHighlightModal(true)}
              className="flex flex-col items-center gap-1 group shrink-0 cursor-pointer"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-dashed border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-all group-hover:scale-105">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">New</span>
            </button>

          </div>
        </div>

      </div>

      {/* 6. INSTAGRAM SUB-NAVIGATION TABS (Posts Grid, Reels, Downloads, Saved, Settings) */}
      <div className="flex border border-border bg-card rounded-lg p-1 gap-1 shadow-xs">
        
        {/* Posts Tab */}
        <button
          onClick={() => setActiveSubTab('posts')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'posts'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="hidden sm:inline">Posts</span>
        </button>

        {/* Video Reels Tab */}
        <button
          onClick={() => setActiveSubTab('reels')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'reels'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Reels</span>
        </button>

        {/* Offline Downloads Tab */}
        <button
          onClick={() => setActiveSubTab('downloads')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'downloads'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Downloads ({downloadedSermons.length})</span>
        </button>

        {/* Saved Tab */}
        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'saved'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Saved ({savedVerses.length})</span>
        </button>

        {/* Church Pages & Ministries Tab */}
        <button
          onClick={() => setActiveSubTab('pages')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'pages'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span className="hidden sm:inline">Pages</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>

      </div>

      {/* 7. SUB-TAB CONTENTS */}

      {/* TAB 1: 3-COLUMN POSTS GRID */}
      {activeSubTab === 'posts' && (
        <div className="space-y-3">
          {myPosts.length === 0 ? (
            <div className="p-10 text-center bg-card rounded-xl border border-border text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full border border-border bg-secondary flex items-center justify-center mx-auto text-primary">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground text-sm">No Posts or Testimonies Yet</h4>
              <p className="text-xs max-w-xs mx-auto text-muted-foreground">
                Share what God has done in your life or post scripture insights to inspire the Gateway body.
              </p>
              <button
                onClick={() => {
                  StorageService.submitTestimony({
                    user_id: localUser.id,
                    user_name: localUser.full_name,
                    user_handle: localUser.handle,
                    user_avatar: localUser.avatar_url,
                    title: 'Walking in Apostolic Dominion',
                    category: 'Spiritual Growth',
                    content: 'Giving glory to Jesus for supernatural peace and breakthrough this season at Gateway Church Harare!',
                    image_url: '/assets/apostle_joe_daniels_main.jpg',
                    scripture_tag: 'Romans 8:37'
                  });
                  refreshUserData();
                  confetti({ particleCount: 25, spread: 50 });
                  showToast('First testimony published');
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider shadow-xs hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              >
                + Post Faith Testimony
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setActiveDetailPost(post)}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-all"
                >
                  <img
                    src={post.image_url || '/assets/apostle_joe_daniels_preach.jpg'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Hover Overlay with Likes & Comments */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white font-semibold text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white text-white" />
                      <span>{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                      <span>{post.comments?.length || post.comments_count || 0}</span>
                    </div>
                  </div>

                  {/* Category chip badge */}
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-xs text-[9px] font-semibold text-primary truncate max-w-[90%] border border-border/50">
                    {post.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERMON REELS */}
      {activeSubTab === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MOCK_SERMONS.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                StorageService.setOverridePlayingVideo({
                  id: s.id,
                  title: s.title,
                  youtube_id: s.youtube_id
                });
                showToast(`Loaded ${s.title}`);
              }}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border cursor-pointer shadow-xs hover:border-primary transition-all"
            >
              <img
                src={s.thumbnail_url}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">
                    {s.duration}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold">
                    Reel
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-white/80 font-mono">
                    <Play className="w-3 h-3 fill-current text-primary" />
                    <span>{(s.view_count || 1200).toLocaleString()} views</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                    {s.title}
                  </h4>
                  <p className="text-[10px] text-white/70 truncate">
                    {s.speaker}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: OFFLINE DOWNLOADS VAULT */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-3">
          
          {/* Quota Banner */}
          <div className="p-4 bg-card border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground text-sm">Offline Downloads Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20">
                  {downloadQuota.isUnlimited ? 'Unlimited Access' : `${downloadQuota.remaining}/${downloadQuota.limit} Remaining`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Listen and watch offline without consuming cellular data on 2G/3G bundles.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {!isSuperAdmin && !localUser.is_premium && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Get Unlimited
                </button>
              )}
              <button
                onClick={() => setShowDownloadsModal(true)}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
              >
                Browse Sermons
              </button>
            </div>
          </div>

          {/* Active Offline Player */}
          {playingOfflineSermon && (
            <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-md animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">
                    Offline Player: {playingOfflineSermon.title}
                  </span>
                </div>
                <button
                  onClick={() => setPlayingOfflineSermon(null)}
                  className="p-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-border shadow-xs">
                <iframe
                  title={playingOfflineSermon.title}
                  src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(playingOfflineSermon.youtube_id || playingOfflineSermon.video_url))}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Downloaded Sermons List */}
          {downloadedSermons.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-border text-xs text-muted-foreground space-y-3">
              <Download className="w-8 h-8 text-primary mx-auto opacity-70" />
              <p className="font-bold text-foreground text-sm">No Downloaded Messages Yet</p>
              <p className="text-xs max-w-sm mx-auto">
                Download any sermon to watch or listen offline with zero cellular data consumption.
              </p>
              <button
                onClick={() => setShowDownloadsModal(true)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                Browse Church Sermons
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {downloadedSermons.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl flex items-center justify-between gap-3 text-xs transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                      <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/80 text-[8px] text-white font-mono rounded">
                        {s.duration}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground truncate">{s.title}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{s.speaker}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Saved for offline • 14.8 MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPlayingOfflineSermon(s)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
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
                        showToast('Removed from downloads');
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete offline file"
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

      {/* TAB 4: SAVED SCRIPTURES */}
      {activeSubTab === 'saved' && (
        <div className="space-y-2">
          {savedVerses.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-border text-xs text-muted-foreground space-y-2">
              <Bookmark className="w-8 h-8 text-primary mx-auto opacity-70" />
              <p className="font-bold text-foreground text-sm">No Saved Scriptures Yet</p>
              <p className="text-xs">Tap the bookmark icon in the Bible reader to save verses to your collection.</p>
            </div>
          ) : (
            savedVerses.map((verseRef, i) => (
              <div
                key={i}
                className="p-3 bg-card border border-border rounded-xl flex items-center justify-between text-xs shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground text-sm">{verseRef}</span>
                </div>
                <button
                  onClick={() => {
                    StorageService.removeSavedVerse(verseRef);
                    setSavedVerses(StorageService.getSavedVerses());
                    showToast('Verse removed from saved');
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: SETTINGS & ACCOUNT MANAGEMENT */}
      {activeSubTab === 'settings' && (
        <div className="space-y-3.5">
          
          {/* Notification Settings Panel */}
          <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-xs">Real-Time Ministry Notifications</h4>
                  <p className="text-[11px] text-muted-foreground">Configure instant church alerts and broadcast updates</p>
                </div>
              </div>
              {notificationSavedToast && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Saved
                </span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              
              {/* 1. Live Streams */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Live Stream Sanctuary Broadcasts</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">Instant alerts when Apostle Joe Daniels goes live</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('liveStreams')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${
                    notificationSettings.liveStreams ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`bg-primary-foreground w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      notificationSettings.liveStreams ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Prayer Requests */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Prayer Requests & Answered Praises</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">Alerts when new prayer petitions or praises are submitted</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('prayerRequests')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${
                    notificationSettings.prayerRequests ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`bg-primary-foreground w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      notificationSettings.prayerRequests ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Direct Messages */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Direct Messages & Fellowship</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">Alerts for incoming private believer chats and pastoral responses</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('directMessages')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 shrink-0 ${
                    notificationSettings.directMessages ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`bg-primary-foreground w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      notificationSettings.directMessages ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Theme & Appearance */}
          <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="font-bold text-foreground">App Color Theme</p>
                <p className="text-[11px] text-muted-foreground">
                  {theme === 'dark' ? 'Obsidian Dark (Battery Saver)' : 'Modern Light (High Contrast)'}
                </p>
              </div>
            </div>
            <div className="flex items-center bg-secondary p-1 rounded-lg gap-1 border border-border">
              <button
                type="button"
                onClick={() => handleSetTheme('dark')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetTheme('light')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Low Data Saver */}
          <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div>
              <p className="font-bold text-foreground">Zimbabwe Low-Data Saver (2G/3G)</p>
              <p className="text-[11px] text-muted-foreground">Automatically drops video streams to 24kbps crystal audio</p>
            </div>
            <button
              onClick={onToggleLowData}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                lowDataMode 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
              }`}
            >
              {lowDataMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Change Password & Account Security */}
          <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div>
              <p className="font-bold text-foreground">Account Password & Security</p>
              <p className="text-[11px] text-muted-foreground">Update your security passkey and login credentials</p>
            </div>
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </div>

          {/* Developer Portal Controls (Only when developer role) */}
          {isDeveloper && (
            <div className="p-4 bg-card border border-purple-500/30 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">
                  Developer Special Utilities
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowPaynowModal(true)}
                  className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Paynow Setup</span>
                </button>
                <button
                  onClick={onOpenFlutterExport}
                  className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Flutter Export</span>
                </button>
              </div>

              {/* Profile switcher */}
              <div className="pt-2 border-t border-purple-500/20">
                <p className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold mb-1.5">Switch Dev Test Accounts</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {INITIAL_USERS.slice(0, 4).map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        StorageService.setCurrentUser(u);
                        onSwitchUser(u);
                        showToast(`Switched to ${u.full_name}`);
                      }}
                      className="p-2 rounded-lg bg-secondary/50 border border-border text-left hover:border-primary transition-all"
                    >
                      <p className="text-xs font-bold text-foreground truncate">{u.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{u.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Log Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Gateway Connect</span>
            </button>
          )}

        </div>
      )}

      {/* TAB 6: CHURCH PAGES & MINISTRIES */}
      {activeSubTab === 'pages' && (
        <ChurchPagesSection
          currentUser={localUser}
          onPageSelected={(page) => setSelectedChurchPage(page)}
        />
      )}

      {/* 8. EDIT PROFILE DRAWER */}
      {showEditDrawer && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Edit Believer Profile</h3>
              </div>
              <button
                onClick={() => setShowEditDrawer(false)}
                className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar edit section */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative group cursor-pointer" onClick={() => setShowPhotoPicker(true)}>
                <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-yellow-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-card flex items-center justify-center border-2 border-card">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{editFullName?.[0] || 'G'}</span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change profile photo
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveProfileEdits} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-foreground font-medium focus:outline-none focus:border-primary"
                  placeholder="e.g. Deacon Chiedza Mutasa"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Username / Handle
                </label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-foreground font-mono focus:outline-none focus:border-primary"
                  placeholder="@handle"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Ministry Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary leading-relaxed resize-none"
                  placeholder="Share your spiritual focus, church ministry, or testimony..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Location / Fellowship
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-foreground focus:outline-none focus:border-primary"
                    placeholder="Harare, Zimbabwe"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3.5 py-2 text-foreground font-mono focus:outline-none focus:border-primary"
                    placeholder="+263..."
                  />
                </div>
              </div>

              {/* Quick Location Presets */}
              <div>
                <span className="text-[10px] text-muted-foreground block mb-1">Quick City Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Harare, Zimbabwe', 'Bulawayo, Zimbabwe', 'Mutare, Zimbabwe', 'Chitungwiza, Zimbabwe', 'London, UK', 'Johannesburg, SA'].map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setEditLocation(city)}
                      className="px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] text-muted-foreground border border-border"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditDrawer(false)}
                  className="flex-1 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider hover:bg-primary/90 shadow-xs"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 9. FOLLOWERS & FOLLOWING DRAWER */}
      {showFollowersDrawer && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground capitalize">
                  {showFollowersDrawer} ({showFollowersDrawer === 'followers' ? followersList.length : followingList.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowFollowersDrawer(null);
                  setFollowSearchQuery('');
                }}
                className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={followSearchQuery}
                onChange={(e) => setFollowSearchQuery(e.target.value)}
                placeholder="Search believers..."
                className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Believers List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const allUsers = StorageService.getAllUsers();
                return (showFollowersDrawer === 'followers' ? followersList : followingList)
                  .filter(id => {
                    const u = allUsers.find(x => x.id === id);
                    if (!u) return true;
                    return u.full_name.toLowerCase().includes(followSearchQuery.toLowerCase()) ||
                           (u.handle && u.handle.toLowerCase().includes(followSearchQuery.toLowerCase()));
                  })
                  .map(id => {
                    const member = allUsers.find(x => x.id === id) || {
                      id,
                      full_name: 'Gateway Believer',
                      handle: '@believer',
                      avatar_url: '/assets/apostle_joe_daniels_main.jpg'
                    };

                    const isFollowingThis = followingList.includes(id);

                    return (
                      <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-border"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs truncate">{member.full_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{member.handle || '@believer'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            StorageService.toggleFollowUser(localUser.id, id);
                            refreshUserData();
                            showToast(isFollowingThis ? 'Unfollowed' : 'Followed believer');
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            isFollowingThis
                              ? 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {isFollowingThis ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    );
                  });
              })()}

              {(showFollowersDrawer === 'followers' ? followersList : followingList).length === 0 && (
                <p className="text-center py-8 text-xs text-muted-foreground">
                  No {showFollowersDrawer} yet.
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 10. POST DETAIL MODAL */}
      {activeDetailPost && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            
            {/* Post Header */}
            <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={localUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
                <div>
                  <p className="font-semibold text-xs text-foreground leading-none">{localUser.full_name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{localUser.handle || '@believer'}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailPost(null)}
                className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post Image with Double-Tap Heart Animation */}
            <div 
              className="relative aspect-square w-full bg-muted shrink-0 overflow-hidden cursor-pointer"
              onDoubleClick={() => handleTogglePostLike(activeDetailPost)}
            >
              <img
                src={activeDetailPost.image_url || '/assets/apostle_joe_daniels_preach.jpg'}
                alt=""
                className="w-full h-full object-cover"
              />

              {postHeartAnim && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-20 h-20 text-rose-500 fill-rose-500 animate-ping" />
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePostLike(activeDetailPost)}
                    className="text-foreground hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        activeDetailPost.user_liked || activeDetailPost.liked_user_ids?.includes(localUser.id)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-foreground'
                      }`}
                    />
                  </button>
                  <button className="text-foreground hover:scale-110 transition-transform cursor-pointer">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Check out this testimony on Gateway Church: "${activeDetailPost.title}"\n${window.location.origin}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                    }}
                    className="text-foreground hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Share2 className="w-5 h-5 text-emerald-500" />
                  </button>
                </div>

                <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                  {activeDetailPost.category}
                </span>
              </div>

              {/* Likes counter */}
              <p className="font-bold text-xs text-foreground">
                {(activeDetailPost.likes_count || 0).toLocaleString()} likes
              </p>

              {/* Caption */}
              <p className="text-xs text-foreground/90 leading-relaxed">
                <strong className="text-foreground mr-1.5">{localUser.full_name}</strong>
                {activeDetailPost.content || activeDetailPost.title}
              </p>

              {activeDetailPost.scripture_tag && (
                <p className="text-[11px] text-primary font-semibold italic">
                  📖 {activeDetailPost.scripture_tag}
                </p>
              )}

              {/* Comments Thread */}
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Comments</p>
                {activeDetailPost.comments?.map((c, idx) => (
                  <div key={idx} className="text-xs flex items-start gap-2">
                    <strong className="text-foreground font-semibold shrink-0">{c.user_name}:</strong>
                    <span className="text-muted-foreground">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Input Box */}
            <form onSubmit={handleAddPostComment} className="p-3 border-t border-border flex gap-2 bg-secondary/30 shrink-0">
              <input
                type="text"
                value={postCommentText}
                onChange={(e) => setPostCommentText(e.target.value)}
                placeholder="Add a blessing or comment..."
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 cursor-pointer"
              >
                Post
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 11. STORY HIGHLIGHTS VIEWER */}
      {activeStoryHighlight && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 animate-in fade-in">
          
          {/* Progress Bars */}
          <div className="flex gap-1.5 pt-2 max-w-md mx-auto w-full">
            {storyHighlights.map((hl) => (
              <div key={hl.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width: hl.id === activeStoryHighlight.id
                      ? `${storyProgress}%`
                      : storyHighlights.indexOf(hl) < storyHighlights.indexOf(activeStoryHighlight)
                        ? '100%'
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Top Bar */}
          <div className="max-w-md mx-auto w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <img
                src={localUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                alt=""
                className="w-8 h-8 rounded-full border border-white/30 object-cover"
              />
              <div>
                <p className="font-bold text-xs text-white leading-none">{localUser.full_name}</p>
                <p className="text-[10px] text-white/70 mt-0.5">{activeStoryHighlight.title}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveStoryHighlight(null)}
              className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Story Image Stage */}
          <div className="max-w-md mx-auto w-full aspect-[9/16] rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center bg-black">
            <img
              src={activeStoryHighlight.img}
              alt=""
              className="w-full h-full object-cover"
            />
            
            {/* Tap navigation hotspots */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer"
              onClick={() => {
                const idx = storyHighlights.findIndex(h => h.id === activeStoryHighlight.id);
                if (idx > 0) setActiveStoryHighlight(storyHighlights[idx - 1]);
              }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer"
              onClick={() => {
                const idx = storyHighlights.findIndex(h => h.id === activeStoryHighlight.id);
                if (idx < storyHighlights.length - 1) setActiveStoryHighlight(storyHighlights[idx + 1]);
                else setActiveStoryHighlight(null);
              }}
            />

            <div className="absolute bottom-6 left-4 right-4 text-center">
              <span className="px-4 py-1.5 rounded-full bg-black/60 text-primary font-semibold text-xs border border-primary/40 shadow-lg">
                ✨ {activeStoryHighlight.title} • Gateway Church
              </span>
            </div>
          </div>

          {/* Story Footer */}
          <div className="max-w-md mx-auto w-full py-3 flex items-center justify-center">
            <span className="text-[11px] text-white/50">Tap left to rewind • Tap right to advance</span>
          </div>

        </div>
      )}

      {/* 12. ADD STORY HIGHLIGHT DRAWER */}
      {showAddHighlightModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Create Story Highlight</h3>
              <button onClick={() => setShowAddHighlightModal(false)} className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Highlight Title</label>
                <input
                  type="text"
                  value={newHighlightTitle}
                  onChange={(e) => setNewHighlightTitle(e.target.value)}
                  placeholder="e.g. Altar Fire, Miracles, Harare..."
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Highlight Cover Artwork</label>
                <input
                  ref={highlightFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHighlightCoverSelect}
                  className="hidden"
                />
                {newHighlightImg ? (
                  <div className="relative rounded-xl overflow-hidden border border-border aspect-square max-w-[120px] mx-auto group">
                    <img src={newHighlightImg} alt="Cover preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewHighlightImg('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => highlightFileInputRef.current?.click()}
                      className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[10px] text-center text-white font-medium hover:bg-black/80 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => highlightFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer bg-secondary/30 hover:bg-secondary/60 transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Upload from this device</span>
                    <span className="text-[10px] text-muted-foreground">Select local photo for highlight cover</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleCreateHighlight}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold uppercase text-xs tracking-wider hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                Publish Highlight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. DIGITAL MEMBER ID CARD MODAL */}
      {showMemberIdCard && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl text-center space-y-4 text-foreground relative">
            <button
              onClick={() => setShowMemberIdCard(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-xl">🕊️</span>
              <span className="font-bold text-sm tracking-wider text-primary uppercase">GATEWAY CHURCH ZIMBABWE</span>
            </div>

            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto">
              <div className="w-full h-full rounded-full overflow-hidden bg-card border-2 border-card flex items-center justify-center">
                {localUser.avatar_url ? (
                  <img src={localUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{localUser.full_name?.[0] || 'G'}</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">{localUser.full_name}</h3>
              <p className="text-xs text-primary font-semibold">{localUser.handle || '@believer'}</p>
              <span className="inline-block px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold uppercase tracking-wider">
                {localUser.role.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3 bg-secondary/50 rounded-xl border border-border text-xs font-mono space-y-1 text-muted-foreground">
              <p className="text-[10px] text-muted-foreground/70 uppercase font-sans">Digital Believer Credential</p>
              <p className="text-primary font-bold text-sm tracking-wider">{localUser.member_id}</p>
              <p className="text-[10px]">{localUser.location || 'Harare, Zimbabwe'}</p>
            </div>

            {/* Barcode representation */}
            <div className="py-2 flex flex-col items-center gap-1 opacity-70">
              <div className="flex gap-0.5 h-7 items-center">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1].map((w, i) => (
                  <div key={i} className="bg-foreground" style={{ width: `${w * 2}px`, height: '100%' }} />
                ))}
              </div>
              <span className="font-mono text-[9px] text-muted-foreground tracking-widest">{localUser.member_id}</span>
            </div>

            <button
              onClick={handleCopyId}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              {copiedId ? 'Copied to Clipboard!' : 'Copy Member ID'}
            </button>
          </div>
        </div>
      )}

      {/* 14. 3-DOTS PROFILE OPTIONS SHEET */}
      {showOptionsSheet && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 shadow-xl space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="font-bold text-foreground text-sm">Account Options</h4>
              <button onClick={() => setShowOptionsSheet(false)} className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleShareProfileWhatsApp}
              className="w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left text-foreground font-medium flex items-center justify-between transition-colors cursor-pointer border border-border"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>Share Profile via WhatsApp</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <button
              onClick={handleCopyProfileLink}
              className="w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left text-foreground font-medium flex items-center justify-between transition-colors cursor-pointer border border-border"
            >
              <div className="flex items-center gap-2.5">
                <Copy className="w-4 h-4 text-primary" />
                <span>Copy Profile Link</span>
              </div>
            </button>

            <button
              onClick={() => {
                setShowOptionsSheet(false);
                setShowMemberIdCard(true);
              }}
              className="w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left text-foreground font-medium flex items-center justify-between transition-colors cursor-pointer border border-border"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-primary" />
                <span>View Digital Church ID Card</span>
              </div>
            </button>

            <button
              onClick={() => {
                setShowOptionsSheet(false);
                setActiveSubTab('settings');
              }}
              className="w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left text-foreground font-medium flex items-center justify-between transition-colors cursor-pointer border border-border"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings & Notifications</span>
              </div>
            </button>

            {/* Reset App to Clean Defaults */}
            <button
              onClick={() => {
                setShowOptionsSheet(false);
                StorageService.resetAppToDefaults();
                showToast('Application reset to essential defaults');
              }}
              className="w-full p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-left text-amber-500 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-amber-500/25"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset App to Defaults</span>
            </button>

            {onLogout && (
              <button
                onClick={() => {
                  setShowOptionsSheet(false);
                  onLogout();
                }}
                className="w-full p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-left text-destructive font-semibold flex items-center gap-2.5 transition-colors cursor-pointer border border-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 15. EMBEDDED MODALS */}
      <ImagePickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelectImage={handleAvatarChosen}
        currentImage={localUser.avatar_url}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentUser={localUser}
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
        currentUser={localUser}
        onUpgradeClick={() => {
          setShowDownloadsModal(false);
          if (!isSuperAdmin) setShowUpgradeModal(true);
        }}
      />

      <ProfileBadgesModal
        isOpen={showBadgesModal}
        onClose={() => setShowBadgesModal(false)}
        currentUser={localUser}
        onOpenChatDev={() => {
          setShowBadgesModal(false);
          setShowChatDevModal(true);
        }}
        onLogout={onLogout}
        onEditProfile={() => setShowEditDrawer(true)}
        onOpenDirectChat={onOpenDirectChat}
        onRefreshUser={() => {
          if (onUpdateUser) onUpdateUser(StorageService.getCurrentUser() || localUser);
        }}
      />

      <ChatDevModal
        isOpen={showChatDevModal}
        onClose={() => setShowChatDevModal(false)}
      />

      {showChangePasswordModal && (
        <ChangePasswordModal
          currentUser={localUser}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {/* Floating Chat Dev shortcut */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowChatDevModal(true)}
          className="bg-card hover:bg-accent text-primary font-semibold text-xs px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 border border-border active:scale-95 transition-all group cursor-pointer"
          title="Chat with Lead Developer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Code2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-mono">Chat Dev</span>
        </button>
      </div>

      {/* Church Page Creation Modal */}
      {showPageCreationModal && (
        <PageCreationModal
          currentUser={localUser}
          onClose={() => setShowPageCreationModal(false)}
          onPageCreated={(newPage) => {
            setShowPageCreationModal(false);
            setSelectedChurchPage(newPage);
            setActiveSubTab('pages');
            confetti({ particleCount: 35, spread: 70 });
          }}
        />
      )}

      {/* Church Page View Modal */}
      {selectedChurchPage && (
        <ChurchPageViewModal
          page={selectedChurchPage}
          currentUser={localUser}
          onClose={() => setSelectedChurchPage(null)}
          onUpdatePage={(updated) => setSelectedChurchPage(updated)}
        />
      )}

    </div>
  );
};
