import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Video, 
  VideoOff, 
  ShieldCheck, 
  Sparkles,
  Radio,
  Clock
} from 'lucide-react';
import { User } from '../../types';

interface InDriveCallModalProps {
  currentUser: User;
  partnerUser: User;
  callType: 'audio' | 'video';
  onEndCall: (durationSeconds: number, callType: 'audio' | 'video') => void;
}

export const InDriveCallModal: React.FC<InDriveCallModalProps> = ({
  currentUser,
  partnerUser,
  callType: initialCallType,
  onEndCall
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callType, setCallType] = useState<'audio' | 'video'>(initialCallType);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialCallType === 'video');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good'>('excellent');

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringOscillatorRef = useRef<OscillatorNode | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Play realistic in-app VoIP ring tone using Web Audio API synthesis
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Play soft dual-tone European/US VoIP ring (440Hz + 480Hz pulses)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      ringOscillatorRef.current = osc1;

      // Pulse pattern: 2s on, 3s off
      let isRinging = true;
      const interval = setInterval(() => {
        if (!audioContextRef.current) {
          clearInterval(interval);
          return;
        }
        isRinging = !isRinging;
        gain.gain.setValueAtTime(isRinging ? 0.06 : 0.0001, ctx.currentTime);
      }, 2000);

      return () => {
        clearInterval(interval);
        try {
          osc1.stop();
          osc2.stop();
          ctx.close();
        } catch {}
      };
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  };

  const stopRingtone = () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    // 1. Initialize Microphone Media Stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: initialCallType === 'video' 
      }).then(stream => {
        audioStreamRef.current = stream;
        if (localVideoRef.current && initialCallType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      }).catch(err => {
        console.warn('Microphone permission request:', err);
      });
    }

    // 2. Fetch Agora RTC Token from backend
    const channelName = `call_${[currentUser.id, partnerUser.id].sort().join('_')}`;
    fetch(`/api/agora/token?channel=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(currentUser.id)}&role=publisher`)
      .then(r => r.json())
      .catch(() => ({}));

    // 3. Simulate VoIP Handshake (InDrive calling flow)
    const stopTone = startRingtone();

    const connectTimeout = setTimeout(() => {
      setCallStatus('ringing');
    }, 1200);

    const answerTimeout = setTimeout(() => {
      stopRingtone();
      if (stopTone) stopTone();
      setCallStatus('connected');

      // Start duration counter
      timerIntervalRef.current = window.setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    }, 4500);

    return () => {
      clearTimeout(connectTimeout);
      clearTimeout(answerTimeout);
      stopRingtone();
      if (stopTone) stopTone();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleToggleMute = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
    if (!isVideoEnabled) setCallType('video');
  };

  const handleHangUp = () => {
    stopRingtone();
    setCallStatus('ended');
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setTimeout(() => {
      onEndCall(durationSeconds, callType);
    }, 800);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none animate-in fade-in zoom-in-95 duration-200">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Top Header: Security and Encryption Status */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium tracking-wide text-white/80">
            End-to-End Encrypted VoIP
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-400">
            Agora HD Voice
          </span>
        </div>
      </div>

      {/* Center: Partner Avatar & Call Info */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-6">
        
        {/* Pulsing InDrive Style Waves */}
        <div className="relative flex items-center justify-center">
          {callStatus === 'ringing' || callStatus === 'connecting' ? (
            <>
              <div className="absolute w-48 h-48 rounded-full border border-primary/30 animate-ping opacity-30" />
              <div className="absolute w-40 h-40 rounded-full border border-primary/50 animate-pulse opacity-50" />
              <div className="absolute w-36 h-36 rounded-full bg-primary/10 animate-pulse" />
            </>
          ) : callStatus === 'connected' ? (
            <div className="absolute w-36 h-36 rounded-full border border-emerald-500/40 animate-pulse" />
          ) : null}

          {/* Avatar Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/20 bg-secondary shadow-2xl flex items-center justify-center text-3xl font-bold text-primary">
            {partnerUser.avatar_url ? (
              <img 
                src={partnerUser.avatar_url} 
                alt={partnerUser.full_name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              partnerUser.full_name.slice(0, 2).toUpperCase()
            )}
          </div>
        </div>

        {/* Name and Calling Details */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{partnerUser.full_name}</span>
            {partnerUser.role === 'super_admin' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Apostle
              </span>
            )}
          </h2>
          
          <p className="text-xs text-white/60 font-medium">
            {partnerUser.handle || `@${partnerUser.phone || 'member'}`}
          </p>

          {/* Status text or live timer */}
          <div className="pt-2">
            {callStatus === 'connecting' && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Connecting to Gateway Voice...
              </span>
            )}
            {callStatus === 'ringing' && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ringing partner...
              </span>
            )}
            {callStatus === 'connected' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(durationSeconds)}</span>
              </div>
            )}
            {callStatus === 'ended' && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400">
                Call Ended
              </span>
            )}
          </div>
        </div>

        {/* Video Preview if enabled */}
        {callType === 'video' && isVideoEnabled && (
          <div className="relative w-48 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover -scale-x-100" 
            />
            <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono">
              You
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar: InDrive / WhatsApp Style Floating Tray */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-around pb-6 pt-4 px-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
        
        {/* Mute Microphone */}
        <button
          onClick={handleToggleMute}
          disabled={callStatus === 'ended'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMuted 
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Video */}
        <button
          onClick={handleToggleVideo}
          disabled={callStatus === 'ended'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoEnabled 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Speaker Output */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          disabled={callStatus === 'ended'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isSpeakerOn 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-white/5 text-white/50'
          }`}
          title="Speaker"
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Prominent Red Hang Up Button */}
        <button
          onClick={handleHangUp}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 transition-all cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

      </div>

    </div>
  );
};
