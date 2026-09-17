import React, { useState, useRef } from 'react';
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
  ShieldCheck,
  Upload,
  AlertCircle,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, ChurchPage, PageCategory } from '../../types';
import { StorageService } from '../../services/storageService';

export interface PageCreationModalProps {
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

export const PageCreationModal: React.FC<PageCreationModalProps> = ({
  currentUser,
  onClose,
  onPageCreated
}) => {
  // Verification check: Only Gold, Silver, or Blue badge holders (or super_admin/developer) can create
  const isVerifiedBadgeHolder = Boolean(
    currentUser.is_verified ||
    currentUser.badge_type === 'gold' ||
    currentUser.badge_type === 'silver' ||
    currentUser.badge_type === 'blue' ||
    currentUser.verified_badge === 'gold' ||
    currentUser.verified_badge === 'silver' ||
    currentUser.verified_badge === 'blue' ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'developer'
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [category, setCategory] = useState<PageCategory>('Worship & Arts');
  const [bio, setBio] = useState('');
  
  // Local base64 image states
  const [avatarBase64, setAvatarBase64] = useState<string>('/assets/apostle_joe_daniels_main.jpg');
  const [coverBase64, setCoverBase64] = useState<string>('/assets/apostle_joe_daniels_grad.jpg');
  
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [location, setLocation] = useState('Harare Main Sanctuary');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to base64
  const processImageFile = (file: File, maxDim: number, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
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
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          callback(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 400, (base64) => setAvatarBase64(base64));
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 1000, (base64) => setCoverBase64(base64));
    }
  };

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
      setErrorMsg('Please enter a name for your Church Page.');
      return;
    }
    if (!bio.trim()) {
      setErrorMsg('Please provide a short bio or purpose description for your page.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifiedBadgeHolder) {
      setErrorMsg('Only verified badge holders (Silver, Blue, Gold) can create church pages.');
      return;
    }
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
      avatar_url: avatarBase64,
      cover_url: coverBase64,
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
      {/* Hidden local file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileChange}
        className="hidden"
      />

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
                Instagram-style public ministry altar & department page
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Check Notice if not verified */}
        {!isVerifiedBadgeHolder ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="font-bold text-base text-foreground">Pro Feature</h4>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Page creation requires a Pro membership.</span>
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('gcz_open_upgrade_modal'));
                }}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>Buy Pro</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-full text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                {/* Visual Cover & Avatar Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-foreground">
                    Page Visual Identity (Cover & Avatar)
                  </label>
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary/40 h-32 flex flex-col justify-end p-3">
                    <img
                      src={coverBase64}
                      alt="Cover Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Cover upload button */}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      <span>Upload Cover</span>
                    </button>

                    {/* Avatar Overlap */}
                    <div className="relative z-10 flex items-end justify-between">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-xl p-0.5 bg-card border-2 border-primary/50 shadow-md overflow-hidden">
                          <img
                            src={avatarBase64}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover rounded-[10px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-all"
                          title="Upload page avatar from device"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-white/90">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        <span>Tap camera to upload from device</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Page Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Gateway Youth Flame, Harare Altar Choir"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                {/* Handle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Handle (Unique URL identifier)
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@youth_flame"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Ministry Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PageCategory)}
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PAGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">
                      About / Bio <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {bio.length}/300 characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your ministry mission, fellowship meetings, or altar vision..."
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:bg-primary/90 shadow-md transition-all active:scale-95"
                  >
                    <span>Continue to Contact & Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreatePage} className="space-y-4">
                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      Ministry Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+263 78 069 9988"
                        className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      WhatsApp Community Link
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                      <input
                        type="url"
                        value={whatsappLink}
                        onChange={(e) => setWhatsappLink(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Assembly Location / Sanctuary
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Fantasyland Cinema 3, Harare"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Website or Social Link
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://gatewayconnect.church/..."
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Pinned Announcement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Pinned Announcement / Welcome Decree
                  </label>
                  <input
                    type="text"
                    value={pinnedAnnouncement}
                    onChange={(e) => setPinnedAnnouncement(e.target.value)}
                    placeholder="e.g. Auditions open this Saturday at 10 AM!"
                    className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Creator Credit Badge */}
                <div className="p-3 bg-secondary/50 rounded-xl border border-border flex items-center gap-2.5 text-xs text-muted-foreground">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                    <img
                      src={currentUser.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{currentUser.full_name}</span>
                    <span className="text-[11px] block">You will be designated as the founding Administrator of this page.</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:bg-primary/90 shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Church Page</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
