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
  Info
} from 'lucide-react';
import { User as UserType } from '../../types';
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
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    const res = StorageService.login(phone.trim(), password.trim());
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

    const newUser = StorageService.signup(
      fullName.trim(),
      phone.trim(),
      password.trim(),
      referralCode.trim()
    );

    confetti({ particleCount: 45, spread: 70 });
    onLoginSuccess(newUser);
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
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <Info className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Content */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0772123456 or +263772123456"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
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
            <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
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
                <div className="relative">
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
                  Referral / Pastor Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter 'jd#mode' or 'JoeDaniels789' for Moderator Role"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-[10px] text-[#D4AF37]/80 mt-1">
                  Tip: Code <strong className="text-[#D4AF37]">jd#mode</strong> automatically grants verified Moderator privileges.
                </p>
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
    </div>
  );
};
