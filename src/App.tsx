import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/tabs/HomeTab';
import { BibleTab } from './components/tabs/BibleTab';
import { CommunityTab } from './components/tabs/CommunityTab';
import { StoreTab } from './components/tabs/StoreTab';
import { MeTab } from './components/tabs/MeTab';
import { AdminPanel } from './components/admin/AdminPanel';
import { DevConsole } from './components/dev/DevConsole';
import { FlutterExportModal } from './components/modals/FlutterExportModal';
import { WhatsAppProfileModal } from './components/modals/WhatsAppProfileModal';
import { StorageService } from './services/storageService';
import { 
  TabType, 
  User, 
  Sermon, 
  Devotional, 
  Testimony, 
  CommunityGroup, 
  PrayerRequest, 
  ChurchEvent, 
  Product, 
  PushNotification 
} from './types';
import { INITIAL_USERS } from './data/mockData';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [lowDataMode, setLowDataMode] = useState<boolean>(StorageService.getLowDataMode());
  
  // App Data States
  const [sermons, setSermons] = useState<Sermon[]>(StorageService.getSermons());
  const [devotionals, setDevotionals] = useState<Devotional[]>(StorageService.getDevotionals());
  const [testimonies, setTestimonies] = useState<Testimony[]>(StorageService.getTestimonies());
  const [groups, setGroups] = useState<CommunityGroup[]>(StorageService.getGroups());
  const [prayers, setPrayers] = useState<PrayerRequest[]>(StorageService.getPrayerRequests());
  const [events, setEvents] = useState<ChurchEvent[]>(StorageService.getEvents());
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>(StorageService.getPushNotifications());

  // Modals & Panels
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showDevConsole, setShowDevConsole] = useState<boolean>(false);
  const [showFlutterExport, setShowFlutterExport] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Auth Form State
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authReferralCode, setAuthReferralCode] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Background Audio Player Bar (when audio-only stream is active)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioStreamTitle, setAudioStreamTitle] = useState<string>('Live Broadcast Audio (24kbps Low-Data Stream)');

  // Refresh all state from StorageService
  const refreshAppData = () => {
    setSermons(StorageService.getSermons());
    setDevotionals(StorageService.getDevotionals());
    setTestimonies(StorageService.getTestimonies());
    setGroups(StorageService.getGroups());
    setPrayers(StorageService.getPrayerRequests());
    setEvents(StorageService.getEvents());
    setProducts(StorageService.getProducts());
    setPushNotifications(StorageService.getPushNotifications());
    setCurrentUser(StorageService.getCurrentUser());
  };

  const handleToggleLowData = () => {
    const updated = !lowDataMode;
    StorageService.setLowDataMode(updated);
    setLowDataMode(updated);
  };

  const handleSwitchUser = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    confetti({ particleCount: 15, spread: 40 });
  };

  const handleLogout = () => {
    const guestUser = StorageService.logout();
    setCurrentUser(guestUser);
    setShowProfileModal(false);
    confetti({ particleCount: 20, spread: 50 });
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
  };

  // Login / Signup Handlers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'login') {
      const user = StorageService.login(authPhone.trim(), authPassword.trim());
      if (user) {
        setCurrentUser(user);
        setShowAuthModal(false);
        setAuthPhone('');
        setAuthPassword('');
        confetti({ particleCount: 30, spread: 60 });
      } else {
        setAuthError('Invalid phone number or password. Try one of the test accounts or sign up.');
      }
    } else {
      if (!authFullName.trim() || !authPhone.trim() || !authPassword.trim()) {
        setAuthError('Please fill in all required fields.');
        return;
      }
      const newUser = StorageService.signup(
        authFullName.trim(),
        authPhone.trim(),
        authPassword.trim(),
        authReferralCode.trim()
      );
      setCurrentUser(newUser);
      setShowAuthModal(false);
      setAuthFullName('');
      setAuthPhone('');
      setAuthPassword('');
      setAuthReferralCode('');
      confetti({ particleCount: 40, spread: 70 });
    }
  };

  const handleGuestLogin = () => {
    const guest = INITIAL_USERS.find(u => u.role === 'guest') || INITIAL_USERS[3];
    StorageService.setCurrentUser(guest);
    setCurrentUser(guest);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-[#001122] text-white flex flex-col selection:bg-[#D4AF37] selection:text-[#001F3F] bg-[radial-gradient(ellipse_at_top_right,_#001F3F_0%,_#001122_70%)]">
      
      {/* 1. Main Header */}
      <Header
        currentUser={currentUser}
        lowDataMode={lowDataMode}
        onToggleLowData={handleToggleLowData}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        onOpenDevConsole={() => setShowDevConsole(true)}
        onOpenFlutterExport={() => setShowFlutterExport(true)}
        pushNotifications={pushNotifications}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-3">
        {activeTab === 'home' && (
          <HomeTab
            sermons={sermons}
            devotionals={devotionals}
            testimonies={testimonies}
            lowDataMode={lowDataMode}
            onNavigateTab={setActiveTab}
            currentUser={currentUser}
            onRequireAuth={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onOpenDevConsole={() => setShowDevConsole(true)}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
          />
        )}

        {activeTab === 'bible' && (
          <BibleTab lowDataMode={lowDataMode} />
        )}

        {activeTab === 'community' && (
          <CommunityTab
            groups={groups}
            prayers={prayers}
            events={events}
            testimonies={testimonies}
            currentUser={currentUser}
            onRequireAuth={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onRefreshData={refreshAppData}
          />
        )}

        {activeTab === 'store' && (
          <StoreTab
            products={products}
            onDonationSuccess={refreshAppData}
          />
        )}

        {activeTab === 'me' && (
          <MeTab
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
            onOpenDevConsole={() => setShowDevConsole(true)}
            onOpenFlutterExport={() => setShowFlutterExport(true)}
            lowDataMode={lowDataMode}
            onToggleLowData={handleToggleLowData}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            onOpenLogin={() => {
              setAuthMode('login');
              setShowAuthModal(true);
            }}
            onOpenSignUp={() => {
              setAuthMode('signup');
              setShowAuthModal(true);
            }}
          />
        )}
      </main>

      {/* 3. Sleek Ministry System Status Bar */}
      <footer className="h-10 bg-[#001F3F] border-t border-white/5 px-4 sm:px-8 flex items-center justify-between text-[10px] font-bold tracking-widest text-white/50 shrink-0 mb-14 sm:mb-16">
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="text-[#D4AF37] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            SYSTEM: ONLINE
          </span>
          <span className="hidden sm:inline text-white/40">FCM PUSH: READY</span>
          <span className="text-white/40">PAYNOW: ACTIVE</span>
        </div>
        <div className="flex items-center gap-3 text-white/40">
          <span>V 1.0.4-PROD</span>
          <span className="hidden md:inline">© GATEWAY CHURCH ZIMBABWE</span>
        </div>
      </footer>

      {/* 4. Global Audio Floating Mini-Player */}
      {isAudioPlaying && (
        <div className="fixed bottom-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-80 z-40 bg-[#001F3F] border border-[#D4AF37]/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center shrink-0 animate-pulse">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="truncate text-xs">
              <p className="font-bold text-white truncate">{audioStreamTitle}</p>
              <p className="text-[10px] text-[#D4AF37] font-mono">OPUS • 24kbps Low-Data</p>
            </div>
          </div>
          <button
            onClick={() => setIsAudioPlaying(false)}
            className="p-1 rounded-lg bg-[#001122] text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Bottom Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={0}
      />

      {/* 6. Modals & Drawers */}
      
      {/* Super Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => {
            setShowAdminPanel(false);
            refreshAppData();
          }}
          onRefreshAppState={refreshAppData}
        />
      )}

      {/* Developer Console Modal */}
      {showDevConsole && (
        <DevConsole
          onClose={() => setShowDevConsole(false)}
          onOpenFlutterExport={() => {
            setShowDevConsole(false);
            setShowFlutterExport(true);
          }}
        />
      )}

      {/* Flutter Code & Supabase SQL Export Modal */}
      {showFlutterExport && (
        <FlutterExportModal
          onClose={() => setShowFlutterExport(false)}
        />
      )}

      {/* WhatsApp-Style User Info & Profile Modal with Image Picker & Logout */}
      <WhatsAppProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />

      {/* Auth Modal (Login / Signup) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-[#001122]/80 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-bold text-lg">
                  G
                </div>
                <div>
                  <h3 className="font-serif-church font-bold text-[#D4AF37] text-base leading-none">
                    {authMode === 'login' ? 'GATEWAY CONNECT' : 'JOIN GATEWAY CHURCH'}
                  </h3>
                  <p className="text-[10px] text-white/60 tracking-widest mt-0.5">Zimbabwe & Diaspora Ministry</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-white/60 hover:text-white p-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-white/80 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="e.g. Tendai Chikore"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Phone Number (No Email Required)
                </label>
                <input
                  type="tel"
                  required
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="e.g. 0772123456 or +263772123456"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-white/80 mb-1">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={authReferralCode}
                    onChange={(e) => setAuthReferralCode(e.target.value)}
                    placeholder="Enter 'JoeDaniels789' for Moderator Role"
                    className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[10px] text-[#D4AF37]/80 mt-1">
                    Tip: Code <strong className="text-[#D4AF37]">JoeDaniels789</strong> automatically assigns the Moderator role.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#D4AF37] text-[#001F3F] font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] transition-transform mt-2"
              >
                {authMode === 'login' ? 'Sign In to Gateway' : 'Create Covenant Account'}
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#D4AF37] hover:underline font-semibold"
              >
                {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
              </button>

              <button
                onClick={handleGuestLogin}
                className="text-white/50 hover:text-white"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
