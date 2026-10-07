import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Search, 
  X, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Tv, 
  Upload, 
  Plus, 
  Filter, 
  BarChart3, 
  Check, 
  Download, 
  Send, 
  Heart, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Eye, 
  Share2, 
  FileVideo, 
  Layers, 
  ShieldCheck,
  Video,
  Youtube,
  Radio,
  Lock,
  Unlock,
  Crown,
  ShieldAlert
} from 'lucide-react';
import { Sermon, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StorageBucketService } from '../../services/StorageBucketService';
import { PaynowService } from '../../services/paynowService';
import { VideoAnalyticsDashboard } from '../admin/VideoAnalyticsDashboard';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface SermonsTabProps {
  currentUser?: User | null;
  onNavigateTab?: (tab: any) => void;
  onSetOverridePlayingVideo?: (video: {
    id: string;
    title: string;
    youtube_id: string;
    video_url?: string;
    audio_url?: string;
    thumbnail_url: string;
    speaker: string;
    series: string;
  }) => void;
}

export const SermonsTab: React.FC<SermonsTabProps> = ({
  currentUser,
  onNavigateTab,
  onSetOverridePlayingVideo
}) => {
  // Sermons & Categories state
  const [sermons, setSermons] = useState<Sermon[]>(() => StorageService.getSermons());
  const [categories, setCategories] = useState<string[]>(() => StorageService.getSermonCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'most_viewed' | 'title' | 'duration'>('newest');
  const [selectedChannel, setSelectedChannel] = useState<'all' | '@joedaniels-official' | '@JoeDanielsPodcastshow'>('all');

  // Modals state
  const [activePlayingSermon, setActivePlayingSermon] = useState<Sermon | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState<boolean>(false);
  const [restrictedSermon, setRestrictedSermon] = useState<Sermon | null>(null);

  // User Profile & Strict Blue/Gold Access Control
  const [userProfile, setUserProfile] = useState<User | null>(() => currentUser || StorageService.getCurrentUser());
  const hasLibraryAccess = Boolean(StorageService.canAccessSermonLibrary(userProfile));

  // Paid Verification & EcoCash/Card Payment state
  const [selectedTierBadge, setSelectedTierBadge] = useState<'blue' | 'gold'>('blue');
  const [payMethod, setPayMethod] = useState<'EcoCash' | 'Card'>('EcoCash');
  const [payPhone, setPayPhone] = useState<string>(() => (currentUser?.phone || ''));
  const [isPayProcessing, setIsPayProcessing] = useState<boolean>(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [pollStatusMsg, setPollStatusMsg] = useState<string>('');

  // Download / Offline state
  const [offlineIds, setOfflineIds] = useState<string[]>(() => StorageService.getOfflineSermonsList());

  // Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSpeaker, setUploadSpeaker] = useState('Apostle Joe Daniels');
  const [uploadCategory, setUploadCategory] = useState('Sunday Services');
  const [uploadSeries, setUploadSeries] = useState('Sunday Services');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadDuration, setUploadDuration] = useState('45m');
  const [uploadScriptures, setUploadScriptures] = useState('');
  const [uploadVideoSource, setUploadVideoSource] = useState<'file' | 'youtube'>('file');
  const [uploadYoutubeUrl, setUploadYoutubeUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');

  // Category Management state
  const [newCategoryName, setNewCategoryName] = useState('');

  // User Privileges (Admin / Dev / Pastor)
  const isAdminOrDev = Boolean(
    currentUser && (
      currentUser.role === 'developer' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'pastor' ||
      currentUser.id === 'usr_developer' ||
      currentUser.id === 'usr_apostle_joe' ||
      Boolean(typeof StorageService?.isDeveloperMode === 'function' && StorageService.isDeveloperMode())
    )
  );

  // Sync event listeners
  useEffect(() => {
    const handleSermonUpdate = () => {
      setSermons(StorageService.getSermons());
    };
    const handleCategoryUpdate = () => {
      setCategories(StorageService.getSermonCategories());
    };

    const handleUserUpdate = () => {
      setUserProfile(StorageService.getCurrentUser());
    };

    window.addEventListener('gcz_sermon_added', handleSermonUpdate);
    window.addEventListener('gcz_sermon_updated', handleSermonUpdate);
    window.addEventListener('gcz_sermon_deleted', handleSermonUpdate);
    window.addEventListener('gcz_sermon_categories_updated', handleCategoryUpdate);
    window.addEventListener('gcz_user_profile_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('gcz_sermon_added', handleSermonUpdate);
      window.removeEventListener('gcz_sermon_updated', handleSermonUpdate);
      window.removeEventListener('gcz_sermon_deleted', handleSermonUpdate);
      window.removeEventListener('gcz_sermon_categories_updated', handleCategoryUpdate);
      window.removeEventListener('gcz_user_profile_updated', handleUserUpdate);
    };
  }, []);

  // Filter and sort sermons
  const filteredAndSortedSermons = useMemo(() => {
    let result = [...sermons];

    // 1. Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(s => 
        (s.series && s.series.toLowerCase() === selectedCategory.toLowerCase()) ||
        (s as any).category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Filter by channel (@joedaniels-official or @JoeDanielsPodcastshow)
    if (selectedChannel !== 'all') {
      result = result.filter(s => {
        if (selectedChannel === '@JoeDanielsPodcastshow') {
          return s.channel === '@JoeDanielsPodcastshow' || s.series?.toLowerCase().includes('podcast') || s.title?.toLowerCase().includes('podcast');
        } else {
          return s.channel === '@joedaniels-official' || !s.channel || (!s.series?.toLowerCase().includes('podcast') && !s.title?.toLowerCase().includes('podcast'));
        }
      });
    }

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) ||
        (s.series && s.series.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.speaker && s.speaker.toLowerCase().includes(q)) ||
        (s.scriptures && s.scriptures.some(sc => sc.toLowerCase().includes(q)))
      );
    }

    // 4. Sort
    switch (sortBy) {
      case 'most_viewed':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        result.sort((a, b) => (parseInt(b.duration) || 0) - (parseInt(a.duration) || 0));
        break;
      case 'newest':
      default:
        // Keep natural recent order or by ID
        result.sort((a, b) => {
          const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        break;
    }

    return result;
  }, [sermons, selectedCategory, selectedChannel, searchQuery, sortBy]);

  // Recommended & Related Videos for Player Modal
  const relatedSermons = useMemo(() => {
    if (!activePlayingSermon) return [];
    return sermons
      .filter(s => s.id !== activePlayingSermon.id)
      .filter(s => 
        (activePlayingSermon.series && s.series === activePlayingSermon.series) ||
        (activePlayingSermon.channel && s.channel === activePlayingSermon.channel) ||
        s.speaker === activePlayingSermon.speaker
      )
      .slice(0, 6);
  }, [activePlayingSermon, sermons]);

  // Play Sermon Handler with Strict Blue/Gold Access Control
  const handlePlaySermon = (sermon: Sermon, isTopPlayer: boolean = false) => {
    const hasAccess = StorageService.canAccessSermonLibrary(userProfile);
    if (!hasAccess && sermon.requires_verification !== false) {
      setRestrictedSermon(sermon);
      setShowAccessDeniedModal(true);
      return;
    }

    // Record real-time view
    StorageService.recordSermonView(sermon.id, isTopPlayer);
    
    if (isTopPlayer) {
      if (onSetOverridePlayingVideo) {
        onSetOverridePlayingVideo({
          id: sermon.id,
          title: sermon.title,
          youtube_id: sermon.youtube_id,
          video_url: sermon.video_url,
          audio_url: sermon.audio_url,
          thumbnail_url: sermon.thumbnail_url,
          speaker: sermon.speaker,
          series: sermon.series
        });
      }
      if (onNavigateTab) {
        onNavigateTab('home');
      }
    } else {
      setActivePlayingSermon(sermon);
    }
  };

  // Verified Real Payment Upgrade Handler (EcoCash + In-App / Card via Paynow)
  const handleExecutePayment = async () => {
    if (isPayProcessing) return;
    setIsPayProcessing(true);
    setPayError(null);
    setPollStatusMsg('Connecting to Paynow Zimbabwe gateway...');
    const amount = selectedTierBadge === 'gold' ? 29.99 : 9.99;
    const tierName = selectedTierBadge === 'gold' ? 'Gold VIP' : 'Blue Partner';
    const finalPhone = payPhone || userProfile?.phone || currentUser?.phone || '';

    try {
      const payment = await PaynowService.initiateTransaction({
        reference: `GCZ-BADGE-${Date.now().toString().slice(-8)}`,
        amount: amount,
        additionalInfo: `${tierName} Verified Badge ($${amount}/mo)`,
        phone: finalPhone,
        paymentMethod: payMethod
      });

      if (!payment || !payment.success || !payment.pollUrl) {
        setIsPayProcessing(false);
        setPayError(payment?.error || 'Payment could not be started. Badge was not activated. No fee charged.');
        return;
      }

      if (payment.browserUrl) {
        window.open(payment.browserUrl, '_blank', 'noopener,noreferrer');
      }

      setPollStatusMsg(
        payMethod === 'EcoCash'
          ? `EcoCash prompt sent to ${finalPhone || 'mobile'}. Please enter your PIN...`
          : 'Waiting for payment confirmation...'
      );

      const result = await PaynowService.waitForPayment(payment.pollUrl);

      if (!result || !result.isPaid) {
        setIsPayProcessing(false);
        setPayError(`Payment was not completed (Status: ${result?.status || 'Unpaid'}). Verification badge was not granted.`);
        return;
      }

      // STRICT: Only grant on verified successful payment
      const updated = StorageService.purchaseBadge(selectedTierBadge, 1);
      setIsPayProcessing(false);
      if (updated) {
        setUserProfile(updated);
        setShowAccessDeniedModal(false);
        confetti({ particleCount: 60, spread: 80 });
        if (restrictedSermon) {
          setActivePlayingSermon(restrictedSermon);
          StorageService.recordSermonView(restrictedSermon.id, false);
        }
      }
    } catch (err: any) {
      setIsPayProcessing(false);
      setPayError(err?.message || 'Payment verification failed. Badge was not activated.');
    }
  };

  // Toggle Offline Save
  const handleToggleDownload = (sermonId: string) => {
    StorageService.toggleOfflineSermon(sermonId);
    setOfflineIds(StorageService.getOfflineSermonsList());
  };

  // WhatsApp Share
  const handleShareWhatsApp = (title: string, desc: string) => {
    const text = `*${title}* - Apostle Joe Daniels\n\n${desc}\n\nWatch full apostolic sermon on Gateway Church: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const ok = StorageService.addSermonCategory(newCategoryName);
    if (ok) {
      setCategories(StorageService.getSermonCategories());
      setNewCategoryName('');
      confetti({ particleCount: 25, spread: 50 });
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = (catName: string) => {
    if (window.confirm(`Delete category "${catName}"?`)) {
      StorageService.deleteSermonCategory(catName);
      setCategories(StorageService.getSermonCategories());
      if (selectedCategory === catName) setSelectedCategory('All');
    }
  };

  // Handle Video Upload Form
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;
    setIsUploading(true);

    try {
      let finalVideoUrl: string | undefined = undefined;
      let finalYoutubeId = 'upeY03DKvTo';
      let finalThumb = '/assets/apostle_joe_daniels_main.jpg';

      if (uploadVideoSource === 'file' && uploadFile) {
        setUploadProgressMsg(`Uploading ${uploadFile.name} to media storage...`);
        const remoteUrl = await StorageBucketService.uploadFileToMediaBucket(uploadFile, 'sermons');
        if (remoteUrl) {
          finalVideoUrl = remoteUrl;
        }
      } else if (uploadVideoSource === 'youtube' && uploadYoutubeUrl.trim()) {
        const extractedId = StorageService.extractYoutubeId(uploadYoutubeUrl.trim());
        if (extractedId) {
          finalYoutubeId = extractedId;
          finalThumb = `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`;
        } else {
          finalVideoUrl = uploadYoutubeUrl.trim();
        }
      }

      const newSermon: Sermon = {
        id: `sermon_${Date.now()}`,
        title: uploadTitle.trim(),
        speaker: uploadSpeaker.trim() || 'Apostle Joe Daniels',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        series: uploadSeries.trim() || uploadCategory,
        duration: uploadDuration.trim() || '45m',
        youtube_id: finalYoutubeId,
        video_url: finalVideoUrl,
        thumbnail_url: finalThumb,
        scriptures: uploadScriptures ? [uploadScriptures.trim()] : [],
        description: uploadDescription.trim() || `Apostolic teaching by ${uploadSpeaker}.`,
        view_count: 1,
        is_live: false,
        is_premium: false
      };

      StorageService.addSermon(newSermon);
      setSermons(StorageService.getSermons());

      // Reset form
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadYoutubeUrl('');
      confetti({ particleCount: 40, spread: 60 });
    } finally {
      setIsUploading(false);
      setUploadProgressMsg('');
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-2 px-3 sm:px-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/10 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-foreground">
              Apostolic Sermons Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/20 text-primary border border-primary/30">
              {sermons.length}+ Videos
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Searchable high-definition video archive of teachings, Sunday services, and prophetic declarations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* YouTube Studio Video Analytics Button (Admin / Dev) */}
          {isAdminOrDev && (
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open YouTube Studio Video Analytics"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Video Analytics Studio</span>
            </button>
          )}

          {/* Manage Categories Button (Admin / Dev) */}
          {isAdminOrDev && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Manage sermon categories"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Categories</span>
            </button>
          )}

          {/* Upload Sermon Video Button (Admin / Dev) */}
          {isAdminOrDev && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Upload new sermon video"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search, Sort & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 200+ sermons by title, scripture, or topic..."
            className="w-full bg-card border border-border rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls: Sort & Grid/List View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card border border-border text-xs">
            <span className="text-[11px] text-muted-foreground font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-foreground outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-card text-foreground">Newest First</option>
              <option value="most_viewed" className="bg-card text-foreground">Most Viewed</option>
              <option value="title" className="bg-card text-foreground">Title (A-Z)</option>
              <option value="duration" className="bg-card text-foreground">Duration</option>
            </select>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-card border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'list' ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2.5 Channel Selector Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-card rounded-xl border border-border overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1 shrink-0">
          <Youtube className="w-3.5 h-3.5 text-red-500" /> Channel:
        </span>
        <button
          onClick={() => setSelectedChannel('all')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer",
            selectedChannel === 'all'
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          All Channels ({sermons.length})
        </button>
        <button
          onClick={() => setSelectedChannel('@joedaniels-official')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            selectedChannel === '@joedaniels-official'
              ? "bg-red-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          <Youtube className="w-3.5 h-3.5 fill-current" />
          <span>📺 @joedaniels-official</span>
        </button>
        <button
          onClick={() => setSelectedChannel('@JoeDanielsPodcastshow')}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            selectedChannel === '@JoeDanielsPodcastshow'
              ? "bg-amber-600 text-white shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>🎙️ @JoeDanielsPodcastshow</span>
        </button>
      </div>

      {/* 3. Category Chips Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer",
            selectedCategory === 'All'
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          All ({sermons.length})
        </button>
        {categories.map((cat) => {
          const count = sermons.filter(s => 
            (s.series && s.series.toLowerCase() === cat.toLowerCase()) ||
            (s as any).category?.toLowerCase() === cat.toLowerCase()
          ).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <span>{cat}</span>
              {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* 4. Sermons Video Feed */}
      {filteredAndSortedSermons.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-card border border-border rounded-2xl">
          <Tv className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <h3 className="font-bold text-base text-foreground">No sermons found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedSermons.map((sermon) => {
            const isDownloaded = offlineIds.includes(sermon.id);

            return (
              <div
                key={sermon.id}
                className="group rounded-2xl border border-border bg-card text-card-foreground shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Thumbnail & Video Trigger */}
                  <div 
                    onClick={() => handlePlaySermon(sermon)}
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                  >
                    <img 
                      src={sermon.thumbnail_url} 
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-semibold text-white">
                      {sermon.duration}
                    </span>

                    {/* Channel Tag Badge */}
                    {sermon.channel === '@JoeDanielsPodcastshow' ? (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-600/90 text-[9px] font-bold text-white shadow-xs flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5" />
                        Podcast
                      </span>
                    ) : (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600/90 text-[9px] font-bold text-white shadow-xs flex items-center gap-1">
                        <Youtube className="w-2.5 h-2.5 fill-current" />
                        Official
                      </span>
                    )}

                    {/* Access Indicator if restricted and user doesn't have Blue/Gold */}
                    {!hasLibraryAccess && sermon.requires_verification !== false && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 border border-primary/40 text-[9px] font-bold text-primary shadow-xs">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Blue/Gold</span>
                      </span>
                    )}

                    {isDownloaded && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-[10px] font-bold text-white shadow-xs">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Sermon Information */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-wider">
                      <span>{sermon.series || 'Apostolic Teaching'}</span>
                      <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                        <Eye className="w-3 h-3" />
                        {(sermon.view_count || 0).toLocaleString()} views
                      </span>
                    </div>

                    <h3 
                      onClick={() => handlePlaySermon(sermon)}
                      className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {sermon.title}
                    </h3>

                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {sermon.description}
                    </p>

                    {sermon.scriptures && sermon.scriptures.length > 0 && (
                      <div className="text-[10px] font-semibold text-primary/80 pt-1">
                        📖 {sermon.scriptures.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="px-3.5 py-2.5 bg-secondary/30 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePlaySermon(sermon)}
                      className="px-3 py-1.5 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-semibold flex items-center gap-1 cursor-pointer shadow-xs text-[11px]"
                      title={!hasLibraryAccess && sermon.requires_verification !== false ? "Requires Blue or Gold verification" : "Play video inline"}
                    >
                      {!hasLibraryAccess && sermon.requires_verification !== false ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Blue/Gold</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Watch</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handlePlaySermon(sermon, true)}
                      className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-semibold flex items-center gap-1 cursor-pointer text-[11px]"
                      title="Play in persistent top player"
                    >
                      <Tv className="w-3 h-3 text-primary" />
                      <span className="hidden sm:inline">On Top</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleDownload(sermon.id)}
                      className={cn(
                        "p-1.5 rounded-lg border transition-colors cursor-pointer",
                        isDownloaded ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                      )}
                      title={isDownloaded ? "Remove offline" : "Save offline"}
                    >
                      {isDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(sermon.title, sermon.description)}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-500 border border-border transition-colors cursor-pointer"
                      title="Share to WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5 -rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden">
          {filteredAndSortedSermons.map((sermon) => {
            const isDownloaded = offlineIds.includes(sermon.id);

            return (
              <div 
                key={sermon.id}
                className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div 
                    onClick={() => handlePlaySermon(sermon)}
                    className="relative w-28 sm:w-36 aspect-video bg-black rounded-xl overflow-hidden shrink-0 cursor-pointer group"
                  >
                    <img 
                      src={sermon.thumbnail_url} 
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold">
                      {sermon.duration}
                    </span>

                    {/* Channel Tag Badge */}
                    {sermon.channel === '@JoeDanielsPodcastshow' ? (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-600/90 text-[8px] font-bold text-white shadow-xs">
                        Podcast
                      </span>
                    ) : (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-600/90 text-[8px] font-bold text-white shadow-xs">
                        Official
                      </span>
                    )}

                    {!hasLibraryAccess && sermon.requires_verification !== false && (
                      <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-primary border border-primary/40 shadow-xs flex items-center gap-0.5">
                        <Lock className="w-2 h-2" />
                        <span>Paid</span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {sermon.series || 'Apostolic Series'}
                    </span>
                    <h3 
                      onClick={() => handlePlaySermon(sermon)}
                      className="font-bold text-xs sm:text-sm text-foreground truncate hover:text-primary transition-colors cursor-pointer"
                    >
                      {sermon.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {sermon.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span>{sermon.speaker}</span>
                      <span>•</span>
                      <span>{(sermon.view_count || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handlePlaySermon(sermon)}
                    className="px-3 py-1.5 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                    title={!hasLibraryAccess && sermon.requires_verification !== false ? "Requires Blue or Gold verification" : "Watch sermon"}
                  >
                    {!hasLibraryAccess && sermon.requires_verification !== false ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Blue/Gold</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handlePlaySermon(sermon, true)}
                    className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Watch in top player"
                  >
                    <Tv className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden sm:inline">On Top</span>
                  </button>

                  <button
                    onClick={() => handleToggleDownload(sermon.id)}
                    className={cn(
                      "p-1.5 rounded-xl border transition-colors cursor-pointer",
                      isDownloaded ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                    )}
                    title={isDownloaded ? "Saved offline" : "Save offline"}
                  >
                    {isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Inline Video Player Modal */}
      {activePlayingSermon && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePlayingSermon(null)}
        >
          <div 
            className="w-full max-w-3xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Player Frame */}
            <div className="relative aspect-video bg-black w-full flex items-center justify-center">
              {activePlayingSermon.video_url ? (
                /* Direct local / storage video player (MP4, MKV, WebM, MOV) */
                <video 
                  controls 
                  autoPlay 
                  playsInline 
                  src={activePlayingSermon.video_url}
                  className="w-full h-full max-h-[70vh] object-contain"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : activePlayingSermon.youtube_id ? (
                /* YouTube embed player */
                <iframe
                  src={StorageService.getYoutubeEmbedUrl(activePlayingSermon.youtube_id)}
                  title={activePlayingSermon.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">Video stream unavailable</div>
              )}

              <button
                onClick={() => setActivePlayingSermon(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                title="Close video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Details Bar & Recommended Queue */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[50vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {activePlayingSermon.series || 'Apostolic Series'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      <span>👑 Covenant Partner HD Access</span>
                    </span>
                    {activePlayingSermon.channel && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white flex items-center gap-1">
                        {activePlayingSermon.channel === '@JoeDanielsPodcastshow' ? '🎙️ Podcast Show' : '📺 Official Channel'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    {activePlayingSermon.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePlaySermon(activePlayingSermon, true)}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                    title="Play on Top Player"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Pin to Top</span>
                  </button>
                  <button
                    onClick={() => handleToggleDownload(activePlayingSermon.id)}
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                    title="Save offline"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {activePlayingSermon.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-b border-border pb-3">
                <span>{activePlayingSermon.speaker} • {activePlayingSermon.duration}</span>
                <span>{(activePlayingSermon.view_count || 0).toLocaleString()} views</span>
              </div>

              {/* Recommended & Related Videos Queue */}
              {relatedSermons.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Recommended & Related Videos ({relatedSermons.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground">Up Next</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {relatedSermons.map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => {
                          StorageService.recordSermonView(rel.id, false);
                          setActivePlayingSermon(rel);
                        }}
                        className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary border border-border flex items-center gap-2.5 cursor-pointer transition-all group"
                      >
                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-black">
                          <img
                            src={rel.thumbnail_url}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white fill-current" />
                          </div>
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] px-1 bg-black/80 text-white rounded">
                            {rel.duration}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {rel.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {rel.speaker} • {(rel.view_count || 0).toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5.5 Covenant Partner Verification Required Modal */}
      {showAccessDeniedModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowAccessDeniedModal(false)}
        >
          <div 
            className="w-full max-w-md bg-card border border-primary/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-primary/20 to-blue-500/20 border border-primary/40 text-primary mx-auto flex items-center justify-center shadow-lg">
              <Crown className="w-8 h-8 text-primary animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                Partner Privilege
              </span>
              <h2 className="text-lg sm:text-xl font-black text-foreground">
                Covenant Partner Verification Required
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                The Apostolic Sermon Archive (200+ HD teachings) is reserved exclusively for Blue and Gold verified covenant partners.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-secondary/50 border border-border text-left space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Status:</span>
                <span className="font-bold text-foreground capitalize">
                  {userProfile?.badge_type ? `${userProfile.badge_type} Partner` : 'Unverified / Silver Member'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Video Selected:</span>
                <span className="font-bold text-primary truncate max-w-[200px]">
                  {restrictedSermon?.title || 'Apostolic Teaching'}
                </span>
              </div>
            </div>

            {/* Verification Tiers Selection */}
            <div className="grid grid-cols-2 gap-2 text-left">
              {/* Blue Verification */}
              <div 
                onClick={() => !isPayProcessing && setSelectedTierBadge('blue')}
                className={cn(
                  "p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                  selectedTierBadge === 'blue' 
                    ? "border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/40 shadow-sm" 
                    : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Blue Partner</span>
                  </div>
                  {selectedTierBadge === 'blue' && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  )}
                </div>
                <div className="text-base font-black text-foreground mt-1">$9.99<span className="text-[10px] font-normal text-muted-foreground">/mo</span></div>
                <p className="text-[10px] text-muted-foreground mt-0.5">200+ HD sermons, blue badge, downloads.</p>
              </div>

              {/* Gold Verification */}
              <div 
                onClick={() => !isPayProcessing && setSelectedTierBadge('gold')}
                className={cn(
                  "p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                  selectedTierBadge === 'gold' 
                    ? "border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/40 shadow-sm" 
                    : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Crown className="w-4 h-4" />
                    <span>Gold VIP</span>
                  </div>
                  {selectedTierBadge === 'gold' && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">✓</span>
                  )}
                </div>
                <div className="text-base font-black text-foreground mt-1">$29.99<span className="text-[10px] font-normal text-muted-foreground">/mo</span></div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Everything in Blue + gold VIP badge & prayer line.</p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payment Method:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => !isPayProcessing && setPayMethod('EcoCash')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    payMethod === 'EcoCash' ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  📱 EcoCash Express
                </button>
                <button
                  type="button"
                  onClick={() => !isPayProcessing && setPayMethod('Card')}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    payMethod === 'Card' ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  💳 Card / In-App
                </button>
              </div>
            </div>

            {/* Mobile Phone Input */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>{payMethod === 'EcoCash' ? 'EcoCash Phone Number:' : 'Mobile Number for Receipt:'}</span>
                <span className="text-[10px] text-muted-foreground/70 font-mono">e.g. 0772123456</span>
              </label>
              <input
                type="tel"
                value={payPhone}
                disabled={isPayProcessing}
                onChange={(ev) => setPayPhone(ev.target.value)}
                placeholder="0772123456"
                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Error Message */}
            {payError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left font-medium">
                {payError}
              </div>
            )}

            {/* Processing Spinner */}
            {isPayProcessing && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold">{pollStatusMsg || 'Processing payment...'}</span>
              </div>
            )}

            {/* Action CTA Button */}
            <button
              type="button"
              disabled={isPayProcessing}
              onClick={handleExecutePayment}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2",
                isPayProcessing
                  ? "opacity-60 cursor-not-allowed bg-secondary text-muted-foreground"
                  : selectedTierBadge === 'gold'
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-black"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
            >
              {isPayProcessing 
                ? 'Authorizing Payment...' 
                : `Pay $${selectedTierBadge === 'gold' ? '29.99' : '9.99'}/mo via ${payMethod}`
              }
            </button>

            <button
              type="button"
              disabled={isPayProcessing}
              onClick={() => setShowAccessDeniedModal(false)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold py-1 cursor-pointer block mx-auto"
            >
              Browse Catalog Only (No Playback)
            </button>
          </div>
        </div>
      )}

      {/* 6. Admin / Dev Sermon Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => !isUploading && setShowUploadModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Upload Sermon Video</h3>
                  <p className="text-[11px] text-muted-foreground">Admin & Developer video upload desk</p>
                </div>
              </div>
              <button 
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              {/* Video Source Switcher */}
              <div className="flex items-center p-1 bg-secondary rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setUploadVideoSource('file')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    uploadVideoSource === 'file' ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Local Video File (MP4, MKV, WebM)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadVideoSource('youtube')}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                    uploadVideoSource === 'youtube' ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  YouTube / Video URL
                </button>
              </div>

              {/* Source 1: Local Device File */}
              {uploadVideoSource === 'file' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">Select Video File</label>
                  <input
                    type="file"
                    accept="video/mp4,video/mkv,video/webm,video/quicktime,video/x-matroska,.mp4,.mkv,.webm,.mov"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground file:cursor-pointer bg-secondary rounded-xl p-2 border border-border"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Supports MP4, MKV, WebM, MOV. Large files uploaded straight to Supabase Storage media bucket.
                  </p>
                </div>
              ) : (
                /* Source 2: YouTube / Direct URL */
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">YouTube Video Link</label>
                  <input
                    type="url"
                    value={uploadYoutubeUrl}
                    onChange={(e) => setUploadYoutubeUrl(e.target.value)}
                    placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Sermon Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. The Power of Kingdom Decrees"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
              </div>

              {/* Speaker & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Speaker</label>
                  <input
                    type="text"
                    value={uploadSpeaker}
                    onChange={(e) => setUploadSpeaker(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Duration (e.g. 45m)</label>
                  <input
                    type="text"
                    value={uploadDuration}
                    onChange={(e) => setUploadDuration(e.target.value)}
                    placeholder="45m"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Category & Series */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => {
                      setUploadCategory(e.target.value);
                      setUploadSeries(e.target.value);
                    }}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/80 mb-1">Series</label>
                  <input
                    type="text"
                    value={uploadSeries}
                    onChange={(e) => setUploadSeries(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Scripture References */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Scripture References</label>
                <input
                  type="text"
                  value={uploadScriptures}
                  onChange={(e) => setUploadScriptures(e.target.value)}
                  placeholder="e.g. Isaiah 60:1-3, Romans 8:28"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Summary of prophetic word and apostolic teaching..."
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
                />
              </div>

              {uploadProgressMsg && (
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-bold animate-pulse text-center">
                  {uploadProgressMsg}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Publishing...' : 'Add to Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Category Management Modal (Admin / Dev) */}
      {showCategoryModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowCategoryModal(false)}
        >
          <div 
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">Manage Categories</h3>
                  <p className="text-[11px] text-muted-foreground">Add or remove sermon categories</p>
                </div>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold shrink-0 cursor-pointer"
              >
                + Add
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="divide-y divide-border/60 max-h-60 overflow-y-auto rounded-xl border border-border bg-secondary/20">
              {categories.map((cat) => (
                <div key={cat} className="p-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title={`Delete category ${cat}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. YouTube Studio Video Analytics Dashboard Modal */}
      <VideoAnalyticsDashboard
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        onPlaySermon={(sermon) => handlePlaySermon(sermon)}
      />
    </div>
  );
};
