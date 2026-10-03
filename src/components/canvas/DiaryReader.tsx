import React from 'react';
import { ArrowLeft, Edit3, Bell, Clock, Mic, Download } from 'lucide-react';
import { DiaryEntry, AppSettings } from '../../types';
import { AudioPlayerItem } from './AudioRecorder';

interface DiaryReaderProps {
  entry: DiaryEntry;
  settings: AppSettings;
  onEdit: () => void;
  onBack: () => void;
  onExport: () => void;
}

export const DiaryReader: React.FC<DiaryReaderProps> = ({
  entry,
  settings,
  onEdit,
  onBack,
  onExport,
}) => {
  const wordCount = entry.plainText
    ? entry.plainText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const dateFormatted = new Date(entry.createdAt).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeFormatted = new Date(entry.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        fontFamily: entry.fontFamily || settings.activeFontFamily || 'var(--font-sans)',
      }}
      className="flex flex-col h-full select-text overflow-hidden relative"
    >
      {/* Custom Background Image with Opacity */}
      {entry.canvasBackground?.url && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${entry.canvasBackground.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: entry.canvasBackground.opacity || 0.25,
          }}
        />
      )}

      {/* Reader Top Bar */}
      <div
        className="px-4 py-3 border-b border-[var(--theme-border)] backdrop-blur-md z-30 shrink-0 flex items-center justify-between"
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-[var(--theme-surface-hover)] transition-colors"
            title="Back to Diaries"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-base border border-[var(--theme-border)] overflow-hidden shrink-0 shadow-sm"
            style={{ backgroundColor: entry.avatar?.bgColor || 'var(--theme-accent)' }}
          >
            {entry.avatar?.type === 'emoji' ? (
              <span>{entry.avatar.value}</span>
            ) : entry.avatar?.value ? (
              <img
                src={entry.avatar.value}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {(entry.title || 'D').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[150px] sm:max-w-xs">
              {entry.title || 'Untitled Diary'}
            </h1>
            <p className="text-[10px] opacity-60 font-mono">
              {timeFormatted} • {wordCount} words
            </p>
          </div>
        </div>

        {/* Right Action Buttons: Export & PENCIL (Edit Canvas) */}
        <div className="flex items-center gap-1.5">
          {entry.reminder && (
            <div
              className="p-1.5 rounded-full bg-amber-500/20 text-amber-400"
              title={`Reminder set for ${new Date(entry.reminder.dueTimestamp).toLocaleString()}`}
            >
              <Bell size={16} />
            </div>
          )}

          <button
            onClick={onExport}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[var(--theme-surface-hover)] transition-colors"
            title="Export Diary"
          >
            <Download size={18} />
          </button>

          {/* Prominent Edit Pencil Button */}
          <button
            onClick={onEdit}
            className="px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 bg-[var(--theme-accent)] text-white hover:opacity-90"
            title="Edit in Canvas"
          >
            <Edit3 size={15} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Reader Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 max-w-2xl mx-auto w-full leading-relaxed space-y-6">
        {/* Date & Title Display */}
        <div className="border-b border-[var(--theme-border)] pb-3">
          <div className="text-xs opacity-60 font-medium mb-1">{dateFormatted}</div>
          <h2 className="text-2xl font-bold tracking-tight">{entry.title || 'Untitled Diary'}</h2>
        </div>

        {/* Voice Memos (if present) */}
        {entry.audioRecordings?.length > 0 && (
          <div className="space-y-2 p-3 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic size={14} />
              <span>Voice Memos ({entry.audioRecordings.length})</span>
            </span>
            <div className="space-y-1.5">
              {entry.audioRecordings.map((rec) => (
                <AudioPlayerItem key={rec.id} recording={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Rich HTML Text Area */}
        <div
          dangerouslySetInnerHTML={{ __html: entry.content || `<p>${entry.plainText}</p>` }}
          className="prose prose-invert max-w-none text-base sm:text-lg leading-relaxed focus:outline-none"
        />

        {/* Unified Media Canvas Items (Images, GIFs, Stickers) */}
        {entry.media?.length > 0 && (
          <div className="pt-4 border-t border-[var(--theme-border)] space-y-3">
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider block">
              Attachments & Stickers ({entry.media.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {entry.media.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1.5 flex flex-col items-center justify-center shadow-sm"
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-40 w-full object-contain rounded-lg"
                    style={{ filter: item.filter || 'none' }}
                  />
                  <span className="text-[10px] opacity-60 mt-1 truncate max-w-full font-mono">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags Footer */}
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-4">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--theme-surface)] border border-[var(--theme-border)] opacity-80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
