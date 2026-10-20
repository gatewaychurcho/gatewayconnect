/**
 * Gateway Connect — Agora RTC Audio Service
 * App ID: fd0f715b597a4263a736f5ac20473f73
 * Primary Certificate: c948a6d9956c4837ac9c33eb63b30e0e
 * Project: joedaniels-chat
 */

import { getApiUrl } from './apiConfig';

export const AGORA_APP_ID = 'fd0f715b597a4263a736f5ac20473f73';
export const AGORA_PRIMARY_CERTIFICATE = 'c948a6d9956c4837ac9c33eb63b30e0e';

declare global {
  interface Window {
    AgoraRTC?: any;
  }
}

class AgoraService {
  private rtcClient: any = null;
  private localAudioTrack: any = null;
  private isJoined: boolean = false;
  private channelName: string = '';
  private currentUid: string | number = '0';

  /**
   * Dynamically loads Agora RTC Web SDK if not present on window
   */
  async ensureSdkLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.AgoraRTC) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js';
      script.async = true;
      script.onload = () => {
        console.log('⚡ Agora Web SDK successfully loaded');
        resolve(true);
      };
      script.onerror = () => {
        console.warn('⚠️ Could not load Agora SDK from CDN, using WebRTC fallback');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Request an RTC token from the Agora token backend endpoint
   */
  async getRtcToken(channel: string, uid: string | number): Promise<string | null> {
    try {
      const res = await fetch(getApiUrl(`/api/agora/token?channel=${encodeURIComponent(channel)}&uid=${encodeURIComponent(uid)}&role=publisher`));
      if (res.ok) {
        const data = await res.json();
        return data.token || null;
      }
    } catch (err) {
      console.warn('Could not fetch Agora token from server:', err);
    }
    return null;
  }

  /**
   * Join Agora Audio Channel for VoIP Voice Call
   */
  async joinVoiceCall(
    channelName: string,
    uid: string | number,
    onRemoteUserJoined?: (user: any) => void,
    onRemoteUserLeft?: (user: any) => void
  ): Promise<boolean> {
    try {
      const loaded = await this.ensureSdkLoaded();
      if (!loaded || !window.AgoraRTC) {
        console.warn('Agora SDK unavailable; fallback to WebRTC peer connection.');
        return false;
      }

      this.channelName = channelName;
      this.currentUid = uid;

      // Clean existing client if any
      await this.leaveVoiceCall();

      const AgoraRTC = window.AgoraRTC;
      this.rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Remote track handling
      this.rtcClient.on('user-published', async (user: any, mediaType: string) => {
        await this.rtcClient.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        if (onRemoteUserJoined) onRemoteUserJoined(user);
      });

      this.rtcClient.on('user-unpublished', (user: any) => {
        if (onRemoteUserLeft) onRemoteUserLeft(user);
      });

      this.rtcClient.on('user-left', (user: any) => {
        if (onRemoteUserLeft) onRemoteUserLeft(user);
      });

      // Fetch RTC Token
      const token = await this.getRtcToken(channelName, uid);

      // Join Channel
      await this.rtcClient.join(AGORA_APP_ID, channelName, token || null, uid);
      this.isJoined = true;

      // Create Local Microphone Track with Echo Cancellation & Noise Suppression
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true,
        ANS: true,
        AGC: true
      });

      // Publish local audio to room
      await this.rtcClient.publish([this.localAudioTrack]);
      console.log(`🎙️ Successfully joined Agora voice call room "${channelName}"`);
      return true;
    } catch (err) {
      console.warn('Agora joinVoiceCall error:', err);
      return false;
    }
  }

  /**
   * Mute or unmute microphone
   */
  setMuted(muted: boolean): void {
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.setEnabled(!muted);
      } catch (err) {
        console.warn('Error toggling mute:', err);
      }
    }
  }

  /**
   * Leave Voice Call and clean up resources
   */
  async leaveVoiceCall(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.rtcClient && this.isJoined) {
        await this.rtcClient.leave();
        this.rtcClient = null;
        this.isJoined = false;
      }
    } catch (err) {
      console.warn('Agora leaveVoiceCall error:', err);
    }
  }
}

export const agoraService = new AgoraService();
