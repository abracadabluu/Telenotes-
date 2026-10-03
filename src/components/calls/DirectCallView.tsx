import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Volume1,
  ShieldCheck,
  Radio,
  Lock,
  Wifi,
} from 'lucide-react';
import { DirectCallSession, TelegramUser } from '../../types';
import { VoiceEngine } from '../../services/voiceEngine';

interface DirectCallViewProps {
  session: DirectCallSession;
  currentUser: TelegramUser;
  onEndCall: () => void;
}

export const DirectCallView: React.FC<DirectCallViewProps> = ({
  session,
  currentUser,
  onEndCall,
}) => {
  const [callDuration, setCallDuration] = useState(session.durationSeconds || 0);
  const [isMuted, setIsMuted] = useState<boolean>(session.isMuted || false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(session.isSpeakerOn ?? true);
  const [status, setStatus] = useState(session.status);
  const [audioLevel, setAudioLevel] = useState(0);

  const voiceEngine = useRef(VoiceEngine.getInstance());

  // Simulate ringing connection -> connected after 3.5 seconds
  useEffect(() => {
    let stopRingtone = () => {};

    if (status === 'ringing' || status === 'calling') {
      stopRingtone = voiceEngine.current.playRingtone();
      const timer = setTimeout(() => {
        setStatus('connected');
      }, 3500);

      return () => {
        clearTimeout(timer);
        stopRingtone();
      };
    }
  }, [status]);

  // Handle active audio stream & duration counter when connected
  useEffect(() => {
    if (status === 'connected') {
      voiceEngine.current.startMicrophone();
      voiceEngine.current.setMuted(isMuted);

      const unsubAudio = voiceEngine.current.subscribeLevel((level) => {
        setAudioLevel(level);
      });

      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
        unsubAudio();
        voiceEngine.current.stopMicrophone();
      };
    }
  }, [status, isMuted]);

  const toggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceEngine.current.setMuted(nextMuted);
  };

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1621] text-white flex flex-col items-center justify-between p-6 select-none animate-fadeIn">
      {/* Top Security & Status Bar */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17212b] border border-[#242f3d] text-xs text-emerald-400 font-semibold">
          <Lock size={12} />
          <span>Telegram End-to-End Encrypted</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Wifi size={14} className="text-emerald-400" />
          <span>HD Audio</span>
        </div>
      </div>

      {/* Center Peer Profile & Wave Halo */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        <div className="relative">
          {/* Pulsing connection rings */}
          {status === 'connected' && audioLevel > 15 && (
            <div className="absolute -inset-4 rounded-full border-2 border-[#38bdf8]/40 animate-ping" />
          )}

          <div
            className={`w-36 h-36 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-2xl relative z-10 ${
              status === 'connected' && audioLevel > 15
                ? 'border-[#38bdf8] ring-8 ring-[#38bdf8]/30 scale-105 shadow-sky-500/30'
                : 'border-[#242f3d]'
            }`}
          >
            <img
              src={session.peerUser.avatarUrl}
              alt={session.peerUser.firstName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {session.peerUser.firstName} {session.peerUser.lastName || ''}
          </h2>
          <span className="text-sm text-slate-400 block font-mono">
            @{session.peerUser.username}
          </span>
          <p className="text-sm font-semibold text-[#38bdf8] pt-1">
            {status === 'calling' && 'Calling...'}
            {status === 'ringing' && 'Ringing...'}
            {status === 'connected' && formatDuration(callDuration)}
            {status === 'ended' && 'Call ended'}
          </p>
        </div>
      </div>

      {/* Bottom Calling Action Bar */}
      <div className="w-full max-w-xs space-y-6 pb-6">
        <div className="flex items-center justify-around">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              isMuted
                ? 'bg-rose-600 text-white'
                : 'bg-[#17212b] border border-[#242f3d] text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* Speaker / Earpiece Toggle */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              isSpeakerOn
                ? 'bg-[#2b5278] text-white'
                : 'bg-[#17212b] border border-[#242f3d] text-slate-300'
            }`}
            title={isSpeakerOn ? 'Speakerphone On' : 'Earpiece Mode'}
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <Volume1 size={22} />}
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            onClick={onEndCall}
            className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            title="End Call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};
