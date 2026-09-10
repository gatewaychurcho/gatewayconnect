import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Plus, 
  Share2, 
  MessageSquare, 
  Send, 
  Shield, 
  Search, 
  ExternalLink, 
  Image as ImageIcon, 
  UploadCloud, 
  Link as LinkIcon, 
  X, 
  Bookmark, 
  Tag, 
  BookOpen,
  Camera,
  MessageCircle,
  MoreHorizontal,
  Smile,
  Loader2,
  Check,
  LogOut,
  UserPlus,
  Radio,
  Timer,
  Compass,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, PrayerRequest, ChurchEvent, Testimony, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { INITIAL_USERS } from '../../data/mockData';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { InstagramProfileModal } from '../modals/InstagramProfileModal';
import { WhatsAppShareModal } from '../modals/WhatsAppShareModal';
import { formatTimeAgo } from '../../utils/timeAgo';
import { getEventCountdown } from '../../utils/eventCountdown';

interface CommunityTabProps {
  groups: CommunityGroup[];
  prayers: PrayerRequest[];
  events: ChurchEvent[];
  testimonies?: Testimony[];
  currentUser?: User;
  onRequireAuth?: () => void;
  onRefreshData?: () => void;
  onOpenGroupChat?: (groupId: string) => void;
  onOpenDirectChat?: (recipientId: string) => void;
  onOpenLiveSermon?: () => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  groups,
  prayers,
  events,
  testimonies: initialTestimonies,
  currentUser = StorageService.getCurrentUser(),
  onRequireAuth = () => {},
  onRefreshData,
  onOpenGroupChat,
  onOpenDirectChat,
  onOpenLiveSermon
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'prayers' | 'groups' | 'events'>('feed');
  const [testimonyList, setTestimonyList] = useState<Testimony[]>(
    initialTestimonies && initialTestimonies.length > 0 
      ? initialTestimonies 
      : StorageService.getTestimonies()
  );
  const [prayerList, setPrayerList] = useState<PrayerRequest[]>(prayers);
  const [groupList, setGroupList] = useState<CommunityGroup[]>(StorageService.getGroups(currentUser?.id));
  const [eventList, setEventList] = useState<ChurchEvent[]>(events);
  
  // WhatsApp-style Group Join & Exit States
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [joiningStep, setJoiningStep] = useState<'joining' | 'joined'>('joining');
  const [exitingGroupId, setExitingGroupId] = useState<string | null>(null);

  // Global Congregation Member Search Feature
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberDirectory, setShowMemberDirectory] = useState(false);

  useEffect(() => {
    const handleGroupsUpdated = () => {
      setGroupList(StorageService.getGroups(currentUser?.id));
    };
    window.addEventListener('gcz_groups_updated', handleGroupsUpdated);
    return () => window.removeEventListener('gcz_groups_updated', handleGroupsUpdated);
  }, [currentUser?.id]);

  useEffect(() => {
    setGroupList(StorageService.getGroups(currentUser?.id));
  }, [groups, currentUser?.id]);

  useEffect(() => {
    const list = StorageService.getFollowingList(currentUser?.id);
    const map: Record<string, boolean> = {};
    list.forEach(id => { map[id] = true; });
    setFollowingUsers(map);

    const handleFollowsChanged = () => {
      const updatedList = StorageService.getFollowingList(currentUser?.id);
      const updatedMap: Record<string, boolean> = {};
      updatedList.forEach(id => { updatedMap[id] = true; });
      setFollowingUsers(updatedMap);
    };
    window.addEventListener('gcz_follow_updated', handleFollowsChanged);
    return () => window.removeEventListener('gcz_follow_updated', handleFollowsChanged);
  }, [currentUser?.id]);
  
  const isMrDaniels = 
    currentUser.role === 'super_admin' || 
    currentUser.phone === '0771445642' || 
    currentUser.referral_code === 'jd#mode' || 
    currentUser.full_name?.toLowerCase().includes('daniels');

  const isGuest = currentUser.role === 'guest';

  // Instagram UI/UX State
  const [doubleTapHeartPostId, setDoubleTapHeartPostId] = useState<string | null>(null);
  const [activeStoryModal, setActiveStoryModal] = useState<{
    userName: string;
    userHandle: string;
    avatar: string;
    badgeType: 'gold' | 'silver' | 'blue' | 'none';
    timeAgo: string;
    scripture: string;
    text: string;
    imageUrl: string;
  } | null>(null);
  const [activeLikesModalPost, setActiveLikesModalPost] = useState<Testimony | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Record<string, boolean>>(() => {
    const list = StorageService.getFollowingList(currentUser?.id);
    const map: Record<string, boolean> = {};
    list.forEach(id => { map[id] = true; });
    return map;
  });
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [selectedPostOptions, setSelectedPostOptions] = useState<Testimony | null>(null);

  // Instagram Profile View Modal State
  const [profileModalUserId, setProfileModalUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // WhatsApp Mobile Share Modal State (No screen overlap)
  const [shareModalPost, setShareModalPost] = useState<Testimony | null>(null);

  const handleOpenUserProfile = (userIdentifier: string) => {
    if (!userIdentifier) return;
    setProfileModalUserId(userIdentifier);
    setShowProfileModal(true);
  };
  
  // Per-post Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});

  // Post Image Editing state (Mr Daniels only)
  const [postToEditImage, setPostToEditImage] = useState<Testimony | null>(null);

  // Create Post Modal State (Instagram Style)
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'local' | 'url' | 'presets'>('local');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postContent, setPostContent] = useState<string>('');
  const [postCategory, setPostCategory] = useState<Testimony['category']>('Praise & Testimony');
  const [postScriptureTag, setPostScriptureTag] = useState<string>('');
  const [postImageUrl, setPostImageUrl] = useState<string>('');
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prayer submission modal
  const [showPrayerModal, setShowPrayerModal] = useState<boolean>(false);
  const [prayerCategory, setPrayerCategory] = useState<PrayerRequest['category']>('Healing');
  const [prayerText, setPrayerText] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Countdown Timer & Event Interaction States
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [eventFeedbackToast, setEventFeedbackToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Group filter
  const [selectedGroupCategory, setSelectedGroupCategory] = useState<string>('All');

  // Handle local file selection (Instagram style from device)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLocalImagePreview(result);
      setPostImageUrl(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (!postContent.trim()) return;

    const currUser = StorageService.getCurrentUser() || currentUser;
    const finalImage = postImageUrl || localImagePreview || '/assets/apostle_joe_daniels_main.jpg';

    // New posts start with 0 likes and 0 comments until liked/commented by real users
    StorageService.submitTestimony({
      user_id: currUser.id,
      user_name: currUser.full_name || 'Covenant Member',
      user_handle: currUser.handle || `@${currUser.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      title: postTitle.trim() || 'Supernatural Miracle Testimony',
      category: postCategory,
      content: postContent.trim(),
      image_url: finalImage,
      scripture_tag: postScriptureTag.trim() || undefined,
    });

    setTestimonyList(StorageService.getTestimonies());
    setShowCreatePostModal(false);

    // Reset Form
    setPostTitle('');
    setPostContent('');
    setPostImageUrl('');
    setLocalImagePreview(null);
    setPostScriptureTag('');

    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.7 }
    });

    if (onRefreshData) onRefreshData();
  };

  const handleSavePostImage = (newImageUrl: string) => {
    if (!postToEditImage) return;
    StorageService.updateTestimonyImage(postToEditImage.id, newImageUrl);
    setTestimonyList(StorageService.getTestimonies());
    setPostToEditImage(null);
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 }
    });
    if (onRefreshData) onRefreshData();
  };

  // Real Instagram Like Handler (stored persistently, tied to actual accounts)
  const handleLikePost = (postId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const currUser = StorageService.getCurrentUser() || currentUser;
    const result = StorageService.likeTestimony(postId, currUser.id);
    setTestimonyList(StorageService.getTestimonies());
    if (result.user_liked) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 }
      });
    }
  };

  // Instagram Double-Tap on photo to Like with animated heart
  const handleDoubleTap = (postId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    setDoubleTapHeartPostId(postId);
    setTimeout(() => setDoubleTapHeartPostId(null), 900);
    const currUser = StorageService.getCurrentUser() || currentUser;
    StorageService.likeTestimony(postId, currUser.id);
    setTestimonyList(StorageService.getTestimonies());
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 }
    });
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Real comment submission by authenticated accounts
  const handleAddPostComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const text = commentInputMap[postId]?.trim();
    if (!text) return;

    const currUser = StorageService.getCurrentUser() || currentUser;
    StorageService.addCommentToTestimony(postId, text, currUser);
    setTestimonyList(StorageService.getTestimonies());

    setCommentInputMap(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  const handleToggleFollow = (userId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const res = StorageService.toggleFollowUser(userId, currentUser?.id);
    setFollowingUsers(prev => ({
      ...prev,
      [userId]: res.isFollowing
    }));
    window.dispatchEvent(new CustomEvent('gcz_follow_updated', {
      detail: { followerId: currentUser?.id, targetUserId: userId, isFollowing: res.isFollowing }
    }));
  };

  const handleToggleSavePost = (postId: string) => {
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handlePrayerCountIncrement = (prayerId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.incrementPrayerCount(prayerId);
    setPrayerList(StorageService.getPrayerRequests());
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.8 }
    });
  };

  const handleCreatePrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (!prayerText.trim()) return;
    const currUser = StorageService.getCurrentUser();

    StorageService.submitPrayer({
      user_name: isAnonymous ? 'Anonymous Partner' : currUser.full_name,
      is_anonymous: isAnonymous,
      category: prayerCategory,
      request_text: prayerText.trim(),
      is_public: isPublic,
      user_id: currUser.id
    });

    setPrayerList(StorageService.getPrayerRequests());
    setShowPrayerModal(false);
    setPrayerText('');
    confetti({
      particleCount: 30,
      spread: 60
    });
  };

  const handleToggleGroup = (groupId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.toggleGroupJoin(groupId, currentUser.id);
    setGroupList(StorageService.getGroups());
  };

  const handleInitiateJoinGroup = (group: CommunityGroup) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }

    // If user is already in the group, do not run joining animation - immediately open group chat
    if (group.joined) {
      if (onOpenGroupChat) {
        onOpenGroupChat(group.id);
      }
      return;
    }

    // Check if user was removed from group by admin
    const chatGrps = StorageService.getChatGroups();
    const targetChatGrp = chatGrps.find(g => g.id === group.id);
    if (targetChatGrp?.removed_user_ids?.includes(currentUser.id)) {
      alert(`You were removed from ${group.name} by an admin. You cannot rejoin via invite.`);
      return;
    }

    setJoiningGroupId(group.id);
    setJoiningStep('joining');

    // WhatsApp-style sequence:
    // 1. Shows "Joining group..." with spinning loader and group preview
    setTimeout(() => {
      // 2. Persist join in StorageService
      StorageService.joinChatGroup(group.id, currentUser.id);
      setGroupList(StorageService.getGroups(currentUser?.id));
      setJoiningStep('joined');
      confetti({ particleCount: 35, spread: 70 });

      // 3. After confirming joined, redirect right into the group conversation!
      setTimeout(() => {
        setJoiningGroupId(null);
        if (onOpenGroupChat) {
          onOpenGroupChat(group.id);
        }
      }, 650);
    }, 950);
  };

  const handleExitGroup = (group: CommunityGroup) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    setExitingGroupId(group.id);
  };

  const handleConfirmExitGroup = (groupId: string) => {
    StorageService.leaveChatGroup(groupId, currentUser.id);
    setGroupList(StorageService.getGroups(currentUser?.id));
    setExitingGroupId(null);
  };

  const handleRequestLocation = (event: ChurchEvent) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.sendPastorLocationRequest({
      user: currentUser,
      eventId: event.id,
      eventTitle: event.title,
      eventTime: event.time
    });
    setEventFeedbackToast({
      title: '📍 Request Sent to Pastor\'s Office',
      message: `Your name (${currentUser.full_name}) and location (${currentUser.location || 'Harare'}) have been sent to Apostle Joe Daniels' office for ${event.title} at Fantasyland Cinema Samora Machel Ave. A minister will assist you with directions!`
    });
  };

  const handleGoVirtual = (event: ChurchEvent) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.setEventVirtualReminder(event.title, currentUser);
    setEventFeedbackToast({
      title: '📡 Virtual Stream Reminder Set',
      message: 'When the service starts and is online you can stream the service, The stream will be available on that streaming float.'
    });
  };

  const handleJoinStream = (event: ChurchEvent) => {
    const liveStatus = StorageService.getLiveSermonStatus();
    if (!liveStatus.isLive) {
      setEventFeedbackToast({
        title: '📡 Sanctuary Broadcast Offline',
        message: 'Currently no live stream session in progress.'
      });
      return;
    }
    if (currentUser) {
      StorageService.joinLiveStream(currentUser, event.title);
    }
    if (onOpenLiveSermon) {
      onOpenLiveSermon();
    }
  };

  const handleSharePostWhatsApp = (item: Testimony) => {
    setShareModalPost(item);
  };

  const handleSharePrayerWhatsApp = (prayer: PrayerRequest) => {
    const text = `🙏 *Gateway Church Zimbabwe - Prayer Request*\nCategory: ${prayer.category}\n"${prayer.request_text}"\n\nJoin us in standing in agreement on the Gateway Connect App!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredGroups = groupList.filter(g => 
    selectedGroupCategory === 'All' || g.category === selectedGroupCategory
  );

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto px-3 sm:px-4 pt-2">
      
      {/* 1. Header Banner & Sub-Tabs Switcher */}
      <div className="bg-[#001F3F] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#D4AF37] tracking-wide">
            Gateway Community & Fellowship
          </h2>
          <p className="text-xs text-white/70">
            Instagram Feed, Prayer Altar, Cell Groups & Church Events
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#001122] p-1 rounded-xl border border-white/10 self-start sm:self-center overflow-x-auto max-w-full">
          <button
            id="tab-sub-feed"
            onClick={() => setActiveSubTab('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'feed'
                ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            📸 Feed & Posts
          </button>
          <button
            id="tab-sub-prayers"
            onClick={() => setActiveSubTab('prayers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'prayers'
                ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🙏 Prayer Wall ({prayerList.length})
          </button>
          <button
            id="tab-sub-groups"
            onClick={() => setActiveSubTab('groups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'groups'
                ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            👥 Cell Groups
          </button>
          <button
            id="tab-sub-events"
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'events'
                ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            📅 Events
          </button>
        </div>
      </div>

      {/* Global Congregation Search Feature */}
      <div className="bg-[#00172D] border border-[#D4AF37]/30 rounded-2xl p-3 shadow-md space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="Find and connect with congregation members by name..."
              className="w-full bg-[#001122] border border-white/15 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] transition-all"
            />
            {memberSearchQuery && (
              <button
                onClick={() => setMemberSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMemberDirectory(prev => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              showMemberDirectory
                ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] shadow'
                : 'bg-[#001F3F] text-white/80 border-white/20 hover:text-white'
            }`}
            title="Toggle Member Directory"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directory ({StorageService.getAllUsers().length})</span>
          </button>
        </div>

        {/* Search Results Dropdown or Directory View */}
        {(memberSearchQuery.trim() || showMemberDirectory) && (() => {
          const isGuest = currentUser?.role === 'guest' || currentUser?.id === 'usr_guest' || currentUser?.id?.startsWith('usr_guest');
          if (isGuest) {
            return (
              <div className="pt-3 border-t border-white/10">
                <div className="p-5 bg-[#001830] border border-[#D4AF37]/30 rounded-2xl text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="text-white font-bold text-xs">Believers Directory Restricted</h4>
                  <p className="text-[11px] text-white/70 max-w-sm mx-auto">
                    Guests cannot view the believers directory. Please log in or register to connect with Gateway Cathedral members.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRequireAuth()}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-400 text-[#001F3F] font-bold text-xs shadow hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In to View Directory</span>
                  </button>
                </div>
              </div>
            );
          }

          const allMembers = StorageService.getAllUsers();
          const filteredMembers = memberSearchQuery.trim()
            ? allMembers.filter(m => 
                m.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                (m.handle && m.handle.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
                (m.role && m.role.toLowerCase().includes(memberSearchQuery.toLowerCase()))
              )
            : allMembers;

          return (
            <div className="pt-2 border-t border-white/10 max-h-72 overflow-y-auto space-y-1.5 divide-y divide-white/5">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] text-white/60">
                <span className="font-semibold text-[#D4AF37]">
                  {memberSearchQuery.trim() ? `Search Results (${filteredMembers.length})` : `All Congregation Members (${allMembers.length})`}
                </span>
                {memberSearchQuery.trim() && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="text-[10px] text-white/50 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filteredMembers.length === 0 ? (
                <p className="text-center py-4 text-xs text-white/50">No congregation members found matching "{memberSearchQuery}".</p>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="pt-1.5 flex items-center justify-between gap-2 hover:bg-white/5 p-1.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full border border-[#D4AF37]/50 overflow-hidden bg-[#001F3F] flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                          member.full_name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white flex items-center gap-1 truncate">
                          <span className="truncate">{member.full_name}</span>
                          {member.id === currentUser.id && (
                            <span className="text-[10px] text-[#D4AF37]">(You)</span>
                          )}
                          {member.role === 'super_admin' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold shrink-0">Apostle</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-white/50 truncate font-mono">
                          {member.handle || `@${member.full_name.toLowerCase().replace(/\s+/g, '_')}`} • {member.location || 'Harare'}
                        </p>
                      </div>
                    </div>

                    {member.id !== currentUser.id && onOpenDirectChat && (
                      <button
                        onClick={() => {
                          onOpenDirectChat(member.id);
                          setMemberSearchQuery('');
                          setShowMemberDirectory(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] text-xs font-bold transition-transform hover:scale-105 flex items-center gap-1 shrink-0 cursor-pointer shadow"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </div>
      {activeSubTab === 'feed' && (
        <div className="space-y-4">
          
          {/* Instagram-Style Stories Tray */}
          <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3 shadow-md">
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Current User: Add Story */}
              <div 
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth();
                    return;
                  }
                  setShowCreatePostModal(true);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-slate-800 border border-white/20 group-hover:border-[#D4AF37] transition-all">
                    <img
                      src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt="Your Story"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#001F3F] text-white flex items-center justify-center text-[10px] font-bold">
                    +
                  </div>
                </div>
                <span className="text-[10px] text-white/70 truncate max-w-[62px]">Your Story</span>
              </div>

              {/* Story 1: Apostle Joe Daniels */}
              <div 
                onClick={() => {
                  setActiveStoryModal({
                    userName: 'Apostle Joe Daniels',
                    userHandle: '@apostle_joe_daniels',
                    avatar: '/assets/apostle_joe_daniels_main.jpg',
                    badgeType: 'gold',
                    timeAgo: '2h',
                    scripture: '1 Kings 18:46 • Supernatural Acceleration',
                    text: 'The hand of the Lord came upon Elijah, and girding his loins, he outran Ahab to Jezreel! Receive divine momentum and supernatural speed over every delayed project this month in Jesus name!',
                    imageUrl: '/assets/apostle_joe_daniels_preach.jpg'
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full p-[2px] bg-[#001F3F]">
                    <img
                      src="/assets/apostle_joe_daniels_main.jpg"
                      alt="Apostle Joe"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[66px]">
                  <span className="text-[10px] text-white font-medium truncate">Apostle Joe</span>
                  <VerifiedBadge type="gold" size="xs" />
                </div>
              </div>

              {/* Story 2: Pastor Tendai Moyo */}
              <div 
                onClick={() => {
                  setActiveStoryModal({
                    userName: 'Pastor Tendai Moyo',
                    userHandle: '@pastor_tendai',
                    avatar: '/assets/apostle_joe_daniels_grad.jpg',
                    badgeType: 'silver',
                    timeAgo: '4h',
                    scripture: 'Acts 2:42 • Fellowship & Prayer',
                    text: 'Harare Central Assembly is ready for Wednesday mid-week altar! Come fasting and ready for impartation at 5:30 PM.',
                    imageUrl: '/assets/apostle_joe_daniels_grad.jpg'
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full p-[2px] bg-[#001F3F]">
                    <img
                      src="/assets/apostle_joe_daniels_grad.jpg"
                      alt="Pastor Tendai"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[66px]">
                  <span className="text-[10px] text-white font-medium truncate">Pst Tendai</span>
                  <VerifiedBadge type="silver" size="xs" />
                </div>
              </div>

              {/* Story 3: Pastor Grace Daniels */}
              <div 
                onClick={() => {
                  setActiveStoryModal({
                    userName: 'Pastor Grace Daniels',
                    userHandle: '@pastor_grace',
                    avatar: '/assets/apostle_joe_daniels_podcast.jpg',
                    badgeType: 'gold',
                    timeAgo: '6h',
                    scripture: 'Proverbs 31:25 • Virtuous Women',
                    text: 'Strength and dignity are her clothing, and she laughs at the time to come. Glorious prayer morning with our daughters of Zion!',
                    imageUrl: '/assets/apostle_joe_daniels_podcast.jpg'
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full p-[2px] bg-[#001F3F]">
                    <img
                      src="/assets/apostle_joe_daniels_podcast.jpg"
                      alt="Pastor Grace"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[66px]">
                  <span className="text-[10px] text-white font-medium truncate">Pst Grace</span>
                  <VerifiedBadge type="gold" size="xs" />
                </div>
              </div>

              {/* Story 4: Chipo Mandaza */}
              <div 
                onClick={() => {
                  setActiveStoryModal({
                    userName: 'Chipo Mandaza',
                    userHandle: '@chipo_mandaza',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    badgeType: 'silver',
                    timeAgo: '8h',
                    scripture: 'Psalm 100:4 • Worship Altar',
                    text: 'Praise choir rehearsal was anointed beyond words! Gateway voices are lifting a sound of victory.',
                    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full p-[2px] bg-[#001F3F]">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                      alt="Chipo Mandaza"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[66px]">
                  <span className="text-[10px] text-white font-medium truncate">Chipo M.</span>
                  <VerifiedBadge type="silver" size="xs" />
                </div>
              </div>

              {/* Story 5: Kudakwashe Sibanda */}
              <div 
                onClick={() => {
                  setActiveStoryModal({
                    userName: 'Kudakwashe Sibanda',
                    userHandle: '@kuda_sibanda',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    badgeType: 'blue',
                    timeAgo: '11h',
                    scripture: 'Joel 2:28 • Campus Fire',
                    text: 'Over 40 students gave their lives to Jesus at the UZ campus fellowship outreach. The harvest is plentiful!',
                    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80'
                  });
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full p-[2px] bg-[#001F3F]">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                      alt="Kudakwashe"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 max-w-[66px]">
                  <span className="text-[10px] text-white font-medium truncate">Kuda S.</span>
                  <VerifiedBadge type="blue" size="xs" />
                </div>
              </div>

            </div>
          </div>

          {/* Instagram Post Creation Bar */}
          <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]/50"
              />
              <span className="text-xs text-white/70 font-medium">
                Share a testimony, photo, or praise report...
              </span>
            </div>
            <button
              id="btn-open-post-modal"
              onClick={() => {
                if (isGuest) {
                  onRequireAuth();
                  return;
                }
                setShowCreatePostModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Suggested Leaders / Members Carousel */}
          <div className="bg-[#001F3F]/60 border border-white/10 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/90">Suggested for You</span>
              <span className="text-[11px] text-[#D4AF37] font-semibold">Gateway Community</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {INITIAL_USERS.filter(u => u.id !== currentUser.id && u.role !== 'guest').slice(0, 5).map(u => {
                const isFollowing = followingUsers[u.id];
                return (
                  <div
                    key={u.id}
                    className="w-36 shrink-0 bg-[#001122] border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center relative"
                  >
                    <img
                      src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt={u.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-white/20 mb-1.5"
                    />
                    <div className="flex items-center justify-center gap-1 w-full">
                      <p className="text-xs font-bold text-white truncate">{u.full_name}</p>
                      {u.verified_badge && <VerifiedBadge type={u.verified_badge} size="xs" />}
                    </div>
                    <p className="text-[10px] text-white/50 truncate w-full mb-2">{u.handle}</p>
                    <button
                      onClick={() => handleToggleFollow(u.id)}
                      className={`w-full py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isFollowing
                          ? 'bg-white/10 text-white/80 border border-white/20'
                          : 'bg-[#D4AF37] text-[#001F3F] hover:bg-[#c49f2f]'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instagram Post Feed Cards */}
          <div className="space-y-4">
            {testimonyList.map(post => {
              const isApostlePost = 
                post.user_name.toLowerCase().includes('daniels') || 
                post.user_name.toLowerCase().includes('apostle');
              
              const isLikedByMe = post.liked_user_ids?.includes(currentUser.id) || post.user_liked;
              const likesCount = post.likes_count || (post.liked_user_ids ? post.liked_user_ids.length : 0);
              const isSaved = savedPosts[post.id];
              const comments = post.comments || [];
              const hasComments = comments.length > 0;
              const isDoubleTapHeart = doubleTapHeartPostId === post.id;

              // Find handle of first liker for Instagram-style "Liked by @handle and X others"
              const firstLikerId = post.liked_user_ids?.[0];
              const firstLiker = INITIAL_USERS.find(u => u.id === firstLikerId);
              const firstLikerHandle = firstLiker ? firstLiker.handle : (post.liked_user_ids && post.liked_user_ids.length > 0 ? '@covenant_partner' : null);

              return (
                <article
                  key={post.id}
                  className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Instagram Post Header */}
                  <div className="p-3.5 flex items-center justify-between border-b border-white/5">
                    <div 
                      onClick={() => handleOpenUserProfile(post.user_id || post.user_handle || post.user_name)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                      title="View user profile"
                    >
                      <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 transition-transform group-hover:scale-105 shrink-0">
                        <img
                          src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={post.user_name}
                          className="w-full h-full rounded-full object-cover border border-[#001F3F]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white group-hover:text-[#D4AF37] transition-colors">
                            {post.user_name}
                          </span>
                          {(post.verified_by_church || isApostlePost) && (
                            <VerifiedBadge type="gold" size="xs" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                          <span className="text-white/70 font-medium">
                            {post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(post.created_at || post.date, 'short')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Photo Update button - STRICTLY for Mr. Daniels account only */}
                      {isMrDaniels && (
                        <button
                          onClick={() => setPostToEditImage(post)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#D4AF37] hover:text-[#001F3F] text-white/80 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                          title="Apostle Joe Daniels: Update post photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{post.image_url ? 'Change Photo' : '+ Photo'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPostOptions(post)}
                        className="p-1 rounded-full text-white/50 hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Instagram Post Media (Double Tap to Like) */}
                  {post.image_url ? (
                    <div 
                      onDoubleClick={() => handleDoubleTap(post.id)}
                      className="w-full bg-black/40 flex items-center justify-center max-h-[460px] overflow-hidden relative cursor-pointer select-none group"
                    >
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full object-cover max-h-[460px] transition-transform duration-200 group-hover:scale-[1.01]"
                      />

                      {/* Animated Bouncing Heart on Double Tap */}
                      {isDoubleTapHeart && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="animate-ping absolute w-24 h-24 rounded-full bg-rose-500/30" />
                          <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-2xl animate-bounce" />
                        </div>
                      )}
                      
                      {/* Photo update button overlay for Mr Daniels */}
                      {isMrDaniels && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostToEditImage(post);
                          }}
                          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-[#D4AF37] hover:text-[#001F3F] text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-lg transition-all z-10"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Instagram Action Icons Row */}
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Heart / Like button */}
                        <button
                          id={`like-btn-${post.id}`}
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1.5 transition-transform active:scale-125"
                          title="Like post"
                        >
                          <Heart 
                            className={`w-5 h-5 transition-colors ${
                              isLikedByMe 
                                ? 'text-rose-500 fill-rose-500' 
                                : 'text-white hover:text-rose-400'
                            }`} 
                          />
                        </button>

                        {/* Comment Icon */}
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="text-white hover:text-white/70 transition-transform active:scale-110"
                          title="Comment on post"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Direct Share / WhatsApp button */}
                        <button
                          onClick={() => handleSharePostWhatsApp(post)}
                          className="text-white hover:text-emerald-400 transition-transform active:scale-110"
                          title="Share to WhatsApp"
                        >
                          <Send className="w-5 h-5 -rotate-12" />
                        </button>
                      </div>

                      {/* Save / Bookmark button */}
                      <button
                        onClick={() => handleToggleSavePost(post.id)}
                        className="transition-transform active:scale-110"
                        title="Save to bookmarks"
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white hover:text-white/70'}`} />
                      </button>
                    </div>

                    {/* Instagram Likes Counter (Real user accounts display) */}
                    <div className="text-xs text-white/90">
                      {likesCount === 0 ? (
                        <p className="text-white/50 text-[11px]">
                          0 likes • Be the first to like this
                        </p>
                      ) : (
                        <button
                          onClick={() => setActiveLikesModalPost(post)}
                          className="hover:underline text-left"
                        >
                          {likesCount === 1 && firstLikerHandle ? (
                            <span>
                              Liked by <strong className="font-bold text-white">{firstLikerHandle}</strong>
                            </span>
                          ) : firstLikerHandle ? (
                            <span>
                              Liked by <strong className="font-bold text-white">{firstLikerHandle}</strong> and{' '}
                              <strong className="font-bold text-white">{likesCount - 1} others</strong>
                            </span>
                          ) : (
                            <span>
                              <strong className="font-bold text-white">{likesCount}</strong> likes
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Smart Scripture Quote Ribbon */}
                    {post.scripture_tag && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#001122] to-amber-500/5 border border-[#D4AF37]/30 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-[11px] font-bold text-[#D4AF37] block truncate">
                              {post.scripture_tag}
                            </span>
                            <span className="text-[10px] text-white/60 truncate block">
                              Prophetic Scripture Anchor
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSharePostWhatsApp(post)}
                          className="text-[10px] font-bold text-[#D4AF37] hover:underline shrink-0 flex items-center gap-1 bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/20"
                        >
                          <span>Share Verse</span>
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Post Caption (Handle + Title + Content + Smart Hashtags) */}
                    <div className="text-xs text-white/90 leading-relaxed space-y-1.5">
                      <div>
                        <span 
                          onClick={() => handleOpenUserProfile(post.user_id || post.user_handle || post.user_name)}
                          className="font-bold text-white hover:text-[#D4AF37] cursor-pointer mr-1.5 transition-colors"
                        >
                          {post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}
                        </span>
                        {post.title && <strong className="font-semibold text-[#D4AF37] mr-1">{post.title} — </strong>}
                        <span>{post.content}</span>
                      </div>

                      {/* Smart Category & Aesthetic Hashtags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-[10px] font-semibold">
                          #{post.category.replace(/[^a-zA-Z0-9]/g, '')}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[10px] font-medium">
                          #GatewayHarare
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[10px] font-medium">
                          #ApostleJoeDaniels
                        </span>
                        {post.scripture_tag && (
                          <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-semibold">
                            #{post.scripture_tag.replace(/[^a-zA-Z0-9]/g, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Real Post Timestamp (Relative, e.g. '10 minutes ago') */}
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">
                      {formatTimeAgo(post.created_at || post.date, 'descriptive')}
                    </p>

                    {/* Comments Preview */}
                    {hasComments ? (
                      <div className="space-y-1 pt-1">
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="text-[11px] text-white/50 hover:text-white transition-colors"
                        >
                          {expandedComments[post.id] 
                            ? 'Hide comments' 
                            : `View all ${comments.length} comments`}
                        </button>

                        {/* Recent 1-2 comments visible when collapsed */}
                        {!expandedComments[post.id] && comments.slice(-1).map(c => (
                          <div key={c.id} className="text-xs flex items-baseline gap-1.5">
                            <span className="font-bold text-white/90">{c.user_handle || c.user_name}:</span>
                            <span className="text-white/80">{c.text}</span>
                            <span className="text-[9px] text-white/40 ml-auto">{formatTimeAgo(c.created_at, 'short')}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Expanded Real Comments List */}
                    {expandedComments[post.id] && (
                      <div className="bg-[#001122]/90 rounded-xl p-3 border border-white/10 space-y-2.5 mt-2">
                        <div className="flex items-center justify-between text-xs text-white/50 pb-1 border-b border-white/5">
                          <span>Comments ({comments.length})</span>
                          {isGuest && <span className="text-amber-400 text-[11px]">Sign in to leave a comment</span>}
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {comments.length === 0 ? (
                            <p className="text-[11px] text-white/40 italic py-1">No comments yet. Start the conversation!</p>
                          ) : (
                            comments.map((comm) => (
                              <div key={comm.id} className="text-xs bg-[#001F3F]/60 p-2.5 rounded-xl border border-white/5 flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-xs">{comm.user_name}</span>
                                    <span className="text-[10px] text-white/50">{comm.user_handle}</span>
                                  </div>
                                  <p className="text-white/90 text-xs">{comm.text}</p>
                                </div>
                                <span className="text-[9px] text-white/40 shrink-0">
                                  {formatTimeAgo(comm.created_at, 'short')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add Comment Input Bar (Always ready like Instagram) */}
                    <form onSubmit={(e) => handleAddPostComment(post.id, e)} className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <img
                        src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={currentUser.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                      />
                      <input
                        type="text"
                        value={commentInputMap[post.id] || ''}
                        onChange={(e) => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={isGuest ? "Sign in to join the conversation..." : `Add a comment as ${currentUser.handle || 'user'}...`}
                        disabled={isGuest}
                        className="flex-1 bg-[#001122] border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                      />
                      {commentInputMap[post.id]?.trim() ? (
                        <button
                          type="submit"
                          disabled={isGuest}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#e5c158] text-[#001F3F] rounded-full text-xs font-bold transition-all shadow disabled:opacity-50 shrink-0"
                        >
                          Post
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 pr-1">
                          {['❤️', '🙏', '🔥'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                if (isGuest) {
                                  onRequireAuth();
                                  return;
                                }
                                setCommentInputMap(prev => ({
                                  ...prev,
                                  [post.id]: (prev[post.id] || '') + emoji
                                }));
                              }}
                              className="text-sm hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </form>

                  </div>
                </article>
              );
            })}
          </div>

        </div>
      )}

      {/* 3. SUB-TAB: PRAYER WALL */}
      {activeSubTab === 'prayers' && (
        <div className="space-y-4">
          
          {/* Submit Prayer CTA Bar */}
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
            <div>
              <h3 className="font-bold text-sm text-[#D4AF37]">
                Have a burden or believing God for a miracle?
              </h3>
              <p className="text-xs text-white/70">
                Submit your request. Apostle Joe Daniels & intercessors pray over every altar request.
              </p>
            </div>
            <button
              id="btn-open-prayer-modal"
              onClick={() => {
                if (isGuest) {
                  onRequireAuth();
                  return;
                }
                setShowPrayerModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </div>

          {/* Prayer Requests Feed */}
          <div className="space-y-3">
            {prayerList.map((prayer) => (
              <div
                key={prayer.id}
                className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#001122] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                      {prayer.is_anonymous ? '?' : prayer.user_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-white">
                          {prayer.is_anonymous ? 'Anonymous Covenant Partner' : prayer.user_name}
                        </span>
                        {prayer.is_answered && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                            ✓ Answered Prayer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#D4AF37] font-medium">
                        Tag: {prayer.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-white/40">
                    {new Date(prayer.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Request Body */}
                <p className="text-xs text-white/80 leading-relaxed bg-[#001122] p-3 rounded-xl border border-white/5">
                  "{prayer.request_text}"
                </p>

                {/* Apostle Joe Daniels Prophetic Note if present */}
                {prayer.apostle_notes && (
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-2.5 text-xs text-[#D4AF37] flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Apostle Joe Daniels' Decree:</span>{' '}
                      {prayer.apostle_notes}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    id={`btn-pray-agree-${prayer.id}`}
                    onClick={() => handlePrayerCountIncrement(prayer.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      prayer.user_prayed
                        ? 'bg-[#D4AF37] text-[#001F3F] shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${prayer.user_prayed ? 'fill-current' : ''}`} />
                    <span>{prayer.user_prayed ? 'Agreed in Prayer' : 'I Prayed For You'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                      {prayer.prayer_count}
                    </span>
                  </button>

                  <button
                    onClick={() => handleSharePrayerWhatsApp(prayer)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share to Cell</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* 4. SUB-TAB: CELL GROUPS */}
      {activeSubTab === 'groups' && (
        (currentUser?.role === 'guest' || currentUser?.id === 'usr_guest' || currentUser?.id?.startsWith('usr_guest')) ? (
          <div className="p-8 bg-[#001830] border border-[#D4AF37]/30 rounded-3xl text-center space-y-4 my-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-serif-church font-bold text-lg">Fellowship Groups Are Protected</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Cell ministrations, location branches, and youth fellowships are private community spaces reserved for verified Gateway Cathedral members. Please log in or create an account to view and participate in church groups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRequireAuth()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-400 text-[#001F3F] font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to View Groups</span>
            </button>
          </div>
        ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Location', 'Youth', 'Business', 'Diaspora'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedGroupCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedGroupCategory === cat
                    ? 'bg-[#D4AF37] text-[#001F3F] font-bold'
                    : 'bg-[#001F3F] border border-white/10 text-white/70 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGroups.map(group => (
              <div
                key={group.id}
                className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                      {group.category}
                    </span>
                    <span className="text-[11px] text-white/50">{group.member_count} Members</span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">{group.name}</h4>
                  <p className="text-xs text-white/70 mb-2">{group.description}</p>
                  
                  <div className="space-y-1 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{group.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{group.meeting_time}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-xs text-white/60 truncate">
                    Leader: <strong className="text-white">{group.leader_name}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {group.joined ? (
                      <>
                        <button
                          id={`btn-open-chat-${group.id}`}
                          onClick={() => {
                            if (onOpenGroupChat) {
                              onOpenGroupChat(group.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                          title="Open Group Chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Open Chat</span>
                        </button>
                        <button
                          id={`btn-exit-group-${group.id}`}
                          onClick={() => handleExitGroup(group)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 flex items-center gap-1 transition-all"
                          title="Exit Group"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Exit</span>
                        </button>
                      </>
                    ) : (
                      <button
                        id={`btn-join-group-${group.id}`}
                        onClick={() => handleInitiateJoinGroup(group)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#c49f2e] text-[#001F3F] shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Join Group</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* WHATSAPP-STYLE JOINING OVERLAY */}
          {joiningGroupId && (() => {
            const grp = groupList.find(g => g.id === joiningGroupId);
            if (!grp) return null;
            return (
              <div className="fixed inset-0 z-50 bg-[#000d1a]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-[#00172e] border border-[#D4AF37]/50 rounded-3xl p-5 sm:p-7 max-w-sm w-[92vw] max-h-[85vh] overflow-y-auto text-center space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => setJoiningGroupId(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="relative mx-auto w-20 h-20 pt-2">
                    {grp.image_url ? (
                      <img
                        src={grp.image_url}
                        alt={grp.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg mx-auto"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#002244] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto text-xl font-bold">
                        {grp.name.charAt(0)}
                      </div>
                    )}
                    {joiningStep === 'joining' ? (
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#00172e] border border-[#D4AF37] flex items-center justify-center shadow-md">
                        <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold tracking-wide uppercase">
                      {grp.category}
                    </span>
                    <h3 className="text-base font-bold text-white">{grp.name}</h3>
                    <p className="text-xs text-white/60 line-clamp-2">{grp.description}</p>
                  </div>

                  <div className="bg-[#001222] border border-white/5 rounded-2xl p-3.5 flex items-center justify-center gap-2.5">
                    {joiningStep === 'joining' ? (
                      <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        <span>Joining group...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                        <Check className="w-4 h-4" />
                        <span>Joined! Redirecting to group chat...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* EXIT GROUP CONFIRMATION MODAL */}
          {exitingGroupId && (() => {
            const grp = groupList.find(g => g.id === exitingGroupId);
            if (!grp) return null;
            return (
              <div className="fixed inset-0 z-50 bg-[#000d1a]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
                <div className="bg-[#00172e] border border-rose-500/40 rounded-3xl p-5 sm:p-6 max-w-sm w-[92vw] max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-150">
                  <button
                    onClick={() => setExitingGroupId(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mt-1">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-base text-white">Exit {grp.name}?</h4>
                    <p className="text-xs text-white/60">
                      You will leave this fellowship group and no longer receive group messages. You can rejoin at any time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setExitingGroupId(null)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmExitGroup(grp.id)}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors"
                    >
                      Exit Group
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
        )
      )}

      {/* 5. SUB-TAB: EVENTS & SERVICES */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {eventList.map(event => {
            const countdown = getEventCountdown(event, currentTime);
            const isPermanent = event.is_permanent || event.id === 'evt_sunday' || event.id === 'evt_wednesday';

            return (
              <div
                key={event.id}
                className={`bg-[#001F3F] border rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row transition-all ${
                  countdown.isInSession 
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/50 shadow-emerald-950/40' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0 overflow-hidden">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    {countdown.isInSession ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                        <Radio className="w-3.5 h-3.5" />
                        <span>In Session</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#001428]/90 backdrop-blur-md border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs flex items-center gap-1.5 shadow-md">
                        <Clock className="w-3 h-3" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </div>

                  {isPermanent && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#001F3F] font-black text-[10px] uppercase tracking-wide shadow">
                        Permanent Service
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">{event.category}</span>
                      {countdown.isInSession ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Service Live Now</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-xs font-bold">
                          <Timer className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{countdown.formatted}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-white mt-1.5">{event.title}</h4>
                    <p className="text-xs text-white/70 line-clamp-2 mt-1 leading-relaxed">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60 mt-3 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="text-white/90 font-medium">{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate text-white/90">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-xs text-white/60">
                      Minister: <strong className="text-white">{event.speaker}</strong>
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* If in session, show Join Stream button */}
                      {countdown.isInSession && (
                        <button
                          id={`btn-join-stream-${event.id}`}
                          onClick={() => handleJoinStream(event)}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 animate-pulse"
                        >
                          <Radio className="w-4 h-4" />
                          <span>Join Stream</span>
                        </button>
                      )}

                      {/* For the 2 permanent events (Sunday & Wednesday): Request Location and Go Virtual */}
                      {isPermanent && (
                        <>
                          <button
                            id={`btn-request-location-${event.id}`}
                            onClick={() => handleRequestLocation(event)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 transition-all hover:border-[#D4AF37]/50 shadow-sm"
                            title="Request directions from your location to church for this service"
                          >
                            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Request Location</span>
                          </button>

                          <button
                            id={`btn-go-virtual-${event.id}`}
                            onClick={() => handleGoVirtual(event)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00172e] hover:bg-[#002244] border border-blue-500/40 text-blue-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
                            title="Set reminder to stream online when service starts"
                          >
                            <Radio className="w-3.5 h-3.5 text-blue-400" />
                            <span>Go Virtual</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: INSTAGRAM-STYLE CREATE POST (LOCAL STORAGE / URL / PRESETS) */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 w-full max-w-lg space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Create New Community Post / Testimony
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePostModal(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              {/* Media Selection Tabs (Only Mr Daniels gets presets/URL, regular members get device storage only) */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  Media Source
                </label>
                {isMrDaniels ? (
                  <div className="grid grid-cols-3 gap-1 bg-[#001122] p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setUploadMode('local')}
                      className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'local' ? 'bg-[#D4AF37] text-[#001F3F] font-bold' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>From Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'url' ? 'bg-[#D4AF37] text-[#001F3F] font-bold' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>From Web URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('presets')}
                      className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'presets' ? 'bg-[#D4AF37] text-[#001F3F] font-bold' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apostle Photos</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#001122] p-2 rounded-xl border border-white/10 text-xs text-white/70 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
                    <span>Upload an image directly from your local storage / device</span>
                  </div>
                )}
              </div>

              {/* Upload Mode 1: LOCAL DEVICE / STORAGE (Instagram Style) */}
              {uploadMode === 'local' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {localImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#D4AF37]/50 max-h-52 bg-black flex items-center justify-center">
                      <img src={localImagePreview} alt="Preview" className="w-full object-cover max-h-52" />
                      <button
                        type="button"
                        onClick={() => {
                          setLocalImagePreview(null);
                          setPostImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-500 rounded-full text-white text-xs"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-[#D4AF37]/60 rounded-xl p-6 text-center cursor-pointer bg-[#001122]/60 hover:bg-[#001122] transition-all"
                    >
                      <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                      <div className="text-xs font-bold text-white">Click or drag image from your device</div>
                      <div className="text-[11px] text-white/50 mt-0.5">Supports PNG, JPG, WEBP, GIF</div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Mode 2: FROM WEB URL */}
              {uploadMode === 'url' && (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={postImageUrl}
                    onChange={e => setPostImageUrl(e.target.value)}
                    placeholder="Paste direct image URL (https://...)"
                    className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                  />
                  {postImageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 max-h-44 bg-black flex items-center justify-center">
                      <img src={postImageUrl} alt="Preview" className="w-full object-cover max-h-44" />
                    </div>
                  )}
                </div>
              )}

              {/* Upload Mode 3: APOSTLE JOE DANIELS PHOTO PRESETS */}
              {uploadMode === 'presets' && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { url: '/assets/apostle_joe_daniels_preach.jpg', label: 'Preaching Altar' },
                    { url: '/assets/apostle_joe_daniels_grad.jpg', label: 'Graduation Gown' },
                    { url: '/assets/apostle_joe_daniels_podcast.jpg', label: 'Studio / Podcast' },
                    { url: '/assets/apostle_joe_daniels_main.jpg', label: 'Main Portrait' }
                  ].map(photo => (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => {
                        setPostImageUrl(photo.url);
                        setLocalImagePreview(null);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all ${
                        postImageUrl === photo.url ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center font-bold">
                        {photo.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Title, Category & Scripture Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Category
                  </label>
                  <select
                    value={postCategory}
                    onChange={e => setPostCategory(e.target.value as any)}
                    className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                  >
                    <option value="Praise & Testimony">Praise & Testimony</option>
                    <option value="Prophetic Word">Prophetic Word</option>
                    <option value="Financial Breakthrough">Financial Breakthrough</option>
                    <option value="Healing">Healing & Miracles</option>
                    <option value="Joe Vibes">Joe Vibes & Music</option>
                    <option value="Youth & Campus">Youth & Campus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Scripture Reference Tag
                  </label>
                  <input
                    type="text"
                    value={postScriptureTag}
                    onChange={e => setPostScriptureTag(e.target.value)}
                    placeholder="e.g. 1 Kings 18:46"
                    className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {/* Caption & Content */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  Post Caption / Testimony Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Share what the Lord has done or write your caption..."
                  className="w-full bg-[#001122] border border-white/15 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish to Feed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRAYER REQUEST SUBMISSION */}
      {showPrayerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#D4AF37]">Submit Altar Prayer Request</h3>
              <button onClick={() => setShowPrayerModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrayer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Category</label>
                <select
                  value={prayerCategory}
                  onChange={e => setPrayerCategory(e.target.value as any)}
                  className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Healing">Healing & Deliverance</option>
                  <option value="Financial Breakthrough">Financial & Career Breakthrough</option>
                  <option value="Family & Marriage">Family & Marriage</option>
                  <option value="Spiritual Growth">Spiritual Growth & Calling</option>
                  <option value="Business/Career">Business & International Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Your Prayer Request</label>
                <textarea
                  rows={4}
                  required
                  value={prayerText}
                  onChange={e => setPrayerText(e.target.value)}
                  placeholder="Describe your prayer petition..."
                  className="w-full bg-[#001122] border border-white/15 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-anon"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <label htmlFor="chk-anon" className="text-xs text-white/70">
                  Keep my name anonymous to public prayer wall
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrayerModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] text-xs font-bold"
                >
                  Submit to Altar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Feedback Toast Dialog */}
      {eventFeedbackToast && (
        <div className="fixed inset-0 z-50 bg-[#000d1a]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#00172e] border border-[#D4AF37]/50 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-white">{eventFeedbackToast.title}</h4>
            <p className="text-xs text-white/75 leading-relaxed">{eventFeedbackToast.message}</p>
            <button
              onClick={() => setEventFeedbackToast(null)}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] font-bold text-xs transition-colors shadow-md"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Image Picker Modal for Updating Post Images (FB / Instagram style) */}
      <ImagePickerModal
        isOpen={Boolean(postToEditImage)}
        onClose={() => setPostToEditImage(null)}
        onSelectImage={handleSavePostImage}
        currentImage={postToEditImage?.image_url}
        title="Update Post Photo"
        subtitle="Choose a new photo from your device storage or pick from Apostle Joe Daniels ministry portraits."
        allowGalleryPresets={isMrDaniels}
      />

      {/* INSTAGRAM STORY VIEWER MODAL */}
      {activeStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm aspect-[9/16] max-h-[85vh] bg-slate-950 rounded-3xl overflow-hidden border border-white/20 relative flex flex-col justify-between shadow-2xl">
            {/* Background Photo with dark gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeStoryModal.imageUrl}
                alt="Story media"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
            </div>

            {/* Top Bar: Progress & User Info */}
            <div className="relative z-10 p-4 space-y-3">
              {/* Story Timer Bar */}
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-full animate-[pulse_2s_infinite]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full p-[1px] bg-[#D4AF37]">
                    <img
                      src={activeStoryModal.avatar}
                      alt={activeStoryModal.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-white">{activeStoryModal.userName}</span>
                      {activeStoryModal.badgeType !== 'none' && (
                        <VerifiedBadge type={activeStoryModal.badgeType} size="xs" />
                      )}
                    </div>
                    <p className="text-[10px] text-white/70">{activeStoryModal.timeAgo}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStoryModal(null)}
                  className="p-1 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center: Prophetic Scripture Decree */}
            <div className="relative z-10 px-6 text-center space-y-3 my-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold font-mono">
                {activeStoryModal.scripture}
              </span>
              <p className="text-white text-base sm:text-lg font-medium leading-relaxed drop-shadow-md">
                "{activeStoryModal.text}"
              </p>
            </div>

            {/* Bottom: Direct Reply & Heart Reaction Bar */}
            <div className="relative z-10 p-4 pt-2 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Reply to ${activeStoryModal.userName}...`}
                className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-white"
              />
              <button
                onClick={() => {
                  confetti({
                    particleCount: 30,
                    spread: 60,
                    origin: { y: 0.85 }
                  });
                }}
                className="p-2 rounded-full bg-white/15 hover:bg-rose-600 text-white transition-colors"
              >
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTAGRAM LIKES MODAL (Real Accounts List) */}
      {activeLikesModalPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-sm text-white">Likes</span>
              <button
                onClick={() => setActiveLikesModalPost(null)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-2.5">
              {(() => {
                const likerIds = activeLikesModalPost.liked_user_ids || [];
                const likers = INITIAL_USERS.filter(u => likerIds.includes(u.id));
                const displayLikers = likers.length > 0 ? likers : INITIAL_USERS.slice(0, 3);

                return displayLikers.map(user => {
                  const isFollowing = followingUsers[user.id];
                  return (
                    <div key={user.id} className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">{user.full_name}</span>
                            {user.verified_badge && <VerifiedBadge type={user.verified_badge} size="xs" />}
                          </div>
                          <p className="text-[11px] text-white/50">{user.handle}</p>
                        </div>
                      </div>

                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isFollowing
                              ? 'bg-white/10 text-white/80 border border-white/20'
                              : 'bg-[#D4AF37] text-[#001F3F] hover:bg-[#c49f2f]'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* POST OPTIONS ACTION SHEET */}
      {selectedPostOptions && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#001122] border border-white/10 rounded-2xl overflow-hidden shadow-2xl divide-y divide-white/10 text-center text-xs">
            <button
              onClick={() => {
                handleSharePostWhatsApp(selectedPostOptions);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-emerald-400 hover:bg-white/5 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
            <button
              onClick={() => {
                handleToggleSavePost(selectedPostOptions.id);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-white hover:bg-white/5 flex items-center justify-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savedPosts[selectedPostOptions.id] ? 'Remove from Saved' : 'Save Post'}</span>
            </button>
            {isMrDaniels && (
              <button
                onClick={() => {
                  setPostToEditImage(selectedPostOptions);
                  setSelectedPostOptions(null);
                }}
                className="w-full py-3.5 font-semibold text-[#D4AF37] hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Change Post Photo</span>
              </button>
            )}
            <button
              onClick={() => setSelectedPostOptions(null)}
              className="w-full py-3.5 font-bold text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Instagram Profile Modal (Follow, Followers, Following, DMs, 3x3 Grid) */}
      <InstagramProfileModal
        userId={profileModalUserId}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* WhatsApp Visual Share Modal (Mobile Responsive - Zero Screen Overlap) */}
      <WhatsAppShareModal
        post={shareModalPost}
        isOpen={Boolean(shareModalPost)}
        onClose={() => setShareModalPost(null)}
      />

    </div>
  );
};
