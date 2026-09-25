import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Lock, 
  Users, 
  BookOpen, 
  ArrowRight,
  Tv,
  Crown,
  Info,
  Inbox,
  Key,
  X,
  Send,
  MapPin,
  Globe,
  Calendar,
  Upload,
  Check
} from 'lucide-react';
import { User as UserType, SUPPORTED_CITIES, SupportedCity, COUNTRY_CODES } from '../../types';
import { StorageService } from '../../services/storageService';
import { getSupabase } from '../../services/supabaseClient';
import confetti from 'canvas-confetti';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onInstantJoin: (nameOrHandle: string) => void;
  onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onInstantJoin,
  onContinueAsGuest
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [countryCode, setCountryCode] = useState<string>('+263');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [cityLocation, setCityLocation] = useState<SupportedCity>('Harare');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [referralCode, setReferralCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [instantJoinName, setInstantJoinName] = useState<string>('');
  const [showInstantJoin, setShowInstantJoin] = useState<boolean>(false);

  // Helper to format full international phone number or pass through username
  const formatPhoneWithCountryCode = (rawPhone: string, code: string) => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return '';
    // If user enters a handle (@handle or text username with letters), return as-is
    if (trimmed.startsWith('@') || /[a-zA-Z]/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('+')) return trimmed;
    // Strip leading 0 if present
    const cleanLocal = trimmed.replace(/^0+/, '');
    return `${code}${cleanLocal}`;
  };

  // Unban Appeal & Password Reset Modal States
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [appealName, setAppealName] = useState<string>('');
  const [appealPhone, setAppealPhone] = useState<string>('');
  const [appealReason, setAppealReason] = useState<string>('');
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetPhone, setResetPhone] = useState<string>('');
  const [resetNote, setResetNote] = useState<string>('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Real-time Password Reset State Machine
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'success'>('request');
  const [resetOtpCode, setResetOtpCode] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [resetTargetUser, setResetTargetUser] = useState<UserType | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Avatar Selection for Signup
  const [adminAvatars, setAdminAvatars] = useState(() => StorageService.getAdminAvatarLibrary());
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(() => StorageService.getDefaultAvatar());
  const customAvatarFileRef = useRef<HTMLInputElement>(null);

  const handleCustomAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file for your avatar.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setSelectedAvatarUrl(reader.result as string);
        confetti({ particleCount: 15, spread: 40 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAppealModal = () => {
    setAppealPhone(phone);
    setAppealReason('');
    setAppealSuccessMsg(null);
    setShowAppealModal(true);
  };

  const handleOpenResetModal = () => {
    setResetPhone(phone);
    setResetNote('');
    setResetSuccessMsg(null);
    setResetStep('request');
    setResetError(null);
    setResetOtpCode('');
    setGeneratedOtp(null);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetTargetUser(null);
    setShowResetModal(true);
  };

  const handleRequestResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!resetPhone.trim()) {
      setResetError('Please enter your registered mobile number or username.');
      return;
    }

    const res = StorageService.requestRealtimePasswordResetCode(resetPhone.trim());
    if (!res.success || !res.user) {
      setResetError(res.message);
      return;
    }

    setResetTargetUser(res.user);
    setGeneratedOtp(res.code || '123456');
    setResetOtpCode(res.code || '');
    setResetStep('verify');
    confetti({ particleCount: 25, spread: 55 });
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!resetTargetUser) return;

    if (!resetOtpCode.trim()) {
      setResetError('Please enter the 6-digit verification code.');
      return;
    }
    if (resetNewPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('New passwords do not match. Please verify.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = StorageService.verifyAndResetPasswordRealtime(
        resetTargetUser.id,
        resetOtpCode.trim(),
        resetNewPassword.trim()
      );

      if (!res.success) {
        setResetError(res.message);
        setIsSubmittingReset(false);
        return;
      }

      // Also attempt update in Supabase auth if session exists
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.auth.updateUser({ password: resetNewPassword.trim() });
        } catch {}
      }

      setResetSuccessMsg('Your password was updated in real time! You can now sign in.');
      setResetStep('success');
      confetti({ particleCount: 40, spread: 70 });
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealPhone.trim() || !appealReason.trim()) return;
    StorageService.submitUnbanAppeal({
      user_id: `user_${appealPhone.replace(/\D/g, '')}`,
      user_name: appealName.trim() || 'Church Member',
      user_phone: appealPhone.trim(),
      reason: appealReason.trim()
    });
    setAppealSuccessMsg('Your appeal has been securely submitted to Ministry Administrators for review.');
    confetti({ particleCount: 25, spread: 60 });
  };

  const handleSubmitPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPhone.trim()) return;
    StorageService.submitPasswordResetRequest(
      resetPhone.trim(),
      resetNote.trim() || 'User requested password assistance.'
    );
    setResetSuccessMsg('Your password reset request has been logged with the Lead Developer.');
    confetti({ particleCount: 25, spread: 60 });
  };


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    const fullPhone = formatPhoneWithCountryCode(phone, countryCode);
    const syntheticEmail = fullPhone.replace('+', '') + '@gatewayconnect.joedaniels.org';
    const supabase = getSupabase();

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: phone.includes('@') ? phone : syntheticEmail,
        password: password.trim(),
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        confetti({ particleCount: 35, spread: 60 });
        
        // Construct basic user profile from metadata to match local User type expected by App
        const meta = data.user.user_metadata || {};
        let mappedUser: any = {
          id: data.user.id,
          phone: meta.phone || fullPhone,
          full_name: meta.full_name || 'Member',
          handle: meta.handle || `@${(meta.full_name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          role: meta.role || 'member',
          location: meta.location || 'Harare',
          member_id: meta.member_id || data.user.id.substring(0, 8),
          avatar_url: meta.avatar_url || '',
          created_at: data.user.created_at,
          is_premium: meta.is_premium || false,
          badge_type: meta.badge_type || 'none'
        };

        try {
          const { data: dbUser } = await supabase.from('users').select('*').eq('id', data.user.id).single();
          if (dbUser) {
            mappedUser = { ...mappedUser, ...dbUser };
          }
        } catch {}
        
        StorageService.saveUser(mappedUser);
        StorageService.autoFollowSuperAdminAndDeveloper(mappedUser.id);
        StorageService.setCurrentUser(mappedUser);
        onLoginSuccess(mappedUser as any);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    }
  };


  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage('Please select your Date of Birth.');
      return;
    }

    const fullPhone = formatPhoneWithCountryCode(phone, countryCode);
    const syntheticEmail = fullPhone.replace('+', '') + '@gatewayconnect.joedaniels.org';
    const supabase = getSupabase();

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            phone: fullPhone,
            role: 'member',
            location: cityLocation,
            member_id: 'G' + Math.floor(100000 + Math.random() * 900000).toString(),
            date_of_birth: dateOfBirth,
            gender: gender
          }
        }
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        confetti({ particleCount: 45, spread: 70 });
        
        const meta = data.user.user_metadata || {};
        const memberId = meta.member_id || 'G' + Math.floor(100000 + Math.random() * 900000).toString();
        const handle = `@${fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const finalAvatar = selectedAvatarUrl || StorageService.getDefaultAvatar();
        const mappedUser: any = {
          id: data.user.id,
          phone: meta.phone || fullPhone,
          full_name: meta.full_name || fullName.trim(),
          handle,
          role: 'member',
          location: meta.location || cityLocation,
          member_id: memberId,
          avatar_url: finalAvatar,
          created_at: data.user.created_at,
          is_premium: false,
          badge_type: 'none',
          date_of_birth: dateOfBirth,
          gender: gender,
          saved_verses: [],
          offline_sermon_ids: [],
          followers_count: 0,
          following_count: 0
        };

        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            phone: fullPhone,
            full_name: fullName.trim(),
            handle,
            role: 'member',
            location: cityLocation,
            member_id: memberId,
            date_of_birth: dateOfBirth,
            gender: gender,
            avatar_url: finalAvatar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch {}
        
        StorageService.saveUser(mappedUser);
        StorageService.autoFollowSuperAdminAndDeveloper(mappedUser.id);
        StorageService.setCurrentUser(mappedUser);
        onLoginSuccess(mappedUser as any);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Account creation failed.');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto py-8">
      
      {/* Background Subtle Accent */}
      <div className="w-full max-w-lg space-y-5">
        
        {/* Ministry Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-sm border border-border mb-1">
            <img 
              src="/assets/apostle_silhouette.svg" 
              alt="Apostle Joe Daniels Silhouette" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="font-serif-church font-bold text-2xl sm:text-3xl text-primary tracking-tight">
            GATEWAY CHURCH
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Apostle Joe Daniels • Zimbabwe & Diaspora
          </p>
          <p className="text-[11px] text-muted-foreground italic max-w-sm mx-auto">
            "For where two or three gather in my name, there am I with them." — Matthew 18:20
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
          
          {/* Tabs: Login vs Register */}
          <div className="flex bg-secondary/50 rounded-xl p-1 border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signup' 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {showInstantJoin ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (instantJoinName.trim()) onInstantJoin(instantJoinName);
              }}
              className="p-3 rounded-xl border border-primary/30 bg-secondary/30 space-y-2"
            >
              <label className="block text-xs font-semibold text-foreground">Name or handle</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  required
                  value={instantJoinName}
                  onChange={(event) => setInstantJoinName(event.target.value)}
                  placeholder="e.g. @tendai or Tendai Moyo"
                  className="min-w-0 flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm"
                />
                <button type="submit" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-xs whitespace-nowrap shadow-xs hover:bg-primary/90 transition-colors">
                  Join Live
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowInstantJoin(true)}
              className="w-full py-2.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-all text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Instant Join the Live Community</span>
            </button>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-destructive" />
                <span>{errorMessage}</span>
              </div>
              {(errorMessage.toLowerCase().includes('suspended') || errorMessage.toLowerCase().includes('banned')) && (
                <button
                  type="button"
                  onClick={handleOpenAppealModal}
                  className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold flex items-center justify-center gap-1.5 transition-all text-xs"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Submit Unban Appeal to Ministry Desk</span>
                </button>
              )}
            </div>
          )}

          {/* Form Content */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Mobile Phone Number or Username
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pl-8 pr-2 py-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.name}_${c.dialCode}`} value={c.dialCode} className="bg-card text-foreground">
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567 or @handle"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 px-0.5">
                  <span className="text-muted-foreground">Protected by Gateway Protocol</span>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-primary hover:underline font-semibold"
                  >
                    Forgot password? Request reset
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wider rounded-xl shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Gateway Connect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
              {/* Profile Avatar Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-foreground">
                    Choose Profile Avatar
                  </label>
                  <button
                    type="button"
                    onClick={() => customAvatarFileRef.current?.click()}
                    className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Custom Photo</span>
                  </button>
                  <input
                    ref={customAvatarFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomAvatarSelect}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  {adminAvatars.map((av) => {
                    const isSelected = selectedAvatarUrl === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(av.url)}
                        className={`relative rounded-full shrink-0 transition-transform active:scale-95 cursor-pointer p-0.5 ${
                          isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-105' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={av.name}
                      >
                        <img
                          src={av.url}
                          alt={av.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        {isSelected && (
                          <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {selectedAvatarUrl && !adminAvatars.some(a => a.url === selectedAvatarUrl) && (
                    <div className="relative rounded-full shrink-0 ring-2 ring-primary ring-offset-2 ring-offset-card p-0.5">
                      <img
                        src={selectedAvatarUrl}
                        alt="Custom Upload"
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Brother Tendai Moyo"
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Mobile Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pl-8 pr-2 py-2 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.name}_${c.dialCode}`} value={c.dialCode} className="bg-card text-foreground">
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  1 mobile number per account strictly enforced.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Location / City Congregation Hub
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                  <select
                    value={cityLocation}
                    onChange={(e) => setCityLocation(e.target.value as SupportedCity)}
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-foreground focus:outline-hidden focus:border-primary appearance-none cursor-pointer text-xs"
                  >
                    {SUPPORTED_CITIES.map((city) => (
                      <option key={city} value={city} className="bg-card text-foreground">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Connects you to local believers & clusters into official Congregations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-2 py-2 text-foreground focus:outline-hidden focus:border-primary text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Sex / Gender
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-foreground focus:outline-hidden focus:border-primary appearance-none cursor-pointer text-xs"
                    >
                      <option value="male" className="bg-card text-foreground">Male (Brother)</option>
                      <option value="female" className="bg-card text-foreground">Female (Sister)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Choose Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-10 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter referral (optional)"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground font-semibold text-sm uppercase tracking-wider rounded-xl shadow-xs hover:bg-primary/90 transition-all mt-1"
              >
                Create Covenant Account
              </button>
            </form>
          )}

          {/* Guest Access Option */}
          <div className="pt-2 border-t border-border flex items-center justify-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <span>Want to explore first?</span>
              <span className="underline font-semibold text-foreground">Continue as Guest Believer</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: UNBAN APPEAL DESK */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl animate-in fade-in text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Unban Appeal Desk</h3>
              </div>
              <button onClick={() => setShowAppealModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Submit your formal appeal directly to the Ministry Administrators. Provide your details and reasons for reinstatement.
            </p>

            {appealSuccessMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Appeal Submitted Successfully</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{appealSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppeal} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={appealName}
                    onChange={e => setAppealName(e.target.value)}
                    placeholder="e.g. Brother Tendai Moyo"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Account Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={appealPhone}
                    onChange={e => setAppealPhone(e.target.value)}
                    placeholder="e.g. 0772123456"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Appeal Statement / Explanation</label>
                  <textarea
                    rows={4}
                    required
                    value={appealReason}
                    onChange={e => setAppealReason(e.target.value)}
                    placeholder="Please explain the situation or apologize for any misunderstanding. This statement will be reviewed by the Lead Administrator."
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:border-primary outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Appeal to Admin</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REAL-TIME PASSWORD RESET WORKFLOW */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl animate-in fade-in text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Real-Time Password Recovery</h3>
              </div>
              <button 
                onClick={() => setShowResetModal(false)} 
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetStep === 'request' && (
              <form onSubmit={handleRequestResetOtp} className="space-y-3.5 text-xs">
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Enter your registered phone number or username. The Gateway Security Engine will instantly verify your account and generate a 6-digit recovery OTP code in real time.
                </p>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Registered Mobile Number or @handle
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={resetPhone}
                      onChange={e => setResetPhone(e.target.value)}
                      placeholder="e.g. 0771234567 or @tendai"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary outline-hidden text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Instant Code</span>
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'verify' && resetTargetUser && (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{resetTargetUser.full_name}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{resetTargetUser.phone}</span>
                  </div>
                  
                  {generatedOtp && (
                    <div className="flex items-center justify-between bg-card/80 p-2 rounded-lg border border-primary/30 mt-1">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Real-time OTP Code:</span>
                        <span className="font-mono font-black text-sm text-primary tracking-widest">{generatedOtp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResetOtpCode(generatedOtp)}
                        className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold shadow-xs cursor-pointer active:scale-95"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtpCode}
                    onChange={e => setResetOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground text-center font-mono font-bold tracking-widest text-base focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground focus:border-primary outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-foreground focus:border-primary outline-hidden"
                  />
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    className="px-3 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingReset ? 'Updating...' : 'Reset Password Now'}</span>
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'success' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Password Reset Successfully!</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your password was updated in real time. You can now sign in to Gateway Connect with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (resetTargetUser) {
                      setPhone(resetTargetUser.phone || resetPhone);
                      setPassword(resetNewPassword);
                    }
                    setShowResetModal(false);
                    setMode('login');
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign In with New Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};



