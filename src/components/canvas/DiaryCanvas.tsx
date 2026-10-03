import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Link as LinkIcon,
  Smile,
  Mic,
  Image as ImageIcon,
  Bell,
  Trash2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  X,
  Plus,
  Check,
  Subscript,
  Superscript,
  ChevronDown,
  Palette,
  Sliders,
  Maximize2,
  Move,
  CornerDownRight,
} from 'lucide-react';
import {
  DiaryEntry,
  AudioRecording,
  CanvasSticker,
  MediaAttachment,
  EntryReminder,
  Folder,
  AppSettings,
  CanvasBackground,
} from '../../types';
import { PRESET_STICKERS } from './Stickers';
import { AudioRecorder, AudioPlayerItem } from './AudioRecorder';

interface DiaryCanvasProps {
  entry?: DiaryEntry | null;
  folders: Folder[];
  currentFolderId: string;
  settings: AppSettings;
  onSave: (entry: DiaryEntry) => void;
  onBack: () => void;
}

const EMOJI_AVATARS = [
  '📔', '✨', '☕', '🌿', '🌙', '🔥', '🚀', '💡',
  '🎨', '🎯', '🐱', '📖', '❤️', '💎', '🌸', '🌊',
];

const HINDI_FONTS = [
  { id: 'Poppins', name: 'Poppins (Modern Clean)' },
  { id: 'Rozha One', name: 'Rozha One (Bold Headline)' },
  { id: 'Noto Sans Devanagari', name: 'Noto Sans (Standard)' },
  { id: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari (Serif)' },
  { id: 'Kalam', name: 'Kalam (Handwritten)' },
  { id: 'Yatra One', name: 'Yatra One (Vintage Wooden)' },
];

const ENGLISH_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
  { id: 'Outfit', name: 'Outfit' },
  { id: 'Lora', name: 'Lora (Serif)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Code)' },
];

export const DiaryCanvas: React.FC<DiaryCanvasProps> = ({
  entry,
  folders,
  currentFolderId,
  settings,
  onSave,
  onBack,
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [folderId, setFolderId] = useState(entry?.folderId || currentFolderId || 'all');
  const [avatar, setAvatar] = useState(
    entry?.avatar || { type: 'emoji' as const, value: '📔', bgColor: '#0284c7' }
  );

  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>(
    entry?.audioRecordings || []
  );
  const [stickers, setStickers] = useState<CanvasSticker[]>(entry?.stickers || []);
  const [attachments, setAttachments] = useState<MediaAttachment[]>(
    entry?.attachments || []
  );
  const [reminder, setReminder] = useState<EntryReminder | undefined>(entry?.reminder);
  const [canvasBg, setCanvasBg] = useState<CanvasBackground | undefined>(
    entry?.canvasBackground
  );

  const [fontFamily, setFontFamily] = useState(
    entry?.fontFamily || settings.activeFontFamily || 'Plus Jakarta Sans'
  );
  const [fontSize, setFontSize] = useState(entry?.fontSize || 16);

  // Floating selection toolbar state
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [floatingToolbarPos, setFloatingToolbarPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Active category popups in docked toolbar
  const [activeCategory, setActiveCategory] = useState<
    'align' | 'headings' | 'lists' | 'fonts' | 'background' | null
  >(null);

  // Modals & Drawers
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Sticker size control
  const [stickerScale, setStickerScale] = useState<number>(1);

  // Link Dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Background Image customization state
  const [bgImageUrl, setBgImageUrl] = useState(canvasBg?.url || '');
  const [bgOpacity, setBgOpacity] = useState(canvasBg?.opacity || 0.25);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);

  const createdAtTimestamp = entry?.createdAt || Date.now();

  useEffect(() => {
    if (editorRef.current && content) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, []);

  // Format document execCommand wrapper
  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Text selection detector for floating toolbar
  const handleSelectionCheck = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setFloatingToolbarPos(null);
      setSelectionRange(null);
      return;
    }

    if (editorRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();

      if (rect && containerRect) {
        setSelectionRange(range);
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
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Save Entry
  const handleSave = () => {
    const plainText = editorRef.current?.innerText || '';
    const finalTitle =
      title.trim() ||
      plainText.slice(0, 30).trim() ||
      `Note ${new Date().toLocaleDateString()}`;

    const updatedEntry: DiaryEntry = {
      id: entry?.id || 'diary_' + Date.now(),
      title: finalTitle,
      content: editorRef.current?.innerHTML || content,
      plainText,
      createdAt: createdAtTimestamp,
      updatedAt: Date.now(),
      avatar,
      folderId,
      isPinned: entry?.isPinned || false,
      audioRecordings,
      stickers,
      attachments,
      reminder,
      tags: entry?.tags || [],
      fontFamily,
      fontSize,
      canvasBackground: bgImageUrl
        ? { url: bgImageUrl, opacity: bgOpacity }
        : undefined,
    };

    onSave(updatedEntry);
  };

  // Add Sticker / GIF (Gboard or file)
  const handleAddSticker = (stickerUrl: string, name: string, isGif = false) => {
    const newSticker: CanvasSticker = {
      id: 'stk_' + Date.now(),
      stickerUrl,
      name,
      x: 35 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      scale: 1,
      rotation: Math.floor(Math.random() * 16) - 8,
      isGif,
    };
    setStickers([...stickers, newSticker]);
    setActiveStickerId(newSticker.id);
    setShowStickerDrawer(false);
  };

  // Upload custom sticker / GIF
  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isGif = file.type === 'image/gif';
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      handleAddSticker(url, file.name.slice(0, 12), isGif);
    };
    reader.readAsDataURL(file);
  };

  // Upload Canvas Background Image
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBgImageUrl(url);
      setCanvasBg({ url, opacity: bgOpacity });
    };
    reader.readAsDataURL(file);
  };

  // Update Sticker Scale
  const handleUpdateStickerScale = (newScale: number) => {
    if (!activeStickerId) return;
    setStickers(
      stickers.map((s) => (s.id === activeStickerId ? { ...s, scale: newScale } : s))
    );
  };

  // Delete Active Sticker
  const handleDeleteActiveSticker = () => {
    if (!activeStickerId) return;
    setStickers(stickers.filter((s) => s.id !== activeStickerId));
    setActiveStickerId(null);
  };

  // Word count & Read time
  const plainText = editorRef.current?.innerText || '';
  const wordCount = plainText.trim()
    ? plainText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const isToolbarTop = settings.toolbarPosition === 'top';

  return (
    <div
      ref={canvasContainerRef}
      onMouseUp={handleSelectionCheck}
      onTouchEnd={handleSelectionCheck}
      className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative"
      style={{ fontFamily }}
    >
      {/* Custom Background Image with Transparency (Requirement #13) */}
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

      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleSave();
              onBack();
            }}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Save & Back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Emoji Avatar Picker */}
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base border border-white/20 transition-transform active:scale-95 shadow-sm"
            style={{ backgroundColor: avatar.bgColor || '#0284c7' }}
          >
            <span>{avatar.value}</span>
          </button>

          {/* Title input */}
          <input
            type="text"
            placeholder="Title of this entry..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none max-w-[150px] sm:max-w-xs"
          />
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          {/* Word Count Pill */}
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            {wordCount} words
          </span>

          {/* Stickers Button */}
          <button
            onClick={() => setShowStickerDrawer(true)}
            className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Add Stickers & GIFs"
          >
            <Smile size={19} />
          </button>

          {/* Audio Voice Note Button */}
          <button
            onClick={() => setShowAudioRecorder(true)}
            className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-colors"
            title="Record Voice Note"
          >
            <Mic size={19} />
          </button>

          {/* Save Button */}
          <button
            onClick={() => {
              handleSave();
              onBack();
            }}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* TOP DOCKED TOOLBAR (When configured in Settings) */}
      {isToolbarTop && (
        <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20 overflow-x-auto no-scrollbar gap-1 text-xs">
          {/* Categories Rendered */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setActiveCategory(activeCategory === 'align' ? null : 'align')
              }
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                activeCategory === 'align'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <AlignLeft size={14} />
              <span>Align</span>
            </button>

            <button
              onClick={() =>
                setActiveCategory(activeCategory === 'headings' ? null : 'headings')
              }
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                activeCategory === 'headings'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Type size={14} />
              <span>Headings</span>
            </button>

            <button
              onClick={() =>
                setActiveCategory(activeCategory === 'lists' ? null : 'lists')
              }
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                activeCategory === 'lists'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <List size={14} />
              <span>Lists</span>
            </button>

            <button
              onClick={() =>
                setActiveCategory(activeCategory === 'fonts' ? null : 'fonts')
              }
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                activeCategory === 'fonts'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{fontFamily.split(' ')[0]}</span>
              <ChevronDown size={12} />
            </button>

            <button
              onClick={() =>
                setActiveCategory(
                  activeCategory === 'background' ? null : 'background'
                )
              }
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 border transition-colors ${
                activeCategory === 'background'
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Palette size={14} />
              <span>Canvas BG</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Rich Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 flex flex-col">
        {/* Audio Recordings Carousel (if any recorded) */}
        {audioRecordings.length > 0 && (
          <div className="mb-4 space-y-2">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              🎙️ Voice Memos ({audioRecordings.length})
            </span>
            <div className="space-y-1.5">
              {audioRecordings.map((rec) => (
                <AudioPlayerItem
                  key={rec.id}
                  recording={rec}
                  onDelete={() =>
                    setAudioRecordings(audioRecordings.filter((r) => r.id !== rec.id))
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* ContentEditable Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          data-placeholder="Start typing your thoughts, memories, stories..."
          className="flex-1 min-h-[300px] focus:outline-none text-slate-200 leading-relaxed text-base max-w-2xl mx-auto w-full empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 empty:before:pointer-events-none"
          style={{ fontSize: `${fontSize}px` }}
        />

        {/* Borderless Floating Stickers & GIFs (Requirement #10) */}
        {stickers.map((stk) => (
          <div
            key={stk.id}
            onClick={() => setActiveStickerId(stk.id)}
            className={`absolute cursor-move select-none transition-transform z-20 ${
              activeStickerId === stk.id ? 'ring-2 ring-sky-400 rounded-lg p-1' : ''
            }`}
            style={{
              top: `${stk.y}%`,
              left: `${stk.x}%`,
              transform: `scale(${stk.scale || 1}) rotate(${stk.rotation || 0}deg)`,
            }}
          >
            <img
              src={stk.stickerUrl}
              alt={stk.name}
              className="max-w-[120px] max-h-[120px] object-contain drop-shadow-md pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Active Sticker Size & Delete Toolbar */}
      {activeStickerId && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between z-30 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sticker Size:</span>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.1}
              value={
                stickers.find((s) => s.id === activeStickerId)?.scale || 1
              }
              onChange={(e) => handleUpdateStickerScale(parseFloat(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
          </div>
          <button
            onClick={handleDeleteActiveSticker}
            className="px-2 py-1 bg-rose-900/40 text-rose-300 rounded hover:bg-rose-900/70 flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* FLOATING TEXT SELECTION TOOLBAR (Requirement #10) */}
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
            title="Highlight / Mark"
          >
            <Highlighter size={15} />
          </button>
          <button
            onClick={() => formatDoc('subscript')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Subscript"
          >
            <Subscript size={15} />
          </button>
          <button
            onClick={() => formatDoc('superscript')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Superscript"
          >
            <Superscript size={15} />
          </button>
          <button
            onClick={() => formatDoc('formatBlock', 'pre')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Monospace Code"
          >
            <Code size={15} />
          </button>
          <button
            onClick={() => {
              const url = prompt('Enter Web Link URL:');
              if (url) formatDoc('createLink', url);
            }}
            className="p-1.5 hover:bg-slate-800 rounded text-sky-400"
            title="Create Link"
          >
            <LinkIcon size={15} />
          </button>
        </div>
      )}

      {/* DOCKED FORMATTING CATEGORY POPUP CONTENT */}
      {activeCategory && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 z-30 animate-slideDown shadow-xl text-xs">
          {/* Universal Click-Outside Dismissal (Requirement #8) */}
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

          {/* 1. Alignment & Spacing */}
          {activeCategory === 'align' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => formatDoc('justifyLeft')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyCenter')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyRight')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyFull')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
                <button
                  onClick={() => formatDoc('indent')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Indent"
                >
                  <CornerDownRight size={16} />
                </button>
                <button
                  onClick={() => formatDoc('outdent')}
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="Outdent"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. Headings & Hierarchy */}
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
                onClick={() => formatDoc('formatBlock', 'h4')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H4
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h5')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H5
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'h6')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center font-bold"
              >
                H6
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'p')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-center col-span-2"
              >
                Paragraph
              </button>
            </div>
          )}

          {/* 3. Lists & Structure */}
          {activeCategory === 'lists' && (
            <div className="flex gap-2">
              <button
                onClick={() => formatDoc('insertUnorderedList')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
              >
                <List size={16} />
                <span>Bulleted List</span>
              </button>
              <button
                onClick={() => formatDoc('insertOrderedList')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
              >
                <ListOrdered size={16} />
                <span>Numbered List</span>
              </button>
              <button
                onClick={() => formatDoc('formatBlock', 'blockquote')}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
              >
                <Quote size={16} />
                <span>Quote Block</span>
              </button>
            </div>
          )}

          {/* 4. Bilingual Fonts */}
          {activeCategory === 'fonts' && (
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-amber-300 block mb-1.5">
                  🇮🇳 Hindi Devanagari Fonts
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {HINDI_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFontFamily(f.id);
                        setActiveCategory(null);
                      }}
                      className={`p-2 rounded border text-left text-xs transition-colors ${
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
                      className={`p-2 rounded border text-left text-xs transition-colors ${
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

          {/* 5. Custom Canvas Background with Transparency (Requirement #13) */}
          {activeCategory === 'background' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste background image URL..."
                  value={bgImageUrl}
                  onChange={(e) => setBgImageUrl(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Upload File
                </button>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgImageUpload}
                  className="hidden"
                />
              </div>

              {bgImageUrl && (
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Background Transparency (Opacity):</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setBgImageUrl('');
                        setCanvasBg(undefined);
                      }}
                      className="text-rose-400 hover:text-rose-300 text-xs"
                    >
                      Remove Background
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM DOCKED TOOLBAR (Default recommended for mobile) */}
      {!isToolbarTop && (
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between z-30 shrink-0 text-xs overflow-x-auto no-scrollbar gap-1 backdrop-blur-md">
          <button
            onClick={() =>
              setActiveCategory(activeCategory === 'align' ? null : 'align')
            }
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 border transition-colors whitespace-nowrap ${
              activeCategory === 'align'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <AlignLeft size={15} />
            <span>Align</span>
          </button>

          <button
            onClick={() =>
              setActiveCategory(activeCategory === 'headings' ? null : 'headings')
            }
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 border transition-colors whitespace-nowrap ${
              activeCategory === 'headings'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Type size={15} />
            <span>Headings</span>
          </button>

          <button
            onClick={() =>
              setActiveCategory(activeCategory === 'lists' ? null : 'lists')
            }
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 border transition-colors whitespace-nowrap ${
              activeCategory === 'lists'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <List size={15} />
            <span>Lists</span>
          </button>

          <button
            onClick={() =>
              setActiveCategory(activeCategory === 'fonts' ? null : 'fonts')
            }
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 border transition-colors whitespace-nowrap ${
              activeCategory === 'fonts'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
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
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 border transition-colors whitespace-nowrap ${
              activeCategory === 'background'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Palette size={15} />
            <span>BG</span>
          </button>
        </div>
      )}

      {/* STICKERS & GBOARD GIFS DRAWER (Requirement #10) */}
      {showStickerDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          <div
            onClick={() => setShowStickerDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 shadow-2xl z-10 max-w-lg mx-auto w-full max-h-[70vh] flex flex-col">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Stickers & Gboard GIFs
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => stickerFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Upload GIF/Image</span>
                </button>
                <input
                  ref={stickerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomStickerUpload}
                  className="hidden"
                />
                <button
                  onClick={() => setShowStickerDrawer(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 grid grid-cols-4 gap-3">
              {PRESET_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => handleAddSticker(stk.svgDataUri, stk.name)}
                  className="aspect-square rounded-xl bg-slate-800/40 hover:bg-slate-800 p-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <img
                    src={stk.svgDataUri}
                    alt={stk.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">
                    {stk.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUDIO VOICE RECORDER MODAL */}
      {showAudioRecorder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAudioRecorder(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Mic size={18} className="text-emerald-400" />
                <span>Voice Memo Recording</span>
              </h3>
              <button
                onClick={() => setShowAudioRecorder(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <AudioRecorder
              onSaveRecording={(newRec) => {
                setAudioRecordings([...audioRecordings, newRec]);
                setShowAudioRecorder(false);
              }}
              onCancel={() => setShowAudioRecorder(false)}
            />
          </div>
        </div>
      )}

      {/* EMOJI AVATAR PICKER MODAL */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAvatarPicker(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-semibold text-white">Choose Entry Icon</h4>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {EMOJI_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setAvatar({ ...avatar, value: emoji });
                    setShowAvatarPicker(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl transition-all hover:scale-105"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
