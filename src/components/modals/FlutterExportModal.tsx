import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Database, 
  Smartphone, 
  Layers, 
  BookOpen, 
  ExternalLink 
} from 'lucide-react';
import { FLUTTER_EXPORT_DATA } from '../../data/flutterExportData';

interface FlutterExportModalProps {
  onClose: () => void;
}

export const FlutterExportModal: React.FC<FlutterExportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'pubspec' | 'structure' | 'screens'>('sql');
  const [selectedScreen, setSelectedScreen] = useState<string>('main.dart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col overflow-hidden text-slate-100">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-amber-500/30 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif-church font-black text-lg text-amber-400">
              Gateway Connect Flutter & Supabase Code Export
            </h2>
            <p className="text-xs text-slate-400">
              Ready-to-run Dart codebase & PostgreSQL migration schema for Apostle Joe Daniels Ministry.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
        >
          Close
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sql')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'sql' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>schema.sql (Supabase Tables & RLS)</span>
        </button>

        <button
          onClick={() => setActiveTab('pubspec')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'pubspec' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>pubspec.yaml</span>
        </button>

        <button
          onClick={() => setActiveTab('structure')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'structure' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Project Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('screens')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'screens' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Flutter Dart Source Files</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 max-w-6xl w-full mx-auto">
        
        {activeTab === 'sql' && (
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-mono text-amber-400 font-bold">supabase/schema.sql (PostgreSQL + RLS + Functions)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(FLUTTER_EXPORT_DATA.supabaseSql, 'sql')}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
                >
                  {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sql' ? 'Copied SQL!' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={() => handleDownload('schema.sql', FLUTTER_EXPORT_DATA.supabaseSql)}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-300 leading-relaxed bg-black/40">
              {FLUTTER_EXPORT_DATA.supabaseSql}
            </pre>
          </div>
        )}

        {activeTab === 'pubspec' && (
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-mono text-amber-400 font-bold">pubspec.yaml</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(FLUTTER_EXPORT_DATA.pubspecYaml, 'pubspec')}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
                >
                  {copiedKey === 'pubspec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pubspec' ? 'Copied pubspec!' : 'Copy pubspec.yaml'}</span>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-300 leading-relaxed bg-black/40">
              {FLUTTER_EXPORT_DATA.pubspecYaml}
            </pre>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-mono text-amber-400 font-bold">Flutter Mobile Project Directory Architecture</span>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-amber-300 leading-relaxed bg-black/40">
              {FLUTTER_EXPORT_DATA.flutterProjectStructure}
            </pre>
          </div>
        )}

        {activeTab === 'screens' && (
          <div className="flex-1 flex flex-col sm:flex-row bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Screen file selector */}
            <div className="w-full sm:w-64 bg-slate-950 border-r border-slate-800 p-2 space-y-1 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">Dart Source Files</span>
              {Object.keys(FLUTTER_EXPORT_DATA.dartCodeSamples).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedScreen(key)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-mono transition-all ${
                    selectedScreen === key 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  📄 {key}
                </button>
              ))}
            </div>

            {/* Screen code preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-mono text-amber-400 font-bold">lib/{selectedScreen}</span>
                <button
                  onClick={() => handleCopy(FLUTTER_EXPORT_DATA.dartCodeSamples[selectedScreen as keyof typeof FLUTTER_EXPORT_DATA.dartCodeSamples] || '', selectedScreen)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
                >
                  {copiedKey === selectedScreen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === selectedScreen ? 'Copied Dart Code!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-emerald-400 leading-relaxed bg-black/40">
                {FLUTTER_EXPORT_DATA.dartCodeSamples[selectedScreen as keyof typeof FLUTTER_EXPORT_DATA.dartCodeSamples] || '// Select a file'}
              </pre>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
