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
  ExternalLink
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface DevConsoleProps {
  onClose: () => void;
  onOpenFlutterExport: () => void;
}

export const DevConsole: React.FC<DevConsoleProps> = ({ onClose, onOpenFlutterExport }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'schema' | 'logs' | 'endpoints'>('telemetry');
  const [logs, setLogs] = useState<string[]>([
    '[2026-09-02 11:15:02] [AUTH] Phone 0780699988 verified via Argon2 hash. Role: DEVELOPER',
    '[2026-09-02 11:15:04] [PRIVACY_ENFORCER] Blocked table access: `donations.amount`, `prayer_requests.private_notes` (RLS Active)',
    '[2026-09-02 11:15:10] [STREAM_ENGINE] WebRTC RTMP ingest connected. Adaptive bitrate: 24kbps-1080p',
    '[2026-09-02 11:15:15] [CACHE] Shona / KJV Multilingual Bible preloaded in IndexedDB (1,189 chapters)',
    '[2026-09-02 11:15:22] [SUPABASE_POSTGRES] Connection pool healthy (12/20 active connections)'
  ]);

  const [simulatedLatency, setSimulatedLatency] = useState<number>(42);

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
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-xs font-bold">
        {[
          { id: 'telemetry', label: '⚡ Telemetry & Health', icon: Activity },
          { id: 'schema', label: '🗄️ Supabase Postgres Schema', icon: Database },
          { id: 'logs', label: '📜 Live System Logs', icon: Terminal },
          { id: 'endpoints', label: '🌐 API Endpoints & Routes', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-4 font-mono">
        
        {/* TELEMETRY TAB */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400">PostgreSQL Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-white">ONLINE (Supabase)</span>
                </div>
                <p className="text-[11px] text-slate-500">Latency: {simulatedLatency}ms (Harare AWS Edge)</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Low-Data Cache Engine</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-base font-bold text-amber-400">24kbps OPUS READY</span>
                </div>
                <p className="text-[11px] text-slate-500">Optimized for Econet / NetOne</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400">App Version</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-purple-400">v2.4.0-PROD</span>
                </div>
                <p className="text-[11px] text-slate-500">Flutter 3.24.x + Supabase Flutter SDK</p>
              </div>
            </div>

            {/* Test Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-purple-300 uppercase">
                Diagnostic Simulations
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSimulateError}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl border border-slate-700"
                >
                  Simulate Zimbabwe Econet 2G Network Throttling
                </button>
                <button
                  onClick={() => setSimulatedLatency(Math.floor(Math.random() * 30) + 20)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl border border-slate-700"
                >
                  Ping Supabase Realtime Edge
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-purple-400 uppercase">Active Supabase Postgres Tables</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {['users', 'sermons', 'devotionals', 'groups', 'events', 'prayer_requests', 'donations', 'products', 'orders', 'service_bookings', 'joe_vibes', 'push_notifications'].map(tbl => (
                <div key={tbl} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <span className="text-purple-400 font-bold">public.</span>{tbl}
                </div>
              ))}
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

      </div>

    </div>
  );
};
