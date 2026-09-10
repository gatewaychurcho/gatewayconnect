import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { User as UserType, SUPPORTED_CITIES, SupportedCity, COUNTRY_CODES } from '../../types';
import { StorageService } from '../../services/storageService';
import confetti from 'canvas-confetti';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
  onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [countryCode, setCountryCode] = useState<string>('+263');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [cityLocation, setCityLocation] = useState<SupportedCity>('Harare');
  const [referralCode, setReferralCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setShowResetModal(true);
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

  const handleLoginSubmit = (e: React.FormEvent) => {
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
    const res = StorageService.login(fullPhone, password.trim());
    if (res.success && res.user) {
      confetti({ particleCount: 35, spread: 60 });
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.error || 'Authentication failed. Please verify phone and password.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const fullPhone = formatPhoneWithCountryCode(phone, countryCode);
    const res = StorageService.signup(
      fullName.trim(),
      fullPhone,
      password.trim(),
      cityLocation,
      referralCode.trim()
    );

    if (res.success && res.user) {
      confetti({ particleCount: 45, spread: 70 });
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.error || 'Account could not be created. Please check your phone number.');
    }
  };

  return (
    <div className="min-h-screen bg-[#001122] text-white flex flex-col items-center justify-center p-3 sm:p-6 bg-[radial-gradient(ellipse_at_top,_#001F3F_0%,_#001122_80%)]">
      
      {/* Background Subtle Accent */}
      <div className="w-full max-w-lg space-y-5">
        
        {/* Ministry Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C7322] shadow-xl shadow-[#D4AF37]/20 border border-[#D4AF37]/50 mb-1">
            <img 
              src="/assets/apostle_silhouette.svg" 
              alt="Apostle Joe Daniels Silhouette" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="font-serif-church font-bold text-2xl sm:text-3xl text-[#D4AF37] tracking-tight">
            GATEWAY CHURCH
          </h1>
          <p className="text-xs text-white/70 uppercase tracking-widest font-semibold">
            Apostle Joe Daniels • Zimbabwe & Diaspora
          </p>
          <p className="text-[11px] text-white/50 italic max-w-sm mx-auto">
            "For where two or three gather in my name, there am I with them." — Matthew 18:20
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#001F3F]/90 border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-sm space-y-5">
          
          {/* Tabs: Login vs Register */}
          <div className="flex bg-[#001122] rounded-xl p-1 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-[#D4AF37] text-[#001F3F] shadow-md' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signup' 
                  ? 'bg-[#D4AF37] text-[#001F3F] shadow-md' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
              {(errorMessage.toLowerCase().includes('suspended') || errorMessage.toLowerCase().includes('banned')) && (
                <button
                  type="button"
                  onClick={handleOpenAppealModal}
                  className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
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
                <label className="block font-semibold text-white/80 mb-1">
                  Mobile Phone Number or Username
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-[#001122] border border-white/20 rounded-xl pl-8 pr-2 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] text-xs font-semibold appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.name}_${c.dialCode}`} value={c.dialCode} className="bg-[#001F3F] text-white">
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567 or @handle"
                      className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 px-0.5">
                  <span className="text-white/40">Protected by Gateway Protocol</span>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-[#D4AF37] hover:underline font-semibold"
                  >
                    Forgot password? Request reset
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-[#001F3F] font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Gateway Connect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Brother Tendai Moyo"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Mobile Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0">
                    <Globe className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-[#001122] border border-white/20 rounded-xl pl-8 pr-2 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-xs font-semibold appearance-none cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={`${c.name}_${c.dialCode}`} value={c.dialCode} className="bg-[#001F3F] text-white">
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/50 mt-0.5">
                  1 mobile number per account strictly enforced.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Location / City Congregation Hub
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                  <select
                    value={cityLocation}
                    onChange={(e) => setCityLocation(e.target.value as SupportedCity)}
                    className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#D4AF37] appearance-none cursor-pointer text-xs"
                  >
                    {SUPPORTED_CITIES.map((city) => (
                      <option key={city} value={city} className="bg-[#001F3F] text-white">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-white/50 mt-0.5">
                  Connects you to local believers & clusters into official Congregations.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Choose Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-10 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter referral (optional)"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#D4AF37] text-[#001F3F] font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition-all mt-1"
              >
                Create Covenant Account
              </button>
            </form>
          )}

          {/* Guest Access Option */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-white/60 hover:text-[#D4AF37] transition-colors font-medium flex items-center gap-1.5"
            >
              <span>Want to explore first?</span>
              <span className="underline font-bold text-white/90">Continue as Guest Believer</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: UNBAN APPEAL DESK */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#001F3F] border border-amber-500/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Unban Appeal Desk</h3>
              </div>
              <button onClick={() => setShowAppealModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Submit your formal appeal directly to the Ministry Administrators. Provide your details and reasons for reinstatement.
            </p>

            {appealSuccessMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Appeal Submitted Successfully</span>
                </div>
                <p className="text-[11px] text-white/80">{appealSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppeal} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-white/80 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={appealName}
                    onChange={e => setAppealName(e.target.value)}
                    placeholder="e.g. Brother Tendai Moyo"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/80 mb-1">Account Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={appealPhone}
                    onChange={e => setAppealPhone(e.target.value)}
                    placeholder="e.g. 0772123456"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/80 mb-1">Appeal Statement / Explanation</label>
                  <textarea
                    rows={4}
                    required
                    value={appealReason}
                    onChange={e => setAppealReason(e.target.value)}
                    placeholder="Please explain the situation or apologize for any misunderstanding. This statement will be reviewed by the Lead Administrator."
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-3 text-white placeholder:text-white/40 focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#001F3F] font-bold shadow-lg flex items-center gap-1.5"
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

      {/* MODAL: PASSWORD RESET REQUEST */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#001F3F] border border-blue-500/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Password Recovery Request</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Forgot your password? Send a recovery request directly to the Lead Developer and Church Admin desk.
            </p>

            {resetSuccessMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Request Logged</span>
                </div>
                <p className="text-[11px] text-white/80">{resetSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPasswordReset} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-white/80 mb-1">Your Registered Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={resetPhone}
                    onChange={e => setResetPhone(e.target.value)}
                    placeholder="e.g. 0772123456"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-white/80 mb-1">Additional Note (Optional)</label>
                  <input
                    type="text"
                    value={resetNote}
                    onChange={e => setResetNote(e.target.value)}
                    placeholder="e.g. Please reset my password, I forgot it yesterday"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Submit Reset Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
