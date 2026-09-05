import React, { useState, useRef } from 'react';
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
  QrCode, 
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
  Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, PrayerRequest, ChurchEvent, Testimony, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { INITIAL_USERS } from '../../data/mockData';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { formatTimeAgo } from '../../utils/timeAgo';

interface CommunityTabProps {
  groups: CommunityGroup[];
  prayers: PrayerRequest[];
  events: ChurchEvent[];
  testimonies?: Testimony[];
  currentUser?: User;
  onRequireAuth?: () => void;
  onRefreshData?: () => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  groups,
  prayers,
  events,
  testimonies: initialTestimonies,
  currentUser = StorageService.getCurrentUser(),
  onRequireAuth = () => {},
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'prayers' | 'groups' | 'events'>('feed');
  const [testimonyList, setTestimonyList] = useState<Testimony[]>(
    initialTestimonies && initialTestimonies.length > 0 
      ? initialTestimonies 
      : StorageService.getTestimonies()
  );
  const [prayerList, setPrayerList] = useState<PrayerRequest[]>(prayers);
  const [groupList, setGroupList] = useState<CommunityGroup[]>(groups);
  const [eventList, setEventList] = useState<ChurchEvent[]>(events);
  
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
  const [followingUsers, setFollowingUsers] = useState<Record<string, boolean>>({
    usr_apostle_joe: true,
    usr_pastor_tendai: true,
    usr_pastor_grace: true
  });
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [selectedPostOptions, setSelectedPostOptions] = useState<Testimony | null>(null);
  
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

  // QR Code Pass Modal for Events
  const [activeEventQr, setActiveEventQr] = useState<ChurchEvent | null>(null);

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
    setFollowingUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
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
    StorageService.toggleGroupJoin(groupId);
    setGroupList(StorageService.getGroups());
  };

  const handleToggleRsvp = (eventId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.toggleEventRsvp(eventId);
    setEventList(StorageService.getEvents());
    confetti({
      particleCount: 25,
      spread: 60
    });
  };

  const handleSharePostWhatsApp = (item: Testimony) => {
    const text = `🙏 *Gateway Church Zimbabwe - Kingdom Post*\n*${item.title}*\n"${item.content}"\n\nRead more on the Gateway Connect App!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

      {/* 2. SUB-TAB: INSTAGRAM STYLE FEED & POSTS */}
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 to-rose-500">
                        <img
                          src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                          alt={post.user_name}
                          className="w-full h-full rounded-full object-cover border border-[#001F3F]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white">{post.user_name}</span>
                          {(post.verified_by_church || isApostlePost) && (
                            <VerifiedBadge type="gold" size="xs" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                          <span>{post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(post.created_at || post.date, 'short')}</span>
                          <span>•</span>
                          <span className="text-[#D4AF37] font-medium">{post.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.scripture_tag && (
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold">
                          {post.scripture_tag}
                        </span>
                      )}

                      {/* Photo Update button - STRICTLY for Mr. Daniels account only */}
                      {isMrDaniels && (
                        <button
                          onClick={() => setPostToEditImage(post)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#D4AF37] hover:text-[#001F3F] text-white/80 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                          title="Apostle Joe Daniels: Update post photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{post.image_url ? 'Change Photo' : '+ Add Photo'}</span>
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

                    {/* Post Caption (Handle + Title + Content) */}
                    <div className="text-xs text-white/90 leading-relaxed">
                      <span className="font-bold text-white mr-1.5">
                        {post.user_handle || `@${post.user_name.toLowerCase().replace(/\s+/g, '_')}`}
                      </span>
                      {post.title && <span className="font-semibold text-[#D4AF37] mr-1">{post.title} —</span>}
                      <span>{post.content}</span>
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

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-white/60">
                    Leader: <strong className="text-white">{group.leader_name}</strong>
                  </div>
                  <button
                    onClick={() => handleToggleGroup(group.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      group.joined
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#D4AF37] text-[#001F3F]'
                    }`}
                  >
                    {group.joined ? '✓ Joined Group' : 'Join Group'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: EVENTS & RSVP */}
      {activeSubTab === 'events' && (
        <div className="space-y-3">
          {eventList.map(event => (
            <div
              key={event.id}
              className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row"
            >
              <img
                src={event.banner_url}
                alt={event.title}
                className="w-full md:w-48 h-36 object-cover"
              />
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase">{event.category}</span>
                    <span className="text-[11px] text-white/50">{event.rsvp_count} Attending</span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-1">{event.title}</h4>
                  <p className="text-xs text-white/70 line-clamp-2 mt-1">{event.description}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {event.date} • {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {event.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-white/60">Minister: <strong className="text-white">{event.speaker}</strong></span>
                  <div className="flex items-center gap-2">
                    {event.user_rsvpd && (
                      <button
                        onClick={() => setActiveEventQr(event)}
                        className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                        title="View Gate Pass"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleRsvp(event.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        event.user_rsvpd
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#D4AF37] text-[#001F3F]'
                      }`}
                    >
                      {event.user_rsvpd ? '✓ RSVP Confirmed' : 'RSVP Free Seat'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

      {/* MODAL: EVENT QR PASS */}
      {activeEventQr && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-5 w-full max-w-xs text-center space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-[#D4AF37]">{activeEventQr.title}</h3>
            <p className="text-xs text-white/70">{activeEventQr.date} • {activeEventQr.location}</p>
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              <QrCode className="w-36 h-36 text-black" />
            </div>
            <p className="text-[11px] text-white/50">Show this QR Gate Pass at entrance.</p>
            <button
              onClick={() => setActiveEventQr(null)}
              className="w-full py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20"
            >
              Close
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

    </div>
  );
};
