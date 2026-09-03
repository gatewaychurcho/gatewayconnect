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
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommunityGroup, PrayerRequest, ChurchEvent, Testimony, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { ImagePickerModal } from '../modals/ImagePickerModal';
import { VerifiedBadge } from '../common/VerifiedBadge';

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

  // Per-post WhatsApp reaction state
  const [postReactions, setPostReactions] = useState<Record<string, Record<string, number>>>({
    post_apostle_preaching: { '👍': 142, '❤️': 210, '🙏': 384, '🔥': 290, '👏': 165 },
    post_apostle_podcast: { '👍': 98, '❤️': 120, '🙏': 245, '🔥': 180, '👏': 88 },
    post_apostle_grad: { '👍': 180, '❤️': 320, '🙏': 512, '🔥': 240, '👏': 310 },
    post_apostle_welcome: { '👍': 110, '❤️': 290, '🙏': 420, '🔥': 150, '👏': 195 },
    test_1: { '👍': 45, '❤️': 89, '🙏': 120, '🔥': 75, '👏': 50 },
    test_2: { '👍': 60, '❤️': 142, '🙏': 190, '🔥': 95, '👏': 70 }
  });
  const [userPostReactions, setUserPostReactions] = useState<Record<string, Record<string, boolean>>>({});
  
  // Per-post Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [postCommentsMap, setPostCommentsMap] = useState<Record<string, Array<{ id: string; user: string; text: string; time: string }>>>({
    post_apostle_preaching: [
      { id: 'c1', user: 'Pastor Tendai Moyo', text: 'Amen Apostle! Divine speed is our portion this season!', time: '10:15 AM' },
      { id: 'c2', user: 'Tinashe Chikwava', text: 'I receive it with my whole heart. Stagnation is broken!', time: '11:00 AM' }
    ],
    post_apostle_grad: [
      { id: 'c3', user: 'Elder Sibanda', text: 'Congratulations Apostle! God’s wisdom is evident upon your life.', time: 'Yesterday' }
    ]
  });
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

    const currUser = StorageService.getCurrentUser();
    const finalImage = postImageUrl || localImagePreview || '/assets/apostle_joe_daniels_main.jpg';

    const newPost: Testimony = {
      id: `post_${Date.now()}`,
      user_name: currUser.full_name || 'Covenant Partner',
      user_avatar: currUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
      title: postTitle.trim() || 'Supernatural Miracle Testimony',
      category: postCategory,
      content: postContent.trim(),
      image_url: finalImage,
      scripture_tag: postScriptureTag.trim() || undefined,
      date: 'Just Now',
      likes_count: 1,
      verified_by_church: true,
      user_liked: true,
      comments_count: 0
    };

    StorageService.submitTestimony(newPost);
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

  const handleEmojiReaction = (postId: string, emoji: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const defaultReactions = { '👍': 40, '❤️': 85, '🙏': 130, '🔥': 65, '👏': 45 };
    const currentPostReactions = postReactions[postId] || defaultReactions;
    const alreadyReacted = userPostReactions[postId]?.[emoji] || false;
    
    setPostReactions(prev => ({
      ...prev,
      [postId]: {
        ...currentPostReactions,
        [emoji]: Math.max(0, (currentPostReactions[emoji] || 0) + (alreadyReacted ? -1 : 1))
      }
    }));

    setUserPostReactions(prev => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        [emoji]: !alreadyReacted
      }
    }));

    if (!alreadyReacted) {
      confetti({
        particleCount: 15,
        spread: 35,
        origin: { y: 0.7 }
      });
    }
  };

  const handleToggleComments = (postId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const text = commentInputMap[postId]?.trim();
    if (!text) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      user: currentUser.full_name || 'Covenant Member',
      text,
      time: 'Just Now'
    };

    setPostCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    setCommentInputMap(prev => ({
      ...prev,
      [postId]: ''
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
          
          {/* Create Post Bar */}
          <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/apostle_joe_daniels_main.jpg"
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
              className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
          </div>

          {/* Posts Feed Cards (Instagram Style) */}
          <div className="space-y-4">
            {testimonyList.map(post => {
              const isApostlePost = post.user_name.toLowerCase().includes('daniels') || post.user_name.toLowerCase().includes('apostle');
              const postReactionsObj = postReactions[post.id] || { '👍': 40, '❤️': 85, '🙏': 130, '🔥': 65, '👏': 45 };
              const postComments = postCommentsMap[post.id] || [];

              return (
                <article
                  key={post.id}
                  className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-md transition-all"
                >
                  {/* Post Header */}
                  <div className="p-3.5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={post.user_name}
                        className="w-9 h-9 rounded-full object-cover border border-[#D4AF37]/40"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white">{post.user_name}</span>
                          {(post.verified_by_church || isApostlePost) && (
                            <VerifiedBadge type="gold" size="xs" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/50">
                          <span>{post.date}</span>
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
                    </div>
                  </div>

                  {/* Post Media (Image) with Mr Daniels Direct Change Overlay */}
                  {post.image_url ? (
                    <div className="w-full bg-black/40 flex items-center justify-center max-h-[420px] overflow-hidden relative group">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full object-cover max-h-[420px]"
                      />
                      
                      {/* Photo update button overlay for Mr Daniels */}
                      {isMrDaniels && (
                        <button
                          onClick={() => setPostToEditImage(post)}
                          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-[#D4AF37] hover:text-[#001F3F] text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 border border-white/20 shadow-lg transition-all"
                          title="Change post image"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      )}
                    </div>
                  ) : null}

                  {/* Post Actions & Content */}
                  <div className="p-3.5 space-y-3">
                    {/* Post Title & Text */}
                    <div>
                      {post.title && (
                        <h4 className="font-bold text-xs sm:text-sm text-white mb-1">
                          {post.title}
                        </h4>
                      )}
                      <p className="text-xs text-white/80 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* WhatsApp Channel Style Reactions & Chat Icon Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2 overflow-x-auto pb-1">
                      {/* WhatsApp Emoji Reactions (👍 ❤️ 🙏 🔥 👏) */}
                      <div className="flex items-center gap-1.5">
                        {(['👍', '❤️', '🙏', '🔥', '👏'] as const).map(emoji => {
                          const count = postReactionsObj[emoji] || 0;
                          const isReacted = userPostReactions[post.id]?.[emoji] || false;
                          return (
                            <button
                              key={emoji}
                              id={`reaction-${post.id}-${emoji}`}
                              onClick={() => handleEmojiReaction(post.id, emoji)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                                isReacted
                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                                  : 'bg-white/5 border-white/10 hover:border-[#D4AF37]/40 text-white/80'
                              }`}
                            >
                              <span className="text-sm leading-none">{emoji}</span>
                              <span className="text-[11px] text-white/60 font-mono">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Chat Icon & Share */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          id={`btn-toggle-comments-${post.id}`}
                          onClick={() => handleToggleComments(post.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                            expandedComments[post.id]
                              ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] font-bold shadow-md'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-white'
                          }`}
                          title="View & post comments"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{postComments.length} Comments</span>
                        </button>

                        <button
                          onClick={() => handleSharePostWhatsApp(post)}
                          className="p-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-all shadow-md"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Comments Section */}
                    {expandedComments[post.id] && (
                      <div className="bg-[#001122]/90 rounded-xl p-3 border border-white/10 space-y-2.5 mt-2">
                        <div className="flex items-center justify-between text-xs text-white/50 pb-1 border-b border-white/5">
                          <span>Comments ({postComments.length})</span>
                          {isGuest && <span className="text-amber-400">Sign in to leave a comment</span>}
                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                          {postComments.length === 0 ? (
                            <p className="text-[11px] text-white/40 italic py-1">Be the first to leave a comment or agreement in prayer.</p>
                          ) : (
                            postComments.map((comm) => (
                              <div key={comm.id} className="text-xs bg-[#001F3F]/50 p-2 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#D4AF37]">{comm.user}</span>
                                  <span className="text-[10px] text-white/40">{comm.time}</span>
                                </div>
                                <p className="text-white/80 mt-0.5">{comm.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2 pt-1.5 border-t border-white/10">
                          <input
                            type="text"
                            value={commentInputMap[post.id] || ''}
                            onChange={(e) => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder={isGuest ? "Sign in to join the conversation..." : "Write a comment..."}
                            disabled={isGuest}
                            className="flex-1 bg-[#001F3F] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={isGuest}
                            className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5c158] text-[#001F3F] rounded-xl text-xs font-bold flex items-center gap-1 shadow disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>Post</span>
                          </button>
                        </form>
                      </div>
                    )}

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

    </div>
  );
};
