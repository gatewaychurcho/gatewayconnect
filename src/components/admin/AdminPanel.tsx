import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  Heart, 
  Calendar, 
  ShoppingBag, 
  Music, 
  Bell, 
  Plus, 
  Search, 
  Check, 
  Copy,
  X, 
  Edit3, 
  Download, 
  Radio, 
  TrendingUp, 
  Activity, 
  Send,
  MessageSquare,
  QrCode,
  CheckCircle2,
  Trash2,
  FileText,
  Package,
  Layers,
  Sparkles,
  BookOpen,
  Eye,
  Sliders,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  MapPin,
  Tv,
  Play,
  Terminal,
  MoreVertical,
  BadgeCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  User, 
  UserRole, 
  Sermon, 
  Devotional, 
  Donation, 
  PrayerRequest, 
  ChurchEvent, 
  Order, 
  Product,
  JoeVibesSubmission,
  PushNotification,
  ServiceBooking,
  Testimony,
  CongregationUnit,
  StreamViewer,
  StreamAttendanceRecord,
  SUPPORTED_CITIES
} from '../../types';
import { StorageService } from '../../services/storageService';
import { downloadCsvForExcel } from '../../utils/exportUtils';
import { AdminCyberBackground } from './AdminCyberBackground';
import { LocalImagePicker } from '../common/LocalImagePicker';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshAppState: () => void;
}

type AdminSection = 'overview' | 'congregations' | 'stream_attendees' | 'broadcast' | 'content_moderation' | 'inventory' | 'members' | 'prayers' | 'push' | 'finances' | 'vibes';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefreshAppState }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  
  // Cyber-Futuristic Hacker Background Toggle
  const [showCyberBackground, setShowCyberBackground] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gcz_admin_cyber_bg');
      return saved !== null ? saved === 'true' : true; // Default ON for hacker movie screen vibe
    }
    return true;
  });

  const handleToggleCyberBackground = () => {
    setShowCyberBackground(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('gcz_admin_cyber_bg', String(next));
      }
      return next;
    });
  };

  // Header 3-Dots Dropdown menu state
  const [showHeaderMenu, setShowHeaderMenu] = useState<boolean>(false);

  // Row-level 3-dot dropdown states
  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);
  const [activeProductMenuId, setActiveProductMenuId] = useState<string | null>(null);

  // App data states
  const [users, setUsers] = useState<User[]>(StorageService.getAllUsers());
  const [sermons, setSermons] = useState<Sermon[]>(StorageService.getSermons());
  const [congregationUnits, setCongregationUnits] = useState<CongregationUnit[]>(StorageService.getCongregationUnits());
  const [streamViewers, setStreamViewers] = useState<StreamViewer[]>(StorageService.getStreamViewers());
  const [streamAttendees, setStreamAttendees] = useState<StreamAttendanceRecord[]>(StorageService.getStreamAttendanceHistory());
  const [attendeeCityFilter, setAttendeeCityFilter] = useState<string>('All');
  const [attendeeSearch, setAttendeeSearch] = useState<string>('');
  const [copiedAttendeeData, setCopiedAttendeeData] = useState<boolean>(false);
  const [liveSermonStatus, setLiveSermonStatus] = useState(StorageService.getLiveSermonStatus());
  const [adminStreamUrl, setAdminStreamUrl] = useState<string>(liveSermonStatus.streamUrl || 'https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP');
  const [showAdminStreamPreview, setShowAdminStreamPreview] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [donations, setDonations] = useState<Donation[]>(StorageService.getDonations());
  const [prayers, setPrayers] = useState<PrayerRequest[]>(StorageService.getPrayerRequests());
  const [events, setEvents] = useState<ChurchEvent[]>(StorageService.getEvents());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [joeVibes, setJoeVibes] = useState<JoeVibesSubmission[]>(StorageService.getJoeVibes());
  const [notifications, setNotifications] = useState<PushNotification[]>(StorageService.getPushNotifications());

  // Content Moderation States (Bans, Appeals, and Password Recovery are now exclusively in Dev Console)
  const [testimonies, setTestimonies] = useState<Testimony[]>(StorageService.getTestimonies());
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All');
  
  // Sermon Management Form
  const [sermonTitle, setSermonTitle] = useState<string>('Apostolic Impartation & Supernatural Breakthrough');
  const [sermonSeries, setSermonSeries] = useState<string>('Prophetic Dimensions 2026');
  const [sermonYoutubeInput, setSermonYoutubeInput] = useState<string>('https://youtu.be/Tde5rGafeBE');
  const [sermonScripture, setSermonScripture] = useState<string>('1 Kings 18:46');
  const [sermonDesc, setSermonDesc] = useState<string>('When divine acceleration rests upon you, obstacles turn into testimonies.');
  const [sermonThumbnail, setSermonThumbnail] = useState<string>('/assets/apostle_joe_daniels_preach.jpg');

  // Push Broadcast Form
  const [pushTitle, setPushTitle] = useState<string>('🔴 Live Prophetic Broadcast Alert');
  const [pushMessage, setPushMessage] = useState<string>('Apostle Joe Daniels is LIVE on "Supernatural Acceleration". Connect now!');
  const [pushSegment, setPushSegment] = useState<PushNotification['target_segment']>('All Members');

  // Live Pulpit Scripture Sync State
  const [pulpitBook, setPulpitBook] = useState<string>('Psalms');
  const [pulpitChapter, setPulpitChapter] = useState<number>(23);
  const [pulpitVerse, setPulpitVerse] = useState<number>(1);
  const [pulpitSyncStatus, setPulpitSyncStatus] = useState<string | null>(null);

  // New Product Modal Form
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCategory, setNewProdCategory] = useState<Product['category']>('Books');
  const [newProdPriceUsd, setNewProdPriceUsd] = useState<number>(15);
  const [newProdPriceZig, setNewProdPriceZig] = useState<number>(220);
  const [newProdImage, setNewProdImage] = useState<string>('/assets/apostle_joe_daniels_main.jpg');
  const [newProdDesc, setNewProdDesc] = useState<string>('');

  // Prayer decree modal
  const [activePrayerDecree, setActivePrayerDecree] = useState<PrayerRequest | null>(null);
  const [decreeNote, setDecreeNote] = useState<string>('I decree the supernatural favor of God and total deliverance in Jesus name!');

  // Calculations for KPI Cards
  const totalGivingUsd = donations
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalGivingZig = donations
    .filter(d => d.currency === 'ZiG')
    .reduce((sum, d) => sum + d.amount, 0);
  const answeredPrayersCount = prayers.filter(p => p.is_answered || p.status === 'apostle_prayed').length;
  const availableInventoryCount = products.filter(product => product.in_stock && (product.stock_quantity === undefined || product.stock_quantity > 0)).length;
  const dataSourceLabel = StorageService.getSupabaseConfig().isLiveConnected ? 'Supabase configured' : 'Local cache';

  const extractYoutubeId = (urlOrId: string) => {
    const trimmed = urlOrId.trim();
    if (trimmed.includes('youtu.be/')) {
      return trimmed.split('youtu.be/')[1].split('?')[0];
    }
    if (trimmed.includes('watch?v=')) {
      return trimmed.split('watch?v=')[1].split('&')[0];
    }
    return trimmed;
  };

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    StorageService.updateUserRole(userId, newRole);
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
  };

  // Stream Attendees & Pastoral Follow-Up Export
  const handleExportStreamAttendees = () => {
    const list = StorageService.getStreamAttendanceHistory();
    const csvHeader = 'Name,Phone,Handle,City,Joined At,Status,Session Title\n';
    const csvRows = list.map(a => `"${a.user_name}","${a.user_phone}","${a.user_handle}","${a.city}","${a.joined_at}","${a.status}","${a.session_title}"`).join('\n');
    const csvContent = csvHeader + csvRows;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(csvContent);
      setCopiedAttendeeData(true);
      setTimeout(() => setCopiedAttendeeData(false), 3000);
    }
    setModerationMessage(`Successfully copied ${list.length} attendee contact records to database export buffer.`);
    confetti({ particleCount: 25, spread: 50 });
  };

  const handleDownloadStreamAttendeesExcel = () => {
    const list = StorageService.getStreamAttendanceHistory();
    const csvHeader = 'Name,Phone,Handle,City,Joined At,Status,Session Title\n';
    const csvRows = list.map(a => `"${a.user_name}","${a.user_phone}","${a.user_handle}","${a.city}","${a.joined_at}","${a.status}","${a.session_title}"`).join('\n');
    const csvContent = csvHeader + csvRows;
    downloadCsvForExcel(`gateway_connect_stream_attendees_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setModerationMessage(`Downloaded ${list.length} attendee records as Excel CSV file.`);
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleDownloadMembersExcel = () => {
    const userList = StorageService.getAllUsers();
    const csvHeader = 'Member ID,Full Name,Phone,Handle,Role,Cell Group,Verified,Premium,Joined Date\n';
    const csvRows = userList.map(u => 
      `"${u.member_id || u.id}","${u.full_name}","${u.phone}","${u.handle || ''}","${u.role}","${u.cell_group || ''}","${u.is_verified ? 'Yes' : 'No'}","${u.is_premium ? 'Yes' : 'No'}","${u.created_at || ''}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;
    downloadCsvForExcel(`gateway_connect_registered_members_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setModerationMessage(`Downloaded ${userList.length} registered member records as Excel CSV file.`);
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleDeleteCommunityPost = (postId: string) => {
    if (!window.confirm('Delete this community post/testimony permanently from the feed?')) return;
    StorageService.deleteTestimony(postId);
    setTestimonies(StorageService.getTestimonies());
    setModerationMessage('Post removed by Moderator.');
    onRefreshAppState();
  };

  const handlePublishSermon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle.trim()) return;
    const yId = extractYoutubeId(sermonYoutubeInput) || 'Tde5rGafeBE';
    const newSermon: Sermon = {
      id: `sermon_${Date.now()}`,
      title: sermonTitle.trim(),
      speaker: 'Apostle Joe Daniels',
      date: 'Just Now',
      series: sermonSeries,
      duration: '1h 10m',
      youtube_id: yId,
      thumbnail_url: sermonThumbnail,
      scriptures: [sermonScripture],
      description: sermonDesc || 'Apostolic impartation for supernatural breakthrough.',
      view_count: 1,
      is_live: true
    };
    StorageService.addSermon(newSermon);
    setSermons(StorageService.getSermons());
    onRefreshAppState();
    confetti({ particleCount: 35, spread: 70 });
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;
    StorageService.sendPushNotification(pushTitle.trim(), pushMessage.trim(), pushSegment);
    setNotifications(StorageService.getPushNotifications());
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleSyncPulpitScripture = () => {
    const reference = `${pulpitBook} ${pulpitChapter}:${pulpitVerse}`;
    window.dispatchEvent(new CustomEvent('gcz_pulpit_scripture_updated', { detail: { reference, synced_at: new Date().toISOString() } }));
    setPulpitSyncStatus(`Synced: ${reference}`);
    confetti({ particleCount: 25, spread: 50 });
    setTimeout(() => setPulpitSyncStatus(null), 4000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    const prod: Product = {
      id: `prod_${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory,
      price_usd: Number(newProdPriceUsd) || 10,
      price_zig: Number(newProdPriceZig) || 150,
      image_url: newProdImage || '/assets/apostle_joe_daniels_main.jpg',
      description: newProdDesc || 'Official Gateway Church Zimbabwe resource.',
      author_or_brand: 'Apostle Joe Daniels',
      in_stock: true,
      is_bestseller: false
    };
    StorageService.addProduct(prod);
    setProducts(StorageService.getProducts());
    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdDesc('');
    confetti({ particleCount: 30, spread: 60 });
  };

  const handleApplyPrayerDecree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrayerDecree) return;
    StorageService.apostleAnswerPrayer(activePrayerDecree.id, decreeNote, false);
    setPrayers(StorageService.getPrayerRequests());
    setActivePrayerDecree(null);
    confetti({ particleCount: 25 });
    onRefreshAppState();
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    StorageService.updateOrderStatus(orderId, status);
    setOrders(StorageService.getOrders());
  };

  const handleUpdateJoeVibes = (id: string, status: JoeVibesSubmission['status']) => {
    StorageService.updateJoeVibesStatus(id, status);
    setJoeVibes(StorageService.getJoeVibes());
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.role.includes(searchQuery)
  );

  const filteredProducts = products.filter(p => 
    (inventoryCategory === 'All' || p.category === inventoryCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#001122] flex flex-col text-white font-sans overflow-hidden isolate">
      
      {/* 0. CYBER-FUTURISTIC BACKGROUND (Matrix Streams strictly BEHIND everything in the background) */}
      <AdminCyberBackground enabled={showCyberBackground} />

      {/* 1. TOP ERP-STYLE HEADER */}
      <header className="relative z-20 bg-[#001F3F]/90 backdrop-blur-md border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#001F3F] flex items-center justify-center font-black shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base text-[#D4AF37] tracking-wide">
                Gateway Admin Center
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-semibold border border-[#D4AF37]/30">
                Operations Console
              </span>
            </div>
            <p className="text-[11px] text-white/60">
              Ministry Operations, Stream Ingest, Inventory & Member Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cyber Futuristic Background Toggle */}
          <button
            type="button"
            onClick={handleToggleCyberBackground}
            title={showCyberBackground ? "Turn Cyber Background OFF" : "Turn Cyber Background ON"}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
              showCyberBackground
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">Cyber Matrix:</span>
            <span className="font-mono text-[11px] uppercase">{showCyberBackground ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              confetti({ particleCount: 20 });
              onRefreshAppState();
            }}
            title="Sync Database"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* 3-Dots Quick Actions Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHeaderMenu(prev => !prev)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs transition-colors cursor-pointer"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-11 z-50 w-56 bg-[#00172e] border border-[#D4AF37]/30 rounded-2xl shadow-2xl p-2 space-y-1 font-sans animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-white/10">
                  Admin Actions
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleToggleCyberBackground();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Toggle Cyber Matrix ({showCyberBackground ? 'Turn OFF' : 'Turn ON'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    confetti({ particleCount: 20 });
                    onRefreshAppState();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/10 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync & Refresh All Data</span>
                </button>
                <div className="border-t border-white/10 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Exit Admin Panel</span>
                </button>
              </div>
            )}
          </div>

          <button
            id="btn-close-admin-panel"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="relative z-20 hidden sm:flex items-center gap-4 px-4 py-1.5 bg-[#000d1a]/90 border-b border-white/5 text-[9px] font-mono uppercase tracking-wider text-white/50 shrink-0">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Admin Workspace Loaded
        </span>
        <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-300" />Broadcast: {liveSermonStatus.isLive ? 'Live' : 'Standby'}</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-[#D4AF37]" />Data: {dataSourceLabel}</span>
        <span className="ml-auto text-[#D4AF37]/70">ADMIN / OPERATIONS</span>
      </div>

      {/* 2. BODY WITH SIDEBAR NAVIGATION + MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Desktop) & MOBILE DROPDOWN SELECTOR */}
        {/* Mobile View: Quick Dropdown selector */}
        <div className="md:hidden bg-[#00172e] border-b border-white/10 p-2.5 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Module:</span>
          <div className="relative flex-1">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as AdminSection)}
              className="w-full bg-[#001F3F] border border-[#D4AF37]/40 rounded-xl px-3 py-1.5 text-xs text-[#D4AF37] font-bold appearance-none pr-8 focus:outline-none focus:border-[#D4AF37]"
            >
              {[
                { id: 'overview', label: '📊 Dashboard KPI' },
                { id: 'congregations', label: `⛪ Congregations & Streaming (${congregationUnits.filter(c => c.is_congregation).length} Hubs)` },
                { id: 'stream_attendees', label: `📡 Streamers & Attendees (${streamAttendees.length} Logged)` },
                { id: 'content_moderation', label: `🛡️ Community Post Moderation (${testimonies.length} Posts)` },
                { id: 'broadcast', label: '🔴 Sermon & Live Stream' },
                { id: 'inventory', label: '📦 Store & Inventory' },
                { id: 'push', label: '🔔 Push Broadcasts' },
                { id: 'members', label: '👥 Members & Roles' },
                { id: 'prayers', label: '🙏 Altar Petitions' },
                { id: 'finances', label: '💰 Tithes & Seed Fund' },
                { id: 'vibes', label: '🎵 Joe Vibes Submissions' },
              ].map(opt => (
                <option key={opt.id} value={opt.id} className="bg-[#001F3F] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#D4AF37] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-56 bg-gradient-to-b from-[#00172e]/95 to-[#000d1a]/95 border-r border-emerald-500/15 shrink-0 flex-col overflow-y-auto p-2 gap-1">
          <div className="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Management Modules
          </div>

          {[
            { id: 'overview', label: 'Dashboard KPI', icon: Activity, badge: null },
            { id: 'congregations', label: 'Congregations & Stream', icon: Tv, badge: `${congregationUnits.filter(c => c.is_congregation).length} Hubs` },
            { id: 'stream_attendees', label: 'Stream Attendees Log', icon: Users, badge: `${streamAttendees.length}` },
            { id: 'content_moderation', label: 'Post Moderation', icon: Trash2, badge: `${testimonies.length}` },
            { id: 'broadcast', label: 'Sermon & Live Stream', icon: Radio, badge: 'Live' },
            { id: 'inventory', label: 'Store & Inventory', icon: Package, badge: products.length },
            { id: 'push', label: 'Push Broadcasts', icon: Bell, badge: notifications.length },
            { id: 'members', label: 'Members & Roles', icon: Users, badge: users.length },
            { id: 'prayers', label: 'Altar Petitions', icon: Heart, badge: prayers.length },
            { id: 'finances', label: 'Tithes & Seed Fund', icon: DollarSign, badge: `$${totalGivingUsd}` },
            { id: 'vibes', label: 'Joe Vibes Submissions', icon: Music, badge: joeVibes.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as AdminSection)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#c49f2f] text-[#001F3F] font-bold shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                    : 'text-white/70 hover:text-white hover:bg-emerald-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#001F3F]' : 'text-[#D4AF37]'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-2 ${
                    isActive ? 'bg-[#001F3F]/20 text-[#001F3F]' : 'bg-white/10 text-white/70'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* MAIN WORKSPACE CONTENT - Cyber background streams purely behind all cards and content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#001122]/70 backdrop-blur-[2px]">
          
          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* Notification Banner if action was recently taken */}
              {moderationMessage && (
                <div className="p-3.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-2xl flex items-center justify-between text-xs text-[#D4AF37] font-semibold animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{moderationMessage}</span>
                  </div>
                  <button onClick={() => setModerationMessage(null)} className="text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Administrative Security & Moderation Hub (Direct Access to Requested Features) */}
              <div className="bg-gradient-to-r from-[#00172e] via-[#001F3F] to-[#00172e] border-2 border-[#D4AF37]/50 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Lead Administrator & Moderation Hub</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#001F3F] text-[10px] font-black uppercase">
                          Ecclesiastical Hub
                        </span>
                      </h3>
                      <p className="text-[11px] text-white/60">
                        Pastoral control center for congregation live hubs, stream viewers registry, community post moderation, and altar services.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#D4AF37]">
                    {liveSermonStatus.isLive ? 'Broadcast Status: Live' : 'Broadcast Status: Standby'}
                  </span>
                </div>

                {/* 4 Feature Shortcut Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Feature 1: Congregations & Streaming */}
                  <div 
                    onClick={() => setActiveSection('congregations')}
                    className="p-3 rounded-xl bg-[#001122]/90 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#D4AF37] flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5" />
                        <span>Congregation Hubs</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                        {congregationUnits.filter(c => c.is_congregation).length} Formed
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 line-clamp-2 mb-2">
                      Groups active streamers by cities. 10+ active streamers form an official Congregation.
                    </p>
                    <span className="text-[11px] font-bold text-[#D4AF37] group-hover:underline flex items-center gap-1">
                      <span>View Live Hubs</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 2: Streamers & Attendees Registry */}
                  <div 
                    onClick={() => setActiveSection('stream_attendees')}
                    className="p-3 rounded-xl bg-[#001122]/90 border border-blue-500/30 hover:border-blue-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Streamers Registry</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        {streamAttendees.length} Logged
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 line-clamp-2 mb-2">
                      See who streamed, city location, contact details & export to database.
                    </p>
                    <span className="text-[11px] font-bold text-[#D4AF37] group-hover:underline flex items-center gap-1">
                      <span>Attendee Records</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 3: Community Content Moderation */}
                  <div 
                    onClick={() => setActiveSection('content_moderation')}
                    className="p-3 rounded-xl bg-[#001122]/90 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Post Moderation</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {testimonies.length} Posts
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 line-clamp-2 mb-2">
                      Moderate believers feed: delete abusive or non-edifying testimonies with 1 click.
                    </p>
                    <span className="text-[11px] font-bold text-[#D4AF37] group-hover:underline flex items-center gap-1">
                      <span>Moderate Feed</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 4: Broadcast & Pulpit Sync */}
                  <div 
                    onClick={() => setActiveSection('broadcast')}
                    className="p-3 rounded-xl bg-[#001122]/90 border border-purple-500/30 hover:border-purple-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        <span>Sermon Broadcast</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        {liveSermonStatus.isLive ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60 line-clamp-2 mb-2">
                      Start apostolic video stream and live-sync scriptures across member devices.
                    </p>
                    <span className="text-[11px] font-bold text-[#D4AF37] group-hover:underline flex items-center gap-1">
                      <span>Launch Pulpit</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Registered Members</span>
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="text-xl font-bold text-white">{users.length}</div>
                    <div className="text-[11px] text-white/60 mt-1 flex items-center gap-1">
                    <span>Current registered account count</span>
                  </div>
                </div>

                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Live Broadcast Views</span>
                    <Radio className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-white">{streamViewers.length}</div>
                  <div className="text-[11px] text-[#D4AF37] mt-1">
                    <span>{liveSermonStatus.isLive ? 'Current live viewers' : 'No active broadcast'}</span>
                  </div>
                </div>

                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Seed & Tithes</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">${totalGivingUsd.toLocaleString()}</div>
                  <div className="text-[11px] text-white/60 mt-1">
                    <span>+ {totalGivingZig.toLocaleString()} ZiG</span>
                  </div>
                </div>

                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Inventory Products</span>
                    <Package className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="text-xl font-bold text-white">{products.length} Items</div>
                  <div className="text-[11px] text-white/60 mt-1">
                    <span>{availableInventoryCount} currently available</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Live Pulpit Sync Bar */}
              <div className="bg-[#001F3F] border border-[#D4AF37]/30 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Live Pulpit Scripture Synchronizer</span>
                    </h3>
                    <p className="text-xs text-white/70">
                      Push today's sermon scripture to all connected congregation devices in real-time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={pulpitBook}
                      onChange={e => setPulpitBook(e.target.value)}
                      className="bg-[#001122] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Psalms">Psalms</option>
                      <option value="Isaiah">Isaiah</option>
                      <option value="1 Kings">1 Kings</option>
                      <option value="Amos">Amos</option>
                      <option value="Romans">Romans</option>
                      <option value="John">John</option>
                    </select>
                    <input
                      type="number"
                      value={pulpitChapter}
                      onChange={e => setPulpitChapter(Number(e.target.value))}
                      className="w-14 bg-[#001122] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-center text-white"
                      title="Chapter"
                    />
                    <span className="text-white/40">:</span>
                    <input
                      type="number"
                      value={pulpitVerse}
                      onChange={e => setPulpitVerse(Number(e.target.value))}
                      className="w-14 bg-[#001122] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-center text-white"
                      title="Verse"
                    />
                    <button
                      onClick={handleSyncPulpitScripture}
                      className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Sync Live</span>
                    </button>
                  </div>
                </div>

                {pulpitSyncStatus && (
                  <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pulpitSyncStatus} — sync event sent to connected clients.</span>
                  </div>
                )}
              </div>

              {/* Recent Orders & Petitions Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Resource Orders */}
                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                      <span>Recent Store Orders</span>
                    </h4>
                    <button
                      onClick={() => setActiveSection('inventory')}
                      className="text-[11px] text-[#D4AF37] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {orders.slice(0, 3).map(ord => (
                      <div key={ord.id} className="bg-[#001122]/60 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{ord.user_name}</div>
                          <div className="text-[11px] text-white/60">{ord.items.length} items • ${ord.total_usd} via {ord.payment_method}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Prayer Requests */}
                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span>Altar Prayer Petitions</span>
                    </h4>
                    <button
                      onClick={() => setActiveSection('prayers')}
                      className="text-[11px] text-[#D4AF37] hover:underline"
                    >
                      Manage ({prayers.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {prayers.slice(0, 3).map(p => (
                      <div key={p.id} className="bg-[#001122]/60 border border-white/5 rounded-xl p-2.5 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{p.is_anonymous ? 'Anonymous' : p.user_name}</span>
                          <span className="text-[10px] text-[#D4AF37] font-semibold">{p.category}</span>
                        </div>
                        <p className="text-[11px] text-white/70 line-clamp-1">"{p.request_text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SERMON & LIVE BROADCAST */}
          {activeSection === 'broadcast' && (
            <div className="space-y-4">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#D4AF37]">
                      Live Stream Ingest & Sermon Publisher
                    </h3>
                    <p className="text-xs text-white/70">
                      Configure active YouTube stream, sermon series, and apostolic artwork.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    {liveSermonStatus.isLive ? 'Broadcast Live' : 'Broadcast Standby'}
                  </span>
                </div>

                <form onSubmit={handlePublishSermon} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Sermon / Broadcast Title
                      </label>
                      <input
                        type="text"
                        value={sermonTitle}
                        onChange={e => setSermonTitle(e.target.value)}
                        placeholder="e.g. Supernatural Acceleration"
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Sermon Series
                      </label>
                      <input
                        type="text"
                        value={sermonSeries}
                        onChange={e => setSermonSeries(e.target.value)}
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        YouTube URL or Video ID
                      </label>
                      <input
                        type="text"
                        value={sermonYoutubeInput}
                        onChange={e => setSermonYoutubeInput(e.target.value)}
                        placeholder="https://youtu.be/Tde5rGafeBE"
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Primary Scripture Tag
                      </label>
                      <input
                        type="text"
                        value={sermonScripture}
                        onChange={e => setSermonScripture(e.target.value)}
                        placeholder="1 Kings 18:46"
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Thumbnail Artwork (Select Apostle Joe Daniels Photo or custom URL)
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[
                        { url: '/assets/apostle_joe_daniels_preach.jpg', label: 'Preaching' },
                        { url: '/assets/apostle_joe_daniels_grad.jpg', label: 'Academic/Gown' },
                        { url: '/assets/apostle_joe_daniels_podcast.jpg', label: 'Studio/Podcast' },
                        { url: '/assets/apostle_joe_daniels_main.jpg', label: 'Main Portrait' }
                      ].map(item => (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => setSermonThumbnail(item.url)}
                          className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all ${
                            sermonThumbnail === item.url ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50' : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center font-bold">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <LocalImagePicker value={sermonThumbnail} onChange={setSermonThumbnail} />
                                  <LocalImagePicker value={newProdImage} onChange={setNewProdImage} className="mt-1.5" />
                  </div>

                  {/* Live Embed Preview */}
                  <div className="bg-[#001122] rounded-xl p-3 border border-white/10">
                    <span className="text-[11px] font-bold text-white/60 block mb-2">Live Stream Embed Preview:</span>
                    <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-white/10">
                      <iframe
                        src={StorageService.getYoutubeEmbedUrl(extractYoutubeId(sermonYoutubeInput) || 'Tde5rGafeBE', false)}
                        title="Live Stream Preview"
                        className="w-full h-full"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Publish & Go Live</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Sermons List */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Active Sermon Archive ({sermons.length})
                  </h4>
                  <span className="text-[11px] text-[#D4AF37]">
                    Tap any video below to swap it to top & play
                  </span>
                </div>
                <div className="space-y-2">
                  {sermons.map(s => {
                    const isCurrentTop = extractYoutubeId(sermonYoutubeInput) === s.youtube_id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSermonYoutubeInput(`https://www.youtube.com/watch?v=${s.youtube_id}`);
                          setSermonTitle(s.title);
                          setSermonSeries(s.series || 'Apostolic Impartation');
                          setSermonScripture(s.scriptures?.[0] || 'Isaiah 60:1');
                          setSermonThumbnail(s.thumbnail_url);
                          if (s.description) setSermonDesc(s.description);
                          StorageService.setLiveStreamUrl(`https://www.youtube.com/watch?v=${s.youtube_id}`);
                          onRefreshAppState();
                          confetti({ particleCount: 20, spread: 60 });
                        }}
                        className={`border rounded-xl p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                          isCurrentTop
                            ? 'bg-[#001933] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md'
                            : 'bg-[#001122]/60 hover:bg-[#001122] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                            {isCurrentTop && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{s.title}</span>
                              {isCurrentTop && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#001F3F] font-black uppercase tracking-wider">
                                  Playing on Top
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/60">{s.series} • {s.speaker} • {s.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isCurrentTop
                                ? 'bg-[#D4AF37] text-[#001F3F]'
                                : 'bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#001F3F]'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>{isCurrentTop ? 'Now Playing' : 'Play on Top'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONGREGATIONS & LIVE STREAM MONITOR */}
          {activeSection === 'congregations' && (
            <div className="space-y-4">
              {/* Broadcast Status & Live Trigger Card */}
              <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${liveSermonStatus.isLive ? 'bg-red-500 animate-ping' : 'bg-white/30'}`} />
                      <h3 className="font-bold text-sm text-[#D4AF37]">
                        Live Sanctuary Streaming
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newStatus = {
                          isLive: !liveSermonStatus.isLive,
                          title: 'Church & Politics (Controversial Issues) • Apostle Joe Daniels Live',
                          sermonId: 'sermon_church_politics',
                          viewerCount: 0,
                          streamUrl: adminStreamUrl.trim()
                        };
                        StorageService.setLiveSermonStatus(newStatus);
                        setLiveSermonStatus(newStatus);
                        setCongregationUnits(StorageService.getCongregationUnits());
                        setStreamViewers(StorageService.getStreamViewers());
                        confetti({ particleCount: 25, spread: 50 });
                        onRefreshAppState();
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                        liveSermonStatus.isLive
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-[#D4AF37] hover:bg-[#C59B27] text-[#001F3F]'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{liveSermonStatus.isLive ? 'End Live' : 'Go Live'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Stream URL Configuration */}
                <div className="bg-[#001122] border border-white/10 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={adminStreamUrl}
                        onChange={(e) => setAdminStreamUrl(e.target.value)}
                        placeholder="Paste Facebook Live or YouTube URL..."
                        className="w-full bg-[#001A33] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAdminStreamPreview(!showAdminStreamPreview)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                          showAdminStreamPreview 
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' 
                            : 'bg-white/5 hover:bg-white/10 border-white/15 text-white/80'
                        }`}
                        title="Toggle preview"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{showAdminStreamPreview ? 'Hide' : 'Preview'}</span>
                      </button>

                      <button
                        onClick={() => {
                          const cleanUrl = adminStreamUrl.trim();
                          const newStatus = {
                            ...liveSermonStatus,
                            streamUrl: cleanUrl
                          };
                          StorageService.setLiveStreamUrl(cleanUrl);
                          StorageService.setLiveSermonStatus(newStatus);
                          setLiveSermonStatus(newStatus);
                          confetti({ particleCount: 20, spread: 40 });
                        }}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C59B27] text-[#001F3F] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Links */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-white/40 text-[10px] font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setAdminStreamUrl('https://www.facebook.com/ApostleJoeDaniels/live')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors text-[11px]"
                    >
                      Facebook Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminStreamUrl('https://youtu.be/-CibsaxijIk?si=w71mOHPl8igh5XIP')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors text-[11px]"
                    >
                      YouTube Live
                    </button>
                  </div>

                  {/* Admin Stream Preview Player */}
                  {showAdminStreamPreview && (
                    <div className="pt-2 border-t border-white/10 animate-in fade-in duration-200">
                      <div className="text-[11px] font-bold text-white/70 mb-2 flex items-center justify-between">
                        <span>Admin Live Stream Preview (How members see it):</span>
                        {StorageService.isFacebookUrl(adminStreamUrl) && (
                          <a
                            href={StorageService.getStreamEmbedInfo(adminStreamUrl).facebookDirectUrl || adminStreamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1877F2] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open on Facebook</span>
                          </a>
                        )}
                      </div>
                      <div className="aspect-video w-full max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl relative">
                        {StorageService.isFacebookUrl(adminStreamUrl) ? (
                          <iframe
                            className="w-full h-full border-0"
                            src={StorageService.getStreamEmbedInfo(adminStreamUrl).embedUrl}
                            title="Facebook Live Admin Preview"
                            style={{ border: 'none', overflow: 'hidden' }}
                            scrolling="no"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <iframe
                            className="w-full h-full border-0"
                            src={StorageService.getStreamEmbedInfo(adminStreamUrl).embedUrl}
                            title="YouTube Stream Admin Preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4 Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#001122] border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Broadcast Mode</div>
                    <div className={`text-sm font-black mt-1 ${liveSermonStatus.isLive ? 'text-red-400' : 'text-white/60'}`}>
                      {liveSermonStatus.isLive ? '🔴 BROADCASTING LIVE' : 'Standby'}
                    </div>
                  </div>

                  <div className="bg-[#001122] border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Active Live Streamers</div>
                    <div className="text-lg font-black text-white mt-0.5 flex items-center gap-1">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>{streamViewers.length} Believers</span>
                    </div>
                  </div>

                  <div className="bg-[#001122] border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Official Congregations (10+)</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{congregationUnits.filter(c => c.is_congregation).length} Congregations</span>
                    </div>
                  </div>

                  <div className="bg-[#001122] border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Cities Connected</div>
                    <div className="text-lg font-black text-[#D4AF37] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      <span>{congregationUnits.filter(c => c.total_members > 0 || c.active_streamers > 0).length} Hubs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Congregation Hubs Grid (12 Defined Cities Clustering) */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    <span>City Congregation Hubs (10+ Rule Enforced)</span>
                  </h4>
                  <span className="text-[11px] text-white/50">
                    Auto-grouped from member registration locations
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {congregationUnits.map((hub) => {
                    const progressPercent = Math.min(100, Math.round((hub.total_members / 10) * 100));
                    return (
                      <div
                        key={hub.city}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          hub.is_congregation
                            ? 'bg-gradient-to-b from-[#002A4A] to-[#00172D] border-[#D4AF37]/60 shadow-md'
                            : 'bg-[#001122]/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-white">{hub.city}</span>
                            {hub.is_congregation ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Official Congregation</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                                {10 - hub.total_members} more to reach 10
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                              <span className="text-[10px] text-white/50 block">Registered Believers</span>
                              <span className="font-bold text-white text-sm">{hub.total_members}</span>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 border border-white/5">
                              <span className="text-[10px] text-white/50 block">Active Streamers</span>
                              <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                {hub.active_streamers}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar to 10 believers */}
                          {!hub.is_congregation && (
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[10px] text-white/50 mb-1">
                                <span>Congregation Threshold</span>
                                <span>{hub.total_members}/10</span>
                              </div>
                              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#D4AF37] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {hub.is_congregation && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4AF37]">
                            <span className="font-semibold">Congregation Formed</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/20 font-bold">
                              Official
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Streaming Viewers Table */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-red-500" />
                    <span>Real-Time Live Service Viewers</span>
                  </h4>
                  <span className="text-[11px] text-white/50 font-mono">
                    Updated every 3 seconds
                  </span>
                </div>

                {streamViewers.length === 0 ? (
                  <div className="p-6 bg-[#001122]/60 rounded-xl text-center text-xs text-white/50">
                    No viewers currently connected. Viewers automatically populate when church members join the live sermon broadcast.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase">
                          <th className="pb-2">Believer Name</th>
                          <th className="pb-2">City Location Hub</th>
                          <th className="pb-2">Congregation Status</th>
                          <th className="pb-2">Connected At</th>
                          <th className="pb-2 text-right">Sanctuary Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {streamViewers.map((viewer, idx) => (
                          <tr key={`${viewer.user_id}_${idx}`} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 font-bold text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              <span>{viewer.user_name}</span>
                            </td>
                            <td className="py-2.5 text-white/80">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                                {viewer.city}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                ✓ Counted toward {viewer.city} congregation
                              </span>
                            </td>
                            <td className="py-2.5 text-white/50 font-mono text-[11px]">
                              {new Date(viewer.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Live Ingest
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: STORE & INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="space-y-4">
              {/* Inventory Control Header */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Store Inventory & Catalog</span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Real-time inventory levels, multi-currency pricing (USD & ZiG), and collection tracking.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search SKU / product..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[#001122] border border-white/15 rounded-xl text-xs text-white focus:border-[#D4AF37] outline-none w-44"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'Books', 'Kingdom Apparel', 'Conference Passes', 'Anointing Oil & Media'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      inventoryCategory === cat
                        ? 'bg-[#D4AF37] text-[#001F3F] font-bold'
                        : 'bg-[#001F3F] text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Inventory Table */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#00172e] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3">Product / Resource</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">USD Price</th>
                        <th className="p-3">ZiG Price</th>
                        <th className="p-3">Stock Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {filteredProducts.map(prod => (
                        <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 flex items-center gap-2.5">
                            <img src={prod.image_url} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                            <div>
                              <div className="font-bold text-white">{prod.name}</div>
                              <div className="text-[11px] text-white/50">{prod.author_or_brand || 'Gateway Resources'}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            ${prod.price_usd}
                          </td>
                          <td className="p-3 font-mono text-white/70">
                            {prod.price_zig} ZiG
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prod.in_stock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {prod.in_stock ? '✓ In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  prod.in_stock = !prod.in_stock;
                                  setProducts([...products]);
                                  confetti({ particleCount: 15 });
                                }}
                                className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all"
                              >
                                Toggle Stock
                              </button>

                              {/* 3-Dots Dropdown Menu for Item Options */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveProductMenuId(activeProductMenuId === prod.id ? null : prod.id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                  title="Item Options"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {activeProductMenuId === prod.id && (
                                  <div className="absolute right-0 top-8 z-50 w-48 bg-[#00172e] border border-[#D4AF37]/30 rounded-xl shadow-2xl p-1.5 space-y-1 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-white/10 truncate">
                                      {prod.name}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        prod.in_stock = !prod.in_stock;
                                        setProducts([...products]);
                                        setActiveProductMenuId(null);
                                        confetti({ particleCount: 15 });
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>{prod.in_stock ? 'Set Out of Stock' : 'Set In Stock'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`${prod.name} - $${prod.price_usd} / ${prod.price_zig} ZiG`);
                                        setActiveProductMenuId(null);
                                        setModerationMessage(`Copied details for ${prod.name}`);
                                        setTimeout(() => setModerationMessage(null), 2500);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <Copy className="w-3 h-3 text-[#D4AF37]" />
                                      <span>Copy Pricing & Info</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveProductMenuId(null);
                                        const confirmed = window.confirm(`Remove ${prod.name} from store catalog?`);
                                        if (confirmed) {
                                          const next = products.filter(p => p.id !== prod.id);
                                          setProducts(next);
                                          setModerationMessage(`Removed ${prod.name} from inventory`);
                                          setTimeout(() => setModerationMessage(null), 2500);
                                        }
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 border-t border-white/10"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-400" />
                                      <span>Remove Item</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: MEMBERS & ROLES */}
          {activeSection === 'members' && (
            <div className="space-y-4">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#D4AF37]">
                    Congregation & Ministry Personnel ({users.length})
                  </h3>
                  <p className="text-xs text-white/70">
                    Manage security access roles, cell group assignments, and verified covenant badges.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or role..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[#001122] border border-white/15 rounded-xl text-xs text-white focus:border-[#D4AF37] outline-none w-44 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadMembersExcel}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    title="Download Members as Excel CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#00172e] text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3">Member Profile</th>
                        <th className="p-3">Phone & ID</th>
                        <th className="p-3">Cell Group</th>
                        <th className="p-3">Current Role</th>
                        <th className="p-3 text-right">Assign Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 flex items-center gap-2.5">
                            <img src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} alt={u.full_name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1">
                                <span>{u.full_name}</span>
                                {u.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                              </div>
                              <span className="text-[10px] font-mono text-white/40">{u.member_id}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-white/70">
                            {u.phone}
                          </td>
                          <td className="p-3 text-white/70">
                                            {u.cell_group || 'Not assigned'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'super_admin' ? 'bg-[#D4AF37] text-[#001F3F]' :
                              u.role === 'developer' ? 'bg-purple-500/20 text-purple-300' :
                              u.role === 'moderator' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-white/10 text-white/70'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Role Selector */}
                              <select
                                value={u.role}
                                onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                                className="hidden sm:inline-block bg-[#001122] border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                              >
                                <option value="member">Member</option>
                                <option value="moderator">Pastor / Moderator</option>
                                <option value="developer">Developer</option>
                                <option value="super_admin">Super Admin</option>
                              </select>

                              {/* 3-Dots Dropdown Menu for Member Actions */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveMemberMenuId(activeMemberMenuId === u.id ? null : u.id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                  title="Member Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {activeMemberMenuId === u.id && (
                                  <div className="absolute right-0 top-8 z-50 w-52 bg-[#00172e] border border-[#D4AF37]/30 rounded-xl shadow-2xl p-1.5 space-y-1 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-white/10 truncate">
                                      {u.full_name}
                                    </div>
                                    <div className="px-2 py-0.5 text-[9px] font-mono text-[#D4AF37]">
                                      Assign Role:
                                    </div>
                                    {(['member', 'moderator', 'developer', 'super_admin'] as UserRole[]).map(r => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateRole(u.id, r);
                                          setActiveMemberMenuId(null);
                                        }}
                                        className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                          u.role === r ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/80 hover:bg-white/10'
                                        }`}
                                      >
                                        <span className="capitalize">{r === 'super_admin' ? 'Super Admin' : r === 'moderator' ? 'Pastor / Mod' : r}</span>
                                        {u.role === r && <Check className="w-3 h-3 text-[#D4AF37]" />}
                                      </button>
                                    ))}

                                    <div className="border-t border-white/10 my-1" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextStatus = !u.is_verified;
                                        StorageService.developerSetVerificationBadge(u.id, nextStatus, nextStatus ? 'blue' : 'none');
                                        const updatedUsers = users.map(user => {
                                          if (user.id === u.id) {
                                            return { ...user, is_verified: nextStatus };
                                          }
                                          return user;
                                        });
                                        setUsers(updatedUsers);
                                        setActiveMemberMenuId(null);
                                        setModerationMessage(`Updated verification for ${u.full_name}`);
                                        setTimeout(() => setModerationMessage(null), 2500);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <BadgeCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                                      <span>{u.is_verified ? 'Remove Verified Badge' : 'Grant Verified Badge'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.member_id || u.id);
                                        setActiveMemberMenuId(null);
                                        setModerationMessage(`Copied Member ID for ${u.full_name}`);
                                        setTimeout(() => setModerationMessage(null), 2500);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-white/60" />
                                      <span>Copy Member ID</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.phone);
                                        setActiveMemberMenuId(null);
                                        setModerationMessage(`Copied Phone for ${u.full_name}`);
                                        setTimeout(() => setModerationMessage(null), 2500);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-white/60" />
                                      <span>Copy Phone Number</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: CONGREGATION STREAMERS & ATTENDEES REGISTRY */}
          {activeSection === 'stream_attendees' && (
            <div className="space-y-4">
              {/* Header & Export */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Congregation Streamers & Attendees Registry</span>
                  </h3>
                  <p className="text-xs text-white/70">
                    Real-time and historic record of members streaming sermons, their city locations, and phone contact details for database retention and pastoral follow-up.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadStreamAttendeesExcel}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-[#001F3F] text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    title="Download attendees as Excel CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportStreamAttendees}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                    title="Copy CSV to clipboard buffer"
                  >
                    {copiedAttendeeData ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{copiedAttendeeData ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#001F3F] border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-white/50 block">Total Logged Streamers</span>
                  <span className="text-lg font-bold text-white">{streamAttendees.length}</span>
                </div>
                <div className="bg-[#001F3F] border border-blue-500/30 rounded-xl p-3">
                  <span className="text-[11px] text-blue-400 block">Active Streaming Now</span>
                  <span className="text-lg font-bold text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{streamViewers.length}</span>
                  </span>
                </div>
                <div className="bg-[#001F3F] border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-[#D4AF37] block">Congregation Hubs Formed</span>
                  <span className="text-lg font-bold text-[#D4AF37]">
                    {congregationUnits.filter(c => c.is_congregation).length}
                  </span>
                </div>
                <div className="bg-[#001F3F] border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-emerald-400 block">Cities Represented</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {new Set(streamAttendees.map(a => a.city)).size}
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    placeholder="Search by name, phone, or handle..."
                    className="w-full bg-[#00172e] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-white/50 shrink-0">Filter City:</span>
                  <select
                    value={attendeeCityFilter}
                    onChange={(e) => setAttendeeCityFilter(e.target.value)}
                    className="bg-[#00172e] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-[#D4AF37] font-semibold focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="All">All Cities ({streamAttendees.length})</option>
                    {SUPPORTED_CITIES.map(city => (
                      <option key={city} value={city}>
                        {city} ({streamAttendees.filter(a => a.city === city).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendees List Table */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3 bg-[#00172e] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-white">Stream Attendees Contact & Location Database</span>
                  </div>
                  <span className="text-[10px] text-white/50">
                    Recorded for congregation tracking & future follow-up
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#001122] text-white/50 border-b border-white/10">
                        <th className="p-3">Believer / Attendee</th>
                        <th className="p-3">Phone Contact</th>
                        <th className="p-3">Location / City Hub</th>
                        <th className="p-3">Session & Time</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Pastoral Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {streamAttendees
                        .filter(a => {
                          const matchesCity = attendeeCityFilter === 'All' || a.city === attendeeCityFilter;
                          const q = attendeeSearch.toLowerCase().trim();
                          const matchesSearch = !q || 
                            a.user_name.toLowerCase().includes(q) || 
                            a.user_phone.includes(q) || 
                            a.user_handle.toLowerCase().includes(q);
                          return matchesCity && matchesSearch;
                        })
                        .map(att => {
                          const isCurrentlyLive = streamViewers.some(v => v.user_id === att.user_id);
                          const cleanPhone = att.user_phone.replace(/\D/g, '');
                          const waPhone = cleanPhone.startsWith('0') ? `263${cleanPhone.slice(1)}` : cleanPhone;

                          return (
                            <tr key={att.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-[11px] text-white">
                                    {att.user_name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="block">{att.user_name}</span>
                                    <span className="text-[10px] text-white/50 font-mono">{att.user_handle}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 font-mono text-white/90">
                                <a 
                                  href={`tel:${att.user_phone}`} 
                                  className="text-blue-300 hover:underline flex items-center gap-1"
                                >
                                  {att.user_phone}
                                </a>
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                                  {att.city}
                                </span>
                              </td>

                              <td className="p-3 text-white/70">
                                <span className="block text-[11px] text-white/90 truncate max-w-[180px]">{att.session_title}</span>
                                <span className="text-[10px] text-white/40">{new Date(att.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>

                              <td className="p-3">
                                {isCurrentlyLive ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Streaming Live</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/60">
                                    Completed
                                  </span>
                                )}
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={`https://wa.me/${waPhone}?text=Grace%20and%20peace%20beloved%2C%20thank%20you%20for%20fellowshipping%20with%20Gateway%20Church%20Zimbabwe!`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                                    title="Open WhatsApp chat with attendee"
                                  >
                                    <span>WhatsApp</span>
                                  </a>
                                  <a
                                    href={`tel:${att.user_phone}`}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all"
                                    title="Call attendee"
                                  >
                                    <span>Call</span>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: COMMUNITY POST CONTENT MODERATION */}
          {activeSection === 'content_moderation' && (
            <div className="space-y-4">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-[#00172e] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Community Post Content Moderation ({testimonies.length})</span>
                  </div>
                  <span className="text-[10px] text-white/50">
                    Direct deletion removes post immediately from the global community feed
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {testimonies.length === 0 ? (
                    <p className="p-4 text-xs text-white/40 italic">No community posts currently in feed.</p>
                  ) : (
                    testimonies.map(t => (
                      <div key={t.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-start gap-3">
                          <img src={t.user_avatar || '/assets/apostle_joe_daniels_main.jpg'} alt={t.user_name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{t.user_name}</span>
                              <span className="text-[10px] text-[#D4AF37] px-1.5 py-0.2 rounded bg-[#D4AF37]/10 font-semibold">
                                {t.category}
                              </span>
                              {t.scripture_tag && (
                                <span className="text-[10px] text-white/50 font-mono">
                                  {t.scripture_tag}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-white/90 mt-0.5">{t.title}</h4>
                            <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5">{t.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteCommunityPost(t.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                            title="Delete this post from community feed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Post</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: PUSH BROADCASTS */}
          {activeSection === 'push' && (
            <div className="space-y-4">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span>Push Broadcast Notification Center</span>
                </h3>

                <form onSubmit={handleSendPush} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Notification Headline
                      </label>
                      <input
                        type="text"
                        value={pushTitle}
                        onChange={e => setPushTitle(e.target.value)}
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Audience Target Segment
                      </label>
                      <select
                        value={pushSegment}
                        onChange={e => setPushSegment(e.target.value as any)}
                        className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4AF37] outline-none"
                      >
                        <option value="All Members">All Members (Global)</option>
                        <option value="Harare Province">Harare Province & Zimbabwe Hubs</option>
                        <option value="Diaspora Network">UK, USA & Global Diaspora</option>
                        <option value="Youth OnFire">Youth Ignite & Campus</option>
                        <option value="Ministry Partners">Covenant Seed Partners</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Message Content
                    </label>
                    <textarea
                      rows={2}
                      value={pushMessage}
                      onChange={e => setPushMessage(e.target.value)}
                      className="w-full bg-[#001122] border border-white/15 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2f] text-[#001F3F] font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Push Broadcast</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification History */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Sent Notifications Log ({notifications.length})
                </h4>
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="bg-[#001122]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{n.title}</div>
                        <p className="text-[11px] text-white/70">{n.body}</p>
                        <span className="text-[10px] text-[#D4AF37]">Segment: {n.target_segment}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{new Date(n.sent_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: ALTAR PRAYER PETITIONS */}
          {activeSection === 'prayers' && (
            <div className="space-y-3">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#D4AF37]">Altar Prayer Petitions ({prayers.length})</h3>
                  <p className="text-xs text-white/70">Review congregation burdens and issue apostolic decrees.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {prayers.map(p => (
                  <div key={p.id} className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{p.is_anonymous ? 'Anonymous Partner' : p.user_name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                          {p.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-white/80 bg-[#001122] p-3 rounded-xl border border-white/5">
                      "{p.request_text}"
                    </p>

                    {p.apostle_notes ? (
                      <div className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 p-2.5 rounded-xl border border-[#D4AF37]/30">
                        <strong>Decreed:</strong> {p.apostle_notes}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActivePrayerDecree(p)}
                        className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply Prophetic Decree</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: FINANCES & CATHEDRAL PROJECT */}
          {activeSection === 'finances' && (
            <div className="space-y-4">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Cathedral Foundation & Kingdom Seed Auditing</span>
                </h3>

                <div className="bg-[#001122] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Gateway Cathedral Project (Phase 2):</span>
                    <span className="font-bold text-[#D4AF37]">78% Funded ($390,000 / $500,000)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-[#D4AF37] h-full rounded-full w-[78%]"></div>
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Audited Contributions Log ({donations.length})
                </h4>
                <div className="space-y-2">
                  {donations.map(d => (
                    <div key={d.id} className="bg-[#001122]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{d.is_anonymous ? 'Anonymous Seed' : d.donor_name}</div>
                        <div className="text-[11px] text-white/60">{d.fund_type} • {d.payment_method}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">
                          {d.currency === 'USD' ? `$${d.amount}` : `${d.amount} ${d.currency}`}
                        </div>
                        <span className="text-[10px] text-white/40">{d.receipt_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: JOE VIBES */}
          {activeSection === 'vibes' && (
            <div className="space-y-3">
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-[#D4AF37]">Gospel Music Submissions ({joeVibes.length})</h3>
                <p className="text-xs text-white/70">Review tracks for Youth Ignite & Sunday Service rotation.</p>
              </div>

              <div className="space-y-2">
                {joeVibes.map(v => (
                  <div key={v.id} className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{v.song_title}</span>
                        <span className="text-white/60 ml-2">by {v.artist_name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">
                        {v.genre}
                      </span>
                    </div>
                    <audio controls src={v.audio_url} className="w-full h-8" />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-white/40">Status: {v.status}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateJoeVibes(v.id, 'approved')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateJoeVibes(v.id, 'featured')}
                          className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-[11px]"
                        >
                          Feature on Radio
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ADD PRODUCT TO INVENTORY */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#D4AF37]">Add Store Resource / Product</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="e.g. Prophetic Dimensions Hardcover"
                  className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value as any)}
                    className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Books">Books</option>
                    <option value="Kingdom Apparel">Kingdom Apparel</option>
                    <option value="Conference Passes">Conference Passes</option>
                    <option value="Anointing Oil & Media">Anointing Oil & Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">Price USD ($)</label>
                  <input
                    type="number"
                    value={newProdPriceUsd}
                    onChange={e => setNewProdPriceUsd(Number(e.target.value))}
                    className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Price ZiG</label>
                <input
                  type="number"
                  value={newProdPriceZig}
                  onChange={e => setNewProdPriceZig(Number(e.target.value))}
                  className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Product Image</label>
                <select
                  value={newProdImage}
                  onChange={e => setNewProdImage(e.target.value)}
                  className="w-full bg-[#001122] border border-white/15 rounded-xl px-3 py-2 text-xs text-white mb-1.5"
                >
                  <option value="/assets/apostle_joe_daniels_main.jpg">Apostle Daniels Cover (Portrait)</option>
                  <option value="/assets/apostle_joe_daniels_grad.jpg">Apostle Daniels Gown (Academic)</option>
                  <option value="/assets/apostle_joe_daniels_preach.jpg">Preaching Artwork</option>
                  <option value="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80">Book Cover Image</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] text-xs font-bold"
                >
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROPHETIC DECREE */}
      {activePrayerDecree && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#D4AF37]">Apostolic Decree on Altar Petition</h3>
              <button onClick={() => setActivePrayerDecree(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/80 bg-[#001122] p-3 rounded-xl border border-white/5">
              "{activePrayerDecree.request_text}"
            </p>

            <form onSubmit={handleApplyPrayerDecree} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Prophetic Decree Message</label>
                <textarea
                  rows={3}
                  value={decreeNote}
                  onChange={e => setDecreeNote(e.target.value)}
                  className="w-full bg-[#001122] border border-white/15 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePrayerDecree(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] text-xs font-bold"
                >
                  Confirm Decree
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
