import React, { useState } from 'react';
import { Search, Lock, Menu, Plus, X, Download, AlertTriangle } from 'lucide-react';
import { DiaryEntry, AppSettings, ExportFormat } from '../../types';
import { SwipeableDiaryItem } from './SwipeableDiaryItem';
import { exportDiaryEntry } from '../../services/cryptoVault';

interface TelegramFeedProps {
  entries: DiaryEntry[];
  settings: AppSettings;
  onSelectEntry: (entry: DiaryEntry) => void;
  onCreateNewEntry: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onTogglePin: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
}

const EXPORT_FORMATS: { id: ExportFormat; label: string; desc: string; ext: string }[] = [
  { id: 'pdf', label: 'PDF Document', desc: 'Portable high-res print document', ext: '.pdf' },
  { id: 'txt', label: 'Plain Text', desc: 'Clean UTF-8 text file', ext: '.txt' },
  { id: 'docx', label: 'Microsoft Word', desc: 'Modern Office Word document', ext: '.docx' },
  { id: 'md', label: 'Markdown', desc: 'Formatted markdown document', ext: '.md' },
  { id: 'rtf', label: 'Rich Text Format', desc: 'Styled text with fonts & bold/italic', ext: '.rtf' },
  { id: 'doc', label: 'Legacy Word (97-2003)', desc: 'Standard .doc envelope', ext: '.doc' },
  { id: 'odt', label: 'OpenDocument Text', desc: 'OpenOffice / LibreOffice document', ext: '.odt' },
  { id: 'fodt', label: 'Flat OpenDocument', desc: 'Single-file XML OpenDocument', ext: '.fodt' },
  { id: 'epub', label: 'EPUB E-Book', desc: 'Standard electronic publication', ext: '.epub' },
  { id: 'mobi', label: 'Mobipocket E-Book', desc: 'Kindle-compatible text book', ext: '.mobi' },
  { id: 'tex', label: 'LaTeX Article', desc: 'Typesetting LaTeX source', ext: '.tex' },
  { id: 'rst', label: 'reStructuredText', desc: 'Technical documentation markup', ext: '.rst' },
  { id: 'asciidoc', label: 'AsciiDoc', desc: 'AsciiDoc publishing format', ext: '.asciidoc' },
  { id: 'pages', label: 'Apple Pages', desc: 'Pages text interchange envelope', ext: '.pages' },
  { id: 'wpd', label: 'WordPerfect', desc: 'WordPerfect document format', ext: '.wpd' },
  { id: 'xps', label: 'XML Paper Spec', desc: 'Fixed layout XPS document', ext: '.xps' },
];

export const TelegramFeed: React.FC<TelegramFeedProps> = ({
  entries,
  settings,
  onSelectEntry,
  onCreateNewEntry,
  onLockApp,
  onOpenSettings,
  onTogglePin,
  onDeleteEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Export Modal state
  const [exportingEntry, setExportingEntry] = useState<DiaryEntry | null>(null);

  // Delete Confirmation Modal state
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Search filter
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = entry.title.toLowerCase().includes(q);
    const contentMatch = entry.plainText.toLowerCase().includes(q);
    const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(q));
    return titleMatch || contentMatch || tagMatch;
  });

  // Sort: Pinned first, then date descending
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const handleExecuteExport = (format: ExportFormat) => {
    if (!exportingEntry) return;
    exportDiaryEntry(exportingEntry, format);
    setExportingEntry(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingEntryId) return;
    onDeleteEntry(deletingEntryId);
    setDeletingEntryId(null);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
      className="flex flex-col h-full select-none overflow-hidden relative"
    >
      {/* Top Header Bar (Requirement #3) */}
      <div
        className="px-4 py-3 border-b border-[var(--theme-border)] backdrop-blur-md z-30 shrink-0"
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <div className="flex items-center justify-between">
          {/* Left Corner: App Name */}
          {isSearching ? (
            <div className="flex-1 flex items-center gap-2 mr-2">
              <Search size={16} className="text-[var(--theme-accent)] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diaries, reflections, tags..."
                className="w-full bg-[var(--theme-surface-hover)] text-sm text-[var(--theme-text)] placeholder-slate-400 px-3 py-1.5 rounded-xl border border-[var(--theme-border)] focus:outline-none"
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--theme-text)]">
                Telenotes
              </h1>
            </div>
          )}

          {/* Right Corner: Search, Lock, Hamburger Settings (Right Sidebar) */}
          {!isSearching && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 text-slate-300 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] rounded-full transition-colors active:scale-95"
                title="Search Diaries"
              >
                <Search size={20} />
              </button>
              <button
                onClick={onLockApp}
                className="p-2 text-slate-300 hover:text-amber-400 hover:bg-[var(--theme-surface-hover)] rounded-full transition-colors active:scale-95"
                title="Lock Vault"
              >
                <Lock size={19} />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-300 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-surface-hover)] rounded-full transition-colors active:scale-95"
                title="Settings Menu"
              >
                <Menu size={22} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Diary Stream List with Swipe Gestures */}
      <div className="flex-1 overflow-y-auto divide-y divide-[var(--theme-border)] pb-24">
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60">
            <div className="w-16 h-16 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)] flex items-center justify-center mb-4 text-3xl">
              ✍️
            </div>
            <h3 className="text-base font-semibold mb-1">No diaries found</h3>
            <p className="text-xs max-w-xs mb-4">
              Tap the button below to start your private encrypted personal diary.
            </p>
          </div>
        ) : (
          sortedEntries.map((entry) => (
            <SwipeableDiaryItem
              key={entry.id}
              entry={entry}
              settings={settings}
              onOpen={onSelectEntry}
              onTogglePin={onTogglePin}
              onExport={(e) => setExportingEntry(e)}
              onDelete={(id) => setDeletingEntryId(id)}
            />
          ))
        )}
      </div>

      {/* Floating Vertical Row Action Button: + Write New Diary (Requirement #3) */}
      <div className="fixed bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none">
        <button
          onClick={onCreateNewEntry}
          className="pointer-events-auto px-6 py-3.5 rounded-full font-bold text-sm text-white shadow-2xl flex items-center gap-2 transition-all active:scale-95 group hover:opacity-95"
          style={{
            backgroundColor: 'var(--theme-accent)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          }}
          title="Create New Diary"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          </div>
          <span>Write New Diary</span>
        </button>
      </div>

      {/* 16-FORMAT EXPORT MODAL (Requirement #4) */}
      {exportingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setExportingEntry(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
            className="relative border rounded-3xl p-5 w-full max-w-md shadow-2xl z-10 space-y-4 max-h-[85vh] flex flex-col animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Download size={18} className="text-[var(--theme-accent)]" />
                  <span>Export Diary</span>
                </h3>
                <p className="text-xs opacity-60 truncate max-w-[280px]">
                  "{exportingEntry.title}" • Select Format
                </p>
              </div>
              <button
                onClick={() => setExportingEntry(null)}
                className="p-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formats Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1">
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => handleExecuteExport(fmt.id)}
                  className="p-2.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] hover:bg-[var(--theme-surface-hover)] text-left flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs group-hover:text-[var(--theme-accent)]">
                      {fmt.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-surface)] opacity-75">
                      {fmt.ext}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-60 mt-1 line-clamp-1">
                    {fmt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Requirement #4) */}
      {deletingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeletingEntryId(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
            className="relative border rounded-2xl p-5 w-full max-w-xs shadow-2xl z-10 space-y-4 text-center animate-scaleUp"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold">Delete this diary?</h3>
              <p className="text-xs opacity-70 mt-1">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingEntryId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[var(--theme-surface-hover)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
