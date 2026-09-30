import React, { useState } from 'react';
import { 
  Flag, 
  Plus, 
  Search, 
  CheckCircle2, 
  Users, 
  MessageCircle, 
  ChevronRight, 
  Globe, 
  Sparkles,
  Layers,
  MapPin
} from 'lucide-react';
import { ChurchPage, User, PageCategory } from '../../types';
import { StorageService } from '../../services/storageService';
import { PageCreationModal } from '../modals/PageCreationModal';
import { ChurchPageViewModal } from '../modals/ChurchPageViewModal';

interface ChurchPagesSectionProps {
  currentUser: User;
  onPageSelected?: (page: ChurchPage) => void;
}

const CATEGORY_FILTERS: (PageCategory | 'All')[] = [
  'All',
  'Worship & Arts',
  'Youth Ministry',
  'Youth & Young Adults',
  'Kingdom Business',
  'Outreach & Missions',
  'Media & Tech',
  'Media & Broadcasting',
  'Women of Virtue',
  'Sanctuary Assembly'
];

export const ChurchPagesSection: React.FC<ChurchPagesSectionProps> = ({
  currentUser,
  onPageSelected
}) => {
  const [pages, setPages] = useState<ChurchPage[]>(() => StorageService.getPages());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PageCategory | 'All'>('All');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activePageModal, setActivePageModal] = useState<ChurchPage | null>(null);

  const refreshPages = () => {
    setPages(StorageService.getPages());
  };

  useEffect(() => {
    const handleUpdated = () => refreshPages();
    window.addEventListener('gcz_church_pages_updated', handleUpdated);
    return () => window.removeEventListener('gcz_church_pages_updated', handleUpdated);
  }, []);

  const myManagedPages = pages.filter(
    p => p.creator_id === currentUser.id || p.admin_ids?.includes(currentUser.id)
  );

  const filteredPages = pages.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleFollow = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    StorageService.toggleFollowPage(pageId, currentUser.id);
    refreshPages();
  };

  const handlePageCreated = (newPage: ChurchPage) => {
    refreshPages();
    setShowCreateModal(false);
    setActivePageModal(newPage);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Banner & Create Action */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0 mt-0.5">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <span>Church Pages & Ministries</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold uppercase">
                Official
              </span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Discover official ministry wings, worship hubs, youth fellowships, and kingdom businesses.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create a Page</span>
        </button>
      </div>

      {/* Pages Managed by Current User (Facebook style "Your Pages") */}
      {myManagedPages.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pages You Manage ({myManagedPages.length})</span>
            </span>
            <span className="text-[10px] text-muted-foreground">Admin Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myManagedPages.map(page => (
              <div
                key={page.id}
                onClick={() => setActivePageModal(page)}
                className="p-2.5 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={page.avatar_url}
                    alt={page.name}
                    className="w-8 h-8 rounded-full object-cover border border-primary/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                      <span>{page.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-blue-500 shrink-0" />
                    </h4>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {page.followers_count} followers • {page.category}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search church pages by name, ministry, or @handle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Grid */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border space-y-2 p-6">
          <Flag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">No Church Pages Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We couldn't find any page matching your filter. Be the first to establish this ministry page for Gateway!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs mt-2"
          >
            Create This Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredPages.map(page => {
            const isFollowing = page.followers?.includes(currentUser.id);
            return (
              <div
                key={page.id}
                onClick={() => setActivePageModal(page)}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* Cover Banner */}
                <div className="relative h-24 w-full bg-secondary overflow-hidden">
                  <img
                    src={page.cover_url || '/assets/apostle_joe_daniels_grad.jpg'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Category Chip */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                    {page.category}
                  </div>
                </div>

                {/* Avatar & Content */}
                <div className="p-3.5 pt-0 flex-1 flex flex-col justify-between relative">
                  {/* Overlapping Avatar */}
                  <div className="-mt-8 mb-2 flex items-end justify-between">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-card bg-card shadow-md">
                      <img
                        src={page.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                        alt={page.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <button
                      onClick={e => handleToggleFollow(e, page.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        isFollowing
                          ? 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>

                  {/* Name and Handle */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {page.name}
                      </h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {page.handle}
                    </p>
                    <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed pt-0.5">
                      {page.bio}
                    </p>
                  </div>

                  {/* Card Footer: Followers count & WhatsApp */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span>{page.followers_count || 0} followers</span>
                    </span>

                    {page.whatsapp_link && (
                      <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <PageCreationModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onPageCreated={handlePageCreated}
        />
      )}

      {/* View Page Modal */}
      {activePageModal && (
        <ChurchPageViewModal
          page={activePageModal}
          currentUser={currentUser}
          onClose={() => setActivePageModal(null)}
          onUpdatePage={updated => {
            setActivePageModal(updated);
            refreshPages();
          }}
        />
      )}
    </div>
  );
};
