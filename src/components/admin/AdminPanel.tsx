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
  ShieldAlert
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
  ServiceBooking
} from '../../types';
import { StorageService } from '../../services/storageService';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshAppState: () => void;
}

type AdminSection = 'overview' | 'broadcast' | 'inventory' | 'members' | 'prayers' | 'push' | 'finances' | 'vibes';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefreshAppState }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  
  // App data states
  const [users, setUsers] = useState<User[]>(StorageService.getAllUsers());
  const [sermons, setSermons] = useState<Sermon[]>(StorageService.getSermons());
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [donations, setDonations] = useState<Donation[]>(StorageService.getDonations());
  const [prayers, setPrayers] = useState<PrayerRequest[]>(StorageService.getPrayerRequests());
  const [events, setEvents] = useState<ChurchEvent[]>(StorageService.getEvents());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [joeVibes, setJoeVibes] = useState<JoeVibesSubmission[]>(StorageService.getJoeVibes());
  const [notifications, setNotifications] = useState<PushNotification[]>(StorageService.getPushNotifications());

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
    <div className="fixed inset-0 z-50 bg-[#001122]/95 backdrop-blur-md flex flex-col text-white font-sans overflow-hidden">
      
      {/* 1. TOP ERP-STYLE HEADER */}
      <header className="bg-[#001F3F] border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
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
                ERP v2.6 • Stocky Core
              </span>
            </div>
            <p className="text-[11px] text-white/60">
              Ministry Operations, Stream Ingest, Inventory & Member Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <button
            id="btn-close-admin-panel"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. BODY WITH SIDEBAR NAVIGATION + MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Desktop) / TOP TABS (Mobile) */}
        <aside className="w-full md:w-56 bg-[#00172e] border-b md:border-b-0 md:border-r border-white/10 shrink-0 flex md:flex-col overflow-x-auto md:overflow-y-auto p-2 gap-1">
          <div className="hidden md:block px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Management Modules
          </div>

          {[
            { id: 'overview', label: 'Dashboard KPI', icon: Activity, badge: null },
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
                    ? 'bg-[#D4AF37] text-[#001F3F] font-bold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
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

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#001122]">
          
          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Registered Members</span>
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="text-xl font-bold text-white">{users.length}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <span>↑ +18% this month</span>
                  </div>
                </div>

                <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Live Broadcast Views</span>
                    <Radio className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-white">14,200</div>
                  <div className="text-[11px] text-[#D4AF37] mt-1">
                    <span>YouTube Ingest: Active</span>
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
                  <div className="text-[11px] text-emerald-400 mt-1">
                    <span>Stock Level: Healthy</span>
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
                      Instantly push today's sermon scripture to all connected congregation devices in real-time.
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
                    <span>{pulpitSyncStatus} — Broadcasted to active members!</span>
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
                    Broadcast Ready
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
                  </div>

                  {/* Live Embed Preview */}
                  <div className="bg-[#001122] rounded-xl p-3 border border-white/10">
                    <span className="text-[11px] font-bold text-white/60 block mb-2">Live Stream Embed Preview:</span>
                    <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-white/10">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(sermonYoutubeInput) || 'Tde5rGafeBE'}`}
                        title="Live Stream Preview"
                        className="w-full h-full"
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
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Active Sermon Archive ({sermons.length})
                </h4>
                <div className="space-y-2">
                  {sermons.map(s => (
                    <div key={s.id} className="bg-[#001122]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img src={s.thumbnail_url} alt={s.title} className="w-14 h-10 rounded-lg object-cover border border-white/10 shrink-0" />
                        <div>
                          <div className="font-bold text-white">{s.title}</div>
                          <div className="text-[11px] text-white/60">{s.series} • {s.speaker} • {s.date}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#D4AF37] px-2 py-1 rounded bg-[#D4AF37]/10">
                        {s.youtube_id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: STOCKY-STYLE STORE & INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="space-y-4">
              {/* Inventory Control Header */}
              <div className="bg-[#001F3F] border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#D4AF37] flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Stocky Store Inventory & Catalog</span>
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

              {/* Inventory Table (Stocky Style) */}
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
                            <button
                              onClick={() => {
                                prod.in_stock = !prod.in_stock;
                                setProducts([...products]);
                                confetti({ particleCount: 15 });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-all"
                            >
                              Toggle Stock
                            </button>
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

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or role..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[#001122] border border-white/15 rounded-xl text-xs text-white focus:border-[#D4AF37] outline-none w-56"
                  />
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
                            {u.cell_group || 'Harare Central'}
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
                            <select
                              value={u.role}
                              onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                              className="bg-[#001122] border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Pastor / Moderator</option>
                              <option value="developer">Developer</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      <span>Send Instant Push</span>
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
                  <option value="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80">Book Mockup</option>
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
