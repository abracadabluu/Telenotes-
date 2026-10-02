import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Lock,
  Settings as SettingsIcon,
  Pin,
  MoreVertical,
  Plus,
  Trash2,
  Share2,
  FileText,
  Download,
  Folder as FolderIcon,
  Smile,
  Mic,
  Camera,
  Bell,
  Clock,
  CheckSquare,
  Volume2,
  Check,
  X,
} from 'lucide-react';
import { DiaryEntry, Folder, AppSettings, TodoItem } from '../../types';
import { exportToMarkdown, exportToTxt, exportToHtml, exportEntryToPdf } from '../../services/cryptoVault';

interface TelegramFeedProps {
  entries: DiaryEntry[];
  folders: Folder[];
  activeFolderId: string;
  settings: AppSettings;
  todos: TodoItem[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onCreateNewEntry: () => void;
  onOpenBookStudio: () => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
  onTogglePin: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onChangeFolder: (folderId: string) => void;
  onAddFolder: (name: string, icon: string) => void;
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TelegramFeed: React.FC<TelegramFeedProps> = ({
  entries,
  folders,
  activeFolderId,
  settings,
  todos,
  onSelectEntry,
  onCreateNewEntry,
  onOpenBookStudio,
  onLockApp,
  onOpenSettings,
  onTogglePin,
  onDeleteEntry,
  onChangeFolder,
  onAddFolder,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuEntryId, setActiveMenuEntryId] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [newTodoInput, setNewTodoInput] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  // Filter entries by folder and search
  const filteredEntries = entries.filter((entry) => {
    const matchesFolder =
      activeFolderId === 'all'
        ? true
        : entry.folderId === activeFolderId;

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

  const previewLinesClass =
    settings.chatListConfig.previewLines === 1
      ? 'line-clamp-1'
      : settings.chatListConfig.previewLines === 3
      ? 'line-clamp-3'
      : 'line-clamp-2';

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden relative">
      {/* Telegram-style Top Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: App Title */}
          {isSearching ? (
            <div className="flex-1 flex items-center gap-2 mr-2">
              <Search size={16} className="text-sky-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diaries, notes, tags..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span className="text-sky-400">✈️</span>
                <span>Telenotes</span>
              </span>
            </div>
          )}

          {/* Right Corner Buttons: Search, Book Studio, Quick Lock, Settings */}
          {!isSearching && (
            <div className="flex items-center gap-1">
              {/* Search button */}
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Search Diaries"
              >
                <Search size={18} />
              </button>

              {/* Book Writing Canvas Button (distinct canvas requested by user) */}
              <button
                type="button"
                onClick={onOpenBookStudio}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                title="Open Book & Story Writing Studio"
              >
                <BookOpen size={18} />
              </button>

              {/* Immediate Lock Button */}
              <button
                type="button"
                onClick={onLockApp}
                className="w-9 h-9 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                title="Lock Vault Immediately"
              >
                <Lock size={17} />
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Settings"
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Folders Tab Strip (Telegram-style folders to organize diaries) */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto scrollbar-none shrink-0 text-xs">
        {folders.map((folder) => {
          const isActive = activeFolderId === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onChangeFolder(folder.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{folder.icon}</span>
              <span>{folder.name}</span>
            </button>
          );
        })}

        {/* Add Folder button */}
        <button
          type="button"
          onClick={() => setShowNewFolderModal(true)}
          className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors"
          title="Add New Folder"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Chat-like Diary List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 pb-24">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectEntry(item)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 active:bg-slate-800/60 cursor-pointer transition-colors relative group"
            >
              {/* Profile Avatar (chosen by user when writing) */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-sm"
                style={{
                  backgroundColor: item.avatar?.bgColor || '#2563eb',
                }}
              >
                {item.avatar.type === 'image' ? (
                  <img
                    src={item.avatar.value}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{item.avatar.value || '📔'}</span>
                )}
              </div>

              {/* Chat Message Content preview */}
              <div className="flex-1 min-w-0 pr-1">
                {/* Contact Name = Diary Heading */}
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
                    {item.isPinned && <Pin size={12} className="text-amber-400 rotate-45 shrink-0" />}
                    <span>{item.title || 'Untitled Note'}</span>
                  </h4>

                  {/* Timestamp in corner */}
                  {settings.chatListConfig.showTimestamp && (
                    <span className="text-[11px] text-slate-400 font-mono ml-2 shrink-0">
                      {formatListTimestamp(item.createdAt)}
                    </span>
                  )}
                </div>

                {/* 1-2 lines message preview */}
                <p className={`text-xs text-slate-400 leading-relaxed ${previewLinesClass}`}>
                  {item.plainText || 'No text content...'}
                </p>

                {/* Badges / indicators (audio memo, todos, stickers, reminder) */}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                  {item.audioRecordings?.length > 0 && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <Volume2 size={12} />
                      <span>{item.audioRecordings.length} audio</span>
                    </span>
                  )}
                  {item.todos?.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckSquare size={12} />
                      <span>
                        {item.todos.filter((t) => t.done).length}/{item.todos.length}
                      </span>
                    </span>
                  )}
                  {item.reminder && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Bell size={12} />
                      <span>{new Date(item.reminder.dueTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </span>
                  )}
                  {item.stickers?.length > 0 && <span>✨ {item.stickers.length} stickers</span>}
                </div>
              </div>

              {/* Quick Actions Menu Trigger */}
              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuEntryId(activeMenuEntryId === item.id ? null : item.id);
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors rounded-lg"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Context popup menu */}
              {activeMenuEntryId === item.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-4 top-10 z-40 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl space-y-1 w-44 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePin(item.id);
                      setActiveMenuEntryId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <Pin size={13} className={item.isPinned ? 'text-amber-400' : ''} />
                    <span>{item.isPinned ? 'Unpin' : 'Pin to Top'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportEntryToPdf(item);
                      setActiveMenuEntryId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <Download size={13} />
                    <span>Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToMarkdown(item);
                      setActiveMenuEntryId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <FileText size={13} />
                    <span>Export Markdown</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportToHtml(item);
                      setActiveMenuEntryId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                  >
                    <Share2 size={13} />
                    <span>Export HTML</span>
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEntry(item.id);
                      setActiveMenuEntryId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 flex items-center gap-2 text-rose-400"
                  >
                    <Trash2 size={13} />
                    <span>Delete Entry</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-3xl mb-3">
              📝
            </div>
            <h3 className="text-base font-semibold text-slate-200">No Diaries in this Folder</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {searchQuery
                ? 'No matching diary entries found for your search query.'
                : 'Write your first encrypted thought, memory, or daily note.'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Diary Creation Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-30">
        <div
          onClick={onCreateNewEntry}
          className="bg-slate-900/95 border border-sky-500/40 hover:border-sky-400 rounded-full pl-4 pr-2 py-2 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ring-1 ring-sky-400/20"
        >
          {/* Prompt placeholder (profile picture, mic, and emoji removed as requested) */}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-300 font-medium block truncate">
              Write a new diary, note, or thought...
            </span>
          </div>

          {/* + Button: dedicated to-do create button as requested */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTodoModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-xs font-semibold shadow-md shadow-sky-500/30 active:scale-95 transition-all shrink-0"
            title="Create New To-Do Task"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="font-semibold text-[11px]">To-Do</span>
          </button>
        </div>
      </div>

      {/* Dedicated To-Do & Task Manager Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">To-Dos & Tasks</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {todos.filter((t) => t.done).length}/{todos.length} done
                </span>
                <button
                  type="button"
                  onClick={() => setShowTodoModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Input to add new To-Do */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTodoInput}
                onChange={(e) => setNewTodoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTodoInput.trim()) {
                    onAddTodo(newTodoInput.trim());
                    setNewTodoInput('');
                  }
                }}
                placeholder="What needs to be done?..."
                className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500/60"
              />
              <button
                type="button"
                onClick={() => {
                  if (newTodoInput.trim()) {
                    onAddTodo(newTodoInput.trim());
                    setNewTodoInput('');
                  }
                }}
                className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {/* List of To-Dos */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-64">
              {todos.length > 0 ? (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-800/60 rounded-xl group hover:bg-slate-800 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          todo.done ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {todo.done && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className={`text-xs truncate ${todo.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {todo.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition-opacity p-1 shrink-0"
                      title="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No to-dos yet. Add one above!
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTodoModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Create New Folder</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Dreams, Travel, Work"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Folder Icon Emoji</label>
                <div className="flex gap-2">
                  {['📁', '🌟', '💼', '✈️', '🎨', '🔒', '💡'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewFolderIcon(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        newFolderIcon === em ? 'bg-sky-500/20 border border-sky-400' : 'bg-slate-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-md"
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
