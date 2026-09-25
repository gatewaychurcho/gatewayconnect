import React, { useState, useEffect, useRef } from 'react';
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
  BadgeCheck,
  Crown,
  Ban,
  KeyRound,
  Shield,
  RotateCcw,
  Lock,
  UploadCloud,
  Headphones,
  Film,
  Camera,
  Image as ImageIcon
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
  SUPPORTED_CITIES,
  UnbanAppeal
} from '../../types';
import { StorageService } from '../../services/storageService';
import { StorageBucketService } from '../../services/StorageBucketService';
import { LocalMediaStore } from '../../services/localMediaStore';
import { FacebookStreamPlayer } from '../common/FacebookStreamPlayer';
import { downloadCsvForExcel } from '../../utils/exportUtils';
import { AdminCyberBackground } from './AdminCyberBackground';
import { LocalImagePicker } from '../common/LocalImagePicker';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshAppState: () => void;
}

type AdminSection = 'overview' | 'congregations' | 'stream_attendees' | 'broadcast' | 'content_moderation' | 'inventory' | 'members' | 'prayers' | 'push' | 'finances' | 'vibes' | 'media_library';

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
  const [isUploadingMp4, setIsUploadingMp4] = useState<boolean>(false);
  const [mp4UploadFeedback, setMp4UploadFeedback] = useState<string | null>(null);
  const congregationMp4InputRef = useRef<HTMLInputElement>(null);

  // Avatars and Thumbnails Library Management States
  const [adminAvatars, setAdminAvatars] = useState(() => StorageService.getAdminAvatarLibrary());
  const [adminThumbnails, setAdminThumbnails] = useState(() => StorageService.getAdminThumbnailLibrary());
  const [mediaLibraryTab, setMediaLibraryTab] = useState<'avatars' | 'thumbnails'>('avatars');
  const [newMediaTitle, setNewMediaTitle] = useState<string>('');
  const [newMediaCategory, setNewMediaCategory] = useState<string>('Official');
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [donations, setDonations] = useState<Donation[]>(StorageService.getDonations());
  const [prayers, setPrayers] = useState<PrayerRequest[]>(StorageService.getPrayerRequests());
  const [events, setEvents] = useState<ChurchEvent[]>(StorageService.getEvents());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [joeVibes, setJoeVibes] = useState<JoeVibesSubmission[]>(StorageService.getJoeVibes());
  const [notifications, setNotifications] = useState<PushNotification[]>(StorageService.getPushNotifications());

  // Content Moderation States & Live Event Subscriptions
  const [testimonies, setTestimonies] = useState<Testimony[]>(StorageService.getTestimonies());
  const [moderationMessage, setModerationMessage] = useState<string | null>(null);

  // Real-time Moderation & Godmode States
  const [bannedUsersMap, setBannedUsersMap] = useState<Record<string, { banned_at: string; reason: string }>>(() => StorageService.getBannedUsers());
  const [unbanAppeals, setUnbanAppeals] = useState<UnbanAppeal[]>(() => StorageService.getUnbanAppeals());
  const [godmodeSearch, setGodmodeSearch] = useState<string>('');
  const [banTargetPhone, setBanTargetPhone] = useState<string>('');
  const [banTargetReason, setBanTargetReason] = useState<string>('Violation of Community Guidelines');
  const [editPasswordUser, setEditPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // Live real-time event listeners for Admin Panel
  useEffect(() => {
    const refreshAdminData = () => {
      setUsers(StorageService.getAllUsers());
      setBannedUsersMap(StorageService.getBannedUsers());
      setUnbanAppeals(StorageService.getUnbanAppeals());
      setDonations(StorageService.getDonations());
      setCongregationUnits(StorageService.getCongregationUnits());
      setStreamViewers(StorageService.getStreamViewers());
      setStreamAttendees(StorageService.getStreamAttendanceHistory());
      setLiveSermonStatus(StorageService.getLiveSermonStatus());
      setAdminStreamUrl(StorageService.getLiveStreamUrl());
    };

    window.addEventListener('gcz_user_profile_updated', refreshAdminData);
    window.addEventListener('gcz_user_registered', refreshAdminData);
    window.addEventListener('gcz_users_synced', refreshAdminData);
    window.addEventListener('gcz_banned_users_updated', refreshAdminData);
    window.addEventListener('gcz_donations_updated', refreshAdminData);
    window.addEventListener('gcz_donation_updated', refreshAdminData);
    window.addEventListener('gcz_live_state_updated', refreshAdminData);
    window.addEventListener('gcz_live_event_received', refreshAdminData);
    window.addEventListener('gcz_stream_viewers_updated', refreshAdminData);
    window.addEventListener('gcz_stream_attendance_updated', refreshAdminData);
    window.addEventListener('gcz_stream_viewer_joined', refreshAdminData);
    window.addEventListener('gcz_stream_viewer_left', refreshAdminData);
    window.addEventListener('gcz_live_status_updated', refreshAdminData);
    window.addEventListener('gcz_stream_url_updated', refreshAdminData);
    window.addEventListener('gcz_override_video_updated', refreshAdminData);

    return () => {
      window.removeEventListener('gcz_user_profile_updated', refreshAdminData);
      window.removeEventListener('gcz_user_registered', refreshAdminData);
      window.removeEventListener('gcz_users_synced', refreshAdminData);
      window.removeEventListener('gcz_banned_users_updated', refreshAdminData);
      window.removeEventListener('gcz_donations_updated', refreshAdminData);
      window.removeEventListener('gcz_donation_updated', refreshAdminData);
      window.removeEventListener('gcz_live_state_updated', refreshAdminData);
      window.removeEventListener('gcz_live_event_received', refreshAdminData);
      window.removeEventListener('gcz_stream_viewers_updated', refreshAdminData);
      window.removeEventListener('gcz_stream_attendance_updated', refreshAdminData);
      window.removeEventListener('gcz_stream_viewer_joined', refreshAdminData);
      window.removeEventListener('gcz_stream_viewer_left', refreshAdminData);
      window.removeEventListener('gcz_live_status_updated', refreshAdminData);
      window.removeEventListener('gcz_stream_url_updated', refreshAdminData);
      window.removeEventListener('gcz_override_video_updated', refreshAdminData);
    };
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All');
  
  // Sermon & Local Archive Management Form
  const [sermonUploadMode, setSermonUploadMode] = useState<'local' | 'youtube'>('local');
  const [localMediaType, setLocalMediaType] = useState<'audio' | 'video'>('audio');
  const [localMediaFileUrl, setLocalMediaFileUrl] = useState<string>('');
  const [localMediaFileName, setLocalMediaFileName] = useState<string>('');
  const [localMediaFileSize, setLocalMediaFileSize] = useState<string>('');
  const [localMediaDuration, setLocalMediaDuration] = useState<string>('55m');
  const [sermonSpeaker, setSermonSpeaker] = useState<string>('Apostle Joe Daniels');
  const [sermonDate, setSermonDate] = useState<string>(() => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const [sermonTitle, setSermonTitle] = useState<string>('Apostolic Impartation & Supernatural Breakthrough');
  const [sermonSeries, setSermonSeries] = useState<string>('Prophetic Dimensions 2026');
  const [sermonYoutubeInput, setSermonYoutubeInput] = useState<string>('https://youtu.be/Tde5rGafeBE');
  const [sermonScripture, setSermonScripture] = useState<string>('1 Kings 18:46');
  const [sermonDesc, setSermonDesc] = useState<string>('When divine acceleration rests upon you, obstacles turn into testimonies.');
  const [sermonThumbnail, setSermonThumbnail] = useState<string>('/assets/apostle_joe_daniels_preach.jpg');
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [isSavingMedia, setIsSavingMedia] = useState<boolean>(false);
  const [previewingSermon, setPreviewingSermon] = useState<Sermon | null>(null);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const sermonMediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const sermonCustomThumbnailRef = useRef<HTMLInputElement | null>(null);

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

  const handleAssignBadge = (userId: string, badgeType: 'none' | 'silver' | 'blue' | 'gold') => {
    const isVerified = badgeType !== 'none';
    StorageService.developerSetVerificationBadge(userId, isVerified, badgeType);
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
    const badgeLabel = badgeType === 'silver' ? 'Silver (VIP Member)' : badgeType === 'blue' ? 'Blue (Pastor / Moderator)' : badgeType === 'gold' ? 'Gold (Super Admin)' : 'No Badge';
    setModerationMessage(`Assigned ${badgeLabel} badge`);
    setTimeout(() => setModerationMessage(null), 2500);
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

  // Congregation Live Stream Local MP4 File Upload
  const handleUploadLocalMp4 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name)) {
      setMp4UploadFeedback('Please select a valid MP4 or video file.');
      setTimeout(() => setMp4UploadFeedback(null), 4000);
      return;
    }

    setIsUploadingMp4(true);
    setMp4UploadFeedback(`Processing ${file.name}...`);
    try {
      let videoUrl: string | null = null;
      try {
        videoUrl = await StorageBucketService.uploadFileToMediaBucket(file, 'media');
      } catch (err) {
        console.warn('Storage bucket video upload fallback:', err);
      }

      if (!videoUrl) {
        try {
          const mediaId = `stream_mp4_${Date.now()}`;
          await LocalMediaStore.saveMedia(mediaId, file);
          videoUrl = URL.createObjectURL(file);
        } catch {
          videoUrl = URL.createObjectURL(file);
        }
      }

      setAdminStreamUrl(videoUrl);
      setShowAdminStreamPreview(true);
      StorageService.setLiveStreamUrl(videoUrl);
      const newStatus = {
        ...liveSermonStatus,
        streamUrl: videoUrl,
        isLive: true,
        title: sermonTitle || `${file.name.replace(/\.[^/.]+$/, '')} • Sanctuary Live Stream`
      };
      StorageService.setLiveSermonStatus(newStatus);
      setLiveSermonStatus(newStatus);
      StorageService.setOverridePlayingVideo({
        id: `stream_${Date.now()}`,
        title: newStatus.title,
        youtube_id: videoUrl
      });
      setMp4UploadFeedback(`✓ Local MP4 active & broadcasting: ${file.name}`);
      confetti({ particleCount: 30, spread: 60 });
      onRefreshAppState();
    } catch (err: any) {
      setMp4UploadFeedback(`Upload failed: ${err.message || 'Error loading video'}`);
    } finally {
      setIsUploadingMp4(false);
      setTimeout(() => setMp4UploadFeedback(null), 5000);
    }
  };

  // Admin Avatar & Thumbnail Library Handlers
  const handleUploadMediaItem = async (e: React.ChangeEvent<HTMLInputElement>, category: 'avatar' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMediaUploadError('Please select a valid image file (PNG, JPG, WebP).');
      setTimeout(() => setMediaUploadError(null), 4000);
      return;
    }

    setMediaUploadError(null);
    setMediaUploadSuccess(`Uploading ${file.name}...`);
    try {
      let imageUrl: string | null = null;
      try {
        imageUrl = await StorageBucketService.uploadFileToMediaBucket(file, category === 'avatar' ? 'avatars' : 'media');
      } catch (err) {
        console.warn('Bucket upload note:', err);
      }

      if (!imageUrl) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      if (!imageUrl) throw new Error('Could not read image file');

      const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      const title = newMediaTitle.trim() || file.name.replace(/\.[^/.]+$/, '');

      if (category === 'avatar') {
        const created = StorageService.addAdminAvatar({
          name: title,
          url: imageUrl,
          size: sizeStr
        });
        setAdminAvatars(StorageService.getAdminAvatarLibrary());
        setMediaUploadSuccess(`✓ Added "${created.name}" to Avatars Library!`);
      } else {
        const created = StorageService.addAdminThumbnail({
          name: title,
          url: imageUrl,
          size: sizeStr
        });
        setAdminThumbnails(StorageService.getAdminThumbnailLibrary());
        setMediaUploadSuccess(`✓ Added "${created.name}" to Thumbnails Library!`);
      }

      setNewMediaTitle('');
      confetti({ particleCount: 25, spread: 50 });
    } catch (err: any) {
      setMediaUploadError(err.message || 'Failed to upload image to library');
    } finally {
      setTimeout(() => {
        setMediaUploadSuccess(null);
        setMediaUploadError(null);
      }, 4000);
    }
  };

  const handleLocalMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    if (!isAudio && !isVideo) {
      setModerationMessage('Please select a valid audio (MP3, M4A, WAV) or video (MP4, WebM, MOV) file.');
      return;
    }

    setSelectedMediaFile(file);
    setLocalMediaType(isVideo ? 'video' : 'audio');
    setLocalMediaFileName(file.name);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setLocalMediaFileSize(`${sizeMB} MB`);

    // Clean up previous blob URL if any
    if (localMediaFileUrl && localMediaFileUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(localMediaFileUrl); } catch {}
    }

    // Instant zero-copy object URL preview
    const objectUrl = URL.createObjectURL(file);
    setLocalMediaFileUrl(objectUrl);

    // Auto-detect duration using browser media element
    if (isVideo) {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        const mins = Math.floor(vid.duration / 60);
        const secs = Math.floor(vid.duration % 60);
        setLocalMediaDuration(mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m ${secs}s`);
      };
      vid.src = objectUrl;
    } else {
      const aud = document.createElement('audio');
      aud.preload = 'metadata';
      aud.onloadedmetadata = () => {
        const mins = Math.floor(aud.duration / 60);
        const secs = Math.floor(aud.duration % 60);
        setLocalMediaDuration(mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m ${secs}s`);
      };
      aud.src = objectUrl;
    }

    // Auto-update title if default
    if (sermonTitle === 'Apostolic Impartation & Supernatural Breakthrough' || !sermonTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setSermonTitle(cleanName);
    }
    e.target.value = '';
  };

  const handleCustomThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bucketUrl = await StorageBucketService.uploadFileToMediaBucket(file, 'media');
      if (bucketUrl) {
        setSermonThumbnail(bucketUrl);
        setModerationMessage('Custom sermon cover uploaded to cloud bucket!');
        e.target.value = '';
        return;
      }
    } catch (err) {
      console.warn('Storage bucket sermon thumbnail upload notice:', err);
    }

    try {
      // Compress thumbnail so it safely stays under 150KB for fast local/cloud sync
      const compressedDataUrl = await LocalMediaStore.compressImage(file, 900, 0.85);
      setSermonThumbnail(compressedDataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSermonThumbnail(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePublishSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle.trim()) {
      setModerationMessage('Please enter a sermon title.');
      return;
    }
    if (sermonUploadMode === 'local' && !selectedMediaFile && !localMediaFileUrl) {
      setModerationMessage('Please select an audio or video file from your device to upload.');
      return;
    }

    setIsSavingMedia(true);
    try {
      const sermonId = `sermon_${Date.now()}`;
      let finalVideoUrl: string | undefined = undefined;
      let finalAudioUrl: string | undefined = undefined;

      if (sermonUploadMode === 'local') {
        if (selectedMediaFile) {
          // 1. Upload to Supabase 'media' bucket first for cloud persistence
          try {
            const bucketUrl = await StorageBucketService.uploadFileToMediaBucket(selectedMediaFile, 'media');
            if (bucketUrl) {
              if (localMediaType === 'video') finalVideoUrl = bucketUrl;
              else finalAudioUrl = bucketUrl;
              console.log('Sermon media successfully uploaded to Supabase storage bucket:', bucketUrl);
            }
          } catch (e) {
            console.warn('Storage bucket sermon upload notice:', e);
          }

          // 2. Persist in high-capacity local IndexedDB store as fallback
          if (!finalVideoUrl && !finalAudioUrl) {
            const blobUrl = await LocalMediaStore.saveSermonMedia(sermonId, selectedMediaFile, {
              name: sermonTitle.trim(),
              type: selectedMediaFile.type,
              size: selectedMediaFile.size,
              duration: localMediaDuration.trim()
            });

            if (localMediaType === 'video') {
              finalVideoUrl = blobUrl;
            } else {
              finalAudioUrl = blobUrl;
            }
          }
        } else if (localMediaFileUrl) {
          if (localMediaType === 'video') finalVideoUrl = localMediaFileUrl;
          else finalAudioUrl = localMediaFileUrl;
        }
      }

      const yId = sermonUploadMode === 'youtube' ? (extractYoutubeId(sermonYoutubeInput) || 'Tde5rGafeBE') : '';
      const newSermon: Sermon = {
        id: sermonId,
        title: sermonTitle.trim(),
        speaker: sermonSpeaker.trim() || 'Apostle Joe Daniels',
        date: sermonDate || 'Today',
        series: sermonSeries.trim() || 'Apostolic Archive',
        duration: localMediaDuration.trim() || '45m',
        youtube_id: yId,
        video_url: finalVideoUrl,
        audio_url: finalAudioUrl,
        thumbnail_url: sermonThumbnail || '/assets/apostle_joe_daniels_preach.jpg',
        scriptures: [sermonScripture.trim() || '1 Kings 18:46'],
        description: sermonDesc.trim() || 'Apostolic archive message from Gateway Church Zimbabwe.',
        view_count: 1,
        is_live: sermonUploadMode === 'youtube'
      };

      StorageService.addSermon(newSermon);
      setSermons(StorageService.getSermons());
      onRefreshAppState();
      confetti({ particleCount: 35, spread: 70 });
      
      // Reset file upload state
      setSelectedMediaFile(null);
      setLocalMediaFileUrl('');
      setLocalMediaFileName('');
      setLocalMediaFileSize('');
      setModerationMessage(`Message "${newSermon.title}" archived successfully to sanctuary library!`);
    } catch (err: any) {
      setModerationMessage(`Failed to save media: ${err?.message || err}`);
    } finally {
      setIsSavingMedia(false);
    }
  };

  const handleUpdateSermon = (sermon: Sermon) => {
    StorageService.updateSermon(sermon);
    setSermons(StorageService.getSermons());
    setEditingSermon(null);
    onRefreshAppState();
    setModerationMessage('Sermon archive updated.');
  };

  const handleDownloadSermonMedia = async (s: Sermon) => {
    try {
      const mediaUrl = s.video_url || s.audio_url;
      if (!mediaUrl) {
        setModerationMessage('No media file attached to this sermon.');
        return;
      }
      let downloadUrl = mediaUrl;
      if (mediaUrl.startsWith('indexeddb://')) {
        const key = mediaUrl.replace('indexeddb://', '');
        const blob = await LocalMediaStore.getSermonMediaBlob(key);
        if (blob) {
          downloadUrl = URL.createObjectURL(blob);
        }
      }
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${s.title.replace(/\s+/g, '_')}${s.video_url ? '.mp4' : '.mp3'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setModerationMessage(`Could not download sermon media: ${err?.message || err}`);
    }
  };

  const handleDeleteSermon = (sermonId: string) => {
    if (confirm('Are you sure you want to remove this sermon from the church archive?')) {
      StorageService.deleteSermon(sermonId);
      setSermons(StorageService.getSermons());
      onRefreshAppState();
    }
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

  const filteredGodmodeUsers = users.filter(u => 
    !godmodeSearch.trim() ||
    u.full_name.toLowerCase().includes(godmodeSearch.toLowerCase()) ||
    u.phone.includes(godmodeSearch) ||
    (u.handle && u.handle.toLowerCase().includes(godmodeSearch.toLowerCase())) ||
    (u.member_id && u.member_id.toLowerCase().includes(godmodeSearch.toLowerCase()))
  );

  const handleGodmodeImpersonate = (user: User) => {
    StorageService.setCurrentUser(user);
    onRefreshAppState();
    confetti({ particleCount: 30, spread: 60 });
    setModerationMessage(`Switched active session to ${user.full_name} (${user.phone}).`);
  };

  const handleGodmodeRoleChange = (userId: string, newRole: UserRole) => {
    StorageService.updateUserRole(userId, newRole);
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
    setModerationMessage(`Role updated to ${newRole.toUpperCase()}. Synced across real-time.`);
  };

  const handleGodmodeToggleBadge = (user: User) => {
    const nextStatus = !user.is_verified;
    StorageService.developerSetVerificationBadge(user.id, nextStatus, nextStatus ? 'blue' : 'none');
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
  };

  const handleGodmodeResetPassword = (user: User) => {
    const newPwd = prompt(`Enter new password for ${user.full_name} (${user.phone}):`, 'Gateway2026!');
    if (!newPwd || newPwd.trim().length < 4) return;
    const res = StorageService.changePassword(user.id, user.password || '', newPwd.trim());
    if (res.success) {
      setModerationMessage(`Password successfully updated to "${newPwd.trim()}" for ${user.full_name}.`);
      setUsers(StorageService.getAllUsers());
    } else {
      setModerationMessage(res.error || 'Failed to update password.');
    }
  };

  const handleEnforceBan = (phoneOrId: string, reason?: string) => {
    const target = phoneOrId.trim();
    if (!target) return;
    StorageService.banUser(target, reason || 'Administrative sanction by ministry.');
    setBannedUsersMap(StorageService.getBannedUsers());
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
    setBanTargetPhone('');
    setModerationMessage(`Account ${target} has been suspended and terminated across real-time.`);
  };

  const handleLiftBan = (phoneOrId: string) => {
    StorageService.unbanUser(phoneOrId);
    setBannedUsersMap(StorageService.getBannedUsers());
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
    setModerationMessage(`Suspension lifted for ${phoneOrId}. Account restored.`);
  };

  const handleApproveUnbanAppeal = (appealId: string, phone: string) => {
    StorageService.resolveUnbanAppeal(appealId, 'approved');
    setBannedUsersMap(StorageService.getBannedUsers());
    setUnbanAppeals(StorageService.getUnbanAppeals());
    setUsers(StorageService.getAllUsers());
    onRefreshAppState();
    setModerationMessage(`Appeal approved and account ${phone} restored.`);
  };

  const handleResetLedger = () => {
    if (window.confirm('Reset all donation and financial records to $0.00? This clears past ledgers for a clean start.')) {
      StorageService.resetFinancesToZero();
      setDonations([]);
      onRefreshAppState();
      confetti({ particleCount: 25, spread: 60 });
      setModerationMessage('Financial ledger successfully reset to $0.00 USD / 0 ZiG.');
    }
  };

  const filteredProducts = products.filter(p => 
    (inventoryCategory === 'All' || p.category === inventoryCategory) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUser = StorageService.getCurrentUser();
  const isSuperAdminOrDev = currentUser?.role === 'super_admin' || currentUser?.role === 'developer';

  if (!isSuperAdminOrDev) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
        <div className="bg-card border border-rose-500/40 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Admin Access Restricted</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Only accounts assigned as Super Admin by the Developer have access to the Admin Portal. Verification badges alone do not grant administrative privileges.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gcz-admin fixed inset-0 z-50 flex flex-col font-sans overflow-hidden isolate">
      
      {/* 0. CYBER-FUTURISTIC BACKGROUND (Matrix Streams strictly BEHIND everything in the background) */}
      <AdminCyberBackground enabled={showCyberBackground} />

      {/* 1. TOP ERP-STYLE HEADER */}
      <header className="relative z-20 bg-card/90 backdrop-blur-md border-b border-emerald-500/20 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <h1 className="font-bold text-xs sm:text-base text-primary tracking-wide truncate">
                Gateway Admin Center
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold border border-primary/30 shrink-0">
                Operations Console
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/60 truncate hidden sm:block">
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
              <div className="absolute right-0 top-11 z-50 w-56 bg-card border border-primary/30 rounded-2xl shadow-2xl p-2 space-y-1 font-sans animate-in fade-in zoom-in-95 duration-150">
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
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 flex items-center gap-2"
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

      <div className="relative z-20 hidden sm:flex items-center gap-4 px-4 py-1.5 bg-background/90 border-b border-white/5 text-[9px] font-mono uppercase tracking-wider text-white/50 shrink-0">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Admin Workspace Loaded
        </span>
        <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-300" />Broadcast: {liveSermonStatus.isLive ? 'Live' : 'Standby'}</span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-primary" />Data: {dataSourceLabel}</span>
        <span className="ml-auto text-primary/70">ADMIN / OPERATIONS</span>
      </div>

      {/* 2. BODY WITH SIDEBAR NAVIGATION + MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (Desktop) & MOBILE CONTROLS */}
        {/* Mobile View: Quick Dropdown selector & Scrollable Module Pills */}
        <div className="md:hidden bg-card border-b border-white/10 shrink-0">
          <div className="p-2.5 flex items-center justify-between gap-2 border-b border-white/5">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider font-mono">Module:</span>
            <div className="relative flex-1">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as AdminSection)}
                className="w-full bg-card border border-primary/40 rounded-xl px-3 py-1.5 text-xs text-primary font-bold appearance-none pr-8 focus:outline-none focus:border-primary"
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
                  { id: 'media_library', label: `🎨 Avatars & Thumbnails Library (${adminAvatars.length + adminThumbnails.length})` },
                ].map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-card text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-primary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Scrollable Module Pills */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-none bg-background">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'congregations', label: 'Hubs', icon: Tv },
              { id: 'stream_attendees', label: 'Streamers', icon: Users },
              { id: 'content_moderation', label: 'Moderation', icon: Trash2 },
              { id: 'broadcast', label: 'Live Pulpit', icon: Radio },
              { id: 'inventory', label: 'Store', icon: Package },
              { id: 'push', label: 'Push', icon: Bell },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'prayers', label: 'Prayers', icon: Heart },
              { id: 'finances', label: 'Finances', icon: DollarSign },
              { id: 'vibes', label: 'Vibes', icon: Music },
              { id: 'media_library', label: 'Avatars & Art', icon: ImageIcon },
            ].map(pill => {
              const Icon = pill.icon;
              const isActive = activeSection === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveSection(pill.id as AdminSection)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-56 bg-gradient-to-b from-card/95 to-background/95 border-r border-emerald-500/15 shrink-0 flex-col overflow-y-auto p-2 gap-1">
          <div className="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
            Management Modules
          </div>

          {[
            { id: 'overview', label: 'Dashboard KPI', icon: Activity, badge: null },
            { id: 'congregations', label: 'Congregations & Stream', icon: Tv, badge: `${congregationUnits.filter(c => c.is_congregation).length} Hubs` },
            { id: 'stream_attendees', label: 'Stream Attendees Log', icon: Users, badge: `${streamAttendees.length}` },
            { id: 'content_moderation', label: 'Post Moderation', icon: Trash2, badge: `${testimonies.length}` },
            { id: 'broadcast', label: 'Sermon & Live Stream', icon: Radio, badge: 'Live' },
            { id: 'media_library', label: 'Avatars & Thumbnails', icon: ImageIcon, badge: `${adminAvatars.length + adminThumbnails.length}` },
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
                    ? 'bg-gradient-to-r from-primary to-amber-500 text-primary-foreground font-bold shadow-[0_0_16px_rgba(212,175,55,0.2)]'
                    : 'text-white/70 hover:text-white hover:bg-emerald-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-2 ${
                    isActive ? 'bg-card/20 text-primary-foreground' : 'bg-white/10 text-white/70'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* MAIN WORKSPACE CONTENT - Cyber background streams purely behind all cards and content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/70 backdrop-blur-[2px]">
          
          {/* SECTION 1: DASHBOARD OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* Notification Banner if action was recently taken */}
              {moderationMessage && (
                <div className="p-3.5 bg-primary/15 border border-primary/40 rounded-2xl flex items-center justify-between text-xs text-primary font-semibold animate-in fade-in">
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
              <div className="bg-gradient-to-r from-card via-slate-900 to-card border-2 border-primary/50 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Lead Administrator & Moderation Hub</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase">
                          Ecclesiastical Hub
                        </span>
                      </h3>
                      <p className="text-[11px] text-white/60">
                        Pastoral control center for congregation live hubs, stream viewers registry, community post moderation, and altar services.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-primary">
                    {liveSermonStatus.isLive ? 'Broadcast Status: Live' : 'Broadcast Status: Standby'}
                  </span>
                </div>

                {/* 4 Feature Shortcut Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                  {/* Feature 1: Congregations & Streaming */}
                  <div 
                    onClick={() => setActiveSection('congregations')}
                    className="p-2.5 sm:p-3 rounded-xl bg-background/90 border border-primary/30 hover:border-primary/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-primary flex items-center gap-1 sm:gap-1.5">
                        <Tv className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Hubs</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                        {congregationUnits.filter(c => c.is_congregation).length}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/60 line-clamp-2 mb-1.5 sm:mb-2">
                      Groups active streamers by cities.
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                      <span>View Hubs</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 2: Streamers & Attendees Registry */}
                  <div 
                    onClick={() => setActiveSection('stream_attendees')}
                    className="p-2.5 sm:p-3 rounded-xl bg-background/90 border border-blue-500/30 hover:border-blue-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-blue-300 flex items-center gap-1 sm:gap-1.5">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Streamers</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
                        {streamAttendees.length}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/60 line-clamp-2 mb-1.5 sm:mb-2">
                      Streamer records, city, contact info.
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                      <span>Records</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 3: Community Content Moderation */}
                  <div 
                    onClick={() => setActiveSection('content_moderation')}
                    className="p-2.5 sm:p-3 rounded-xl bg-background/90 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 flex items-center gap-1 sm:gap-1.5">
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Moderation</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                        {testimonies.length}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/60 line-clamp-2 mb-1.5 sm:mb-2">
                      Moderate believers feed & delete posts.
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                      <span>Feed</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Feature 4: Broadcast & Pulpit Sync */}
                  <div 
                    onClick={() => setActiveSection('broadcast')}
                    className="p-2.5 sm:p-3 rounded-xl bg-background/90 border border-purple-500/30 hover:border-purple-500/60 cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-purple-300 flex items-center gap-1 sm:gap-1.5">
                        <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Broadcast</span>
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 shrink-0">
                        {liveSermonStatus.isLive ? 'Live' : 'Off'}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-white/60 line-clamp-2 mb-1.5 sm:mb-2">
                      Video stream & live scripture sync.
                    </p>
                    <span className="text-[10px] sm:text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                      <span>Pulpit</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-card border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Registered Members</span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-white">{users.length}</div>
                    <div className="text-[11px] text-white/60 mt-1 flex items-center gap-1">
                    <span>Current registered account count</span>
                  </div>
                </div>

                <div className="bg-card border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Live Broadcast Views</span>
                    <Radio className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-white">{streamViewers.length}</div>
                  <div className="text-[11px] text-primary mt-1">
                    <span>{liveSermonStatus.isLive ? 'Current live viewers' : 'No active broadcast'}</span>
                  </div>
                </div>

                <div className="bg-card border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Seed & Tithes</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">${totalGivingUsd.toLocaleString()}</div>
                  <div className="text-[11px] text-white/60 mt-1">
                    <span>+ {totalGivingZig.toLocaleString()} ZiG</span>
                  </div>
                </div>

                <div className="bg-card border border-white/10 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-white/60 mb-2 text-xs font-medium">
                    <span>Inventory Products</span>
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xl font-bold text-white">{products.length} Items</div>
                  <div className="text-[11px] text-white/60 mt-1">
                    <span>{availableInventoryCount} currently available</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Live Pulpit Sync Bar */}
              <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-primary flex items-center gap-2">
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
                      className="bg-background border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
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
                      className="w-14 bg-background border border-white/15 rounded-xl px-2 py-1.5 text-xs text-center text-white"
                      title="Chapter"
                    />
                    <span className="text-white/40">:</span>
                    <input
                      type="number"
                      value={pulpitVerse}
                      onChange={e => setPulpitVerse(Number(e.target.value))}
                      className="w-14 bg-background border border-white/15 rounded-xl px-2 py-1.5 text-xs text-center text-white"
                      title="Verse"
                    />
                    <button
                      onClick={handleSyncPulpitScripture}
                      className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
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
                <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <span>Recent Store Orders</span>
                    </h4>
                    <button
                      onClick={() => setActiveSection('inventory')}
                      className="text-[11px] text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {orders.slice(0, 3).map(ord => (
                      <div key={ord.id} className="bg-background/60 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{ord.user_name}</div>
                          <div className="text-[11px] text-white/60">{ord.items.length} items • ${ord.total_usd} via {ord.payment_method}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Prayer Requests */}
                <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span>Altar Prayer Petitions</span>
                    </h4>
                    <button
                      onClick={() => setActiveSection('prayers')}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Manage ({prayers.length})
                    </button>
                  </div>

                  <div className="space-y-2">
                    {prayers.slice(0, 3).map(p => (
                      <div key={p.id} className="bg-background/60 border border-white/5 rounded-xl p-2.5 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{p.is_anonymous ? 'Anonymous' : p.user_name}</span>
                          <span className="text-[10px] text-primary font-semibold">{p.category}</span>
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      <span>Sermons & Archive Message Publisher</span>
                    </h3>
                    <p className="text-xs text-white/70">
                      Upload sermons locally from your device (MP3 Audio or MP4 Video) or configure YouTube live stream broadcasts.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    {liveSermonStatus.isLive ? 'Broadcast Live' : 'Broadcast Standby'}
                  </span>
                </div>

                {/* Upload Mode Selector */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-background/80 border border-white/10 w-fit">
                  <button
                    type="button"
                    onClick={() => setSermonUploadMode('local')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      sermonUploadMode === 'local'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Local Device Upload (Audio / Video)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSermonUploadMode('youtube')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      sermonUploadMode === 'youtube'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>YouTube Ingest / Stream</span>
                  </button>
                </div>

                <form onSubmit={handlePublishSermon} className="space-y-4">
                  {/* LOCAL FILE UPLOAD DROPZONE */}
                  {sermonUploadMode === 'local' && (
                    <div className="p-4 rounded-xl bg-secondary/20 border-2 border-dashed border-primary/30 space-y-3">
                      <input
                        ref={sermonMediaFileInputRef}
                        type="file"
                        accept="audio/*,video/*"
                        onChange={handleLocalMediaUpload}
                        className="hidden"
                      />

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            {localMediaType === 'video' ? <Film className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">
                              {localMediaFileName ? localMediaFileName : 'Select Sermon Audio or Video File'}
                            </span>
                            <span className="text-[11px] text-white/60 block">
                              Supports MP3, M4A, WAV audio messages & MP4, WebM video files
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {localMediaFileUrl && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                              {localMediaType === 'video' ? 'Video File' : 'Audio Message'} • {localMediaFileSize}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => sermonMediaFileInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>{localMediaFileUrl ? 'Replace File' : 'Choose Local File'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive In-Form Preview */}
                      {localMediaFileUrl && (
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <span className="text-[11px] font-bold text-primary block">
                            Preview {localMediaType === 'video' ? 'Video' : 'Audio'} Player:
                          </span>
                          {localMediaType === 'video' ? (
                            <div className="aspect-video max-w-md rounded-xl overflow-hidden bg-black border border-white/10">
                              <video controls src={localMediaFileUrl} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <audio controls src={localMediaFileUrl} className="w-full h-10 accent-primary" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* METADATA FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Sermon / Message Title *
                      </label>
                      <input
                        type="text"
                        value={sermonTitle}
                        onChange={e => setSermonTitle(e.target.value)}
                        placeholder="e.g. The Mystery of Supernatural Acceleration"
                        required
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Sermon Series / Category
                      </label>
                      <input
                        type="text"
                        value={sermonSeries}
                        onChange={e => setSermonSeries(e.target.value)}
                        placeholder="e.g. Prophetic Dimensions 2026"
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Speaker / Preacher
                      </label>
                      <input
                        type="text"
                        value={sermonSpeaker}
                        onChange={e => setSermonSpeaker(e.target.value)}
                        placeholder="Apostle Joe Daniels"
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
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
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Recorded Date
                      </label>
                      <input
                        type="text"
                        value={sermonDate}
                        onChange={e => setSermonDate(e.target.value)}
                        placeholder="e.g. 15 Sep 2026"
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Message Duration
                      </label>
                      <input
                        type="text"
                        value={localMediaDuration}
                        onChange={e => setLocalMediaDuration(e.target.value)}
                        placeholder="e.g. 52m or 1h 15m"
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* YOUTUBE INPUT (Only in YouTube mode) */}
                  {sermonUploadMode === 'youtube' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-white/80 mb-1">
                          YouTube Stream or Video URL
                        </label>
                        <input
                          type="text"
                          value={sermonYoutubeInput}
                          onChange={e => setSermonYoutubeInput(e.target.value)}
                          placeholder="https://youtu.be/Tde5rGafeBE"
                          className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-primary outline-none"
                        />
                      </div>

                      {/* Live Embed Preview */}
                      <div className="bg-background rounded-xl p-3 border border-white/10">
                        <span className="text-[11px] font-bold text-white/60 block mb-2">Live Stream Embed Preview:</span>
                        <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-white/10">
                          <iframe
                            src={StorageService.getYoutubeEmbedUrl(extractYoutubeId(sermonYoutubeInput) || 'Tde5rGafeBE', false)}
                            title="Live Stream Preview"
                            className="w-full h-full"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* THUMBNAIL ARTWORK */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Thumbnail Artwork (Select Official Portrait or Upload from Device)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
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
                          className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all cursor-pointer ${
                            sermonThumbnail === item.url ? 'border-primary ring-2 ring-primary/50' : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 text-center font-bold">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    <input
                      ref={sermonCustomThumbnailRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomThumbnailUpload}
                      className="hidden"
                    />
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sermonCustomThumbnailRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-primary" />
                        <span>Upload Custom Cover Artwork</span>
                      </button>
                      {sermonThumbnail && !sermonThumbnail.startsWith('/assets') && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Custom artwork loaded
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Sermon Summary / Prophetic Notes
                    </label>
                    <textarea
                      rows={2}
                      value={sermonDesc}
                      onChange={e => setSermonDesc(e.target.value)}
                      placeholder="Brief summary of the sermon, prophetic decree, and altar call message..."
                      className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingMedia}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      {isSavingMedia ? (
                        <>
                          <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          <span>Saving to Device Vault...</span>
                        </>
                      ) : sermonUploadMode === 'local' ? (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Archive Local Message</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Publish & Go Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Sermons List */}
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Active Sermon Archive ({sermons.length})
                  </h4>
                  <span className="text-[11px] text-primary">
                    Tap any sermon to set as active featured playback
                  </span>
                </div>
                <div className="space-y-2">
                  {sermons.map(s => {
                    const isCurrentTop = extractYoutubeId(sermonYoutubeInput) === s.youtube_id;
                    return (
                      <div
                        key={s.id}
                        className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                          isCurrentTop
                            ? 'bg-card border-primary ring-1 ring-primary/50 shadow-md'
                            : 'bg-background/60 hover:bg-background border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                            {isCurrentTop && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-2 truncate">
                              <span className="truncate">{s.title}</span>
                              {s.audio_url && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                  <Headphones className="w-3 h-3" />
                                  Audio
                                </span>
                              )}
                              {s.video_url && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                  <Film className="w-3 h-3" />
                                  Video
                                </span>
                              )}
                              {s.youtube_id && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                  <Tv className="w-3 h-3" />
                                  YouTube
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/60 truncate">{s.series} • {s.speaker} • {s.date} ({s.duration})</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {/* Preview / In-Panel Player */}
                          {(s.video_url || s.audio_url) && (
                            <button
                              type="button"
                              onClick={() => setPreviewingSermon(s)}
                              className="px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                              title="Listen / Preview Message"
                            >
                              <Eye className="w-3 h-3 text-primary" />
                              <span>Preview</span>
                            </button>
                          )}

                          {/* Download Media */}
                          {(s.video_url || s.audio_url) && (
                            <button
                              type="button"
                              onClick={() => handleDownloadSermonMedia(s)}
                              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Download audio/video file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Sermon */}
                          <button
                            type="button"
                            onClick={() => setEditingSermon(s)}
                            className="p-1.5 rounded-lg text-white/60 hover:text-primary hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit sermon details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Set as Active Altar Broadcast */}
                          <button
                            type="button"
                            onClick={() => {
                              const targetUrl = s.youtube_id ? `https://www.youtube.com/watch?v=${s.youtube_id}` : '';
                              if (targetUrl) {
                                setSermonYoutubeInput(targetUrl);
                                StorageService.setLiveStreamUrl(targetUrl);
                              }
                              StorageService.setOverridePlayingVideo({
                                id: s.id,
                                title: s.title,
                                youtube_id: s.youtube_id,
                                video_url: s.video_url,
                                audio_url: s.audio_url,
                                thumbnail_url: s.thumbnail_url,
                                speaker: s.speaker,
                                series: s.series
                              });
                              onRefreshAppState();
                              confetti({ particleCount: 20, spread: 60 });
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 bg-primary text-primary-foreground hover:brightness-105 shadow-sm transition-all cursor-pointer"
                            title="Set as active altar message"
                          >
                            <Play className="w-3 h-3" />
                            <span>Play on Altar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSermon(s.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/20 text-white/40 hover:text-destructive transition-colors cursor-pointer"
                            title="Delete Sermon from Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview In-Panel Sermon Modal */}
              {previewingSermon && (
                <div 
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setPreviewingSermon(null)}
                >
                  <div 
                    className="bg-card border border-white/15 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        {previewingSermon.video_url ? <Film className="w-5 h-5 text-primary" /> : <Headphones className="w-5 h-5 text-amber-400" />}
                        <h3 className="font-bold text-sm text-white truncate max-w-xs">{previewingSermon.title}</h3>
                      </div>
                      <button 
                        onClick={() => setPreviewingSermon(null)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {previewingSermon.video_url ? (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <video controls autoPlay src={previewingSermon.video_url} className="w-full h-full object-contain" />
                      </div>
                    ) : previewingSermon.audio_url ? (
                      <div className="p-4 rounded-xl bg-background border border-white/10 space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={previewingSermon.thumbnail_url} alt="" className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                          <div>
                            <span className="font-bold text-xs text-white block">{previewingSermon.title}</span>
                            <span className="text-[11px] text-white/60 block">{previewingSermon.speaker} • {previewingSermon.duration}</span>
                          </div>
                        </div>
                        <audio controls autoPlay src={previewingSermon.audio_url} className="w-full accent-primary" />
                      </div>
                    ) : null}

                    <div className="text-xs text-white/70 space-y-1">
                      <p><strong>Series:</strong> {previewingSermon.series}</p>
                      <p><strong>Scripture:</strong> {previewingSermon.scriptures?.join(', ')}</p>
                      <p><strong>Description:</strong> {previewingSermon.description}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleDownloadSermonMedia(previewingSermon)}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Media</span>
                      </button>
                      <button
                        onClick={() => setPreviewingSermon(null)}
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Sermon Modal */}
              {editingSermon && (
                <div 
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setEditingSermon(null)}
                >
                  <div 
                    className="bg-card border border-white/15 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl text-white animate-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-primary" />
                        <span>Edit Sermon Archive</span>
                      </h3>
                      <button 
                        onClick={() => setEditingSermon(null)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-white/70 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingSermon.title}
                          onChange={e => setEditingSermon({ ...editingSermon, title: e.target.value })}
                          className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-white/70 mb-1">Speaker</label>
                          <input
                            type="text"
                            value={editingSermon.speaker}
                            onChange={e => setEditingSermon({ ...editingSermon, speaker: e.target.value })}
                            className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1">Series</label>
                          <input
                            type="text"
                            value={editingSermon.series}
                            onChange={e => setEditingSermon({ ...editingSermon, series: e.target.value })}
                            className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-white/70 mb-1">Date</label>
                          <input
                            type="text"
                            value={editingSermon.date}
                            onChange={e => setEditingSermon({ ...editingSermon, date: e.target.value })}
                            className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-white/70 mb-1">Duration</label>
                          <input
                            type="text"
                            value={editingSermon.duration}
                            onChange={e => setEditingSermon({ ...editingSermon, duration: e.target.value })}
                            className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editingSermon.description}
                          onChange={e => setEditingSermon({ ...editingSermon, description: e.target.value })}
                          className="w-full bg-background border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditingSermon(null)}
                        className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-white text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSermon(editingSermon)}
                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CONGREGATIONS & LIVE STREAM MONITOR */}
          {activeSection === 'congregations' && (
            <div className="space-y-4">
              {/* Broadcast Status & Live Trigger Card */}
              <div className="bg-card border border-primary/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${liveSermonStatus.isLive ? 'bg-red-500 animate-ping' : 'bg-white/30'}`} />
                      <h3 className="font-bold text-sm text-primary">
                        Live Sanctuary Streaming
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const willBeLive = !liveSermonStatus.isLive;
                        const newStatus = {
                          isLive: willBeLive,
                          title: sermonTitle || 'Church & Politics (Controversial Issues) • Apostle Joe Daniels Live',
                          sermonId: willBeLive ? `sermon_${Date.now()}` : 'sermon_church_politics',
                          viewerCount: StorageService.getStreamViewers().length,
                          streamUrl: adminStreamUrl.trim() || StorageService.getLiveStreamUrl()
                        };
                        StorageService.setLiveSermonStatus(newStatus);
                        setLiveSermonStatus(newStatus);
                        if (willBeLive) {
                          StorageService.setOverridePlayingVideo(null);
                        }
                        setCongregationUnits(StorageService.getCongregationUnits());
                        setStreamViewers(StorageService.getStreamViewers());
                        setStreamAttendees(StorageService.getStreamAttendanceHistory());
                        confetti({ particleCount: 25, spread: 50 });
                        onRefreshAppState();
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                        liveSermonStatus.isLive
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{liveSermonStatus.isLive ? 'End Live' : 'Go Live'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete streaming attendance history logs? Streamer profile details will be kept, only repetitive logs will be deleted.')) {
                          StorageService.clearStreamAttendanceHistory();
                          setStreamAttendees([]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300"
                      title="Delete streaming logs while broadcasting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Logs</span>
                    </button>
                  </div>
                </div>

                {/* Live Stream URL Configuration */}
                <div className="bg-background border border-white/10 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={adminStreamUrl}
                        onChange={(e) => setAdminStreamUrl(e.target.value)}
                        placeholder="Paste Facebook Live or YouTube URL..."
                        className="w-full bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowAdminStreamPreview(!showAdminStreamPreview)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                          showAdminStreamPreview 
                            ? 'bg-primary/20 border-primary text-primary' 
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
                          StorageService.setLiveStreamUrl(cleanUrl);
                          const newStatus = {
                            ...liveSermonStatus,
                            streamUrl: cleanUrl,
                            isLive: true
                          };
                          StorageService.setLiveSermonStatus(newStatus);
                          setLiveSermonStatus(newStatus);
                          StorageService.setOverridePlayingVideo({
                            id: `stream_${Date.now()}`,
                            title: newStatus.title || 'Sanctuary Live Stream',
                            youtube_id: cleanUrl
                          });
                          confetti({ particleCount: 20, spread: 40 });
                          onRefreshAppState();
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Links & Local MP4 File Upload */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-white/40 text-[10px] font-medium">Stream Ingest Sources:</span>
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

                    <input
                      ref={congregationMp4InputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      onChange={handleUploadLocalMp4}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => congregationMp4InputRef.current?.click()}
                      disabled={isUploadingMp4}
                      className="px-2.5 py-0.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Upload MP4 from local storage to broadcast as the live stream video"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isUploadingMp4 ? 'Loading MP4...' : '📁 Upload Local MP4 / Video'}</span>
                    </button>
                  </div>

                  {mp4UploadFeedback && (
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs flex items-center gap-1.5 animate-in fade-in">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{mp4UploadFeedback}</span>
                    </div>
                  )}

                  {/* Admin Stream Preview Player */}
                  {showAdminStreamPreview && (
                    <div className="pt-2 border-t border-white/10 animate-in fade-in duration-200">
                      <div className="text-[11px] font-bold text-white/70 mb-2 flex items-center justify-between">
                        <span>Admin Live Stream Preview (How members see it):</span>
                        {StorageService.isFacebookUrl(adminStreamUrl) ? (
                          <a
                            href={StorageService.getStreamEmbedInfo(adminStreamUrl).facebookDirectUrl || adminStreamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open on Facebook</span>
                          </a>
                        ) : (StorageService.getStreamEmbedInfo(adminStreamUrl).isMp4 || StorageService.getStreamEmbedInfo(adminStreamUrl).isDirectVideo || adminStreamUrl.endsWith('.mp4') || adminStreamUrl.startsWith('blob:') || adminStreamUrl.startsWith('data:video/')) ? (
                          <span className="text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                            Local MP4 / Direct Stream
                          </span>
                        ) : null}
                      </div>
                      <div className="aspect-video w-full max-w-lg mx-auto bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl relative">
                        {StorageService.isFacebookUrl(adminStreamUrl) ? (
                          <FacebookStreamPlayer
                            embedUrl={StorageService.getStreamEmbedInfo(adminStreamUrl).embedUrl}
                            directUrl={StorageService.getStreamEmbedInfo(adminStreamUrl).facebookDirectUrl || adminStreamUrl}
                            title={liveSermonStatus.title || 'Sanctuary Live Stream'}
                            isLivePageHub={Boolean(StorageService.getStreamEmbedInfo(adminStreamUrl).isLivePageHub)}
                            isLive={liveSermonStatus.isLive}
                          />
                        ) : (StorageService.getStreamEmbedInfo(adminStreamUrl).isMp4 || StorageService.getStreamEmbedInfo(adminStreamUrl).isDirectVideo || adminStreamUrl.endsWith('.mp4') || adminStreamUrl.startsWith('blob:') || adminStreamUrl.startsWith('data:video/')) ? (
                          <video
                            controls
                            autoPlay
                            muted
                            playsInline
                            src={adminStreamUrl}
                            className="w-full h-full object-contain bg-black"
                          />
                        ) : (
                          <iframe
                            className="w-full h-full border-0"
                            src={StorageService.getStreamEmbedInfo(adminStreamUrl).embedUrl}
                            title="YouTube Stream Admin Preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4 Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Broadcast Mode</div>
                    <div className={`text-sm font-black mt-1 ${liveSermonStatus.isLive ? 'text-red-400' : 'text-white/60'}`}>
                      {liveSermonStatus.isLive ? '🔴 BROADCASTING LIVE' : 'Standby'}
                    </div>
                  </div>

                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Active Live Streamers</div>
                    <div className="text-lg font-black text-white mt-0.5 flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{streamViewers.length} Believers</span>
                    </div>
                  </div>

                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Official Congregations (10+)</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{congregationUnits.filter(c => c.is_congregation).length} Congregations</span>
                    </div>
                  </div>

                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 uppercase font-bold">Cities Connected</div>
                    <div className="text-lg font-black text-primary mt-0.5 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{congregationUnits.filter(c => c.total_members > 0 || c.active_streamers > 0).length} Hubs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Congregation Hubs Grid (12 Defined Cities Clustering) */}
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
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
                            ? 'bg-gradient-to-b from-card to-background border-primary/60 shadow-md'
                            : 'bg-background/60 border-white/10 hover:border-white/20'
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
                                  className="bg-primary h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {hub.is_congregation && (
                          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-primary">
                            <span className="font-semibold">Congregation Formed</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 font-bold">
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
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
                  <div className="p-6 bg-background/60 rounded-xl text-center text-xs text-white/50">
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

              {/* Streaming Attendance & History Logs Table (Real-time Synced) */}
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                      Sanctuary Stream Attendance & Believers Log ({streamAttendees.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">
                      Real-time attendance record per congregation hub
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSection('stream_attendees')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-primary text-xs font-semibold border border-white/10 transition-colors"
                    >
                      Open Full Database →
                    </button>
                  </div>
                </div>

                {streamAttendees.length === 0 ? (
                  <div className="p-6 bg-background/60 rounded-xl text-center text-xs text-white/50">
                    No attendance logs recorded yet. When members watch the live sermon for 10+ seconds, their attendance is permanently cataloged here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase">
                          <th className="pb-2">Believer</th>
                          <th className="pb-2">Phone / Contact</th>
                          <th className="pb-2">City Hub</th>
                          <th className="pb-2">Session Timestamp</th>
                          <th className="pb-2 text-right">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {streamAttendees.slice(0, 10).map((att) => {
                          const cleanPhone = att.user_phone.replace(/\D/g, '');
                          const waPhone = cleanPhone.startsWith('0') ? `263${cleanPhone.slice(1)}` : cleanPhone;
                          return (
                            <tr key={att.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-2.5 font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                <span>{att.user_name}</span>
                              </td>
                              <td className="py-2.5 font-mono text-white/70">
                                {att.user_phone}
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-primary">
                                  {att.city}
                                </span>
                              </td>
                              <td className="py-2.5 text-white/50 text-[11px]">
                                {new Date(att.joined_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-2.5 text-right">
                                <a
                                  href={`https://wa.me/${waPhone}?text=Grace%20and%20Peace%20${encodeURIComponent(att.user_name)}%2C%20thank%20you%20for%20joining%20the%20Gateway%20Church%20service!`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 transition-all inline-flex items-center gap-1"
                                >
                                  <span>Message</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })}
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
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
                      className="pl-8 pr-3 py-1.5 bg-background border border-white/15 rounded-xl text-xs text-white focus:border-primary outline-none w-44"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
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
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'bg-card text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Inventory Table */}
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-card text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
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
                                  <div className="absolute right-0 top-8 z-50 w-48 bg-card border border-primary/30 rounded-xl shadow-2xl p-1.5 space-y-1 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
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
                                      <Copy className="w-3 h-3 text-primary" />
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-primary">
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
                      className="pl-8 pr-3 py-1.5 bg-background border border-white/15 rounded-xl text-xs text-white focus:border-primary outline-none w-44 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const count = await StorageService.syncAllEcosystemAccountsWithRemote();
                      setUsers(StorageService.getAllUsers());
                      setModerationMessage(`⚡ Successfully synchronized ${count} accounts with Supabase!`);
                      setTimeout(() => setModerationMessage(null), 3500);
                    }}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    title="Sync All Accounts with Supabase & WebSocket Hub"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sync Cloud</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadMembersExcel}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-primary hover:bg-amber-400 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    title="Download Members as Excel CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-card text-white/50 text-[10px] uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="p-3">Member Profile</th>
                        <th className="p-3">Phone & ID</th>
                        <th className="p-3">Cell Group</th>
                        <th className="p-3">Current Role</th>
                        <th className="p-3 text-right">Verification Badge</th>
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
                                {u.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
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
                              u.role === 'super_admin' ? 'bg-primary text-primary-foreground' :
                              u.role === 'developer' ? 'bg-purple-500/20 text-purple-300' :
                              u.role === 'moderator' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-white/10 text-white/70'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Badge Selector */}
                              <select
                                value={u.is_verified ? (u.badge_type || 'blue') : 'none'}
                                onChange={e => handleAssignBadge(u.id, e.target.value as any)}
                                className="hidden sm:inline-block bg-background border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                              >
                                <option value="none">No Badge</option>
                                <option value="silver">Silver (VIP Member)</option>
                                <option value="blue">Blue (Pastor / Moderator)</option>
                                <option value="gold">Gold (Super Admin)</option>
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
                                  <div className="absolute right-0 top-8 z-50 w-56 bg-card border border-primary/30 rounded-xl shadow-2xl p-1.5 space-y-1 text-left font-sans animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-white/10 truncate">
                                      {u.full_name}
                                    </div>
                                    <div className="px-2 py-0.5 text-[9px] font-mono text-primary">
                                      Assign Verification Badge:
                                    </div>
                                    {[
                                      { type: 'none', label: 'No Badge' },
                                      { type: 'silver', label: 'Silver (VIP Member)' },
                                      { type: 'blue', label: 'Blue (Pastor / Moderator)' },
                                      { type: 'gold', label: 'Gold (Super Admin)' }
                                    ].map(b => {
                                      const currentBadge = u.is_verified ? (u.badge_type || 'blue') : 'none';
                                      const isSelected = currentBadge === b.type;
                                      return (
                                        <button
                                          key={b.type}
                                          type="button"
                                          onClick={() => {
                                            handleAssignBadge(u.id, b.type as any);
                                            setActiveMemberMenuId(null);
                                          }}
                                          className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                            isSelected ? 'bg-primary/20 text-primary' : 'text-white/80 hover:bg-white/10'
                                          }`}
                                        >
                                          <span>{b.label}</span>
                                          {isSelected && <Check className="w-3 h-3 text-primary" />}
                                        </button>
                                      );
                                    })}

                                    <div className="border-t border-white/10 my-1" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = StorageService.developerPenetrateAccount(u.phone);
                                        if (res.success && res.user) {
                                          setActiveMemberMenuId(null);
                                          setModerationMessage(`Logged in as ${res.user.full_name} (${res.user.role})`);
                                          setTimeout(() => {
                                            window.location.reload();
                                          }, 500);
                                        } else {
                                          setModerationMessage(res.error || 'Failed to switch account');
                                        }
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-amber-300 hover:bg-amber-400/20 flex items-center gap-1.5"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Login as User (Penetrate)</span>
                                    </button>

                                    <div className="px-2 py-0.5 text-[9px] font-mono text-purple-300">
                                      Change Access Role:
                                    </div>
                                    {['member', 'moderator', 'super_admin', 'developer'].map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => {
                                          StorageService.developerSetUserRole(u.id, r as any);
                                          setUsers(StorageService.getAllUsers());
                                          setActiveMemberMenuId(null);
                                          setModerationMessage(`Updated ${u.full_name} role to ${r}`);
                                          setTimeout(() => setModerationMessage(null), 2500);
                                        }}
                                        className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-between ${
                                          u.role === r ? 'bg-purple-500/30 text-purple-300' : 'text-white/80 hover:bg-white/10'
                                        }`}
                                      >
                                        <span className="capitalize">{r.replace('_', ' ')}</span>
                                        {u.role === r && <Check className="w-3 h-3 text-purple-300" />}
                                      </button>
                                    ))}

                                    <div className="border-t border-white/10 my-1" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to permanently delete member account ${u.full_name} (${u.phone})?`)) {
                                          StorageService.developerDeleteAccount(u.phone);
                                          setUsers(StorageService.getAllUsers());
                                          setActiveMemberMenuId(null);
                                          setModerationMessage(`Removed account for ${u.full_name}`);
                                          setTimeout(() => setModerationMessage(null), 2500);
                                        }
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/20 flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      <span>Delete Account</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextStatus = !u.is_verified;
                                        handleAssignBadge(u.id, nextStatus ? 'blue' : 'none');
                                        setActiveMemberMenuId(null);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-1.5"
                                    >
                                      <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                                      <span>{u.is_verified ? 'Remove Verification' : 'Grant Blue Badge'}</span>
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-primary flex items-center gap-2">
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
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-primary hover:bg-amber-400 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete streaming attendance history logs? Active streamers information will be kept.')) {
                        StorageService.clearStreamAttendanceHistory();
                        setStreamAttendees([]);
                      }
                    }}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-red-500/30 cursor-pointer"
                    title="Delete all streaming attendance history logs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Logs</span>
                  </button>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-white/50 block">Total Logged Streamers</span>
                  <span className="text-lg font-bold text-white">{streamAttendees.length}</span>
                </div>
                <div className="bg-card border border-blue-500/30 rounded-xl p-3">
                  <span className="text-[11px] text-blue-400 block">Active Streaming Now</span>
                  <span className="text-lg font-bold text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{streamViewers.length}</span>
                  </span>
                </div>
                <div className="bg-card border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-primary block">Congregation Hubs Formed</span>
                  <span className="text-lg font-bold text-primary">
                    {congregationUnits.filter(c => c.is_congregation).length}
                  </span>
                </div>
                <div className="bg-card border border-white/10 rounded-xl p-3">
                  <span className="text-[11px] text-emerald-400 block">Cities Represented</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {new Set(streamAttendees.map(a => a.city)).size}
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-card border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={attendeeSearch}
                    onChange={(e) => setAttendeeSearch(e.target.value)}
                    placeholder="Search by name, phone, or handle..."
                    className="w-full bg-card border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-white/50 shrink-0">Filter City:</span>
                  <select
                    value={attendeeCityFilter}
                    onChange={(e) => setAttendeeCityFilter(e.target.value)}
                    className="bg-card border border-white/10 rounded-xl px-3 py-1.5 text-xs text-primary font-semibold focus:outline-none focus:border-primary"
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
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3 bg-card border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-white">Stream Attendees Contact & Location Database</span>
                  </div>
                  <span className="text-[10px] text-white/50">
                    Recorded for congregation tracking & future follow-up
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-background text-white/50 border-b border-white/10">
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
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
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
              <div className="bg-card border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 bg-card border-b border-white/10 flex items-center justify-between">
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
                              <span className="text-[10px] text-primary px-1.5 py-0.2 rounded bg-primary/10 font-semibold">
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
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
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Audience Target Segment
                      </label>
                      <select
                        value={pushSegment}
                        onChange={e => setPushSegment(e.target.value as any)}
                        className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
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
                      className="w-full bg-background border border-white/15 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Push Broadcast</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification History */}
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Sent Notifications Log ({notifications.length})
                </h4>
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="bg-background/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{n.title}</div>
                        <p className="text-[11px] text-white/70">{n.body}</p>
                        <span className="text-[10px] text-primary">Segment: {n.target_segment}</span>
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-primary">Altar Prayer Petitions ({prayers.length})</h3>
                  <p className="text-xs text-white/70">Review congregation burdens and issue apostolic decrees.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {prayers.map(p => (
                  <div key={p.id} className="bg-card border border-white/10 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{p.is_anonymous ? 'Anonymous Partner' : p.user_name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                          {p.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-white/80 bg-background p-3 rounded-xl border border-white/5">
                      "{p.request_text}"
                    </p>

                    {p.apostle_notes ? (
                      <div className="text-xs text-primary bg-primary/10 p-2.5 rounded-xl border border-primary/30">
                        <strong>Decreed:</strong> {p.apostle_notes}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActivePrayerDecree(p)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1"
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
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Financial Ledger & Kingdom Seed Auditing</span>
                    </h3>
                    <p className="text-xs text-white/60">
                      Real-time ledger tracking tithes, offerings, cathedral pledges, and store revenue.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetLedger}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Reset all past records to $0.00"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Ledger to $0.00</span>
                  </button>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <span className="text-[11px] text-white/50 block">Total USD Giving</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">
                      ${totalGivingUsd.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <span className="text-[11px] text-white/50 block">Total ZiG Giving</span>
                    <span className="text-xl font-mono font-bold text-primary">
                      {totalGivingZig.toFixed(2)} ZiG
                    </span>
                  </div>
                  <div className="bg-background border border-white/10 rounded-xl p-3">
                    <span className="text-[11px] text-white/50 block">Recorded Transactions</span>
                    <span className="text-xl font-mono font-bold text-white">
                      {donations.length}
                    </span>
                  </div>
                </div>

                <div className="bg-background p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Gateway Cathedral Project (Phase 2):</span>
                    <span className="font-bold text-primary">Active Ledger ($0 Base / Target $500,000)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-[2%]"></div>
                  </div>
                </div>
              </div>

              {/* Transactions Log */}
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                    Audited Contributions Log ({donations.length})
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">Live Auditing Active</span>
                </div>

                {donations.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-background/50 rounded-xl border border-white/5">
                    <DollarSign className="w-8 h-8 text-emerald-400/50 mx-auto" />
                    <p className="text-xs text-white/80 font-bold">Ledger Reset to $0.00 USD / 0 ZiG</p>
                    <p className="text-[11px] text-white/40">
                      All past records have been cleared. New live seeds, tithes, and Paynow transactions will appear here instantly.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {donations.map(d => (
                      <div key={d.id} className="bg-background/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
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
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: JOE VIBES */}
          {activeSection === 'vibes' && (
            <div className="space-y-3">
              <div className="bg-card border border-white/10 rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-sm text-primary">Gospel Music Submissions ({joeVibes.length})</h3>
                <p className="text-xs text-white/70">Review tracks for Youth Ignite & Sunday Service rotation.</p>
              </div>

              <div className="space-y-2">
                {joeVibes.map(v => (
                  <div key={v.id} className="bg-card border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{v.song_title}</span>
                        <span className="text-white/60 ml-2">by {v.artist_name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
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
                          className="px-2.5 py-1 rounded bg-primary text-primary-foreground font-bold text-[11px]"
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

          {/* SECTION 9: AVATARS & THUMBNAILS LIBRARY */}
          {activeSection === 'media_library' && (
            <div className="space-y-4">
              <div className="bg-card border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Official Avatars & Thumbnails Library</span>
                    </h3>
                    <p className="text-xs text-white/70">
                      Upload and manage authentic photo assets for member profile signups, community posts, and testimony thumbnails.
                    </p>
                  </div>

                  {/* Subtab Selector */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/80 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setMediaLibraryTab('avatars')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        mediaLibraryTab === 'avatars'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>User Avatars ({adminAvatars.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaLibraryTab('thumbnails')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        mediaLibraryTab === 'thumbnails'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Post Thumbnails ({adminThumbnails.length})</span>
                    </button>
                  </div>
                </div>

                {/* Upload Form Box */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-dashed border-primary/30 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-primary" />
                        <span>Upload New {mediaLibraryTab === 'avatars' ? 'Default Avatar' : 'Testimony Thumbnail'} from Local Device</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          value={newMediaTitle}
                          onChange={(e) => setNewMediaTitle(e.target.value)}
                          placeholder={mediaLibraryTab === 'avatars' ? "e.g. Apostle Joe Daniels (Conference 2026)" : "e.g. Supernatural Acceleration Testimony Cover"}
                          className="flex-1 w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                        />
                        <select
                          value={newMediaCategory}
                          onChange={(e) => setNewMediaCategory(e.target.value)}
                          className="w-full sm:w-40 bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-primary"
                        >
                          <option value="Official">Official Ministry</option>
                          <option value="Preaching">Preaching & Altar</option>
                          <option value="Prophetic">Prophetic / Impartation</option>
                          <option value="Discipleship">Discipleship & School</option>
                          <option value="Youth">Youth Revival</option>
                          <option value="Worship">Praise & Worship</option>
                        </select>
                      </div>
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
                      <input
                        ref={mediaLibraryTab === 'avatars' ? avatarFileInputRef : thumbnailFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadMediaItem(e, mediaLibraryTab === 'avatars' ? 'avatar' : 'thumbnail')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (mediaLibraryTab === 'avatars') {
                            avatarFileInputRef.current?.click();
                          } else {
                            thumbnailFileInputRef.current?.click();
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Choose Photo & Add</span>
                      </button>
                    </div>
                  </div>

                  {mediaUploadSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{mediaUploadSuccess}</span>
                    </div>
                  )}

                  {mediaUploadError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{mediaUploadError}</span>
                    </div>
                  )}
                </div>

                {/* Gallery Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>
                      {mediaLibraryTab === 'avatars' 
                        ? 'Available to all users during Sign Up and Profile Settings' 
                        : 'Available to all users when creating Community Posts & Testimonies'}
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {mediaLibraryTab === 'avatars' ? adminAvatars.length : adminThumbnails.length} Items Total
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(mediaLibraryTab === 'avatars' ? adminAvatars : adminThumbnails).map((item) => (
                      <div
                        key={item.id}
                        className={`bg-background rounded-xl border p-2.5 flex flex-col justify-between transition-all group relative overflow-hidden ${
                          item.is_default 
                            ? 'border-primary shadow-[0_0_12px_rgba(212,175,55,0.2)]' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {item.is_default && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-black text-[9px] shadow-sm flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 fill-current" />
                            <span>DEFAULT</span>
                          </div>
                        )}

                        <div className={`w-full overflow-hidden bg-secondary mb-2 flex items-center justify-center relative ${
                          mediaLibraryTab === 'avatars' ? 'aspect-square rounded-full max-w-[120px] mx-auto border border-white/15' : 'aspect-video rounded-lg'
                        }`}>
                          <img
                            src={item.url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <h5 className="font-bold text-xs text-white truncate" title={item.name}>
                            {item.name}
                          </h5>
                          <div className="flex items-center justify-between text-[10px] text-white/50">
                            <span>{item.size || 'Preset'}</span>
                            <span className="truncate">{new Date(item.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 mt-2 flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (mediaLibraryTab === 'avatars') {
                                StorageService.setAdminAvatarDefault(item.id);
                                setAdminAvatars(StorageService.getAdminAvatarLibrary());
                              } else {
                                StorageService.setAdminThumbnailDefault(item.id);
                                setAdminThumbnails(StorageService.getAdminThumbnailLibrary());
                              }
                              confetti({ particleCount: 15, spread: 40 });
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              item.is_default
                                ? 'bg-primary/20 text-primary border border-primary/40'
                                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                          >
                            {item.is_default ? '✓ Default' : 'Set Default'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete "${item.name}" from the media library?`)) {
                                if (mediaLibraryTab === 'avatars') {
                                  StorageService.deleteAdminAvatar(item.id);
                                  setAdminAvatars(StorageService.getAdminAvatarLibrary());
                                } else {
                                  StorageService.deleteAdminThumbnail(item.id);
                                  setAdminThumbnails(StorageService.getAdminThumbnailLibrary());
                                }
                              }
                            }}
                            className="p-1 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ADD PRODUCT TO INVENTORY */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/40 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-primary">Add Store Resource / Product</h3>
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
                  className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value as any)}
                    className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
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
                    className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Price ZiG</label>
                <input
                  type="number"
                  value={newProdPriceZig}
                  onChange={e => setNewProdPriceZig(Number(e.target.value))}
                  className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Product Image</label>
                <select
                  value={newProdImage}
                  onChange={e => setNewProdImage(e.target.value)}
                  className="w-full bg-background border border-white/15 rounded-xl px-3 py-2 text-xs text-white mb-1.5"
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
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
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
          <div className="bg-card border border-primary/40 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-primary">Apostolic Decree on Altar Petition</h3>
              <button onClick={() => setActivePrayerDecree(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/80 bg-background p-3 rounded-xl border border-white/5">
              "{activePrayerDecree.request_text}"
            </p>

            <form onSubmit={handleApplyPrayerDecree} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Prophetic Decree Message</label>
                <textarea
                  rows={3}
                  value={decreeNote}
                  onChange={e => setDecreeNote(e.target.value)}
                  className="w-full bg-background border border-white/15 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
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
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
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
