import React, { useState } from 'react';
import { 
  X, 
  Flag, 
  Sparkles, 
  Camera, 
  Image as ImageIcon, 
  Phone, 
  Globe, 
  MapPin, 
  MessageCircle, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, ChurchPage, PageCategory } from '../../types';
import { StorageService } from '../../services/storageService';

interface CreatePageModalProps {
  currentUser: User;
  onClose: () => void;
  onPageCreated: (newPage: ChurchPage) => void;
}

const PAGE_CATEGORIES: PageCategory[] = [
  'Worship & Arts',
  'Youth Ministry',
  'Youth & Young Adults',
  'Kingdom Business',
  'Outreach & Missions',
  'Media & Tech',
  'Media & Broadcasting',
  'Women of Virtue',
  'Men of Valour',
  'Fellowship & Cells',
  'Sanctuary Assembly',
  'Counseling & Prayer',
  'Children & Family',
  'Other'
];

const PRESET_COVERS = [
  '/assets/apostle_joe_daniels_grad.jpg',
  '/assets/apostle_joe_daniels_preach.jpg',
  '/assets/apostle_main_dark_1788354101321.jpg',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80'
];

const PRESET_AVATARS = [
  '/assets/apostle_joe_daniels_main.jpg',
  '/assets/apostle_joe_daniels_podcast.jpg',
  '/assets/apostle_joe_daniels_preach.jpg',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80'
];

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  currentUser,
  onClose,
  onPageCreated
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState<PageCategory>('Worship & Arts');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [location, setLocation] = useState('Harare Main Sanctuary');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-generate clean handle from name if user hasn't modified it
  const handleNameChange = (val: string) => {
    setName(val);
    const cleaned = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (cleaned && (!handle || handle.startsWith('@'))) {
      setHandle(`@${cleaned}`);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please provide a name for your Church Page.');
      return;
    }
    if (!bio.trim()) {
      setErrorMsg('Please provide a short bio or purpose description.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Page name is required.');
      return;
    }

    const cleanHandle = (handle.trim() || `@${name.toLowerCase().replace(/\s+/g, '_')}`).replace(/^@*/, '@');

    const newPage = StorageService.createPage({
      name: name.trim(),
      handle: cleanHandle,
      category,
      bio: bio.trim(),
      avatar_url: avatarUrl.trim() || PRESET_AVATARS[0],
      cover_url: coverUrl.trim() || PRESET_COVERS[0],
      creator_id: currentUser.id,
      creator_name: currentUser.full_name,
      admin_ids: [currentUser.id],
      website_url: websiteUrl.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      whatsapp_link: whatsappLink.trim() || (phoneNumber.trim() ? `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}` : undefined),
      location: location.trim() || undefined,
      verified: true,
      pinned_announcement: pinnedAnnouncement.trim() || undefined,
      posts_count: 0
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    onPageCreated(newPage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <span>Create a Church Page</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Step {step} of 2
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Establish a dedicated ministry, department, or fellowship profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              {/* Page Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gateway Youth Ministry (Ignite) or Dominion Choir"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Use the official name of your ministry, cell assembly, or business initiative.
                </p>
              </div>

              {/* Handle */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Unique Handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="@gateway_youth"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as PageCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PAGE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio / Purpose */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Bio / Purpose Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your ministry mission, meeting times, and vision for the body of Christ..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
                />
              </div>

              {/* Pinned Announcement */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Pinned Announcement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next Worship Night: Friday at 6:00 PM CAT"
                  value={pinnedAnnouncement}
                  onChange={e => setPinnedAnnouncement(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Live Preview Card */}
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Preview on Gateway Feed
                </span>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 border-2 border-primary shrink-0">
                    <img
                      src={avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {name || 'Your Church Page Name'}
                      </h4>
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {handle || '@your_page_handle'} • {category}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {bio || 'Mission statement and vision will appear here...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Continue to Photos & Contact</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreatePage} className="space-y-4">
              
              {/* Profile Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                  <span>Profile Avatar Image</span>
                  <span className="text-[10px] text-muted-foreground">Select preset or paste URL</span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {PRESET_AVATARS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p)}
                      className={`w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-transform active:scale-95 ${
                        avatarUrl === p ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom image URL"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                />
              </div>

              {/* Cover Banner Photo */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                  <span>Cover Banner Photo</span>
                  <span className="text-[10px] text-muted-foreground">Select preset or paste URL</span>
                </label>
                <div className="grid grid-cols-3 gap-2 pb-2">
                  {PRESET_COVERS.slice(0, 3).map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverUrl(c)}
                      className={`h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        coverUrl === c ? 'border-primary ring-2 ring-primary/40 scale-102' : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={c} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom cover banner URL"
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Contact & Assembly Details */}
              <div className="pt-2 border-t border-border space-y-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Contact & Assembly Location
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+263 77 123 4567"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-emerald-500" />
                      <span>WhatsApp Link / Number</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://wa.me/263771234567"
                      value={whatsappLink}
                      onChange={e => setWhatsappLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>Meeting Location / Sanctuary</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fantasyland Cinema 3, Harare"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-500" />
                    <span>Website / Social Link</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://gatewayconnect.church"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Church Page</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
