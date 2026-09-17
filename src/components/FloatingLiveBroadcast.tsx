import React, { useState, useEffect } from 'react';
import { Radio, Tv, Users, X, ChevronRight, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { LiveStreamViewer } from '../types';

interface FloatingLiveBroadcastProps {
  onOpenStream?: () => void;
  currentUser?: any;
  onWatchLive?: () => void;
  onOpenInteractiveModal?: () => void;
}

export const FloatingLiveBroadcast: React.FC<FloatingLiveBroadcastProps> = ({ 
  onOpenStream, 
  currentUser,
  onWatchLive,
  onOpenInteractiveModal
}) => {
  const [liveStatus, setLiveStatus] = useState(() => StorageService.getLiveSermonStatus());
  const [streamViewers, setStreamViewers] = useState<LiveStreamViewer[]>(() => StorageService.getStreamViewers());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      const updated = e?.detail || StorageService.getLiveSermonStatus();
      setLiveStatus(updated);
      if (updated?.isLive) {
        setIsDismissed(false); // Un-dismiss when live starts
      }
    };

    const handleBroadcastStarted = (e: any) => {
      const updated = e?.detail || StorageService.getLiveSermonStatus();
      setLiveStatus(updated);
      setIsDismissed(false);
      setIsMinimized(false);
    };

    const handleViewersUpdate = () => {
      setStreamViewers(StorageService.getStreamViewers());
    };

    window.addEventListener('gcz_live_status_updated', handleStatusUpdate);
    window.addEventListener('gcz_live_broadcast_started', handleBroadcastStarted);
    window.addEventListener('gcz_stream_viewers_updated', handleViewersUpdate);
    window.addEventListener('gcz_stream_viewer_joined', handleViewersUpdate);
    window.addEventListener('gcz_stream_viewer_left', handleViewersUpdate);

    return () => {
      window.removeEventListener('gcz_live_status_updated', handleStatusUpdate);
      window.removeEventListener('gcz_live_broadcast_started', handleBroadcastStarted);
      window.removeEventListener('gcz_stream_viewers_updated', handleViewersUpdate);
      window.removeEventListener('gcz_stream_viewer_joined', handleViewersUpdate);
      window.removeEventListener('gcz_stream_viewer_left', handleViewersUpdate);
    };
  }, []);

  if (!liveStatus?.isLive || isDismissed) {
    return null;
  }

  const viewerCount = Math.max(streamViewers.length, liveStatus.viewerCount || 1);

  if (isMinimized) {
    return (
      <div 
        id="floating-live-minimized"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-16 sm:bottom-20 right-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all border border-white/20"
        title="Live Broadcast Active"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        <Radio className="w-3 h-3 animate-pulse" />
        <span className="text-[10px] font-black tracking-wider uppercase">LIVE</span>
      </div>
    );
  }

  return (
    <aside
      id="floating-live-broadcast-card"
      aria-label="Live Sanctuary Broadcast"
      className="fixed bottom-16 sm:bottom-20 right-3 z-40 bg-card/95 backdrop-blur-md border border-red-500/40 rounded-full pl-2.5 pr-1.5 py-1 text-foreground shadow-lg transition-all flex items-center gap-2 max-w-[260px] sm:max-w-[300px]"
    >
      <div 
        onClick={() => {
          if (onOpenInteractiveModal) onOpenInteractiveModal();
          if (onOpenStream) onOpenStream();
          window.dispatchEvent(new CustomEvent('gcz_open_live_stream'));
        }}
        className="flex items-center gap-1.5 cursor-pointer min-w-0"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-[9px] font-black tracking-wider uppercase text-white bg-red-600 px-1.5 py-0.5 rounded-xs shrink-0">
          LIVE
        </span>
        <span className="text-[11px] font-medium text-foreground truncate max-w-[140px] sm:max-w-[170px]">
          {liveStatus.title ? liveStatus.title.split('•')[0].trim() : 'Sanctuary Live'}
        </span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          id="btn-live-float-minimize"
          onClick={() => setIsMinimized(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition-colors"
          title="Minimize"
        >
          <span className="text-[10px] leading-none block -mt-1 font-bold">_</span>
        </button>
        <button
          id="btn-live-float-close"
          onClick={() => setIsDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition-colors"
          title="Dismiss"
          aria-label="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};

export default FloatingLiveBroadcast;
