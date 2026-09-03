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
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Sermon, Devotional, Testimony, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { MOCK_PARTNER_TICKERS } from '../../data/mockData';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PaidBookingModal } from '../modals/PaidBookingModal';

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
    '👍': 342,
    '❤️': 418,
    '🙏': 289,
    '🔥': 315,
    '👏': 190
  });
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});
  const [activeDevotionalIndex, setActiveDevotionalIndex] = useState<number>(0);
  const [isPlayingDevotionalAudio, setIsPlayingDevotionalAudio] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('All');

  // Synchronize testimonies when updated across the app
  useEffect(() => {
    const handleSync = () => {
      setLiveTestimonies(StorageService.getTestimonies());
    };
    window.addEventListener('gcz_testimony_updated', handleSync);
    return () => window.removeEventListener('gcz_testimony_updated', handleSync);
  }, []);

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
    const isNowDownloaded = StorageService.toggleOfflineSermon(sermonId);
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
  const currentDevotional = devotionals[activeDevotionalIndex] || devotionals[0] || ({} as Devotional);
  const latestApostlePost = liveTestimonies.find(t => t.user_name.toLowerCase().includes('daniels')) || liveTestimonies[0];

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-2 sm:px-4 pt-1">
      
      {/* 1. Researched Church Sanctuary Location (Favicon Icon Only - No 'Location:' text) */}
      <div className="bg-[#001F3F]/80 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 py-2.5 overflow-hidden shadow-lg flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center shrink-0 shadow-sm" title="Church Sanctuary Location">
          <MapPin className="w-4 h-4 fill-current text-[#001F3F]" />
        </div>
        <div className="overflow-hidden relative w-full whitespace-nowrap text-xs text-white/90">
          <div className="animate-marquee flex items-center gap-8">
            <span className="font-semibold text-[#D4AF37]">
              Gateway Cathedral: Samora Machel Avenue West, Belvedere, Harare, Zimbabwe
            </span>
            <span className="text-white/70">
              • Sunday Glorious Service: 09:30 AM CAT
            </span>
            <span className="text-white/70">
              • Midweek Dominion Service: Wednesday 17:30 CAT
            </span>
            <span className="text-white/70">
              • Apostolic Inquiries: +263 78 069 9988
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hero Live Stream & Sermon Player Card */}
      <div className="bg-[#001F3F]/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl">
        
        {/* Stream Visual Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          {isAudioOnly ? (
            /* Audio-Only Low Data Mode Visualization */
            <div className="w-full h-full bg-gradient-to-br from-[#001122] via-[#001F3F] to-[#001122] flex flex-col items-center justify-center p-6 text-center relative">
              <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center animate-pulse mb-3 shadow-2xl shadow-[#D4AF37]/40">
                <Radio className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase mb-1">
                ⚡ Low-Data Audio Mode Active (24 kbps)
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white max-w-md line-clamp-2">
                {activeSermon.title}
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Apostle Joe Daniels • Gateway Live Broadcast
              </p>
            </div>
          ) : (
            /* YouTube / Live Video Player Frame */
            <div className="w-full h-full relative">
              <iframe
                className="w-full h-full pointer-events-auto"
                src={`https://www.youtube-nocookie.com/embed/${activeSermon.youtube_id || 'Tde5rGafeBE'}?autoplay=1&mute=0&controls=1&rel=0`}
                title={activeSermon.title || 'Supernatural Acceleration - Apostle Joe Daniels'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Live Overlay Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none z-10">
            <span className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-600 text-white text-xs font-bold animate-pulse shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              LIVE
            </span>
            <span className="px-3 py-1 rounded-md bg-[#001F3F]/80 text-[#D4AF37] text-xs font-bold backdrop-blur-md border border-white/10 shadow-md">
              1,429 Watching Now
            </span>
          </div>

          {/* Player Mode Switcher & Expand */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              id="btn-stream-audio-mode"
              onClick={() => setIsAudioOnly(!isAudioOnly)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#001F3F]/80 hover:bg-[#001F3F] border border-white/20 text-white text-xs font-bold backdrop-blur-md transition-all shadow-md"
              title={isAudioOnly ? "Switch to Video" : "Switch to Audio-Only (Low Data)"}
            >
              {isAudioOnly ? <Tv className="w-3.5 h-3.5 text-[#D4AF37]" /> : <Headphones className="w-3.5 h-3.5 text-[#D4AF37]" />}
              <span>{isAudioOnly ? 'Video' : 'Audio Lite'}</span>
            </button>
          </div>
        </div>

        {/* Stream Details & Interactivity Bar */}
        <div className="p-4 sm:p-6 bg-[#001F3F]/40 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
                {activeSermon.series || 'Sunday Apostolic Service'}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-snug mt-0.5">
                {activeSermon.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{sc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Premium Locked Sermon Notification */}
          {!isSermonUnlocked && (
            <div className="p-3 bg-gradient-to-r from-amber-500/20 via-[#001122] to-transparent border border-amber-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  🔒 Premium Apostolic Teaching • 45s Preview Active
                </span>
                <p className="text-[11px] text-white/70">
                  Full anointed teaching is available for Covenant Partners or per-sermon unlock ($5).
                </p>
              </div>
              <button
                onClick={() => onOpenPremiumModal && onOpenPremiumModal(activeSermon)}
                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 whitespace-nowrap shadow active:scale-95"
              >
                Unlock Message ($5)
              </button>
            </div>
          )}

          {/* WhatsApp Channel Style Reactions & Comments Bar: Exactly 3 Reaction Icons + Comment FAB */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
            
            {/* Exactly 3 Reaction Icons */}
            <div className="flex items-center gap-2">
              {(['❤️', '🙏', '🔥'] as const).map(emoji => {
                const count = activeReactionCount[emoji] || 0;
                const isReacted = userReacted[emoji];
                return (
                  <button
                    key={emoji}
                    id={`reaction-${emoji}`}
                    onClick={() => handleTriggerReaction(emoji)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                      isReacted 
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-sm' 
                        : 'bg-white/5 border-white/10 hover:border-[#D4AF37]/40 text-white/90'
                    }`}
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    <span className="text-[11px] text-white/70 font-mono">{count}</span>
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
                className={`relative p-2 rounded-full border shadow-md transition-all active:scale-95 ${
                  showChat 
                    ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37] font-bold ring-2 ring-[#D4AF37]/40' 
                    : 'bg-[#001122] border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#001F3F] text-[9px] font-black font-mono shadow">
                    {chatMessages.length}
                  </span>
                )}
              </button>

              {/* Share Icon */}
              <button
                id="btn-share-live"
                onClick={() => handleShareWhatsApp(activeSermon.title, activeSermon.description)}
                className="p-2 rounded-full bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-all shadow-md"
                title="Share to WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Comments Panel (Collapsible) */}
          {showChat && (
            <div className="bg-[#001122]/90 rounded-2xl p-3 sm:p-4 border border-white/10 space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs text-white/50 pb-1 border-b border-white/5">
                <span>Community Comments</span>
                {isGuest && <span className="text-amber-400">Sign in to comment</span>}
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs bg-[#001F3F]/40 p-2 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D4AF37]">{msg.user}</span>
                      <span className="text-[10px] text-white/40">{msg.time}</span>
                    </div>
                    <p className="text-white/80 mt-0.5">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                  placeholder={isGuest ? "Sign in to leave a comment..." : "Post a comment or praise report..."}
                  disabled={isGuest}
                  className="flex-1 bg-[#001F3F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5c158] text-[#001F3F] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
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
        <div className="bg-[#001F3F]/40 border border-white/10 p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">
                DAILY DEVOTIONAL
              </h3>
              <button
                id="btn-devotional-audio-toggle"
                onClick={() => setIsPlayingDevotionalAudio(!isPlayingDevotionalAudio)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[#001F3F] font-bold text-xs shadow-md hover:scale-105 transition-transform"
              >
                {isPlayingDevotionalAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlayingDevotionalAudio ? 'Audio Active' : `Listen (${currentDevotional.audio_duration || '3m'})`}</span>
              </button>
            </div>

            <h4 className="text-lg font-bold text-white font-serif-church">
              {currentDevotional.title}
            </h4>

            <blockquote className="text-sm text-white/70 italic border-l-2 border-[#D4AF37] pl-3 py-1 bg-white/5 rounded-r-lg">
              "{currentDevotional.scripture_verse}"
            </blockquote>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-3">
              {currentDevotional.content}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => onNavigateToBible(currentDevotional.scripture_reference)}
              className="text-xs font-bold border-b border-[#D4AF37] text-[#D4AF37] pb-0.5 hover:text-white transition-colors"
            >
              READ FULL MESSAGE ({currentDevotional.scripture_reference})
            </button>

            <button
              onClick={() => handleShareWhatsApp(currentDevotional.title, `${currentDevotional.scripture_reference}\n\n${currentDevotional.declaration}`)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Partner Wall & Latest Community Updates Card */}
        <div className="bg-[#001F3F]/40 border border-white/10 p-5 sm:p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase">
                APOSTOLIC WORD & COMMUNITY FEED
              </h3>
              <span className="text-[10px] text-white/50 tracking-wider">LIVE FEED</span>
            </div>

            {/* Featured Latest Apostle Post / Photo Update */}
            {latestApostlePost && (
              <div 
                onClick={() => onNavigateTab && onNavigateTab('community')}
                className="mb-3 bg-[#001122]/90 border border-[#D4AF37]/30 rounded-xl overflow-hidden cursor-pointer hover:border-[#D4AF37] transition-all group"
              >
                {latestApostlePost.image_url && (
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img 
                      src={latestApostlePost.image_url} 
                      alt={latestApostlePost.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#001F3F]/90 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/40">
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
                      className="w-4 h-4 rounded-full object-cover border border-[#D4AF37]"
                    />
                    <span className="text-xs font-bold text-white truncate">{latestApostlePost.user_name}</span>
                    <VerifiedBadge type="gold" size="xs" />
                    <span className="text-[10px] text-white/50 ml-auto">{latestApostlePost.date}</span>
                  </div>
                  <h5 className="text-xs font-bold text-[#D4AF37] line-clamp-1">{latestApostlePost.title}</h5>
                  <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">{latestApostlePost.content}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                <div className="w-1 h-6 bg-[#D4AF37] rounded-full shrink-0"></div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">Recent Kingdom Seed</p>
                  <p className="text-xs font-semibold text-white">M. Chidzero (Harare) sowed $50 Cathedral Seed</p>
                </div>
              </div>

              {liveTestimonies.filter(t => t.id !== latestApostlePost?.id).slice(0, 1).map((test) => (
                <div 
                  key={test.id} 
                  onClick={() => onNavigateTab && onNavigateTab('community')}
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 cursor-pointer transition-colors"
                >
                  {test.image_url ? (
                    <img src={test.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-1 h-6 bg-emerald-500 rounded-full shrink-0"></div>
                  )}
                  <div className="overflow-hidden min-w-0 flex-1">
                    <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold truncate">Praise: {test.category}</p>
                    <p className="text-xs text-white/90 truncate font-medium">{test.title} — {test.user_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>Cathedral Foundation: 85% Funded</span>
            <span className="text-[#D4AF37] font-bold">Harare Cathedral 2026</span>
          </div>
        </div>

      </div>

      {/* 4. Sermon Archive & Offline Downloader */}
      <div className="space-y-4 pt-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif-church text-base sm:text-xl font-bold text-white">
              Sermon Archive & Messages
            </h3>
            <p className="text-xs text-white/60">
              Download messages for offline playback on 2G/3G connections.
            </p>
          </div>

          {/* Series Filter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {uniqueSeries.map((series) => (
              <button
                key={series}
                onClick={() => setSelectedSeries(series)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider shrink-0 transition-all uppercase ${
                  selectedSeries === series
                    ? 'bg-[#D4AF37] text-[#001F3F] shadow-md shadow-[#D4AF37]/20'
                    : 'bg-[#001F3F]/60 border border-white/10 text-white/60 hover:text-white'
                }`}
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
                className={`bg-[#001F3F]/40 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between backdrop-blur-md ${
                  isCurrent 
                    ? 'border-[#D4AF37] shadow-xl shadow-[#D4AF37]/10' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                    <img
                      src={sermon.thumbnail_url}
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#001F3F]/90 text-[10px] font-bold text-[#D4AF37] border border-white/10">
                      {sermon.duration}
                    </span>

                    {/* Offline badge */}
                    {isDownloaded && (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-[10px] font-bold text-white shadow">
                        <Check className="w-3 h-3" />
                        Downloaded
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      {sermon.series}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 mt-0.5 font-serif-church">
                      {sermon.title}
                    </h4>
                    <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                      {sermon.description}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-3 bg-[#001F3F]/80 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveSermon(sermon);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:scale-105 transition-transform"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch / Listen</span>
                  </button>

                  <button
                    id={`btn-download-sermon-${sermon.id}`}
                    onClick={() => handleToggleDownload(sermon.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isDownloaded 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
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
      <div className="bg-gradient-to-r from-[#001F3F] via-[#001830] to-[#001122] border border-[#D4AF37]/50 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 text-left">
          <div className="w-11 h-11 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-black shrink-0 shadow-md">
            <Calendar className="w-5 h-5 text-[#001F3F]" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-white">
              Need 1-on-1 Pastoral Consultation?
            </h4>
            <p className="text-xs text-white/70">
              Book a paid private session with Apostle Joe Daniels. Submissions forwarded to +263780699988.
            </p>
          </div>
        </div>

        <button
          id="btn-open-paid-booking-home"
          onClick={() => setShowPaidBookingModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 shrink-0"
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
