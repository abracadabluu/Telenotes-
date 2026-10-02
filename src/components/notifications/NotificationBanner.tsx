import React, { useEffect } from 'react';
import { Bell, X, ArrowRight, Check } from 'lucide-react';
import { DiaryEntry } from '../../types';

interface NotificationBannerProps {
  notification: {
    entry: DiaryEntry;
    title: string;
  };
  onOpen: (entry: DiaryEntry) => void;
  onDismiss: () => void;
}

// Play pleasant chime with Web Audio API
export function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onOpen,
  onDismiss,
}) => {
  useEffect(() => {
    playNotificationChime();
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification]);

  const { entry } = notification;

  return (
    <div className="absolute top-2 left-3 right-3 z-50 animate-slide-down">
      <div className="bg-slate-900/95 border border-sky-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs ring-1 ring-sky-400/30">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-sky-600/30 border border-sky-400/40 flex items-center justify-center text-lg shrink-0">
          {entry.avatar.type === 'image' ? (
            <img src={entry.avatar.value} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>{entry.avatar.value}</span>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0" onClick={() => onOpen(entry)}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white truncate text-xs flex items-center gap-1.5">
              <Bell size={12} className="text-amber-400" />
              <span>{notification.title}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Now</span>
          </div>
          <p className="text-slate-300 text-[11px] truncate mt-0.5">
            {entry.title || 'Diary Reminder'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onOpen(entry)}
            className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            title="Open diary"
          >
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
