import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  Code2, 
  Terminal, 
  Database, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  FileCode,
  Layers,
  Zap,
  Lock,
  Wifi,
  ExternalLink,
  CreditCard,
  Copy,
  Check,
  Play,
  KeyRound,
  Users,
  MoreVertical,
  ChevronDown,
  Trash2,
  Edit3,
  ShieldOff,
  Eye,
  Search,
  AlertTriangle,
  ArrowRight,
  Ban,
  UserX,
  UserCheck,
  Shield,
  MessageSquare,
  LockKeyhole,
  Radio,
  Tv,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Download,
  Send,
  BadgeCheck,
  ShieldCheck,
  Binary,
  FileText,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { testSupabaseConnection } from '../../services/supabaseClient';
import { downloadCsvForExcel } from '../../utils/exportUtils';
import { SUPABASE_SCHEMA_SQL } from '../../data/flutterExportData';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';
import { User, UnbanAppeal, PasswordResetRequest, StreamAttendanceRecord, LiveStreamViewer, SUPPORTED_CITIES } from '../../types';
import type { UserRole } from '../../types';
import { AdminCyberBackground } from '../admin/AdminCyberBackground';
import { CONFIG } from '../../../config';

/**
 * Hacker-style Matrix binary digital rain telemetry component
 * Professional, high-contrast, cybersecurity aesthetic
 */
const MatrixRainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.offsetWidth || 240);
    const height = (canvas.height = canvas.offsetHeight || 28);

    const characters = '01GATEWAYCONNECT0101100101ZIMBABWE';
    const fontSize = 9;
    const columns = Math.floor(width / fontSize);
    const drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -15));

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillStyle = i % 4 === 0 ? '#c084fc' : i % 2 === 0 ? '#34d399' : '#10b981';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.97) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-48 sm:w-60 h-7 rounded-lg overflow-hidden border border-emerald-500/30 bg-slate-950/80 shrink-0 hidden sm:block">
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/70 pointer-events-none" />
      <div className="absolute inset-y-0 left-2 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
          CYBER MATRIX STREAM
        </span>
      </div>
    </div>
  );
};

interface DevConsoleProps {
  onClose: () => void;
  onOpenFlutterExport: () => void;
  onSwitchUser?: (user: any) => void;
}

export const DevConsole: React.FC<DevConsoleProps> = ({ onClose, onOpenFlutterExport, onSwitchUser }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'streamers' | 'bans' | 'appeals' | 'passwords' | 'godmode' | 'schema' | 'logs' | 'endpoints' | 'accounts'>('telemetry');
  const [showPaynowModal, setShowPaynowModal] = useState(false);
  const [isPingingSupabase, setIsPingingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<'off' | 'matrix' | 'binary' | 'grid' | 'terminal' | 'neon' | 'wifi' | 'typing'>(() => {
    if (typeof window === 'undefined') return 'matrix';
    const saved = localStorage.getItem('gcz_dev_background_mode');
    return saved === 'off' || saved === 'matrix' || saved === 'binary' || saved === 'grid' || saved === 'terminal' || saved === 'neon' || saved === 'wifi' || saved === 'typing'
      ? saved
      : 'matrix';
  });
  const paynowConfig = PaynowService.getConfig();
  const supabaseConfig = StorageService.getSupabaseConfig();
  
  // Cyber-Futuristic Hacker Background Toggle
  const [showCyberBackground, setShowCyberBackground] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gcz_admin_cyber_bg');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const handleToggleCyberBackground = () => {
    setBackgroundMode(prev => {
      const next = prev === 'off' ? 'matrix' : 'off';
      setShowCyberBackground(next !== 'off');
      localStorage.setItem('gcz_dev_background_mode', next);
      return next;
    });
  };

  const handleBackgroundModeChange = (mode: typeof backgroundMode) => {
    setBackgroundMode(mode);
    setShowCyberBackground(mode !== 'off');
    localStorage.setItem('gcz_dev_background_mode', mode);
  };
  
  // Congregation Stream Tracking State (Who is streaming now & after stream ends with locations and contact details)
  const [streamAttendees, setStreamAttendees] = useState<StreamAttendanceRecord[]>(StorageService.getStreamAttendanceHistory());
  const [activeStreamers, setActiveStreamers] = useState<LiveStreamViewer[]>(StorageService.getStreamViewers());
  const [streamSearch, setStreamSearch] = useState('');
  const [streamCityFilter, setStreamCityFilter] = useState('All');
  const [streamFilterMode, setStreamFilterMode] = useState<'all' | 'live' | 'completed'>('all');
  const [copiedAttendeeData, setCopiedAttendeeData] = useState(false);
  const [copiedContactPhone, setCopiedContactPhone] = useState<string | null>(null);

  const handleRefreshStreamers = () => {
    setStreamAttendees(StorageService.getStreamAttendanceHistory());
    setActiveStreamers(StorageService.getStreamViewers());
  };

  const handleEndAndArchiveStream = () => {
    StorageService.endActiveStreamSession();
    handleRefreshStreamers();
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [STREAM_ARCHIVE] Live sermon stream session ended & archived all attendees to persistent database`, ...prev]);
  };

  const handleExportStreamAttendees = () => {
    const data = StorageService.getStreamAttendanceHistory();
    const headers = 'ID,Believer Name,Mobile Phone,Username,City Hub,Session Title,Joined At,Ended At,Status\n';
    const rows = data.map(r => 
      `"${r.id}","${r.user_name}","${r.user_phone}","${r.user_handle}","${r.city}","${r.session_title}","${r.joined_at}","${r.ended_at || 'In Progress'}","${r.status}"`
    ).join('\n');
    const csvContent = headers + rows;
    navigator.clipboard.writeText(csvContent);
    setCopiedAttendeeData(true);
    setTimeout(() => setCopiedAttendeeData(false), 2500);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [STREAM_EXPORT] Exported ${data.length} stream attendance records with contact details to CSV`, ...prev]);
  };

  const handleDownloadStreamAttendeesExcel = () => {
    const data = StorageService.getStreamAttendanceHistory();
    const headers = 'ID,Believer Name,Mobile Phone,Username,City Hub,Session Title,Joined At,Ended At,Status\n';
    const rows = data.map(r => 
      `"${r.id}","${r.user_name}","${r.user_phone}","${r.user_handle}","${r.city}","${r.session_title}","${r.joined_at}","${r.ended_at || 'In Progress'}","${r.status}"`
    ).join('\n');
    const csvContent = headers + rows;
    downloadCsvForExcel(`gateway_connect_stream_attendees_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [EXCEL_DOWNLOAD] Downloaded ${data.length} stream attendees to Excel CSV file`, ...prev]);
  };

  const handleDownloadUsersExcel = () => {
    const data = StorageService.getAllUsers();
    const headers = 'ID,Full Name,Mobile Phone,Handle,Role,City Location,Cell Group,Verified,Premium\n';
    const rows = data.map(u => 
      `"${u.id}","${u.full_name}","${u.phone}","${u.handle}","${u.role}","${u.city_location || 'Harare'}","${u.cell_group || 'Central'}","${u.is_verified ? 'Yes' : 'No'}","${u.is_premium ? 'Yes' : 'No'}"`
    ).join('\n');
    const csvContent = headers + rows;
    downloadCsvForExcel(`gateway_connect_users_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [EXCEL_DOWNLOAD] Downloaded ${data.length} users to Excel CSV file`, ...prev]);
  };

  // Godmode state
  const [usersList, setUsersList] = useState<User[]>(StorageService.getAllUsers());
  const [godmodeSearch, setGodmodeSearch] = useState('');
  const [penetrateStatus, setPenetrateStatus] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editCity, setEditCity] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [activeUserMenuId, setActiveUserMenuId] = useState<string | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [manualPasswordInput, setManualPasswordInput] = useState('');
  const [logsFilter, setLogsFilter] = useState('');
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const [isPausedLogs, setIsPausedLogs] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const [logs, setLogs] = useState<string[]>([
    `[SYSTEM] Console opened ${new Date().toISOString()}`,
    `[CONFIG] Supabase: ${supabaseConfig.isLiveConnected ? 'configured' : 'not configured'}${supabaseConfig.url ? ` (${supabaseConfig.url})` : ''}`,
    `[CONFIG] WebSocket: ${CONFIG.LIVE_WS_URL ? 'configured' : 'not configured'}`,
    `[CONFIG] Paynow: ${paynowConfig.isConfigured ? 'configured' : 'not configured'}`
  ]);

  // Realtime listeners & live telemetry heartbeat
  useEffect(() => {
    const refreshAll = () => {
      setUsersList(StorageService.getAllUsers());
      setBannedUsersMap(StorageService.getBannedUsers());
      setPasswordRequests(StorageService.getPasswordResetRequests());
      setUnbanAppeals(StorageService.getUnbanAppeals());
      setActiveStreamers(StorageService.getStreamViewers());
      setStreamAttendees(StorageService.getStreamAttendanceHistory());
    };

    refreshAll();

    const handleIncomingLiveEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      const detail = customEvt.detail;
      const stamp = new Date().toLocaleTimeString();
      if (detail && detail.type) {
        let desc = typeof detail.payload === 'object' ? JSON.stringify(detail.payload) : String(detail.payload || '');
        if (desc.length > 80) desc = desc.slice(0, 80) + '...';
        setLogs(prev => [
          `[${stamp}] [REALTIME_BUS:${detail.type.toUpperCase()}] ${desc}`,
          ...prev.slice(0, 150)
        ]);
      }
      refreshAll();
    };

    const handleStreamChat = (e: Event) => {
      const customEvt = e as CustomEvent;
      const chat = customEvt.detail;
      const stamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        `[${stamp}] [STREAM_CHAT] ${chat?.userName || 'Viewer'}: ${chat?.text || ''}`,
        ...prev.slice(0, 150)
      ]);
    };

    const handleStreamReaction = (e: Event) => {
      const customEvt = e as CustomEvent;
      const r = customEvt.detail;
      const stamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        `[${stamp}] [STREAM_REACTION] Burst ${r?.reactionType || 'Amen'} from ${r?.userName || 'Viewer'} (${r?.city || 'Harare'})`,
        ...prev.slice(0, 150)
      ]);
    };

    const handlePresence = (e: Event) => {
      const customEvt = e as CustomEvent;
      const members = (customEvt.detail as any[]) || [];
      const stamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        `[${stamp}] [PRESENCE_SYNC] ${members.length} active client socket node(s) connected`,
        ...prev.slice(0, 150)
      ]);
    };

    const handleStreamViewerJoined = (e: Event) => {
      const customEvt = e as CustomEvent;
      const v = customEvt.detail;
      const stamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        `[${stamp}] [STREAM_JOINED] ${v?.full_name || 'Believer'} (${v?.phone || v?.city || 'Harare'}) joined live sermon broadcast`,
        ...prev.slice(0, 150)
      ]);
      refreshAll();
    };

    const handleStreamViewerLeft = (e: Event) => {
      const customEvt = e as CustomEvent;
      const d = customEvt.detail;
      const stamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        `[${stamp}] [STREAM_LEFT] User ${d?.userId || 'session'} exited live sermon broadcast`,
        ...prev.slice(0, 150)
      ]);
      refreshAll();
    };

    window.addEventListener('gcz_user_profile_updated', refreshAll);
    window.addEventListener('gcz_user_registered', refreshAll);
    window.addEventListener('gcz_users_synced', refreshAll);
    window.addEventListener('gcz_banned_users_updated', refreshAll);
    window.addEventListener('gcz_stream_viewers_updated', refreshAll);
    window.addEventListener('gcz_stream_attendance_updated', refreshAll);
    window.addEventListener('gcz_stream_viewer_joined', handleStreamViewerJoined);
    window.addEventListener('gcz_stream_viewer_left', handleStreamViewerLeft);
    window.addEventListener('gcz_password_requests_updated', refreshAll);
    window.addEventListener('gcz_unban_appeals_updated', refreshAll);
    window.addEventListener('gcz_live_state_updated', refreshAll);
    window.addEventListener('gcz_live_event_received', handleIncomingLiveEvent);
    window.addEventListener('gcz_stream_chat_sent', handleStreamChat);
    window.addEventListener('gcz_stream_reaction_sent', handleStreamReaction);
    window.addEventListener('gcz_live_presence_updated', handlePresence);

    // Heartbeat live telemetry logs
    const heartbeat = setInterval(() => {
      if (isPausedLogs) return;
      const stamp = new Date().toLocaleTimeString();
      const count = StorageService.getOnlineStreamersCount();
      setLogs(prev => {
        const next = [
          `[${stamp}] [REALTIME_PULSE] Connected Streamers: ${count} | WebSocket: ${CONFIG.LIVE_WS_URL ? 'CONFIGURED' : 'NOT_CONFIGURED'} | Supabase: ${supabaseConfig.isLiveConnected ? 'CONFIGURED' : 'NOT_CONFIGURED'}`,
          ...prev
        ];
        return next.slice(0, 150);
      });
    }, 12000);

    return () => {
      window.removeEventListener('gcz_user_profile_updated', refreshAll);
      window.removeEventListener('gcz_user_registered', refreshAll);
      window.removeEventListener('gcz_users_synced', refreshAll);
      window.removeEventListener('gcz_banned_users_updated', refreshAll);
      window.removeEventListener('gcz_stream_viewers_updated', refreshAll);
      window.removeEventListener('gcz_stream_attendance_updated', refreshAll);
      window.removeEventListener('gcz_stream_viewer_joined', handleStreamViewerJoined);
      window.removeEventListener('gcz_stream_viewer_left', handleStreamViewerLeft);
      window.removeEventListener('gcz_password_requests_updated', refreshAll);
      window.removeEventListener('gcz_unban_appeals_updated', refreshAll);
      window.removeEventListener('gcz_live_state_updated', refreshAll);
      window.removeEventListener('gcz_live_event_received', handleIncomingLiveEvent);
      window.removeEventListener('gcz_stream_chat_sent', handleStreamChat);
      window.removeEventListener('gcz_stream_reaction_sent', handleStreamReaction);
      window.removeEventListener('gcz_live_presence_updated', handlePresence);
      clearInterval(heartbeat);
    };
  }, [isPausedLogs, supabaseConfig.isLiveConnected]);

  useEffect(() => {
    if (autoScrollLogs && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScrollLogs]);

  useEffect(() => {
    setUsersList(StorageService.getAllUsers());
    setBannedUsersMap(StorageService.getBannedUsers());
    setPasswordRequests(StorageService.getPasswordResetRequests());
    setUnbanAppeals(StorageService.getUnbanAppeals());
    setActiveStreamers(StorageService.getStreamViewers());
    setStreamAttendees(StorageService.getStreamAttendanceHistory());
  }, [activeTab]);

  const handleToggleVerificationBadge = (user: User) => {
    const nextStatus = !user.is_verified;
    const res = StorageService.developerSetVerificationBadge(user.id, nextStatus, nextStatus ? 'blue' : 'none');
    if (res.success) {
      setUsersList(StorageService.getAllUsers());
      const actionLabel = nextStatus ? 'Granted' : 'Removed';
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [GODMODE_BADGE] ${actionLabel} official verification badge for ${user.full_name} (${user.phone}) -> Synced to Supabase in Realtime`,
        ...prev
      ]);
      setPenetrateStatus(`✓ Successfully ${actionLabel.toLowerCase()} verification badge for ${user.full_name}`);
    } else {
      setPenetrateStatus(`Error: ${res.error}`);
    }
  };

  const handleDirectPasswordReset = (user: User) => {
    setPasswordModalUser(user);
    setManualPasswordInput(`Gateway${Math.floor(1000 + Math.random() * 9000)}!`);
  };

  const handleSaveDirectPassword = () => {
    if (!passwordModalUser || !manualPasswordInput.trim()) return;
    const ok = StorageService.updateUserPassword(passwordModalUser.phone, manualPasswordInput.trim());
    if (ok) {
      setUsersList(StorageService.getAllUsers());
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [GODMODE_PWD] Reset password for ${passwordModalUser.full_name} (${passwordModalUser.phone}) to "${manualPasswordInput.trim()}" -> Synced to Supabase`,
        ...prev
      ]);
      setPenetrateStatus(`✓ Password updated for ${passwordModalUser.phone}`);
      setPasswordModalUser(null);
    }
  };

  const handleExportLogs = () => {
    const text = logs.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gateway_system_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [DEV_EXPORT] Exported live system telemetry logs to text file`, ...prev]);
  };

  // Bans & Suspension state (Migrated from Admin Panel to Dev Console)
  const [bannedUsersMap, setBannedUsersMap] = useState<Record<string, { reason: string; banned_at: string; banned_by?: string }>>(StorageService.getBannedUsers());
  const [unbanAppeals, setUnbanAppeals] = useState<UnbanAppeal[]>(StorageService.getUnbanAppeals());
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>(StorageService.getPasswordResetRequests());
  const [banSearch, setBanSearch] = useState('');
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('Violation of platform security guidelines');
  const [selectedPasswordRequest, setSelectedPasswordRequest] = useState<PasswordResetRequest | null>(null);
  const [tempPasswordToIssue, setTempPasswordToIssue] = useState('');
  const [copiedTempPass, setCopiedTempPass] = useState(false);

  const [measuredLatency, setMeasuredLatency] = useState<number | null>(null);

  const handleTestSupabaseLive = async () => {
    setIsPingingSupabase(true);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [SUPABASE_PING] Sending ping request to ${supabaseConfig.url}...`, ...prev]);
    try {
      const result = await testSupabaseConnection();
      if (result.connected) {
        setMeasuredLatency(result.latencyMs);
        setLogs(prev => [
          `[${new Date().toLocaleTimeString()}] [SUPABASE_SUCCESS] Live ping succeeded! Latency: ${result.latencyMs}ms. Status: OK.`,
          ...prev
        ]);
      } else {
        setLogs(prev => [
          `[${new Date().toLocaleTimeString()}] [SUPABASE_RESULT] ${result.message} (Note: tables will be active once SQL is run in Supabase SQL Editor)`,
          ...prev
        ]);
      }
    } catch (e: any) {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] [SUPABASE_ERROR] ${e.message}`, ...prev]);
    } finally {
      setIsPingingSupabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [DEV] Copied complete Supabase schema.sql to clipboard for SQL Editor`, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs(['[SYSTEM] Logs cleared by developer 0780699988']);
  };

  const handleToggleBanUser = (targetUser: User) => {
    const isBanned = Boolean(bannedUsersMap[targetUser.id] || (targetUser.phone && bannedUsersMap[targetUser.phone]) || targetUser.is_banned);
    if (isBanned) {
      StorageService.unbanUser(targetUser.id);
      if (targetUser.phone) StorageService.unbanUser(targetUser.phone);
      setBannedUsersMap(StorageService.getBannedUsers());
      setUsersList(StorageService.getAllUsers());
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] [BAN_DESK] Unbanned member: ${targetUser.full_name} (${targetUser.phone})`, ...prev]);
    } else {
      setUserToBan(targetUser);
      setBanReasonInput('Violation of platform security guidelines');
    }
  };

  const handleConfirmBan = () => {
    if (!userToBan) return;
    StorageService.banUser(userToBan.id, banReasonInput || 'Account suspended by mr_juice7');
    if (userToBan.phone) {
      StorageService.banUser(userToBan.phone, banReasonInput || 'Account suspended by mr_juice7');
    }
    setBannedUsersMap(StorageService.getBannedUsers());
    setUsersList(StorageService.getAllUsers());
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [BAN_DESK] Suspended member: ${userToBan.full_name} (${userToBan.phone}) - Reason: ${banReasonInput}`, ...prev]);
    setUserToBan(null);
  };

  const handleBanAllStandard = () => {
    if (!confirm('Dev Action: Suspend all standard member accounts?')) return;
    usersList.forEach(u => {
      if (u.role !== 'super_admin' && u.role !== 'developer') {
        StorageService.banUser(u.id, 'Platform security maintenance suspension');
        if (u.phone) StorageService.banUser(u.phone, 'Platform security maintenance suspension');
      }
    });
    setBannedUsersMap(StorageService.getBannedUsers());
    setUsersList(StorageService.getAllUsers());
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [BAN_DESK] Emergency suspended all standard accounts`, ...prev]);
  };

  const handleRestoreAllAccounts = () => {
    localStorage.removeItem('gcz_banned_users_map');
    setBannedUsersMap({});
    setUsersList(StorageService.getAllUsers());
    window.dispatchEvent(new CustomEvent('gcz_banned_users_updated', { detail: {} }));
    window.dispatchEvent(new CustomEvent('gcz_users_synced', { detail: StorageService.getAllUsers() }));
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [BAN_DESK] Restored all accounts to active status across real-time`, ...prev]);
  };

  const handleResolveAppeal = (appealId: string, status: 'approved' | 'rejected') => {
    StorageService.resolveUnbanAppeal(appealId, status);
    setUnbanAppeals(StorageService.getUnbanAppeals());
    setBannedUsersMap(StorageService.getBannedUsers());
    setUsersList(StorageService.getAllUsers());
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [APPEAL_DESK] Appeal ${appealId} marked as ${status.toUpperCase()}`, ...prev]);
  };

  const handleOpenPasswordResetModal = (req: PasswordResetRequest) => {
    setSelectedPasswordRequest(req);
    setTempPasswordToIssue(`Gateway${Math.floor(1000 + Math.random() * 9000)}!`);
    setCopiedTempPass(false);
  };

  const handleConfirmIssuePassword = () => {
    if (!selectedPasswordRequest || !tempPasswordToIssue) return;
    StorageService.updateUserPassword(selectedPasswordRequest.phone, tempPasswordToIssue);
    StorageService.resolvePasswordResetRequest(selectedPasswordRequest.id);
    setPasswordRequests(StorageService.getPasswordResetRequests());
    setUsersList(StorageService.getAllUsers());
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [PWD_RECOVERY] Reset password for ${selectedPasswordRequest.phone} to temporary credential`, ...prev]);
    setSelectedPasswordRequest(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 font-sans isolate">
      
      {/* 0. Cyber-Futuristic Matrix / Binary Background (Strictly BEHIND all cards, tables and logs) */}
      <AdminCyberBackground enabled={backgroundMode !== 'off'} mode={backgroundMode === 'off' ? 'matrix' : backgroundMode} />

      {/* 1. Header Bar - Fully Responsive */}
      <header className="relative z-20 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/30 px-3 sm:px-4 py-3 sm:py-3.5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black shadow shrink-0">
            <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <h1 className="font-mono font-black text-sm sm:text-lg text-purple-400 truncate">
                DEV-CONSOLE
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40 shrink-0">
                0780699988
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
              Gateway Connect Flutter & Supabase Engine Telemetry
            </p>
          </div>
        </div>

        {/* Hacker-style Cyber Matrix Animation */}
        <div className="hidden lg:flex items-center gap-3">
          <MatrixRainCanvas />
        </div>

        {/* Desktop Header Actions - Compact Icon Buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Background</span>
            <select
              value={backgroundMode}
              onChange={event => handleBackgroundModeChange(event.target.value as typeof backgroundMode)}
              className="bg-transparent text-emerald-200 font-bold outline-none cursor-pointer"
              title="Choose developer console background animation"
            >
              <option value="off" className="bg-slate-900">Off</option>
              <option value="matrix" className="bg-slate-900">Matrix Rain</option>
              <option value="binary" className="bg-slate-900">Binary Flow</option>
              <option value="grid" className="bg-slate-900">Glowing Grid</option>
              <option value="terminal" className="bg-slate-900">Terminal Logs</option>
              <option value="neon" className="bg-slate-900">Neon Pulse</option>
              <option value="wifi" className="bg-slate-900">Wifi Bits</option>
              <option value="typing" className="bg-slate-900">Typing Effects</option>
            </select>
          </label>

          <button
            onClick={() => setShowPaynowModal(true)}
            title="Paynow Zimbabwe Config"
            className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenFlutterExport}
            title="Database & SQL Specs"
            className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          >
            <Database className="w-4 h-4" />
          </button>
          <button
            id="btn-close-dev-console"
            onClick={onClose}
            title="Exit Console"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Header Actions (3-Dots Tag & Exit) */}
        <div className="flex md:hidden items-center gap-1.5 relative">
          <select
            value={backgroundMode}
            onChange={event => handleBackgroundModeChange(event.target.value as typeof backgroundMode)}
            title="Choose background animation"
            className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 text-[0px] outline-none"
          >
            <option value="off" className="bg-slate-900 text-xs">Off</option>
            <option value="matrix" className="bg-slate-900 text-xs">Matrix Rain</option>
            <option value="binary" className="bg-slate-900 text-xs">Binary Flow</option>
            <option value="grid" className="bg-slate-900 text-xs">Glowing Grid</option>
            <option value="terminal" className="bg-slate-900 text-xs">Terminal Logs</option>
            <option value="neon" className="bg-slate-900 text-xs">Neon Pulse</option>
            <option value="wifi" className="bg-slate-900 text-xs">Wifi Bits</option>
            <option value="typing" className="bg-slate-900 text-xs">Typing Effects</option>
          </select>

          <button
            id="btn-dev-more-options"
            onClick={() => setShowMobileMenu(prev => !prev)}
            title="More Options"
            className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/40 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
          >
            <XCircle className="w-4 h-4" />
          </button>

          {/* 3-Dots Dropdown Menu */}
          {showMobileMenu && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Developer Actions
              </div>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleToggleCyberBackground();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Toggle Matrix FX ({showCyberBackground ? 'ON' : 'OFF'})</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenFlutterExport();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-500/20 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Database & SQL Specs</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowPaynowModal(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-500/20 flex items-center gap-2"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Paynow Zimbabwe Setup</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleTestSupabaseLive();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ping Supabase Edge</span>
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onClose();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/20 flex items-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Exit Dev Console</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Privacy Policy Banner */}
      <div className="bg-purple-950/40 border-b border-purple-500/30 px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] sm:text-xs text-purple-200 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate">
            <strong className="text-white">RLS Zero-Knowledge Privacy:</strong> Developer barred from confidential ledgers & altar petitions.
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] bg-purple-900/60 px-2 py-0.5 rounded font-mono shrink-0 ml-2">
          {supabaseConfig.isLiveConnected ? 'SUPABASE CONFIGURED' : 'SUPABASE NOT CONFIGURED'}
        </span>
      </div>

      {/* 3. Sub Tabs Navigation */}
      {/* Desktop Tab Bar */}
      <div className="hidden md:flex bg-slate-950 border-b border-slate-800 px-4 py-2 items-center gap-2 text-xs font-bold overflow-x-auto shrink-0">
        {[
          { id: 'telemetry', label: '⚡ Telemetry & Health', icon: Activity },
          { id: 'streamers', label: `📡 Stream Attendees (${activeStreamers.length} Live)`, icon: Radio },
          { id: 'bans', label: '🚫 Account Bans & Suspension', icon: ShieldOff },
          { id: 'appeals', label: `📩 Unban Appeals (${unbanAppeals.filter(a => a.status === 'pending').length})`, icon: Eye },
          { id: 'passwords', label: `🔑 Password Recovery (${passwordRequests.filter(p => p.status === 'pending').length})`, icon: KeyRound },
          { id: 'godmode', label: '👑 Godmode Account Control', icon: ShieldAlert },
          { id: 'schema', label: '🗄️ Supabase Postgres Schema', icon: Database },
          { id: 'logs', label: '📜 Live System Logs', icon: Terminal },
          { id: 'endpoints', label: '🌐 API Endpoints & Routes', icon: Layers },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Tab Dropdown Selector */}
      <div className="flex md:hidden bg-slate-950 border-b border-slate-800 px-3 py-2 items-center justify-between gap-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Module:</span>
        <div className="relative flex-1">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold appearance-none pr-8 focus:outline-none focus:border-purple-400"
          >
            {[
              { id: 'telemetry', label: '⚡ Telemetry & Health' },
              { id: 'streamers', label: `📡 Stream Attendees (${activeStreamers.length} Live / ${streamAttendees.length} Total)` },
              { id: 'bans', label: '🚫 Account Bans & Suspension' },
              { id: 'appeals', label: `📩 Unban Appeals (${unbanAppeals.filter(a => a.status === 'pending').length})` },
              { id: 'passwords', label: `🔑 Password Recovery (${passwordRequests.filter(p => p.status === 'pending').length})` },
              { id: 'godmode', label: '👑 Godmode Account Control' },
              { id: 'schema', label: '🗄️ Supabase Postgres Schema' },
              { id: 'logs', label: '📜 Live System Logs' },
              { id: 'endpoints', label: '🌐 API Endpoints & Routes' },
            ].map(tab => (
              <option key={tab.id} value={tab.id} className="bg-slate-900 text-white">
                {tab.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 4. Main Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-6xl w-full mx-auto space-y-4 font-mono">
        
        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Supabase Project Ref</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400 truncate">csinlqdcqdgcssdanvsr</span>
                </div>
                <p className="text-[10px] text-slate-500">PostgreSQL 15.x Live</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Supabase REST & Auth</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-white">{supabaseConfig.isLiveConnected ? 'CONFIGURED' : 'NOT CONFIGURED'}</span>
                </div>
                <p className="text-[10px] text-slate-500">Latency: {measuredLatency === null ? 'Not measured' : `${measuredLatency}ms`}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Paynow Zimbabwe</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${paynowConfig.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-sm font-bold text-white">
                    {paynowConfig.isConfigured ? `ACTIVE (${paynowConfig.integrationId})` : 'SETUP REQUIRED'}
                  </span>
                </div>
                <button
                  onClick={() => setShowPaynowModal(true)}
                  className="text-[10px] text-purple-400 hover:underline font-bold"
                >
                  Configure ID & Auth Key →
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Low-Data Cache</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">24kbps OPUS</span>
                </div>
                <p className="text-[10px] text-slate-500">Browser cache status: available</p>
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-300 uppercase">
                  Supabase & Network Diagnostics
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Target: {supabaseConfig.url}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleTestSupabaseLive}
                  disabled={isPingingSupabase}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isPingingSupabase ? 'Pinging...' : '⚡ Test Live Supabase Ping'}</span>
                </button>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white rounded-xl shadow flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL Script!' : '📋 Copy Supabase SQL Schema'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* CONGREGATION STREAM TRACKING & ATTENDANCE DATABASE TAB */}
        {activeTab === 'streamers' && (
          <div className="space-y-4">
            {/* Header and Actions */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <span>Congregation Stream Tracking & Attendance Database</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time and historic registry of believers streaming sermons. Tracks active streamers, where they are from, and their contact details for permanent database retention and pastoral follow-up.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadStreamAttendeesExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  title="Download attendees as Excel CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportStreamAttendees}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  title="Copy CSV to clipboard buffer"
                >
                  {copiedAttendeeData ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAttendeeData ? 'Copied' : 'Copy CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEndAndArchiveStream}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="End current active stream session and archive attendee durations to database"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>End Live Session & Archive</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshStreamers}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  title="Refresh attendance records"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Total Database Records</span>
                <span className="text-lg font-bold text-white">{streamAttendees.length}</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3">
                <span className="text-[11px] text-emerald-400 block">Active Streamers Now</span>
                <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{activeStreamers.length}</span>
                </span>
              </div>
              <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3">
                <span className="text-[11px] text-purple-300 block">Archived / Past Streams</span>
                <span className="text-lg font-bold text-purple-300">
                  {streamAttendees.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Cities Represented</span>
                <span className="text-lg font-bold text-[#D4AF37]">
                  {new Set(streamAttendees.map(a => a.city)).size} Hubs
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStreamFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    streamFilterMode === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({streamAttendees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStreamFilterMode('live')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    streamFilterMode === 'live'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Now ({activeStreamers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStreamFilterMode('completed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    streamFilterMode === 'completed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Concluded ({streamAttendees.filter(a => a.status === 'completed').length})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={streamSearch}
                    onChange={(e) => setStreamSearch(e.target.value)}
                    placeholder="Search name, phone, handle..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                  />
                </div>

                <select
                  value={streamCityFilter}
                  onChange={(e) => setStreamCityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-400 shrink-0"
                >
                  <option value="All">All Cities</option>
                  {SUPPORTED_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stream Attendees Database Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Stream Attendees Registry & Contact Details</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  DEV PERSISTENT STORE: congregation_stream_history
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3">Believer Profile</th>
                      <th className="p-3">Mobile & Contact Details</th>
                      <th className="p-3">City Location Hub</th>
                      <th className="p-3">Session Title</th>
                      <th className="p-3">Stream Timeline</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {streamAttendees
                      .filter(record => {
                        if (streamFilterMode === 'live' && record.status !== 'active') return false;
                        if (streamFilterMode === 'completed' && record.status !== 'completed') return false;
                        if (streamCityFilter !== 'All' && record.city !== streamCityFilter) return false;
                        if (streamSearch.trim()) {
                          const q = streamSearch.toLowerCase();
                          const matchName = record.user_name.toLowerCase().includes(q);
                          const matchPhone = record.user_phone.includes(q);
                          const matchHandle = record.user_handle.toLowerCase().includes(q);
                          return matchName || matchPhone || matchHandle;
                        }
                        return true;
                      })
                      .map(record => {
                        const isLive = record.status === 'active';
                        const isCopied = copiedContactPhone === record.user_phone;
                        return (
                          <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-[11px] text-purple-200 shrink-0">
                                {record.user_name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{record.user_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {record.user_handle.startsWith('@') ? record.user_handle : `@${record.user_handle}`}
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-purple-300 font-bold">{record.user_phone}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(record.user_phone);
                                    setCopiedContactPhone(record.user_phone);
                                    setTimeout(() => setCopiedContactPhone(null), 2000);
                                  }}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                  title="Copy phone number for database records"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-[#D4AF37] border border-white/10 inline-flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-[#D4AF37]" />
                                <span>{record.city}</span>
                              </span>
                            </td>

                            <td className="p-3 text-slate-300 font-sans max-w-[180px] truncate" title={record.session_title}>
                              {record.session_title}
                            </td>

                            <td className="p-3 text-[11px] font-mono text-slate-400">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-slate-300">
                                  Joined: {new Date(record.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {record.ended_at ? (
                                  <span className="text-slate-500">
                                    Ended: {new Date(record.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold">Streaming Now</span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              {isLive ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>LIVE</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                                  <span>CONCLUDED</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${record.user_name} | ${record.user_phone} | ${record.city} | Stream: ${record.session_title}`);
                                  setCopiedContactPhone(record.user_phone);
                                  setTimeout(() => setCopiedContactPhone(null), 2000);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-semibold transition-colors inline-flex items-center gap-1"
                                title="Copy full contact summary"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Info</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {streamAttendees.length === 0 && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Radio className="w-8 h-8 text-purple-400 mx-auto opacity-60" />
                  <p className="font-bold text-white text-sm">No Stream Attendees Logged Yet</p>
                  <p className="text-xs max-w-sm mx-auto">
                    When believers tune into live sermons, their profile, city location hub, and phone number are automatically recorded here and preserved for church records.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB - Hacker Style Telemetry */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-mono font-black text-emerald-400 uppercase tracking-wide">
                  Live System Logs & Network Telemetry
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isPausedLogs ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isPausedLogs ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                  <span>{isPausedLogs ? 'STREAM PAUSED' : 'LIVE STREAMING'}</span>
                </span>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    value={logsFilter}
                    onChange={(e) => setLogsFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400 w-36 sm:w-44 font-mono"
                  />
                </div>

                {/* Pause / Resume */}
                <button
                  type="button"
                  onClick={() => setIsPausedLogs(prev => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
                    isPausedLogs 
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
                  }`}
                  title={isPausedLogs ? 'Resume Realtime Stream' : 'Pause Realtime Stream'}
                >
                  {isPausedLogs ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  <span>{isPausedLogs ? 'Resume' : 'Pause'}</span>
                </button>

                {/* Auto-scroll toggle */}
                <button
                  type="button"
                  onClick={() => setAutoScrollLogs(prev => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                    autoScrollLogs 
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/40' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Auto-Scroll: {autoScrollLogs ? 'ON' : 'OFF'}
                </button>

                {/* Export text */}
                <button
                  type="button"
                  onClick={handleExportLogs}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1 transition-all border border-slate-700"
                  title="Export telemetry logs to .txt file"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export</span>
                </button>

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-mono font-bold transition-all border border-rose-800/40"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div 
              ref={logsContainerRef}
              className="bg-black/95 p-4 rounded-xl border border-emerald-950/60 text-xs space-y-2 max-h-[460px] overflow-y-auto font-mono shadow-inner custom-scrollbar"
            >
              {logs
                .filter(log => !logsFilter || log.toLowerCase().includes(logsFilter.toLowerCase()))
                .map((log, i) => {
                  const isPulse = log.includes('[REALTIME_PULSE]') || log.includes('[STREAM');
                  const isGodmode = log.includes('[GODMODE_') || log.includes('[BAN_DESK]');
                  const isAuth = log.includes('[AUTH]') || log.includes('[PWD_RECOVERY]');
                  const isError = log.includes('[ERROR]') || log.includes('ERR') || log.includes('Failed');

                  return (
                    <div 
                      key={i} 
                      className={`leading-relaxed py-0.5 px-1.5 rounded transition-colors flex items-start gap-2 ${
                        isError ? 'text-rose-400 bg-rose-950/20 border-l-2 border-rose-500' :
                        isGodmode ? 'text-purple-300 bg-purple-950/15 border-l-2 border-purple-500' :
                        isAuth ? 'text-cyan-300 bg-cyan-950/15 border-l-2 border-cyan-500' :
                        isPulse ? 'text-emerald-300 bg-emerald-950/10 border-l-2 border-emerald-500' :
                        'text-slate-300 hover:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-slate-600 select-none text-[10px] shrink-0 pt-0.5">
                        {String(i + 1).padStart(3, '0')}
                      </span>
                      <span className="break-all whitespace-pre-wrap">{log}</span>
                    </div>
                  );
                })}

              {logs.filter(log => !logsFilter || log.toLowerCase().includes(logsFilter.toLowerCase())).length === 0 && (
                <div className="text-slate-500 text-center py-8">
                  No logs matching "{logsFilter}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCHEMA TAB */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-sm">Supabase Database Setup Guide</span>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c29e2e] text-[#001F3F] text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied Full SQL!' : 'Copy schema.sql Script'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To create all tables, Row Level Security (RLS) policies, and foreign keys in your Supabase project (<code className="text-emerald-400 font-mono">csinlqdcqdgcssdanvsr</code>):
              </p>
              <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1 font-mono">
                <li>Go to your Supabase Dashboard and click <strong className="text-purple-300">SQL Editor</strong> on the left menu (icon <code className="text-amber-400">&gt;_</code>).</li>
                <li>Click <strong className="text-purple-300">+ New Query</strong>.</li>
                <li>Paste the copied script and click <strong className="text-emerald-400">Run</strong>.</li>
              </ol>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-purple-400 uppercase">Gateway Church Postgres Tables</h4>
                <button
                  onClick={onOpenFlutterExport}
                  className="text-xs text-purple-400 hover:text-purple-300 underline font-bold"
                >
                  View Full schema.sql File →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['users', 'sermons', 'devotionals', 'groups', 'events', 'prayer_requests', 'donations', 'products', 'orders', 'service_bookings', 'joe_vibes', 'push_notifications'].map(tbl => (
                  <div key={tbl} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300 flex items-center justify-between">
                    <div>
                      <span className="text-purple-400 font-bold">public.</span>{tbl}
                    </div>
                    <span className="text-[10px] text-emerald-400">RLS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === 'endpoints' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-purple-400 uppercase">Supabase REST & WebSocket Channels</h4>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-emerald-400 font-bold">WS realtime:livestream-chat</span>
                <span className="text-slate-500">Public broadcast / Amen reactions</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-emerald-400 font-bold">POST /rest/v1/prayer_requests</span>
                <span className="text-slate-500">Auto-triggers Apostle push notification</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-emerald-400 font-bold">POST /rest/v1/donations</span>
                <span className="text-slate-500">EcoCash *151# / Paynow Webhook</span>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS & PROFILES TAB (DEVELOPER PORTAL ONLY) */}
        {/* GODMODE ACCOUNT CONTROL TAB */}
        {activeTab === 'godmode' && (
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-white text-base">
                    Developer Godmode Master Console
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Exclusive to Developer <strong>0780699988</strong>: Penetrate any account session, modify credentials & roles, or delete rogue records.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300 font-mono text-xs border border-purple-500/50 font-black shrink-0">
                GODMODE LEVEL 0 ACCESS
              </span>
            </div>

            {penetrateStatus && (
              <div className="p-3 bg-purple-950/60 border border-purple-500/60 rounded-xl text-xs text-purple-200 flex items-center justify-between">
                <span>{penetrateStatus}</span>
                <button
                  onClick={() => setPenetrateStatus(null)}
                  className="text-slate-400 hover:text-white ml-2 text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* User Search & Summary */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, phone, or city..."
                  value={godmodeSearch}
                  onChange={(e) => setGodmodeSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span>Total Records: <strong className="text-white">{usersList.length}</strong></span>
                  <span>•</span>
                  <span>Cities: <strong className="text-[#D4AF37]">{new Set(usersList.map(u => u.city_location || 'Harare')).size}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadUsersExcel}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
                  title="Download all users to Excel CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Believer / Member</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Verification Badge</th>
                    <th className="p-3">City Location</th>
                    <th className="p-3 text-right">Developer Godmode Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {usersList
                    .filter(u => {
                      const q = (godmodeSearch || '').toLowerCase().trim();
                      if (!q) return true;
                      return (
                        (u.full_name || '').toLowerCase().includes(q) ||
                        (u.phone || '').includes(q) ||
                        (u.handle || '').toLowerCase().includes(q) ||
                        (u.member_id || '').toLowerCase().includes(q) ||
                        (u.city_location || '').toLowerCase().includes(q) ||
                        (u.location || '').toLowerCase().includes(q)
                      );
                    })
                    .map(u => {
                      const isDev = u.phone === '0780699988';
                      const isCurrentUser = StorageService.getCurrentUser()?.phone === u.phone;
                      const isBanned = !!StorageService.getBannedUsers()[u.phone];
                      const isMenuOpen = activeUserMenuId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-950/60 transition-colors">
                          <td className="p-3 font-sans font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isCurrentUser ? 'bg-emerald-400 animate-ping' : isBanned ? 'bg-red-500' : 'bg-slate-500'}`} />
                              <span>{u.full_name}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                                  YOU
                                </span>
                              )}
                              {isBanned && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono">
                                  BANNED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300 font-bold">{u.phone}</td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              u.role === 'super_admin' ? 'bg-[#D4AF37] text-[#001F3F]' :
                              u.role === 'developer' ? 'bg-purple-600 text-white' :
                              u.role === 'moderator' ? 'bg-blue-600 text-white' :
                              'bg-slate-700 text-slate-200'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {u.is_verified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{u.badge_type === 'gold' ? 'Gold' : 'Verified'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <span>Standard</span>
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleVerificationBadge(u)}
                                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all border ${
                                  u.is_verified
                                    ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
                                    : 'bg-blue-950/40 text-blue-300 border-blue-500/30 hover:bg-blue-900/60'
                                }`}
                                title={u.is_verified ? 'Revoke Verification Badge' : 'Grant Verified Badge'}
                              >
                                {u.is_verified ? 'Remove Badge' : 'Grant Badge'}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400">
                            {u.city_location || 'Harare'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 relative">
                              {/* Penetrate Button */}
                              <button
                                onClick={() => {
                                  const res = StorageService.developerPenetrateAccount(u.phone);
                                  if (res.success && res.user) {
                                    setPenetrateStatus(`✓ Penetrated: Now impersonating ${u.full_name} (${u.phone})`);
                                    if (onSwitchUser) onSwitchUser(res.user);
                                    setLogs(prev => [
                                      `[${new Date().toLocaleTimeString()}] [GODMODE_PENETRATE] Impersonating ${u.full_name} (${u.phone})`,
                                      ...prev
                                    ]);
                                  } else {
                                    setPenetrateStatus(`Error: ${res.error}`);
                                  }
                                }}
                                title="Penetrate / Impersonate Account"
                                className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-[11px] font-sans font-bold transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Penetrate</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditFullName(u.full_name);
                                  setEditRole(u.role);
                                  setEditCity(u.city_location || 'Harare');
                                  setEditPassword('');
                                  setEditVerified(Boolean(u.is_verified));
                                }}
                                title="Edit Account Details"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-bold transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              {/* Ban / Unban */}
                              {!isDev && (
                                <button
                                  onClick={() => {
                                    if (isBanned) {
                                      StorageService.unbanUser(u.phone);
                                    } else {
                                      StorageService.banUser(u.phone, 'Developer Godmode Security Action');
                                    }
                                    setUsersList(StorageService.getAllUsers());
                                    setLogs(prev => [
                                      `[${new Date().toLocaleTimeString()}] [GODMODE_BAN] Toggled ban status for ${u.phone}`,
                                      ...prev
                                    ]);
                                  }}
                                  title={isBanned ? 'Lift Ban' : 'Ban User'}
                                  className={`px-2 py-1 rounded text-[11px] font-sans font-bold transition-colors flex items-center gap-1 ${
                                    isBanned
                                      ? 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                                      : 'bg-amber-900/60 text-amber-200 hover:bg-amber-900'
                                  }`}
                                >
                                  {isBanned ? <ShieldAlert className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                                  <span>{isBanned ? 'Unban' : 'Ban'}</span>
                                </button>
                              )}

                              {/* 3-Dot Action Menu Button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveUserMenuId(isMenuOpen ? null : u.id)}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="More Account Actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {isMenuOpen && (
                                  <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl bg-slate-900 border border-purple-500/40 shadow-2xl p-1.5 space-y-1 text-left font-sans animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleVerificationBadge(u);
                                        setActiveUserMenuId(null);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-purple-600/30 rounded-lg flex items-center gap-2 font-medium"
                                    >
                                      <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                                      <span>{u.is_verified ? 'Remove Verification' : 'Grant Verified Badge'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDirectPasswordReset(u);
                                        setActiveUserMenuId(null);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-purple-600/30 rounded-lg flex items-center gap-2 font-medium"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Reset Password</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditFullName(u.full_name);
                                        setEditRole(u.role);
                                        setEditCity(u.city_location || 'Harare');
                                        setEditPassword('');
                                        setEditVerified(Boolean(u.is_verified));
                                        setActiveUserMenuId(null);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-purple-600/30 rounded-lg flex items-center gap-2 font-medium"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Edit Profile</span>
                                    </button>

                                    {!isDev && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isBanned) {
                                            StorageService.unbanUser(u.phone);
                                          } else {
                                            StorageService.banUser(u.phone, 'Developer 3-Dot Action');
                                          }
                                          setUsersList(StorageService.getAllUsers());
                                          setActiveUserMenuId(null);
                                        }}
                                        className="w-full px-2.5 py-1.5 text-left text-xs text-amber-300 hover:bg-amber-950/40 rounded-lg flex items-center gap-2 font-medium"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>{isBanned ? 'Lift Suspension' : 'Suspend Account'}</span>
                                      </button>
                                    )}

                                    {!isDev && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveUserMenuId(null);
                                          if (window.confirm(`Permanently delete account ${u.full_name} (${u.phone})?`)) {
                                            const res = StorageService.developerDeleteAccount(u.phone);
                                            if (res.success) {
                                              setUsersList(StorageService.getAllUsers());
                                              setPenetrateStatus(`✓ Purged ${u.phone}`);
                                            } else {
                                              alert(res.error);
                                            }
                                          }
                                        }}
                                        className="w-full px-2.5 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 font-medium border-t border-slate-800"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Purge Account</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal for Direct Password Reset */}
            {passwordModalUser && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-purple-500 rounded-2xl p-5 max-w-sm w-full space-y-4 text-white font-sans shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Reset Password: {passwordModalUser.phone}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPasswordModalUser(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">
                    Set a new password for <strong>{passwordModalUser.full_name}</strong>. This update will immediately sync to Supabase auth in realtime.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-semibold">New Password</label>
                    <input
                      type="text"
                      value={manualPasswordInput}
                      onChange={(e) => setManualPasswordInput(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPasswordModalUser(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDirectPassword}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                    >
                      Sync Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Editing User */}
            {editingUser && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-purple-500 rounded-2xl p-5 max-w-md w-full space-y-4 text-white font-sans">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      <span>Godmode Edit: {editingUser.phone}</span>
                    </h4>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setEditRole(r);
                          if (r === 'super_admin' || r === 'moderator') {
                            setEditVerified(true);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-400"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Pastor / Moderator (Blue Badge)</option>
                        <option value="super_admin">Super Admin (Gold Badge)</option>
                        <option value="developer">Developer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City Location Hub</label>
                      <select
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-400"
                      >
                        {[
                          'Harare',
                          'Bulawayo',
                          'Chitungwiza',
                          'Mutare',
                          'Gweru',
                          'Kwekwe',
                          'Kadoma',
                          'Masvingo',
                          'Marondera',
                          'Hwange',
                          'Other In Zimbabwe',
                          'Out Of Zimbabwe'
                        ].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Override Password (leave blank to keep current)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter new password to force-reset"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-purple-400"
                      >
                      </input>
                    </div>

                    {/* God Mode Verification Badge Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <BadgeCheck className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-200 font-bold">Verification Badge</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Grant or revoke official verification checkmark
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditVerified(prev => !prev)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          editVerified
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {editVerified ? 'Verified ✓' : 'Unverified (Standard)'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        let finalBadge: 'none' | 'silver' | 'blue' | 'gold' = editVerified ? 'blue' : 'none';
                        let finalVerified = editVerified;

                        if (editRole === 'super_admin') {
                          finalBadge = 'gold';
                          finalVerified = true;
                        } else if (editRole === 'moderator') {
                          finalBadge = 'blue';
                          finalVerified = true;
                        }

                        const updates: any = {
                          full_name: editFullName.trim(),
                          role: editRole,
                          city_location: editCity,
                          is_verified: finalVerified,
                          badge_type: finalBadge
                        };
                        if (editPassword.trim()) {
                          updates.password = editPassword.trim();
                        }
                        const targetId = editingUser.id || editingUser.phone;
                        const res = StorageService.developerEditAccount(targetId, updates);
                        if (res.success) {
                          StorageService.developerSetVerificationBadge(targetId, finalVerified, finalBadge);
                          setUsersList(StorageService.getAllUsers());
                          setEditingUser(null);
                          setPenetrateStatus(`✓ Successfully updated ${editingUser.full_name} (${targetId})`);
                          setLogs(prev => [
                            `[${new Date().toLocaleTimeString()}] [GODMODE_EDIT] Updated account details for ${editingUser.full_name} (${targetId}) (Role: ${editRole}, Verified: ${finalVerified}, Badge: ${finalBadge})`,
                            ...prev
                          ]);
                        } else {
                          alert(res.error);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BANS TAB */}
        {activeTab === 'bans' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-rose-400" />
                  <span>Developer Account Suspension & Bans</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Platform-wide account suspension engine. Suspended accounts are barred from login and presented with an appeal gateway.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleBanAllStandard}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Suspend all non-admin accounts"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspend All Standard</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreAllAccounts}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Restore and unban all accounts"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Restore All Accounts</span>
                </button>
              </div>
            </div>

            {/* Status Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block">Total Database Users</span>
                <span className="text-lg font-bold text-white">{usersList.length}</span>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3">
                <span className="text-[11px] text-emerald-400 block">Active Believers</span>
                <span className="text-lg font-bold text-emerald-400">{usersList.length - Object.keys(bannedUsersMap).length}</span>
              </div>
              <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-3">
                <span className="text-[11px] text-rose-400 block">Suspended / Banned</span>
                <span className="text-lg font-bold text-rose-400">{Object.keys(bannedUsersMap).length}</span>
              </div>
              <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3">
                <span className="text-[11px] text-purple-300 block">Pending Appeals</span>
                <span className="text-lg font-bold text-purple-300">{unbanAppeals.filter(a => a.status === 'pending').length}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-3 flex items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={banSearch}
                  onChange={(e) => setBanSearch(e.target.value)}
                  placeholder="Filter users by name, phone, or handle..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {usersList.length} members loaded
              </span>
            </div>

            {/* Member Accounts & Ban Controls Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">Member Accounts & Ban Status</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  DEV-MANAGED ACCESS CONTROL
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 font-mono">
                    <tr>
                      <th className="p-3">Member Profile</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {usersList
                      .filter(u => {
                        const q = (banSearch || '').toLowerCase().trim();
                        if (!q) return true;
                        return (
                          (u.full_name || '').toLowerCase().includes(q) ||
                          (u.phone || '').includes(q) ||
                          (u.handle || '').toLowerCase().includes(q) ||
                          (u.member_id || '').toLowerCase().includes(q) ||
                          (u.city_location || '').toLowerCase().includes(q) ||
                          (u.location || '').toLowerCase().includes(q)
                        );
                      })
                      .map(u => {
                        const banEntry = bannedUsersMap[u.id] || (u.phone ? bannedUsersMap[u.phone] : undefined);
                        const isBanned = Boolean(banEntry || u.is_banned);
                        const reason = banEntry?.reason || u.ban_reason;
                        const isProtected = u.role === 'super_admin' || u.role === 'developer';

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 flex items-center gap-2.5">
                              <img 
                                src={u.avatar_url || '/assets/apostle_joe_daniels_main.jpg'} 
                                alt={u.full_name} 
                                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0" 
                              />
                              <div>
                                <span className="font-bold text-white block">{u.full_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{u.handle || u.member_id}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                              {u.phone}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              {isBanned ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                                  <Ban className="w-2.5 h-2.5" />
                                  <span>SUSPENDED ({reason || 'Dev ban'})</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>ACTIVE</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {isProtected ? (
                                <span className="text-[10px] text-slate-500 italic">Protected Role</span>
                              ) : isBanned ? (
                                <button
                                  onClick={() => handleToggleBanUser(u)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Unban Member</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleBanUser(u)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Suspend / Ban</span>
                                </button>
                              )}
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

        {/* UNBAN APPEALS TAB */}
        {activeTab === 'appeals' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>Unban Appeal Desk</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Appeals submitted by suspended members. Review requests and approve restoration or reject.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/40">
                {unbanAppeals.filter(a => a.status === 'pending').length} Pending
              </span>
            </div>

            {unbanAppeals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-white text-sm">No Pending Appeals</p>
                <p className="text-xs">All submitted member unban requests have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unbanAppeals.map(appeal => (
                  <div
                    key={appeal.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{appeal.user_name}</span>
                          <span className="text-xs font-mono text-purple-300">({appeal.user_phone})</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            appeal.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            appeal.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {appeal.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Submitted: {new Date(appeal.created_at).toLocaleString()}
                        </span>
                      </div>

                      {appeal.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveAppeal(appeal.id, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Unban</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveAppeal(appeal.id, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 transition-all shadow"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Reject Appeal</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Appeal Statement / Justification:</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{appeal.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASSWORD RECOVERY DESK TAB */}
        {activeTab === 'passwords' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Password Recovery Management Desk</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct developer password recovery. Issue temporary credentials with 1-click database synchronization.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/40">
                {passwordRequests.filter(p => p.status === 'pending').length} Pending Requests
              </span>
            </div>

            {/* Direct Instant Password Reset Tool for Any Account */}
            <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Direct Account Password Override (Real-Time)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Select any registered member to immediately generate or set a new password, synchronized across devices.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    const user = usersList.find(u => u.id === e.target.value);
                    if (user) {
                      handleDirectPasswordReset(user);
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-400"
                >
                  <option value="" disabled>Select member to reset...</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.phone}) - {u.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {passwordRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-white text-sm">No Pending Password Requests</p>
                <p className="text-xs">No believers are currently awaiting password assistance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passwordRequests.map(req => {
                  const targetUser = usersList.find(u => u.phone === req.phone);
                  return (
                    <div
                      key={req.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{req.user_name}</span>
                            <span className="text-xs font-mono text-[#D4AF37]">({req.phone})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              req.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Requested on: {new Date(req.created_at).toLocaleString()}
                          </span>
                        </div>

                        {req.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordResetModal(req)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Issue Temp Password</span>
                          </button>
                        )}
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Member Note / System Log:</span>
                        <p className="leading-relaxed">{req.note}</p>
                        {targetUser && (
                          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3 text-[11px] text-slate-400">
                            <span>Account Found: <strong className="text-white">{targetUser.full_name}</strong></span>
                            <span>Role: <strong className="text-purple-300">{targetUser.role}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SUSPEND / BAN MEMBER MODAL */}
      {userToBan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Suspend Believer Account</h3>
              </div>
              <button
                onClick={() => setUserToBan(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <img
                  src={userToBan.avatar_url || '/assets/apostle_joe_daniels_main.jpg'}
                  alt={userToBan.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">{userToBan.full_name}</h4>
                  <p className="text-xs font-mono text-slate-400">Phone: {userToBan.phone}</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Reason for Suspension (Visible to member on appeal screen):
                </label>
                <textarea
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  placeholder="e.g. Inappropriate community postings, unauthorized solicitation, or policy violation..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setUserToBan(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE TEMPORARY PASSWORD MODAL */}
      {selectedPasswordRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Issue Temporary Password</h3>
              </div>
              <button
                onClick={() => setSelectedPasswordRequest(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Believer:</span>
                  <span className="text-white font-bold">{selectedPasswordRequest.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Phone:</span>
                  <span className="text-[#D4AF37] font-mono font-bold">{selectedPasswordRequest.phone}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Temporary Secure Password (Auto-generated):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPasswordToIssue}
                    onChange={(e) => setTempPasswordToIssue(e.target.value)}
                    className="flex-1 bg-slate-950 border border-purple-500/40 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPasswordToIssue);
                      setCopiedTempPass(true);
                      setTimeout(() => setCopiedTempPass(false), 2000);
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-bold text-xs border border-purple-500/40 flex items-center gap-1"
                  >
                    {copiedTempPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTempPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Clicking "Save & Issue" will immediately write this password to the database and resolve the request.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPasswordRequest(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIssuePassword}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Issue Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PaynowConfigModal
        isOpen={showPaynowModal}
        onClose={() => setShowPaynowModal(false)}
      />

    </div>
  );
};
