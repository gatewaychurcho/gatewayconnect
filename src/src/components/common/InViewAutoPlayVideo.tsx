import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface InViewAutoPlayVideoProps {
  src: string;
  poster?: string;
  className?: string;
  title?: string;
}

export const InViewAutoPlayVideo: React.FC<InViewAutoPlayVideoProps> = ({
  src,
  poster,
  className = '',
  title = 'Community Video'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [progress, setProgress] = useState(0);

  // Global listener to ensure only ONE video plays at any time across the entire feed
  useEffect(() => {
    const handleOtherVideoPlay = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.src !== src && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('gcz_active_video_play', handleOtherVideoPlay);
    return () => {
      window.removeEventListener('gcz_active_video_play', handleOtherVideoPlay);
    };
  }, [src]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // IntersectionObserver to auto-play ONLY when on-screen in viewport (>= 60% visible)
    // and pause immediately as soon as it scrolls offscreen to prevent disorder
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // Attempt autoplay (muted by default for strict browser autoplay policies)
            video.muted = true;
            setIsMuted(true);
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  // Announce this video is playing so any other video pauses
                  window.dispatchEvent(new CustomEvent('gcz_active_video_play', { detail: { src } }));
                })
                .catch(() => {
                  setIsPlaying(false);
                });
            }
          } else {
            // Immediately pause offscreen videos to keep silence and orderly feed
            if (!video.paused) {
              video.pause();
            }
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0, 0.3, 0.6, 0.9],
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        window.dispatchEvent(new CustomEvent('gcz_active_video_play', { detail: { src } }));
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 700);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  return (
    <div
      ref={containerRef}
      onClick={togglePlayPause}
      className={`relative w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none group ${className}`}
      title={title}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={isMuted}
        loop
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full max-h-[480px] object-contain"
      />

      {/* Play / pause icon flash */}
      {showCenterIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 animate-in fade-in zoom-in duration-200">
          <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
            {isPlaying ? <Play className="w-6 h-6 fill-current ml-0.5" /> : <Pause className="w-6 h-6 fill-current" />}
          </div>
        </div>
      )}

      {/* Floating Sound Toggle Pill */}
      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px]">Tap for sound</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px]">Sound on</span>
          </>
        )}
      </button>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
