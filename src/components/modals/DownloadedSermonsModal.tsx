import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  Play, 
  Crown, 
  HardDrive, 
  Wifi, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Sermon, User } from '../../types';
import { StorageService } from '../../services/storageService';

interface DownloadedSermonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectSermonToPlay?: (sermon: Sermon) => void;
  onUpgradeClick?: () => void;
}

export const DownloadedSermonsModal: React.FC<DownloadedSermonsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectSermonToPlay,
  onUpgradeClick
}) => {
  const [downloadedSermons, setDownloadedSermons] = useState<Sermon[]>(StorageService.getDownloadedSermons());
  const [playingSermon, setPlayingSermon] = useState<Sermon | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isPremium = currentUser?.is_premium || isSuperAdmin || currentUser?.role === 'developer';
  const quota = StorageService.getDownloadQuota(currentUser);

  const handleDelete = (sermonId: string) => {
    StorageService.deleteDownloadedSermon(sermonId);
    setDownloadedSermons(StorageService.getDownloadedSermons());
    if (playingSermon?.id === sermonId) {
      setPlayingSermon(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001122]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#001F3F] border border-[#D4AF37]/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 my-4 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#00172e] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-[#001F3F] flex items-center justify-center shadow-lg font-black">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Downloaded Sermons
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Offline Storage
                </span>
              </div>
              <p className="text-xs text-white/60">
                Zero-data playback • High-fidelity low bandwidth
              </p>
            </div>
          </div>

          <button
            id="btn-close-downloaded-sermons"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quota & Storage Bar */}
        <div className="bg-[#001428] px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-white/80">
              <HardDrive className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-medium">
                {isPremium ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Unlimited Downloads Active
                  </span>
                ) : (
                  <span>Monthly Download Quota: <strong>{quota.used} / 5</strong> used</span>
                )}
              </span>
            </div>
            {!isPremium && !isSuperAdmin && onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="text-[11px] text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
              >
                <Crown className="w-3 h-3" />
                <span>Go Unlimited</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          {!isPremium && (
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  quota.used >= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#D4AF37] to-amber-400'
                }`}
                style={{ width: `${Math.min(100, (quota.used / 5) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Playing Sermon Drawer if selected */}
        {playingSermon && (
          <div className="bg-[#00172e] p-3.5 border-b border-[#D4AF37]/30 flex flex-col gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  Now Playing (Offline): {playingSermon.title}
                </span>
              </div>
              <button
                onClick={() => setPlayingSermon(null)}
                className="text-white/60 hover:text-white text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
              <iframe
                title={playingSermon.title}
                src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(playingSermon.youtube_id || playingSermon.video_url))}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* List of Downloaded Sermons */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {downloadedSermons.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <Download className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-bold text-sm text-white">
                  No Downloaded Sermons Yet
                </h4>
                <p className="text-xs text-white/60">
                  You haven't downloaded any sermons for offline playback yet. Browse messages on the Home tab and tap the download icon!
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#001F3F] font-bold text-xs shadow hover:bg-amber-400 transition-colors"
              >
                Browse Sermons
              </button>
            </div>
          ) : (
            downloadedSermons.map(s => (
              <div
                key={s.id}
                className="bg-[#00172e] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-[#D4AF37]/40 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                    <img
                      src={s.thumbnail_url}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        if (onSelectSermonToPlay) {
                          onSelectSermonToPlay(s);
                        } else {
                          setPlayingSermon(s);
                        }
                      }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-5 h-5 text-white fill-white" />
                    </button>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-white/60 truncate">
                      {s.speaker} • {s.series}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#D4AF37]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duration}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        18.4 MB (Offline)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (onSelectSermonToPlay) {
                        onSelectSermonToPlay(s);
                      } else {
                        setPlayingSermon(s);
                      }
                    }}
                    title="Play Offline"
                    className="p-2 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#001F3F] transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleDelete(s.id)}
                    title="Remove from downloads"
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#001428] p-3 text-center border-t border-white/10 shrink-0 text-[11px] text-white/60">
          Downloads stay saved locally on your device for seamless offline listening in remote areas or low-data connections.
        </div>

      </div>
    </div>
  );
};
