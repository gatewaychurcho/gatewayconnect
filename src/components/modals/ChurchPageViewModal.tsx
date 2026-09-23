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
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChurchPage, User, PagePost, Testimony } from '../../types';
import { StorageService } from '../../services/storageService';
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

  const isAdmin = currentPage.admin_ids?.includes(currentUser.id) || currentPage.creator_id === currentUser.id;

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
    const text = `Join and follow ${currentPage.name} on Gateway Church Zimbabwe App:\n${url}`;
    if (navigator.share) {
      navigator.share({ title: currentPage.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Page link copied to clipboard!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPostImageBase64(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setPostImageBase64(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
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

    // 2. Also publish to main community testimonies feed so all church members see it
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
    const liked = StorageService.toggleLikePagePost(postId, currentUser.id);
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto ${
      isFullscreen ? 'p-0' : 'p-0 sm:p-3 md:p-5'
    }`}>
      {/* Hidden file input for post image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container - Fully scrollable full-screen with cover, icon, about & posts in one natural stream */}
      <div className={`bg-card border border-border overflow-y-auto relative flex flex-col transition-all duration-300 shadow-2xl ${
        isFullscreen
          ? 'w-full h-full rounded-none'
          : 'w-full max-w-2xl h-full sm:h-[94vh] sm:rounded-2xl'
      }`}>
        
        {/* Floating Top Bar with back/close, full-screen toggle, & share buttons */}
        <div className="sticky top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-card/90 backdrop-blur-md border-b border-border/50 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Close Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Back</span>
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[160px] sm:max-w-[260px]">
                {currentPage.name}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors hidden sm:flex"
              title={isFullscreen ? "Exit Full Screen" : "Expand Full Screen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSharePage}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              title="Share Page"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowCreatePost(!showCreatePost)}
                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Post</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              title="Exit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-44 sm:h-52 w-full bg-secondary shrink-0 overflow-hidden">
          <img
            src={currentPage.cover_url || '/assets/apostle_joe_daniels_grad.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Profile Avatar Overlapping Cover */}
          <div className="absolute -bottom-2 left-4 flex items-end gap-3 z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-card border-2 border-primary/50 shadow-xl overflow-hidden">
              <img
                src={currentPage.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                alt={currentPage.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Page Identity, Bio, and Quick Info - Scrolls naturally! */}
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
                className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 ${
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
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Posts ({pagePosts.length + allTestimonies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>About Ministry</span>
          </button>
        </div>

        {/* Tab Content Stream - Follows smoothly without separate constrained scroll! */}
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
                  className="text-muted-foreground hover:text-foreground text-xs"
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

              {/* Local File Input with Camera / ImageIcon */}
              <div className="space-y-2">
                {postImageBase64 ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-black/30 max-h-48 flex items-center justify-center">
                    <img src={postImageBase64} alt="Preview" className="max-h-48 w-auto object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPostImageBase64('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-destructive transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-primary bg-secondary/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-all"
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
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1 disabled:opacity-50"
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
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs mt-2"
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
                          className={`flex items-center gap-1 transition-colors ${
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
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Page Leadership
                </h4>
                <div className="flex items-center gap-2.5 pt-1">
                  <img
                    src="/assets/apostle_joe_daniels_main.jpg"
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-primary/30"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {currentPage.creator_name || 'Ministry Pastor'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Page Creator & Administrator</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

