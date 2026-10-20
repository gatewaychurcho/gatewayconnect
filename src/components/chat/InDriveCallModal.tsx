import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Radio,
  Clock,
  CheckCircle2,
  ArrowLeft,
  X
} from 'lucide-react';
import { User } from '../../types';
import { liveSyncService, CallSignalPayload } from '../../services/liveSyncService';
import { StorageService } from '../../services/storageService';

export interface InDriveCallModalProps {
  currentUser: User;
  partnerUser: User;
  isIncoming?: boolean;
  incomingCallId?: string;
  onEndCall: (durationSeconds: number, callResultText?: string) => void;
  onAcceptIncoming?: () => void;
  onDeclineIncoming?: () => void;
}

export const InDriveCallModal: React.FC<InDriveCallModalProps> = ({
  currentUser,
  partnerUser,
  isIncoming = false,
  incomingCallId,
  onEndCall,
  onAcceptIncoming,
  onDeclineIncoming
}) => {
  // Call status: incoming, calling (outgoing ringback), ringing (callee acked), connected, ended, declined, no_answer
  const [callStatus, setCallStatus] = useState<'incoming' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'no_answer'>(
    isIncoming ? 'incoming' : 'calling'
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [callId] = useState<string>(() => incomingCallId || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const callTimeoutRef = useRef<any>(null);

  // Play realistic in-app VoIP ring / ringback tone using Web Audio API synthesis
  const startRingtone = (mode: 'incoming' | 'outgoing') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      if (mode === 'incoming') {
        // High alert pleasant dual chime (523Hz + 659Hz - C5 + E5)
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
      } else {
        // Standard US/Europe PBX dial ringback (440Hz + 480Hz)
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      let isSoundOn = true;
      const intervalMs = mode === 'incoming' ? 1400 : 2000;
      ringIntervalRef.current = setInterval(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          clearInterval(ringIntervalRef.current);
          return;
        }
        isSoundOn = !isSoundOn;
        try {
          gain.gain.setValueAtTime(isSoundOn ? 0.06 : 0.0001, ctx.currentTime);
        } catch {}
      }, intervalMs);
    } catch {
      // AudioContext unavailable
    }
  };

  const stopRingtone = () => {
    try {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    } catch {}
  };

  // Initialize WebRTC Peer Connection for real 2-way microphone voice audio
  const setupWebRTC = async (isInitiator: boolean) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      });
      peerConnectionRef.current = pc;

      // Handle remote incoming audio stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (!remoteAudioRef.current) {
            const audioEl = new Audio();
            audioEl.autoplay = true;
            remoteAudioRef.current = audioEl;
          }
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Send local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          liveSyncService.sendCallSignal({
            callId,
            action: 'candidate' as any,
            caller: {
              id: currentUser.id,
              full_name: currentUser.full_name,
              avatar_url: currentUser.avatar_url
            },
            targetUserId: partnerUser.id,
            candidate: event.candidate
          } as any);
        }
      };

      // Get local microphone stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = stream;
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        } catch (micErr) {
          console.warn('Microphone permission not granted or device missing:', micErr);
        }
      }

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        liveSyncService.sendCallSignal({
          callId,
          action: 'offer_sdp' as any,
          caller: {
            id: currentUser.id,
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url
          },
          targetUserId: partnerUser.id,
          sdp: offer
        } as any);
      }
    } catch (err) {
      console.warn('WebRTC initialization warning:', err);
    }
  };

  // Lifecycle & Signal Listener
  useEffect(() => {
    if (isIncoming) {
      startRingtone('incoming');
      // If receiver doesn't answer in 35s, auto dismiss
      callTimeoutRef.current = setTimeout(() => {
        handleHangUp('missed');
      }, 35000);
    } else {
      // Outgoing call: play dial tone and broadcast offer
      startRingtone('outgoing');
      liveSyncService.sendCallSignal({
        callId,
        action: 'offer',
        caller: {
          id: currentUser.id,
          full_name: currentUser.full_name,
          avatar_url: currentUser.avatar_url,
          role: currentUser.role
        },
        targetUserId: partnerUser.id,
        channelName: `indrive_call_${callId}`,
        timestamp: Date.now()
      });

      // Timeout for unanswered outgoing call (35 seconds)
      callTimeoutRef.current = setTimeout(() => {
        stopRingtone();
        setCallStatus('no_answer');
        liveSyncService.sendCallSignal({
          callId,
          action: 'hangup',
          caller: { id: currentUser.id, full_name: currentUser.full_name },
          targetUserId: partnerUser.id
        });
        setTimeout(() => {
          onEndCall(0, '📞 Missed Call');
        }, 1800);
      }, 35000);
    }

    // Listen for peer call signals
    const handleSignal = (e: any) => {
      const signal: CallSignalPayload & { sdp?: any; candidate?: any } = e?.detail;
      if (!signal || signal.callId !== callId) return;

      // When callee acknowledges ringing
      if (signal.action === 'ringing' && callStatus === 'calling') {
        setCallStatus('ringing');
      }

      // When callee accepts call
      if (signal.action === 'accept') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        stopRingtone();
        setCallStatus('connected');
        setupWebRTC(true);
      }

      // When SDP offer arrives (on receiver side)
      if ((signal.action as any) === 'offer_sdp' && signal.sdp && peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(async () => {
          if (peerConnectionRef.current) {
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            liveSyncService.sendCallSignal({
              callId,
              action: 'answer_sdp' as any,
              caller: { id: currentUser.id, full_name: currentUser.full_name },
              targetUserId: partnerUser.id,
              sdp: answer
            } as any);
          }
        }).catch(() => {});
      }

      // When SDP answer arrives (on caller side)
      if ((signal.action as any) === 'answer_sdp' && signal.sdp && peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch(() => {});
      }

      // When ICE candidate arrives
      if ((signal.action as any) === 'candidate' && signal.candidate && peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
      }

      // When peer declines call
      if (signal.action === 'decline') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        stopRingtone();
        setCallStatus('declined');
        setTimeout(() => {
          onEndCall(0, '📞 Declined Call');
        }, 1500);
      }

      // When peer hangs up
      if (signal.action === 'hangup') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        stopRingtone();
        setCallStatus('ended');
        const dur = durationSeconds;
        setTimeout(() => {
          const m = Math.floor(dur / 60);
          const s = dur % 60;
          const durText = `${m}m ${s.toString().padStart(2, '0')}s`;
          onEndCall(dur, dur > 0 ? `📞 Voice Call (${durText})` : '📞 Missed Call');
        }, 800);
      }
    };

    window.addEventListener('gcz_call_signal', handleSignal);

    return () => {
      window.removeEventListener('gcz_call_signal', handleSignal);
      stopRingtone();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch {}
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, [callId]);

  // Duration Timer when call is connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callStatus]);

  // Accept Incoming Call
  const handleAccept = () => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    stopRingtone();
    setCallStatus('connected');
    setupWebRTC(false);

    liveSyncService.sendCallSignal({
      callId,
      action: 'accept',
      caller: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url
      },
      targetUserId: partnerUser.id
    });

    if (onAcceptIncoming) onAcceptIncoming();
  };

  // Decline Incoming Call
  const handleDecline = () => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    stopRingtone();
    setCallStatus('declined');

    // Save to persistent call logs
    try {
      StorageService.saveCallLog({
        caller_id: isIncoming ? partnerUser.id : currentUser.id,
        caller_name: isIncoming ? partnerUser.full_name : currentUser.full_name,
        caller_avatar: isIncoming ? partnerUser.avatar_url : currentUser.avatar_url,
        caller_handle: isIncoming ? partnerUser.handle : currentUser.handle,
        receiver_id: isIncoming ? currentUser.id : partnerUser.id,
        receiver_name: isIncoming ? currentUser.full_name : partnerUser.full_name,
        receiver_avatar: isIncoming ? currentUser.avatar_url : partnerUser.avatar_url,
        receiver_handle: isIncoming ? currentUser.handle : partnerUser.handle,
        type: isIncoming ? 'missed' : 'outgoing',
        duration_seconds: 0,
        status: 'declined'
      });
    } catch {}

    liveSyncService.sendCallSignal({
      callId,
      action: 'decline',
      caller: {
        id: currentUser.id,
        full_name: currentUser.full_name
      },
      targetUserId: partnerUser.id
    });

    if (onDeclineIncoming) onDeclineIncoming();
    setTimeout(() => {
      onEndCall(0, '📞 Declined Call');
    }, 400);
  };

  // Hang Up / End Active Call
  const handleHangUp = (reason?: 'missed' | 'normal') => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    stopRingtone();
    setCallStatus('ended');

    const dur = durationSeconds;
    const m = Math.floor(dur / 60);
    const s = dur % 60;
    const durText = `${m}m ${s.toString().padStart(2, '0')}s`;
    const label = reason === 'missed' ? '📞 Missed Call' : dur > 0 ? `📞 Voice Call (${durText})` : '📞 Call Ended';

    // Save to persistent call logs
    try {
      StorageService.saveCallLog({
        caller_id: isIncoming ? partnerUser.id : currentUser.id,
        caller_name: isIncoming ? partnerUser.full_name : currentUser.full_name,
        caller_avatar: isIncoming ? partnerUser.avatar_url : currentUser.avatar_url,
        caller_handle: isIncoming ? partnerUser.handle : currentUser.handle,
        receiver_id: isIncoming ? currentUser.id : partnerUser.id,
        receiver_name: isIncoming ? currentUser.full_name : partnerUser.full_name,
        receiver_avatar: isIncoming ? currentUser.avatar_url : partnerUser.avatar_url,
        receiver_handle: isIncoming ? currentUser.handle : partnerUser.handle,
        type: isIncoming ? (dur > 0 ? 'incoming' : 'missed') : 'outgoing',
        duration_seconds: dur,
        status: dur > 0 ? 'completed' : (reason === 'missed' ? 'missed' : 'declined')
      });
    } catch {}

    liveSyncService.sendCallSignal({
      callId,
      action: 'hangup',
      caller: {
        id: currentUser.id,
        full_name: currentUser.full_name
      },
      targetUserId: partnerUser.id
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    setTimeout(() => {
      onEndCall(dur, label);
    }, 400);
  };

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Toggle Speaker Output
  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-8 text-white select-none animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background ambient lighting ripple */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Badge & Back Button */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-between text-xs text-white/70">
        <button
          type="button"
          onClick={() => handleHangUp('normal')}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          title="Back / Close"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[11px] font-semibold hidden xs:inline">Back</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold tracking-wide text-[11px] text-white/90">InDrive Voice Call</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-white/60">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>HD Audio</span>
        </div>
      </div>

      {/* Center Body: InDrive Circular Pulsing Radar Waves & Avatar */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="relative flex items-center justify-center my-6">
          {/* Animated radar rings while ringing or connected */}
          {(callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'incoming') && (
            <>
              <div className="absolute w-44 h-44 rounded-full border border-emerald-400/30 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute w-56 h-56 rounded-full border border-emerald-500/20 animate-pulse pointer-events-none" />
              <div className="absolute w-68 h-68 rounded-full border border-primary/15 animate-ping opacity-30 pointer-events-none" />
            </>
          )}

          {callStatus === 'connected' && (
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse pointer-events-none" />
          )}

          {/* User Profile Avatar with Instagram Gradient Ring */}
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-emerald-500 via-primary to-amber-500 shadow-2xl">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-950 flex items-center justify-center">
              {partnerUser.avatar_url ? (
                <img 
                  src={partnerUser.avatar_url} 
                  alt={partnerUser.full_name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-3xl font-black text-white/80">
                  {partnerUser.full_name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Partner Name & Ministry Title */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>{partnerUser.full_name}</span>
          {partnerUser.role === 'super_admin' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Apostle
            </span>
          )}
        </h2>

        <p className="text-xs text-white/60 mt-1 font-medium">
          {partnerUser.handle || partnerUser.phone || 'Gateway Church Harare'}
        </p>

        {/* Call Status / Live Duration */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {callStatus === 'incoming' && (
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs tracking-wider animate-pulse">
              INCOMING VOICE CALL...
            </div>
          )}

          {callStatus === 'calling' && (
            <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 font-medium text-xs tracking-wide animate-pulse">
              Connecting InDrive VoIP...
            </div>
          )}

          {callStatus === 'ringing' && (
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium text-xs tracking-wide animate-pulse">
              Ringing...
            </div>
          )}

          {callStatus === 'connected' && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-bold shadow-lg shadow-emerald-500/10">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(durationSeconds)}</span>
            </div>
          )}

          {callStatus === 'declined' && (
            <div className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs">
              Call Declined
            </div>
          )}

          {callStatus === 'no_answer' && (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs">
              No Answer
            </div>
          )}

          {callStatus === 'ended' && (
            <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 font-bold text-xs">
              Call Ended
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar: InDrive Calling Tray */}
      <div className="relative z-10 w-full max-w-sm flex items-center justify-around pb-6 pt-4 px-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl">
        
        {/* INCOMING MODE: InDrive Accept (Green) and Decline (Red) */}
        {callStatus === 'incoming' ? (
          <div className="w-full flex items-center justify-around">
            {/* Decline Button (Red) */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleDecline}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-bold text-rose-400">Decline</span>
            </div>

            {/* Accept Button (Green) */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/50 transition-all cursor-pointer animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-bold text-emerald-400">Accept</span>
            </div>
          </div>
        ) : (
          /* ACTIVE / CONNECTED OR OUTGOING MODE */
          <>
            {/* Mute Microphone */}
            <button
              type="button"
              onClick={handleToggleMute}
              disabled={callStatus === 'ended' || callStatus === 'declined'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Speaker Output */}
            <button
              type="button"
              onClick={handleToggleSpeaker}
              disabled={callStatus === 'ended' || callStatus === 'declined'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSpeakerOn 
                  ? 'bg-white/10 text-white hover:bg-white/20' 
                  : 'bg-white/5 text-white/50'
              }`}
              title="Speaker Toggle"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* End Call Button (Red) */}
            <button
              type="button"
              onClick={() => handleHangUp('normal')}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-rose-600/40 transition-all cursor-pointer"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </>
        )}

      </div>
    </div>
  );
};
