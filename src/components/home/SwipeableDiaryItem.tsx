import React, { useState, useRef } from 'react';
import { Pin, Download, Trash2, Mic, Smile, ChevronRight } from 'lucide-react';
import { DiaryEntry, AppSettings } from '../../types';

interface SwipeableDiaryItemProps {
  entry: DiaryEntry;
  settings: AppSettings;
  onOpen: (entry: DiaryEntry) => void;
  onTogglePin: (id: string) => void;
  onExport: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}

export const SwipeableDiaryItem: React.FC<SwipeableDiaryItemProps> = ({
  entry,
  settings,
  onOpen,
  onTogglePin,
  onExport,
  onDelete,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const maxSwipe = 190; // width of revealed action buttons

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    touchCurrentXRef.current = e.touches[0].clientX;
    const diff = touchCurrentXRef.current - touchStartXRef.current;

    // Support swipe in both directions (revealing actions from either side)
    if (diff < 0) {
      setTranslateX(Math.max(-maxSwipe, diff));
    } else {
      setTranslateX(Math.min(maxSwipe, diff));
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = touchCurrentXRef.current - touchStartXRef.current;

    if (Math.abs(diff) > 50) {
      // Snap open
      setTranslateX(diff < 0 ? -maxSwipe : maxSwipe);
      setIsSwiped(true);
      if (window.navigator?.vibrate) window.navigator.vibrate(30);
    } else {
      // Snap closed
      setTranslateX(0);
      setIsSwiped(false);
    }
  };

  const closeSwipe = () => {
    setTranslateX(0);
    setIsSwiped(false);
  };

  const handleClickCard = () => {
    if (isSwiped || Math.abs(translateX) > 10) {
      closeSwipe();
      return;
    }
    onOpen(entry);
  };

  const dateObj = new Date(entry.createdAt);
  const dateFormatted = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const previewLines = settings.previewConfig?.contentLines ?? 2;
  const showAvatar = settings.previewConfig?.showAvatar !== false;
  const showDate = settings.previewConfig?.showDate !== false;
  const showTime = settings.previewConfig?.showTime !== false;

  return (
    <div className="relative overflow-hidden w-full select-none border-b border-[var(--theme-border)]">
      {/* Slide-out Action Buttons underneath the row */}
      <div
        className={`absolute inset-0 flex items-center justify-between px-3 z-0 ${
          translateX < 0 ? 'justify-end' : 'justify-start'
        }`}
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <div className="flex items-center gap-2">
          {/* Pin Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(entry.id);
              closeSwipe();
            }}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              entry.isPinned
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={entry.isPinned ? 'Unpin' : 'Pin to Top'}
          >
            <Pin size={18} className={entry.isPinned ? 'fill-amber-400' : ''} />
            <span className="text-[10px] font-semibold">{entry.isPinned ? 'Unpin' : 'Pin'}</span>
          </button>

          {/* Export Button (16 Formats) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(entry);
              closeSwipe();
            }}
            className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 flex flex-col items-center justify-center gap-1 transition-all"
            title="Export (16 Formats)"
          >
            <Download size={18} />
            <span className="text-[10px] font-semibold">Export</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
              closeSwipe();
            }}
            className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 flex flex-col items-center justify-center gap-1 transition-all"
            title="Delete Diary"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        </div>
      </div>

      {/* Front Foreground Card (Slides horizontally) */}
      <div
        onClick={handleClickCard}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
          backgroundColor: entry.isPinned ? 'var(--theme-surface-hover)' : 'var(--theme-bg)',
          color: 'var(--theme-text)',
        }}
        className="relative z-10 w-full p-3.5 flex items-start gap-3.5 cursor-pointer active:opacity-90"
      >
        {/* Profile Avatar */}
        {showAvatar && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-sm border border-[var(--theme-border)] overflow-hidden"
            style={{
              backgroundColor: entry.avatar?.bgColor || 'var(--theme-accent)',
            }}
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
              <span className="text-sm font-bold text-white">
                {(entry.title || 'D').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold truncate flex items-center gap-1.5">
              {entry.isPinned && (
                <Pin size={13} className="text-[var(--theme-accent)] fill-[var(--theme-accent)] shrink-0" />
              )}
              <span className="truncate">{entry.title || 'Untitled Diary'}</span>
            </h2>

            {/* Date & Time */}
            <div className="text-[11px] opacity-60 whitespace-nowrap shrink-0 flex items-center gap-1.5 font-mono">
              {showDate && <span>{dateFormatted}</span>}
              {showTime && <span>{timeFormatted}</span>}
            </div>
          </div>

          {/* Snippet Preview (0, 1, or 2 lines) */}
          {previewLines > 0 && (
            <p
              className={`text-xs opacity-70 leading-relaxed ${
                previewLines === 1 ? 'line-clamp-1' : 'line-clamp-2'
              }`}
            >
              {entry.plainText || 'No entry content yet.'}
            </p>
          )}

          {/* Badges: Audio memos, Media attachments, Tags */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] opacity-65">
            {entry.audioRecordings?.length > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Mic size={11} />
                <span>{entry.audioRecordings.length}</span>
              </span>
            )}
            {entry.media?.length > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Smile size={11} />
                <span>{entry.media.length}</span>
              </span>
            )}
            {entry.tags?.length > 0 && (
              <span className="truncate max-w-[120px] text-[10px] opacity-75">
                #{entry.tags[0]}
              </span>
            )}
          </div>
        </div>

        {/* Subtle Swipe Hint Indicator for desktop / mouse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setTranslateX(isSwiped ? 0 : -maxSwipe);
            setIsSwiped(!isSwiped);
          }}
          className="p-1 opacity-30 hover:opacity-100 self-center text-slate-400 hover:text-white"
          title="Swipe actions"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
