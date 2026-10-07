import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Search, 
  X, 
  Grid3X3, 
  List, 
  Tv, 
  Plus, 
  Filter, 
  BarChart3, 
  Check, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  TrendingUp, 
  RefreshCw, 
  ArrowUpRight, 
  Video, 
  Youtube, 
  Flame, 
  Download,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Sermon, User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StorageBucketService } from '../../services/StorageBucketService';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface VideoLibraryManagerProps {
  currentUser?: User | null;
  onPlaySermon?: (sermon: Sermon) => void;
  onSetOverridePlayingVideo?: (video: any) => void;
}

export const VideoLibraryManager: React.FC<VideoLibraryManagerProps> = ({
  currentUser,
  onPlaySermon,
  onSetOverridePlayingVideo
}) => {
  // Sermons & Categories state
  const [sermons, setSermons] = useState<Sermon[]>(() => StorageService.getSermons());
  const [categories, setCategories] = useState<string[]>(() => StorageService.getSermonCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedChannel, setSelectedChannel] = useState<'all' | '@joedaniels-official' | '@JoeDanielsPodcastshow'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'most_viewed' | 'newest' | 'most_liked' | 'title' | 'top_player' | 'duration'>('most_viewed');

  // Analytics state
  const [analytics, setAnalytics] = useState(() => StorageService.getSermonAnalytics());
  const [activeAnalyticsView, setActiveAnalyticsView] = useState<'overview' | 'most_viewed' | 'most_liked' | 'top_player'>('overview');

  // Modals state
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Sermon | null>(null);
  const [importingChannel, setImportingChannel] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload/Edit Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('Apostle Joe Daniels');
  const [formCategory, setFormCategory] = useState('Sunday Services');
  const [formChannel, setFormChannel] = useState<'@joedaniels-official' | '@JoeDanielsPodcastshow'>('@joedaniels-official');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('45m');
  const [formScriptures, setFormScriptures] = useState('');
  const [formVideoSource, setFormVideoSource] = useState<'file' | 'youtube' | 'facebook'>('youtube');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formRequiresVerification, setFormRequiresVerification] = useState<boolean>(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Category modal state
  const [newCategoryName, setNewCategoryName] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync listener
  const refreshAll = () => {
    setSermons(StorageService.getSermons());
    setCategories(StorageService.getSermonCategories());
    setAnalytics(StorageService.getSermonAnalytics());
  };

  useEffect(() => {
    window.addEventListener('gcz_sermon_added', refreshAll);
    window.addEventListener('gcz_sermon_updated', refreshAll);
    window.addEventListener('gcz_sermon_deleted', refreshAll);
    window.addEventListener('gcz_sermon_categories_updated', refreshAll);
    window.addEventListener('gcz_sermon_view_recorded', refreshAll);
    return () => {
      window.removeEventListener('gcz_sermon_added', refreshAll);
      window.removeEventListener('gcz_sermon_updated', refreshAll);
      window.removeEventListener('gcz_sermon_deleted', refreshAll);
      window.removeEventListener('gcz_sermon_categories_updated', refreshAll);
      window.removeEventListener('gcz_sermon_view_recorded', refreshAll);
    };
  }, []);

  // Filter & Sort Sermons
  const filteredSermons = useMemo(() => {
    let result = [...sermons];

    // 1. Channel Filter
    if (selectedChannel !== 'all') {
      result = result.filter(s => (s.channel || '@joedaniels-official') === selectedChannel);
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(s => (s.series && s.series.toLowerCase() === selectedCategory.toLowerCase()));
    }

    // 3. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) ||
        (s.speaker && s.speaker.toLowerCase().includes(q)) ||
        (s.series && s.series.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.scriptures && s.scriptures.some(sc => sc.toLowerCase().includes(q)))
      );
    }

    // 4. Sort
    switch (sortBy) {
      case 'most_viewed':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'top_player':
        result.sort((a, b) => (b.top_player_views || 0) - (a.top_player_views || 0));
        break;
      case 'duration':
        result.sort((a, b) => (parseInt(b.duration) || 0) - (parseInt(a.duration) || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => {
          const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        break;
    }

    return result;
  }, [sermons, selectedChannel, selectedCategory, searchQuery, sortBy]);

  // Handle Channel Import
  const handleImportChannel = (channel: '@joedaniels-official' | '@JoeDanielsPodcastshow') => {
    setImportingChannel(channel);
    try {
      const res = StorageService.importChannelVideos(channel);
      refreshAll();
      confetti({ particleCount: 30, spread: 60 });
      showToast(`✓ Imported ${res.count} videos from ${channel}!`);
    } catch {
      showToast('Error importing channel videos');
    } finally {
      setTimeout(() => setImportingChannel(null), 800);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);
    setFormTitle(sermon.title);
    setFormSpeaker(sermon.speaker);
    setFormCategory(sermon.series);
    setFormChannel((sermon.channel as any) || '@joedaniels-official');
    setFormDescription(sermon.description);
    setFormDuration(sermon.duration);
    setFormScriptures(sermon.scriptures ? sermon.scriptures.join(', ') : '');
    setFormRequiresVerification(sermon.requires_verification !== false);
    setFormVideoUrl(sermon.video_url || (sermon.youtube_id ? `https://youtube.com/watch?v=${sermon.youtube_id}` : ''));
    setFormVideoSource(sermon.video_url ? 'file' : 'youtube');
    setUploadFile(null);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSermon(null);
    setFormTitle('');
    setFormSpeaker('Apostle Joe Daniels');
    setFormCategory(categories[0] || 'Sunday Services');
    setFormChannel(selectedChannel !== 'all' ? selectedChannel : '@joedaniels-official');
    setFormDescription('');
    setFormDuration('45m');
    setFormScriptures('');
    setFormRequiresVerification(true);
    setFormVideoUrl('');
    setFormVideoSource('youtube');
    setUploadFile(null);
    setShowUploadModal(true);
  };

  // Handle Save (Create or Update)
  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter a video title');
      return;
    }
    setIsSaving(true);

    try {
      let finalVideoUrl = editingSermon?.video_url;
      let finalYoutubeId = editingSermon?.youtube_id || 'upeY03DKvTo';
      let finalThumb = editingSermon?.thumbnail_url || '/assets/apostle_joe_daniels_main.jpg';

      if (formVideoSource === 'file' && uploadFile) {
        setProgressMsg(`Uploading ${uploadFile.name}...`);
        const remoteUrl = await StorageBucketService.uploadFileToMediaBucket(uploadFile, 'sermons');
        if (remoteUrl) {
          finalVideoUrl = remoteUrl;
        }
      } else if (formVideoSource === 'youtube' && formVideoUrl.trim()) {
        const extracted = StorageService.extractYoutubeId(formVideoUrl.trim());
        if (extracted) {
          finalYoutubeId = extracted;
          finalThumb = `https://img.youtube.com/vi/${extracted}/hqdefault.jpg`;
          finalVideoUrl = undefined;
        } else {
          finalVideoUrl = formVideoUrl.trim();
        }
      } else if (formVideoSource === 'facebook' && formVideoUrl.trim()) {
        finalVideoUrl = formVideoUrl.trim();
      }

      const sermonData: Sermon = {
        id: editingSermon?.id || `sermon_${Date.now()}`,
        title: formTitle.trim(),
        speaker: formSpeaker.trim() || 'Apostle Joe Daniels',
        date: editingSermon?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        series: formCategory.trim() || 'Sunday Services',
        channel: formChannel,
        duration: formDuration.trim() || '45m',
        youtube_id: finalYoutubeId,
        video_url: finalVideoUrl,
        thumbnail_url: finalThumb,
        scriptures: formScriptures ? formScriptures.split(',').map(s => s.trim()).filter(Boolean) : [],
        description: formDescription.trim() || `Apostolic teaching by ${formSpeaker}.`,
        view_count: editingSermon?.view_count || 1,
        requires_verification: formRequiresVerification,
        is_live: false,
        is_premium: false
      };

      if (editingSermon) {
        StorageService.updateSermon(sermonData);
        showToast('✓ Video updated successfully!');
      } else {
        StorageService.addSermon(sermonData);
        showToast('✓ New video added to library!');
      }

      refreshAll();
      setEditingSermon(null);
      setShowUploadModal(false);
      confetti({ particleCount: 35, spread: 60 });
    } catch {
      showToast('Error saving video');
    } finally {
      setIsSaving(false);
      setProgressMsg('');
    }
  };

  // Handle Delete
  const handleDeleteSermon = (sermon: Sermon) => {
    StorageService.deleteSermon(sermon.id);
    refreshAll();
    setShowDeleteConfirm(null);
    showToast(`✓ Removed "${sermon.title}"`);
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const ok = StorageService.addSermonCategory(newCategoryName);
    if (ok) {
      setCategories(StorageService.getSermonCategories());
      setNewCategoryName('');
      confetti({ particleCount: 20, spread: 40 });
      showToast('✓ Category added');
    } else {
      showToast('Category already exists');
    }
  };

  // Delete Category
  const handleDeleteCategory = (catName: string) => {
    StorageService.deleteSermonCategory(catName);
    setCategories(StorageService.getSermonCategories());
    if (selectedCategory === catName) setSelectedCategory('All');
    showToast(`✓ Deleted category "${catName}"`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-foreground">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-primary text-foreground px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. YouTube Studio Analytics Summary Header */}
      <div className="bg-gradient-to-br from-card via-card to-red-950/20 border border-border p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg text-foreground">
                  Video Library & Studio Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600/20 text-red-500 border border-red-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Central management suite for sermons, channels, access permissions, and engagement metrics.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Categories</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Upload / Add Video</span>
            </button>
          </div>
        </div>

        {/* Studio Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Total Views</span>
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-foreground mt-1">
              {analytics.totalViews.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +12.4% this week
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Playing On Top Views</span>
              <Tv className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-foreground mt-1">
              {analytics.totalTopPlayerViews.toLocaleString()}
            </p>
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 mt-0.5">
              <Flame className="w-3 h-3" /> Pinned engagement
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Total Likes</span>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-foreground mt-1">
              {analytics.totalLikes.toLocaleString()}
            </p>
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5 mt-0.5">
              ❤️ Real-time likes
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Library Videos</span>
              <Video className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-foreground mt-1">
              {sermons.length}
            </p>
            <span className="text-[10px] text-primary font-bold mt-0.5">
              {categories.length} Categories
            </span>
          </div>
        </div>
      </div>

      {/* 2. Official Channels Bar & One-Click Importers */}
      <div className="bg-card border border-border p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="font-bold text-xs sm:text-sm text-foreground">Official Ministry Channels</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              disabled={importingChannel === '@joedaniels-official'}
              onClick={() => handleImportChannel('@joedaniels-official')}
              className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Import latest Sunday Services & Apostolic Word from @joedaniels-official"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", importingChannel === '@joedaniels-official' && "animate-spin")} />
              <span>Sync @joedaniels-official</span>
            </button>

            <button
              disabled={importingChannel === '@JoeDanielsPodcastshow'}
              onClick={() => handleImportChannel('@JoeDanielsPodcastshow')}
              className="px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Import latest podcast episodes from @JoeDanielsPodcastshow"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", importingChannel === '@JoeDanielsPodcastshow' && "animate-spin")} />
              <span>Sync @JoeDanielsPodcastshow</span>
            </button>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Channels (${sermons.length})` },
            { id: '@joedaniels-official', label: `📺 @joedaniels-official (${sermons.filter(s => (s.channel || '@joedaniels-official') === '@joedaniels-official').length})` },
            { id: '@JoeDanielsPodcastshow', label: `🎙️ @JoeDanielsPodcastshow (${sermons.filter(s => s.channel === '@JoeDanielsPodcastshow').length})` }
          ].map(ch => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                selectedChannel === ch.id
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search, Category, Sorting, and View Filter Bar */}
      <div className="bg-card border border-border p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, topic, speaker, scriptures..."
              className="w-full bg-secondary/60 border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 bg-secondary/60 border border-border rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-foreground font-medium focus:outline-none cursor-pointer"
              >
                <option value="most_viewed">Most Viewed</option>
                <option value="top_player">Playing On Top</option>
                <option value="most_liked">Most Liked</option>
                <option value="newest">Newest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="duration">Duration</option>
              </select>
            </div>

            {/* List / Grid Toggle */}
            <div className="flex items-center bg-secondary/60 border border-border rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  viewMode === 'grid' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid view"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer",
              selectedCategory === 'All'
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Video Management Table or Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing {filteredSermons.length} of {sermons.length} videos</span>
          <span>Access: Only Blue & Gold verified members can play</span>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs divide-y divide-border">
            {filteredSermons.map((sermon, idx) => (
              <div 
                key={sermon.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-border">
                    <img 
                      src={sermon.thumbnail_url || '/assets/apostle_joe_daniels_main.jpg'} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white text-[9px] font-mono font-bold">
                      {sermon.duration}
                    </span>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {sermon.series}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {sermon.channel || '@joedaniels-official'}
                      </span>
                      {sermon.requires_verification !== false ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Blue/Gold Only
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          <Unlock className="w-2.5 h-2.5" /> Free Preview
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      {sermon.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{sermon.speaker}</span>
                      <span>•</span>
                      <span className="font-bold text-foreground">{(sermon.view_count || 0).toLocaleString()} views</span>
                      <span>•</span>
                      <span>{(sermon.top_player_views || 0)} top views</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {onSetOverridePlayingVideo && (
                    <button
                      onClick={() => {
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
                        StorageService.recordSermonView(sermon.id, true);
                        showToast(`✓ Pinned "${sermon.title}" to Top Player`);
                      }}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      title="Pin to Playing On Top"
                    >
                      <Tv className="w-3.5 h-3.5 text-amber-500" />
                      <span className="hidden sm:inline">Pin on Top</span>
                    </button>
                  )}

                  {onPlaySermon && (
                    <button
                      onClick={() => onPlaySermon(sermon)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      title="Preview playback"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Play</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEdit(sermon)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    title="Edit video details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(sermon)}
                    className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                    title="Delete video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSermons.map(sermon => (
              <div 
                key={sermon.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-black w-full overflow-hidden">
                    <img 
                      src={sermon.thumbnail_url || '/assets/apostle_joe_daniels_main.jpg'} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-bold">
                      {sermon.duration}
                    </span>
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-bold text-primary">
                      {sermon.series}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{sermon.channel || '@joedaniels-official'}</span>
                      {sermon.requires_verification !== false ? (
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Blue/Gold
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-bold">Free Preview</span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2">
                      {sermon.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {sermon.description}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-border/40 mt-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{(sermon.view_count || 0).toLocaleString()} views</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sermon)}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(sermon)}
                      className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive text-destructive hover:text-white cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Create / Edit Video Modal */}
      {(showUploadModal || editingSermon) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => !isSaving && (setShowUploadModal(false), setEditingSermon(null))}
        >
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm sm:text-base text-foreground">
                  {editingSermon ? 'Edit Video Details' : 'Upload & Add New Video'}
                </h3>
              </div>
              <button
                disabled={isSaving}
                onClick={() => (setShowUploadModal(false), setEditingSermon(null))}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSermon} className="space-y-3.5 text-left text-xs">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Walking in Supernatural Dominion"
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Channel Attribution & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Channel Attribution
                  </label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as any)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="@joedaniels-official">@joedaniels-official (Ministry)</option>
                    <option value="@JoeDanielsPodcastshow">@JoeDanielsPodcastshow (Podcast)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Category / Series
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Speaker & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Speaker
                  </label>
                  <input
                    type="text"
                    value={formSpeaker}
                    onChange={(e) => setFormSpeaker(e.target.value)}
                    placeholder="Apostle Joe Daniels"
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 1h 14m or 58m"
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Video Source Type */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Video Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['youtube', 'file', 'facebook'] as const).map(source => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setFormVideoSource(source)}
                      className={cn(
                        "py-2 rounded-xl font-bold capitalize transition-all border text-xs cursor-pointer",
                        formVideoSource === source
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                      )}
                    >
                      {source === 'youtube' ? 'YouTube URL' : source === 'file' ? 'Local Video File' : 'Facebook Video'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Input */}
              {formVideoSource === 'file' ? (
                <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2">
                  <label className="block text-[11px] font-bold text-foreground">
                    Select Video from Device (MP4, MKV, WebM, MOV)
                  </label>
                  <input
                    type="file"
                    accept="video/*,.mkv,.mp4,.webm,.mov"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadFile(file);
                    }}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                  />
                  {uploadFile && (
                    <p className="text-[11px] text-emerald-500 font-semibold">
                      ✓ Ready to upload: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {formVideoSource === 'youtube' ? 'YouTube Video URL or ID' : 'Facebook Video Embed URL'}
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder={formVideoSource === 'youtube' ? 'https://youtube.com/watch?v=... or Video ID' : 'https://www.facebook.com/.../videos/...'}
                    className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Scriptures */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Scripture References (comma separated)
                </label>
                <input
                  type="text"
                  value={formScriptures}
                  onChange={(e) => setFormScriptures(e.target.value)}
                  placeholder="e.g. Matthew 6:6, Romans 5:17"
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summary of prophetic teaching..."
                  className="w-full bg-secondary/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Access Control Permission Toggle */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    Restrict to Blue or Gold Verified Members
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When active, Silver and general users cannot stream this video and must upgrade.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formRequiresVerification}
                  onChange={(e) => setFormRequiresVerification(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Progress message */}
              {isSaving && progressMsg && (
                <div className="p-2 rounded-lg bg-primary/20 text-primary text-[11px] font-semibold text-center animate-pulse">
                  {progressMsg}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => (setShowUploadModal(false), setEditingSermon(null))}
                  className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingSermon ? 'Update Video' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Category Management Modal */}
      {showCategoryModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowCategoryModal(false)}
        >
          <div 
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Manage Sermon Categories</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new category form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="flex-1 bg-secondary/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold shrink-0 cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Existing categories list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {categories.map(cat => (
                <div 
                  key={cat}
                  className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 border border-border"
                >
                  <span className="font-semibold text-foreground">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div 
            className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Delete Video?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <strong className="text-foreground">"{showDeleteConfirm.title}"</strong>? This will permanently remove it from the Sermons tab.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSermon(showDeleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-destructive hover:brightness-110 text-destructive-foreground text-xs font-bold shadow-md cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
