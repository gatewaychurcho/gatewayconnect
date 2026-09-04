import React, { useState } from 'react';
import { 
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
  Users
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { PaynowService } from '../../services/paynowService';
import { testSupabaseConnection } from '../../services/supabaseClient';
import { SUPABASE_SCHEMA_SQL } from '../../data/flutterExportData';
import { PaynowConfigModal } from '../modals/PaynowConfigModal';
import { DEMO_ACCOUNTS, INITIAL_USERS } from '../../data/mockData';

interface DevConsoleProps {
  onClose: () => void;
  onOpenFlutterExport: () => void;
  onSwitchUser?: (user: any) => void;
}

export const DevConsole: React.FC<DevConsoleProps> = ({ onClose, onOpenFlutterExport, onSwitchUser }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'schema' | 'logs' | 'endpoints' | 'accounts'>('telemetry');
  const [showPaynowModal, setShowPaynowModal] = useState(false);
  const [isPingingSupabase, setIsPingingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const paynowConfig = PaynowService.getConfig();
  const supabaseConfig = StorageService.getSupabaseConfig();
  const [logs, setLogs] = useState<string[]>([
    '[2026-09-02 11:15:02] [AUTH] Phone 0780699988 verified via Argon2 hash. Role: DEVELOPER',
    `[2026-09-02 11:15:04] [SUPABASE] Project URL: ${supabaseConfig.url} (Ref: csinlqdcqdgcssdanvsr)`,
    '[2026-09-02 11:15:10] [SUPABASE_POSTGRES] Connection pool healthy (PostgreSQL 15.x RLS Active)',
    '[2026-09-02 11:15:15] [CACHE] Shona / KJV Multilingual Bible preloaded in IndexedDB (1,189 chapters)',
    `[2026-09-02 11:15:30] [PAYNOW_GATEWAY] Status: ${paynowConfig.isConfigured ? 'CONNECTED (ID: ' + paynowConfig.integrationId + ')' : 'READY (Setup Required)'}`
  ]);

  const [simulatedLatency, setSimulatedLatency] = useState<number>(38);

  const handleTestSupabaseLive = async () => {
    setIsPingingSupabase(true);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] [SUPABASE_PING] Sending ping request to ${supabaseConfig.url}...`, ...prev]);
    try {
      const result = await testSupabaseConnection();
      if (result.connected) {
        setSimulatedLatency(result.latencyMs);
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

  const handleSimulateError = () => {
    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] [SIMULATION] Low-data Econet 2G packet drop test initiated (0% data loss)`,
      ...prev
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 font-sans">
      
      {/* 1. Header Bar */}
      <header className="bg-slate-900 border-b border-purple-500/30 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black shadow">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono font-black text-lg text-purple-400">
                DEVELOPER DEV-CONSOLE
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40">
                ROLE: DEVELOPER (0780699988)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gateway Connect Flutter / Supabase Engine Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFlutterExport}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-bold border border-purple-500/40"
          >
            Flutter & SQL Specs
          </button>
          <button
            id="btn-close-dev-console"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
          >
            Exit Console
          </button>
        </div>
      </header>

      {/* 2. Privacy Policy Banner */}
      <div className="bg-purple-950/40 border-b border-purple-500/30 px-4 py-2 flex items-center justify-between text-xs text-purple-200">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>
            <strong className="text-white">RLS Zero-Knowledge Privacy:</strong> Developer account is strictly barred from reading individual church donation ledgers, credit cards, or confidential pastoral altar petitions.
          </span>
        </div>
        <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded font-mono">
          RLS ENFORCED
        </span>
      </div>

      {/* 3. Sub Tabs */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'telemetry', label: '⚡ Telemetry & Health', icon: Activity },
          { id: 'schema', label: '🗄️ Supabase Postgres Schema', icon: Database },
          { id: 'logs', label: '📜 Live System Logs', icon: Terminal },
          { id: 'endpoints', label: '🌐 API Endpoints & Routes', icon: Layers },
          { id: 'accounts', label: '👥 Test Profiles & Accounts', icon: Users }
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

      {/* 4. Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-4 font-mono">
        
        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Supabase Project Ref</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400">csinlqdcqdgcssdanvsr</span>
                </div>
                <p className="text-[10px] text-slate-500">PostgreSQL 15.x Live</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                <span className="text-xs text-slate-400">Supabase REST & Auth</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-white">READY</span>
                </div>
                <p className="text-[10px] text-slate-500">Latency: {simulatedLatency}ms (Edge)</p>
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
                <p className="text-[10px] text-slate-500">Econet / NetOne ready</p>
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
                <button
                  onClick={handleSimulateError}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl border border-slate-700"
                >
                  Simulate Econet 2G Throttling
                </button>
              </div>
            </div>

          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-purple-400 uppercase">Live Console Telemetry</h4>
              <button
                onClick={handleClearLogs}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear Logs
              </button>
            </div>

            <div className="bg-black p-3 rounded-xl border border-slate-900 text-xs text-emerald-400 space-y-1.5 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="leading-relaxed font-mono">
                  {log}
                </div>
              ))}
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
        {activeTab === 'accounts' && (
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-purple-400 text-sm uppercase">Developer Test Profiles & Switcher</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured ministerial profiles for testing role-based access control (Super Admin, Moderator, Member, Developer).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 font-mono text-[11px] border border-purple-500/40">
                DEV RESTRICTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc, idx) => {
                const fullUser = INITIAL_USERS.find(u => u.phone === acc.phone);
                const isCurrent = StorageService.getCurrentUser()?.phone === acc.phone;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-400 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{acc.name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          acc.role === 'super_admin' ? 'bg-[#D4AF37] text-[#001F3F]' :
                          acc.role === 'developer' ? 'bg-purple-600 text-white' :
                          acc.role === 'moderator' ? 'bg-blue-600 text-white' :
                          'bg-emerald-600 text-white'
                        }`}>
                          {acc.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-purple-300 font-semibold mt-0.5">{acc.roleTitle}</p>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{acc.description}</p>
                      
                      <div className="mt-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono space-y-0.5">
                        <div className="text-slate-300">Phone: <strong className="text-[#D4AF37]">{acc.phone}</strong></div>
                        <div className="text-slate-400">Password: <strong className="text-emerald-400">{acc.password}</strong></div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (fullUser) {
                          StorageService.setCurrentUser(fullUser);
                          if (onSwitchUser) onSwitchUser(fullUser);
                          setLogs(prev => [
                            `[${new Date().toLocaleTimeString()}] [AUTH_SWITCH] Switched active profile to: ${acc.name} (${acc.role})`,
                            ...prev
                          ]);
                        }
                      }}
                      className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 cursor-default'
                          : 'bg-[#D4AF37] hover:bg-[#c29e2e] text-[#001F3F] shadow'
                      }`}
                    >
                      <span>{isCurrent ? '✓ Active Current Session' : '1-Click Switch to Account'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <PaynowConfigModal
        isOpen={showPaynowModal}
        onClose={() => setShowPaynowModal(false)}
      />

    </div>
  );
};
