import React, { useState, useEffect } from 'react';
import { ExternalLink, Radio, RefreshCw, Tv, AlertCircle, Play } from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface FacebookStreamPlayerProps {
  embedUrl: string;
  directUrl?: string;
  title?: string;
  isLivePageHub?: boolean;
  isLive?: boolean;
  className?: string;
}

export const FacebookStreamPlayer: React.FC<FacebookStreamPlayerProps> = ({
  embedUrl: initialEmbedUrl,
  directUrl: initialDirectUrl = 'https://www.facebook.com/ApostleJoeDaniels/live',
  title: initialTitle = 'Sanctuary Live Stream - Apostle Joe Daniels',
  isLivePageHub = false,
  isLive = false,
  className = ''
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showDirectCard, setShowDirectCard] = useState(isLivePageHub);
  
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState(initialEmbedUrl);
  const [currentDirectUrl, setCurrentDirectUrl] = useState(initialDirectUrl);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [isResolving, setIsResolving] = useState(false);

  // Auto-resolve Facebook share links (e.g. /share/v/...) to canonical numeric video IDs
  useEffect(() => {
    let isMounted = true;
    setCurrentEmbedUrl(initialEmbedUrl);
    setCurrentDirectUrl(initialDirectUrl);
    setCurrentTitle(initialTitle);

    if (initialDirectUrl && (initialDirectUrl.includes('/share/') || initialDirectUrl.includes('fb.watch'))) {
      setIsResolving(true);
      StorageService.resolveFacebookUrl(initialDirectUrl).then((resolved) => {
        if (!isMounted) return;
        setIsResolving(false);
        if (resolved && resolved.success) {
          if (resolved.embedUrl) setCurrentEmbedUrl(resolved.embedUrl);
          if (resolved.canonicalUrl) setCurrentDirectUrl(resolved.canonicalUrl);
          if (resolved.title) setCurrentTitle(resolved.title);
          if (resolved.thumbnailUrl) setThumbnailUrl(resolved.thumbnailUrl);
        }
      }).catch(() => {
        if (isMounted) setIsResolving(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [initialEmbedUrl, initialDirectUrl, initialTitle]);

  const handleRefresh = () => {
    setReloadKey(prev => prev + 1);
    setHasLoaded(false);
  };

  return (
    <div className={`relative aspect-video w-full bg-black overflow-hidden group select-none ${className}`}>
      {/* Underlying Facebook iframe */}
      {!showDirectCard && currentEmbedUrl && (
        <iframe
          key={`${reloadKey}-${currentEmbedUrl}`}
          id="facebook-stream-iframe"
          className="w-full h-full border-0 relative z-10"
          src={currentEmbedUrl}
          title={currentTitle}
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          onLoad={() => setHasLoaded(true)}
        />
      )}

      {/* Floating Top Header Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
        {/* Live / Video Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-white shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {isLive ? 'Facebook Live' : 'Facebook Video'}
          </span>
          {isResolving && (
            <span className="text-[9px] text-blue-300 animate-pulse">· Resolving...</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowDirectCard(!showDirectCard)}
            className="p-1.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black transition-colors shadow-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            title={showDirectCard ? 'Show Embed Player' : 'Switch to Direct Mode'}
          >
            <Tv className="w-3 h-3" />
            <span className="hidden sm:inline">{showDirectCard ? 'Embed Player' : 'Direct Hub'}</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black transition-colors shadow-lg cursor-pointer"
            title="Reload Video Player"
            aria-label="Reload stream player"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={currentDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold backdrop-blur-md border border-blue-400/30 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Watch full screen on Facebook"
          >
            <span>Watch on FB</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Floating Bottom Help Helper (if Facebook privacy prevents embedded playback) */}
      {!showDirectCard && (
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-auto flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">If "Video unavailable" appears, tap to watch directly on Facebook</span>
          </div>
          <a
            href={currentDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-semibold underline shrink-0 ml-2"
          >
            Open FB
          </a>
        </div>
      )}

      {/* Live Page Hub / Direct Card (Displayed when the URL is a Facebook Page /live hub or when toggled) */}
      {showDirectCard && (
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/85 to-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="relative mb-3">
            <img
              src={thumbnailUrl || "/assets/apostle_joe_daniels_main.jpg"}
              alt="Apostle Joe Daniels"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/50 shadow-2xl"
            />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[8px] font-black">
                ●
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider uppercase mb-1.5">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Apostolic Live Broadcast Altar</span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white max-w-sm leading-tight mb-1">
            {currentTitle || 'Sanctuary Live Stream with Apostle Joe Daniels'}
          </h3>

          <p className="text-xs text-white/70 max-w-xs mb-4 leading-relaxed">
            Stream high-definition broadcast directly from the official Facebook altar.
          </p>

          <div className="flex items-center gap-2">
            <a
              href={currentDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl transition-transform active:scale-95 border border-blue-400/30 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Facebook Live</span>
            </a>
            <button
              onClick={() => setShowDirectCard(false)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Try Embed Player
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
