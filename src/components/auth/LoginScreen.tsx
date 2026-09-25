import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Lock, 
  Users, 
  ArrowRight,
  ArrowLeft,
  KeyRound, 
  Globe, 
  MapPin, 
  Calendar,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Inbox,
  X
} from 'lucide-react';
import { User as UserType, SUPPORTED_CITIES, SupportedCity, COUNTRY_CODES } from '../../types';
import { StorageService } from '../../services/storageService';
import { getSupabase } from '../../services/supabaseClient';
import confetti from 'canvas-confetti';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType, isNewUser?: boolean) => void;
  onInstantJoin: (nameOrHandle: string) => void;
  onContinueAsGuest: () => void;
  onClose?: () => void;
  initialView?: 'signin' | 'signup' | 'forgot_password';
}

type AuthView = 'signin' | 'signup' | 'forgot_password';
type ForgotStep = 'request' | 'verify' | 'new_password' | 'success';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onInstantJoin,
  onContinueAsGuest,
  onClose,
  initialView = 'signin'
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  
  // Credentials State (Strictly Email/Phone + Password)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Sign Up Form State
  const [signupFullName, setSignupFullName] = useState<string>('');
  const [signupContactType, setSignupContactType] = useState<'phone' | 'email'>('phone');
  const [signupCountryCode, setSignupCountryCode] = useState<string>('+263');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupCity, setSignupCity] = useState<SupportedCity>('Harare');
  const [signupDateOfBirth, setSignupDateOfBirth] = useState<string>('');
  const [signupGender, setSignupGender] = useState<'male' | 'female'>('male');
  const [signupReferralCode, setSignupReferralCode] = useState<string>('');

  // UI & Loading States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showInstantJoin, setShowInstantJoin] = useState<boolean>(false);
  const [instantJoinName, setInstantJoinName] = useState<string>('');

  // Forgot Password Flow State Machine
  const [forgotStep, setForgotStep] = useState<ForgotStep>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotOtpCode, setForgotOtpCode] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [forgotTargetUser, setForgotTargetUser] = useState<UserType | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [showForgotSuccessToast, setShowForgotSuccessToast] = useState<boolean>(false);

  // Unban Appeal Modal
  const [showAppealModal, setShowAppealModal] = useState<boolean>(false);
  const [appealIdentifier, setAppealIdentifier] = useState<string>('');
  const [appealName, setAppealName] = useState<string>('');
  const [appealReason, setAppealReason] = useState<string>('');
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  // Helper to normalize phone with country code
  const formatPhoneWithCountryCode = (rawPhone: string, code: string) => {
    const trimmed = rawPhone.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('@') || trimmed.includes('@')) return trimmed;
    if (trimmed.startsWith('+')) return trimmed;
    const cleanLocal = trimmed.replace(/^0+/, '');
    return `${code}${cleanLocal}`;
  };

  // =========================================================================
  // 1. SIGN IN SUBMISSION (STRICTLY EMAIL/PHONE + PASSWORD)
  // =========================================================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const identifier = loginIdentifier.trim();
    const pwd = loginPassword.trim();

    if (!identifier) {
      setErrorMessage('Please enter your registered email address or mobile phone number.');
      return;
    }
    if (!pwd) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const fullPhone = isEmail ? '' : (identifier.startsWith('+') ? identifier : formatPhoneWithCountryCode(identifier, '+263'));
      const syntheticEmail = isEmail ? identifier : `${fullPhone.replace('+', '')}@gatewayconnect.joedaniels.org`;

      // 1. Attempt Supabase Auth
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: syntheticEmail,
            password: pwd
          });

          if (!error && data.user) {
            const meta = data.user.user_metadata || {};
            let mappedUser: UserType = {
              id: data.user.id,
              phone: meta.phone || fullPhone || '0780000000',
              email: isEmail ? identifier : meta.email,
              full_name: meta.full_name || 'Member',
              handle: meta.handle || `@${(meta.full_name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              role: meta.role || 'member',
              location: meta.location || 'Harare',
              member_id: meta.member_id || data.user.id.substring(0, 8),
              avatar_url: meta.avatar_url || '',
              created_at: data.user.created_at,
              is_premium: meta.is_premium || false,
              badge_type: meta.badge_type || 'none',
              is_verified: meta.is_verified || false,
              onboarding_completed: meta.onboarding_completed !== undefined ? meta.onboarding_completed : Boolean(meta.avatar_url)
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
            confetti({ particleCount: 35, spread: 60 });
            onLoginSuccess(mappedUser, false);
            return;
          }
        } catch {
          // Fall through to local storage login
        }
      }

      // 2. Local Storage Authentication Fallback
      const res = StorageService.login(identifier, pwd);
      if (res.success && res.user) {
        confetti({ particleCount: 35, spread: 60 });
        onLoginSuccess(res.user, false);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email/phone and password, or use Forgot Password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 2. SIGN UP SUBMISSION (STRICTLY EMAIL/PHONE + PASSWORD)
  // =========================================================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const contactVal = signupContactType === 'email' ? signupEmail.trim() : signupPhone.trim();
    if (!contactVal) {
      setErrorMessage(`Please enter your ${signupContactType === 'email' ? 'email address' : 'mobile phone number'}.`);
      return;
    }

    if (signupContactType === 'email' && !signupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = signupContactType === 'phone' 
        ? formatPhoneWithCountryCode(signupPhone, signupCountryCode) 
        : `user_${Date.now().toString().slice(-6)}`;
      const emailVal = signupContactType === 'email' ? signupEmail.trim() : undefined;
      const syntheticEmail = emailVal || `${fullPhone.replace('+', '')}@gatewayconnect.joedaniels.org`;

      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: syntheticEmail,
            password: signupPassword.trim(),
            options: {
              data: {
                full_name: signupFullName.trim(),
                phone: fullPhone,
                email: emailVal,
                role: 'member',
                location: signupCity,
                date_of_birth: signupDateOfBirth,
                gender: signupGender,
                onboarding_completed: false
              }
            }
          });

          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }

          if (data.user) {
            const memberId = 'G' + Math.floor(100000 + Math.random() * 900000).toString();
            const handle = `@${signupFullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            const newUser: UserType = {
              id: data.user.id,
              phone: fullPhone,
              email: emailVal,
              full_name: signupFullName.trim(),
              handle,
              role: 'member',
              location: signupCity,
              member_id: memberId,
              avatar_url: '', // Unset so onboarding forces photo choice
              onboarding_completed: false, // Forces multi-step onboarding wizard
              created_at: data.user.created_at,
              is_premium: false,
              badge_type: 'none',
              is_verified: false,
              date_of_birth: signupDateOfBirth,
              gender: signupGender,
              saved_verses: [],
              offline_sermon_ids: [],
              followers_count: 0,
              following_count: 0
            };

            try {
              await supabase.from('users').upsert({
                id: data.user.id,
                phone: fullPhone,
                email: emailVal,
                full_name: signupFullName.trim(),
                handle,
                role: 'member',
                location: signupCity,
                member_id: memberId,
                date_of_birth: signupDateOfBirth,
                gender: signupGender,
                avatar_url: '',
                onboarding_completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
            } catch {}

            StorageService.saveUser(newUser);
            StorageService.autoFollowSuperAdminAndDeveloper(newUser.id);
            StorageService.setCurrentUser(newUser);
            confetti({ particleCount: 40, spread: 70 });
            onLoginSuccess(newUser, true);
            return;
          }
        } catch {
          // Fall through to local signup
        }
      }

      // Local storage signup
      const res = StorageService.signup(
        signupFullName.trim(),
        fullPhone,
        signupPassword.trim(),
        signupCity,
        signupReferralCode.trim(),
        undefined,
        signupDateOfBirth,
        signupGender,
        '',
        emailVal
      );

      if (res.success && res.user) {
        confetti({ particleCount: 40, spread: 70 });
        onLoginSuccess(res.user, true);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 3. FORGOT PASSWORD FLOW STATE MACHINE
  // =========================================================================
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const target = forgotIdentifier.trim();
    if (!target) {
      setForgotError('Please enter your registered email address or mobile phone number.');
      return;
    }

    const res = StorageService.requestRealtimePasswordResetCode(target);
    if (!res.success || !res.user) {
      setForgotError(res.message);
      return;
    }

    setForgotTargetUser(res.user);
    setGeneratedOtp(res.code || '123456');
    setForgotOtpCode(res.code || '');
    setForgotStep('verify');
    confetti({ particleCount: 20, spread: 45 });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotOtpCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (generatedOtp && forgotOtpCode.trim() !== generatedOtp.trim()) {
      setForgotError('Invalid verification code. Please check the security code shown above.');
      return;
    }
    setForgotStep('new_password');
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotTargetUser) return;
    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      const res = StorageService.verifyAndResetPasswordRealtime(
        forgotTargetUser.id,
        forgotOtpCode.trim(),
        forgotNewPassword.trim()
      );

      if (!res.success) {
        setForgotError(res.message);
        setIsLoading(false);
        return;
      }

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.auth.updateUser({ password: forgotNewPassword.trim() });
        } catch {}
      }

      setForgotStep('success');
      setShowForgotSuccessToast(true);
      confetti({ particleCount: 50, spread: 70 });
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Unban Appeal
  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealIdentifier.trim() || !appealReason.trim()) return;

    StorageService.submitUnbanAppeal({
      user_id: `user_${appealIdentifier.replace(/\D/g, '') || Date.now().toString().slice(-6)}`,
      user_name: appealName.trim() || 'Church Member',
      user_phone: appealIdentifier.trim(),
      reason: appealReason.trim()
    });

    setAppealSuccessMsg('Your appeal has been securely submitted to Ministry Leadership for expedited review.');
    confetti({ particleCount: 25, spread: 60 });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col justify-center items-center p-3 sm:p-6 lg:p-10 overflow-y-auto py-8">
      
      {/* Container with Modern Responsive Split Layout on Desktop & Compact Card on Mobile */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: APOSTOLIC BRANDING & VISION (DESKTOP + MOBILE HEADER)       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 text-center lg:text-left space-y-4 px-2">
          
          {/* Logo Crest */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg border border-border">
            <img 
              src="/assets/apostle_silhouette.svg" 
              alt="Gateway Church" 
              className="w-11 h-11 object-contain"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center lg:justify-start gap-1.5 text-xs text-primary font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apostle Joe Daniels Ministry</span>
            </div>
            <h1 className="font-serif-church font-bold text-2xl sm:text-3xl text-foreground tracking-tight leading-tight">
              GATEWAY CONNECT
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Zimbabwe & Diaspora Apostolic Community
            </p>
          </div>

          {/* Scripture Quote Card (Pure Bible Verse) */}
          <div className="hidden sm:block p-4 rounded-2xl bg-card border border-border/80 text-left space-y-2 shadow-sm">
            <p className="text-xs text-foreground/90 font-serif-church italic leading-relaxed">
              "For where two or three gather in my name, there am I with them." — Matthew 18:20
            </p>
            <div className="flex items-center gap-2 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Covenant Protection • Verified Fellowship</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE AUTH CARD (SIGN IN / SIGN UP / FORGOT PASSWORD) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 w-full max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 transition-all relative">
            
            {/* Optional Close Button */}
            {onClose && (
              <div className="flex justify-end -mt-1 -mb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer border border-border"
                  title="Close Auth Screen"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* View Header / Navigation Tabs */}
            {view !== 'forgot_password' ? (
              <div className="flex bg-secondary/60 rounded-xl p-1 border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setView('signin'); setErrorMessage(null); }}
                  className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
                    view === 'signin' 
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setView('signup'); setErrorMessage(null); }}
                  className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
                    view === 'signup' 
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => { setView('signin'); setForgotError(null); }}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-xs font-bold text-foreground">Password Recovery</span>
              </div>
            )}

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                {(errorMessage.toLowerCase().includes('suspended') || errorMessage.toLowerCase().includes('banned')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppealIdentifier(loginIdentifier);
                      setShowAppealModal(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Submit Unban Appeal to Ministry Desk</span>
                  </button>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW A: SIGN IN FORM (STRICTLY EMAIL/PHONE & PASSWORD)                   */}
            {/* ========================================================================= */}
            {view === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                
                {/* Email or Phone Input */}
                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    Email Address or Mobile Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      {loginIdentifier.includes('@') ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. member@email.com or 0771234567"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIdentifier(loginIdentifier);
                        setForgotStep('request');
                        setForgotError(null);
                        setView('forgot_password');
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Secured by Gateway Protocol</span>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Gateway Connect</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* VIEW B: SIGN UP FORM (STRICTLY EMAIL/PHONE & PASSWORD)                   */}
            {/* ========================================================================= */}
            {view === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
                
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="e.g. Tendai Moyo"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Contact Method Selector (Email vs Phone) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-foreground">
                      Contact Method
                    </label>
                    <div className="flex gap-1 bg-secondary rounded-lg p-0.5 border border-border">
                      <button
                        type="button"
                        onClick={() => setSignupContactType('phone')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          signupContactType === 'phone' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Mobile Phone
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupContactType('email')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          signupContactType === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        Email Address
                      </button>
                    </div>
                  </div>

                  {signupContactType === 'phone' ? (
                    <div className="flex gap-2">
                      <div className="relative w-28 shrink-0">
                        <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select
                          value={signupCountryCode}
                          onChange={(e) => setSignupCountryCode(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-xl pl-8 pr-2 py-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold appearance-none cursor-pointer min-h-[44px]"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`${c.name}_${c.dialCode}`} value={c.dialCode} className="bg-card text-foreground">
                              {c.dialCode} ({c.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="0771234567"
                          className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="youremail@example.com"
                        className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                      />
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full bg-secondary border border-border rounded-xl pl-9 pr-10 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* City & Assembly */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      City / Assembly
                    </label>
                    <select
                      value={signupCity}
                      onChange={(e) => setSignupCity(e.target.value as SupportedCity)}
                      className="w-full bg-secondary border border-border rounded-xl p-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold cursor-pointer min-h-[44px]"
                    >
                      {SUPPORTED_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-card text-foreground">{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Gender / Group
                    </label>
                    <select
                      value={signupGender}
                      onChange={(e) => setSignupGender(e.target.value as 'male' | 'female')}
                      className="w-full bg-secondary border border-border rounded-xl p-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs font-semibold cursor-pointer min-h-[44px]"
                    >
                      <option value="male" className="bg-card text-foreground">Brother (Men)</option>
                      <option value="female" className="bg-card text-foreground">Sister (Women)</option>
                    </select>
                  </div>
                </div>

                {/* Onboarding Notice */}
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>After sign-up, you will customize your profile avatar and fellowship pass.</span>
                </div>

                {/* Submit Sign Up */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* VIEW C: FORGOT PASSWORD MULTI-STEP FLOW                                  */}
            {/* ========================================================================= */}
            {view === 'forgot_password' && (
              <div className="space-y-4 text-xs">
                
                {forgotError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Step 1: Request OTP */}
                {forgotStep === 'request' && (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="space-y-1 text-center">
                      <KeyRound className="w-8 h-8 text-primary mx-auto" />
                      <h3 className="font-bold text-sm text-foreground">Reset Account Password</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Enter your registered email address or mobile phone number to receive an instant verification code.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1.5">
                        Registered Email or Mobile Phone
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. member@email.com or 0771234567"
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Step 2: Verify OTP Code */}
                {forgotStep === 'verify' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-1 text-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h3 className="font-bold text-sm text-foreground">Enter Verification Code</h3>
                      <p className="text-[11px] text-muted-foreground">
                        We sent a 6-digit security code for account: <strong className="text-foreground">{forgotTargetUser?.full_name}</strong>
                      </p>
                    </div>

                    {/* Instant Test Code Display */}
                    {generatedOtp && (
                      <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-center space-y-1">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider block">Security OTP Code</span>
                        <span className="font-mono text-xl font-bold tracking-widest text-primary">{generatedOtp}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-foreground mb-1.5">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary text-center font-mono text-lg tracking-widest min-h-[44px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep('request')}
                        className="py-3 px-4 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Set New Password */}
                {forgotStep === 'new_password' && (
                  <form onSubmit={handleSaveNewPassword} className="space-y-4">
                    <div className="space-y-1 text-center">
                      <Lock className="w-8 h-8 text-primary mx-auto" />
                      <h3 className="font-bold text-sm text-foreground">Create New Password</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Set a new password for <strong className="text-foreground">{forgotTargetUser?.full_name}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:outline-hidden focus:border-primary text-sm min-h-[44px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Update Password & Return to Sign In</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Step 4: Success State */}
                {forgotStep === 'success' && (
                  <div className="text-center space-y-4 py-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-foreground">Password Successfully Updated!</h3>
                      <p className="text-xs text-muted-foreground">
                        Your credentials have been securely updated. You can now sign in with your new password.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setView('signin');
                        setForgotStep('request');
                        setLoginIdentifier(forgotTargetUser?.email || forgotTargetUser?.phone || '');
                        setLoginPassword('');
                      }}
                      className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Guest Option */}
            <div className="pt-3 border-t border-border flex items-center justify-center text-xs text-muted-foreground">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="hover:text-primary transition-colors font-medium cursor-pointer py-1 px-3 rounded-lg hover:bg-secondary/60"
              >
                Continue as Guest Explorer →
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* UNBAN APPEAL MODAL                                                        */}
      {/* ========================================================================= */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Ministry Desk Unban Appeal</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAppealModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>

            {appealSuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-3">
                <p>{appealSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold text-xs"
                >
                  Close Appeal Desk
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
                    onChange={(e) => setAppealName(e.target.value)}
                    placeholder="e.g. Tendai Moyo"
                    className="w-full bg-secondary border border-border rounded-xl p-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Registered Phone or Email</label>
                  <input
                    type="text"
                    required
                    value={appealIdentifier}
                    onChange={(e) => setAppealIdentifier(e.target.value)}
                    placeholder="e.g. 0771234567 or member@email.com"
                    className="w-full bg-secondary border border-border rounded-xl p-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Appeal Reason / Message</label>
                  <textarea
                    rows={3}
                    required
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Explain your fellowship activity or request for account reactivation..."
                    className="w-full bg-secondary border border-border rounded-xl p-2.5 text-foreground focus:outline-hidden focus:border-primary text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-xs shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  Submit Appeal to Ministry Desk
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
