import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Download, 
  Check, 
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
  MapPin,
  Gift,
  CheckCircle2,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Bookmark,
  MoreHorizontal,
  Plus,
  Lock,
  Crown,
  Music,
  Film,
  TrendingUp,
  Quote,
  HandHeart,
  Search,
  Hash,
  Compass,
  ArrowRight,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sermon, Devotional, Testimony, User, CommunityStory } from '../../types';
import { StorageService } from '../../services/storageService';
import { MOCK_PARTNER_TICKERS } from '../../data/mockData';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PaidBookingModal } from '../modals/PaidBookingModal';
import { UpgradeModal } from '../modals/UpgradeModal';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';
import { cn } from '../../lib/utils';
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
  testimonies = StorageService.getTestimonies(),
  lowDataMode,
  currentUser = StorageService.getCurrentUser(),
  onRequireAuth = () => {},
  onOpenPremiumModal,
  onNavigateToBible = (_reference?: string) => {},
  onNavigateTab,
}) => {
  const [activeSermon, setActiveSermon] = useState<Sermon>(sermons[0] || {} as Sermon);
  const [overridePlayingVideo, setOverridePlayingVideo] = useState<{ id: string; title: string; youtube_id?: string; video_url?: string; audio_url?: string; thumbnail_url?: string; speaker?: string; series?: string } | null>(() => StorageService.getOverridePlayingVideo());
  const [liveSermonStatus, setLiveSermonStatus] = useState(() => StorageService.getLiveSermonStatus());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(lowDataMode);
  const [offlineIds, setOfflineIds] = useState<string[]>(StorageService.getOfflineSermonsList());
  const [showArchivedVideoDropdown, setShowArchivedVideoDropdown] = useState<boolean>(false);
  const [liveTestimonies, setLiveTestimonies] = useState<Testimony[]>(testimonies);
  const [activeTestimonyIndex, setActiveTestimonyIndex] = useState<number>(0);
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string; time: string }>>([
    { user: 'Sister Tariro (Harare)', text: 'Amen! Receiving this word of divine speed!', time: '10:04' },
    { user: 'Brother Farai (UK)', text: 'Watching live from London! The presence of God is heavy!', time: '10:05' },
    { user: 'Deacon Mutasa', text: 'Hallelujah! Prophetic alignment is happening!', time: '10:06' },
    { user: 'Chiedza (Bulawayo)', text: 'Glory to Jesus! No more stagnation!', time: '10:07' }
  ]);
  const [inputChat, setInputChat] = useState<string>('');
  const [showChat, setShowChat] = useState<boolean>(false);
  const [activeReactionCount, setActiveReactionCount] = useState<Record<string, number>>({
    '👍': 5,
    '❤️': 8,
    '🙏': 7,
    '🔥': 6,
    '👏': 4
  });
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');
  const [showBadgeUpgradeModal, setShowBadgeUpgradeModal] = useState<boolean>(false);
  const [currentUserState, setCurrentUserState] = useState<User>(() => currentUser || StorageService.getCurrentUser() || ({} as User));

  useEffect(() => {
    const handleUserUpdate = () => {
      const u = StorageService.getCurrentUser();
      if (u) setCurrentUserState(u);
    };
    window.addEventListener('gcz_user_updated', handleUserUpdate);
    window.addEventListener('gcz_user_profile_updated', handleUserUpdate);
    return () => {
      window.removeEventListener('gcz_user_updated', handleUserUpdate);
      window.removeEventListener('gcz_user_profile_updated', handleUserUpdate);
    };
  }, []);

  const activeUser = currentUserState?.id ? currentUserState : currentUser;
  const isPremiumActive = StorageService.isUserPremiumActive(activeUser);
  const badgeStatus = StorageService.getBadgeStatus(activeUser);

  // Real-time Community Stories
  const [realStories, setRealStories] = useState<CommunityStory[]>(() => StorageService.getSortedStories(currentUser?.id));
  const [activeStory, setActiveStory] = useState<CommunityStory | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);

  useEffect(() => {
    const refreshStories = () => {
      setRealStories(StorageService.getSortedStories(currentUser?.id));
    };
    refreshStories();
    window.addEventListener('gcz_story_updated', refreshStories);
    window.addEventListener('gcz_follow_updated', refreshStories);
    return () => {
      window.removeEventListener('gcz_story_updated', refreshStories);
      window.removeEventListener('gcz_follow_updated', refreshStories);
    };
  }, [currentUser?.id]);

  const [broadcastLikes, setBroadcastLikes] = useState<string[]>(() => StorageService.getBroadcastLikes());
  const [broadcastLikers, setBroadcastLikers] = useState<User[]>(() => StorageService.getBroadcastLikerUsers());
  const [isPostLiked, setIsPostLiked] = useState<boolean>(() => StorageService.hasUserLikedBroadcast(currentUser?.id));
  const [heartAnim, setHeartAnim] = useState<boolean>(false);
  const [isSermonSaved, setIsSermonSaved] = useState<boolean>(false);
  const [showPostOptions, setShowPostOptions] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Compute daily devotional dynamically based on the current calendar day
  const currentDevotional = React.useMemo(() => {
    if (!devotionals || devotionals.length === 0) return {} as Devotional;
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const selected = devotionals[Math.abs(dayOfYear) % devotionals.length] || devotionals[0];
    const formattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      ...selected,
      date: `Today • ${formattedDate}`
    };
  }, [devotionals]);

  // Dynamic featured sermon URL from Admin Panel
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>(StorageService.getLiveStreamUrl());

  // In-stream floating donation state
  const [showInStreamDonation, setShowInStreamDonation] = useState(false);
  const [seedAmount, setSeedAmount] = useState('20');
  const [seedCategory, setSeedCategory] = useState<'Altar Seed' | 'Tithe' | 'Apostle Blessing' | 'Building Offering' | 'First Fruits'>('Altar Seed');
  const [paymentMethod, setPaymentMethod] = useState<'ecocash' | 'innbucks' | 'onemoney' | 'card'>('ecocash');
  const [donorPhone, setDonorPhone] = useState(currentUser?.phone || '');
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Synchronize testimonies, live stream status, top video override, and featured sermon URL when updated across the app
  useEffect(() => {
    const handleSync = () => {
      setLiveTestimonies(StorageService.getTestimonies());
    };
    const handleUrlChange = (e: any) => {
      if (e?.detail?.url) {
        setLiveStreamUrl(e.detail.url);
      } else {
        setLiveStreamUrl(StorageService.getLiveStreamUrl());
      }
    };
    const handleOverrideChange = (e: any) => {
      if (e?.detail) {
        setOverridePlayingVideo(e.detail);
      } else {
        setOverridePlayingVideo(null);
      }
    };
    const handleLiveStatusChange = (e: any) => {
      const updated = e?.detail || StorageService.getLiveSermonStatus();
      setLiveSermonStatus(updated);
      if (updated?.isLive) {
        setOverridePlayingVideo(null);
      }
      if (updated?.streamUrl) {
        setLiveStreamUrl(updated.streamUrl);
      }
    };

    const handleBroadcastLikesUpdated = () => {
      setBroadcastLikes(StorageService.getBroadcastLikes());
      setBroadcastLikers(StorageService.getBroadcastLikerUsers());
      setIsPostLiked(StorageService.hasUserLikedBroadcast(currentUser?.id));
    };

    window.addEventListener('gcz_testimony_updated', handleSync);
    window.addEventListener('gcz_testimony_deleted', handleSync);
    window.addEventListener('gcz_stream_url_updated', handleUrlChange);
    window.addEventListener('gcz_override_video_updated', handleOverrideChange);
    window.addEventListener('gcz_live_status_updated', handleLiveStatusChange);
    window.addEventListener('gcz_live_broadcast_started', handleLiveStatusChange);
    window.addEventListener('gcz_broadcast_likes_updated', handleBroadcastLikesUpdated);

    return () => {
      window.removeEventListener('gcz_testimony_updated', handleSync);
      window.removeEventListener('gcz_testimony_deleted', handleSync);
      window.removeEventListener('gcz_stream_url_updated', handleUrlChange);
      window.removeEventListener('gcz_override_video_updated', handleOverrideChange);
      window.removeEventListener('gcz_live_status_updated', handleLiveStatusChange);
      window.removeEventListener('gcz_live_broadcast_started', handleLiveStatusChange);
      window.removeEventListener('gcz_broadcast_likes_updated', handleBroadcastLikesUpdated);
    };
  }, [currentUser?.id]);

  // Real-time viewer attendance tracking when watching live broadcast on HomeTab
  useEffect(() => {
    if (liveSermonStatus.isLive && currentUser && currentUser.role !== 'guest' && !currentUser.id.startsWith('usr_guest')) {
      const streamTitle = liveSermonStatus.title || 'Sanctuary Live Broadcast';
      StorageService.recordStreamer(currentUser, streamTitle);
      const interval = setInterval(() => {
        StorageService.recordStreamer(currentUser, streamTitle);
      }, 25000);
      return () => {
        clearInterval(interval);
        StorageService.leaveLiveStream(currentUser.id);
      };
    }
  }, [liveSermonStatus.isLive, currentUser?.id, liveSermonStatus.title]);

  const handleProcessInStreamSeed = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(seedAmount);
    if (!amountNum || amountNum <= 0) return;

    setIsDonating(true);
    setTimeout(() => {
      StorageService.addDonation({
        amount: amountNum,
        currency,
        category: seedCategory,
        method: paymentMethod,
        phone: donorPhone,
        notes: `Sermon giving (${activeSermon?.title || 'Featured Sermon'})`
      });

      setIsDonating(false);
      setDonationSuccess(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 }
      });

      setTimeout(() => {
        setDonationSuccess(false);
        setShowInStreamDonation(false);
      }, 2500);
    }, 1200);
  };

  const isGuest = !currentUser || currentUser.role === 'guest';
  const isSermonUnlocked = !activeSermon?.is_premium || Boolean(currentUser?.is_premium) || Boolean(currentUser?.unlocked_sermon_ids?.includes(activeSermon?.id || ''));

  // Live broadcast listener for remote stream reactions and chat
  useEffect(() => {
    const handleLiveStreamEvent = (e: any) => {
      const event = e.detail;
      if (!event) return;
      if (event.type === 'stream_reaction' && event.payload) {
        const { emoji } = event.payload;
        if (emoji) {
          setActiveReactionCount(prev => ({
            ...prev,
            [emoji]: (prev[emoji] || 0) + 1
          }));
          confetti({
            particleCount: 12,
            spread: 35,
            origin: { y: 0.7, x: 0.8 }
          });
        }
      } else if (event.type === 'stream_chat' && event.payload) {
        const incoming = event.payload;
        setChatMessages(prev => {
          if (prev.some(m => m.user === incoming.user && m.text === incoming.text && m.time === incoming.time)) {
            return prev;
          }
          return [...prev, incoming];
        });
      }
    };
    window.addEventListener('gcz_live_event_received', handleLiveStreamEvent);
    return () => window.removeEventListener('gcz_live_event_received', handleLiveStreamEvent);
  }, []);

  const handleTriggerReaction = (emoji: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    setActiveReactionCount(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
    setUserReacted(prev => ({ ...prev, [emoji]: true }));
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.8, x: 0.85 }
    });

    const reactionType = emoji === '❤️' ? 'love' : emoji === '🔥' ? 'fire' : emoji === '🙏' ? 'amen' : 'like';
    liveSyncService.broadcastEvent({
      type: 'stream_reaction',
      payload: { emoji, reactionType, user: currentUser?.full_name || 'Believer' }
    });
  };

  const handleToggleComments = () => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    setShowChat(!showChat);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (!inputChat.trim()) return;
    const newMsg = {
      user: `${currentUser?.full_name || 'Believer'} (${currentUser?.cell_group || 'Member'})`,
      text: inputChat.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setInputChat('');

    window.dispatchEvent(new CustomEvent('gcz_live_comment_pop', {
      detail: {
        sender_name: currentUser?.full_name || 'Believer',
        message: newMsg.text,
        city: currentUser?.location || 'Harare',
        is_decree: Boolean(newMsg.text.toLowerCase().includes('amen') || newMsg.text.toLowerCase().includes('receive')),
        is_current_user: true,
        avatar_url: currentUser?.avatar_url
      }
    }));

    liveSyncService.broadcastEvent({
      type: 'stream_chat',
      payload: newMsg
    });
  };

  const handleToggleDownload = (sermonId: string) => {
    const res = StorageService.toggleOfflineSermon(sermonId);
    if (!res.success) {
      alert(res.message);
    }
    setOfflineIds(StorageService.getOfflineSermonsList());
  };

  const handleShareWhatsApp = (title: string, text: string) => {
    const shareText = `*Gateway Connect Zimbabwe* - Apostle Joe Daniels\n\n📌 *${title}*\n${text}\n\n📲 Connect with us on Gateway Connect App!`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleTogglePostHeart = () => {
    const res = StorageService.incrementBroadcastLike(currentUser?.id);
    setIsPostLiked(true);
    setBroadcastLikes(StorageService.getBroadcastLikes());
    setBroadcastLikers(res.likerUsers);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 500);

    liveSyncService.broadcastEvent({
      type: 'stream_reaction',
      payload: { emoji: '❤️', reactionType: 'love', user: currentUser?.full_name || 'Believer' }
    });
  };

  const handleToggleSaveSermon = () => {
    const next = !isSermonSaved;
    setIsSermonSaved(next);
    handleToggleDownload(activeSermon.id);
    showToast(next ? 'Sermon saved to your library' : 'Removed from saved sermons');
  };

  // Story progression timer
  useEffect(() => {
    if (!activeStory) {
      setStoryProgress(0);
      return;
    }
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const currentIndex = realStories.findIndex(s => s.id === activeStory.id);
          if (currentIndex !== -1 && currentIndex < realStories.length - 1) {
            setActiveStory(realStories[currentIndex + 1]);
          } else {
            setActiveStory(null);
          }
          return 0;
        }
        return prev + 2.5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory?.id, realStories]);

  // Filter sermons
  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.scriptures.some(sc => sc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeries = selectedSeries === 'All' || s.series === selectedSeries;
    return matchesSearch && matchesSeries;
  });

  const [showPaidBookingModal, setShowPaidBookingModal] = useState(false);
  const [activeTrendingTag, setActiveTrendingTag] = useState<string | null>(null);
  const [isSpeakingDeclaration, setIsSpeakingDeclaration] = useState<boolean>(false);
  const videoPlayerRef = useRef<HTMLDivElement | null>(null);

  const handleToggleTestimonyAmen = (testimonyId: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    StorageService.likeTestimony(testimonyId, currentUser?.id);
    setLiveTestimonies(StorageService.getTestimonies());
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 }
    });
    showToast('Amen! Your praise agreement was recorded.');
  };

  const handleSelectTrendingTag = (tag: string, targetSeries?: string) => {
    setActiveTrendingTag(tag);
    const clean = tag.replace('#', '');
    setSearchQuery(clean);
    if (targetSeries) {
      setSelectedSeries(targetSeries);
    }
    showToast(`Filtering for ${tag}`);
    const archiveEl = document.getElementById('sermon-archive-section');
    if (archiveEl) {
      archiveEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSpeakDeclaration = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeakingDeclaration(true);
      utterance.onend = () => setIsSpeakingDeclaration(false);
      utterance.onerror = () => setIsSpeakingDeclaration(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const uniqueSeries = ['All', ...Array.from(new Set(sermons.map(s => s.series).filter(Boolean)))];
  
  // Trending hashtags wired to church themes & sermons
  const trendingTags = [
    { tag: '#DivineSpeed', count: '1.4k decrees', series: 'Prophetic Speed' },
    { tag: '#Cathedral2026', count: '890 partners', series: 'Cathedral Foundation' },
    { tag: '#DominionHour', count: '2.1k watching', series: 'Dominion' },
    { tag: '#AltarDecree', count: '650 prayers', series: 'All' },
    { tag: '#ChurchAndPolitics', count: '3.2k discussions', series: 'Controversial Issues' }
  ];

  // Active highlighted testimony
  const featuredTestimony = liveTestimonies[activeTestimonyIndex % (liveTestimonies.length || 1)] || liveTestimonies[0];

  const liveStreamStatus = liveSermonStatus;

  const liveFeedTitle = overridePlayingVideo 
    ? overridePlayingVideo.title 
    : (liveSermonStatus.isLive && liveSermonStatus.title
        ? liveSermonStatus.title 
        : (activeSermon?.title || 'Featured Sermon'));

  const recordedTarget = (activeSermon && activeSermon.youtube_id) || '-CibsaxijIk';
  const liveTarget = (liveSermonStatus.isLive && (liveSermonStatus.streamUrl || liveStreamUrl)) 
    ? (liveSermonStatus.streamUrl || liveStreamUrl) 
    : (liveStreamUrl || recordedTarget);
  const currentStreamTarget = overridePlayingVideo 
    ? (overridePlayingVideo.youtube_id || '') 
    : (liveSermonStatus.isLive ? liveTarget : (liveStreamUrl || recordedTarget));

  const streamEmbedInfo = StorageService.getStreamEmbedInfo(currentStreamTarget);
  const activeVideoId = streamEmbedInfo.videoId || StorageService.extractYoutubeId(currentStreamTarget) || '-CibsaxijIk';
  const isFacebook = streamEmbedInfo.isFacebook;

  const currentLocalVideo = overridePlayingVideo?.video_url || (!overridePlayingVideo && activeSermon?.video_url);
  const currentLocalAudio = overridePlayingVideo?.audio_url || (!overridePlayingVideo && activeSermon?.audio_url);

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 max-w-4xl mx-auto px-1 sm:px-2 pt-1 w-full">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-card/95 border border-primary text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Instagram Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-2.5 sm:p-4 max-h-[100dvh] h-[100dvh] overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in fade-in">
          <div className="w-full max-w-sm flex items-center gap-1.5 pt-1 shrink-0">
            {realStories.map(st => (
              <div key={st.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: st.id === activeStory.id 
                      ? `${storyProgress}%` 
                      : realStories.findIndex(s => s.id === st.id) < realStories.findIndex(s => s.id === activeStory.id) 
                        ? '100%' 
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          <div className="w-full max-w-sm flex items-center justify-between mt-2 px-1 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <img 
                src={activeStory.user_avatar || activeStory.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover border-2 border-primary" 
              />
              <div>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <span>{activeStory.user_name}</span>
                  <VerifiedBadge type={activeStory.badge_type || 'none'} size="xs" />
                </div>
                <span className="text-[10px] text-white/60">{activeStory.user_handle || 'Believer'}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveStory(null)} 
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full max-w-sm flex-1 min-h-0 my-2 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-zinc-950">
            <img 
              src={activeStory.image_url} 
              alt="" 
              className="w-full h-full object-contain" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
          </div>

          <div className="w-full max-w-sm pb-2 shrink-0">
            <button
              onClick={() => {
                confetti({ particleCount: 25, spread: 60 });
                showToast(`Praise agreement sent to ${activeStory.user_name}!`);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Agree in Prayer & Praise</span>
            </button>
          </div>
        </div>
      )}

      {/* 0. Real Community Stories Tray */}
      {realStories.length > 0 && (
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-3 shadow-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-max">
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('me');
                } else {
                  showToast('Head to ME tab to publish your testimony');
                }
              }}
              className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none shrink-0"
            >
              <div className="relative">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-muted to-muted-foreground/30 flex items-center justify-center group-hover:scale-105 transition-all">
                  <img
                    src={currentUser?.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                    alt="Your Story"
                    className="w-full h-full rounded-full object-cover border-2 border-background"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center border border-background shadow-xs">
                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-foreground truncate max-w-[56px] text-center">Your Story</span>
            </button>

            {realStories.map(story => (
              <button
                key={story.id}
                onClick={() => setActiveStory(story)}
                className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none shrink-0"
              >
                <div className="relative">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] transition-all group-hover:scale-105">
                    <div className="w-full h-full rounded-full p-[1px] bg-background">
                      <img
                        src={story.user_avatar || story.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={story.user_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-foreground truncate max-w-[56px] text-center">
                  {story.user_name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1. Sanctuary Live Marquee & Cathedral Location */}
      <div className="bg-card/85 backdrop-blur-md border border-border rounded-xl px-3.5 py-2.5 overflow-hidden shadow-xs flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 shadow-xs" title="Church Sanctuary Location">
          <MapPin className="w-4 h-4 fill-current text-primary" />
        </div>
        <div className="overflow-hidden relative w-full whitespace-nowrap text-xs text-foreground/90">
          <div className="animate-marquee flex items-center gap-8">
            <span className="font-semibold text-primary">
              Harare Assembly: Fantasyland Cinema Number 3 Harare, Zimbabwe
            </span>
            <span className="text-muted-foreground">
              • Gateway Cathedral: Samora Machel Avenue West, Belvedere, Harare
            </span>
            <span className="text-muted-foreground">
              • Sunday Glorious Service: 09:30 AM CAT
            </span>
            <span className="text-muted-foreground">
              • Midweek Dominion Service: Wednesday 17:30 CAT
            </span>
            <span className="text-muted-foreground">
              • Apostolic Secretariat & Intercession Desk • Connect via App
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hero Featured Sermon & Sermon Player Card (Video on top and its features intact) */}
      <div 
        ref={videoPlayerRef}
        id="hero-video-player-card"
        className="rounded-2xl overflow-hidden relative transition-all duration-200 bg-card border border-border shadow-xs"
      >
        {/* Instagram Post Header */}
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shrink-0">
              <img
                src="/assets/apostle_joe_daniels_main.jpg"
                alt="Apostle Joe Daniels"
                className="w-full h-full rounded-full object-cover border border-background"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 font-bold text-xs text-foreground">
                <span className="truncate">apostle_joe_daniels</span>
                <VerifiedBadge type="gold" size="xs" />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                Harare, Zimbabwe • Main Sanctuary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {liveStreamStatus.isLive ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-medium">
                Broadcast Replay
              </span>
            )}

            <button
              onClick={() => setShowPostOptions(!showPostOptions)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title="Post Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Post Options Dropdown Menu */}
        {showPostOptions && (
          <div className="bg-secondary/90 border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
            <button
              onClick={() => {
                handleShareWhatsApp(activeSermon.title, activeSermon.description);
                setShowPostOptions(false);
              }}
              className="flex items-center gap-1.5 text-emerald-500 font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Share</span>
            </button>
            <button
              onClick={() => {
                setIsAudioOnly(!isAudioOnly);
                setShowPostOptions(false);
              }}
              className="flex items-center gap-1.5 text-primary font-semibold"
            >
              {isAudioOnly ? <Tv className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
              <span>{isAudioOnly ? 'Video Mode' : 'Audio Lite (Low Data)'}</span>
            </button>
            <button
              onClick={() => {
                setShowInStreamDonation(true);
                setShowPostOptions(false);
              }}
              className="flex items-center gap-1.5 text-amber-500 font-semibold"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Sow Seed / Partner</span>
            </button>
          </div>
        )}
        
        {/* Banner indicating swapped video playing on top */}
        {overridePlayingVideo && (
          <div className="bg-primary/15 border-b border-primary/30 px-3.5 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-foreground min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
              <span className="font-bold text-primary shrink-0">Playing On Top:</span>
              <span className="truncate font-semibold">{overridePlayingVideo.title}</span>
            </div>
            <button
              id="btn-return-live-stream"
              onClick={() => {
                setOverridePlayingVideo(null);
                StorageService.setOverridePlayingVideo(null);
              }}
              className="ml-2 p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border shrink-0 transition-colors shadow-xs cursor-pointer flex items-center justify-center"
              title="Return to Featured Sermon"
              aria-label="Return to Featured Sermon"
            >
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            </button>
          </div>
        )}

        {/* Stream Visual Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          
          {/* Local Video Player */}
          {currentLocalVideo ? (
            <video
              src={currentLocalVideo}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (streamEmbedInfo.isMp4 || streamEmbedInfo.isDirectVideo || currentStreamTarget.endsWith('.mp4') || currentStreamTarget.startsWith('blob:') || currentStreamTarget.startsWith('data:video/')) ? (
            <video
              src={streamEmbedInfo.embedUrl || currentStreamTarget}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : isFacebook ? (
            <FacebookStreamPlayer
              embedUrl={streamEmbedInfo.embedUrl || streamEmbedInfo.originalUrl}
              directUrl={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
              title={liveFeedTitle}
              isLive={liveStreamStatus.isLive}
            />
          ) : !isAudioOnly ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0&playsinline=1`}
              title={liveFeedTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : null}

          {/* Floating In-Stream Donation Overlay */}
          {showInStreamDonation && (
            <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-white animate-in fade-in">
              <div className="w-full max-w-sm bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase">
                    <Gift className="w-4 h-4" />
                    <span>Sow Seed Into Anointing</span>
                  </div>
                  <button onClick={() => setShowInStreamDonation(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {donationSuccess ? (
                  <div className="text-center py-4 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm text-foreground">Seed Received with Apostolic Grace!</p>
                    <p className="text-xs text-muted-foreground">May the God of Apostle Joe Daniels open the windows of heaven upon you!</p>
                  </div>
                ) : (
                  <form onSubmit={handleProcessInStreamSeed} className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between bg-secondary p-1 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`flex-1 py-1 rounded text-xs font-bold ${currency === 'USD' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                      >
                        USD ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('ZiG')}
                        className={`flex-1 py-1 rounded text-xs font-bold ${currency === 'ZiG' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                      >
                        ZiG
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {['5', '10', '20', '50'].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSeedAmount(amt)}
                          className={`py-1 rounded text-xs font-bold border ${seedAmount === amt ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground'}`}
                        >
                          {currency === 'USD' ? `$${amt}` : `${amt} ZiG`}
                        </button>
                      ))}
                    </div>

                    <select
                      value={seedCategory}
                      onChange={(e) => setSeedCategory(e.target.value as any)}
                      className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <option value="Altar Seed">Altar Seed (Prophetic Covenant)</option>
                      <option value="Tithe">Tithe (10% Kingdom Honor)</option>
                      <option value="Apostle Blessing">Apostle Blessing</option>
                      <option value="Building Offering">Building Offering</option>
                    </select>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('ecocash')}
                        className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'ecocash' ? 'bg-blue-600/30 border-blue-400 text-foreground' : 'bg-secondary border-border text-muted-foreground'}`}
                      >
                        EcoCash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('innbucks')}
                        className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'innbucks' ? 'bg-amber-600/30 border-amber-400 text-foreground' : 'bg-secondary border-border text-muted-foreground'}`}
                      >
                        Innbucks
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'card' ? 'bg-emerald-600/30 border-emerald-400 text-foreground' : 'bg-secondary border-border text-muted-foreground'}`}
                      >
                        Card / Visa
                      </button>
                    </div>

                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="e.g. 0772123456"
                      className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    />

                    <button
                      type="submit"
                      disabled={isDonating}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      {isDonating ? 'Processing...' : `Give ${currency} ${seedAmount} Direct`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Audio-Only Low Data Mode Visualization */}
          {isAudioOnly && (
            <div className="w-full h-full bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-6 text-center relative select-none">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-28 h-28 rounded-full bg-primary/10 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full bg-primary/15 animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 z-10">
                  <Headphones className="w-8 h-8" />
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-primary/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
                  ⚡ Featured Sermon Audio • Low Data
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white max-w-md line-clamp-2 px-4 leading-snug">
                {activeSermon.title || 'Church & Politics (Controversial Issues)'}
              </h3>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 justify-center">
                <span>{activeSermon.speaker || 'Apostle Joe Daniels'}</span>
                <VerifiedBadge type="gold" size="xs" />
                <span>• Recorded Sermon</span>
              </p>

              <div className="flex items-end justify-center gap-1 h-7 mt-3 mb-2">
                {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85].map((height, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${height}%`,
                      animationDuration: `${0.4 + (idx % 5) * 0.15}s`,
                      animationDelay: `${idx * 0.05}s`
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  id="btn-audio-only-switch-video"
                  onClick={() => setIsAudioOnly(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Tv className="w-3.5 h-3.5 text-primary" />
                  <span>Switch to Video</span>
                </button>
              </div>
            </div>
          )}

          {/* Stream Overlay Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
            {liveStreamStatus.isLive ? (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 text-white text-xs font-black animate-pulse shadow-lg tracking-wide">
                  <Radio className="w-3.5 h-3.5" />
                  🔴 LIVE BROADCAST
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{StorageService.getStreamViewers().length || 1} Believers Watching</span>
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background/85 backdrop-blur-md text-foreground border border-border text-xs font-semibold shadow-md">
                <Tv className="w-3.5 h-3.5 text-primary" />
                FEATURED SERMON
              </span>
            )}
          </div>

          {/* Player Mode Switcher */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              id="btn-stream-audio-mode"
              onClick={() => setIsAudioOnly(!isAudioOnly)}
              className="p-2 rounded-lg bg-background/85 hover:bg-background border border-border text-foreground text-xs font-semibold backdrop-blur-md transition-all shadow-xs cursor-pointer flex items-center justify-center"
              title={isAudioOnly ? "Switch to Video" : "Switch to Audio-Only (Low Data)"}
              aria-label={isAudioOnly ? "Switch to Video" : "Switch to Audio-Only"}
            >
              {isAudioOnly ? <Tv className="w-4 h-4 text-primary" /> : <Headphones className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </div>

        {/* Stream Details & Interactivity Bar */}
        <div className="p-4 sm:p-5 bg-card border-t border-border space-y-4">
          
          {/* Live broadcast comment or default layout */}
          {liveStreamStatus.isLive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-3">
                  <button
                    id="btn-live-stream-like"
                    onClick={handleTogglePostHeart}
                    className="group flex items-center gap-1.5 p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border transition-all cursor-pointer active:scale-95"
                    title="Like live broadcast"
                  >
                    <Heart className={cn("w-5 h-5 transition-transform", isPostLiked ? "text-rose-500 fill-current scale-110" : "text-muted-foreground group-hover:text-rose-500")} />
                    <span className="text-xs font-bold text-foreground">{broadcastLikes.length}</span>
                  </button>

                  <button
                    onClick={() => setShowInStreamDonation(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5 fill-current" />
                    <span>Sow Altar Seed</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {['👍', '❤️', '🙏', '🔥', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleTriggerReaction(emoji)}
                      className="p-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-sm hover:scale-125 active:scale-90 transition-transform cursor-pointer relative"
                    >
                      <span>{emoji}</span>
                      {activeReactionCount[emoji] > 0 && (
                        <span className="absolute -top-1 -right-1 text-[9px] bg-primary text-primary-foreground rounded-full px-1 font-bold">
                          {activeReactionCount[emoji]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live comment stream */}
              <div className="bg-secondary/40 rounded-xl p-3 border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    Live Sanctuary Decrees & Prayers
                  </span>
                  {isGuest && <span className="text-primary font-semibold text-[11px]">Sign in to comment</span>}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="text-xs bg-card/60 p-2 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{msg.user}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-foreground/90 mt-0.5">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {!isGuest && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {['Amen! 🙏', 'Receiving speed! ⚡', 'Hallelujah! 🙌', 'Grace multiplied! 🔥'].map((decree) => (
                      <button
                        key={decree}
                        type="button"
                        onClick={() => setInputChat(decree)}
                        className="px-2 py-0.5 rounded-full bg-secondary/80 hover:bg-secondary border border-border text-[10px] font-medium text-foreground whitespace-nowrap cursor-pointer transition-colors"
                      >
                        {decree}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendChat} className="flex gap-2 pt-1 border-t border-border">
                  <input
                    type="text"
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    placeholder={isGuest ? "Sign in to leave a decree..." : "Post a decree or praise while watching..."}
                    disabled={isGuest}
                    className="flex-1 bg-background border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isGuest || !inputChat.trim()}
                    className="p-2 bg-primary hover:brightness-105 text-primary-foreground rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-primary tracking-widest uppercase">
                    {activeSermon.series || 'Sunday Apostolic Service'}
                  </span>
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-snug mt-0.5">
                    {liveFeedTitle}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>{activeSermon.speaker || 'Apostle Joe Daniels'}</span>
                    <VerifiedBadge type="gold" size="xs" />
                    <span>• {activeSermon.date}</span>
                  </div>
                </div>

                {activeSermon.scriptures && activeSermon.scriptures.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                    {activeSermon.scriptures.map((sc, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigateToBible(sc)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
                        title={`Open Scripture ${sc}`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>{sc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2.5 border-t border-border">
                <div className="flex items-center gap-3.5">
                  <button
                    id="btn-instagram-heart-like"
                    onClick={handleTogglePostHeart}
                    className="group flex items-center gap-1 transition-all focus:outline-none cursor-pointer active:scale-90 p-1"
                    title="Like sermon"
                  >
                    <Heart
                      className={cn(
                        "w-6 h-6 transition-all",
                        isPostLiked ? "text-rose-500 fill-current scale-110" : "text-foreground group-hover:text-rose-500"
                      )}
                    />
                  </button>

                  <button
                    id="btn-instagram-comment-toggle"
                    onClick={handleToggleComments}
                    className="group flex items-center gap-1 transition-all focus:outline-none cursor-pointer active:scale-90 p-1"
                    title="Toggle Comments"
                  >
                    <MessageSquare className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    id="btn-instagram-share-direct"
                    onClick={() => handleShareWhatsApp(activeSermon.title, activeSermon.description)}
                    className="group flex items-center gap-1 transition-all focus:outline-none cursor-pointer active:scale-90 p-1"
                    title="Share to WhatsApp"
                  >
                    <Send className="w-5 h-5 -rotate-45 text-foreground group-hover:text-emerald-500 transition-colors" />
                  </button>

                  <button
                    id="btn-instagram-sow-seed"
                    onClick={() => setShowInStreamDonation(true)}
                    className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    title="Sow Kingdom Seed"
                  >
                    <Gift className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-full border border-border text-xs">
                    {['❤️', '🙏', '🔥'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleTriggerReaction(emoji)}
                        className="hover:scale-125 active:scale-90 transition-transform p-0.5 cursor-pointer"
                      >
                        <span>{emoji}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    id="btn-instagram-bookmark"
                    onClick={handleToggleSaveSermon}
                    className="p-1 text-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer active:scale-90"
                    title="Save sermon to offline library"
                  >
                    <Bookmark
                      className={cn(
                        "w-6 h-6 transition-all",
                        isSermonSaved || offlineIds.includes(activeSermon.id)
                          ? "text-primary fill-current"
                          : "text-foreground"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Likers Cluster */}
              <div 
                onClick={handleTogglePostHeart}
                className="text-xs font-semibold text-foreground pt-1 flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform"
              >
                {broadcastLikers.length > 0 ? (
                  <>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {broadcastLikers.slice(0, 2).map((u, i) => (
                        <img 
                          key={u.id || i} 
                          src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                          alt="" 
                          className="w-4 h-4 rounded-full border border-background object-cover" 
                        />
                      ))}
                    </div>
                    <span>
                      {broadcastLikers.length === 1 ? (
                        <>Liked by <strong className="font-bold">{(broadcastLikers[0].handle || broadcastLikers[0].full_name).replace('@', '')}</strong></>
                      ) : broadcastLikers.length === 2 ? (
                        <>Liked by <strong className="font-bold">{(broadcastLikers[0].handle || broadcastLikers[0].full_name).replace('@', '')}</strong> and <strong className="font-bold">{(broadcastLikers[1].handle || broadcastLikers[1].full_name).replace('@', '')}</strong></>
                      ) : (
                        <>Liked by <strong className="font-bold">{(broadcastLikers[0].handle || broadcastLikers[0].full_name).replace('@', '')}</strong>, <strong className="font-bold">{(broadcastLikers[1].handle || broadcastLikers[1].full_name).replace('@', '')}</strong>, and <strong className="font-bold">{broadcastLikers.length - 2} other{broadcastLikers.length - 2 === 1 ? '' : 's'}</strong></>
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground font-normal">Be the first to like this broadcast</span>
                )}
              </div>

              {/* Caption */}
              <div className="text-xs space-y-1 text-foreground/90">
                <p>
                  <strong className="font-bold text-foreground mr-1.5">apostle_joe_daniels</strong>
                  <span>{activeSermon.description || 'Welcome to our apostolic communion. The atmosphere is charged with supernatural grace!'}</span>
                </p>
              </div>

              {/* Comments Accordion */}
              <button
                onClick={handleToggleComments}
                className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer text-left block"
              >
                {showChat ? 'Hide comments' : `View all ${chatMessages.length} comments and prayer decrees`}
              </button>

              {showChat && (
                <div className="bg-secondary/40 rounded-xl p-3 sm:p-4 border border-border space-y-3 mt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border">
                    <span>Community Comments & Prayers</span>
                    {isGuest && <span className="text-primary font-semibold">Sign in to comment</span>}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="text-xs bg-secondary/50 p-2.5 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">{msg.user}</span>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-foreground/90 mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-border">
                    <input
                      type="text"
                      value={inputChat}
                      onChange={(e) => setInputChat(e.target.value)}
                      placeholder={isGuest ? "Sign in to leave a comment..." : "Post a comment or praise report..."}
                      disabled={isGuest}
                      className="flex-1 bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-primary hover:brightness-105 text-primary-foreground rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 3. Church & Social App Quick Action Hub (Wiring with whole app) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Holy Bible */}
        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab('bible');
            else onNavigateToBible();
          }}
          className="group p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs flex items-center gap-3 transition-all hover:bg-secondary/40 text-left cursor-pointer active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">Holy Bible</h4>
            <p className="text-[10px] text-muted-foreground truncate">Offline Shona & KJV</p>
          </div>
        </button>

        {/* Community Fellowship */}
        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab('community');
          }}
          className="group p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs flex items-center gap-3 transition-all hover:bg-secondary/40 text-left cursor-pointer active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">Fellowship</h4>
            <p className="text-[10px] text-muted-foreground truncate">Praise & Testimonies</p>
          </div>
        </button>

        {/* Pastoral Booking 1-on-1 */}
        <button
          onClick={() => setShowPaidBookingModal(true)}
          className="group p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs flex items-center gap-3 transition-all hover:bg-secondary/40 text-left cursor-pointer active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">Pastoral 1-on-1</h4>
            <p className="text-[10px] text-muted-foreground truncate">Book with Apostle Joe</p>
          </div>
        </button>

        {/* Kingdom Seed / Partner */}
        <button
          onClick={() => setShowInStreamDonation(true)}
          className="group p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs flex items-center gap-3 transition-all hover:bg-secondary/40 text-left cursor-pointer active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">Kingdom Seed</h4>
            <p className="text-[10px] text-muted-foreground truncate">EcoCash • Innbucks • Card</p>
          </div>
        </button>
      </div>

      {/* 4. Cooked Bento Grid: Daily Devotional & Trending + Testimonies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Daily Devotional Card */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                  DAILY DEVOTIONAL
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                {currentDevotional.date || 'Today'}
              </span>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {currentDevotional.title}
              </h4>
              <p className="text-xs text-primary font-semibold mt-0.5">
                {currentDevotional.scripture_reference}
              </p>
            </div>

            <blockquote className="text-xs text-foreground/90 italic border-l-2 border-primary pl-3 py-1.5 bg-secondary/50 rounded-r-xl leading-relaxed">
              "{currentDevotional.scripture_verse}"
            </blockquote>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {currentDevotional.content}
            </p>

            {/* Prophetic Declaration Banner */}
            {currentDevotional.declaration && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Apostolic Decree for Today
                </span>
                <p className="text-xs text-foreground font-medium italic">
                  "{currentDevotional.declaration}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToBible(currentDevotional.scripture_reference)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:brightness-105 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read in Bible</span>
              </button>

              {currentDevotional.declaration && (
                <button
                  type="button"
                  onClick={() => handleSpeakDeclaration(currentDevotional.declaration || currentDevotional.title)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                    isSpeakingDeclaration
                      ? "bg-rose-500/20 text-rose-500 border-rose-500/40 animate-pulse"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border-border"
                  )}
                  title="Speak prophetic declaration"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingDeclaration ? 'Declaring...' : 'Speak'}</span>
                </button>
              )}
            </div>

            <button
              onClick={() => handleShareWhatsApp(currentDevotional.title, `${currentDevotional.scripture_reference}\n\n"${currentDevotional.scripture_verse}"\n\nDecree: ${currentDevotional.declaration}`)}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-emerald-500 hover:text-emerald-400 transition-all cursor-pointer flex items-center justify-center"
              title="Share devotional to WhatsApp"
            >
              <Send className="w-4 h-4 -rotate-45" />
            </button>
          </div>
        </div>

        {/* Small Trending & Faith Testimony Spotlight Card */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between shadow-xs space-y-4">
          
          {/* Top: Small Trending Part */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-primary">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-xs font-bold tracking-widest uppercase">
                  TRENDING IN CHURCH
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Live Decrees</span>
            </div>

            {/* Trending tags horizontal pills */}
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.map((item) => (
                <button
                  key={item.tag}
                  onClick={() => handleSelectTrendingTag(item.tag, item.series)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border",
                    activeTrendingTag === item.tag
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/80 text-foreground hover:bg-secondary border-border"
                  )}
                >
                  <Hash className="w-3 h-3 text-primary shrink-0" />
                  <span>{item.tag.replace('#', '')}</span>
                  <span className="text-[9px] text-muted-foreground ml-0.5 font-normal">({item.count.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom: Faith Testimony & Praise Spotlight */}
          {featuredTestimony && (
            <div className="bg-secondary/40 border border-border rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-background border border-border shrink-0">
                    <img 
                      src={featuredTestimony.user_avatar || '/assets/apostle_joe_daniels_main.jpg'} 
                      alt={featuredTestimony.user_name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-foreground truncate">{featuredTestimony.user_name}</span>
                      <VerifiedBadge type="gold" size="xs" />
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">{featuredTestimony.date || 'Recent praise report'}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold">
                  {featuredTestimony.category || 'Breakthrough'}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-foreground line-clamp-1">{featuredTestimony.title}</h5>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{featuredTestimony.content}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <button
                  onClick={() => handleToggleTestimonyAmen(featuredTestimony.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <HandHeart className="w-3.5 h-3.5" />
                  <span>Amen! ({featuredTestimony.likes_count || 12})</span>
                </button>

                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab('community');
                  }}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore Fellowship</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Social praise report call-to-action */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground text-[11px]">Have God done something great?</span>
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('community');
              }}
              className="text-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Share Testimony</span>
            </button>
          </div>

        </div>

      </div>

      {/* 5. Cathedral Vision & Next Sanctuary Service Countdown */}
      <div className="bg-card border border-border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                Next Service
              </span>
              <span className="text-[11px] text-muted-foreground">Sunday 09:30 AM CAT</span>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-foreground truncate mt-0.5">
              Glorious Apostolic Dominion Service
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Samora Machel Avenue West, Belvedere, Harare & Live Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              if (videoPlayerRef.current) {
                videoPlayerRef.current.scrollIntoView({ behavior: 'smooth' });
              }
              showToast('Featured service stream is ready at the top!');
            }}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>Join Stream</span>
          </button>

          <button
            onClick={() => setShowInStreamDonation(true)}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:brightness-105 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Partner Cathedral</span>
          </button>
        </div>
      </div>

      {/* 6. Sermon Archive & Apostolic Messages */}
      <div id="sermon-archive-section" className="space-y-4 pt-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span>Sermon Archive & Apostolic Word</span>
              {!isPremiumActive ? (
                <button
                  onClick={() => setShowBadgeUpgradeModal(true)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Crown className="w-3 h-3 fill-current" />
                  <span>Buy Pro</span>
                </button>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Unlocked</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Prophetic teachings, apostolic series, and high-fidelity video archives.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sermons, scriptures..."
              className="w-full bg-card border border-border rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Series Filter Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-xl border border-border overflow-x-auto no-scrollbar">
          {uniqueSeries.map((series) => (
            <button
              key={series}
              onClick={() => setSelectedSeries(series)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium tracking-wide shrink-0 transition-all uppercase cursor-pointer select-none',
                selectedSeries === series
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {series}
            </button>
          ))}
        </div>

        {/* Premium Banner */}
        {!isPremiumActive ? (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-400/50 shadow-xs">
                <Crown className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                  <span>Pro Video Messages</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/25 text-amber-600 dark:text-amber-400 border border-amber-400/40">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  Unlock full apostolic message recordings, high-quality audio, and offline downloads.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBadgeUpgradeModal(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:brightness-110 active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Buy Pro</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-emerald-500 fill-current" />
              <span className="font-semibold text-foreground">
                Sermon Archive Unlocked • {badgeStatus.badgeType ? `${badgeStatus.badgeType.toUpperCase()} Badge Active` : 'Verified Partner Active'}
              </span>
            </div>
            {badgeStatus.expiresAt && (
              <span className="text-[11px] text-muted-foreground">
                Expires: {new Date(badgeStatus.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Sermons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredSermons.map((sermon) => {
            const isDownloaded = offlineIds.includes(sermon.id);
            const isCurrent = activeSermon.id === sermon.id;

            return (
              <div
                key={sermon.id}
                className={cn(
                  'group rounded-2xl border bg-card text-card-foreground shadow-xs transition-all flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-border/80',
                  isCurrent ? 'border-primary' : 'border-border'
                )}
              >
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div 
                    onClick={() => {
                      if (!isPremiumActive) {
                        setShowBadgeUpgradeModal(true);
                        return;
                      }
                      setActiveSermon(sermon);
                      setOverridePlayingVideo({
                        id: sermon.id,
                        title: sermon.title,
                        youtube_id: sermon.youtube_id,
                        video_url: sermon.video_url,
                        audio_url: sermon.audio_url,
                        thumbnail_url: sermon.thumbnail_url,
                        speaker: sermon.speaker,
                        series: sermon.series
                      });
                      if (videoPlayerRef.current) {
                        videoPlayerRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer group"
                  >
                    <img
                      src={sermon.thumbnail_url}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    <div 
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs border border-amber-400/40 text-amber-400 text-[10px] font-bold tracking-wider uppercase shadow-xs z-15"
                      title="Pro Sermon Video"
                    >
                      <Crown className="w-3 h-3 fill-current text-amber-400" />
                      <span>PRO</span>
                    </div>

                    {!isPremiumActive ? (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center transition-all group-hover:bg-slate-950/80 z-10">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-1 text-amber-400 shadow-xs">
                          <Crown className="w-4 h-4 fill-current" />
                        </div>
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          Buy Pro
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          Tap to unlock sermon archive
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                        <div className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-xs text-foreground flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                    
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-background/85 backdrop-blur-md text-[10px] font-semibold text-foreground border border-border z-15">
                      {sermon.duration}
                    </span>

                    {overridePlayingVideo?.id === sermon.id ? (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse z-15">
                        ▶ NOW PLAYING ON TOP
                      </span>
                    ) : isDownloaded ? (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-[10px] font-bold text-white shadow-xs z-15">
                        <Check className="w-3 h-3" />
                        Downloaded
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {sermon.series}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mt-1">
                      {sermon.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {sermon.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-secondary/30 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (!isPremiumActive) {
                        setShowBadgeUpgradeModal(true);
                        return;
                      }
                      setActiveSermon(sermon);
                      setOverridePlayingVideo({
                        id: sermon.id,
                        title: sermon.title,
                        youtube_id: sermon.youtube_id,
                        video_url: sermon.video_url,
                        audio_url: sermon.audio_url,
                        thumbnail_url: sermon.thumbnail_url,
                        speaker: sermon.speaker,
                        series: sermon.series
                      });
                      if (videoPlayerRef.current) {
                        videoPlayerRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold",
                      !isPremiumActive
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30"
                        : overridePlayingVideo?.id === sermon.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                    )}
                  >
                    {!isPremiumActive ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Unlock Pro</span>
                      </>
                    ) : overridePlayingVideo?.id === sermon.id ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Playing On Top</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch on Top</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-download-sermon-${sermon.id}`}
                      onClick={() => {
                        if (!isPremiumActive) {
                          setShowBadgeUpgradeModal(true);
                          return;
                        }
                        handleToggleDownload(sermon.id);
                      }}
                      className={cn(
                        'p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center',
                        isDownloaded 
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                          : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                      )}
                      title={!isPremiumActive ? "Buy Pro to download" : isDownloaded ? "Remove from offline storage" : "Save for offline listening"}
                    >
                      {isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleShareWhatsApp(sermon.title, sermon.description)}
                      className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all cursor-pointer flex items-center justify-center"
                      title="Share message to WhatsApp"
                    >
                      <Send className="w-4 h-4 -rotate-45 text-emerald-500" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* 7. 1-on-1 Pastoral Consultation Banner */}
      <div className="bg-card border border-border p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-foreground">
              Need 1-on-1 Pastoral Consultation?
            </h4>
            <p className="text-xs text-muted-foreground">
              Book a private apostolic session with Apostle Joe Daniels. Submissions forwarded directly to our ministry desk.
            </p>
          </div>
        </div>

        <button
          id="btn-open-paid-booking-home"
          onClick={() => setShowPaidBookingModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:brightness-105 text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
          title="Book 1-on-1 Pastoral Consultation"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

      <PaidBookingModal
        isOpen={showPaidBookingModal}
        onClose={() => setShowPaidBookingModal(false)}
      />

      {/* Kingdom Verification Badge Upgrade Modal */}
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
