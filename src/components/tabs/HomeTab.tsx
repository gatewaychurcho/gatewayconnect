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
import { StorageService } from '../../services/storageService';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PaidBookingModal } from '../modals/PaidBookingModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';
import { cn } from '../../lib/utils';
import { SupabaseSyncService } from '../../services/supabaseSyncService';

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
  onNavigateToBible = () => {},
  onNavigateTab = () => {},
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

  // Modals
  const [showPaidBookingModal, setShowPaidBookingModal] = useState<boolean>(false);
  const [showBadgeUpgradeModal, setShowBadgeUpgradeModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

    window.addEventListener('gcz_user_updated', handleUserUpdate);
    window.addEventListener('gcz_user_profile_updated', handleUserUpdate);
    window.addEventListener('gcz_testimony_updated', handleFeedUpdate);
    window.addEventListener('gcz_show_home_top_video_updated', handleTopVideoSetting);
    window.addEventListener('gcz_live_sermon_updated', handleLiveStatus);
    window.addEventListener('gcz_override_video_updated', handleLiveStatus);
    window.addEventListener('gcz_story_updated', handleStoriesUpdate);

    return () => {
      window.removeEventListener('gcz_user_updated', handleUserUpdate);
      window.removeEventListener('gcz_user_profile_updated', handleUserUpdate);
      window.removeEventListener('gcz_testimony_updated', handleFeedUpdate);
      window.removeEventListener('gcz_show_home_top_video_updated', handleTopVideoSetting);
      window.removeEventListener('gcz_live_sermon_updated', handleLiveStatus);
      window.removeEventListener('gcz_override_video_updated', handleLiveStatus);
      window.removeEventListener('gcz_story_updated', handleStoriesUpdate);
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
  const currentStreamTarget = overridePlayingVideo?.youtube_id 
    ? `https://www.youtube.com/watch?v=${overridePlayingVideo.youtube_id}` 
    : (overridePlayingVideo?.video_url || liveSermonStatus.streamUrl || StorageService.getLiveStreamUrl() || 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP');
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
      {/* 1. PLAYING ON TOP VIDEO PLAYER (TRIGGERED VIA ADMIN OR 'ON TOP' BUTTON)  */}
      {/* ========================================================================= */}
      {(showHomeTopVideo || Boolean(overridePlayingVideo)) && (
        <div id="home-top-playing-theater" className="bg-card border-2 border-primary/40 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ring-2 ring-primary/20 space-y-0">
          {/* Header Bar */}
          <div className="bg-primary/10 border-b border-primary/20 px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-bold text-primary uppercase text-[10px] sm:text-[11px] tracking-wider shrink-0">
                {liveSermonStatus.isLive ? 'Live Sanctuary' : 'Playing On Top'}
              </span>
              <span className="text-muted-foreground shrink-0">•</span>
              <span className="font-semibold text-foreground truncate text-xs sm:text-sm">
                {topVideoTitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sow Seed Shortcut Button */}
              <button
                type="button"
                onClick={() => onNavigateTab('store')}
                className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white font-bold text-[10px] sm:text-[11px] flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Sow Altar Seed / Kingdom Giving"
              >
                <Gift className="w-3 h-3" />
                <span className="hidden xs:inline">Sow Seed</span>
              </button>

              {/* Library Shortcut */}
              <button
                type="button"
                onClick={() => onNavigateTab('sermons')}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer px-1.5 py-1"
                title="Browse Full Sermon Library"
              >
                <span className="hidden sm:inline">Library</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Close Top Player Button */}
              <button
                type="button"
                onClick={() => {
                  StorageService.setOverridePlayingVideo(null);
                  StorageService.setShowHomeTopVideo(false);
                  setShowHomeTopVideo(false);
                  setOverridePlayingVideo(null);
                }}
                className="p-1 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-1"
                title="Close Top Video"
                aria-label="Close Top Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Player Display */}
          <div className="relative aspect-video bg-black overflow-hidden shadow-inner">
            {streamEmbedInfo.isFacebook ? (
              <FacebookStreamPlayer
                embedUrl={streamEmbedInfo.embedUrl || streamEmbedInfo.originalUrl}
                directUrl={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
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

          {/* Under-Video Quick Info Bar */}
          <div className="bg-secondary/40 px-3 sm:px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground text-xs">
                {overridePlayingVideo?.speaker || 'Apostle Joe Daniels'}
              </span>
              {overridePlayingVideo?.series && (
                <>
                  <span>•</span>
                  <span className="truncate text-primary font-medium">{overridePlayingVideo.series}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                Apostolic Decree
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP STORIES TRAY (FACEBOOK STYLE)                                      */}
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
                The community feed has been power-washed and is clean for genuine users. Be the first believer to share an apostolic testimony, praise report, or word of edification!
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
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${post.youtube_id}?controls=1&modestbranding=1&rel=0&playsinline=1`}
                      title={post.title || 'Sermon Video'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
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
