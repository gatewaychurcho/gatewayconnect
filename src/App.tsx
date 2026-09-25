import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/tabs/HomeTab';
import { BibleTab } from './components/tabs/BibleTab';
import { CommunityTab } from './components/tabs/CommunityTab';
import { StoreTab } from './components/tabs/StoreTab';
import { MeTab } from './components/tabs/MeTab';
import { subscribeToRealtime } from './lib/realtime';
import { getSupabase } from './services/supabaseClient';
import { AdminPanel } from './components/admin/AdminPanel';
import { DevConsole } from './components/dev/DevConsole';
import { FlutterExportModal } from './components/modals/FlutterExportModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { BannedScreen } from './components/auth/BannedScreen';
import { DirectMessagesModal } from './components/modals/DirectMessagesModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { FloatingNotificationToast } from './components/common/FloatingNotificationToast';
import { FloatingCommentReply } from './components/common/FloatingCommentReply';
import { LiveSermonModal } from './components/modals/LiveSermonModal';
import { InstagramProfileModal } from './components/modals/InstagramProfileModal';
import { StorageService } from './services/storageService';
import { liveSyncService } from './services/liveSyncService';
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
  const [showSplash, setShowSplash] = useState(true);
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
  const [showDirectMessagesModal, setShowDirectMessagesModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showLiveSermonModal, setShowLiveSermonModal] = useState<boolean>(false);
  const [directMessageRecipientId, setDirectMessageRecipientId] = useState<string | undefined>(undefined);
  const [directMessageGroupId, setDirectMessageGroupId] = useState<string | undefined>(undefined);
  const [bibleReference, setBibleReference] = useState<string | undefined>(undefined);
  const [globalProfileUserId, setGlobalProfileUserId] = useState<string | null>(null);
  const [unreadDmsCount, setUnreadDmsCount] = useState<number>(() => {
    const user = StorageService.getCurrentUser();
    if (!user) return 0;
    const threads = StorageService.getAllDirectMessageThreads(user.id);
    return threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
  });
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);


  useEffect(() => {
    const handleOpenLive = () => {
      setShowLiveSermonModal(true);
    };
    window.addEventListener('gcz_open_live_stream', handleOpenLive);

    // Sync Supabase Auth session on load
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const localUser = StorageService.getCurrentUser();
          if (!localUser || localUser.id === 'usr_guest') {
            try {
              const { data: dbUser } = await supabase.from('users').select('*').eq('id', session.user.id).single();
              if (dbUser) {
                StorageService.saveUser(dbUser);
                StorageService.setCurrentUser(dbUser);
                setCurrentUser(dbUser);
              }
            } catch {}
          }
        }
      }).catch(() => {});

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          StorageService.logout();
          setCurrentUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: dbUser } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            if (dbUser) {
              StorageService.saveUser(dbUser);
              StorageService.setCurrentUser(dbUser);
              setCurrentUser(dbUser);
            }
          } catch {}
        }
      });

      return () => {
        window.removeEventListener('gcz_open_live_stream', handleOpenLive);
        authListener?.subscription?.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('gcz_open_live_stream', handleOpenLive);
    };
  }, []);

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
    if (user) {
      const threads = StorageService.getAllDirectMessageThreads(user.id);
      setUnreadDmsCount(threads.reduce((acc, t) => acc + (t.unread_count || 0), 0));
    }
  };
  
  const refreshLiveState = () => {
  refreshAppData();
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

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    StorageService.logout();
    setCurrentUser(null);
    setShowProfileModal(false);
    confetti({ particleCount: 20, spread: 50 });
  };

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    refreshAppData();
  };

  const handleInstantJoin = (nameOrHandle: string) => {
    const trimmedName = nameOrHandle.trim();
    const displayName = trimmedName.replace(/^@/, '') || 'Gateway Believer';
    const instantUser: User = {
      id: `usr_instant_${Date.now()}`,
      phone: `instant_${Date.now()}`,
      full_name: displayName,
      handle: `@${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'believer'}`,
      role: 'member',
      member_id: `GCZ-INSTANT-${Date.now().toString().slice(-6)}`,
      is_verified: false,
      badge_type: 'none',
      is_premium: false,
      created_at: new Date().toISOString(),
      location: 'Harare',
      city_location: 'Harare',
      saved_verses: [],
      offline_sermon_ids: [],
      followers_count: 0,
      following_count: 0
    };
    StorageService.saveUser(instantUser);
    StorageService.autoFollowSuperAdminAndDeveloper(instantUser.id);
    StorageService.setCurrentUser(instantUser);
    setCurrentUser(instantUser);
    confetti({ particleCount: 30, spread: 60 });
  };

  useEffect(() => {
    StorageService.syncUsersWithRemote().catch(() => {});
    StorageService.syncStoriesWithRemote().catch(() => {});
    // Hydrate community posts, comments and prayers from Supabase so a fresh
    // install / new member sees everything the church has already shared.
    StorageService.syncPostsAndPrayersWithRemote()
      .catch(() => {})
      .finally(() => refreshAppData());
    if (!currentUser) {
      liveSyncService.disconnect();
      return;
    }
    if (currentUser?.id && currentUser?.role !== 'guest') {
      StorageService.hydrateFollowsFromSupabase(currentUser.id).catch(() => {});
      // Hydrate chat history so a new login sees conversations from other devices.
      StorageService.syncDirectMessagesWithRemote(currentUser.id).catch(() => {});
      StorageService.syncGroupMessagesWithRemote(currentUser.id).catch(() => {});
    }
    liveSyncService.connect(currentUser);
    const unbind = liveSyncService.bindLocalEvents();
      const handleOpenProfile = (e: any) => {
      if (e?.detail?.userId) {
        setGlobalProfileUserId(e.detail.userId);
      }
    };
    const handleProfileUpdated = (e: any) => {
      const updated = e?.detail || StorageService.getCurrentUser();
      if (updated) {
        setCurrentUser(updated);
      }
      refreshAppData();
    };
    window.addEventListener('gcz_banned_users_updated', refreshLiveState);
    window.addEventListener('gcz_current_user_banned', refreshLiveState);
    window.addEventListener('gcz_testimony_updated', refreshLiveState);
    window.addEventListener('gcz_testimony_deleted', refreshLiveState);
    window.addEventListener('gcz_live_state_updated', refreshLiveState);
    window.addEventListener('gcz_live_event_received', refreshLiveState);
    const handleUserDeleted = (e: any) => {
      const deletedId = e?.detail?.userId;
      if (!deletedId || currentUser?.id === deletedId) {
        handleLogout();
      } else {
        refreshAppData();
      }
    };

    window.addEventListener('gcz_open_user_profile', handleOpenProfile);
    window.addEventListener('gcz_user_profile_updated', handleProfileUpdated);
    window.addEventListener('gcz_user_deleted', handleUserDeleted);
    return () => {
      unbind();
      liveSyncService.disconnect();
      window.removeEventListener('gcz_banned_users_updated', refreshLiveState);
      window.removeEventListener('gcz_current_user_banned', refreshLiveState);
      window.removeEventListener('gcz_testimony_updated', refreshLiveState);
      window.removeEventListener('gcz_testimony_deleted', refreshLiveState);
      window.removeEventListener('gcz_live_state_updated', refreshLiveState);
      window.removeEventListener('gcz_live_event_received', refreshLiveState);
      window.removeEventListener('gcz_open_user_profile', handleOpenProfile);
      window.removeEventListener('gcz_user_profile_updated', handleProfileUpdated);
      window.removeEventListener('gcz_user_deleted', handleUserDeleted);
    };
  }, [currentUser?.id]);
  useEffect(() => {
    if (
      !currentUser ||
      currentUser.role === 'guest' ||
      currentUser.id.startsWith('usr_guest')
    ) {
      return;
    }

    const supabase = getSupabase();

    if (!supabase) {
      console.warn('Supabase Realtime is not configured.');
      return;
    }

    const unsubscribe = subscribeToRealtime(
      supabase,
      {
        directMessages: (payload) => {
          console.log('Realtime direct message:', payload);
          StorageService.syncDirectMessagesWithRemote(currentUser.id)
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        messages: (payload) => {
          console.log('Realtime group message:', payload);
          StorageService.syncGroupMessagesWithRemote(currentUser.id)
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        posts: (payload) => {
          console.log('Realtime post:', payload);
          StorageService.syncPostsAndPrayersWithRemote()
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        comments: (payload) => {
          console.log('Realtime comment:', payload);
          StorageService.syncPostsAndPrayersWithRemote()
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        prayers: (payload) => {
          console.log('Realtime prayer request:', payload);
          StorageService.syncPostsAndPrayersWithRemote()
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        liveStreams: (payload) => {
          console.log('Realtime live stream:', payload);
          refreshAppData();
        },
        reactions: (payload) => {
          console.log('Realtime reaction:', payload);
          refreshAppData();
        },
        users: (payload) => {
          console.log('Realtime user account change:', payload);
          StorageService.syncUsersWithRemote()
            .catch(() => {})
            .finally(() => refreshAppData());
        },
        onBroadcastEvent: (event) => {
          console.log('Realtime live broadcast event:', event);
          refreshAppData();
        },
      },
      currentUser
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

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

  // Website splash screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Enforce Login Screen when user opens app for the 1st time or after logging out
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user, isNewUser) => {
          setCurrentUser(user);
          refreshAppData();
        }}
        onInstantJoin={handleInstantJoin}
        onContinueAsGuest={handleGuestLogin}
      />
    );
  }

  // Check if current user is banned - blocks entire app and renders dedicated Banned Screen
  const bannedMap = StorageService.getBannedUsers();
  const isUserBanned = currentUser?.is_banned || Boolean(
    (currentUser?.id && bannedMap[currentUser.id]) ||
    (currentUser?.phone && bannedMap[currentUser.phone])
  );
  if (isUserBanned) {
    return (
      <BannedScreen
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // Multi-step Onboarding Wizard for new users immediately after sign-up (Facebook-style flow)
  // Forces users to choose/upload an avatar before accessing the main dashboard
  const needsOnboarding = Boolean(
    currentUser && 
    currentUser.role !== 'guest' && 
    !currentUser.id.startsWith('usr_guest') && 
    !currentUser.id.startsWith('usr_instant_') &&
    (currentUser.onboarding_completed === false || (!currentUser.avatar_url && currentUser.onboarding_completed !== true))
  );

  if (needsOnboarding && currentUser) {
    return (
      <OnboardingWizard
        user={currentUser}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          refreshAppData();
        }}
      />
    );
  }

  return (
    <div className="gcz-app-shell min-h-screen bg-[var(--gcz-bg-page)] text-[var(--gcz-text-main)] flex flex-col selection:bg-primary selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
      
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
        unreadDmsCount={unreadDmsCount}
        pushNotifications={pushNotifications}
      />

      {/* 2. Main Content Area */}
      <main className="gcz-main flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-3 pb-24 sm:pb-20 overflow-x-hidden">
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
            onOpenLiveModal={() => setShowLiveSermonModal(true)}
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
            onOpenOnboarding={() => setShowOnboardingModal(true)}
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
      <footer className="gcz-statusbar h-10 bg-card border-t border-border px-4 sm:px-8 flex items-center justify-between text-[10px] font-bold tracking-widest text-muted-foreground shrink-0 mb-14 sm:mb-16">
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="text-primary flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            SYSTEM: ONLINE
          </span>
          <span className="hidden sm:inline text-muted-foreground/70">FCM PUSH: READY</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground/70">
          <span>V 1.0.4-PROD</span>
          <span className="hidden md:inline">© GATEWAY CHURCH ZIMBABWE</span>
        </div>
      </footer>

      {/* 5. Bottom Tab Navigation (Instagram Style) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={0}
        currentUser={currentUser}
        communityBadge={unreadDmsCount}
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

      {/* Instagram-Style User Profile Modal (Self & Global Member Profile) */}
      {(showProfileModal || globalProfileUserId) && (
        <InstagramProfileModal
          userId={globalProfileUserId || currentUser?.id || null}
          isOpen={Boolean(showProfileModal || globalProfileUserId)}
          onClose={() => {
            setShowProfileModal(false);
            setGlobalProfileUserId(null);
          }}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          onOpenDirectChat={(recipientId) => {
            setShowProfileModal(false);
            setGlobalProfileUserId(null);
            if (!currentUser || currentUser.role === 'guest' || currentUser.id.startsWith('usr_guest')) {
              setAuthMode('login');
              setShowAuthModal(true);
              return;
            }
            setDirectMessageRecipientId(recipientId);
            setDirectMessageGroupId(undefined);
            setShowDirectMessagesModal(true);
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
        currentUser={currentUser}
        onOpenLiveSermon={() => setActiveTab('home')}
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

      {/* Floating Comment Reply Float */}
      {currentUser && <FloatingCommentReply currentUser={currentUser} />}

      {/* Interactive Live Sanctuary Sermon Modal */}
      {showLiveSermonModal && currentUser && (
        <LiveSermonModal
          currentUser={currentUser}
          onClose={() => setShowLiveSermonModal(false)}
        />
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
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

      {/* Unified Auth Modal (Login / Signup) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <LoginScreen
              initialView={authMode === 'signup' ? 'signup' : 'signin'}
              onLoginSuccess={(user, isNewUser) => {
                setCurrentUser(user);
                refreshAppData();
                setShowAuthModal(false);
              }}
              onInstantJoin={(nameOrHandle) => {
                handleInstantJoin(nameOrHandle);
                setShowAuthModal(false);
              }}
              onContinueAsGuest={() => {
                handleGuestLogin();
                setShowAuthModal(false);
              }}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      {/* Manual / Re-launched Onboarding Modal (for existing members from MeTab) */}
      {showOnboardingModal && currentUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/85 backdrop-blur-md">
          <OnboardingWizard
            user={currentUser}
            onComplete={(updatedUser) => {
              setCurrentUser(updatedUser);
              setShowOnboardingModal(false);
              refreshAppData();
            }}
            onClose={() => setShowOnboardingModal(false)}
          />
        </div>
      )}

    </div>
  );
}
