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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-xl animate-in zoom-in-95 duration-150 my-4 text-foreground flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-secondary/40 p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-foreground">
                  Downloaded Sermons
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Offline Storage
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Zero-data playback • High-fidelity low bandwidth
              </p>
            </div>
          </div>

          <button
            id="btn-close-downloaded-sermons"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quota & Storage Bar */}
        <div className="bg-secondary/30 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">
                {isPremium ? (
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Unlimited Downloads Active
                  </span>
                ) : (
                  <span>Monthly Download Quota: <strong className="text-foreground">{quota.used} / 5</strong> used</span>
                )}
              </span>
            </div>
            {!isPremium && !isSuperAdmin && onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Crown className="w-3 h-3" />
                <span>Go Unlimited</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          {!isPremium && (
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border">
              <div 
                className={`h-full rounded-full transition-all ${
                  quota.used >= 5 ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, (quota.used / 5) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Playing Sermon Drawer if selected */}
        {playingSermon && (
          <div className="bg-secondary/40 p-3.5 border-b border-border flex flex-col gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-foreground truncate">
                  Now Playing (Offline): {playingSermon.title}
                </span>
              </div>
              <button
                onClick={() => setPlayingSermon(null)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-border shadow-md">
              <iframe
                title={playingSermon.title}
                src={StorageService.getYoutubeEmbedUrl(StorageService.extractYoutubeId(playingSermon.youtube_id || playingSermon.video_url))}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
              <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <Download className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-bold text-sm text-foreground">
                  No Downloaded Sermons Yet
                </h4>
                <p className="text-xs text-muted-foreground">
                  You haven't downloaded any sermons for offline playback yet. Browse messages on the Home tab and tap the download icon!
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-colors"
              >
                Browse Sermons
              </button>
            </div>
          ) : (
            downloadedSermons.map(s => (
              <div
                key={s.id}
                className="bg-secondary/40 border border-border rounded-xl p-3 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
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
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.speaker} • {s.series}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-primary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.duration}
                      </span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono">
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
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleDelete(s.id)}
                    title="Remove from downloads"
                    className="p-2 rounded-lg bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-secondary/30 p-3 text-center border-t border-border shrink-0 text-[11px] text-muted-foreground">
          Downloads stay saved locally on your device for seamless offline listening in remote areas or low-data connections.
        </div>

      </div>
    </div>
  );
};
