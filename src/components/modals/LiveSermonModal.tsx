import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Tv, 
  Users, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Heart, 
  Flame, 
  Sparkles, 
  Send, 
  Share2, 
  Gift, 
  Radio,
  CheckCircle2,
  DollarSign,
  Smartphone,
  CreditCard,
  Building,
  ExternalLink
} from 'lucide-react';
import { User, CongregationUnit } from '../../types';
import { StorageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface LiveSermonModalProps {
  currentUser: User;
  onClose: () => void;
  onOpenSeedModal?: () => void;
}

interface LiveChatMessage {
  id: string;
  sender_name: string;
  city: string;
  message: string;
  is_decree?: boolean;
}

const INITIAL_LIVE_CHATS: LiveChatMessage[] = [
  { id: '1', sender_name: 'Pastor Tendai', city: 'Harare', message: 'Hallelujah! The glory of the Lord is in this place!' },
  { id: '2', sender_name: 'Sister Chipo', city: 'Harare', message: 'I receive my supernatural acceleration in Jesus name! 🙏', is_decree: true },
  { id: '3', sender_name: 'Brother Tinashe', city: 'Bulawayo', message: 'Bulawayo is connected! Amen Apostle!' },
  { id: '4', sender_name: 'Grace Daniels', city: 'Harare', message: 'Dominion over every limitation today!' },
  { id: '5', sender_name: 'Kuda Sibanda', city: 'Chitungwiza', message: 'Taking notes from Chitungwiza! Fire message! 🔥' }
];

export const LiveSermonModal: React.FC<LiveSermonModalProps> = ({
  currentUser,
  onClose,
  onOpenSeedModal
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(INITIAL_LIVE_CHATS);
  const [newChatText, setNewChatText] = useState('');
  const [likeCount, setLikeCount] = useState(384);
  const [congregations, setCongregations] = useState<CongregationUnit[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic live stream URL from Admin Panel
  const [streamUrl, setStreamUrl] = useState<string>(StorageService.getLiveStreamUrl());

  // In-stream floating donation state
  const [showInStreamDonation, setShowInStreamDonation] = useState(false);
  const [seedAmount, setSeedAmount] = useState('20');
  const [seedCategory, setSeedCategory] = useState<'Altar Seed' | 'Tithe' | 'Apostle Blessing' | 'Building Offering' | 'First Fruits'>('Altar Seed');
  const [paymentMethod, setPaymentMethod] = useState<'ecocash' | 'innbucks' | 'onemoney' | 'card'>('ecocash');
  const [donorPhone, setDonorPhone] = useState(currentUser.phone || '');
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const status = StorageService.getLiveSermonStatus();
  const [streamersCount, setStreamersCount] = useState<number>(StorageService.getOnlineStreamersCount());

  useEffect(() => {
    // 10+ seconds watch requirement:
    // If a user watches a video for 10+ seconds, record them as a streamer with their login details.
    const watchTimer = setTimeout(() => {
      StorageService.recordStreamer(currentUser, status.title || 'Live Apostolic Broadcast');
      setStreamersCount(StorageService.getOnlineStreamersCount());
      setCongregations(StorageService.getCongregationUnits());
    }, 10000);

    const handleStreamersUpdated = () => {
      setStreamersCount(StorageService.getOnlineStreamersCount());
      setCongregations(StorageService.getCongregationUnits());
    };
    window.addEventListener('gcz_stream_viewers_updated', handleStreamersUpdated);

    setCongregations(StorageService.getCongregationUnits());
    const timer = setInterval(() => {
      setCongregations(StorageService.getCongregationUnits());
    }, 4000);

    const handleStreamUrlUpdate = (e: any) => {
      if (e?.detail?.url) {
        setStreamUrl(e.detail.url);
      } else {
        setStreamUrl(StorageService.getLiveStreamUrl());
      }
    };
    window.addEventListener('gcz_stream_url_updated', handleStreamUrlUpdate);

    return () => {
      clearTimeout(watchTimer);
      clearInterval(timer);
      window.removeEventListener('gcz_stream_url_updated', handleStreamUrlUpdate);
      window.removeEventListener('gcz_stream_viewers_updated', handleStreamersUpdated);
      // When a user exits a group or stream, the count drops immediately
      StorageService.leaveLiveStream(currentUser.id);
    };
  }, [currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const streamEmbedInfo = StorageService.getStreamEmbedInfo(streamUrl || status.streamUrl);
  const youtubeVideoId = streamEmbedInfo.videoId || StorageService.extractYoutubeId(streamUrl || status.streamUrl);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `chat_${Date.now()}`,
      sender_name: currentUser.full_name,
      city: currentUser.location || 'Harare',
      message: newChatText.trim(),
      is_decree: newChatText.toLowerCase().includes('amen') || newChatText.toLowerCase().includes('receive')
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setNewChatText('');
  };

  const handleBurstAmen = () => {
    setLikeCount((prev) => prev + 1);
    confetti({
      particleCount: 15,
      spread: 45,
      origin: { y: 0.8 }
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
        notes: `In-stream seed during live service (${status.title})`
      });

      setIsDonating(false);
      setDonationSuccess(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 }
      });

      // Announce in live chat
      const chatAnnouncement: LiveChatMessage = {
        id: `seed_chat_${Date.now()}`,
        sender_name: currentUser.full_name,
        city: currentUser.location || 'Harare',
        message: `Sowed ${currency} ${amountNum} into ${seedCategory}! Hallelujah! 🌱🕊️`,
        is_decree: true
      };
      setChatMessages((prev) => [...prev, chatAnnouncement]);

      setTimeout(() => {
        setDonationSuccess(false);
        setShowInStreamDonation(false);
      }, 2500);
    }, 1200);
  };

  const isFacebook = streamEmbedInfo.isFacebook;
  const liveFeedTitle = status.title || (isFacebook ? 'Apostle Joe Daniels - Sunday Dominion & Prophetic Broadcast (Facebook Live)' : 'Church & Politics (Controversial Issues) - Apostle Joe Daniels (YouTube Live)');
  const onlineStreamersCount = streamersCount;

  const establishedCongregations = congregations.filter((c) => c.is_congregation);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div 
        className={`bg-[#001428] border rounded-2xl w-full max-w-5xl h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200 transition-all ${
          isFacebook 
            ? 'border-[#1877F2]/60 shadow-[0_0_35px_rgba(24,119,242,0.25)]' 
            : 'border-red-600/60 shadow-[0_0_35px_rgba(239,68,68,0.25)]'
        }`}
      >
        
        {/* Top Stream Header */}
        <div 
          className={`px-4 py-3 flex items-center justify-between shrink-0 transition-colors ${
            isFacebook 
              ? 'bg-[#0B1E3B] border-b border-[#1877F2]/30' 
              : 'bg-[#180A0A] border-b border-red-600/30'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {!status.isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-white/80 font-black text-xs uppercase tracking-wider shadow-sm">
                <Radio className="w-3.5 h-3.5 text-white/40" />
                <span>OFFLINE</span>
              </span>
            ) : isFacebook ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1877F2] text-white font-black text-xs uppercase tracking-wider shadow-sm animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>FB LIVE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-xs uppercase tracking-wider animate-pulse shadow-sm">
                <Radio className="w-3.5 h-3.5" />
                <span>YOUTUBE LIVE</span>
              </span>
            )}
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[240px] sm:max-w-md">
                {!status.isLive ? 'Sanctuary Broadcast (Standby)' : liveFeedTitle}
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-white/70">
                <span className={`flex items-center gap-1 font-semibold ${isFacebook ? 'text-blue-300' : 'text-red-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.isLive ? 'bg-emerald-400 animate-ping' : 'bg-white/40'}`} />
                  <Users className="w-3 h-3" />
                  <span>{onlineStreamersCount} {onlineStreamersCount === 1 ? 'Streamer Online' : 'Streamers Online'}</span>
                </span>
                <span className="flex items-center gap-1 text-white/60">
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  <span>Harare Assembly: <strong className="text-white">Fantasyland Cinema Number 3 Harare</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streamEmbedInfo.isFacebook && (
              <a
                href={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm"
                title="Watch directly on Facebook"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="px-2.5 py-1.5 rounded-lg bg-[#001122] border border-white/10 hover:border-[#D4AF37] text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Share Live Sermon Link"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            {/* In-Stream Altar Seed Button */}
            <button
              id="btn-instream-altar-seed-header"
              onClick={() => setShowInStreamDonation(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-amber-400 text-[#001F3F] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Gift className="w-3.5 h-3.5 fill-current" />
              <span>Sow Altar Seed</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Video Player & Chat Feed */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Stream Video Player with In-Stream Floating Popup */}
          <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
            
            {/* Real Video Player Embed (Facebook Live or YouTube Live with audio and controls) */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {streamEmbedInfo.isFacebook ? (
                <iframe
                  id="facebook-congregation-stream-player"
                  className="w-full h-full border-0 absolute inset-0"
                  src={streamEmbedInfo.embedUrl}
                  title={status.title || 'Gateway Connect Zimbabwe Facebook Live Service'}
                  style={{ border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  referrerPolicy="origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <iframe
                  id="youtube-congregation-stream-player"
                  className="w-full h-full border-0 absolute inset-0"
                  src={streamEmbedInfo.embedUrl}
                  title={status.title || 'Gateway Connect Zimbabwe Live Service'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {/* No Live Stream Offline Overlay */}
              {!status.isLive && (
                <div className="absolute inset-0 z-25 bg-[#001122]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <Radio className="w-7 h-7 text-[#D4AF37]" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-[#D4AF37] text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]/60" />
                    <span>Currently no live stream session in progress.</span>
                  </div>
                  <h4 className="text-white font-bold text-base sm:text-lg mb-1">
                    Currently no live stream session in progress.
                  </h4>
                  <p className="text-white/70 text-xs max-w-sm mb-4 leading-relaxed">
                    The altar broadcast will resume during our next scheduled service (Sunday Glorious Service 09:30 AM CAT). Replays of all past services are available on the home page.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59B27] text-[#001F3F] font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <span>Return to Home & Replays</span>
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
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs flex items-center gap-1.5 border border-red-500/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Switch to YouTube</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Congregation Ticker Banner */}
              <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-emerald-400 font-bold">● Active Congregations:</span>
                  <span className="text-white/90 truncate">
                    Harare (Fantasyland Cinema Number 3) • Bulawayo • Chitungwiza • Gweru • Mutare
                  </span>
                </div>
                <span className="text-[#D4AF37] font-bold shrink-0 ml-2">
                  {onlineStreamersCount} Online
                </span>
              </div>

              {/* Floating Facebook Action Pill (if Facebook Live) */}
              {streamEmbedInfo.isFacebook && (
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <a
                    href={streamEmbedInfo.facebookDirectUrl || streamEmbedInfo.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl border border-white/20 transition-all hover:scale-105"
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
                    }}
                    className="px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white font-bold text-[10px] flex items-center gap-1 border border-white/20 transition-all"
                    title="Switch to YouTube stream"
                  >
                    <Tv className="w-3 h-3 text-red-400" />
                    <span>YouTube Mirror</span>
                  </button>
                </div>
              )}

              {/* Floating Altar Seed / Donate Trigger Button on the Video */}
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  id="btn-stream-floating-seed"
                  onClick={() => setShowInStreamDonation(true)}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#D4AF37] text-[#001F3F] font-black text-xs flex items-center gap-2 shadow-2xl shadow-[#D4AF37]/50 hover:scale-105 active:scale-95 transition-all border border-white/40 animate-pulse"
                >
                  <Gift className="w-4 h-4 fill-current" />
                  <span>Sow Altar Seed / Pay</span>
                </button>
              </div>

              {/* IN-STREAM DONATION FLOAT: Non-blocking, leaves space to navigate and watch, with X close button */}
              {showInStreamDonation && (
                <div className="fixed bottom-16 right-3 sm:absolute sm:bottom-4 sm:right-4 z-40 w-[calc(100vw-24px)] max-w-[340px] max-h-[60vh] overflow-y-auto bg-[#001428]/95 backdrop-blur-md border border-[#D4AF37]/80 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 text-white">
                  <button
                    onClick={() => setShowInStreamDonation(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all shadow"
                    title="Close Donation Float"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2.5 mb-3 pr-8">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold shadow-md shrink-0">
                      <Gift className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">In-Stream Altar Seed</h3>
                      <p className="text-[11px] text-[#D4AF37]">Give while stream continues</p>
                    </div>
                  </div>

                    {donationSuccess ? (
                      <div className="text-center py-6 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="font-black text-base text-white">Seed Received on the Altar!</h4>
                        <p className="text-xs text-[#D4AF37]">
                          "The blessing of Abraham is commanded upon your life and household." — Apostle Joe Daniels
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleProcessInStreamSeed} className="space-y-3">
                        {/* Currency Toggle */}
                        <div className="flex items-center justify-between bg-[#001122] p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => setCurrency('USD')}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                              currency === 'USD' ? 'bg-[#D4AF37] text-[#001F3F] shadow' : 'text-white/60'
                            }`}
                          >
                            USD ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrency('ZiG')}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                              currency === 'ZiG' ? 'bg-[#D4AF37] text-[#001F3F] shadow' : 'text-white/60'
                            }`}
                          >
                            ZiG (Zimbabwe Gold)
                          </button>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Select Seed Amount
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {['5', '10', '20', '50'].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setSeedAmount(amt)}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  seedAmount === amt 
                                    ? 'bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]' 
                                    : 'bg-white/5 border-white/10 text-white hover:border-[#D4AF37]/40'
                                }`}
                              >
                                {currency === 'USD' ? `$${amt}` : `${amt} ZiG`}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center bg-[#001122] border border-white/15 rounded-xl px-3 py-1.5">
                            <span className="text-xs text-[#D4AF37] font-bold mr-1.5">Custom:</span>
                            <input
                              type="number"
                              min="1"
                              value={seedAmount}
                              onChange={(e) => setSeedAmount(e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                              placeholder="Enter custom amount"
                            />
                          </div>
                        </div>

                        {/* Seed Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Giving Purpose
                          </label>
                          <select
                            value={seedCategory}
                            onChange={(e) => setSeedCategory(e.target.value as any)}
                            className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="Altar Seed">Altar Seed (Prophetic Connection)</option>
                            <option value="Tithe">Tithe (Honor the Lord)</option>
                            <option value="Apostle Blessing">Apostle Blessing (Ministry Support)</option>
                            <option value="Building Offering">Building Offering (Cathedral Expansion)</option>
                            <option value="First Fruits">First Fruits</option>
                          </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Payment Method
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('ecocash')}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center transition-all ${
                                paymentMethod === 'ecocash'
                                  ? 'bg-blue-600/30 border-blue-400 text-white'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                              }`}
                            >
                              <span>EcoCash</span>
                              <span className="text-[9px] text-blue-300">Zimbabwe</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('innbucks')}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center transition-all ${
                                paymentMethod === 'innbucks'
                                  ? 'bg-amber-600/30 border-amber-400 text-white'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                              }`}
                            >
                              <span>Innbucks</span>
                              <span className="text-[9px] text-amber-300">Instant</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('card')}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center transition-all ${
                                paymentMethod === 'card'
                                  ? 'bg-emerald-600/30 border-emerald-400 text-white'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                              }`}
                            >
                              <span>Card / Visa</span>
                              <span className="text-[9px] text-emerald-300">Worldwide</span>
                            </button>
                          </div>
                        </div>

                        {/* Phone / Reference input */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Mobile / Account Number
                          </label>
                          <input
                            type="tel"
                            value={donorPhone}
                            onChange={(e) => setDonorPhone(e.target.value)}
                            placeholder="e.g. 0772123456"
                            className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                      {/* Action Submit */}
                      <button
                        type="submit"
                        disabled={isDonating}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:brightness-110 text-[#001F3F] font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/30 transition-all"
                      >
                        {isDonating ? (
                          <span>Connecting Secure Gateway...</span>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 fill-current" />
                            <span>Sow {currency} {seedAmount} Directly Now</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Quick Interactive Reaction Bar under Video */}
            <div className="h-12 bg-[#001122] border-t border-white/10 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBurstAmen}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>High Praise Amen! ({likeCount})</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setShowInStreamDonation(true)}
                  className="text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Sow Altar Seed</span>
                </button>
                <span className="text-white/40">•</span>
                <span className={streamEmbedInfo.isFacebook ? "text-[#1877F2] font-semibold" : "text-emerald-400 font-semibold"}>
                  {streamEmbedInfo.isFacebook ? "Facebook Live Active" : "Live Stream Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Live Chat & Intercessory Prayer Decrees Feed */}
          <div className="w-full md:w-80 bg-[#001A33] border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-64 md:h-auto">
            <div className="p-3 border-b border-white/10 bg-[#00162B] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Chat & Decrees
              </span>
              <span className="text-[10px] text-white/50">{chatMessages.length} prayers</span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl transition-all ${
                    msg.is_decree
                      ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-white'
                      : 'bg-[#001122]/60 border border-white/5 text-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#D4AF37] text-[11px] truncate max-w-[140px]">
                      {msg.sender_name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {msg.city}
                    </span>
                  </div>
                  <p className="text-white/90 leading-snug break-words">{msg.message}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-[#001122] border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                placeholder="Post an Amen or decree..."
                className="flex-1 bg-[#001F3F] border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className={`p-2 rounded-xl text-white font-bold transition-all shrink-0 ${
                  isFacebook ? 'bg-[#1877F2] hover:bg-[#166fe5]' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
