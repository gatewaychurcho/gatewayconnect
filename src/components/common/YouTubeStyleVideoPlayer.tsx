import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface YouTubeStyleVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isLive?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export const YouTubeStyleVideoPlayer: React.FC<YouTubeStyleVideoPlayerProps> = ({
  src,
  poster,
  title = 'Sanctuary Live Stream • Gateway Cathedral',
  isLive = false,
  className = '',
  autoPlay = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(poster || null);

  // Auto-hide controls timeout
  const controlsTimeoutRef = useRef<any>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Capture first frame as poster if not provided
  useEffect(() => {
    if (poster) {
      setGeneratedPoster(poster);
      return;
    }

    if (!src) return;

    // Create an offscreen video element to capture frame at 0.5s
    const offscreenVideo = document.createElement('video');
    offscreenVideo.crossOrigin = 'anonymous';
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;
    offscreenVideo.src = src;

    const handleLoadedData = () => {
      try {
        offscreenVideo.currentTime = Math.min(0.5, (offscreenVideo.duration || 1) / 2);
      } catch {
        // ignore
      }
    };

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = offscreenVideo.videoWidth || 640;
        canvas.height = offscreenVideo.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(offscreenVideo, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.length > 100) {
            setGeneratedPoster(dataUrl);
          }
        }
      } catch {
        // Ignore canvas tainted errors
      } finally {
        offscreenVideo.remove();
      }
    };

    offscreenVideo.addEventListener('loadeddata', handleLoadedData);
    offscreenVideo.addEventListener('seeked', handleSeeked);
    offscreenVideo.load();

    return () => {
      offscreenVideo.removeEventListener('loadeddata', handleLoadedData);
      offscreenVideo.removeEventListener('seeked', handleSeeked);
      offscreenVideo.src = '';
    };
  }, [src, poster]);

  // Handle Play / Pause toggle
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback to muted play if browser blocks sound autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Handle Mute toggle
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.8;
      setVolume(0.8);
    }
  };

  // Handle Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const mutedState = val === 0;
      videoRef.current.muted = mutedState;
      setIsMuted(mutedState);
    }
  };

  // Handle Seek / Scrub
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Handle Fullscreen toggle
  const toggleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Show controls on mouse move and auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Setup initial play on mount / src change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setIsBuffering(true);

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsBuffering(false);
      // Seek slightly forward to force frame render if browser holds black frame
      if (video.currentTime === 0 && !autoPlay) {
        try { video.currentTime = 0.05; } catch {}
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const onError = () => {
      setIsBuffering(false);
      setHasError(true);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    if (autoPlay) {
      video.play().catch(() => {
        // Autoplay policy: try muted
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {
          setIsPlaying(false);
          setIsBuffering(false);
        });
      });
    }

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
    };
  }, [src, autoPlay]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => togglePlay()}
      className={`relative aspect-video w-full bg-black overflow-hidden group select-none flex items-center justify-center cursor-pointer ${className}`}
    >
      {/* HTML5 Video Element with Key prop to guarantee reload on src change */}
      <video
        key={src}
        ref={videoRef}
        src={src}
        poster={generatedPoster || undefined}
        preload="auto"
        playsInline
        webkit-playsinline="true"
        className="w-full h-full object-contain bg-black"
      />

      {/* Top Header Overlay: Apostle branding & Title (YouTube style) */}
      <div 
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between pointer-events-none ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate pr-4">
          <img
            src="/assets/apostle_joe_daniels_main.jpg"
            alt="Apostle Joe Daniels"
            className="w-8 h-8 rounded-full object-cover border border-primary/50 shrink-0 shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100';
            }}
          />
          <div className="truncate text-left leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-white drop-shadow truncate">
                {title}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/70">
              <span>Apostle Joe Daniels Official</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-rose-400 font-bold uppercase">
                  <Radio className="w-2.5 h-2.5" />
                  Live Broadcast
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Big YouTube Centered Play Button (shown when paused or waiting) */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-20 transition-transform active:scale-90"
        >
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/75 hover:bg-red-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-110 cursor-pointer group/play"
            title="Play Video"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white text-white drop-shadow" />
          </div>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center z-30">
          <p className="text-white text-xs sm:text-sm font-semibold mb-2">Video playback could not be loaded</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* YouTube Style Bottom Controls Bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 sm:p-3 transition-opacity duration-300 z-20 flex flex-col gap-1.5 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Clickable / Scrubbable Red Progress Bar */}
        <div className="relative w-full flex items-center group/scrub">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-600 group-hover/scrub:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, #dc2626 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-xs pt-1">
          <div className="flex items-center gap-3">
            {/* Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="hover:text-red-500 transition-colors cursor-pointer p-1"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume / Mute Button & Slider */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="hover:text-red-500 transition-colors cursor-pointer p-1"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 accent-red-600 cursor-pointer hidden sm:block opacity-70 hover:opacity-100"
              />
            </div>

            {/* Time Display (e.g. 0:02 / 45:10) */}
            <span className="text-[11px] font-mono text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-red-500 transition-colors cursor-pointer p-1"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
