import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Flag, 
  CheckCircle2, 
  Share2, 
  Users, 
  MessageCircle, 
  MapPin, 
  Globe, 
  Phone, 
  Calendar, 
  Sparkles, 
  Plus, 
  Heart, 
  MessageSquare, 
  Bell, 
  Send,
  ExternalLink,
  Edit3,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Shield,
  Trash2,
  AlertTriangle,
  Check,
  UserPlus,
  UserMinus,
  Settings,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChurchPage, User, PagePost, Testimony, PageCategory } from '../../types';
import { StorageService } from '../../services/storageService';
import { StorageBucketService } from '../../services/StorageBucketService';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';

interface ChurchPageViewModalProps {
  page: ChurchPage;
  currentUser: User;
  onClose: () => void;
  onUpdatePage?: (updatedPage: ChurchPage) => void;
}

export const ChurchPageViewModal: React.FC<ChurchPageViewModalProps> = ({
  page: initialPage,
  currentUser,
  onClose,
  onUpdatePage
}) => {
  const [currentPage, setCurrentPage] = useState<ChurchPage>(initialPage);
  const [isFollowing, setIsFollowing] = useState<boolean>(() => 
    StorageService.isUserFollowingPage(initialPage.id, currentUser.id)
  );
  const [followersCount, setFollowersCount] = useState<number>(initialPage.followers_count || (initialPage.followers || []).length);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  
  // Page Posts
  const [pagePosts, setPagePosts] = useState<PagePost[]>(() => 
    StorageService.getPagePosts(initialPage.id)
  );
  const [allTestimonies, setAllTestimonies] = useState<Testimony[]>(() => 
    StorageService.getTestimonies().filter(t => t.page_id === initialPage.id)
  );

  // New Post Form for Admins
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImageBase64, setPostImageBase64] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct Photo Pickers for Cover and Avatar
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Modals for Page Administration
  const [showEditPageModal, setShowEditPageModal] = useState(false);
  const [showManageAdminsModal, setShowManageAdminsModal] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  
  // Edit Page Form State
  const [editName, setEditName] = useState(currentPage.name);
  const [editHandle, setEditHandle] = useState(currentPage.handle);
  const [editCategory, setEditCategory] = useState<PageCategory>(currentPage.category);
  const [editBio, setEditBio] = useState(currentPage.bio);
  const [editLocation, setEditLocation] = useState(currentPage.location || '');
  const [editPhone, setEditPhone] = useState(currentPage.phone_number || '');
  const [editWhatsApp, setEditWhatsApp] = useState(currentPage.whatsapp_link || '');
  const [editWebsite, setEditWebsite] = useState(currentPage.website_url || '');
  const [editRulesText, setEditRulesText] = useState((currentPage.rules || []).join('\n'));

  // Authorization checks
  const isCreator = currentPage.creator_id === currentUser.id;
  const isAdmin = Boolean(currentPage.admin_ids?.includes(currentUser.id) || isCreator);
  const isDeveloperOrSuperAdmin = 
    currentUser.role === 'developer' || 
    currentUser.role === 'super_admin' || 
    currentUser.id === 'usr_developer' || 
    currentUser.id === 'usr_apostle_joe' || 
    Boolean(currentUser.phone && (currentUser.phone.includes('0780699988') || currentUser.phone.includes('0771445642')));
  const canManagePage = isAdmin || isDeveloperOrSuperAdmin;

  // Rules Agreement state
  const hasAgreedRules = Boolean(currentPage.agreed_user_ids?.includes(currentUser.id) || isCreator || isAdmin);

  const handleToggleFollow = () => {
    const result = StorageService.toggleFollowPage(currentPage.id, currentUser.id);
    setIsFollowing(result.isFollowing);
    setFollowersCount(result.count);
    const updated = {
      ...currentPage,
      followers_count: result.count,
      followers: result.isFollowing 
        ? [...(currentPage.followers || []).filter(id => id !== currentUser.id), currentUser.id]
        : (currentPage.followers || []).filter(id => id !== currentUser.id)
    };
    setCurrentPage(updated);
    if (onUpdatePage) onUpdatePage(updated);

    if (result.isFollowing) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 }
      });
    }
  };

  const handleSharePage = () => {
    const url = window.location.href;
    const text = `Join and follow ${currentPage.name} on Joe Daniels Connect:\n${url}`;
    if (navigator.share) {
      navigator.share({ title: currentPage.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Page link copied to clipboard!');
    }
  };

  // Upload helpers
  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      let url = await StorageBucketService.uploadFileToMediaBucket(file, 'media');
      if (!url) {
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      if (url) {
        const updated = StorageService.updatePage(currentPage.id, { cover_url: url });
        if (updated) {
          setCurrentPage(updated);
          if (onUpdatePage) onUpdatePage(updated);
          confetti({ particleCount: 20 });
        }
      }
    } catch (err) {
      console.warn('Cover photo upload notice:', err);
    }
    e.target.value = '';
  };

  const handleAvatarPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      let url = await StorageBucketService.uploadFileToMediaBucket(file, 'media');
      if (!url) {
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = ev => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      if (url) {
        const updated = StorageService.updatePage(currentPage.id, { avatar_url: url });
        if (updated) {
          setCurrentPage(updated);
          if (onUpdatePage) onUpdatePage(updated);
          confetti({ particleCount: 20 });
        }
      }
    } catch (err) {
      console.warn('Avatar photo upload notice:', err);
    }
    e.target.value = '';
  };

  const handleSavePageDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const parsedRules = editRulesText
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const updates: Partial<ChurchPage> = {
      name: editName.trim(),
      handle: editHandle.trim().startsWith('@') ? editHandle.trim() : `@${editHandle.trim()}`,
      category: editCategory,
      bio: editBio.trim(),
      location: editLocation.trim() || undefined,
      phone_number: editPhone.trim() || undefined,
      whatsapp_link: editWhatsApp.trim() || undefined,
      website_url: editWebsite.trim() || undefined,
      rules: parsedRules.length > 0 ? parsedRules : currentPage.rules
    };

    const updated = StorageService.updatePage(currentPage.id, updates);
    if (updated) {
      setCurrentPage(updated);
      if (onUpdatePage) onUpdatePage(updated);
      setShowEditPageModal(false);
      confetti({ particleCount: 25 });
    }
  };

  const handleAddAdmin = (userId: string) => {
    const updated = StorageService.addPageAdmin(currentPage.id, userId);
    if (updated) {
      setCurrentPage(updated);
      if (onUpdatePage) onUpdatePage(updated);
    }
  };

  const handleRemoveAdmin = (userId: string) => {
    if (userId === currentPage.creator_id) {
      alert('The page creator cannot be removed as admin.');
      return;
    }
    const updated = StorageService.removePageAdmin(currentPage.id, userId);
    if (updated) {
      setCurrentPage(updated);
      if (onUpdatePage) onUpdatePage(updated);
    }
  };

  const handleAgreeRules = () => {
    StorageService.agreeToPageRules(currentPage.id, currentUser.id);
    const updated = {
      ...currentPage,
      agreed_user_ids: [...(currentPage.agreed_user_ids || []), currentUser.id]
    };
    setCurrentPage(updated);
    if (onUpdatePage) onUpdatePage(updated);
    confetti({ particleCount: 25, spread: 45 });
  };

  const handleDeletePage = () => {
    if (confirm(`ADMIN / DEVELOPER ACTION: Permanently DELETE and DISSOLVE "${currentPage.name}"? This action removes all page posts and members forever.`)) {
      StorageService.deletePage(currentPage.id);
      onClose();
      alert(`Page "${currentPage.name}" has been permanently dissolved.`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      const bucketUrl = await StorageBucketService.uploadFileToMediaBucket(file, 'media');
      if (bucketUrl) {
        setPostImageBase64(bucketUrl);
        e.target.value = '';
        return;
      }
    } catch (err) {
      console.warn('Storage bucket page post photo notice:', err);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      setPostImageBase64(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setIsSubmittingPost(true);

    // 1. Create page post record
    const newPagePost = StorageService.createPagePost(
      currentPage.id,
      currentUser.id,
      currentPage.name,
      postContent.trim(),
      postImageBase64 || undefined,
      currentPage.avatar_url
    );

    // 2. Also publish to main community testimonies feed
    const newTestimony = StorageService.submitTestimony({
      user_id: currentUser.id,
      user_name: currentPage.name,
      user_handle: currentPage.handle,
      user_avatar: currentPage.avatar_url,
      title: `${currentPage.name} Announcement`,
      category: 'Praise & Testimony',
      content: postContent.trim(),
      image_url: postImageBase64 || undefined,
      page_id: currentPage.id,
      page_name: currentPage.name,
      page_handle: currentPage.handle,
      page_avatar: currentPage.avatar_url,
      page_verified: true
    });

    setPagePosts(prev => [newPagePost, ...prev]);
    setAllTestimonies(prev => [newTestimony, ...prev]);
    setPostContent('');
    setPostImageBase64('');
    setShowCreatePost(false);
    setIsSubmittingPost(false);

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 }
    });
  };

  const handleLikePagePost = (postId: string) => {
    StorageService.toggleLikePagePost(postId, currentUser.id);
    setPagePosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isCurrentlyLiked = p.likes.includes(currentUser.id);
        const newLikes = isCurrentlyLiked 
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
  };

  const allChurchUsers = StorageService.getAllUsers();
  const eligibleAdmins = allChurchUsers.filter(u => 
    u.id !== currentPage.creator_id && 
    (u.full_name.toLowerCase().includes(adminSearchQuery.toLowerCase()) || 
     u.handle?.toLowerCase().includes(adminSearchQuery.toLowerCase()))
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto ${
      isFullscreen ? 'p-0' : 'p-0 sm:p-3 md:p-5'
    }`}>
      {/* Hidden file inputs for photo uploads */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverPhotoChange} className="hidden" />
      <input ref={avatarFileInputRef} type="file" accept="image/*" onChange={handleAvatarPhotoChange} className="hidden" />

      {/* Main Container */}
      <div className={`bg-card border border-border overflow-y-auto relative flex flex-col transition-all duration-300 shadow-2xl ${
        isFullscreen
          ? 'w-full h-full rounded-none'
          : 'w-full max-w-2xl h-full sm:h-[94vh] sm:rounded-2xl'
      }`}>
        
        {/* Floating Top Bar */}
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-card/90 backdrop-blur-md border-b border-border/50 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Close Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Back</span>
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[140px] sm:max-w-[240px]">
                {currentPage.name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {canManagePage && (
              <>
                <button
                  onClick={() => setShowEditPageModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-bold text-[11px] border border-border flex items-center gap-1 cursor-pointer transition-colors"
                  title="Edit Page Info, Name & Cover"
                >
                  <Edit3 className="w-3 h-3 text-primary" />
                  <span className="hidden sm:inline">Edit Page</span>
                </button>
                <button
                  onClick={() => setShowManageAdminsModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-bold text-[11px] border border-border flex items-center gap-1 cursor-pointer transition-colors"
                  title="Manage Page Admins"
                >
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="hidden sm:inline">Admins</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors hidden sm:flex cursor-pointer"
              title={isFullscreen ? "Exit Full Screen" : "Expand Full Screen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSharePage}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
              title="Share Page"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowCreatePost(!showCreatePost)}
                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Post</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
              title="Exit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cover Image with Camera Edit Button */}
        <div className="relative h-44 sm:h-52 w-full bg-secondary shrink-0 overflow-hidden group">
          <img
            src={currentPage.cover_url || '/assets/apostle_joe_daniels_grad.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {canManagePage && (
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/30 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="Change Cover Photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Edit Cover</span>
            </button>
          )}

          {/* Profile Avatar Overlapping Cover with Camera Edit Button */}
          <div className="absolute -bottom-2 left-4 flex items-end gap-3 z-10">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-card border-2 border-primary/50 shadow-xl overflow-hidden group/avatar">
              <img
                src={currentPage.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                alt={currentPage.name}
                className="w-full h-full object-cover rounded-xl"
              />
              {canManagePage && (
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 hover:bg-black/70 flex flex-col items-center justify-center text-white transition-opacity opacity-0 group-hover/avatar:opacity-100 cursor-pointer"
                  title="Change Page Profile Picture"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page Identity, Bio, and Quick Info */}
        <div className="px-5 pt-3 pb-4 border-b border-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                  {currentPage.name}
                </h2>
                <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {currentPage.handle} • <span className="text-primary font-semibold font-sans">{currentPage.category}</span>
              </p>
            </div>

            {/* Action Buttons: Follow / WhatsApp */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isFollowing
                    ? 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isFollowing ? 'Following' : 'Follow Page'}</span>
              </button>

              {currentPage.whatsapp_link && (
                <a
                  href={currentPage.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Bio & Purpose */}
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {currentPage.bio}
          </p>

          {/* Quick Info Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {followersCount} <span className="text-muted-foreground font-normal">Followers</span>
            </span>
            <span>•</span>
            <span className="font-semibold text-foreground">
              {pagePosts.length + allTestimonies.length} <span className="text-muted-foreground font-normal">Posts</span>
            </span>
            {currentPage.location && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-500">
                  <MapPin className="w-3 h-3" />
                  <span>{currentPage.location}</span>
                </span>
              </>
            )}
            {currentPage.website_url && (
              <>
                <span>•</span>
                <a
                  href={currentPage.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </a>
              </>
            )}
          </div>

          {/* Community Guidelines Agreement Banner */}
          {!hasAgreedRules && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-foreground block">Community Guidelines Agreement</span>
                  <span className="text-muted-foreground">Please review and agree to the guidelines set by page admins to participate.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAgreeRules}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-xs"
              >
                I Agree to Rules
              </button>
            </div>
          )}

          {/* Pinned Announcement */}
          {currentPage.pinned_announcement && (
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2 text-xs text-foreground">
              <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-primary block text-[10px] uppercase tracking-wider">
                  Pinned Announcement
                </span>
                <span>{currentPage.pinned_announcement}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Sub Navigation Tabs */}
        <div className="sticky top-[49px] z-20 flex border-b border-border px-5 bg-card/95 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Posts ({pagePosts.length + allTestimonies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'about'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>About Ministry & Rules</span>
          </button>
        </div>

        {/* Tab Content Stream */}
        <div className="p-5 space-y-4">
          
          {/* Create Post Card for Admins */}
          {isAdmin && showCreatePost && (
            <form onSubmit={handleCreatePost} className="p-4 rounded-xl bg-secondary/60 border border-primary/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Publish Update as {currentPage.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <textarea
                required
                rows={3}
                placeholder="Share ministry updates, rehearsal schedules, service highlights, or devotionals..."
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />

              {/* Local File Input with Camera */}
              <div className="space-y-2">
                {postImageBase64 ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black/30 max-h-48 flex items-center justify-center">
                    <img src={postImageBase64} alt="Preview" className="max-h-48 w-auto object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPostImageBase64('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-destructive transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-primary bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Attach Photo from Device</span>
                  </button>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPost || !postContent.trim()}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Publish to Feed</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'posts' ? (
            <div className="space-y-4">
              {pagePosts.length === 0 && allTestimonies.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground space-y-2">
                  <Flag className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-xs">No posts published yet by {currentPage.name}.</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs mt-2 cursor-pointer"
                    >
                      Publish First Post
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Testimonies published under this page */}
                  {allTestimonies.map(testimony => (
                    <div
                      key={testimony.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentPage.avatar_url}
                          alt={currentPage.name}
                          className="w-9 h-9 rounded-full object-cover border border-primary/30"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                            <span>{currentPage.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {testimony.date || 'Recently'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                        {testimony.content}
                      </p>

                      {testimony.image_url && (
                        <div className="rounded-lg overflow-hidden border border-border max-h-72 bg-black/40">
                          {StorageService.isFacebookUrl(testimony.image_url) ? (
                            <FacebookStreamPlayer
                              embedUrl={StorageService.getStreamEmbedInfo(testimony.image_url).embedUrl}
                              directUrl={StorageService.getStreamEmbedInfo(testimony.image_url).facebookDirectUrl || testimony.image_url}
                              title={currentPage.name}
                            />
                          ) : StorageService.extractYoutubeId(testimony.image_url) ? (
                            <iframe
                              src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(testimony.image_url)!)}
                              title={currentPage.name}
                              className="w-full aspect-video border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                            />
                          ) : (
                            <img
                              src={testimony.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          <span>{testimony.likes_count || 0}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{testimony.comments_count || 0} comments</span>
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Dedicated Page Posts */}
                  {pagePosts.map(post => (
                    <div
                      key={post.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentPage.avatar_url}
                          alt={currentPage.name}
                          className="w-9 h-9 rounded-full object-cover border border-primary/30"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                            <span>{currentPage.name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div className="rounded-lg overflow-hidden border border-border max-h-72 bg-black/40">
                          {StorageService.isFacebookUrl(post.image_url) ? (
                            <FacebookStreamPlayer
                              embedUrl={StorageService.getStreamEmbedInfo(post.image_url).embedUrl}
                              directUrl={StorageService.getStreamEmbedInfo(post.image_url).facebookDirectUrl || post.image_url}
                              title={currentPage.name}
                            />
                          ) : StorageService.extractYoutubeId(post.image_url) ? (
                            <iframe
                              src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(post.image_url)!)}
                              title={currentPage.name}
                              className="w-full aspect-video border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                            />
                          ) : (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                        <button
                          onClick={() => handleLikePagePost(post.id)}
                          className={`flex items-center gap-1 transition-colors cursor-pointer ${
                            post.likes.includes(currentUser.id) ? 'text-red-500 font-bold' : 'hover:text-foreground'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${post.likes.includes(currentUser.id) ? 'fill-red-500' : ''}`} />
                          <span>{post.likes.length}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comments_count}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Community Rules / Policies Card */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Page Rules & Community Policies</span>
                  </h4>
                  {hasAgreedRules ? (
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Agreed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAgreeRules}
                      className="text-[10px] px-2.5 py-1 bg-primary text-primary-foreground font-bold rounded-lg cursor-pointer"
                    >
                      Accept Rules
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  {(currentPage.rules && currentPage.rules.length > 0 ? currentPage.rules : [
                    'Christ-Centered Ministry: Keep all posts and comments uplifting, respectful, and scriptural.',
                    'Zero Spam: No unauthorized product promotion, unrelated ads, or solicitation.',
                    'Privacy & Grace: Respect other believers and maintain Christian fellowship standards.'
                  ]).map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-foreground/90 leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Info */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  About {currentPage.name}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {currentPage.bio}
                </p>

                <div className="space-y-2 pt-2 border-t border-border text-xs">
                  {currentPage.location && (
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{currentPage.location}</span>
                    </div>
                  )}
                  {currentPage.phone_number && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <a href={`tel:${currentPage.phone_number}`} className="hover:underline">
                        {currentPage.phone_number}
                      </a>
                    </div>
                  )}
                  {currentPage.whatsapp_link && (
                    <div className="flex items-center gap-2 text-foreground">
                      <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <a href={currentPage.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                        WhatsApp Channel / Support
                      </a>
                    </div>
                  )}
                  {currentPage.website_url && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                      <a href={currentPage.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {currentPage.website_url}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Created {new Date(currentPage.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Ministry Leadership & Admins */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Page Administrators ({currentPage.admin_ids?.length || 1})</span>
                  </h4>
                  {canManagePage && (
                    <button
                      type="button"
                      onClick={() => setShowManageAdminsModal(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Manage Admins</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {/* Creator */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {currentPage.creator_name ? currentPage.creator_name.slice(0, 2).toUpperCase() : 'AD'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {currentPage.creator_name || 'Apostle Joe Daniels'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Founder & Creator</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      Owner
                    </span>
                  </div>

                  {/* Other Admins */}
                  {(currentPage.admin_ids || [])
                    .filter(id => id !== currentPage.creator_id)
                    .map(adminId => {
                      const adminUser = allChurchUsers.find(u => u.id === adminId);
                      return (
                        <div key={adminId} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs">
                              {adminUser?.full_name ? adminUser.full_name.slice(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-foreground block">
                                {adminUser?.full_name || 'Admin User'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{adminUser?.handle || 'Administrator'}</span>
                            </div>
                          </div>
                          {canManagePage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(adminId)}
                              className="text-[10px] text-destructive hover:underline font-bold px-2 py-1 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Developer & Admin Dissolve Page Controls */}
              {isDeveloperOrSuperAdmin && (
                <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Administrative Controls
                    </span>
                    <span className="text-[9px] text-red-300 font-mono px-1.5 py-0.5 rounded bg-red-900/50">
                      {currentUser.role === 'developer' ? 'Developer' : 'Super Admin'}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-300/80 leading-relaxed">
                    Permanently delete and dissolve &quot;{currentPage.name}&quot;. This action dissolves all memberships, wipes page posts, and cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeletePage}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Dissolve Page</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* EDIT PAGE DETAILS MODAL */}
      {showEditPageModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-primary" />
                <span>Edit Page Details & Policies</span>
              </h3>
              <button onClick={() => setShowEditPageModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePageDetails} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Page Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Page Handle</label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={e => setEditHandle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as PageCategory)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Sanctuary Assembly">Sanctuary Assembly</option>
                  <option value="Worship Hub">Worship Hub</option>
                  <option value="Youth & Campus">Youth & Campus</option>
                  <option value="Kingdom Business">Kingdom Business</option>
                  <option value="Prayer Network">Prayer Network</option>
                  <option value="Women of Virtue">Women of Virtue</option>
                  <option value="Men of Valor">Men of Valor</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Bio & Purpose</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    placeholder="e.g. Harare, Zimbabwe"
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+263..."
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">WhatsApp Group / Channel Link</label>
                <input
                  type="url"
                  value={editWhatsApp}
                  onChange={e => setEditWhatsApp(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Community Guidelines / Rules (One per line)</label>
                <textarea
                  rows={4}
                  value={editRulesText}
                  onChange={e => setEditRulesText(e.target.value)}
                  placeholder="Rule 1: Christ-centered conversation&#10;Rule 2: No unsolicited marketing&#10;Rule 3: Respect and honor all believers"
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditPageModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow hover:opacity-90 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE ADMINS MODAL */}
      {showManageAdminsModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>Page Admin Team</span>
              </h3>
              <button onClick={() => setShowManageAdminsModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Add Member as Admin</label>
                <input
                  type="text"
                  placeholder="Search church members by name or handle..."
                  value={adminSearchQuery}
                  onChange={e => setAdminSearchQuery(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {adminSearchQuery.trim() && (
                <div className="p-2 rounded-xl bg-secondary/50 border border-border space-y-1.5 max-h-36 overflow-y-auto">
                  {eligibleAdmins.slice(0, 6).map(user => {
                    const isAlreadyAdmin = (currentPage.admin_ids || []).includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-1.5 rounded-lg bg-card">
                        <div>
                          <span className="font-semibold text-foreground block">{user.full_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{user.handle}</span>
                        </div>
                        {isAlreadyAdmin ? (
                          <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5">Admin</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddAdmin(user.id)}
                            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] cursor-pointer"
                          >
                            + Add Admin
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2">
                <span className="font-semibold text-foreground block mb-2">Active Page Administrators</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/60 border border-border">
                    <span className="font-semibold text-foreground">{currentPage.creator_name || 'Creator'}</span>
                    <span className="text-[10px] text-primary font-bold">Owner</span>
                  </div>
                  {(currentPage.admin_ids || [])
                    .filter(id => id !== currentPage.creator_id)
                    .map(adminId => {
                      const u = allChurchUsers.find(user => user.id === adminId);
                      return (
                        <div key={adminId} className="flex items-center justify-between p-2 rounded-xl bg-secondary/60 border border-border">
                          <span className="font-semibold text-foreground">{u?.full_name || 'Admin Member'}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(adminId)}
                            className="text-[10px] text-destructive hover:underline font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
