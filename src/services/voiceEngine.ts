// Web Audio & Microphone Voice Engine for TeleSpaces

export class VoiceEngine {
  private static instance: VoiceEngine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isMuted: boolean = false;
  private animationFrameId: number | null = null;
  private onLevelChangeCallbacks: Set<(level: number, isSpeaking: boolean) => void> = new Set();

  private constructor() {}

  public static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      if (this.mediaStream) {
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.4;

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyser);

      this.startAnalysisLoop();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      // Fallback: start simulated voice activity loop so UI still functions gracefully
      this.startSimulatedLoop();
      return false;
    }
  }

  public stopMicrophone(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.notifyLevel(0, false);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      this.notifyLevel(0, false);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public subscribeLevel(callback: (level: number, isSpeaking: boolean) => void): () => void {
    this.onLevelChangeCallbacks.add(callback);
    return () => {
      this.onLevelChangeCallbacks.delete(callback);
    };
  }

  private notifyLevel(level: number, isSpeaking: boolean): void {
    this.onLevelChangeCallbacks.forEach((cb) => cb(level, isSpeaking));
  }

  private startAnalysisLoop(): void {
    const bufferLength = this.analyser?.frequencyBinCount || 32;
    const dataArray = new Uint8Array(bufferLength);

    const checkLevel = () => {
      if (!this.analyser || this.isMuted) {
        this.notifyLevel(0, false);
        this.animationFrameId = requestAnimationFrame(checkLevel);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const normalized = Math.min(100, Math.round((average / 128) * 100));
      const isSpeaking = normalized > 12;

      this.notifyLevel(normalized, isSpeaking);
      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  private startSimulatedLoop(): void {
    let tick = 0;
    const loop = () => {
      tick++;
      if (this.isMuted) {
        this.notifyLevel(0, false);
      } else {
        // Natural speech modulation simulation
        const mockLevel = Math.max(0, Math.round(Math.sin(tick * 0.1) * 35 + 20));
        this.notifyLevel(mockLevel, mockLevel > 15);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  // Play realistic Telegram Call Ringing sound
  public playRingtone(): () => void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      let active = true;

      const scheduleTone = (time: number) => {
        if (!active) return;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, time); // A4
        osc2.frequency.setValueAtTime(480, time); // North American / European dual tone

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.setValueAtTime(0.08, time + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 1.25);
        osc2.stop(time + 1.25);

        // Repeat every 3 seconds
        setTimeout(() => {
          if (active && ctx.state !== 'closed') {
            scheduleTone(ctx.currentTime + 0.1);
          }
        }, 3000);
      };

      scheduleTone(ctx.currentTime + 0.1);

      return () => {
        active = false;
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      };
    } catch (e) {
      console.warn('Ringtone could not play', e);
      return () => {};
    }
  }
}
