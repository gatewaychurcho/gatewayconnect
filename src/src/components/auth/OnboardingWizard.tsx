import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Check, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Heart,
  BookOpen,
  Flame,
  Radio,
  Share2,
  Lock
} from 'lucide-react';
import { User, SUPPORTED_CITIES, SupportedCity } from '../../types';
import { StorageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface OnboardingWizardProps {
  user: User;
  onComplete: (updatedUser: User) => void;
  onClose?: () => void;
}

const AVAILABLE_AVATARS = [
  {
    id: 'av_brother',
    name: 'Brother Believer',
    tag: 'Brother',
    url: '/assets/avatar_believer_brother_1790322792637.jpg'
  },
  {
    id: 'av_sister',
    name: 'Sister Believer',
    tag: 'Sister',
    url: '/assets/avatar_believer_sister_1790322802458.jpg'
  },
  {
    id: 'av_youth',
    name: 'Youth Worshipper',
    tag: 'Youth',
    url: '/assets/avatar_worship_youth_1790322812538.jpg'
  },
  {
    id: 'av_elder',
    name: 'Church Elder',
    tag: 'Elder',
    url: '/assets/avatar_church_elder_1790322822242.jpg'
  },
  {
    id: 'av_apostle_main',
    name: 'Apostle Joe Daniels',
    tag: 'Ministry',
    url: '/assets/apostle_joe_daniels_main.jpg'
  },
  {
    id: 'av_apostle_preach',
    name: 'Apostolic Fire',
    tag: 'Preaching',
    url: '/assets/apostle_joe_daniels_preach.jpg'
  },
  {
    id: 'av_apostle_grad',
    name: 'Academic Gown',
    tag: 'Leadership',
    url: '/assets/apostle_joe_daniels_grad.jpg'
  },
  {
    id: 'av_silhouette',
    name: 'Gateway Cross',
    tag: 'Emblem',
    url: '/assets/apostle_silhouette.svg'
  }
];

const SPIRITUAL_INTERESTS = [
  { id: 'worship', label: 'Praise & Worship', icon: '🎵' },
  { id: 'prayer', label: 'Intercessory Prayer Watch', icon: '🙏' },
  { id: 'youth', label: 'Youth & Campus Fire', icon: '🔥' },
  { id: 'marketplace', label: 'Kingdom Business', icon: '💼' },
  { id: 'evangelism', label: 'Evangelism & Outreach', icon: '🌍' },
  { id: 'bible', label: 'Bible Study & Discipleship', icon: '📖' }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Step 1: Avatar (MANDATORY)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(user.avatar_url || '');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Fellowship & Bio
  const [location, setLocation] = useState<string>(user.location || user.city_location || 'Harare');
  const [bio, setBio] = useState<string>(user.bio || 'Believer walking in divine acceleration with Apostle Joe Daniels.');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['worship', 'prayer']);

  // Step 3: Real-Time Assigned Groups based on User Info (Gender, City, Interests)
  const assignedFellowshipGroups = React.useMemo(() => {
    const isMale = (user.gender === 'male' || (user as any).gender_category === 'male' || selectedInterests.includes('marketplace'));
    const isFemale = (user.gender === 'female' || (user as any).gender_category === 'female');

    const list = [
      {
        id: 'group_ignite_worship',
        name: 'Ignite Worship Team',
        category: 'Apostolic Praise',
        description: 'Atmospheric praise and corporate worship connecting brethren with God.',
        avatar: '/assets/apostle_joe_daniels_preach.jpg',
        matchReason: 'General Fellowship & Praise'
      }
    ];

    if (isMale) {
      list.push({
        id: 'group_pride_of_lions',
        name: 'Pride Of Lions',
        category: "Men's Ministry",
        description: "Men's fellowship: groomed and trained in spiritual priesthood and leadership.",
        avatar: '/assets/apostle_joe_daniels_main.jpg',
        matchReason: `Assigned for Brothers in ${location}`
      });
    }

    if (isFemale || (!isMale && !isFemale)) {
      list.push({
        id: 'group_passion_ladies',
        name: 'Passion ladies',
        category: "Women's Ministry",
        description: 'Prophetess Melinda Daniels ministry for godly women walking in grace and dignity.',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        matchReason: `Assigned for Sisters in ${location}`
      });
    }

    if (selectedInterests.includes('youth') || selectedInterests.includes('evangelism')) {
      list.push({
        id: 'group_gymstars_foundation',
        name: 'Gymstars Foundation',
        category: 'Youth & Juniors',
        description: 'Raising an uncompromising generation of youth leaders for Christ.',
        avatar: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=200&auto=format&fit=crop&q=80',
        matchReason: 'Matched to your Youth & Evangelism interest'
      });
    }

    return list;
  }, [user.gender, location, selectedInterests]);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(['group_ignite_worship', 'group_pride_of_lions', 'group_passion_ladies']);

  // Toggle group selection
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const [joinGeneralGroup, setJoinGeneralGroup] = useState<boolean>(true);
  const [enableStreamAlerts, setEnableStreamAlerts] = useState<boolean>(true);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image is too large. Please select a photo under 5MB.');
      return;
    }

    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setSelectedAvatarUrl(reader.result as string);
        confetti({ particleCount: 20, spread: 50 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPredefinedAvatar = (url: string) => {
    setSelectedAvatarUrl(url);
    setAvatarError(null);
    confetti({ particleCount: 15, spread: 40 });
  };

  // Step 1 Validation
  const handleProceedFromAvatar = () => {
    if (!selectedAvatarUrl || !selectedAvatarUrl.trim()) {
      setAvatarError('Profile picture is required. Please upload a photo or choose an avatar before proceeding.');
      return;
    }
    setAvatarError(null);
    setCurrentStep(2);
  };

  // Toggle Interest
  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Final Step: Complete Onboarding
  const handleFinalizeOnboarding = () => {
    const updated = StorageService.completeOnboarding(user.id, {
      avatar_url: selectedAvatarUrl,
      bio: bio.trim(),
      location: location.trim(),
      spiritual_interests: selectedInterests
    });

    // Join all dynamically assigned groups that user selected
    selectedGroupIds.forEach(groupId => {
      try {
        StorageService.joinChatGroup(groupId, user.id, undefined, true);
      } catch (err) {
        console.warn('Could not auto-join group:', groupId, err);
      }
    });

    if (joinGeneralGroup) {
      try {
        StorageService.joinChatGroup('group_ignite_worship', user.id, undefined, true);
      } catch {}
    }

    confetti({ particleCount: 60, spread: 80 });
    onComplete(updated || { ...user, avatar_url: selectedAvatarUrl, bio, location, onboarding_completed: true });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto py-8">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Ministry Brand Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-xs">
              <img 
                src="/assets/apostle_silhouette.svg" 
                alt="Gateway Emblem" 
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h2 className="font-serif-church font-bold text-lg text-primary tracking-tight leading-none">
                GATEWAY CONNECT
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                New Believer Onboarding • Welcome to the Family
              </p>
            </div>
          </div>

          {/* Step Pill Counter & Optional Close */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-primary">
                Step {currentStep} of 4
              </span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4].map(s => (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all ${
                      s === currentStep 
                        ? 'w-6 bg-primary' 
                        : s < currentStep 
                          ? 'w-3 bg-primary/60' 
                          : 'w-3 bg-secondary'
                    }`}
                  />
                ))}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer border border-border shrink-0 ml-1"
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE OR UPLOAD PROFILE AVATAR (MANDATORY / FORCED)              */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Add Your Profile Picture
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Facebook-style mandatory profile setup: choose or upload a photo so Apostle Joe Daniels, church pastors, and brethren can recognize you.
              </p>
            </div>

            {/* Central Selected Avatar Frame */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative group">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                  selectedAvatarUrl ? 'border-primary shadow-lg ring-4 ring-primary/20' : 'border-dashed border-border bg-secondary/50'
                } flex items-center justify-center bg-card transition-all`}>
                  {selectedAvatarUrl ? (
                    <img 
                      src={selectedAvatarUrl} 
                      alt="Selected Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-3 text-center">
                      <Camera className="w-9 h-9 mb-1 text-primary/70 animate-bounce" />
                      <span className="text-[10px] font-semibold text-foreground">Photo Required</span>
                    </div>
                  )}
                </div>

                {/* Camera Floating Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer border-2 border-card"
                  title="Upload Custom Photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Status Indicator */}
              {selectedAvatarUrl ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Avatar selected & ready!</span>
                </div>
              ) : (
                <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>You must select or upload an avatar to continue</span>
                </p>
              )}
            </div>

            {/* Error Message */}
            {avatarError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}

            {/* Upload from Device CTA */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo from Phone / PC</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="hidden" 
              />
            </div>

            {/* Curated Church Avatars Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Or Select an Official Church Avatar:</span>
                <span className="text-[11px] text-primary">{AVAILABLE_AVATARS.length} options</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                {AVAILABLE_AVATARS.map(avatar => {
                  const isSelected = selectedAvatarUrl === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectPredefinedAvatar(avatar.url)}
                      className={`relative flex flex-col items-center p-2 rounded-xl border transition-all text-center group cursor-pointer ${
                        isSelected 
                          ? 'border-primary bg-primary/15 ring-2 ring-primary/40' 
                          : 'border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60'
                      }`}
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-border group-hover:scale-105 transition-transform bg-background">
                        <img 
                          src={avatar.url} 
                          alt={avatar.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-foreground truncate w-full mt-1.5">
                        {avatar.tag}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProceedFromAvatar}
                disabled={!selectedAvatarUrl}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  selectedAvatarUrl 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer' 
                    : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-60'
                }`}
              >
                <span>Continue to Fellowship Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: FELLOWSHIP DETAILS & SPIRITUAL INTERESTS                          */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Personalize Your Fellowship
              </h3>
              <p className="text-xs text-muted-foreground">
                Set your assembly location and spiritual ministries to get personalized live feeds.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* City / Location */}
              <div>
                <label className="block font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Church Assembly City / Location</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold cursor-pointer"
                >
                  {SUPPORTED_CITIES.map(c => (
                    <option key={c} value={c} className="bg-card text-foreground">
                      {c}
                    </option>
                  ))}
                  <option value="UK Diaspora" className="bg-card text-foreground">United Kingdom (Diaspora)</option>
                  <option value="South Africa" className="bg-card text-foreground">South Africa (Diaspora)</option>
                  <option value="USA Diaspora" className="bg-card text-foreground">United States / Canada</option>
                  <option value="Australia" className="bg-card text-foreground">Australia / New Zealand</option>
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Believer Bio / Declaration
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short word of faith, testimony or favorite scripture..."
                  className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-xs resize-none"
                />
              </div>

              {/* Ministry Interests */}
              <div className="space-y-2">
                <label className="block font-semibold text-foreground">
                  Select Ministries You Are Interested In:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SPIRITUAL_INTERESTS.map(interest => {
                    const isChecked = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isChecked 
                            ? 'border-primary bg-primary/10 text-primary font-semibold' 
                            : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                        }`}
                      >
                        <span className="text-base">{interest.icon}</span>
                        <span className="text-xs truncate">{interest.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Leadership</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CONNECT WITH LEADERSHIP & FELLOWSHIP                             */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Connect with Church Leadership
              </h3>
              <p className="text-xs text-muted-foreground">
                You are automatically connected with Apostle Joe Daniels and Senior Overseers.
              </p>
            </div>

            {/* Apostle Joe Daniels Spotlight Card */}
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/apostle_joe_daniels_main.jpg" 
                  alt="Apostle Joe Daniels" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-serif-church font-bold text-foreground text-sm truncate">
                      Apostle Joe Daniels
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary text-primary-foreground font-semibold">
                      Spiritual Father
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    General Overseer • Gateway Church International
                  </p>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected & Following Protected</span>
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border text-[11px] text-muted-foreground italic leading-relaxed">
                "Welcome home to Gateway Connect! Every step you take here is guarded by covenant favor, divine speed, and prophetic breakthrough."
              </div>
            </div>

            {/* Real-Time Assigned Fellowship Groups based on user info */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Fellowship Groups Assigned For You</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Assigned based on your location ({location}) & spiritual interests. Choose which to join:
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary font-mono">
                  {selectedGroupIds.length} Selected
                </span>
              </div>

              <div className="space-y-2">
                {assignedFellowshipGroups.map(grp => {
                  const isSelected = selectedGroupIds.includes(grp.id);
                  return (
                    <div 
                      key={grp.id}
                      onClick={() => toggleGroupSelection(grp.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-xs' 
                          : 'border-border bg-secondary/30 hover:bg-secondary/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={grp.avatar} 
                          alt={grp.name} 
                          className="w-10 h-10 rounded-full object-cover border border-primary/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground truncate">{grp.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-semibold shrink-0">
                              {grp.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {grp.description}
                          </p>
                          <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">
                            ✓ {grp.matchReason}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupSelection(grp.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground shadow-xs' 
                              : 'bg-card text-muted-foreground border border-border hover:text-foreground'
                          }`}
                        >
                          {isSelected ? 'Joined ✓' : '+ Join'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification Alert Toggle */}
            <div className="space-y-2 text-xs pt-1">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground block">Sunday Live Stream Notifications</span>
                    <span className="text-[10px] text-muted-foreground">Alerts when Apostle Joe goes live on air</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableStreamAlerts} 
                  onChange={(e) => setEnableStreamAlerts(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(4);
                  confetti({ particleCount: 40, spread: 60 });
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Generate Believer Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: CELEBRATION & OFFICIAL GATEWAY BELIEVER PASS                      */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary border border-primary/20 mb-1">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight font-serif-church">
                Welcome to Gateway Connect!
              </h3>
              <p className="text-xs text-muted-foreground">
                Your onboarding is complete. Here is your official Gateway Believer Digital Pass.
              </p>
            </div>

            {/* Digital Member Pass Card */}
            <div className="relative mx-auto max-w-sm rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-5 shadow-2xl text-left space-y-4 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary font-serif-church block leading-none">
                      GATEWAY CHURCH
                    </span>
                    <span className="text-[9px] text-muted-foreground tracking-wider uppercase">
                      Official Believer Pass
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              {/* Pass Body */}
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-sm bg-secondary shrink-0">
                  <img 
                    src={selectedAvatarUrl || StorageService.getDefaultAvatar()} 
                    alt={user.full_name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="font-bold text-foreground text-sm truncate">
                    {user.full_name}
                  </h4>
                  <p className="text-[11px] text-primary font-medium truncate">
                    {user.handle || `@${user.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{location}</span>
                  </p>
                </div>
              </div>

              {/* Pass Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Member ID:</span>
                  <span className="font-mono font-bold text-foreground">{user.member_id || 'GCZ-MEM-2026'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Spiritual Overseer:</span>
                  <span className="font-bold text-foreground">Apostle Joe Daniels</span>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinalizeOnboarding}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wider uppercase shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Gateway Connect Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
