import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sermon, Devotional, Testimony, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { MOCK_PARTNER_TICKERS } from '../../data/mockData';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PaidBookingModal } from '../modals/PaidBookingModal';
import { cn } from '../../lib/utils';

interface HomeTabProps {
  sermons: Sermon[];
  devotionals: Devotional[];
  testimonies?: Testimony[];
  lowDataMode: boolean;
  currentUser?: User;
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
  const [overridePlayingVideo, setOverridePlayingVideo] = useState<{ id: string; title: string; youtube_id: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(lowDataMode);
  const [offlineIds, setOfflineIds] = useState<string[]>(StorageService.getOfflineSermonsList());
  const [liveTestimonies, setLiveTestimonies] = useState<Testimony[]>(testimonies);
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

  // Compute daily devotional dynamically based on the current calendar day
  const currentDevotional = React.useMemo(() => {
    if (!devotionals || devotionals.length === 0) return {} as Devotional;
    const now = new Date();
    // Unique day index
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const selected = devotionals[Math.abs(dayOfYear) % devotionals.length] || devotionals[0];
    const formattedDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      ...selected,
      date: `Today • ${formattedDate}`
    };
  }, [devotionals]);

  // Dynamic live stream URL from Admin Panel
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>(StorageService.getLiveStreamUrl());

  // In-stream floating donation state
  const [showInStreamDonation, setShowInStreamDonation] = useState(false);
  const [seedAmount, setSeedAmount] = useState('20');
  const [seedCategory, setSeedCategory] = useState<'Altar Seed' | 'Tithe' | 'Apostle Blessing' | 'Building Offering' | 'First Fruits'>('Altar Seed');
  const [paymentMethod, setPaymentMethod] = useState<'ecocash' | 'innbucks' | 'onemoney' | 'card'>('ecocash');
  const [donorPhone, setDonorPhone] = useState(currentUser.phone || '');
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Synchronize testimonies and live stream URL when updated across the app
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
    window.addEventListener('gcz_testimony_updated', handleSync);
    window.addEventListener('gcz_stream_url_updated', handleUrlChange);
    return () => {
      window.removeEventListener('gcz_testimony_updated', handleSync);
      window.removeEventListener('gcz_stream_url_updated', handleUrlChange);
    };
  }, []);

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
        notes: `In-stream seed during live service (${activeSermon.title || 'Live Stream'})`
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

  const isGuest = currentUser.role === 'guest';
  const isSermonUnlocked = !activeSermon.is_premium || currentUser.is_premium || currentUser.unlocked_sermon_ids?.includes(activeSermon.id);

  const handleTriggerReaction = (emoji: string) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    const alreadyReacted = userReacted[emoji];
    setActiveReactionCount(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + (alreadyReacted ? -1 : 1)
    }));
    setUserReacted(prev => ({
      ...prev,
      [emoji]: !alreadyReacted
    }));
    if (!alreadyReacted) {
      confetti({
        particleCount: 15,
        spread: 35,
        origin: { y: 0.7, x: 0.8 }
      });
    }
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
      user: `${currentUser.full_name} (${currentUser.cell_group || 'Member'})`,
      text: inputChat.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setInputChat('');
  };

  const handleToggleDownload = (sermonId: string) => {
    const res = StorageService.toggleOfflineSermon(sermonId);
    if (!res.success) {
      alert(res.message);
    }
    setOfflineIds(StorageService.getOfflineSermonsList());
  };

  const handleShareWhatsApp = (title: string, text: string) => {
    const shareText = `*Gateway Connect Zimbabwe* - Apostle Joe Daniels\n\n📌 *${title}*\n${text}\n\n📲 Watch and listen in Gateway Connect App!`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Filter sermons
  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.scriptures.some(sc => sc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeries = selectedSeries === 'All' || s.series === selectedSeries;
    return matchesSearch && matchesSeries;
  });

  const [showPaidBookingModal, setShowPaidBookingModal] = useState(false);

  const uniqueSeries = ['All', ...Array.from(new Set(sermons.map(s => s.series).filter(Boolean)))];
  const latestApostlePost = liveTestimonies.find(t => t.user_name.toLowerCase().includes('daniels')) || liveTestimonies[0];

  const currentStreamTarget = (overridePlayingVideo && overridePlayingVideo.youtube_id) ||
                              liveStreamUrl || 
                              activeSermon.youtube_id || 
                              '-CibsaxijIk';
  const streamEmbedInfo = StorageService.getStreamEmbedInfo(currentStreamTarget);
  const activeVideoId = streamEmbedInfo.videoId || StorageService.extractYoutubeId(currentStreamTarget) || '-CibsaxijIk';
  const isFacebook = streamEmbedInfo.isFacebook;
  const liveStreamStatus = StorageService.getLiveSermonStatus();
  const liveFeedTitle = overridePlayingVideo 
    ? overridePlayingVideo.title 
    : (liveStreamStatus.title || (isFacebook ? 'Apostle Joe Daniels - Sunday Dominion & Prophetic Broadcast (Facebook Live)' : 'Church & Politics (Controversial Issues) - Apostle Joe Daniels (YouTube Live)'));

  const [onlineStreamersCount, setOnlineStreamersCount] = useState<number>(StorageService.getOnlineStreamersCount());

  useEffect(() => {
    const handleStreamersUpdated = () => {
      setOnlineStreamersCount(StorageService.getOnlineStreamersCount());
    };
    window.addEventListener('gcz_stream_viewers_updated', handleStreamersUpdated);

    // 10+ seconds watch requirement: record streamer with login details
    let watchTimer: any = null;
    if (isPlaying && currentUser && currentUser.id !== 'guest') {
      watchTimer = setTimeout(() => {
        StorageService.recordStreamer(currentUser, liveFeedTitle);
        setOnlineStreamersCount(StorageService.getOnlineStreamersCount());
      }, 10000);
    }

    return () => {
      window.removeEventListener('gcz_stream_viewers_updated', handleStreamersUpdated);
      if (watchTimer) clearTimeout(watchTimer);
      if (currentUser?.id && currentUser.id !== 'guest') {
        StorageService.leaveLiveStream(currentUser.id);
      }
    };
  }, [isPlaying, currentUser?.id, liveFeedTitle]);

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-2 sm:px-4 pt-1">
      
      {/* 1. Researched Church Sanctuary Location */}
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

      {/* 2. Hero Live Stream & Sermon Player Card with Platform Dynamic Theme */}
      <div 
        className={cn(
          'backdrop-blur-md rounded-xl border overflow-hidden relative shadow-md transition-all bg-card border-border',
          isFacebook ? 'border-blue-500/30' : 'border-border'
        )}
      >
        
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
              onClick={() => setOverridePlayingVideo(null)}
              className="ml-2 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border text-[11px] font-semibold shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              🔴 Return to Live Stream
            </button>
          </div>
        )}

        {/* Stream Visual Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          
          {/* Underlying YouTube / Facebook Stream iframe - Always mounted so audio continues uninterrupted */}
          <div className={isAudioOnly ? "absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" : "w-full h-full relative"}>
            {streamEmbedInfo.isFacebook ? (
              <iframe
                id="facebook-hero-stream-player"
                className="w-full h-full pointer-events-auto border-0"
                src={streamEmbedInfo.embedUrl}
                title="Gateway Connect Zimbabwe Facebook Live Service"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                referrerPolicy="origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <iframe
                id="youtube-hero-stream-player"
                className="w-full h-full pointer-events-auto border-0"
                src={streamEmbedInfo.embedUrl || StorageService.getYoutubeEmbedUrl(activeVideoId)}
                title={activeSermon.title || 'Church & Politics (Controversial Issues) - Apostle Joe Daniels'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>

          {/* No Live Stream Offline Overlay - only show if there is completely no video/stream URL configured */}
          {!liveStreamStatus.isLive && !overridePlayingVideo && !streamEmbedInfo.embedUrl && (
            <div className="absolute inset-0 z-25 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
                <Radio className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary border border-border text-foreground text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span>Currently no live stream session in progress</span>
              </div>
              <h4 className="text-foreground font-bold text-base sm:text-lg mb-1">
                Sanctuary Stream is Offline
              </h4>
              <p className="text-muted-foreground text-xs max-w-sm mb-4 leading-relaxed">
                Join us for our next scheduled service this Sunday at 09:30 AM CAT. In the meantime, you can watch past recorded sermons or study the Word.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (sermons && sermons.length > 0) {
                    setOverridePlayingVideo({
                      id: sermons[0].id,
                      title: sermons[0].title,
                      youtube_id: sermons[0].youtube_id
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg bg-primary hover:brightness-105 text-primary-foreground font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4" />
                <span>Watch Featured Sermon Replay</span>
              </button>
            </div>
          )}

          {/* Facebook Page Live Hub Launcher Overlay: prevents "Video Unavailable" for page /live links */}
          {streamEmbedInfo.isFacebook && streamEmbedInfo.isLivePageHub && !streamEmbedInfo.hasNumericVideoId && (
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/90 to-[#1877F2]/30 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-[#1877F2]/50 mb-3 animate-pulse">
                f
              </div>
              <h4 className="text-white font-black text-base sm:text-lg mb-1">
                Apostle Joe Daniels Facebook Live
              </h4>
              <p className="text-white/80 text-xs max-w-sm mb-4 leading-relaxed">
                Tune into the live broadcast directly on Facebook, or switch to the YouTube stream:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <a
                  href={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#1877F2]/40 hover:scale-105 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Facebook Live Broadcast</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const ytUrl = 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP';
                    StorageService.setLiveStreamUrl(ytUrl);
                    setLiveStreamUrl(ytUrl);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs flex items-center gap-1.5 border border-red-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Switch to YouTube</span>
                </button>
              </div>
            </div>
          )}

          {/* Only show floating Facebook pill, seed button, and in-stream donation when live streaming */}
          {liveStreamStatus.isLive && (
            <>
          {/* Floating Facebook Action Pill (if Facebook Live) */}
          {streamEmbedInfo.isFacebook && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
              <a
                href={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xl border border-white/20 transition-all hover:scale-105"
                title="Watch directly on Facebook"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Watch on Facebook</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  const ytUrl = 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP';
                  StorageService.setLiveStreamUrl(ytUrl);
                  setLiveStreamUrl(ytUrl);
                }}
                className="px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white font-bold text-[10px] flex items-center gap-1 border border-white/20 transition-all"
                title="Switch to YouTube stream"
              >
                <Tv className="w-3 h-3 text-red-400" />
                <span>YouTube Mirror</span>
              </button>
            </div>
          )}

          {/* Floating In-Stream Seed Button */}
          <div className="absolute bottom-3 right-3 z-20">
            <button
              id="btn-hero-floating-seed"
              onClick={() => setShowInStreamDonation(true)}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37] text-[#001F3F] font-black text-xs flex items-center gap-1.5 shadow-xl shadow-[#D4AF37]/40 hover:scale-105 active:scale-95 transition-all border border-white/40"
            >
              <Gift className="w-3.5 h-3.5 fill-current" />
              <span>Sow Seed</span>
            </button>
          </div>

          {/* IN-STREAM DONATION FLOAT: Non-blocking, does not overlap whole screen, leaves space to navigate to other pages, with X close button */}
          {showInStreamDonation && (
            <div className="fixed bottom-20 right-3 sm:absolute sm:bottom-4 sm:right-4 z-40 w-[calc(100vw-24px)] max-w-[340px] max-h-[60vh] overflow-y-auto bg-[#001428]/95 backdrop-blur-md border border-[#D4AF37]/80 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 text-white">
              <button
                onClick={() => setShowInStreamDonation(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-amber-300 transition-all shadow"
                title="Close Donation Float"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3 pr-8">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold shrink-0">
                  <Gift className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">In-Stream Giving</h4>
                  <p className="text-[10px] text-[#D4AF37]">Give while stream plays</p>
                </div>
              </div>

              {donationSuccess ? (
                <div className="text-center py-4 space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <div className="font-bold text-sm text-white">Altar Seed Received!</div>
                  <div className="text-[11px] text-[#D4AF37]">
                    May the God of Apostle Joe Daniels open the windows of heaven upon you!
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProcessInStreamSeed} className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between bg-[#001122] p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 py-1 rounded text-xs font-bold ${currency === 'USD' ? 'bg-[#D4AF37] text-[#001F3F]' : 'text-white/60'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('ZiG')}
                      className={`flex-1 py-1 rounded text-xs font-bold ${currency === 'ZiG' ? 'bg-[#D4AF37] text-[#001F3F]' : 'text-white/60'}`}
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
                        className={`py-1 rounded text-xs font-bold border ${seedAmount === amt ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]' : 'bg-white/5 border-white/10 text-white'}`}
                      >
                        {currency === 'USD' ? `$${amt}` : `${amt} ZiG`}
                      </button>
                    ))}
                  </div>

                  <select
                    value={seedCategory}
                    onChange={(e) => setSeedCategory(e.target.value as any)}
                    className="w-full bg-[#001122] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
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
                      className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'ecocash' ? 'bg-blue-600/30 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
                    >
                      EcoCash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('innbucks')}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'innbucks' ? 'bg-amber-600/30 border-amber-400 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
                    >
                      Innbucks
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold border ${paymentMethod === 'card' ? 'bg-emerald-600/30 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
                    >
                      Card / Visa
                    </button>
                  </div>

                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="e.g. 0772123456"
                    className="w-full bg-[#001122] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />

                  <button
                    type="submit"
                    disabled={isDonating}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-400 text-[#001F3F] font-black text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    {isDonating ? 'Processing...' : `Give ${currency} ${seedAmount} Direct`}
                  </button>
                </form>
              )}
            </div>
          )}
            </>
          )}

          {/* Audio-Only Low Data Mode Visualization (active when isAudioOnly is true) */}
          {isAudioOnly && (
            <div className="w-full h-full bg-gradient-to-br from-[#000d1a] via-[#001F3F] to-[#000d1a] flex flex-col items-center justify-center p-6 text-center relative select-none">
              
              {/* Radio Wave Pulse Graphic */}
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-28 h-28 rounded-full bg-[#D4AF37]/10 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full bg-[#D4AF37]/15 animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-[#001F3F] flex items-center justify-center shadow-xl shadow-[#D4AF37]/30 z-10">
                  <Headphones className="w-8 h-8" />
                </div>
              </div>

              {/* Streaming Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-[#D4AF37]/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">
                  ⚡ YouTube Audio-Only Stream • 24kbps Low Data
                </span>
              </div>

              {/* Sermon & Speaker Info */}
              <h3 className="text-sm sm:text-base font-bold text-white max-w-md line-clamp-2 px-4 leading-snug">
                {activeSermon.title || 'Church & Politics (Controversial Issues)'}
              </h3>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 justify-center">
                <span>{activeSermon.speaker || 'Apostle Joe Daniels'}</span>
                <VerifiedBadge type="gold" size="xs" />
                <span>• Live Broadcast</span>
              </p>

              {/* Equalizer Waveform Animation */}
              <div className="flex items-end justify-center gap-1 h-7 mt-3 mb-2">
                {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85].map((height, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-[#D4AF37] rounded-full animate-pulse"
                    style={{
                      height: `${height}%`,
                      animationDuration: `${0.4 + (idx % 5) * 0.15}s`,
                      animationDelay: `${idx * 0.05}s`
                    }}
                  />
                ))}
              </div>

              {/* Audio Controls */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  id="btn-audio-only-switch-video"
                  onClick={() => setIsAudioOnly(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Tv className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Switch to Video</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Overlay Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
            {streamEmbedInfo.isFacebook ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#1877F2] text-white text-xs font-bold animate-pulse shadow-lg">
                <Radio className="w-3.5 h-3.5" />
                FB LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 text-white text-xs font-bold animate-pulse shadow-lg">
                <Radio className="w-3.5 h-3.5" />
                YOUTUBE LIVE
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-background/85 backdrop-blur-md text-foreground text-xs font-medium border border-border shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineStreamersCount} {onlineStreamersCount === 1 ? 'Streamer Online' : 'Streamers Online'}</span>
            </span>
          </div>

          {/* Player Mode Switcher & Expand */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              id="btn-stream-audio-mode"
              onClick={() => setIsAudioOnly(!isAudioOnly)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/85 hover:bg-background border border-border text-foreground text-xs font-semibold backdrop-blur-md transition-all shadow-xs cursor-pointer"
              title={isAudioOnly ? "Switch to Video" : "Switch to Audio-Only (Low Data)"}
            >
              {isAudioOnly ? <Tv className="w-3.5 h-3.5 text-primary" /> : <Headphones className="w-3.5 h-3.5 text-primary" />}
              <span>{isAudioOnly ? 'Watch Video' : 'Audio Lite'}</span>
            </button>
          </div>
        </div>

        {/* Stream Details & Interactivity Bar */}
        <div className="p-4 sm:p-6 bg-card border-t border-border space-y-4">
          
          {/* Facebook Live Status & Troubleshooter Banner */}
          {streamEmbedInfo.isFacebook && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-2 text-foreground/90">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-0.5 sm:mt-0 animate-ping" />
                <div>
                  <span className="font-bold text-blue-400">Facebook Live Mode Active: </span>
                  <span className="text-muted-foreground">
                    If Facebook displays <em>"Video Unavailable"</em>, Facebook requires opening the broadcast in the Facebook app or web browser due to browser cookie restrictions, or setting the video privacy on Facebook to <strong>Public 🌐</strong>.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open on Facebook</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const ytUrl = 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP';
                    StorageService.setLiveStreamUrl(ytUrl);
                    setLiveStreamUrl(ytUrl);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border transition-all flex items-center gap-1 cursor-pointer"
                  title="Switch to YouTube live stream"
                >
                  <Tv className="w-3 h-3 text-rose-500" />
                  <span>Switch to YouTube</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-primary tracking-widest uppercase">
                {activeSermon.series || 'Sunday Apostolic Service'}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-snug mt-0.5">
                {liveFeedTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <span>{activeSermon.speaker}</span>
                <VerifiedBadge type="gold" size="xs" />
                <span>• {activeSermon.date}</span>
              </div>
            </div>

            {/* Quick Scriptures Pill */}
            {activeSermon.scriptures && activeSermon.scriptures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                {activeSermon.scriptures.map((sc, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigateToBible(sc)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>{sc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Premium Locked Sermon Notification */}
          {!isSermonUnlocked && (
            <div className="p-3 bg-secondary/80 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  🔒 Premium Apostolic Teaching • 45s Preview Active
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Full anointed teaching is available for Covenant Partners or per-sermon unlock ($5).
                </p>
              </div>
              <button
                onClick={() => onOpenPremiumModal && onOpenPremiumModal(activeSermon)}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-md hover:brightness-105 whitespace-nowrap shadow-xs active:scale-95 cursor-pointer"
              >
                Unlock Message ($5)
              </button>
            </div>
          )}

          {/* WhatsApp Channel Style Reactions & Comments Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
            
            {/* Exactly 3 Reaction Icons */}
            <div className="flex items-center gap-2">
              {(['❤️', '🙏', '🔥'] as const).map((emoji) => {
                const count = activeReactionCount[emoji] || 0;
                const isReacted = userReacted[emoji];
                return (
                  <button
                    key={emoji}
                    id={`reaction-${emoji}`}
                    onClick={() => handleTriggerReaction(emoji)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer',
                      isReacted
                        ? 'bg-primary/15 border-primary/40 text-primary shadow-xs'
                        : 'bg-secondary/60 border-border hover:border-primary/40 text-foreground/90'
                    )}
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Comment FAB and WhatsApp Share Button */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Comment FAB */}
              <button
                id="btn-toggle-live-comments"
                onClick={handleToggleComments}
                title="Toggle Comments"
                className={cn(
                  'relative p-2 rounded-lg border shadow-xs transition-all active:scale-95 cursor-pointer',
                  showChat
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-secondary border-border hover:border-primary/40 text-foreground'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-black font-mono shadow">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              {/* Share Icon */}
              <button
                id="btn-share-live"
                onClick={() => handleShareWhatsApp(activeSermon.title, activeSermon.description)}
                className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 transition-all shadow-xs cursor-pointer"
                title="Share to WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Comments Panel (Collapsible) */}
          {showChat && (
            <div className="bg-card rounded-xl p-3 sm:p-4 border border-border space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border">
                <span>Community Comments</span>
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
                  className="px-4 py-2 bg-primary hover:brightness-105 text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* 3. Sleek Grid: Daily Devotional & Partner Wall */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Daily Devotional Card */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                DAILY DEVOTIONAL
              </h3>
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                {currentDevotional.date || 'Today'}
              </span>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-foreground">
              {currentDevotional.title}
            </h4>

            <blockquote className="text-xs sm:text-sm text-muted-foreground italic border-l-2 border-primary pl-3 py-1 bg-secondary/40 rounded-r-md">
              "{currentDevotional.scripture_verse}"
            </blockquote>

            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3">
              {currentDevotional.content}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <button
              onClick={() => onNavigateToBible(currentDevotional.scripture_reference)}
              className="text-xs font-semibold border-b border-primary text-primary pb-0.5 hover:text-foreground transition-colors cursor-pointer"
            >
              READ FULL MESSAGE ({currentDevotional.scripture_reference})
            </button>

            <button
              onClick={() => handleShareWhatsApp(currentDevotional.title, `${currentDevotional.scripture_reference}\n\n${currentDevotional.declaration}`)}
              className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Partner Wall & Latest Community Updates Card */}
        <div className="bg-card border border-border p-5 sm:p-6 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-primary text-xs font-bold tracking-widest uppercase">
                APOSTOLIC WORD & COMMUNITY FEED
              </h3>
              <span className="text-[10px] text-muted-foreground tracking-wider font-semibold">LIVE FEED</span>
            </div>

            {/* Featured Latest Apostle Post / Photo Update */}
            {latestApostlePost && (
              <div 
                onClick={() => onNavigateTab && onNavigateTab('community')}
                className="mb-3 bg-secondary/30 border border-border hover:border-primary/40 rounded-xl overflow-hidden cursor-pointer transition-all group"
              >
                {latestApostlePost.image_url && (
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img 
                      src={latestApostlePost.image_url} 
                      alt={latestApostlePost.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/90 text-primary text-[10px] font-bold border border-border">
                      {latestApostlePost.category}
                    </span>
                    {latestApostlePost.scripture_tag && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold">
                        {latestApostlePost.scripture_tag}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={latestApostlePost.user_avatar || '/assets/apostle_joe_daniels_main.jpg'} 
                      alt={latestApostlePost.user_name} 
                      className="w-4 h-4 rounded-full object-cover border border-primary"
                    />
                    <span className="text-xs font-semibold text-foreground truncate">{latestApostlePost.user_name}</span>
                    <VerifiedBadge type="gold" size="xs" />
                    <span className="text-[10px] text-muted-foreground ml-auto">{latestApostlePost.date}</span>
                  </div>
                  <h5 className="text-xs font-bold text-primary line-clamp-1">{latestApostlePost.title}</h5>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{latestApostlePost.content}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-secondary/40 p-2.5 rounded-lg border border-border">
                <div className="w-1 h-6 bg-primary rounded-full shrink-0"></div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Recent Kingdom Seed</p>
                  <p className="text-xs font-semibold text-foreground">M. Chidzero (Harare) sowed $50 Cathedral Seed</p>
                </div>
              </div>

              {liveTestimonies.filter((t) => t.id !== latestApostlePost?.id).slice(0, 1).map((test) => (
                <div 
                  key={test.id} 
                  onClick={() => onNavigateTab && onNavigateTab('community')}
                  className="flex items-center gap-2.5 bg-secondary/40 hover:bg-secondary/60 p-2 rounded-lg border border-border cursor-pointer transition-colors"
                >
                  {test.image_url ? (
                    <img src={test.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                  )}
                  <div className="overflow-hidden min-w-0 flex-1">
                    <p className="text-[10px] text-primary uppercase tracking-widest font-bold truncate">Praise: {test.category}</p>
                    <p className="text-xs text-foreground/90 truncate font-medium">{test.title} — {test.user_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Cathedral Foundation: 85% Funded</span>
            <span className="text-primary font-semibold">Harare Cathedral 2026</span>
          </div>
        </div>

      </div>

      {/* 4. Sermon Archive & Offline Downloader */}
      <div className="space-y-4 pt-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-foreground">
              Sermon Archive & Messages
            </h3>
            <p className="text-xs text-muted-foreground">
              Download messages for offline playback on 2G/3G connections.
            </p>
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
        </div>

        {/* Sermons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredSermons.map((sermon) => {
            const isDownloaded = offlineIds.includes(sermon.id);
            const isCurrent = activeSermon.id === sermon.id;

            return (
              <div
                key={sermon.id}
                className={cn(
                  'group rounded-xl border bg-card text-card-foreground shadow-xs transition-all flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-primary/50',
                  isCurrent ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                )}
              >
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div 
                    onClick={() => {
                      setActiveSermon(sermon);
                      setOverridePlayingVideo({
                        id: sermon.id,
                        title: sermon.title,
                        youtube_id: sermon.youtube_id
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group"
                  >
                    <img
                      src={sermon.thumbnail_url}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-11 h-11 rounded-full bg-background/80 backdrop-blur-md text-foreground flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    
                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-background/85 backdrop-blur-md text-[10px] font-semibold text-foreground border border-border">
                      {sermon.duration}
                    </span>

                    {/* Offline or Active Playing badge */}
                    {overridePlayingVideo?.id === sermon.id ? (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse">
                        ▶ NOW PLAYING
                      </span>
                    ) : isDownloaded ? (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-[10px] font-bold text-white shadow-xs">
                        <Check className="w-3 h-3" />
                        Downloaded
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {sermon.series}
                    </span>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 mt-0.5">
                      {sermon.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {sermon.description}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-3 bg-secondary/40 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveSermon(sermon);
                      setOverridePlayingVideo({
                        id: sermon.id,
                        title: sermon.title,
                        youtube_id: sermon.youtube_id
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{overridePlayingVideo?.id === sermon.id ? 'Now Playing' : 'Watch / Listen'}</span>
                  </button>

                  <button
                    id={`btn-download-sermon-${sermon.id}`}
                    onClick={() => handleToggleDownload(sermon.id)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                      isDownloaded 
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
                        : 'bg-secondary hover:bg-secondary/80 text-foreground/80 border border-border'
                    )}
                    title={isDownloaded ? "Remove from offline storage" : "Download for offline listening (Low data)"}
                  >
                    {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{isDownloaded ? 'Offline' : 'Save'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* 1-on-1 Paid Pastoral Booking Banner */}
      <div className="bg-card border border-border p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-foreground">
              Need 1-on-1 Pastoral Consultation?
            </h4>
            <p className="text-xs text-muted-foreground">
              Book a private session with Apostle Joe Daniels. Submissions forwarded directly to our ministry team.
            </p>
          </div>
        </div>

        <button
          id="btn-open-paid-booking-home"
          onClick={() => setShowPaidBookingModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary hover:brightness-105 text-primary-foreground font-semibold text-xs uppercase tracking-wider shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          Book 1-on-1 Session
        </button>
      </div>

      <PaidBookingModal
        isOpen={showPaidBookingModal}
        onClose={() => setShowPaidBookingModal(false)}
      />

    </div>
  );
};
