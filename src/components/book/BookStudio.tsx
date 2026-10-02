import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  FileText,
  Bookmark,
  Users,
  Save,
  Download,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  Type,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Quote,
  Smile,
  ImageIcon,
  X,
} from 'lucide-react';
import { BookProject, BookChapter, BookCharacter } from '../../types';
import { exportBookToPdf, downloadBlob } from '../../services/cryptoVault';
import { PRESET_STICKERS, StickerDefinition } from '../canvas/Stickers';

interface BookStudioProps {
  books: BookProject[];
  onSaveBook: (book: BookProject) => void;
  onDeleteBook: (bookId: string) => void;
  onBack: () => void;
}

export const BookStudio: React.FC<BookStudioProps> = ({
  books,
  onSaveBook,
  onDeleteBook,
  onBack,
}) => {
  const [selectedBook, setSelectedBook] = useState<BookProject | null>(books[0] || null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    books[0]?.chapters[0]?.id || null
  );

  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showCharactersModal, setShowCharactersModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);

  // New book fields
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newGenre, setNewGenre] = useState('Fiction');
  const [newTargetWords, setNewTargetWords] = useState(25000);

  // Active chapter editor
  const [activeContent, setActiveContent] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [fontFamily, setFontFamily] = useState('font-serif');
  const editorRef = useRef<HTMLDivElement | null>(null);

  const activeChapter = selectedBook?.chapters.find((c) => c.id === activeChapterId);

  useEffect(() => {
    if (activeChapter) {
      setChapterTitle(activeChapter.title);
      setActiveContent(activeChapter.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = activeChapter.content;
      }
    }
  }, [activeChapterId]);

  const handleEditorInput = () => {
    if (editorRef.current && selectedBook && activeChapterId) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || '';
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      setActiveContent(html);

      const updatedChapters = selectedBook.chapters.map((c) =>
        c.id === activeChapterId ? { ...c, content: html, wordCount } : c
      );

      const updatedBook = {
        ...selectedBook,
        chapters: updatedChapters,
        updatedAt: Date.now(),
      };
      setSelectedBook(updatedBook);
      onSaveBook(updatedBook);
    }
  };

  const handleChapterTitleChange = (newTitleText: string) => {
    setChapterTitle(newTitleText);
    if (!selectedBook || !activeChapterId) return;
    const updatedChapters = selectedBook.chapters.map((c) =>
      c.id === activeChapterId ? { ...c, title: newTitleText } : c
    );
    const updatedBook = { ...selectedBook, chapters: updatedChapters, updatedAt: Date.now() };
    setSelectedBook(updatedBook);
    onSaveBook(updatedBook);
  };

  const handleAddChapter = () => {
    if (!selectedBook) return;
    const newChap: BookChapter = {
      id: 'chap_' + Date.now(),
      title: `Chapter ${selectedBook.chapters.length + 1}`,
      order: selectedBook.chapters.length + 1,
      content: '<p>Start writing your chapter...</p>',
      wordCount: 0,
      status: 'draft',
    };
    const updatedBook = {
      ...selectedBook,
      chapters: [...selectedBook.chapters, newChap],
      updatedAt: Date.now(),
    };
    setSelectedBook(updatedBook);
    setActiveChapterId(newChap.id);
    onSaveBook(updatedBook);
    setShowChaptersDrawer(false);
  };

  const handleDeleteChapter = (chapId: string) => {
    if (!selectedBook || selectedBook.chapters.length <= 1) return;
    const updatedChapters = selectedBook.chapters.filter((c) => c.id !== chapId);
    const updatedBook = { ...selectedBook, chapters: updatedChapters, updatedAt: Date.now() };
    setSelectedBook(updatedBook);
    if (activeChapterId === chapId) {
      setActiveChapterId(updatedChapters[0]?.id || null);
    }
    onSaveBook(updatedBook);
  };

  const handleCreateBook = () => {
    if (!newTitle.trim()) return;
    const initialChapter: BookChapter = {
      id: 'chap_' + Date.now(),
      title: 'Chapter 1: The Beginning',
      order: 1,
      content: '<p>Write the opening scene of your novel...</p>',
      wordCount: 0,
      status: 'draft',
    };

    const newBook: BookProject = {
      id: 'book_' + Date.now(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      author: newAuthor.trim() || 'Author',
      genre: newGenre,
      targetWords: Number(newTargetWords) || 20000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: [initialChapter],
      characters: [],
      outlineNotes: '',
    };

    onSaveBook(newBook);
    setSelectedBook(newBook);
    setActiveChapterId(initialChapter.id);
    setShowNewBookModal(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewAuthor('');
  };

  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  // Stats calculation
  const totalBookWords =
    selectedBook?.chapters.reduce((sum, chap) => sum + (chap.wordCount || 0), 0) || 0;
  const progressPercent = selectedBook
    ? Math.min(100, Math.round((totalBookWords / selectedBook.targetWords) * 100))
    : 0;
  const readingTimeMins = Math.ceil(totalBookWords / 200);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden relative">
      {/* Book Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Back to Diaries"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Book Writing Studio
              </span>
              <span className="text-[11px] text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {selectedBook?.title || 'No Book Selected'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>{totalBookWords.toLocaleString()} words</span>
              <span>·</span>
              <span>{progressPercent}% target</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Books Drawer / Selector */}
          <button
            type="button"
            onClick={() => setShowChaptersDrawer(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs border border-slate-700/80"
            title="Table of Contents & Chapters"
          >
            <BookOpen size={14} className="text-sky-400" />
            <span className="hidden sm:inline">Chapters ({selectedBook?.chapters.length || 0})</span>
          </button>

          {/* New Book Button */}
          <button
            type="button"
            onClick={() => setShowNewBookModal(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Create New Book Project"
          >
            <Plus size={16} />
          </button>

          {/* Export Book */}
          {selectedBook && (
            <button
              type="button"
              onClick={() => exportBookToPdf(selectedBook)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
              title="Export Book Manuscript to PDF"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Progress Bar */}
      {selectedBook && (
        <div className="w-full bg-slate-950 h-1.5 relative overflow-hidden shrink-0">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Formatting & Tools Bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto text-slate-300 text-xs shrink-0 scrollbar-none">
        <button
          type="button"
          onClick={() => formatDoc('bold')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center font-bold"
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('italic')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center italic"
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('underline')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center underline"
          title="Underline"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('formatBlock', '<h2>')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Subheading"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('formatBlock', '<blockquote>')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Dialogue / Blockquote"
        >
          <Quote size={15} />
        </button>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-[11px] rounded px-1.5 py-0.5 text-slate-200 outline-none shrink-0"
        >
          <option value="font-serif">Literary Serif</option>
          <option value="font-sans">Modern Sans</option>
          <option value="font-mono">Draft Monospace</option>
        </select>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Characters Drawer trigger */}
        <button
          type="button"
          onClick={() => setShowCharactersModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 shrink-0"
          title="Character Bible"
        >
          <Users size={13} className="text-amber-400" />
          <span>Characters ({selectedBook?.characters.length || 0})</span>
        </button>

        {/* Outline / Story notes trigger */}
        <button
          type="button"
          onClick={() => setShowOutlineModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 shrink-0"
          title="Manuscript Outline & Plot"
        >
          <FileText size={13} className="text-indigo-400" />
          <span>Outline</span>
        </button>
      </div>

      {/* Main Chapter Writing Canvas */}
      {selectedBook && activeChapter ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
          {/* Chapter Metadata & Title */}
          <div className="border-b border-slate-800/80 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Chapter {activeChapter.order} · {activeChapter.wordCount} words · ~{Math.ceil(activeChapter.wordCount / 200)} min read
            </span>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => handleChapterTitleChange(e.target.value)}
              placeholder="Chapter Title..."
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-500 focus:outline-none mt-1 border-b border-transparent focus:border-sky-500/40 pb-1"
            />
          </div>

          {/* Chapter Content Editable */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            className={`min-h-[450px] outline-none text-slate-200 leading-relaxed text-base prose prose-invert max-w-none ${fontFamily}`}
            style={{
              lineHeight: '1.8',
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <BookOpen size={48} className="text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No Book Project Active</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Create your first novel or book project to start writing chapters and building characters.
          </p>
          <button
            type="button"
            onClick={() => setShowNewBookModal(true)}
            className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Create New Book
          </button>
        </div>
      )}

      {/* Chapters & TOC Drawer */}
      {showChaptersDrawer && selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start">
          <div className="bg-slate-900 border-r border-slate-800 w-80 max-w-full h-full p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100">Table of Contents</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChaptersDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedBook.chapters.length} Chapters
              </span>
              <button
                type="button"
                onClick={handleAddChapter}
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs"
              >
                <Plus size={13} />
                <span>Add Chapter</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
              {selectedBook.chapters.map((chap, idx) => (
                <div
                  key={chap.id}
                  onClick={() => {
                    setActiveChapterId(chap.id);
                    setShowChaptersDrawer(false);
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between group transition-colors ${
                    activeChapterId === chap.id
                      ? 'bg-sky-600/20 border border-sky-500/40 text-sky-200'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold truncate">{chap.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {chap.wordCount} words · {chap.status}
                    </div>
                  </div>
                  {selectedBook.chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chap.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Other Books Switcher */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                All Book Projects
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {books.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBook(b);
                      setActiveChapterId(b.chapters[0]?.id || null);
                      setShowChaptersDrawer(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                      selectedBook.id === b.id
                        ? 'bg-slate-800 text-sky-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    📖 {b.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Bible Modal */}
      {showCharactersModal && selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">Character Bible</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCharactersModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedBook.characters.map((char, i) => (
                <div key={i} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-white">{char.name}</span>
                    <span className="text-[10px] text-amber-400 font-medium">{char.role}</span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{char.notes}</p>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300">Add New Character</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    id="newCharName"
                    type="text"
                    placeholder="Character Name"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    id="newCharRole"
                    type="text"
                    placeholder="Role (e.g. Protagonist)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <textarea
                  id="newCharBio"
                  placeholder="Personality traits, motivation, background notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white h-16 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nameEl = document.getElementById('newCharName') as HTMLInputElement;
                    const roleEl = document.getElementById('newCharRole') as HTMLInputElement;
                    const bioEl = document.getElementById('newCharBio') as HTMLTextAreaElement;
                    if (!nameEl?.value.trim()) return;

                    const newChar: BookCharacter = {
                      id: 'char_' + Date.now(),
                      name: nameEl.value.trim(),
                      role: roleEl?.value.trim() || 'Supporting',
                      notes: bioEl?.value.trim() || '',
                    };

                    const updatedBook = {
                      ...selectedBook,
                      characters: [...selectedBook.characters, newChar],
                      updatedAt: Date.now(),
                    };
                    setSelectedBook(updatedBook);
                    onSaveBook(updatedBook);
                    nameEl.value = '';
                    if (roleEl) roleEl.value = '';
                    if (bioEl) bioEl.value = '';
                  }}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg"
                >
                  Save Character
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuscript Outline Modal */}
      {showOutlineModal && selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Manuscript Outline & Notes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOutlineModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              value={selectedBook.outlineNotes}
              onChange={(e) => {
                const updatedBook = {
                  ...selectedBook,
                  outlineNotes: e.target.value,
                  updatedAt: Date.now(),
                };
                setSelectedBook(updatedBook);
                onSaveBook(updatedBook);
              }}
              placeholder="Outline your three-act structure, plot twists, climax, and worldbuilding notes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white h-60 outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowOutlineModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Close & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Book Modal */}
      {showNewBookModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <BookOpen size={16} className="text-sky-400" />
                <span>New Book Project</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBookModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Book Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chronicles of the Secret City"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Subtitle (optional)</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Book 1: The First Awakening"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Author Name</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Your pen name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Target Word Count</label>
                  <input
                    type="number"
                    value={newTargetWords}
                    onChange={(e) => setNewTargetWords(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBookModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBook}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
