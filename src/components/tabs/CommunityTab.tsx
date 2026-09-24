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
  Video,
  Flag,
  FileEdit,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, PrayerRequest, ChurchEvent, Testimony, User, CommunityStory, ChurchPage } from '../../types';
import { StorageService, arePhoneNumbersEqual } from '../../services/storageService';
import { StorageBucketService } from '../../services/StorageBucketService';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
import { liveSyncService, OnlineMember } from '../../services/liveSyncService';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { InstagramProfileModal } from '../modals/InstagramProfileModal';
import { WhatsAppShareModal } from '../modals/WhatsAppShareModal';
import { ChurchPagesSection } from '../common/ChurchPagesSection';
import { ChurchPageViewModal } from '../modals/ChurchPageViewModal';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';
import { InViewAutoPlayVideo } from '../common/InViewAutoPlayVideo';
import { PaidGroupBillingModal } from '../modals/PaidGroupBillingModal';
import { cn } from '../../lib/utils';
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
  onOpenDirectChat?: (recipientId: string, returnProfileId?: string) => void;
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
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'prayers' | 'groups' | 'events' | 'pages'>('feed');
  const [selectedPostingPageId, setSelectedPostingPageId] = useState<string>('personal');
  const [selectedViewChurchPage, setSelectedViewChurchPage] = useState<ChurchPage | null>(null);
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
  const [selectedPaidGroupForBilling, setSelectedPaidGroupForBilling] = useState<CommunityGroup | null>(null);

  // Global Congregation Member Search Feature
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberDirectory, setShowMemberDirectory] = useState(false);

  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>(() => StorageService.getAllUsers());
  const [onlinePresenceList, setOnlinePresenceList] = useState<OnlineMember[]>(() => 
    typeof liveSyncService !== 'undefined' ? liveSyncService.getOnlineMembers() : []
  );

  const effectiveOnlineMembers = React.useMemo(() => {
    const map = new Map<string, OnlineMember>();
    if (currentUser?.id) {
      map.set(currentUser.id, {
        id: currentUser.id,
        full_name: currentUser.full_name,
        handle: currentUser.handle,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
        city: currentUser.location || (currentUser as any).city_location || 'Harare',
        badge_type: currentUser.badge_type,
        online_at: new Date().toISOString()
      });
    }
    if (Array.isArray(onlinePresenceList)) {
      for (const m of onlinePresenceList) {
        if (m && m.id && !map.has(m.id)) {
          map.set(m.id, m);
        }
      }
    }
    return Array.from(map.values());
  }, [onlinePresenceList, currentUser]);

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
    const handlePresenceUpdated = (e: any) => {
      if (Array.isArray(e.detail)) {
        const unique = new Map<string, OnlineMember>();
        for (const item of e.detail) {
          if (item && item.id && !unique.has(item.id)) {
            unique.set(item.id, item);
          }
        }
        setOnlinePresenceList(Array.from(unique.values()));
      }
    };
    const handleLiveSync = () => {
      setTestimonyList(StorageService.getTestimonies());
      setPrayerList(StorageService.getPrayerRequests());
      setGroupList(StorageService.getGroups(currentUser?.id));
      setAllRegisteredUsers(StorageService.getAllUsers());
    };

    const handleEventsUpdated = () => {
      setEventList(StorageService.getEvents());
    };

    window.addEventListener('gcz_events_updated', handleEventsUpdated);
    window.addEventListener('gcz_testimony_updated', handleTestimoniesUpdated);
    window.addEventListener('gcz_prayer_updated', handlePrayersUpdated);
    window.addEventListener('gcz_groups_updated', handleGroupsUpdated);
    window.addEventListener('gcz_user_registered', handleUsersUpdated);
    window.addEventListener('gcz_users_synced', handleUsersUpdated);
    window.addEventListener('gcz_user_profile_updated', handleUsersUpdated);
    window.addEventListener('gcz_live_state_updated', handleLiveSync);
    window.addEventListener('gcz_live_event_received', handleLiveSync);
    window.addEventListener('gcz_live_presence_updated', handlePresenceUpdated);

    // Cross-device social sync
    const unsubscribe = SupabaseSyncService.subscribeToSocialMessaging({
      onUserProfileUpdated: () => {
        StorageService.syncUsersWithRemote().finally(() => {
          setGroupList(StorageService.getGroups(currentUser?.id));
          setAllRegisteredUsers(StorageService.getAllUsers());
        });
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
      window.removeEventListener('gcz_events_updated', handleEventsUpdated);
      window.removeEventListener('gcz_testimony_updated', handleTestimoniesUpdated);
      window.removeEventListener('gcz_prayer_updated', handlePrayersUpdated);
      window.removeEventListener('gcz_groups_updated', handleGroupsUpdated);
      window.removeEventListener('gcz_user_registered', handleUsersUpdated);
      window.removeEventListener('gcz_users_synced', handleUsersUpdated);
      window.removeEventListener('gcz_user_profile_updated', handleUsersUpdated);
      window.removeEventListener('gcz_live_state_updated', handleLiveSync);
      window.removeEventListener('gcz_live_event_received', handleLiveSync);
      window.removeEventListener('gcz_live_presence_updated', handlePresenceUpdated);
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
  const [newStoryFile, setNewStoryFile] = useState<File | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState<boolean>(false);
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
  const [postFile, setPostFile] = useState<File | null>(null);
  const [storyFile, setStoryFile] = useState<File | null>(null);
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

  // Admin & Developer Event Governance States
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
    description: '',
    banner_url: '/assets/apostle_joe_daniels_preach.jpg',
    category: 'Conference',
    speaker: 'Apostle Joe Daniels'
  });

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    const eventToSave: ChurchEvent = {
      id: editingEvent ? editingEvent.id : `evt_${Date.now()}`,
      title: eventForm.title.trim(),
      date: eventForm.date.trim() || 'Upcoming',
      time: eventForm.time.trim() || '18:00 - 20:00 CAT',
      location: eventForm.location.trim() || 'Gateway Cathedral, Harare',
      description: eventForm.description.trim(),
      banner_url: eventForm.banner_url || '/assets/apostle_joe_daniels_preach.jpg',
      category: eventForm.category,
      speaker: eventForm.speaker.trim() || 'Apostle Joe Daniels',
      is_featured: editingEvent?.is_featured ?? false,
      is_permanent: editingEvent?.is_permanent ?? false,
      ticket_required: editingEvent?.ticket_required ?? false
    };

    StorageService.saveEvent(eventToSave);
    setEventList(StorageService.getEvents());
    setShowEventModal(false);
    setEditingEvent(null);
  };

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
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Please select an image or video file.');
      return;
    }

    setPostFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLocalImagePreview(result);
        if (isVideo) setPostVideoUrl(result);
        else setPostImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setIsUploading(true);
    let finalImageUrl = postImageUrl;
    let finalVideoUrl = postVideoUrl;

    if (postFile) {
      const uploadedUrl = await StorageBucketService.uploadFileToMediaBucket(postFile);
      if (uploadedUrl) {
        if (mediaType === 'video') finalVideoUrl = uploadedUrl;
        else finalImageUrl = uploadedUrl;
      }
    }

    const currUser = StorageService.getCurrentUser() || currentUser;
    const postingPage = selectedPostingPageId !== 'personal' 
      ? StorageService.getPages().find(p => p.id === selectedPostingPageId)
      : null;

    // New posts start with 0 likes and 0 comments until liked/commented by real users
    StorageService.submitTestimony({
      user_id: currUser.id,
      user_name: postingPage ? postingPage.name : (currUser.full_name || 'Covenant Member'),
      user_handle: postingPage ? postingPage.handle : (currUser.handle || '@member'),
      user_avatar: postingPage ? postingPage.avatar_url : (currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'),
      page_id: postingPage ? postingPage.id : undefined,
      page_name: postingPage ? postingPage.name : undefined,
      page_handle: postingPage ? postingPage.handle : undefined,
      page_avatar: postingPage ? postingPage.avatar_url : undefined,
      category: postCategory,
      title: postTitle.trim(),
      content: postContent.trim(),
      scripture_tag: postScriptureTag.trim(),
      image_url: finalImageUrl,
      video_url: finalVideoUrl
    });

    setTestimonyList(StorageService.getTestimonies());
    
    setShowCreatePostModal(false);
    setPostTitle('');
    setPostContent('');
    setPostCategory('Praise & Testimony');
    setPostScriptureTag('');
    setPostImageUrl('');
    setPostVideoUrl('');
    setLocalImagePreview(null);
    setPostFile(null);
    setIsUploading(false);
    confetti({ particleCount: 35, spread: 60 });
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

  // Instagram Real-time Like Incrementer (rapid-fire likes on repeated press or pressing number)
  const handleIncrementLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const currUser = StorageService.getCurrentUser() || currentUser;
    StorageService.incrementTestimonyLikes(postId, currUser.id);
    setTestimonyList(StorageService.getTestimonies());
    setDoubleTapHeartPostId(postId);
    setTimeout(() => setDoubleTapHeartPostId(null), 700);
  };

  // Real Instagram Like Handler (stored persistently, tied to actual accounts)
  const handleLikePost = (postId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const currUser = StorageService.getCurrentUser() || currentUser;
    const post = testimonyList.find(p => p.id === postId);
    const alreadyLiked = post?.liked_user_ids?.includes(currUser.id) || post?.user_liked;

    if (alreadyLiked) {
      handleIncrementLike(postId);
      return;
    }

    const result = StorageService.likeTestimony(postId, currUser.id);
    setTestimonyList(StorageService.getTestimonies());
    if (result.user_liked) {
      setDoubleTapHeartPostId(postId);
      setTimeout(() => setDoubleTapHeartPostId(null), 700);
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
    handleIncrementLike(postId);
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

  // Real comment submission with optimistic UI updates (zero-latency feel)
  const handleAddPostComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const text = commentInputMap[postId]?.trim();
    if (!text) return;

    const currUser = StorageService.getCurrentUser() || currentUser;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // 1. Create optimistic comment
    const optimisticComment = {
      id: tempId,
      user_id: currUser.id,
      user_name: currUser.full_name,
      user_handle: currUser.handle || `@${currUser.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      text,
      created_at: new Date().toISOString(),
      likes_count: 0,
      badge_type: currUser.badge_type || (currUser.is_verified ? ('blue' as const) : ('none' as const)),
      status: 'pending' as const
    };

    // 2. Clear input and auto-expand comments for instant feedback
    setCommentInputMap(prev => ({
      ...prev,
      [postId]: ''
    }));
    setExpandedComments(prev => ({
      ...prev,
      [postId]: true
    }));

    // 3. Update UI state immediately (zero latency)
    setTestimonyList(prevList =>
      prevList.map(item => {
        if (item.id === postId) {
          const existing = item.comments || [];
          return {
            ...item,
            comments: [...existing, optimisticComment],
            comments_count: (item.comments_count || existing.length) + 1
          };
        }
        return item;
      })
    );

    // 4. Background persistence with graceful resolution
    try {
      const savedComment = StorageService.addCommentToTestimony(postId, text, currUser);
      
      // Update the temporary ID with confirmed database record
      setTestimonyList(prevList =>
        prevList.map(item => {
          if (item.id === postId) {
            return {
              ...item,
              comments: (item.comments || []).map(c =>
                c.id === tempId
                  ? {
                      ...c,
                      id: savedComment?.id || tempId,
                      status: 'synced' as const
                    }
                  : c
              )
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.warn('Optimistic comment sync failed:', err);
      // Mark as failed and restore text to input field
      setTestimonyList(prevList =>
        prevList.map(item => {
          if (item.id === postId) {
            return {
              ...item,
              comments: (item.comments || []).map(c =>
                c.id === tempId ? { ...c, status: 'failed' as const } : c
              )
            };
          }
          return item;
        })
      );
      setCommentInputMap(prev => ({
        ...prev,
        [postId]: text
      }));
    }
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
    const currUser = StorageService.getCurrentUser() || currentUser;

    StorageService.submitPrayer({
      user_name: isAnonymous ? 'Anonymous Partner' : (currUser?.full_name || 'Covenant Partner'),
      is_anonymous: isAnonymous,
      category: prayerCategory,
      request_text: prayerText.trim(),
      is_public: isPublic,
      user_id: currUser?.id || 'usr_anonymous'
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

    // MANDATE: When user says join on a paid group, bill them via Paynow modal!
    if (group.is_paid) {
      setSelectedPaidGroupForBilling(group);
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

  const handleDeleteGroup = (group: CommunityGroup) => {
    const isDev = currentUser?.role === 'developer' || (currentUser?.phone ? arePhoneNumbersEqual(currentUser.phone, '0780699988') : false);
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    if (!isAdmin && !isDev) {
      alert('Only Administrators and Developers have permissions to delete and dissolve groups.');
      return;
    }

    const confirmMessage = group.is_paid
      ? `Permanently delete and dissolve the Premium Paid Group "${group.name}" ($${group.price_usd || 150})? All member access and chat records will be purged.`
      : `Permanently delete and dissolve "${group.name}"? All member records and group data will be purged.`;

    if (window.confirm(confirmMessage)) {
      const res = StorageService.deleteChatGroup(group.id);
      setGroupList(StorageService.getGroups(currentUser?.id));
      alert(res.message || `Group "${group.name}" has been permanently deleted.`);
    }
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
      message: 'When the service starts, you can follow the scheduled service details here.'
    });
  };

  const handleSharePostWhatsApp = (item: Testimony) => {
    setShareModalPost(item);
  };

  const handleSharePrayerWhatsApp = (prayer: PrayerRequest) => {
    const text = `🙏 *Gateway Church Zimbabwe - Prayer Request*\nCategory: ${prayer.category}\n"${prayer.request_text}"\n\nJoin us in standing in agreement on the Gateway Connect App!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isDeveloper = currentUser?.role === 'developer' || (currentUser?.phone ? arePhoneNumbersEqual(currentUser.phone, '0780699988') : false);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isAdminOrDev = isAdmin || isDeveloper;

  // USER MANDATE: "Every Paid Group" Should Be available when a user opens the "cell group part"
  // plus any groups user has joined, or all groups for admin/developer
  const visibleCommunityGroups = isAdminOrDev 
    ? groupList 
    : groupList.filter(g => g.joined || g.is_paid);

  const filteredGroups = visibleCommunityGroups.filter(g => {
    if (selectedGroupCategory === 'All') return true;
    if (selectedGroupCategory === '⭐ Paid & Pro') return g.is_paid;
    return g.category === selectedGroupCategory;
  });

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      console.warn("File size must be under 25MB.");
      return;
    }

    setNewStoryFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      setNewStoryImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryImageUrl && !newStoryFile) return;

    setIsUploadingStory(true);
    let finalUrl = newStoryImageUrl;

    if (newStoryFile) {
      const uploadedUrl = await StorageBucketService.uploadFileToMediaBucket(newStoryFile, 'media');
      if (uploadedUrl) finalUrl = uploadedUrl;
    }

    const cur = StorageService.getCurrentUser() || currentUser;
    StorageService.addStory({
      user_id: cur.id,
      user_name: cur.full_name,
      user_handle: cur.handle || `@${cur.full_name.toLowerCase().replace(/\s+/g, '_')}`,
      user_avatar: cur.avatar_url || '',
      avatar_url: cur.avatar_url,
      badge_type: cur.badge_type || 'none',
      image_url: finalUrl,
      caption: newStoryText.trim(),
      scripture: newStoryScripture.trim() || undefined,
      likes_count: 0
    });

    setIsUploadingStory(false);
    setShowAddStoryModal(false);
    setNewStoryImageUrl('');
    setNewStoryFile(null);
    setNewStoryScripture('');
    setNewStoryText('');
    
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto px-0 sm:px-2 pt-1 w-full max-w-full">
      
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
          <button
            id="tab-sub-pages"
            onClick={() => setActiveSubTab('pages')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'pages'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🚩 Church Pages
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
          
          {/* Global Online Presence Indicator (Supabase Presence Real-Time) */}
          <div className="bg-card border border-border rounded-xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-foreground tracking-tight truncate">
                    Global Online Presence
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-semibold shrink-0">
                    {effectiveOnlineMembers.length} Active in Fellowship
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-muted-foreground font-medium">
                <span className="hidden sm:inline">Supabase Presence</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-500 font-semibold">Real-Time</span>
              </div>
            </div>

            {/* Active Believers Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              {effectiveOnlineMembers.map((member, idx) => {
                const isSelf = member.id === currentUser?.id;
                const memberUser = allRegisteredUsers.find(u => u.id === member.id);
                const badge = (member.badge_type || memberUser?.verified_badge || memberUser?.badge_type || (member.role === 'developer' || member.role === 'super_admin' ? 'gold' : 'none')) as 'gold' | 'silver' | 'blue' | 'none';
                const avatar = member.avatar_url || memberUser?.avatar_url || '/assets/apostle_joe_daniels_main.jpg';
                const displayName = member.full_name || memberUser?.full_name || 'Believer';
                const firstName = displayName.split(' ')[0];

                return (
                  <div
                    key={`presence-${member.id || idx}`}
                    onClick={() => {
                      if (isSelf) {
                        setProfileModalUserId(currentUser.id);
                        setShowProfileModal(true);
                      } else {
                        setProfileModalUserId(member.id);
                        setShowProfileModal(true);
                      }
                    }}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group select-none"
                    title={`${displayName} • Active in ${member.city || 'Fellowship'}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full p-[1.5px] bg-secondary border-2 border-emerald-500/90 group-hover:border-emerald-400 group-hover:scale-105 transition-all shadow-xs">
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/apostle_joe_daniels_main.jpg';
                          }}
                        />
                      </div>
                      {/* Active green beacon badge */}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card ring-1 ring-emerald-400/50 flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-white"></span>
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 max-w-[66px]">
                      <span className="text-[10px] font-medium text-foreground truncate">
                        {isSelf ? 'You' : firstName}
                      </span>
                      {badge !== 'none' && <VerifiedBadge type={badge} size="xs" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
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
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-secondary border border-border group-hover:border-primary transition-all">
                    <img
                      src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt="Your Story"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground border border-background flex items-center justify-center text-[9px] font-bold">
                    +
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[56px] text-center">Your Story</span>
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
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                      <div className="w-full h-full rounded-full p-[1.5px] bg-card">
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-0.5 max-w-[56px]">
                      <span className="text-[10px] text-foreground font-medium truncate text-center">{displayName.split(' ')[0]}</span>
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
                      onClick={() => {
                        if (post.page_id) {
                          const page = StorageService.getPageById(post.page_id);
                          if (page) {
                            setSelectedViewChurchPage(page);
                            return;
                          }
                        }
                        handleOpenUserProfile(post.user_id || post.user_handle || post.user_name);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer group"
                      title={post.page_id ? `View ${post.user_name} page` : "View user profile"}
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
                          {(post.page_verified || post.page_id) && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                          {post.page_id && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              Page
                            </span>
                          )}
                          {(post.verified_by_church || isApostlePost) && !post.page_id && (
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

                    {(() => {
                      const isPostAuthor = (Boolean(post.user_id) && post.user_id === currentUser.id) ||
                                           (Boolean(post.user_handle) && post.user_handle === currentUser.handle) ||
                                           (Boolean(post.page_id) && StorageService.getPages().some(p => p.id === post.page_id && (p.creator_id === currentUser.id || p.admin_ids?.includes(currentUser.id))));
                      const isModOrAdmin = isAdminOrDev || currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'developer' || (currentUser.role as string) === 'moderator' || (currentUser.role as string) === 'mod' || canModeratePosts;
                      const canManagePost = isPostAuthor || isModOrAdmin;

                      return (
                        <div className="flex items-center gap-1.5">
                          {/* Photo Update button - STRICTLY for Author, Admin, or Mod only */}
                          {canManagePost && (
                            <button
                              onClick={() => setPostToEditImage(post)}
                              className="px-2 py-1 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Update post photo (Author, Admin, or Mod only)"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{post.image_url ? 'Change Photo' : '+ Photo'}</span>
                            </button>
                          )}

                          {/* Delete Post - STRICTLY for Author, Admin, or Mod only */}
                          {canManagePost && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this post from the community feed?')) {
                                  StorageService.deleteTestimony(post.id);
                                  setTestimonyList(StorageService.getTestimonies());
                                  if (onRefreshData) onRefreshData();
                                }
                              }}
                              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Delete Post (Author, Admin, or Mod only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPostOptions(post)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Post Media (Reel/Video or Photo with Double Tap to Like) */}
                  {post.video_url ? (
                    <div className="w-full bg-black flex items-center justify-center max-h-[460px] overflow-hidden relative">
                      {StorageService.isFacebookUrl(post.video_url) ? (
                        <FacebookStreamPlayer
                          embedUrl={StorageService.getStreamEmbedInfo(post.video_url).embedUrl}
                          directUrl={StorageService.getStreamEmbedInfo(post.video_url).facebookDirectUrl || post.video_url}
                          title={post.title}
                          className="w-full max-h-[460px]"
                        />
                      ) : StorageService.extractYoutubeId(post.video_url) ? (
                        <iframe
                          className="w-full aspect-video border-0"
                          src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(post.video_url)!)}
                          title={post.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <InViewAutoPlayVideo
                          src={post.video_url}
                          poster={post.image_url}
                          title={post.title}
                          className="w-full max-h-[460px]"
                        />
                      )}
                    </div>
                  ) : post.image_url && StorageService.isFacebookUrl(post.image_url) ? (
                    <div className="w-full bg-black flex items-center justify-center max-h-[460px] overflow-hidden relative">
                      <FacebookStreamPlayer
                        embedUrl={StorageService.getStreamEmbedInfo(post.image_url).embedUrl}
                        directUrl={StorageService.getStreamEmbedInfo(post.image_url).facebookDirectUrl || post.image_url}
                        title={post.title}
                        className="w-full max-h-[460px]"
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
                    <div className="text-xs text-foreground flex items-center justify-between">
                      {likesCount === 0 ? (
                        <button
                          onClick={(e) => handleIncrementLike(post.id, e)}
                          className="text-muted-foreground text-[11px] hover:text-foreground cursor-pointer transition-colors active:scale-95"
                          title="Click to like"
                        >
                          0 likes • Be the first to like this
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={(e) => handleIncrementLike(post.id, e)}
                            className="font-bold text-foreground hover:text-rose-500 cursor-pointer select-none active:scale-125 transition-transform inline-flex items-center gap-1"
                            title="Press repeatedly to add likes in real-time"
                          >
                            <span className="text-rose-500">❤️</span>
                            <strong>{likesCount}</strong> {likesCount === 1 ? 'like' : 'likes'}
                          </button>

                          {firstLikerHandle && (
                            <button
                              onClick={() => setActiveLikesModalPost(post)}
                              className="text-muted-foreground hover:text-foreground text-[11px] hover:underline cursor-pointer"
                              title="View likers"
                            >
                              • Liked by <strong className="font-semibold text-foreground">{firstLikerHandle}</strong>
                              {likesCount > 1 ? ` and others` : ''}
                            </button>
                          )}
                        </div>
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
                            <span className="text-muted-foreground truncate">{c.text}</span>
                            {c.status === 'pending' ? (
                              <span className="badge-optimistic ml-auto shrink-0">
                                <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
                              </span>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/60 ml-auto shrink-0">{formatTimeAgo(c.created_at, 'short')}</span>
                            )}
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
                              <div
                                key={comm.id}
                                className={`text-xs bg-card p-2.5 rounded-lg border border-border flex items-start justify-between gap-2 transition-all ${
                                  comm.status === 'pending'
                                    ? 'comment-pending border-amber-500/30'
                                    : comm.status === 'synced'
                                    ? 'comment-synced'
                                    : ''
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-foreground text-xs">{comm.user_name}</span>
                                    <span className="text-[10px] text-muted-foreground">{comm.user_handle}</span>
                                    {comm.status === 'pending' && (
                                      <span className="badge-optimistic">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
                                        <span>Posting</span>
                                      </span>
                                    )}
                                    {comm.status === 'synced' && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-500 font-medium">
                                        <Check className="w-2.5 h-2.5" /> Synced
                                      </span>
                                    )}
                                    {comm.status === 'failed' && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-destructive font-medium">
                                        Failed
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-foreground text-xs break-words">{comm.text}</p>
                                </div>
                                <span className="text-[9px] text-muted-foreground shrink-0">
                                  {comm.status === 'pending' ? 'Just now' : formatTimeAgo(comm.created_at, 'short')}
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
          {prayerList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card border border-border rounded-xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">No Petitions on the Altar Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Be the first to submit a prayer request. Apostle Joe Daniels and our covenant intercessors stand in agreement with you.
                </p>
              </div>
              <button
                onClick={() => {
                  if (isGuest) {
                    onRequireAuth();
                    return;
                  }
                  setShowPrayerModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Prayer Request</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {prayerList.filter(Boolean).map((prayer) => {
                const displayName = prayer.is_anonymous
                  ? 'Anonymous Covenant Partner'
                  : (prayer.user_name && prayer.user_name.trim() ? prayer.user_name.trim() : 'Covenant Partner');
                const initialChar = prayer.is_anonymous
                  ? '?'
                  : (displayName.charAt(0).toUpperCase() || 'P');
                const formattedDate = prayer.created_at
                  ? new Date(prayer.created_at).toLocaleDateString()
                  : 'Recent';

                return (
                  <div
                    key={prayer.id || Math.random().toString()}
                    className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {initialChar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-foreground">
                              {displayName}
                            </span>
                            {prayer.is_answered && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                ✓ Answered Prayer
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-primary font-medium">
                            Tag: {prayer.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Request Body */}
                    <p className="text-xs text-foreground/90 leading-relaxed bg-secondary/50 p-3 rounded-lg border border-border">
                      "{prayer.request_text || 'Praying for breakthrough and divine favor.'}"
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
                          {prayer.prayer_count || 1}
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
                );
              })}
            </div>
          )}

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
            {['All', '⭐ Paid & Pro', 'School', 'Location', 'Youth', 'Business', 'Diaspora'].map(cat => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
            {filteredGroups.map(group => (
              <div
                key={group.id}
                className={cn(
                  "rounded-xl p-4 space-y-3 flex flex-col justify-between w-full min-w-0 overflow-hidden box-border transition-all duration-300 relative",
                  group.is_paid
                    ? "bg-gradient-to-br from-amber-500/15 via-card to-amber-500/5 border-2 border-amber-400 dark:border-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.28)] ring-1 ring-amber-400/50"
                    : "bg-card border border-border shadow-sm"
                )}
              >
                {/* Shining Premium Gold Banner for Paid Groups */}
                {group.is_paid && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 shadow-md font-black -mt-1 -mx-1 mb-1 animate-pulse">
                    <span className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
                      <Crown className="w-3.5 h-3.5 fill-current" />
                      <span>PREMIUM CELL GROUP</span>
                    </span>
                    <span className="text-xs bg-slate-950/15 px-2 py-0.5 rounded-md font-black">
                      ${group.price_usd || 150} USD / {group.duration_months || 3} mo
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5 min-w-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 flex items-center gap-1",
                      group.is_paid
                        ? "bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40"
                        : "bg-primary/15 text-primary"
                    )}>
                      {group.is_paid && <Sparkles className="w-3 h-3 fill-current text-amber-500" />}
                      <span>{group.category}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{group.member_count} Members</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mb-1 break-words line-clamp-2 min-w-0 flex items-center gap-1.5">
                    {group.is_paid && <Crown className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />}
                    <span>{group.name}</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-3 break-words">{group.description}</p>
                  
                  <div className="space-y-1 text-xs text-muted-foreground min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className={cn("w-3.5 h-3.5 shrink-0", group.is_paid ? "text-amber-500" : "text-primary")} />
                      <span className="text-foreground truncate">{group.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className={cn("w-3.5 h-3.5 shrink-0", group.is_paid ? "text-amber-500" : "text-primary")} />
                      <span className="text-foreground truncate">{group.meeting_time}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2 min-w-0">
                  <div className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                    Leader: <strong className="text-foreground truncate">{group.leader_name}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Admin/Developer Delete Button - Works on even paid groups */}
                    {isAdminOrDev && (
                      <button
                        id={`btn-delete-group-${group.id}`}
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shrink-0"
                        title={`Delete & Dissolve ${group.is_paid ? 'Paid ' : ''}Group`}
                        aria-label={`Delete ${group.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(currentUser?.role === 'super_admin' || currentUser?.role === 'developer') && (
                      <button
                        id={`btn-schedule-event-${group.id}`}
                        onClick={() => {
                          setEditingEvent(null);
                          setEventForm({
                            title: `${group.name} - Special Gathering`,
                            date: group.meeting_time || 'Next Scheduled Gathering',
                            time: '18:00 - 20:00 CAT',
                            location: group.location || 'Gateway Cathedral, Harare',
                            description: `Official gathering for ${group.name}. Coordinated by ${group.leader_name}.`,
                            banner_url: group.image_url || '/assets/apostle_joe_daniels_preach.jpg',
                            category: group.category === 'School' ? 'Seminar' : 'Conference',
                            speaker: group.leader_name || 'Apostle Joe Daniels'
                          });
                          setShowEventModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1 transition-all"
                        title="Schedule Event for this Group"
                      >
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline">Event</span>
                      </button>
                    )}
                    {group.joined ? (
                      <>
                        <button
                          id={`btn-open-chat-${group.id}`}
                          onClick={() => {
                            if (onOpenGroupChat) {
                              onOpenGroupChat(group.id);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                            group.is_paid 
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                          )}
                          title="Open Group Chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{group.is_paid ? 'Pro Chat' : 'Open Chat'}</span>
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
                        className={cn(
                          "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                          group.is_paid
                            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black shadow-[0_0_14px_rgba(245,158,11,0.4)] border border-amber-300"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                      >
                        {group.is_paid ? (
                          <>
                            <Crown className="w-3.5 h-3.5 fill-current" />
                            <span>Join • ${group.price_usd || 150}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Join Group</span>
                          </>
                        )}
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
          {/* Admin & Developer Event Governance Header */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'developer') && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">Church & School Events Management</h4>
                  <p className="text-[11px] text-muted-foreground">Admin / Developer controls: schedule, update, or remove church & mentorship events.</p>
                </div>
              </div>
              <button
                id="btn-create-church-event"
                onClick={() => {
                  setEditingEvent(null);
                  setEventForm({
                    title: '',
                    date: '',
                    time: '',
                    location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
                    description: '',
                    banner_url: '/assets/apostle_joe_daniels_preach.jpg',
                    category: 'Conference',
                    speaker: 'Apostle Joe Daniels'
                  });
                  setShowEventModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Event</span>
              </button>
            </div>
          )}

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
                      {/* Admin/Dev Edit & Delete actions */}
                      {(currentUser?.role === 'super_admin' || currentUser?.role === 'developer') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`btn-edit-event-${event.id}`}
                            onClick={() => {
                              setEditingEvent(event);
                              setEventForm({
                                title: event.title,
                                date: event.date,
                                time: event.time,
                                location: event.location,
                                description: event.description,
                                banner_url: event.banner_url,
                                category: event.category,
                                speaker: event.speaker
                              });
                              setShowEventModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border flex items-center gap-1 transition-all"
                            title="Edit Event"
                          >
                            <FileEdit className="w-3 h-3 text-primary" />
                            <span>Edit</span>
                          </button>
                          {!isPermanent && (
                            <button
                              id={`btn-delete-event-${event.id}`}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete the event "${event.title}"?`)) {
                                  StorageService.deleteEvent(event.id);
                                  setEventList(StorageService.getEvents());
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center gap-1 transition-all"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
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

      {/* 6. SUB-TAB: CHURCH PAGES & MINISTRIES */}
      {activeSubTab === 'pages' && (
        <ChurchPagesSection
          currentUser={currentUser || StorageService.getCurrentUser()}
          onPageSelected={(page) => setSelectedViewChurchPage(page)}
        />
      )}

      {/* MODAL: INSTAGRAM-STYLE CREATE POST (LOCAL STORAGE / URL / PRESETS) */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 w-full max-w-lg space-y-4 shadow-xl my-auto max-h-[60vh] overflow-y-auto">
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
              {/* Identity Switcher: Post as Personal vs Page */}
              {(() => {
                const effectiveUser = StorageService.getCurrentUser() || currentUser;
                const managedPages = StorageService.getPages().filter(
                  p => p.creator_id === effectiveUser.id || p.admin_ids?.includes(effectiveUser.id)
                );
                if (managedPages.length === 0) return null;

                return (
                  <div className="p-2.5 rounded-xl bg-secondary/60 border border-border space-y-1.5">
                    <label className="block text-[11px] font-bold text-foreground/80">
                      Publishing Identity:
                    </label>
                    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedPostingPageId('personal')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          selectedPostingPageId === 'personal'
                            ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                            : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                        }`}
                      >
                        <img
                          src={effectiveUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{effectiveUser.full_name?.split(' ')[0] || 'Me'} (Personal)</span>
                      </button>

                      {managedPages.map(mp => (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => setSelectedPostingPageId(mp.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            selectedPostingPageId === mp.id
                              ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                              : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                          }`}
                        >
                          <img
                            src={mp.avatar_url}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{mp.name}</span>
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

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
                    onChange={e => {
                      const val = e.target.value;
                      setPostImageUrl(val);
                      if (StorageService.isFacebookUrl(val) || Boolean(StorageService.extractYoutubeId(val)) || Boolean(val.match(/\.(mp4|webm|mov)(\?.*)?$/i))) {
                        setMediaType('video');
                      }
                    }}
                    placeholder="Paste image or Facebook / YouTube video link (https://...)"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                  />
                  {postImageUrl && (
                    <div className="rounded-lg overflow-hidden border border-border max-h-52 bg-black flex items-center justify-center">
                      {StorageService.isFacebookUrl(postImageUrl) ? (
                        <FacebookStreamPlayer
                          embedUrl={StorageService.getStreamEmbedInfo(postImageUrl).embedUrl}
                          directUrl={StorageService.getStreamEmbedInfo(postImageUrl).facebookDirectUrl || postImageUrl}
                          title="Facebook Video Preview"
                          className="w-full max-h-52"
                        />
                      ) : StorageService.extractYoutubeId(postImageUrl) ? (
                        <iframe
                          src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(postImageUrl)!)}
                          title="YouTube Video Preview"
                          className="w-full aspect-video border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : (
                        <img src={postImageUrl} alt="Preview" className="w-full object-cover max-h-52" />
                      )}
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
                  <div className="w-9 h-9 rounded-full p-[1px] bg-primary">
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
              <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-bold font-mono">
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
                      undefined
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
                      undefined
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
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-2xl animate-in zoom-in-95 max-h-[60vh] overflow-y-auto">
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

              {/* Story Photo Selected or Local File Picker */}

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
                  disabled={!newStoryImageUrl || isUploadingStory}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 ${isUploadingStory ? 'animate-pulse' : ''}`} />
                  <span>{isUploadingStory ? 'Uploading to Cloud...' : 'Share Story'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTAGRAM LIKES MODAL (Real Accounts List) */}
      {activeLikesModalPost && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden shadow-xl max-h-[60vh] flex flex-col">
            <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0">
              <span className="font-bold text-sm text-foreground">Likes</span>
              <button
                onClick={() => setActiveLikesModalPost(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
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
          <div className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden shadow-xl divide-y divide-border text-center text-xs max-h-[60vh] overflow-y-auto">
            <button
              onClick={() => {
                handleSharePostWhatsApp(selectedPostOptions);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-secondary/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Share to WhatsApp</span>
            </button>
            <button
              onClick={() => {
                handleToggleSavePost(selectedPostOptions.id);
                setSelectedPostOptions(null);
              }}
              className="w-full py-3.5 font-semibold text-foreground hover:bg-secondary/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savedPosts[selectedPostOptions.id] ? 'Remove from Saved' : 'Save Post'}</span>
            </button>
            {(() => {
              const isPostAuthor = (Boolean(selectedPostOptions.user_id) && selectedPostOptions.user_id === currentUser.id) ||
                                   (Boolean(selectedPostOptions.user_handle) && selectedPostOptions.user_handle === currentUser.handle) ||
                                   (Boolean(selectedPostOptions.page_id) && StorageService.getPages().some(p => p.id === selectedPostOptions.page_id && (p.creator_id === currentUser.id || p.admin_ids?.includes(currentUser.id))));
              const isModOrAdmin = isAdminOrDev || currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'developer' || (currentUser.role as string) === 'moderator' || (currentUser.role as string) === 'mod' || canModeratePosts;
              const canManagePost = isPostAuthor || isModOrAdmin;

              if (!canManagePost) return null;

              return (
                <>
                  <button
                    onClick={() => {
                      setPostToEditImage(selectedPostOptions);
                      setSelectedPostOptions(null);
                    }}
                    className="w-full py-3.5 font-semibold text-primary hover:bg-secondary/60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Change Post Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this post from the community feed?')) {
                        StorageService.deleteTestimony(selectedPostOptions.id);
                        setTestimonyList(StorageService.getTestimonies());
                        setSelectedPostOptions(null);
                        if (onRefreshData) onRefreshData();
                      }
                    }}
                    className="w-full py-3.5 font-bold text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                </>
              );
            })()}
            <button
              onClick={() => setSelectedPostOptions(null)}
              className="w-full py-3.5 font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/60 cursor-pointer"
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
        onOpenDirectChat={(targetId) => {
          const profileId = profileModalUserId;
          setShowProfileModal(false);
          if (onOpenDirectChat) {
            onOpenDirectChat(targetId, profileId || undefined);
          }
        }}
      />

      {/* WhatsApp Visual Share Modal (Mobile Responsive - Zero Screen Overlap) */}
      <WhatsAppShareModal
        post={shareModalPost}
        isOpen={Boolean(shareModalPost)}
        onClose={() => setShareModalPost(null)}
      />

      {/* Church Page View Modal (Instagram-style profile view for ministries & pages) */}
      {selectedViewChurchPage && (
        <ChurchPageViewModal
          page={selectedViewChurchPage}
          currentUser={currentUser || StorageService.getCurrentUser()}
          onClose={() => setSelectedViewChurchPage(null)}
          onUpdatePage={(updated) => {
            setSelectedViewChurchPage(updated);
            setTestimonyList(StorageService.getTestimonies());
          }}
        />
      )}

      {/* EVENT CREATION & EDITING MODAL (Admin & Dev Governance) */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl my-auto max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground font-serif-church">
                    {editingEvent ? 'Edit Church Event' : 'Schedule Church / Mentorship Event'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Admin & Developer Governance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. International School of Mentorship - Masterclass"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as any })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Seminar">Seminar</option>
                    <option value="School of Mentorship">School of Mentorship</option>
                    <option value="Sunday Service">Sunday Service</option>
                    <option value="Wednesday Service">Wednesday Service</option>
                    <option value="Youth Ignite">Youth Ignite</option>
                    <option value="All-Night Prayer">All-Night Prayer</option>
                    <option value="Cell Rally">Cell Rally</option>
                    <option value="Fellowship">Fellowship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Minister / Speaker</label>
                  <input
                    type="text"
                    value={eventForm.speaker}
                    onChange={(e) => setEventForm({ ...eventForm, speaker: e.target.value })}
                    placeholder="Apostle Joe Daniels"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Date</label>
                  <input
                    type="text"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    placeholder="e.g. Every Saturday / 24 Oct 2026"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Time</label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="e.g. 18:00 - 20:00 CAT"
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g. Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Banner Poster Image</label>
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                  {[
                    { label: 'Preach', url: '/assets/apostle_joe_daniels_preach.jpg' },
                    { label: 'Mentorship/Grad', url: '/assets/apostle_grad_dark_1788354117156.jpg' },
                    { label: 'Podcast', url: '/assets/apostle_joe_daniels_podcast.jpg' },
                    { label: 'Cathedral Main', url: '/assets/apostle_joe_daniels_main.jpg' }
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, banner_url: preset.url })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-all border ${
                        eventForm.banner_url === preset.url
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary border-border text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={eventForm.banner_url}
                  onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                  placeholder="Image URL..."
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground font-mono text-[11px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Description / Key Focus</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Details about this gathering, mentorship topic, or service order..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm transition-all"
                >
                  {editingEvent ? 'Update Event' : 'Save & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paynow Billing Modal for Paid Cell Groups */}
      {selectedPaidGroupForBilling && (
        <PaidGroupBillingModal
          isOpen={!!selectedPaidGroupForBilling}
          onClose={() => setSelectedPaidGroupForBilling(null)}
          group={selectedPaidGroupForBilling}
          currentUser={currentUser}
          onJoinSuccess={(groupId) => {
            setSelectedPaidGroupForBilling(null);
            setGroupList(StorageService.getGroups(currentUser?.id));
            if (onOpenGroupChat) {
              onOpenGroupChat(groupId);
            }
          }}
        />
      )}

    </div>
  );
};




