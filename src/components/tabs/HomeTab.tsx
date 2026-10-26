import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Share2, 
  Flame, 
  Heart, 
  Sparkles, 
  MessageSquare, 
  Headphones, 
  Tv, 
  BookOpen, 
  Send,
  Calendar,
  Clock,
  ChevronRight,
  Gift,
  CheckCircle2,
  ExternalLink,
  X,
  Users,
  Bookmark,
  MoreHorizontal,
  Plus,
  Crown,
  Search,
  ArrowRight,
  ShieldCheck,
  Globe,
  Trash2,
  Image as ImageIcon,
  Smile,
  Video,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sermon, Devotional, Testimony, User, CommunityStory, PostComment } from '../../types';
import { StorageService, TopVideoComment } from '../../services/storageService';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PaidBookingModal } from '../modals/PaidBookingModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';
import { YouTubeStyleVideoPlayer } from '../common/YouTubeStyleVideoPlayer';
import { cn } from '../../lib/utils';
import { SupabaseSyncService } from '../../services/supabaseSyncService';
import { liveSyncService } from '../../services/liveSyncService';

interface HomeTabProps {
  sermons: Sermon[];
  devotionals: Devotional[];
  testimonies?: Testimony[];
  lowDataMode: boolean;
  currentUser?: User | null;
  onRequireAuth?: () => void;
  onOpenPremiumModal?: (sermon?: Sermon) => void;
  onNavigateToBible?: (reference?: string) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenLiveModal?: () => void;
  onOpenDevConsole?: () => void;
  onOpenAdminPanel?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  sermons,
  devotionals,
  testimonies: initialTestimonies,
  lowDataMode,
  currentUser: initialUser,
  onRequireAuth = () => {},
  onOpenPremiumModal,
  onNavigateToBible = (_reference?: string) => {},
  onNavigateTab = (_tab?: any) => {},
  onOpenLiveModal = () => {},
  onOpenDevConsole,
  onOpenAdminPanel,
}) => {
  // Current active user
  const [currentUserState, setCurrentUserState] = useState<User>(() => initialUser || StorageService.getCurrentUser() || ({} as User));
  const activeUser = currentUserState?.id ? currentUserState : StorageService.getCurrentUser();
  const isGuest = !activeUser || activeUser.role === 'guest' || activeUser.id.startsWith('usr_guest');

  // Real-time app data
  const [feedPosts, setFeedPosts] = useState<Testimony[]>(() => StorageService.getTestimonies());
  const [realStories, setRealStories] = useState<CommunityStory[]>(() => StorageService.getSortedStories(activeUser?.id));
  const [activeStory, setActiveStory] = useState<CommunityStory | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);

  // Top Video Visibility (Persisted in AppSettings / StorageService, HIDDEN BY DEFAULT)
  const [showHomeTopVideo, setShowHomeTopVideo] = useState<boolean>(() => StorageService.getShowHomeTopVideo());
  const [liveSermonStatus, setLiveSermonStatus] = useState(() => StorageService.getLiveSermonStatus());
  const [overridePlayingVideo, setOverridePlayingVideo] = useState(() => StorageService.getOverridePlayingVideo());

  // Post Composer State
  const [showComposerModal, setShowComposerModal] = useState<boolean>(false);
  const [composerTitle, setComposerTitle] = useState<string>('');
  const [composerContent, setComposerContent] = useState<string>('');
  const [composerCategory, setComposerCategory] = useState<string>('Apostolic Word');
  const [composerScripture, setComposerScripture] = useState<string>('');
  const [composerImageUrl, setComposerImageUrl] = useState<string>('');
  const [composerVideoUrl, setComposerVideoUrl] = useState<string>('');
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);
  const composerImageFileInputRef = useRef<HTMLInputElement>(null);

  // Comment expansion state: postId -> boolean
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Active post menu dropdown: postId -> boolean
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [activePlayingFeedId, setActivePlayingFeedId] = useState<string | null>(null);

  // Modals
  const [showPaidBookingModal, setShowPaidBookingModal] = useState<boolean>(false);
  const [showBadgeUpgradeModal, setShowBadgeUpgradeModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Facebook Live Stream & Interaction State (Facebook Live Clone)
  const [liveComments, setLiveComments] = useState<TopVideoComment[]>(() => StorageService.getTopVideoComments());
  const [liveCommentInput, setLiveCommentInput] = useState<string>('');
  const [liveReactionsCount, setLiveReactionsCount] = useState<number>(348);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [showCommentsSection, setShowCommentsSection] = useState<boolean>(true);
  const [replyToUser, setReplyToUser] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleLiveReaction = (emoji: string) => {
    setUserReaction(emoji);
    setShowReactionPicker(false);
    setLiveReactionsCount(prev => prev + 1);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
    try {
      liveSyncService.broadcastEvent({
        type: 'stream_reaction',
        payload: { emoji, user_name: activeUser?.full_name || 'A believer' }
      });
    } catch {}
  };

  const handleLikeComment = (commentId: string) => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const currentUid = activeUser?.id || 'guest_user';
    const res = StorageService.likeTopVideoComment(commentId, currentUid);
    setLiveComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      likes: res.likes,
      liked_by: res.isLiked ? [...(c.liked_by || []), currentUid] : (c.liked_by || []).filter(id => id !== currentUid)
    } : c));
    try {
      liveSyncService.broadcastEvent({
        type: 'stream_like',
        payload: { commentId, userId: currentUid }
      });
    } catch {}
  };

  const handleReplyComment = (userName: string) => {
    setReplyToUser(userName);
    setLiveCommentInput(`@${userName} `);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  const handleSendLiveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const txt = liveCommentInput.trim();
    if (!txt) return;
    const newComment: TopVideoComment = {
      id: `top_c_${Date.now()}`,
      user_id: activeUser?.id,
      user_name: activeUser?.full_name || 'Church Believer',
      user_avatar: activeUser?.avatar_url,
      badge_type: activeUser?.badge_type || 'none',
      role: activeUser?.role || 'member',
      text: txt,
      likes: 0,
      liked_by: [],
      reply_to: replyToUser || undefined,
      created_at: new Date().toISOString()
    };
    StorageService.addTopVideoComment(newComment, true);
    setLiveComments(prev => [...prev, newComment]);
    setLiveCommentInput('');
    setReplyToUser(null);
    try {
      liveSyncService.broadcastEvent({
        type: 'stream_chat',
        payload: newComment
      });
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync event listeners
  useEffect(() => {
    const handleUserUpdate = () => {
      const u = StorageService.getCurrentUser();
      if (u) setCurrentUserState(u);
    };

    const handleFeedUpdate = () => {
      setFeedPosts(StorageService.getTestimonies());
    };

    const handleTopVideoSetting = () => {
      setShowHomeTopVideo(StorageService.getShowHomeTopVideo());
      setOverridePlayingVideo(StorageService.getOverridePlayingVideo());
    };

    const handleLiveStatus = () => {
      setLiveSermonStatus(StorageService.getLiveSermonStatus());
      setOverridePlayingVideo(StorageService.getOverridePlayingVideo());
      setShowHomeTopVideo(StorageService.getShowHomeTopVideo());
    };

    const handleStoriesUpdate = () => {
      setRealStories(StorageService.getSortedStories(activeUser?.id));
    };

    const handleStreamChat = (e: Event) => {
      const comment = (e as CustomEvent).detail as TopVideoComment;
      if (comment && comment.id) {
        setLiveComments(prev => {
          if (prev.some(c => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };

    const handleStreamCommentsUpdated = (e: Event) => {
      const list = (e as CustomEvent).detail;
      if (Array.isArray(list)) {
        setLiveComments(list);
      }
    };

    const handleStreamReaction = () => {
      setLiveReactionsCount(prev => prev + 1);
    };

    window.addEventListener('gcz_user_updated', handleUserUpdate);
    window.addEventListener('gcz_user_profile_updated', handleUserUpdate);
    window.addEventListener('gcz_testimony_updated', handleFeedUpdate);
    window.addEventListener('gcz_show_home_top_video_updated', handleTopVideoSetting);
    window.addEventListener('gcz_live_sermon_updated', handleLiveStatus);
    window.addEventListener('gcz_override_video_updated', handleLiveStatus);
    window.addEventListener('gcz_story_updated', handleStoriesUpdate);
    window.addEventListener('gcz_stream_chat_received', handleStreamChat);
    window.addEventListener('gcz_top_video_comments_updated', handleStreamCommentsUpdated);
    window.addEventListener('gcz_stream_reaction_received', handleStreamReaction);

    return () => {
      window.removeEventListener('gcz_user_updated', handleUserUpdate);
      window.removeEventListener('gcz_user_profile_updated', handleUserUpdate);
      window.removeEventListener('gcz_testimony_updated', handleFeedUpdate);
      window.removeEventListener('gcz_show_home_top_video_updated', handleTopVideoSetting);
      window.removeEventListener('gcz_live_sermon_updated', handleLiveStatus);
      window.removeEventListener('gcz_override_video_updated', handleLiveStatus);
      window.removeEventListener('gcz_story_updated', handleStoriesUpdate);
      window.removeEventListener('gcz_stream_chat_received', handleStreamChat);
      window.removeEventListener('gcz_top_video_comments_updated', handleStreamCommentsUpdated);
      window.removeEventListener('gcz_stream_reaction_received', handleStreamReaction);
    };
  }, [activeUser?.id]);

  // Story Progress Timer
  useEffect(() => {
    if (!activeStory) {
      setStoryProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          setActiveStory(null);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStory]);

  // Handle Like Post
  const handleLikePost = (postId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const result = StorageService.likeTestimony(postId, activeUser?.id);
    setFeedPosts(StorageService.getTestimonies());
    if (result.user_liked) {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    }
  };

  // Handle Submit Comment
  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    StorageService.addCommentToTestimony(postId, text, activeUser);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setFeedPosts(StorageService.getTestimonies());
  };

  // Handle Delete Post
  const handleDeletePost = (postId: string) => {
    if (!window.confirm('Delete this post permanently from fellowship feed?')) return;
    StorageService.deleteTestimony(postId);
    setFeedPosts(StorageService.getTestimonies());
    setActiveMenuPostId(null);
    showToast('Post removed successfully.');
  };

  // Handle Share Post
  const handleSharePost = async (post: Testimony) => {
    const shareData = {
      title: post.title || 'Gateway Connect Fellowship Post',
      text: post.content || '',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard.writeText(`${post.title ? post.title + '\n' : ''}${post.content}\n\nShared via Joe Daniels Connect • Gateway Church`);
      showToast('Post content copied to clipboard!');
    }
  };

  // Handle Post Image File Upload (Converts to Base64/R2 URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setComposerImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Submit Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (!composerContent.trim() && !composerImageUrl) {
      alert('Please enter post content or upload a photo.');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const newPost = StorageService.submitTestimony({
        user_id: activeUser?.id || 'usr_guest',
        user_name: activeUser?.full_name || 'Church Member',
        user_handle: activeUser?.handle || `@${(activeUser?.full_name || 'member').toLowerCase().replace(/\s+/g, '_')}`,
        user_avatar: activeUser?.avatar_url || '/assets/apostle_joe_daniels_main.jpg',
        title: composerTitle.trim() || undefined,
        category: composerCategory,
        content: composerContent.trim(),
        scripture_tag: composerScripture.trim() || undefined,
        image_url: composerImageUrl || undefined,
        video_url: composerVideoUrl.trim() || undefined,
        created_at: new Date().toISOString()
      });

      setFeedPosts(StorageService.getTestimonies());
      setShowComposerModal(false);
      setComposerTitle('');
      setComposerContent('');
      setComposerScripture('');
      setComposerImageUrl('');
      setComposerVideoUrl('');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast('Post published to church fellowship feed!');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Relative Time Helper
  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Top Video Stream Embed Info (If Enabled)
  const getStreamTarget = () => {
    if (overridePlayingVideo?.video_url) return overridePlayingVideo.video_url;
    if (overridePlayingVideo?.youtube_id) {
      const yid = overridePlayingVideo.youtube_id;
      if (
        yid.startsWith('http://') || 
        yid.startsWith('https://') || 
        yid.startsWith('blob:') || 
        yid.startsWith('data:') || 
        /\.(mp4|webm|mov|mkv|m3u8)/i.test(yid)
      ) {
        return yid;
      }
      return `https://www.youtube.com/watch?v=${yid}`;
    }
    return liveSermonStatus.streamUrl || StorageService.getLiveStreamUrl() || 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP';
  };
  const currentStreamTarget = getStreamTarget();
  const streamEmbedInfo = StorageService.getStreamEmbedInfo(currentStreamTarget);
  const topVideoTitle = overridePlayingVideo?.title || liveSermonStatus.title || 'Gateway Cathedral Sunday Service';

  const userFirstName = activeUser?.full_name ? activeUser.full_name.split(' ')[0] : 'Believer';
  const currentDevotional = devotionals[0] || {
    title: 'Divine Remembrance',
    verse: 'Isaiah 49:16',
    scripture_text: 'Behold, I have graven thee upon the palms of my hands; thy walls are continually before me.',
    content: 'God has not forgotten you. In this season of supernatural acceleration, heaven is aligning every delayed blessing.',
    author: 'Apostle Joe Daniels'
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold border border-white/20 shadow-xl backdrop-blur-md animate-in fade-in duration-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP STORIES TRAY (FACEBOOK STYLE)                                      */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-3.5 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2.5 min-w-max">
          
          {/* Create Story Card */}
          <div 
            onClick={() => {
              if (isGuest) {
                onRequireAuth();
                return;
              }
              setShowComposerModal(true);
            }}
            className="w-24 sm:w-28 h-40 sm:h-44 rounded-xl border border-border bg-secondary/50 hover:bg-secondary/80 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group shrink-0 relative select-none"
          >
            <div className="h-28 overflow-hidden bg-primary/10 flex items-center justify-center">
              {activeUser?.avatar_url ? (
                <img 
                  src={activeUser.avatar_url} 
                  alt={activeUser.full_name || 'Me'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {userFirstName[0]}
                </span>
              )}
            </div>
            <div className="absolute top-24 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="p-2 pt-4 text-center bg-card">
              <span className="text-[11px] font-bold text-foreground leading-tight block truncate">
                Add to Story
              </span>
            </div>
          </div>

          {/* Official Ministry & Community Stories */}
          {realStories.map((story) => (
            <div
              key={story.id}
              onClick={() => {
                setActiveStory(story);
                setStoryProgress(0);
              }}
              className="w-24 sm:w-28 h-40 sm:h-44 rounded-xl border border-border bg-cover bg-center overflow-hidden relative cursor-pointer group shrink-0 shadow-xs hover:shadow-md transition-all select-none"
              style={{
                backgroundImage: story.media_url ? `url(${story.media_url})` : 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 group-hover:opacity-90 transition-opacity" />
              
              {/* Author Avatar Badge */}
              <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-primary to-blue-500 shadow-md">
                <img
                  src={story.author_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={story.author_name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>

              {/* Story Author Name */}
              <div className="absolute bottom-2 left-2 right-2 z-10">
                <span className="text-[11px] font-bold text-white drop-shadow-md leading-tight line-clamp-2">
                  {story.author_name}
                </span>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FACEBOOK-STYLE POST COMPOSER ("WHAT'S ON YOUR MIND?")                 */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
            {activeUser?.avatar_url ? (
              <img 
                src={activeUser.avatar_url} 
                alt={activeUser.full_name || 'Me'} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-foreground text-sm uppercase">
                {userFirstName[0]}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                onRequireAuth();
                return;
              }
              setShowComposerModal(true);
            }}
            className="flex-1 text-left bg-secondary/60 hover:bg-secondary border border-border rounded-full px-4 py-2.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer truncate"
          >
            What's on your heart to share with the church today, {userFirstName}?
          </button>
        </div>

        <div className="border-t border-border/70 pt-2.5 grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => onNavigateTab('sermons')}
            className="py-1.5 px-2 rounded-xl hover:bg-secondary text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Live / Sermons</span>
            <span className="sm:hidden">Sermons</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                onRequireAuth();
                return;
              }
              setShowComposerModal(true);
              setTimeout(() => composerImageFileInputRef.current?.click(), 100);
            }}
            className="py-1.5 px-2 rounded-xl hover:bg-secondary text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                onRequireAuth();
                return;
              }
              setComposerCategory('Testimony');
              setShowComposerModal(true);
            }}
            className="py-1.5 px-2 rounded-xl hover:bg-secondary text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Praise Report</span>
            <span className="sm:hidden">Testimony</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PLAYING ON TOP / LIVE VIDEO PLAYER (FACEBOOK LIVE CLONE ON FEED)       */}
      {/* ========================================================================= */}
      {(showHomeTopVideo || Boolean(overridePlayingVideo) || liveSermonStatus.isLive) && (
        <div id="home-facebook-live-player" className="bg-card border border-border rounded-2xl overflow-hidden shadow-md animate-in fade-in slide-in-from-top-2 duration-300 space-y-0">
          
          {/* Facebook Live Post Header */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3">
              {/* Apostle Avatar with live ring */}
              <div className="relative">
                <div className={`w-10 h-10 rounded-full p-[2px] ${liveSermonStatus.isLive ? 'bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse' : 'bg-border'}`}>
                  <img
                    src="/assets/apostle_joe_daniels_main.jpg"
                    alt="Apostle Joe Daniels"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                {liveSermonStatus.isLive ? (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-black text-[8px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                    LIVE
                  </span>
                ) : (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white/90 font-black text-[7px] px-1.5 py-0.2 rounded-full uppercase tracking-wider border border-white/20 shadow-xs whitespace-nowrap">
                    WAS LIVE
                  </span>
                )}
              </div>

              {/* Author name & Live status */}
              <div className="leading-snug">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-foreground hover:underline cursor-pointer">
                    Apostle Joe Daniels
                  </span>
                  <VerifiedBadge type="gold" />
                  <span className="text-xs text-muted-foreground">
                    {liveSermonStatus.isLive ? 'is live now' : 'was live'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {liveSermonStatus.isLive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                      LIVE NOW • 👁 {liveSermonStatus.viewerCount || 1420}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                      WAS LIVE
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Globe className="w-3 h-3 text-muted-foreground/70" />
                  </span>
                </div>
              </div>
            </div>

            {/* Close / Dismiss Video button */}
            <button
              type="button"
              onClick={() => {
                StorageService.setOverridePlayingVideo(null);
                StorageService.setShowHomeTopVideo(false);
                setShowHomeTopVideo(false);
                setOverridePlayingVideo(null);
              }}
              className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close Player"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stream Title Text */}
          <div className="px-3.5 sm:px-4 pt-2.5 pb-2">
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
              {topVideoTitle}
            </h3>
            {overridePlayingVideo?.series && (
              <p className="text-xs text-primary font-medium mt-0.5">
                {overridePlayingVideo.series}
              </p>
            )}
          </div>

          {/* Embedded Video Player */}
          <div className="relative aspect-video bg-black overflow-hidden shadow-inner flex items-center justify-center">
            {streamEmbedInfo.isFacebook ? (
              <FacebookStreamPlayer
                embedUrl={streamEmbedInfo.embedUrl || streamEmbedInfo.originalUrl}
                directUrl={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                title={topVideoTitle}
                isLive={liveSermonStatus.isLive}
              />
            ) : (streamEmbedInfo.isDirectVideo || streamEmbedInfo.isMp4 || streamEmbedInfo.platform === 'direct' || /\.(mp4|webm|mov|mkv|m3u8)(\?.*)?$/i.test(streamEmbedInfo.embedUrl || streamEmbedInfo.originalUrl || currentStreamTarget) || (currentStreamTarget && (currentStreamTarget.startsWith('blob:') || currentStreamTarget.startsWith('data:video/')))) ? (
              <YouTubeStyleVideoPlayer
                src={streamEmbedInfo.embedUrl || currentStreamTarget}
                fallbackSrc="https://youtu.be/-CibsaxijIk"
                poster={overridePlayingVideo?.thumbnail_url || liveSermonStatus.thumbnailUrl}
                title={topVideoTitle}
                isLive={liveSermonStatus.isLive}
              />
            ) : (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${streamEmbedInfo.videoId || '-CibsaxijIk'}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`}
                title={topVideoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>

          {/* Facebook Live Reaction Counts Bar */}
          <div className="px-3.5 sm:px-4 py-2 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex -space-x-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center shadow-xs">👍</span>
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center shadow-xs">❤️</span>
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center shadow-xs">🔥</span>
              </span>
              <span className="font-medium text-foreground/80">
                {liveReactionsCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>{liveComments.length} comments</span>
              <span>•</span>
              <span>84 shares</span>
            </div>
          </div>

          {/* Facebook Live Action Buttons (Like / Comment / Share) */}
          <div className="px-2 sm:px-4 py-1.5 flex items-center justify-around border-b border-border/40 relative">
            {/* Facebook Reactions Floating Popup */}
            {showReactionPicker && (
              <div 
                className="absolute -top-12 left-4 sm:left-6 z-30 bg-card border border-border shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-2 animate-in zoom-in-95 duration-150 backdrop-blur-md"
                onMouseLeave={() => setShowReactionPicker(false)}
              >
                {[
                  { key: 'like', emoji: '👍', label: 'Like' },
                  { key: 'love', emoji: '❤️', label: 'Love' },
                  { key: 'care', emoji: '🤗', label: 'Care' },
                  { key: 'haha', emoji: '😂', label: 'Haha' },
                  { key: 'wow', emoji: '😮', label: 'Wow' },
                  { key: 'sad', emoji: '😢', label: 'Sad' },
                  { key: 'angry', emoji: '😡', label: 'Angry' },
                ].map((reaction) => (
                  <button
                    key={reaction.key}
                    type="button"
                    onClick={() => handleLiveReaction(reaction.emoji)}
                    className="text-2xl hover:scale-130 active:scale-95 transition-transform cursor-pointer p-0.5"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleLiveReaction('👍')}
              onMouseEnter={() => setShowReactionPicker(true)}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-secondary transition-colors cursor-pointer ${
                userReaction ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-base">{userReaction || '👍'}</span>
              <span>{userReaction ? 'Reacted' : 'Like'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCommentsSection(prev => !prev)}
              className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comment</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: topVideoTitle, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Live link copied to clipboard!');
                }
              }}
              className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Real Facebook Live Comments Stream (Facebook UX Clone) */}
          {showCommentsSection && (
            <div className="bg-secondary/15 dark:bg-[#18191a]/40 p-3.5 sm:p-4 space-y-3 border-t border-border/40">
              {/* Header with Comments count & live badge */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  Live Church Comments ({liveComments.length})
                </span>
                <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>

              {/* Comments list with authentic Facebook bubbles */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {liveComments.map((c) => {
                  const isMe = Boolean(activeUser?.id && c.user_id === activeUser.id);
                  const isLikedByMe = Boolean(activeUser?.id && (c.liked_by || []).includes(activeUser.id));

                  const isApostleOrSuperAdmin = c.user_id === 'usr_apostle_joe' || c.user_name?.toLowerCase().includes('apostle joe daniels') || c.badge_type === 'gold';
                  const isPastorOrLeader = !isApostleOrSuperAdmin && (c.badge_type === 'blue' || c.role === 'pastor' || c.role === 'leader' || c.user_name?.toLowerCase().includes('pastor'));
                  const badgeType: 'gold' | 'blue' | null = isApostleOrSuperAdmin ? 'gold' : isPastorOrLeader ? 'blue' : null;

                  return (
                    <div key={c.id} className="flex items-start gap-2.5 text-xs group animate-in fade-in duration-150">
                      <img
                        src={c.user_avatar || '/assets/apostle_silhouette.svg'}
                        alt={c.user_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-border/40 shadow-2xs"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Facebook Comment Bubble */}
                        <div className="relative inline-block max-w-[95%] sm:max-w-[85%] bg-secondary/80 dark:bg-[#3a3b3c] border border-border/40 rounded-2xl sm:rounded-[18px] px-3.5 py-2 shadow-2xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[13px] text-foreground hover:underline cursor-pointer">
                              {c.user_name}
                            </span>
                            {badgeType && <VerifiedBadge type={badgeType} />}
                          </div>
                          <div className="text-foreground/90 text-[13px] leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                            {c.text}
                          </div>

                          {/* Floating Reaction Counter Badge on bottom-right corner of bubble */}
                          {c.likes > 0 && (
                            <div className="absolute -bottom-2 right-2 bg-card dark:bg-[#242526] border border-border/60 rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm text-[10px] font-bold text-foreground">
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">👍</span>
                              <span>{c.likes}</span>
                            </div>
                          )}
                        </div>

                        {/* Action bar below bubble: Time • Like • Reply */}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-semibold px-2 mt-1">
                          <span>{formatTimeAgo(c.created_at)}</span>
                          <button
                            type="button"
                            onClick={() => handleLikeComment(c.id)}
                            className={`hover:underline cursor-pointer transition-colors ${
                              isLikedByMe ? 'text-blue-600 dark:text-blue-400 font-bold' : 'hover:text-foreground'
                            }`}
                          >
                            {isLikedByMe ? 'Liked' : 'Like'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReplyComment(c.user_name)}
                            className="hover:underline hover:text-foreground cursor-pointer transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Replying banner */}
              {replyToUser && (
                <div className="flex items-center justify-between px-3 py-1 bg-primary/10 rounded-lg text-xs text-primary font-medium animate-in fade-in">
                  <span>Replying to <span className="font-bold">@{replyToUser}</span></span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyToUser(null);
                      setLiveCommentInput('');
                    }}
                    className="p-0.5 hover:bg-primary/20 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Praise Reactions Shortcut Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                <span className="text-[11px] text-muted-foreground font-medium shrink-0">Quick praise:</span>
                {[
                  { label: '🔥 Fire', emoji: '🔥' },
                  { label: '🙌 Amen', emoji: '🙌' },
                  { label: '❤️ Love', emoji: '❤️' },
                  { label: '✝️ Glory', emoji: '✝️' },
                  { label: '🙏 Pray', emoji: '🙏' }
                ].map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => {
                      setLiveCommentInput(prev => `${prev ? prev + ' ' : ''}${item.emoji}`);
                      commentInputRef.current?.focus();
                    }}
                    className="px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-[11px] font-semibold text-foreground shrink-0 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Add live comment form (Facebook Style) */}
              <form onSubmit={handleSendLiveComment} className="flex items-center gap-2 pt-1 border-t border-border/30">
                <img
                  src={activeUser?.avatar_url || '/assets/apostle_silhouette.svg'}
                  alt={activeUser?.full_name || 'Me'}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-border/40"
                />
                <div className="flex-1 relative flex items-center bg-secondary/80 dark:bg-[#3a3b3c] border border-border/60 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/40">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={liveCommentInput}
                    onChange={(e) => setLiveCommentInput(e.target.value)}
                    placeholder={`Write a comment as ${userFirstName}...`}
                    className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground pr-8"
                  />
                  <button
                    type="submit"
                    disabled={!liveCommentInput.trim()}
                    className="absolute right-1 p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs cursor-pointer"
                    title="Post Comment"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DAILY DEVOTIONAL BANNER WIDGET                                         */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider">
              TODAY'S DEVOTIONAL
            </span>
            <span className="text-xs font-bold text-foreground">
              {currentDevotional.verse}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToBible(currentDevotional.verse)}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Read Verse</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-xs italic text-foreground/80 font-serif-church border-l-2 border-primary/50 pl-3 py-0.5">
          "{currentDevotional.scripture_text}"
        </p>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {currentDevotional.content}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 5. FACEBOOK-STYLE FEED POST CARDS (REAL DATA ONLY)                        */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {feedPosts.length === 0 ? (
          /* Empty State when demo content was power-washed */
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="font-bold text-base text-foreground">
                Welcome to Gateway Church Fellowship!
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect and grow with brethren in Christ across the nations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isGuest) {
                  onRequireAuth();
                  return;
                }
                setShowComposerModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Share the First Testimony</span>
            </button>
          </div>
        ) : (
          feedPosts.map((post) => {
            const isAuthor = activeUser && activeUser.id === post.user_id;
            const isAdmin = activeUser && (activeUser.role === 'admin' || activeUser.role === 'super_admin' || activeUser.role === 'developer');
            const canDelete = isAuthor || isAdmin;
            const isCommentsOpen = Boolean(expandedComments[post.id]);
            const postComments: PostComment[] = post.comments || [];
            const likesCount = typeof post.likes_count === 'number' ? post.likes_count : 0;
            const isLiked = post.user_liked || (post.liked_user_ids || []).includes(activeUser?.id || '');

            return (
              <article 
                key={post.id} 
                className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden transition-all hover:border-border/80"
              >
                {/* Post Header */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                      <img
                        src={post.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={post.user_name || 'Member'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/apostle_joe_daniels_main.jpg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                          {post.user_name || 'Church Believer'}
                        </span>
                        <VerifiedBadge 
                          type={post.user_id === 'usr_apostle_joe' ? 'gold' : post.user_id === 'usr_developer' ? 'gold' : 'blue'} 
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{formatTimeAgo(post.created_at)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Globe className="w-3 h-3" />
                          <span>Public</span>
                        </span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-primary">{post.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Post Options Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {activeMenuPostId === post.id && (
                      <div className="absolute right-0 top-8 z-30 w-48 bg-card border border-border rounded-xl shadow-xl py-1 text-xs animate-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            handleSharePost(post);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-secondary flex items-center gap-2 text-foreground"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy Link / Share</span>
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full px-3 py-2 text-left hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-3.5 sm:px-4 pb-3 space-y-2.5">
                  {post.title && (
                    <h4 className="font-bold text-sm sm:text-base text-foreground">
                      {post.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                  {post.scripture_tag && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{post.scripture_tag}</span>
                    </div>
                  )}
                </div>

                {/* Media Attachment (Photo or YouTube Video) */}
                {post.image_url && (
                  <div className="relative max-h-[480px] bg-black/40 overflow-hidden border-t border-border/50">
                    <img
                      src={post.image_url}
                      alt={post.title || 'Fellowship image'}
                      className="w-full h-full object-contain max-h-[480px] mx-auto"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {post.youtube_id && !post.image_url && (
                  <div className="relative aspect-video bg-black overflow-hidden border-t border-border/50">
                    {activePlayingFeedId === post.id ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${post.youtube_id}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`}
                        title={post.title || 'Sermon Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div
                        onClick={() => setActivePlayingFeedId(post.id)}
                        className="relative w-full h-full cursor-pointer group"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${post.youtube_id}/hqdefault.jpg`}
                          alt={post.title || 'Video'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Engagement Metrics Summary */}
                <div className="px-3.5 sm:px-4 py-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center -space-x-1">
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                        👍
                      </span>
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                        ❤️
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold">{likesCount} likes</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="hover:underline cursor-pointer"
                    >
                      {postComments.length} {postComments.length === 1 ? 'comment' : 'comments'}
                    </button>
                    <span>•</span>
                    <span>1 share</span>
                  </div>
                </div>

                {/* Action Bar (Facebook 3-Button Row) */}
                <div className="border-t border-border/70 mx-3.5 sm:mx-4 py-1 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95",
                      isLiked 
                        ? "text-blue-500 font-bold bg-blue-500/10" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", isLiked && "fill-current text-blue-500")} />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Comment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSharePost(post)}
                    className="py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Expandable Comments Drawer */}
                {isCommentsOpen && (
                  <div className="border-t border-border/70 p-3.5 sm:p-4 bg-secondary/20 space-y-3">
                    
                    {/* Existing Comments */}
                    {postComments.length > 0 ? (
                      <div className="space-y-2.5">
                        {postComments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary border border-border shrink-0 mt-0.5">
                              <img
                                src={comment.user_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                                alt={comment.user_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 bg-secondary/80 border border-border/60 rounded-2xl p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">
                                  {comment.user_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-foreground/90">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground py-1">
                        No comments yet. Write the first encouraging word!
                      </p>
                    )}

                    {/* Inline Comment Composer */}
                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2 pt-1">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                        {activeUser?.avatar_url ? (
                          <img 
                            src={activeUser.avatar_url} 
                            alt={activeUser.full_name || 'Me'} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                            {userFirstName[0]}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder={isGuest ? "Sign in to write a comment..." : "Write a comment or praise..."}
                        disabled={isGuest}
                        className="flex-1 bg-secondary border border-border rounded-full px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isGuest || !commentInputs[post.id]?.trim()}
                        className="p-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                  </div>
                )}

              </article>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. POST COMPOSER MODAL (FULL FACEBOOK-STYLE CREATION DIALOG)             */}
      {/* ========================================================================= */}
      {showComposerModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowComposerModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-foreground animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Create Fellowship Post
              </h3>
              <button
                type="button"
                onClick={() => setShowComposerModal(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Row */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                <img
                  src={activeUser?.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={activeUser?.full_name || 'Me'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-foreground">
                  {activeUser?.full_name || 'Church Believer'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Globe className="w-3 h-3 text-primary" />
                  <span>Public Church Fellowship</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              {/* Optional Post Title */}
              <div>
                <input
                  type="text"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="Post Title (e.g. Supernatural Debt Clearance Testimony)"
                  className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary font-semibold"
                />
              </div>

              {/* Main Content Area */}
              <div>
                <textarea
                  rows={4}
                  required
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder={`What's on your heart to share with the saints, ${userFirstName}?`}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary resize-none"
                />
              </div>

              {/* Category & Scripture Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Category</label>
                  <select
                    value={composerCategory}
                    onChange={(e) => setComposerCategory(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl p-2 text-xs text-foreground focus:outline-hidden focus:border-primary"
                  >
                    <option value="Apostolic Word">Apostolic Word</option>
                    <option value="Testimony">Testimony / Praise</option>
                    <option value="Prophetic Decree">Prophetic Decree</option>
                    <option value="Prayer Petition">Prayer Petition</option>
                    <option value="Financial Breakthrough">Financial Breakthrough</option>
                    <option value="Faith & Healing">Faith & Healing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Scripture Reference</label>
                  <input
                    type="text"
                    value={composerScripture}
                    onChange={(e) => setComposerScripture(e.target.value)}
                    placeholder="e.g. Amos 9:13"
                    className="w-full bg-secondary border border-border rounded-xl p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              {/* Image Preview if uploaded */}
              {composerImageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-border max-h-48 bg-black/40">
                  <img src={composerImageUrl} alt="Upload preview" className="w-full h-full object-contain max-h-48" />
                  <button
                    type="button"
                    onClick={() => setComposerImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Media Upload Buttons */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Add to your post:</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={composerImageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => composerImageFileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Attach Photo"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmittingPost}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingPost ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <span>Post to Fellowship</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. STORY VIEWER MODAL                                                     */}
      {/* ========================================================================= */}
      {activeStory && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
          onClick={() => setActiveStory(null)}
        >
          <div 
            className="relative w-full max-w-sm h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-white/10 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: activeStory.media_url ? `url(${activeStory.media_url})` : 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Top Progress Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1">
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100" 
                  style={{ width: `${storyProgress}%` }}
                />
              </div>
            </div>

            {/* Top Author Header */}
            <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <img
                  src={activeStory.author_avatar || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={activeStory.author_name}
                  className="w-8 h-8 rounded-full object-cover border border-white/40"
                />
                <div>
                  <div className="font-bold text-xs drop-shadow-sm">{activeStory.author_name}</div>
                  <div className="text-[10px] text-white/70 drop-shadow-sm">{formatTimeAgo(activeStory.created_at)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                className="p-1 rounded-full bg-black/40 hover:bg-black/70 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Story Text */}
            {activeStory.caption && (
              <div className="absolute bottom-6 left-3 right-3 z-30 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs leading-relaxed border border-white/15">
                {activeStory.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking & Upgrade Modals */}
      <PaidBookingModal
        isOpen={showPaidBookingModal}
        onClose={() => setShowPaidBookingModal(false)}
      />

      {activeUser && (
        <UpgradeModal
          isOpen={showBadgeUpgradeModal}
          onClose={() => setShowBadgeUpgradeModal(false)}
          currentUser={activeUser}
          onUpdateUser={(updated) => {
            setCurrentUserState(updated);
            setShowBadgeUpgradeModal(false);
          }}
        />
      )}

    </div>
  );
};
