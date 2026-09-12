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
  LogIn,
  Trash2,
  Film,
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, PrayerRequest, ChurchEvent, Testimony, User, CommunityStory } from '../../types';
import { StorageService, arePhoneNumbersEqual } from '../../services/storageService';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
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

  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>(() => StorageService.getAllUsers());

  // Real-time synchronization for community posts, prayers, groups, and members
  useEffect(() => {
    const handleTestimoniesUpdated = () => {
      setTestimonyList(StorageService.getTestimonies());
    };
    const handlePrayersUpdated = () => {
      setPrayerList(StorageService.getPrayerRequests());
    };
    const handleGroupsUpdated = () => {
      setGroupList(StorageService.getGroups(currentUser?.id));
    };
    const handleUsersUpdated = () => {
      setAllRegisteredUsers(StorageService.getAllUsers());
    };
    const handleLiveSync = () => {
      setTestimonyList(StorageService.getTestimonies());
      setPrayerList(StorageService.getPrayerRequests());
      setGroupList(StorageService.getGroups(currentUser?.id));
      setAllRegisteredUsers(StorageService.getAllUsers());
    };

    window.addEventListener('gcz_testimony_updated', handleTestimoniesUpdated);
    window.addEventListener('gcz_prayer_updated', handlePrayersUpdated);
    window.addEventListener('gcz_groups_updated', handleGroupsUpdated);
    window.addEventListener('gcz_user_registered', handleUsersUpdated);
    window.addEventListener('gcz_users_synced', handleUsersUpdated);
    window.addEventListener('gcz_user_profile_updated', handleUsersUpdated);
    window.addEventListener('gcz_live_state_updated', handleLiveSync);
    window.addEventListener('gcz_live_event_received', handleLiveSync);

    // Cross-device social sync
    const unsubscribe = SupabaseSyncService.subscribeToSocialMessaging({
      onUserProfileUpdated: () => {
        setGroupList(StorageService.getGroups(currentUser?.id));
        setAllRegisteredUsers(StorageService.getAllUsers());
      },
      onGroupMemberChanged: () => {
        setGroupList(StorageService.getGroups(currentUser?.id));
      },
      onFollowUpdated: () => {
        const updatedList = StorageService.getFollowingList(currentUser?.id);
        const updatedMap: Record<string, boolean> = {};
        updatedList.forEach(id => { updatedMap[id] = true; });
        setFollowingUsers(updatedMap);
      }
    });

    return () => {
      window.removeEventListener('gcz_testimony_updated', handleTestimoniesUpdated);
      window.removeEventListener('gcz_prayer_updated', handlePrayersUpdated);
      window.removeEventListener('gcz_groups_updated', handleGroupsUpdated);
      window.removeEventListener('gcz_user_registered', handleUsersUpdated);
      window.removeEventListener('gcz_users_synced', handleUsersUpdated);
      window.removeEventListener('gcz_user_profile_updated', handleUsersUpdated);
      window.removeEventListener('gcz_live_state_updated', handleLiveSync);
      window.removeEventListener('gcz_live_event_received', handleLiveSync);
      unsubscribe();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (initialTestimonies && initialTestimonies.length > 0) {
      setTestimonyList(initialTestimonies);
    }
  }, [initialTestimonies]);

  useEffect(() => {
    if (prayers && prayers.length > 0) {
      setPrayerList(prayers);
    }
  }, [prayers]);

  useEffect(() => {
    if (events && events.length > 0) {
      setEventList(events);
    }
  }, [events]);

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
    id: string;
    userId: string;
    userName: string;
    userHandle: string;
    avatar: string;
    badgeType: 'gold' | 'silver' | 'blue' | 'none';
    timeAgo: string;
    scripture: string;
    text: string;
    imageUrl: string;
    isLiked?: boolean;
    likeCount?: number;
  } | null>(null);
  const [storyReplyText, setStoryReplyText] = useState<string>('');

  // Dynamic Stories state synced with StorageService
  const [communityStories, setCommunityStories] = useState<CommunityStory[]>(() => {
    return StorageService.getSortedStories(currentUser?.id);
  });
  const [showAddStoryModal, setShowAddStoryModal] = useState<boolean>(false);
  const [newStoryImageUrl, setNewStoryImageUrl] = useState<string>('');
  const [newStoryScripture, setNewStoryScripture] = useState<string>('');
  const [newStoryText, setNewStoryText] = useState<string>('');
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const canModeratePosts = currentUser.role === 'super_admin' || currentUser.role === 'developer';

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

  // Create Post Modal State (Instagram Style with Reels/Video support)
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'local' | 'url' | 'presets'>('local');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postContent, setPostContent] = useState<string>('');
  const [postCategory, setPostCategory] = useState<Testimony['category']>('Praise & Testimony');
  const [postScriptureTag, setPostScriptureTag] = useState<string>('');
  const [postImageUrl, setPostImageUrl] = useState<string>('');
  const [postVideoUrl, setPostVideoUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
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

  // Listen for live story updates
  useEffect(() => {
    const handleStoryUpdate = () => {
      setCommunityStories(StorageService.getSortedStories(currentUser?.id));
    };
    window.addEventListener('gcz_story_updated', handleStoryUpdate);
    window.addEventListener('gcz_story_like_updated', handleStoryUpdate);
    return () => {
      window.removeEventListener('gcz_story_updated', handleStoryUpdate);
      window.removeEventListener('gcz_story_like_updated', handleStoryUpdate);
    };
  }, [currentUser?.id]);

  // Handle local file selection (Instagram style from device - supports photos & reels/videos)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLocalImagePreview(result);
      if (isVideo) {
        setPostVideoUrl(result);
        setPostImageUrl('');
      } else {
        setPostImageUrl(result);
        setPostVideoUrl('');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryImageUrl && !localImagePreview) {
      alert('Please upload or provide an image for your story.');
      return;
    }
    const currUser = StorageService.getCurrentUser() || currentUser;
    const finalStoryImg = newStoryImageUrl || localImagePreview || '/assets/apostle_joe_daniels_main.jpg';
    
    StorageService.addStory({
      user_id: currUser.id,
      user_name: currUser.full_name || 'Member',
      user_handle: currUser.handle || `@${currUser.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      avatar_url: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      badge_type: currUser.verified_badge || currUser.badge_type || 'none',
      image_url: finalStoryImg,
      scripture: newStoryScripture.trim() || undefined,
      text: newStoryText.trim() || undefined,
      caption: newStoryText.trim() || undefined
    });

    setCommunityStories(StorageService.getSortedStories(currUser.id));
    setShowAddStoryModal(false);
    setNewStoryImageUrl('');
    setNewStoryScripture('');
    setNewStoryText('');
    setLocalImagePreview(null);
    confetti({ particleCount: 35, spread: 60 });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (!postContent.trim()) return;

    const currUser = StorageService.getCurrentUser() || currentUser;
    const isVideo = mediaType === 'video' && (postVideoUrl || localImagePreview);
    const finalVideo = isVideo ? (postVideoUrl || localImagePreview || undefined) : undefined;
    const finalImage = isVideo ? undefined : (postImageUrl || localImagePreview || '/assets/apostle_joe_daniels_main.jpg');

    // New posts start with 0 likes and 0 comments until liked/commented by real users
    StorageService.submitTestimony({
      user_id: currUser.id,
      user_name: currUser.full_name || 'Covenant Member',
      user_handle: currUser.handle || `@${currUser.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      title: postTitle.trim() || (isVideo ? 'Video / Reel Testimony' : 'Supernatural Miracle Testimony'),
      category: postCategory,
      content: postContent.trim(),
      image_url: finalImage,
      video_url: finalVideo,
      scripture_tag: postScriptureTag.trim() || undefined,
    });

    setTestimonyList(StorageService.getTestimonies());
    setShowCreatePostModal(false);

    // Reset Form
    setPostTitle('');
    setPostContent('');
    setPostImageUrl('');
    setPostVideoUrl('');
    setMediaType('image');
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

  const isDeveloper = currentUser?.role === 'developer' || (currentUser?.phone ? arePhoneNumbersEqual(currentUser.phone, '0780699988') : false);
  const visibleCommunityGroups = isDeveloper 
    ? groupList 
    : groupList.filter(g => g.joined);

  const filteredGroups = visibleCommunityGroups.filter(g => 
    selectedGroupCategory === 'All' || g.category === selectedGroupCategory
  );

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto px-3 sm:px-4 pt-2">
      
      {/* 1. Header Banner & Sub-Tabs Switcher */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-wide">
            Gateway Community & Fellowship
          </h2>
          <p className="text-xs text-muted-foreground">
            Instagram Feed, Prayer Altar, Cell Groups & Church Events
          </p>
        </div>

        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-lg border border-border self-start sm:self-center overflow-x-auto max-w-full">
          <button
            id="tab-sub-feed"
            onClick={() => setActiveSubTab('feed')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'feed'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📸 Feed & Posts
          </button>
          <button
            id="tab-sub-prayers"
            onClick={() => setActiveSubTab('prayers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'prayers'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🙏 Prayer Wall ({prayerList.length})
          </button>
          <button
            id="tab-sub-groups"
            onClick={() => setActiveSubTab('groups')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'groups'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            👥 Cell Groups
          </button>
          <button
            id="tab-sub-events"
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'events'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📅 Events
          </button>
        </div>
      </div>

      {/* Global Congregation Search Feature */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="Find and connect with congregation members by name..."
              className="w-full bg-secondary/70 border border-border rounded-lg pl-10 pr-9 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
            {memberSearchQuery && (
              <button
                onClick={() => setMemberSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMemberDirectory(prev => !prev)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              showMemberDirectory
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'bg-secondary text-foreground border-border hover:bg-secondary/80'
            }`}
            title="Toggle Member Directory"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directory ({allRegisteredUsers.length})</span>
          </button>
        </div>

        {/* Search Results Dropdown or Directory View */}
        {(memberSearchQuery.trim() || showMemberDirectory) && (() => {
          const isGuest = currentUser?.role === 'guest' || currentUser?.id === 'usr_guest' || currentUser?.id?.startsWith('usr_guest');
          if (isGuest) {
            return (
              <div className="pt-3 border-t border-border">
                <div className="p-5 bg-secondary/40 border border-border rounded-xl text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="text-foreground font-semibold text-xs">Believers Directory Restricted</h4>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Guests cannot view the believers directory. Please log in or register to connect with Gateway Cathedral members.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRequireAuth()}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In to View Directory</span>
                  </button>
                </div>
              </div>
            );
          }

          const allMembers = allRegisteredUsers;
          const filteredMembers = memberSearchQuery.trim()
            ? allMembers.filter(m => 
                m.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                (m.handle && m.handle.toLowerCase().includes(memberSearchQuery.toLowerCase())) ||
                (m.role && m.role.toLowerCase().includes(memberSearchQuery.toLowerCase()))
              )
            : allMembers;

          return (
            <div className="pt-2 border-t border-border max-h-72 overflow-y-auto space-y-1.5 divide-y divide-border/40">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">
                  {memberSearchQuery.trim() ? `Search Results (${filteredMembers.length})` : `All Congregation Members (${allMembers.length})`}
                </span>
                {memberSearchQuery.trim() && (
                  <button
                    onClick={() => setMemberSearchQuery('')}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filteredMembers.length === 0 ? (
                <p className="text-center py-4 text-xs text-muted-foreground">No congregation members found matching "{memberSearchQuery}".</p>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="pt-1.5 flex items-center justify-between gap-2 hover:bg-secondary/60 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full border border-border overflow-hidden bg-secondary flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                        ) : (
                          member.full_name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-foreground flex items-center gap-1 truncate">
                          <span className="truncate">{member.full_name}</span>
                          {member.id === currentUser.id && (
                            <span className="text-[10px] text-primary font-bold">(You)</span>
                          )}
                          {member.role === 'super_admin' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/15 text-primary font-semibold shrink-0">Apostle</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
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
                        className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-transform active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
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
          
          {/* Stories Tray */}
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              
              {/* Current User: Add Story */}
              <div 
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth();
                    return;
                  }
                  setShowAddStoryModal(true);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-[2px] bg-secondary border border-border group-hover:border-primary transition-all">
                    <img
                      src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt="Your Story"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center text-[10px] font-bold">
                    +
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[62px]">Your Story</span>
              </div>

              {/* Dynamic Real User Stories */}
              {communityStories.map((story) => {
                const storyUser = allRegisteredUsers.find(u => u.id === story.user_id);
                const badge = (story.badge_type || storyUser?.verified_badge || storyUser?.badge_type || 'none') as 'gold' | 'silver' | 'blue' | 'none';
                const avatar = story.avatar_url || story.user_avatar || storyUser?.avatar_url || '/assets/apostle_joe_daniels_main.jpg';
                const displayName = story.user_name || storyUser?.full_name || 'Member';
                const isLiked = StorageService.hasUserLikedStory(story.id, currentUser.id);
                const likes = StorageService.getStoryLikes(story.id);

                return (
                  <div 
                    key={story.id}
                    onClick={() => {
                      setActiveStoryModal({
                        id: story.id,
                        userId: story.user_id,
                        userName: displayName,
                        userHandle: story.user_handle || storyUser?.handle || `@${displayName.toLowerCase().replace(/\s+/g, '_')}`,
                        avatar,
                        badgeType: badge,
                        timeAgo: formatTimeAgo(story.created_at, 'short'),
                        scripture: story.scripture || 'Supernatural Acceleration',
                        text: story.text || story.caption || 'Amen!',
                        imageUrl: story.image_url,
                        isLiked,
                        likeCount: likes.length
                      });
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full p-[2px] bg-card">
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 max-w-[66px]">
                      <span className="text-[10px] text-foreground font-medium truncate">{displayName.split(' ')[0]}</span>
                      {badge !== 'none' && <VerifiedBadge type={badge} size="xs" />}
                    </div>
                  </div>
                );
              })}

              {communityStories.length === 0 && (
                <div className="flex items-center text-muted-foreground text-[11px] px-2 py-1 italic shrink-0">
                  <span>No 24-hr stories yet. Tap + to share!</span>
                </div>
              )}

            </div>
          </div>

          {/* Post Creation Bar */}
          <div className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-primary/40"
              />
              <span className="text-xs text-muted-foreground font-medium">
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
              className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Suggested Leaders / Members Carousel */}
          <div className="bg-secondary/40 border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Suggested for You</span>
              <span className="text-[11px] text-primary font-semibold">Gateway Community</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {allRegisteredUsers.filter(u => u.id !== currentUser.id && u.role !== 'guest').slice(0, 10).map(u => {
                const isFollowing = followingUsers[u.id];
                return (
                  <div
                    key={u.id}
                    className="w-36 shrink-0 bg-card border border-border rounded-lg p-2.5 flex flex-col items-center text-center relative shadow-xs"
                  >
                    <img
                      src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt={u.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-border mb-1.5"
                    />
                    <div className="flex items-center justify-center gap-1 w-full">
                      <p className="text-xs font-semibold text-foreground truncate">{u.full_name}</p>
                      {u.verified_badge && <VerifiedBadge type={u.verified_badge} size="xs" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate w-full mb-2">{u.handle}</p>
                    <button
                      onClick={() => handleToggleFollow(u.id)}
                      className={`w-full py-1 rounded-md text-[11px] font-semibold transition-all ${
                        isFollowing
                          ? 'bg-secondary text-foreground border border-border'
                          : 'bg-primary text-primary-foreground hover:opacity-90 shadow-xs'
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
              const firstLiker = allRegisteredUsers.find(u => u.id === firstLikerId);
              const firstLikerHandle = firstLiker ? firstLiker.handle : (post.liked_user_ids && post.liked_user_ids.length > 0 ? '@covenant_partner' : null);

              return (
                <article
                  key={post.id}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-xs transition-all"
                >
                  {/* Post Header */}
                  <div className="p-3.5 flex items-center justify-between border-b border-border/40">
                    <div 
                      onClick={() => handleOpenUserProfile(post.user_id || post.user_handle || post.user_name)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                      title="View user profile"
                    >
                      <div className="w-10 h-10 rounded-full p-[1.5px] bg-primary transition-transform group-hover:scale-105 shrink-0">
                        <img
                          src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={post.user_name}
                          className="w-full h-full rounded-full object-cover border border-card"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                            {post.user_name}
                          </span>
                          {(post.verified_by_church || isApostlePost) && (
                            <VerifiedBadge type="gold" size="xs" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="font-medium">
                            {post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(post.created_at || post.date, 'short')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Super Admin / Developer Delete / Moderate Post */}
                      {canModeratePosts && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this post from the community feed?')) {
                              StorageService.deleteTestimony(post.id);
                              setTestimonyList(StorageService.getTestimonies());
                            }
                          }}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Post (Admin/Dev Moderation)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Photo Update button - STRICTLY for Mr. Daniels account only */}
                      {isMrDaniels && (
                        <button
                          onClick={() => setPostToEditImage(post)}
                          className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                          title="Apostle Joe Daniels: Update post photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{post.image_url ? 'Change Photo' : '+ Photo'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPostOptions(post)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Post Media (Reel/Video or Photo with Double Tap to Like) */}
                  {post.video_url ? (
                    <div className="w-full bg-black flex items-center justify-center max-h-[460px] overflow-hidden relative">
                      <video
                        src={post.video_url}
                        controls
                        className="w-full max-h-[460px] object-contain"
                        playsInline
                      />
                    </div>
                  ) : post.image_url ? (
                    <div 
                      onDoubleClick={() => handleDoubleTap(post.id)}
                      className="w-full bg-secondary/30 flex items-center justify-center max-h-[460px] overflow-hidden relative cursor-pointer select-none group"
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
                          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-background/80 hover:bg-primary hover:text-primary-foreground text-foreground backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 border border-border shadow-md transition-all z-10"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Action Icons Row */}
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
                                : 'text-foreground hover:text-rose-500'
                            }`} 
                          />
                        </button>

                        {/* Comment Icon */}
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="text-foreground hover:text-primary transition-transform active:scale-110"
                          title="Comment on post"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Direct Share / WhatsApp button */}
                        <button
                          onClick={() => handleSharePostWhatsApp(post)}
                          className="text-foreground hover:text-emerald-500 transition-transform active:scale-110"
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
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'text-primary fill-primary' : 'text-foreground hover:text-primary'}`} />
                      </button>
                    </div>

                    {/* Likes Counter */}
                    <div className="text-xs text-foreground">
                      {likesCount === 0 ? (
                        <p className="text-muted-foreground text-[11px]">
                          0 likes • Be the first to like this
                        </p>
                      ) : (
                        <button
                          onClick={() => setActiveLikesModalPost(post)}
                          className="hover:underline text-left"
                        >
                          {likesCount === 1 && firstLikerHandle ? (
                            <span>
                              Liked by <strong className="font-semibold text-foreground">{firstLikerHandle}</strong>
                            </span>
                          ) : firstLikerHandle ? (
                            <span>
                              Liked by <strong className="font-semibold text-foreground">{firstLikerHandle}</strong> and{' '}
                              <strong className="font-semibold text-foreground">{likesCount - 1} others</strong>
                            </span>
                          ) : (
                            <span>
                              <strong className="font-semibold text-foreground">{likesCount}</strong> likes
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Smart Scripture Quote Ribbon */}
                    {post.scripture_tag && (
                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-[11px] font-semibold text-primary block truncate">
                              {post.scripture_tag}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              Prophetic Scripture Anchor
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSharePostWhatsApp(post)}
                          className="text-[10px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20"
                        >
                          <span>Share Verse</span>
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Post Caption */}
                    <div className="text-xs text-foreground leading-relaxed space-y-1.5">
                      <div>
                        <span 
                          onClick={() => handleOpenUserProfile(post.user_id || post.user_handle || post.user_name)}
                          className="font-semibold text-foreground hover:text-primary cursor-pointer mr-1.5 transition-colors"
                        >
                          {post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}
                        </span>
                        {post.title && <strong className="font-semibold text-primary mr-1">{post.title} — </strong>}
                        <span>{post.content}</span>
                      </div>

                      {/* Smart Category & Aesthetic Hashtags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[10px] font-semibold">
                          #{post.category.replace(/[^a-zA-Z0-9]/g, '')}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium">
                          #GatewayHarare
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium">
                          #ApostleJoeDaniels
                        </span>
                        {post.scripture_tag && (
                          <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">
                            #{post.scripture_tag.replace(/[^a-zA-Z0-9]/g, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Real Post Timestamp */}
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {formatTimeAgo(post.created_at || post.date, 'descriptive')}
                    </p>

                    {/* Comments Preview */}
                    {hasComments ? (
                      <div className="space-y-1 pt-1">
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedComments[post.id] 
                            ? 'Hide comments' 
                            : `View all ${comments.length} comments`}
                        </button>

                        {/* Recent 1-2 comments visible when collapsed */}
                        {!expandedComments[post.id] && comments.slice(-1).map(c => (
                          <div key={c.id} className="text-xs flex items-baseline gap-1.5">
                            <span className="font-semibold text-foreground">{c.user_handle || c.user_name}:</span>
                            <span className="text-muted-foreground">{c.text}</span>
                            <span className="text-[9px] text-muted-foreground/60 ml-auto">{formatTimeAgo(c.created_at, 'short')}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Expanded Real Comments List */}
                    {expandedComments[post.id] && (
                      <div className="bg-secondary/40 rounded-lg p-3 border border-border space-y-2.5 mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border/40">
                          <span>Comments ({comments.length})</span>
                          {isGuest && <span className="text-amber-600 dark:text-amber-400 text-[11px]">Sign in to leave a comment</span>}
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                          {comments.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground italic py-1">No comments yet. Start the conversation!</p>
                          ) : (
                            comments.map((comm) => (
                              <div key={comm.id} className="text-xs bg-card p-2.5 rounded-lg border border-border flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground text-xs">{comm.user_name}</span>
                                    <span className="text-[10px] text-muted-foreground">{comm.user_handle}</span>
                                  </div>
                                  <p className="text-foreground text-xs">{comm.text}</p>
                                </div>
                                <span className="text-[9px] text-muted-foreground shrink-0">
                                  {formatTimeAgo(comm.created_at, 'short')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add Comment Input Bar */}
                    <form onSubmit={(e) => handleAddPostComment(post.id, e)} className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <img
                        src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={currentUser.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                      />
                      <input
                        type="text"
                        value={commentInputMap[post.id] || ''}
                        onChange={(e) => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={isGuest ? "Sign in to join the conversation..." : `Add a comment as ${currentUser.handle || 'user'}...`}
                        disabled={isGuest}
                        className="flex-1 bg-secondary/70 border border-border rounded-lg px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                      {commentInputMap[post.id]?.trim() ? (
                        <button
                          type="submit"
                          disabled={isGuest}
                          className="px-3 py-1 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-semibold transition-all shadow-xs disabled:opacity-50 shrink-0"
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
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Have a burden or believing God for a miracle?
              </h3>
              <p className="text-xs text-muted-foreground">
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
              className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
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
                className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary text-xs font-bold">
                      {prayer.is_anonymous ? '?' : prayer.user_name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {prayer.is_anonymous ? 'Anonymous Covenant Partner' : prayer.user_name}
                        </span>
                        {prayer.is_answered && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            ✓ Answered Prayer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-primary font-medium">
                        Tag: {prayer.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground">
                    {new Date(prayer.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Request Body */}
                <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/50 p-3 rounded-lg border border-border">
                  "{prayer.request_text}"
                </p>

                {/* Apostle Joe Daniels Prophetic Note if present */}
                {prayer.apostle_notes && (
                  <div className="bg-primary/10 border border-primary/25 rounded-lg p-2.5 text-xs text-foreground flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-primary">Apostle Joe Daniels' Decree:</span>{' '}
                      {prayer.apostle_notes}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <button
                    id={`btn-pray-agree-${prayer.id}`}
                    onClick={() => handlePrayerCountIncrement(prayer.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      prayer.user_prayed
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${prayer.user_prayed ? 'fill-current' : ''}`} />
                    <span>{prayer.user_prayed ? 'Agreed in Prayer' : 'I Prayed For You'}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                      {prayer.prayer_count}
                    </span>
                  </button>

                  <button
                    onClick={() => handleSharePrayerWhatsApp(prayer)}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:opacity-80 font-semibold"
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
          <div className="p-8 bg-card border border-border rounded-2xl text-center space-y-4 my-4 max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-foreground font-serif-church font-bold text-lg">Fellowship Groups Are Protected</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cell ministrations, location branches, and youth fellowships are private community spaces reserved for verified Gateway Cathedral members. Please log in or create an account to view and participate in church groups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRequireAuth()}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedGroupCategory === cat
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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
                className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold">
                      {group.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{group.member_count} Members</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mb-1">{group.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{group.description}</p>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground">{group.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground">{group.meeting_time}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground truncate">
                    Leader: <strong className="text-foreground">{group.leader_name}</strong>
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
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                          title="Open Group Chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Open Chat</span>
                        </button>
                        <button
                          id={`btn-exit-group-${group.id}`}
                          onClick={() => handleExitGroup(group)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1 transition-all"
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
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all flex items-center gap-1"
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
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 max-w-sm w-[92vw] max-h-[85vh] overflow-y-auto text-center space-y-4 shadow-xl relative animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => setJoiningGroupId(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="relative mx-auto w-20 h-20 pt-2">
                    {grp.image_url ? (
                      <img
                        src={grp.image_url}
                        alt={grp.name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-primary shadow mx-auto"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-secondary border-2 border-primary flex items-center justify-center text-primary mx-auto text-xl font-bold">
                        {grp.name.charAt(0)}
                      </div>
                    )}
                    {joiningStep === 'joining' ? (
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center shadow-md">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute bottom-0 right-0 w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md animate-in zoom-in">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold tracking-wide uppercase">
                      {grp.category}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{grp.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{grp.description}</p>
                  </div>

                  <div className="bg-secondary/60 border border-border rounded-xl p-3.5 flex items-center justify-center gap-2.5">
                    {joiningStep === 'joining' ? (
                      <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Joining group...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
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
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
                <div className="bg-card border border-destructive/40 rounded-2xl p-5 sm:p-6 max-w-sm w-[92vw] max-h-[85vh] overflow-y-auto space-y-4 shadow-xl relative animate-in zoom-in-95 duration-150">
                  <button
                    onClick={() => setExitingGroupId(null)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto mt-1">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-base text-foreground">Exit {grp.name}?</h4>
                    <p className="text-xs text-muted-foreground">
                      You will leave this fellowship group and no longer receive group messages. You can rejoin at any time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setExitingGroupId(null)}
                      className="flex-1 py-2.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmExitGroup(grp.id)}
                      className="flex-1 py-2.5 rounded-lg bg-destructive hover:bg-destructive/90 text-xs font-bold text-destructive-foreground transition-colors"
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
                className={`bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row transition-all ${
                  countdown.isInSession 
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/40 shadow-sm' 
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="relative w-full md:w-56 h-44 md:h-auto shrink-0 overflow-hidden bg-secondary">
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Overlay Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    {countdown.isInSession ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow animate-pulse">
                        <Radio className="w-3.5 h-3.5" />
                        <span>In Session</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-md border border-border text-primary font-bold text-xs flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3 h-3" />
                        <span>Upcoming</span>
                      </span>
                    )}
                  </div>

                  {isPermanent && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wide shadow-sm">
                        Permanent Service
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{event.category}</span>
                      {countdown.isInSession ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Service Live Now</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-secondary border border-border text-foreground font-mono text-xs font-bold">
                          <Timer className="w-3.5 h-3.5 text-primary" />
                          <span>{countdown.formatted}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-foreground mt-1.5">{event.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-foreground font-medium">{event.date} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate text-foreground">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
                    <span className="text-xs text-muted-foreground">
                      Minister: <strong className="text-foreground">{event.speaker}</strong>
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* If in session, show Join Stream button */}
                      {countdown.isInSession && (
                        <button
                          id={`btn-join-stream-${event.id}`}
                          onClick={() => handleJoinStream(event)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
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
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center gap-1.5 transition-all shadow-sm"
                            title="Request directions from your location to church for this service"
                          >
                            <Compass className="w-3.5 h-3.5 text-primary" />
                            <span>Request Location</span>
                          </button>

                          <button
                            id={`btn-go-virtual-${event.id}`}
                            onClick={() => handleGoVirtual(event)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center gap-1.5 transition-all shadow-sm"
                            title="Set reminder to stream online when service starts"
                          >
                            <Radio className="w-3.5 h-3.5 text-primary" />
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 w-full max-w-lg space-y-4 shadow-xl my-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Create New Community Post / Testimony
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePostModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              {/* Media Selection Tabs (Only Mr Daniels gets presets/URL, regular members get device storage only) */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Media Source
                </label>
                {isMrDaniels ? (
                  <div className="grid grid-cols-3 gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setUploadMode('local')}
                      className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'local' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>From Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'url' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>From Web URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode('presets')}
                      className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        uploadMode === 'presets' ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apostle Photos</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-secondary/50 p-2.5 rounded-lg border border-border text-xs text-muted-foreground flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>Upload an image directly from your local storage / device</span>
                  </div>
                )}
              </div>

              {/* Upload Mode 1: LOCAL DEVICE / STORAGE (Instagram Style - Photos & Reels) */}
              {uploadMode === 'local' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {localImagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-border max-h-52 bg-black flex items-center justify-center">
                      {mediaType === 'video' ? (
                        <video src={localImagePreview} controls className="w-full object-contain max-h-52" />
                      ) : (
                        <img src={localImagePreview} alt="Preview" className="w-full object-cover max-h-52" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setLocalImagePreview(null);
                          setPostImageUrl('');
                          setPostVideoUrl('');
                          setMediaType('image');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-destructive rounded-full text-white text-xs transition-colors"
                        title="Remove media"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer bg-secondary/30 hover:bg-secondary/60 transition-all"
                    >
                      <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-xs font-bold text-foreground">Click or drag photo or video reel from your device</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, MP4, MOV, WEBP</div>
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
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                  />
                  {postImageUrl && (
                    <div className="rounded-lg overflow-hidden border border-border max-h-44 bg-black flex items-center justify-center">
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
                      className={`relative rounded-lg overflow-hidden border-2 aspect-video transition-all ${
                        postImageUrl === photo.url ? 'border-primary ring-2 ring-primary/40' : 'border-border opacity-70 hover:opacity-100'
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
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Category
                  </label>
                  <select
                    value={postCategory}
                    onChange={e => setPostCategory(e.target.value as any)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
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
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">
                    Scripture Reference Tag
                  </label>
                  <input
                    type="text"
                    value={postScriptureTag}
                    onChange={e => setPostScriptureTag(e.target.value)}
                    placeholder="e.g. 1 Kings 18:46"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Caption & Content */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Post Caption / Testimony Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Share what the Lord has done or write your caption..."
                  className="w-full bg-secondary border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground">Submit Altar Prayer Request</h3>
              <button onClick={() => setShowPrayerModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrayer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Category</label>
                <select
                  value={prayerCategory}
                  onChange={e => setPrayerCategory(e.target.value as any)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                >
                  <option value="Healing">Healing & Deliverance</option>
                  <option value="Financial Breakthrough">Financial & Career Breakthrough</option>
                  <option value="Family & Marriage">Family & Marriage</option>
                  <option value="Spiritual Growth">Spiritual Growth & Calling</option>
                  <option value="Business/Career">Business & International Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Your Prayer Request</label>
                <textarea
                  rows={4}
                  required
                  value={prayerText}
                  onChange={e => setPrayerText(e.target.value)}
                  placeholder="Describe your prayer petition..."
                  className="w-full bg-secondary border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-anon"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded accent-primary"
                />
                <label htmlFor="chk-anon" className="text-xs text-muted-foreground">
                  Keep my name anonymous to public prayer wall
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrayerModal(false)}
                  className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl p-5 max-w-sm w-full space-y-3 shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-foreground">{eventFeedbackToast.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{eventFeedbackToast.message}</p>
            <button
              onClick={() => setEventFeedbackToast(null)}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors shadow-sm"
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
                value={storyReplyText}
                onChange={(e) => setStoryReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && storyReplyText.trim()) {
                    StorageService.sendDirectMessage(
                      currentUser.id,
                      activeStoryModal.userId,
                      `Replying to your story: "${storyReplyText.trim()}"`,
                      undefined,
                      undefined,
                      currentUser.full_name
                    );
                    setStoryReplyText('');
                    alert(`Reply sent to ${activeStoryModal.userName}!`);
                  }
                }}
                placeholder={`Reply to ${activeStoryModal.userName}...`}
                className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (storyReplyText.trim()) {
                    StorageService.sendDirectMessage(
                      currentUser.id,
                      activeStoryModal.userId,
                      `Replying to your story: "${storyReplyText.trim()}"`,
                      undefined,
                      undefined,
                      currentUser.full_name
                    );
                    setStoryReplyText('');
                    alert(`Reply sent to ${activeStoryModal.userName}!`);
                  }
                }}
                className="p-2 rounded-full bg-white/15 hover:bg-primary text-white transition-colors"
                title="Send Reply"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const res = StorageService.toggleStoryLike(activeStoryModal.id, currentUser.id);
                  setActiveStoryModal(prev => prev ? {
                    ...prev,
                    isLiked: res.isLiked,
                    likeCount: res.count
                  } : null);
                  if (res.isLiked) {
                    confetti({
                      particleCount: 25,
                      spread: 50,
                      origin: { y: 0.85 }
                    });
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  activeStoryModal.isLiked ? 'bg-rose-500/20 text-rose-500' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={activeStoryModal.isLiked ? 'Unlike Story' : 'Like Story'}
              >
                <Heart className={`w-5 h-5 transition-all ${activeStoryModal.isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STORY MODAL */}
      {showAddStoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Share a 24-Hour Story</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddStoryModal(false);
                  setNewStoryImageUrl('');
                  setNewStoryScripture('');
                  setNewStoryText('');
                }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-3">
              {/* Photo Input / Upload */}
              <input
                type="file"
                ref={storyFileInputRef}
                accept="image/*"
                onChange={handleStoryFileChange}
                className="hidden"
              />

              {newStoryImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border max-h-48 bg-black flex items-center justify-center">
                  <img src={newStoryImageUrl} alt="Story Preview" className="w-full object-cover max-h-48" />
                  <button
                    type="button"
                    onClick={() => {
                      setNewStoryImageUrl('');
                      if (storyFileInputRef.current) storyFileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-destructive rounded-full text-white text-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => storyFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer bg-secondary/30 hover:bg-secondary/60 transition-all"
                >
                  <Camera className="w-7 h-7 text-primary mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-foreground">Pick a photo from your device</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Disappears automatically after 24 hours</div>
                </div>
              )}

              {/* Or Direct Image URL */}
              {!newStoryImageUrl && (
                <input
                  type="url"
                  value={newStoryImageUrl}
                  onChange={(e) => setNewStoryImageUrl(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              )}

              {/* Scripture Decree */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/80 mb-1">
                  Prophetic Scripture / Topic (Optional)
                </label>
                <input
                  type="text"
                  value={newStoryScripture}
                  onChange={(e) => setNewStoryScripture(e.target.value)}
                  placeholder="e.g. 1 Kings 18:46 • Divine Speed"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Story Text */}
              <div>
                <label className="block text-[11px] font-semibold text-foreground/80 mb-1">
                  Story Decree / Message
                </label>
                <textarea
                  rows={2}
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                  placeholder="Share a word, declaration, or praise note..."
                  className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddStoryModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStoryImageUrl}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share Story</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTAGRAM LIKES MODAL (Real Accounts List) */}
      {activeLikesModalPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-border flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">Likes</span>
              <button
                onClick={() => setActiveLikesModalPost(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-2.5">
              {(() => {
                const likerIds = activeLikesModalPost.liked_user_ids || [];
                const likers = allRegisteredUsers.filter(u => likerIds.includes(u.id));
                const displayLikers = likers.length > 0 ? likers : allRegisteredUsers.filter(u => u.role !== 'guest').slice(0, 3);

                return displayLikers.map(user => {
                  const isFollowing = followingUsers[user.id];
                  return (
                    <div key={user.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-foreground">{user.full_name}</span>
                            {user.verified_badge && <VerifiedBadge type={user.verified_badge} size="xs" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{user.handle}</p>
                        </div>
                      </div>

                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleFollow(user.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isFollowing
                              ? 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden shadow-xl divide-y divide-border text-center text-xs">
            <button
              onClick={() => {
                handleSharePostWhatsApp(selectedPostOptions);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-secondary/60 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
            <button
              onClick={() => {
                handleToggleSavePost(selectedPostOptions.id);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-foreground hover:bg-secondary/60 flex items-center justify-center gap-2"
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
                className="w-full py-3.5 font-semibold text-primary hover:bg-secondary/60 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Change Post Photo</span>
              </button>
            )}
            {canModeratePosts && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this post from the community feed?')) {
                    StorageService.deleteTestimony(selectedPostOptions.id);
                    setTestimonyList(StorageService.getTestimonies());
                    setSelectedPostOptions(null);
                  }
                }}
                className="w-full py-3.5 font-bold text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Post (Admin Moderation)</span>
              </button>
            )}
            <button
              onClick={() => setSelectedPostOptions(null)}
              className="w-full py-3.5 font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/60"
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
