import React, { useState, useRef } from 'react';
import {
  Menu,
  Search,
  Lock,
  Pin,
  Plus,
  Trash2,
  FileText,
  Download,
  Folder as FolderIcon,
  Smile,
  Mic,
  Copy,
  Check,
  X,
  Share2,
} from 'lucide-react';
import { DiaryEntry, Folder, AppSettings } from '../../types';
import {
  exportToMarkdown,
  exportToTxt,
  exportEntryToPdf,
} from '../../services/cryptoVault';

interface TelegramFeedProps {
  entries: DiaryEntry[];
  folders: Folder[];
  activeFolderId: string;
  settings: AppSettings;
  onSelectEntry: (entry: DiaryEntry) => void;
  onCreateNewEntry: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onTogglePin: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onDuplicateEntry: (entry: DiaryEntry) => void;
  onChangeFolder: (folderId: string) => void;
  onAddFolder: (name: string, icon: string) => void;
}

export const TelegramFeed: React.FC<TelegramFeedProps> = ({
  entries,
  folders,
  activeFolderId,
  settings,
  onSelectEntry,
  onCreateNewEntry,
  onLockApp,
  onOpenSettings,
  onTogglePin,
  onDeleteEntry,
  onDuplicateEntry,
  onChangeFolder,
  onAddFolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuEntryId, setActiveMenuEntryId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  // Filter entries by folder and search
  const filteredEntries = entries.filter((entry) => {
    const matchesFolder =
      activeFolderId === 'all' ? true : entry.folderId === activeFolderId;

    if (!matchesFolder) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = entry.title.toLowerCase().includes(q);
    const contentMatch = entry.plainText.toLowerCase().includes(q);
    const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  // Sort pinned first, then by date descending
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim(), newFolderIcon);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const formatListTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Long press handlers
  const handleTouchStart = (entry: DiaryEntry) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setActiveMenuEntryId(entry.id);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(40);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleEntryClick = (entry: DiaryEntry) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    onSelectEntry(entry);
  };

  const selectedMenuEntry = entries.find((e) => e.id === activeMenuEntryId);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Top Header - Common across both modes */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Hamburger Menu + Brand Title */}
          {isSearching ? (
            <div className="flex-1 flex items-center gap-2 mr-2">
              <Search size={16} className="text-sky-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diaries, tags, notes..."
                className="w-full bg-slate-900/90 text-sm text-white placeholder-slate-500 px-3 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSettings}
                className="p-2 -ml-1 text-slate-300 hover:text-sky-400 hover:bg-slate-800/60 rounded-full transition-colors active:scale-95"
                title="Navigation & Settings"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Telenotes</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Diary
                </span>
              </h1>
            </div>
          )}

          {/* Right: Common actions (Search, Lock) */}
          {!isSearching && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800/60 rounded-full transition-colors active:scale-95"
                title="Search"
              >
                <Search size={20} />
              </button>
              <button
                onClick={onLockApp}
                className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 rounded-full transition-colors active:scale-95"
                title="Lock Vault"
              >
                <Lock size={19} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Horizontal Folder / Tag Bar (Requirement #8) */}
      {settings.diaryFeedConfig?.showTagsBar !== false && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => onChangeFolder('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFolderId === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            All Entries ({entries.length})
          </button>
          {folders.map((folder) => {
            const count = entries.filter((e) => e.folderId === folder.id).length;
            const isActive = activeFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onChangeFolder(folder.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{folder.icon}</span>
                <span>{folder.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="p-1.5 rounded-full text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 text-xs transition-colors shrink-0"
            title="Create Tag/Folder"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Main Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
            <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4 text-3xl">
              ✍️
            </div>
            <h3 className="text-base font-semibold text-slate-300 mb-1">
              No entries found
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">
              Tap the write button below to start your encrypted personal diary.
            </p>
            <button
              onClick={onCreateNewEntry}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95"
            >
              Write First Entry
            </button>
          </div>
        ) : (
          sortedEntries.map((entry) => {
            const wordCount = entry.plainText
              ? entry.plainText.trim().split(/\s+/).filter(Boolean).length
              : 0;

            return (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                onTouchStart={() => handleTouchStart(entry)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveMenuEntryId(entry.id);
                }}
                className={`p-3.5 flex items-start gap-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors relative group select-none active:bg-slate-800/60 ${
                  entry.isPinned ? 'bg-sky-950/15' : ''
                }`}
              >
                {/* Avatar / Mood */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl shadow-sm border border-white/10"
                  style={{
                    backgroundColor: entry.avatar?.bgColor || '#0284c7',
                  }}
                >
                  {entry.avatar?.type === 'emoji' ? (
                    <span>{entry.avatar.value}</span>
                  ) : (
                    <span className="text-sm font-bold text-white">
                      {entry.title.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h2 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                      {entry.isPinned && (
                        <Pin size={12} className="text-sky-400 fill-sky-400 shrink-0" />
                      )}
                      <span>{entry.title || 'Untitled Entry'}</span>
                    </h2>
                    {settings.diaryFeedConfig?.showDate !== false && (
                      <span className="text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                        {formatListTimestamp(entry.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Plain text preview snippet (Requirement #8) */}
                  {settings.diaryFeedConfig?.snippetPreview !== false && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {entry.plainText || 'No text content.'}
                    </p>
                  )}

                  {/* Badges / Metadata row */}
                  <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-500">
                    {settings.diaryFeedConfig?.showWordCount !== false && (
                      <span>{wordCount} words</span>
                    )}

                    {settings.diaryFeedConfig?.showMediaCount !== false && (
                      <>
                        {entry.audioRecordings?.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Mic size={11} />
                            <span>{entry.audioRecordings.length}</span>
                          </span>
                        )}
                        {entry.stickers?.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Smile size={11} />
                            <span>{entry.stickers.length}</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (+) */}
      <button
        onClick={onCreateNewEntry}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-xl shadow-sky-500/25 flex items-center justify-center z-40 transition-all active:scale-95 group"
        title="Write Diary Entry"
      >
        <Plus size={26} className="group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* LONG-PRESS CONTEXTUAL ACTION SHEET (Requirement #8) */}
      {activeMenuEntryId && selectedMenuEntry && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-fadeIn">
          {/* Universal Click-Outside Backdrop */}
          <div
            onClick={() => setActiveMenuEntryId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Action Sheet Container */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 shadow-2xl z-10 space-y-2 pb-8 max-w-lg mx-auto w-full">
            {/* Grab handle bar */}
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

            {/* Entry Summary */}
            <div className="px-2 pb-2 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  {selectedMenuEntry.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {new Date(selectedMenuEntry.createdAt).toLocaleDateString()} •{' '}
                  {selectedMenuEntry.plainText?.split(/\s+/).length || 0} words
                </p>
              </div>
              <button
                onClick={() => setActiveMenuEntryId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
              <button
                onClick={() => {
                  onSelectEntry(selectedMenuEntry);
                  setActiveMenuEntryId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <FileText size={16} className="text-sky-400" />
                <span>Open & Edit</span>
              </button>

              <button
                onClick={() => {
                  onTogglePin(selectedMenuEntry.id);
                  setActiveMenuEntryId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Pin size={16} className={selectedMenuEntry.isPinned ? 'text-amber-400' : 'text-slate-400'} />
                <span>{selectedMenuEntry.isPinned ? 'Unpin' : 'Pin to Top'}</span>
              </button>

              <button
                onClick={() => {
                  onDuplicateEntry(selectedMenuEntry);
                  setActiveMenuEntryId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Copy size={16} className="text-teal-400" />
                <span>Duplicate Note</span>
              </button>

              <button
                onClick={() => {
                  exportEntryToPdf(selectedMenuEntry);
                  setActiveMenuEntryId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Download size={16} className="text-emerald-400" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => {
                  exportToMarkdown(selectedMenuEntry);
                  setActiveMenuEntryId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Share2 size={16} className="text-indigo-400" />
                <span>Export Markdown</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete "${selectedMenuEntry.title}"?`)) {
                    onDeleteEntry(selectedMenuEntry.id);
                    setActiveMenuEntryId(null);
                  }
                }}
                className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} className="text-rose-400" />
                <span>Delete Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowNewFolderModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl z-10 space-y-4">
            <h3 className="text-sm font-semibold text-white">Create New Tag/Folder</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderIcon}
                onChange={(e) => setNewFolderIcon(e.target.value)}
                className="w-12 text-center bg-slate-800 border border-slate-700 rounded-lg text-lg"
              />
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
