import React, { useState, useRef } from 'react';
import {
  Menu,
  Search,
  Lock,
  Plus,
  BookOpen,
  Download,
  Trash2,
  Copy,
  Edit3,
  FileText,
  X,
  Palette,
  Sparkles,
} from 'lucide-react';
import { BookProject, BookCoverTexture, AppSettings } from '../../types';
import { exportBookToPdf } from '../../services/cryptoVault';

interface BooksGalleryProps {
  books: BookProject[];
  settings: AppSettings;
  onSelectBook: (book: BookProject) => void;
  onCreateBook: (book: BookProject) => void;
  onDeleteBook: (bookId: string) => void;
  onDuplicateBook: (book: BookProject) => void;
  onUpdateBook: (book: BookProject) => void;
  onLockApp: () => void;
  onOpenSettings: () => void;
}

export const BooksGallery: React.FC<BooksGalleryProps> = ({
  books,
  settings,
  onSelectBook,
  onCreateBook,
  onDeleteBook,
  onDuplicateBook,
  onUpdateBook,
  onLockApp,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeMenuBookId, setActiveMenuBookId] = useState<string | null>(null);
  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [editingCoverBook, setEditingCoverBook] = useState<BookProject | null>(null);

  // New book state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newGenre, setNewGenre] = useState('Novel / Fiction');
  const [newTargetWords, setNewTargetWords] = useState(30000);
  const [newCoverTexture, setNewCoverTexture] = useState<BookCoverTexture>('leather-classic');

  // Long press timer ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const filteredBooks = books.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)
    );
  });

  const handleCreateNewBook = () => {
    if (!newTitle.trim()) return;
    const newBook: BookProject = {
      id: 'book_' + Date.now(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      author: newAuthor.trim() || 'Anonymous Author',
      genre: newGenre.trim() || 'Fiction',
      targetWords: Number(newTargetWords) || 25000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coverStyle: {
        texture: newCoverTexture,
        goldFoil: true,
        ribbonColor: '#f59e0b',
      },
      chapters: [
        {
          id: 'chap_1',
          title: 'Chapter 1: The Beginning',
          order: 1,
          content: '<p>Start writing your manuscript here...</p>',
          wordCount: 5,
          status: 'draft',
        },
      ],
      characters: [],
      outlineNotes: '',
    };
    onCreateBook(newBook);
    setNewTitle('');
    setNewSubtitle('');
    setNewAuthor('');
    setShowNewBookModal(false);
    onSelectBook(newBook);
  };

  const handleTouchStart = (book: BookProject) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setActiveMenuBookId(book.id);
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

  const handleBookClick = (book: BookProject) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    onSelectBook(book);
  };

  // Leather textures styling helper
  const getLeatherStyle = (style?: BookProject['coverStyle']) => {
    const tex = style?.texture || 'leather-classic';
    switch (tex) {
      case 'leather-dark':
        return 'bg-gradient-to-br from-[#1c1917] via-[#0c0a09] to-[#1c1917] border-[#44403c] text-amber-200';
      case 'leather-cognac':
        return 'bg-gradient-to-br from-[#78350f] via-[#451a03] to-[#78350f] border-[#92400e] text-amber-100';
      case 'leather-forest':
        return 'bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border-[#047857] text-emerald-100';
      case 'leather-crimson':
        return 'bg-gradient-to-br from-[#881337] via-[#4c0519] to-[#881337] border-[#9f1239] text-rose-100';
      case 'custom-image':
        return 'bg-slate-900 border-slate-700 text-white';
      case 'leather-classic':
      default:
        return 'bg-gradient-to-br from-[#3c1e08] via-[#241004] to-[#3c1e08] border-[#78350f] text-amber-200';
    }
  };

  const selectedMenuBook = books.find((b) => b.id === activeMenuBookId);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Top Header - Common across both modes */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Hamburger Menu + Brand Title */}
          {isSearching ? (
            <div className="flex-1 flex items-center gap-2 mr-2">
              <Search size={16} className="text-amber-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, genres..."
                className="w-full bg-slate-900/90 text-sm text-white placeholder-slate-500 px-3 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-500"
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
                className="p-2 -ml-1 text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 rounded-full transition-colors active:scale-95"
                title="Navigation & Settings"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Telenotes</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Book Studio
                </span>
              </h1>
            </div>
          )}

          {/* Right: Common actions (Search, Lock) */}
          {!isSearching && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 rounded-full transition-colors active:scale-95"
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

      {/* 2x2 Books Grid (Requirements #9 & #11) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          {filteredBooks.map((book) => {
            const totalWords = book.chapters.reduce(
              (acc, c) => acc + (c.wordCount || 0),
              0
            );
            const progressPct = Math.min(
              100,
              Math.round((totalWords / (book.targetWords || 25000)) * 100)
            );

            return (
              <div
                key={book.id}
                onClick={() => handleBookClick(book)}
                onTouchStart={() => handleTouchStart(book)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveMenuBookId(book.id);
                }}
                className={`relative aspect-[3/4] rounded-xl p-3.5 border-2 shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-2xl overflow-hidden group ${getLeatherStyle(
                  book.coverStyle
                )}`}
                style={
                  book.coverStyle?.texture === 'custom-image' &&
                  book.coverStyle?.customCoverUrl
                    ? {
                        backgroundImage: `url(${book.coverStyle.customCoverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                }
              >
                {/* 3D Spine Indentation & Shadow on Left */}
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-3 w-[1px] bg-white/10 pointer-events-none" />

                {/* Bookmark Silk Ribbon hanging from bottom */}
                <div
                  className="absolute bottom-0 right-4 w-3 h-5 rounded-t-sm shadow-md pointer-events-none"
                  style={{
                    backgroundColor: book.coverStyle?.ribbonColor || '#f59e0b',
                  }}
                />

                {/* Top: Genre & Chapter Count */}
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider opacity-85 z-10">
                  <span className="truncate max-w-[90px]">{book.genre}</span>
                  <span>{book.chapters.length} ch</span>
                </div>

                {/* Middle: Gold/Bronze Embossed Title & Author */}
                <div className="my-auto z-10 text-center px-1">
                  <h3 className="font-serif text-sm sm:text-base font-bold leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-3">
                    {book.title}
                  </h3>
                  {book.subtitle && (
                    <p className="text-[10px] opacity-75 font-sans mt-0.5 line-clamp-1 italic">
                      {book.subtitle}
                    </p>
                  )}
                  <div className="w-8 h-[1px] bg-amber-400/40 mx-auto my-1.5" />
                  <p className="text-[11px] font-sans font-semibold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-90 truncate">
                    {book.author}
                  </p>
                </div>

                {/* Bottom: Word Count Goal Progress */}
                {settings.booksGridConfig?.showWordGoal !== false && (
                  <div className="z-10 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] opacity-80 mb-1 font-mono">
                      <span>{totalWords.toLocaleString()} w</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ New Book" 2x2 Slot */}
          <button
            onClick={() => setShowNewBookModal(true)}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-900/60 flex flex-col items-center justify-center p-4 text-slate-400 hover:text-amber-300 transition-all duration-200 group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-amber-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-slate-300 group-hover:text-amber-300" />
            </div>
            <span className="text-xs font-semibold">Write New Book</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Novel & Chapters</span>
          </button>
        </div>
      </div>

      {/* LONG-PRESS CONTEXTUAL ACTION SHEET (Requirements #8 & #11) */}
      {activeMenuBookId && selectedMenuBook && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none animate-fadeIn">
          {/* Universal Click-Outside Backdrop */}
          <div
            onClick={() => setActiveMenuBookId(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Action Sheet Container */}
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 shadow-2xl z-10 space-y-2 pb-8 max-w-lg mx-auto w-full">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

            <div className="px-2 pb-2 border-b border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate font-serif">
                  {selectedMenuBook.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  By {selectedMenuBook.author} • {selectedMenuBook.chapters.length} chapters
                </p>
              </div>
              <button
                onClick={() => setActiveMenuBookId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
              <button
                onClick={() => {
                  onSelectBook(selectedMenuBook);
                  setActiveMenuBookId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <BookOpen size={16} className="text-amber-400" />
                <span>Open in Studio</span>
              </button>

              <button
                onClick={() => {
                  setEditingCoverBook(selectedMenuBook);
                  setActiveMenuBookId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Palette size={16} className="text-sky-400" />
                <span>Change Cover</span>
              </button>

              <button
                onClick={() => {
                  onDuplicateBook(selectedMenuBook);
                  setActiveMenuBookId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Copy size={16} className="text-teal-400" />
                <span>Duplicate Book</span>
              </button>

              <button
                onClick={() => {
                  exportBookToPdf(selectedMenuBook);
                  setActiveMenuBookId(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Download size={16} className="text-emerald-400" />
                <span>Export Manuscript</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete book "${selectedMenuBook.title}"?`)) {
                    onDeleteBook(selectedMenuBook.id);
                    setActiveMenuBookId(null);
                  }
                }}
                className="col-span-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} className="text-rose-400" />
                <span>Delete Book</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Book Cover Modal */}
      {editingCoverBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditingCoverBook(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-4">
            <h3 className="text-sm font-semibold text-white">Select Leather Cover</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'leather-classic', name: 'Classic Havana', color: '#78350f' },
                { id: 'leather-dark', name: 'Dark Obsidian', color: '#1c1917' },
                { id: 'leather-cognac', name: 'Cognac Amber', color: '#b45309' },
                { id: 'leather-forest', name: 'Emerald Jade', color: '#064e3b' },
                { id: 'leather-crimson', name: 'Royal Crimson', color: '#881337' },
              ].map((tex) => (
                <button
                  key={tex.id}
                  onClick={() => {
                    const updated = {
                      ...editingCoverBook,
                      coverStyle: {
                        ...editingCoverBook.coverStyle,
                        texture: tex.id as BookCoverTexture,
                        goldFoil: true,
                      },
                    };
                    onUpdateBook(updated);
                    setEditingCoverBook(null);
                  }}
                  className="p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-1.5 hover:scale-105 transition-transform"
                  style={{ backgroundColor: tex.color }}
                >
                  <span className="text-[10px] font-bold text-white text-center leading-tight">
                    {tex.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-300 block mb-1">
                Or Custom Cover Image URL:
              </label>
              <input
                type="text"
                placeholder="https://example.com/cover.jpg"
                defaultValue={editingCoverBook.coverStyle?.customCoverUrl || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    const updated = {
                      ...editingCoverBook,
                      coverStyle: {
                        ...editingCoverBook.coverStyle,
                        texture: 'custom-image' as BookCoverTexture,
                        customCoverUrl: val,
                      },
                    };
                    onUpdateBook(updated);
                    setEditingCoverBook(null);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEditingCoverBook(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Book Modal */}
      {showNewBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowNewBookModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-3.5">
            <h3 className="text-sm font-semibold text-white">Create New Book Project</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Book Title *</label>
              <input
                type="text"
                placeholder="e.g. Whispering Pines"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subtitle</label>
              <input
                type="text"
                placeholder="e.g. Book 1: Echoes of Dawn"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Author</label>
                <input
                  type="text"
                  placeholder="Author Name"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Genre</label>
                <input
                  type="text"
                  placeholder="e.g. Mystery"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Cover Leather</label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'leather-classic', name: 'Classic' },
                  { id: 'leather-dark', name: 'Obsidian' },
                  { id: 'leather-cognac', name: 'Cognac' },
                  { id: 'leather-forest', name: 'Forest' },
                  { id: 'leather-crimson', name: 'Crimson' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setNewCoverTexture(l.id as BookCoverTexture)}
                    className={`py-1 px-2 rounded border text-center font-medium ${
                      newCoverTexture === l.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewBookModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewBook}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Create Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
