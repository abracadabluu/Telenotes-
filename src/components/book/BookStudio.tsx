import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  BookOpen,
  List,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Subscript,
  Superscript,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  ListOrdered,
  Quote,
  Palette,
  X,
  Smile,
  ChevronDown,
  Download,
  CheckCircle,
  Clock,
  ChevronRight,
  CornerDownRight,
} from 'lucide-react';
import {
  BookProject,
  BookChapter,
  AppSettings,
  CanvasSticker,
  CanvasBackground,
} from '../../types';
import { exportBookToPdf } from '../../services/cryptoVault';
import { PRESET_STICKERS } from '../canvas/Stickers';

interface BookStudioProps {
  book: BookProject;
  settings: AppSettings;
  onSaveBook: (book: BookProject) => void;
  onBack: () => void;
}

const HINDI_FONTS = [
  { id: 'Poppins', name: 'Poppins (Clean)' },
  { id: 'Rozha One', name: 'Rozha One (Headline)' },
  { id: 'Noto Sans Devanagari', name: 'Noto Sans (Standard)' },
  { id: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari (Book Serif)' },
  { id: 'Kalam', name: 'Kalam (Handwritten)' },
  { id: 'Yatra One', name: 'Yatra One (Wooden)' },
];

const ENGLISH_FONTS = [
  { id: 'Lora', name: 'Lora (Literary Serif)' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
  { id: 'Outfit', name: 'Outfit' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono' },
];

export const BookStudio: React.FC<BookStudioProps> = ({
  book,
  settings,
  onSaveBook,
  onBack,
}) => {
  const [currentBook, setCurrentBook] = useState<BookProject>(book);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    book.chapters[0]?.id || 'chap_1'
  );

  const activeChapter =
    currentBook.chapters.find((c) => c.id === activeChapterId) ||
    currentBook.chapters[0];

  const [chapterTitle, setChapterTitle] = useState(activeChapter?.title || 'Chapter 1');
  const [chapterStatus, setChapterStatus] = useState<
    'draft' | 'revised' | 'complete'
  >(activeChapter?.status || 'draft');

  const [fontFamily, setFontFamily] = useState(
    settings.activeFontFamily || 'Lora'
  );
  const [fontSize, setFontSize] = useState(17);

  // Background Image customization state
  const [bgImageUrl, setBgImageUrl] = useState(
    currentBook.canvasBackground?.url || ''
  );
  const [bgOpacity, setBgOpacity] = useState(
    currentBook.canvasBackground?.opacity || 0.2
  );

  // Floating Selection Toolbar
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Category Popups
  const [activeCategory, setActiveCategory] = useState<
    'align' | 'headings' | 'lists' | 'fonts' | 'background' | null
  >(null);

  // Modals & Drawers
  const [showChaptersDrawer, setShowChaptersDrawer] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [stickers, setStickers] = useState<CanvasSticker[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeChapter) {
      setChapterTitle(activeChapter.title);
      setChapterStatus(activeChapter.status || 'draft');
      if (editorRef.current) {
        editorRef.current.innerHTML = activeChapter.content || '<p></p>';
      }
    }
  }, [activeChapterId]);

  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  const handleSelectionCheck = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setFloatingToolbarPos(null);
      return;
    }

    if (editorRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();

      if (rect && containerRect) {
        setFloatingToolbarPos({
          top: Math.max(10, rect.top - containerRect.top - 50),
          left: Math.max(
            10,
            Math.min(
              containerRect.width - 280,
              rect.left - containerRect.left + rect.width / 2 - 140
            )
          ),
        });
      }
    } else {
      setFloatingToolbarPos(null);
    }
  };

  const handleEditorInput = () => {
    if (!editorRef.current || !activeChapter) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    const updatedChapters = currentBook.chapters.map((c) =>
      c.id === activeChapterId
        ? {
            ...c,
            title: chapterTitle,
            content: html,
            wordCount,
            status: chapterStatus,
          }
        : c
    );

    const updated = {
      ...currentBook,
      chapters: updatedChapters,
      updatedAt: Date.now(),
      canvasBackground: bgImageUrl
        ? { url: bgImageUrl, opacity: bgOpacity }
        : undefined,
    };
    setCurrentBook(updated);
    onSaveBook(updated);
  };

  const handleAddNewChapter = () => {
    const newChapNumber = currentBook.chapters.length + 1;
    const newChap: BookChapter = {
      id: 'chap_' + Date.now(),
      title: `Chapter ${newChapNumber}: Untitled`,
      order: newChapNumber,
      content: '<p>Start writing chapter...</p>',
      wordCount: 0,
      status: 'draft',
    };

    const updated = {
      ...currentBook,
      chapters: [...currentBook.chapters, newChap],
      updatedAt: Date.now(),
    };
    setCurrentBook(updated);
    setActiveChapterId(newChap.id);
    onSaveBook(updated);
    setShowChaptersDrawer(false);
  };

  const handleDeleteChapter = (chapId: string) => {
    if (currentBook.chapters.length <= 1) {
      alert('A book must have at least one chapter.');
      return;
    }
    const updatedChapters = currentBook.chapters.filter((c) => c.id !== chapId);
    const updated = {
      ...currentBook,
      chapters: updatedChapters,
      updatedAt: Date.now(),
    };
    setCurrentBook(updated);
    if (activeChapterId === chapId) {
      setActiveChapterId(updatedChapters[0].id);
    }
    onSaveBook(updated);
  };

  const totalWords = currentBook.chapters.reduce(
    (acc, c) => acc + (c.wordCount || 0),
    0
  );
  const wordGoalPct = Math.min(
    100,
    Math.round((totalWords / (currentBook.targetWords || 25000)) * 100)
  );

  return (
    <div
      ref={canvasContainerRef}
      onMouseUp={handleSelectionCheck}
      onTouchEnd={handleSelectionCheck}
      className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative"
      style={{ fontFamily }}
    >
      {/* Background Image with Transparency */}
      {bgImageUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Top Header */}
      <div className="px-4 py-3 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              handleEditorInput();
              onBack();
            }}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Books"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Chapters Drawer Trigger */}
          <button
            onClick={() => setShowChaptersDrawer(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 hover:bg-amber-500/25 transition-all text-xs font-semibold"
          >
            <BookOpen size={15} className="text-amber-400" />
            <span className="truncate max-w-[120px]">{chapterTitle}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Right Stats & Actions */}
        <div className="flex items-center gap-2">
          {/* Progress Goal */}
          <div className="hidden sm:flex flex-col items-end text-[11px] font-mono">
            <span className="text-amber-300 font-semibold">
              {totalWords.toLocaleString()} / {currentBook.targetWords.toLocaleString()} w
            </span>
            <span className="text-slate-400 text-[10px]">{wordGoalPct}% goal</span>
          </div>

          <button
            onClick={() => setShowStickerDrawer(true)}
            className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Stickers"
          >
            <Smile size={19} />
          </button>

          <button
            onClick={() => exportBookToPdf(currentBook)}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Export Manuscript PDF"
          >
            <Download size={19} />
          </button>

          <button
            onClick={() => {
              handleEditorInput();
              onBack();
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Chapter Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 flex flex-col">
        {/* Chapter Title & Status Header */}
        <div className="max-w-2xl mx-auto w-full mb-6 pb-3 border-b border-slate-800/80">
          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => {
              setChapterTitle(e.target.value);
              handleEditorInput();
            }}
            placeholder="Chapter Title..."
            className="w-full text-xl sm:text-2xl font-bold bg-transparent text-amber-200 placeholder-slate-600 focus:outline-none font-serif"
          />

          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <select
                value={chapterStatus}
                onChange={(e) => {
                  setChapterStatus(e.target.value as 'draft' | 'revised' | 'complete');
                  handleEditorInput();
                }}
                className="bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-xs text-amber-300 font-medium"
              >
                <option value="draft">Draft</option>
                <option value="revised">In Revision</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <span className="font-mono text-[11px]">
              {activeChapter?.wordCount || 0} words in chapter
            </span>
          </div>
        </div>

        {/* Contenteditable Novel Area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          data-placeholder="Begin writing your novel chapter here..."
          className="flex-1 min-h-[400px] focus:outline-none text-slate-200 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto w-full empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 empty:before:pointer-events-none font-serif"
          style={{ fontSize: `${fontSize}px` }}
        />
      </div>

      {/* FLOATING TEXT SELECTION TOOLBAR */}
      {floatingToolbarPos && (
        <div
          style={{
            top: `${floatingToolbarPos.top}px`,
            left: `${floatingToolbarPos.left}px`,
          }}
          className="absolute z-40 bg-slate-900 border border-slate-700/80 shadow-2xl rounded-xl p-1.5 flex items-center gap-1 text-slate-200 backdrop-blur-md animate-fadeIn"
        >
          <button
            onClick={() => formatDoc('bold')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
            title="Bold"
          >
            <Bold size={15} />
          </button>
          <button
            onClick={() => formatDoc('italic')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
            title="Italic"
          >
            <Italic size={15} />
          </button>
          <button
            onClick={() => formatDoc('underline')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
            title="Underline"
          >
            <Underline size={15} />
          </button>
          <button
            onClick={() => formatDoc('strikeThrough')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>
          <button
            onClick={() => formatDoc('hiliteColor', '#fef08a')}
            className="p-1.5 hover:bg-slate-800 rounded text-amber-300 hover:text-amber-200"
            title="Highlight"
          >
            <Highlighter size={15} />
          </button>
          <button
            onClick={() => formatDoc('subscript')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
          >
            <Subscript size={15} />
          </button>
          <button
            onClick={() => formatDoc('superscript')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
          >
            <Superscript size={15} />
          </button>
          <button
            onClick={() => formatDoc('formatBlock', 'blockquote')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
          >
            <Quote size={15} />
          </button>
        </div>
      )}

      {/* DOCKED FORMATTING CATEGORY POPUP CONTENT */}
      {activeCategory && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 z-30 animate-slideDown shadow-xl text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-300 capitalize">
              {activeCategory} Options
            </span>
            <button
              onClick={() => setActiveCategory(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {activeCategory === 'align' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => formatDoc('justifyLeft')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <AlignLeft size={16} />
              </button>
              <button
                onClick={() => formatDoc('justifyCenter')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <AlignCenter size={16} />
              </button>
              <button
                onClick={() => formatDoc('justifyRight')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <AlignRight size={16} />
              </button>
              <button
                onClick={() => formatDoc('justifyFull')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <AlignJustify size={16} />
              </button>
              <button
                onClick={() => formatDoc('indent')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <CornerDownRight size={16} />
              </button>
            </div>
          )}

          {activeCategory === 'headings' && (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => formatDoc('formatBlock', 'h1')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H1
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h2')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H2
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h3')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H3
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'p')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center"
              >
                Paragraph
              </button>
            </div>
          )}

          {activeCategory === 'fonts' && (
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-amber-300 block mb-1.5">
                  🇮🇳 Hindi Fonts
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {HINDI_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFontFamily(f.id);
                        setActiveCategory(null);
                      }}
                      className={`p-2 rounded border text-left text-xs ${
                        fontFamily === f.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-sky-300 block mb-1.5">
                  🌐 English Fonts
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ENGLISH_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFontFamily(f.id);
                        setActiveCategory(null);
                      }}
                      className={`p-2 rounded border text-left text-xs ${
                        fontFamily === f.id
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'background' && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Background image URL..."
                value={bgImageUrl}
                onChange={(e) => setBgImageUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
              {bgImageUrl && (
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Opacity: {Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DOCKED BOTTOM FORMATTING BAR */}
      <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between z-30 shrink-0 text-xs overflow-x-auto no-scrollbar gap-1 backdrop-blur-md">
        <button
          onClick={() =>
            setActiveCategory(activeCategory === 'align' ? null : 'align')
          }
          className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <AlignLeft size={15} />
          <span>Align</span>
        </button>

        <button
          onClick={() =>
            setActiveCategory(activeCategory === 'headings' ? null : 'headings')
          }
          className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <Type size={15} />
          <span>Headings</span>
        </button>

        <button
          onClick={() =>
            setActiveCategory(activeCategory === 'fonts' ? null : 'fonts')
          }
          className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <span>{fontFamily.split(' ')[0]}</span>
          <ChevronDown size={13} />
        </button>

        <button
          onClick={() =>
            setActiveCategory(
              activeCategory === 'background' ? null : 'background'
            )
          }
          className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 flex items-center gap-1"
        >
          <Palette size={15} />
          <span>BG</span>
        </button>
      </div>

      {/* CHAPTERS DRAWER / SIDEBAR (Requirement #12) */}
      {showChaptersDrawer && (
        <div className="fixed inset-0 z-50 flex justify-start select-none">
          <div
            onClick={() => setShowChaptersDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-xs h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white font-serif">
                  {currentBook.title}
                </h3>
                <p className="text-[11px] text-amber-400">Chapters & Manuscript</p>
              </div>
              <button
                onClick={() => setShowChaptersDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {currentBook.chapters.map((chap, idx) => (
                <div
                  key={chap.id}
                  onClick={() => {
                    handleEditorInput();
                    setActiveChapterId(chap.id);
                    setShowChaptersDrawer(false);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    chap.id === activeChapterId
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold truncate font-serif">
                      {chap.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{chap.wordCount || 0} words</span>
                      <span className="capitalize text-amber-400/80">
                        • {chap.status || 'draft'}
                      </span>
                    </div>
                  </div>
                  {currentBook.chapters.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${chap.title}"?`)) {
                          handleDeleteChapter(chap.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddNewChapter}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md mt-2"
            >
              <Plus size={16} />
              <span>Add New Chapter</span>
            </button>
          </div>
        </div>
      )}

      {/* STICKERS DRAWER */}
      {showStickerDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          <div
            onClick={() => setShowStickerDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 shadow-2xl z-10 max-w-lg mx-auto w-full max-h-[60vh] flex flex-col">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Stickers & GIFs</h3>
              <button
                onClick={() => setShowStickerDrawer(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 grid grid-cols-4 gap-3">
              {PRESET_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => {
                    const newSticker: CanvasSticker = {
                      id: 'stk_' + Date.now(),
                      stickerUrl: stk.svgDataUri,
                      name: stk.name,
                      x: 35,
                      y: 35,
                      scale: 1,
                      rotation: 0,
                    };
                    setStickers([...stickers, newSticker]);
                    setShowStickerDrawer(false);
                  }}
                  className="aspect-square rounded-xl bg-slate-800/40 hover:bg-slate-800 p-2 flex flex-col items-center justify-center transition-all hover:scale-105"
                >
                  <img
                    src={stk.svgDataUri}
                    alt={stk.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 truncate">
                    {stk.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
