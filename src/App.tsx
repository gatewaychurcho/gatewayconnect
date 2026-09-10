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
import { LoginScreen } from './components/auth/LoginScreen';
import { BannedScreen } from './components/auth/BannedScreen';
import { LiveSermonModal } from './components/modals/LiveSermonModal';
import { DirectMessagesModal } from './components/modals/DirectMessagesModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { FloatingNotificationToast } from './components/common/FloatingNotificationToast';
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
  ExternalLink,
  Radio,
  Tv
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(StorageService.getCurrentUser());
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
  const [showLiveSermonModal, setShowLiveSermonModal] = useState<boolean>(false);
  const [showDirectMessagesModal, setShowDirectMessagesModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [directMessageRecipientId, setDirectMessageRecipientId] = useState<string | undefined>(undefined);
  const [directMessageGroupId, setDirectMessageGroupId] = useState<string | undefined>(undefined);
  const [bibleReference, setBibleReference] = useState<string | undefined>(undefined);
  const [dismissedLiveNotification, setDismissedLiveNotification] = useState<boolean>(false);
  const [liveSermonStatus, setLiveSermonStatus] = useState(StorageService.getLiveSermonStatus());
  const [unreadDmsCount, setUnreadDmsCount] = useState<number>(() => {
    const user = StorageService.getCurrentUser();
    if (!user) return 0;
    const threads = StorageService.getAllDirectMessageThreads(user.id);
    return threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Auth Form State
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authLocation, setAuthLocation] = useState<string>('Harare');
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
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setLiveSermonStatus(StorageService.getLiveSermonStatus());
    if (user) {
      const threads = StorageService.getAllDirectMessageThreads(user.id);
      setUnreadDmsCount(threads.reduce((acc, t) => acc + (t.unread_count || 0), 0));
    }
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
    StorageService.logout();
    setCurrentUser(null);
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
      const res = StorageService.login(authPhone.trim(), authPassword.trim());
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setShowAuthModal(false);
        setAuthPhone('');
        setAuthPassword('');
        confetti({ particleCount: 30, spread: 60 });
      } else {
        setAuthError(res.error || 'Invalid phone number or password. Please verify credentials.');
      }
    } else {
      if (!authFullName.trim() || !authPhone.trim() || !authPassword.trim()) {
        setAuthError('Please fill in all required fields.');
        return;
      }
      const res = StorageService.signup(
        authFullName.trim(),
        authPhone.trim(),
        authPassword.trim(),
        authLocation,
        authReferralCode.trim()
      );
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setShowAuthModal(false);
        setAuthFullName('');
        setAuthPhone('');
        setAuthPassword('');
        setAuthReferralCode('');
        confetti({ particleCount: 40, spread: 70 });
      } else {
        setAuthError(res.error || 'Failed to create account.');
      }
    }
  };

  const handleOpenDirectChat = (recipientId?: string) => {
    if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
      setShowAuthModal(true);
      return;
    }
    setDirectMessageRecipientId(recipientId);
    setShowDirectMessagesModal(true);
  };

  const handleGuestLogin = () => {
    const guestUser: User = {
      id: `usr_guest_${Date.now()}`,
      phone: '0770000000',
      full_name: 'Guest Believer',
      role: 'guest',
      member_id: 'GCZ-GST-000',
      is_verified: false,
      badge_type: 'none',
      is_premium: false,
      created_at: new Date().toISOString(),
      saved_verses: []
    };
    StorageService.setCurrentUser(guestUser);
    setCurrentUser(guestUser);
    setShowAuthModal(false);
  };

  // Enforce Login Screen when user opens app for the 1st time or after logging out
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        onContinueAsGuest={handleGuestLogin}
      />
    );
  }

  // Check if current user is banned - blocks entire app and renders dedicated Banned Screen
  const bannedMap = StorageService.getBannedUsers();
  const isUserBanned = currentUser.is_banned || Boolean(bannedMap[currentUser.id] || bannedMap[currentUser.phone]);
  if (isUserBanned) {
    return (
      <BannedScreen
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

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
        onOpenDirectMessages={() => handleOpenDirectChat()}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenLiveSermon={() => setShowLiveSermonModal(true)}
        isLiveSermon={liveSermonStatus.isLive}
        unreadDmsCount={unreadDmsCount}
        pushNotifications={pushNotifications}
      />

      {/* Non-Annoying Live Sermon Notification Bar */}
      {liveSermonStatus.isLive && !dismissedLiveNotification && (
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 pt-3">
          <div className="bg-gradient-to-r from-red-950/90 via-[#001F3F] to-red-950/90 border border-red-500/50 rounded-2xl p-3 sm:p-3.5 shadow-2xl flex items-center justify-between gap-3 text-white animate-slide-up">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                    LIVE SERVICE
                  </span>
                  <span className="text-xs sm:text-sm font-bold truncate text-white">
                    {liveSermonStatus.title || 'Supernatural Dominion Service • Apostle Joe Daniels Live'}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 truncate mt-0.5 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">{StorageService.getStreamViewers().length + 42} Believers Streaming</span>
                  <span>•</span>
                  <span className="text-[#D4AF37]">Streaming with your {currentUser.location || currentUser.city_location || 'Harare'} congregation</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowLiveSermonModal(true)}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Join Stream</span>
              </button>
              <button
                onClick={() => setDismissedLiveNotification(true)}
                title="Dismiss notification"
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-3">
        {activeTab === 'home' && (
          <HomeTab
            sermons={sermons}
            devotionals={devotionals}
            testimonies={testimonies}
            lowDataMode={lowDataMode}
            onNavigateTab={setActiveTab}
            onNavigateToBible={(ref) => {
              setBibleReference(ref);
              setActiveTab('bible');
            }}
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
          <BibleTab lowDataMode={lowDataMode} initialReference={bibleReference} />
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
            onOpenGroupChat={(groupId) => {
              if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
                setAuthMode('login');
                setShowAuthModal(true);
                return;
              }
              setDirectMessageGroupId(groupId);
              setDirectMessageRecipientId(undefined);
              setShowDirectMessagesModal(true);
            }}
            onOpenDirectChat={(recipientId) => {
              if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
                setAuthMode('login');
                setShowAuthModal(true);
                return;
              }
              setDirectMessageRecipientId(recipientId);
              setDirectMessageGroupId(undefined);
              setShowDirectMessagesModal(true);
            }}
            onOpenLiveSermon={() => setShowLiveSermonModal(true)}
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
            onOpenDirectChat={handleOpenDirectChat}
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
          onSwitchUser={(user) => setCurrentUser(user)}
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

      {/* Live Sermon Broadcast Streaming Modal */}
      {showLiveSermonModal && (
        <LiveSermonModal
          currentUser={currentUser}
          onClose={() => {
            setShowLiveSermonModal(false);
            refreshAppData();
          }}
          onOpenSeedModal={() => {
            setShowLiveSermonModal(false);
            setActiveTab('store');
          }}
        />
      )}

      {/* Direct Messages Modal */}
      {showDirectMessagesModal && (
        <DirectMessagesModal
          currentUser={currentUser}
          initialRecipientId={directMessageRecipientId}
          initialGroupId={directMessageGroupId}
          onClose={() => {
            setShowDirectMessagesModal(false);
            setDirectMessageRecipientId(undefined);
            setDirectMessageGroupId(undefined);
            refreshAppData();
          }}
        />
      )}

      {/* Floating Notification Toast (Redirects to exact place message comes from) */}
      <FloatingNotificationToast
        onOpenLiveSermon={() => setShowLiveSermonModal(true)}
        onOpenDirectChat={(recipientId) => {
          if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
            setAuthMode('login');
            setShowAuthModal(true);
            return;
          }
          setDirectMessageRecipientId(recipientId);
          setDirectMessageGroupId(undefined);
          setShowDirectMessagesModal(true);
        }}
        onOpenGroupChat={(groupId) => {
          if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
            setAuthMode('login');
            setShowAuthModal(true);
            return;
          }
          setDirectMessageGroupId(groupId);
          setDirectMessageRecipientId(undefined);
          setShowDirectMessagesModal(true);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        onOpenAllNotifications={() => setShowNotificationsModal(true)}
      />

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          onOpenLiveSermon={() => setShowLiveSermonModal(true)}
          onOpenDirectChat={(recipientId) => {
            if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
              setAuthMode('login');
              setShowAuthModal(true);
              return;
            }
            setDirectMessageRecipientId(recipientId);
            setDirectMessageGroupId(undefined);
            setShowDirectMessagesModal(true);
          }}
          onOpenGroupChat={(groupId) => {
            if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
              setAuthMode('login');
              setShowAuthModal(true);
              return;
            }
            setDirectMessageGroupId(groupId);
            setDirectMessageRecipientId(undefined);
            setShowDirectMessagesModal(true);
          }}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
          }}
        />
      )}

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
                <>
                  <div>
                    <label className="block font-semibold text-white/80 mb-1">
                      City / Location
                    </label>
                    <select
                      value={authLocation}
                      onChange={(e) => setAuthLocation(e.target.value)}
                      className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      {[
                        'Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Kwekwe', 
                        'Kadoma', 'Masvingo', 'Chinhoyi', 'Norton', 'Marondera', 'Ruwa', 
                        'Chegutu', 'Zvishavane', 'Bindura', 'Victoria Falls', 'Hwange', 
                        'Redcliff', 'Rusape', 'Karoi', 'Kariba', 'Chipinge', 'Gokwe', 'Shurugwi'
                      ].map(city => (
                        <option key={city} value={city} className="bg-[#001F3F] text-white">
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-white/80 mb-1">
                      Referral Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={authReferralCode}
                      onChange={(e) => setAuthReferralCode(e.target.value)}
                      placeholder="Enter referral (optional)"
                      className="w-full bg-[#001122] border border-white/20 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </>
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
