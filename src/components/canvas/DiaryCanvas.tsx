import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  X,
  Plus,
  Check,
  Subscript,
  Superscript,
  ChevronDown,
  Palette,
  Sliders,
  Move,
  CornerDownRight,
  Upload,
  Crop,
  SlidersHorizontal,
  Maximize2,
  Music,
  CheckSquare,
  ListTree,
  FileText,
  Heading,
  Sparkles,
  Layers,
  Copy,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import {
  DiaryEntry,
  AudioRecording,
  CanvasMediaItem,
  EntryReminder,
  AppSettings,
  CanvasBackground,
  CustomFont,
} from '../../types';
import { PRESET_STICKERS } from './Stickers';
import { AudioRecorder, AudioPlayerItem } from './AudioRecorder';

interface DiaryCanvasProps {
  entry?: DiaryEntry | null;
  settings: AppSettings;
  onSave: (entry: DiaryEntry) => void;
  onBack: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

const EMOJI_AVATARS = [
  '📔', '✨', '☕', '🌿', '🌙', '🔥', '🚀', '💡',
  '🎨', '🎯', '🐱', '📖', '❤️', '💎', '🌸', '🌊',
];

const HINDI_FONTS = [
  { id: 'Poppins', name: 'Poppins (Clean)' },
  { id: 'Rozha One', name: 'Rozha One (Bold Headline)' },
  { id: 'Noto Sans Devanagari', name: 'Noto Sans (Standard)' },
  { id: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari (Serif)' },
  { id: 'Kalam', name: 'Kalam (Handwritten)' },
  { id: 'Yatra One', name: 'Yatra One (Vintage)' },
];

const ENGLISH_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
  { id: 'Outfit', name: 'Outfit' },
  { id: 'Lora', name: 'Lora (Literary Serif)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono' },
];

// 20+ Image Filters (Requirement #6-a)
const IMAGE_FILTERS = [
  { id: 'none', name: 'Normal', css: 'none' },
  { id: 'grayscale', name: 'Grayscale', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(90%)' },
  { id: 'warm', name: 'Warm Tone', css: 'sepia(30%) saturate(140%) hue-rotate(-15deg)' },
  { id: 'cool', name: 'Cool Tone', css: 'saturate(110%) hue-rotate(180deg) brightness(105%)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(180%) contrast(110%)' },
  { id: 'matte', name: 'Matte', css: 'contrast(85%) brightness(110%) saturate(80%)' },
  { id: 'invert', name: 'Invert', css: 'invert(100%)' },
  { id: 'retro', name: 'Retro Film', css: 'sepia(45%) contrast(120%) brightness(90%)' },
  { id: 'polaroid', name: 'Polaroid', css: 'sepia(20%) contrast(115%) brightness(110%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', css: 'hue-rotate(90deg) saturate(220%) contrast(130%)' },
  { id: 'lomo', name: 'Lomo', css: 'contrast(150%) saturate(130%)' },
  { id: 'duotone', name: 'Duotone', css: 'grayscale(100%) sepia(100%) hue-rotate(190deg) saturate(300%)' },
  { id: 'blur', name: 'Gaussian Blur', css: 'blur(3px)' },
  { id: 'bokeh', name: 'Bokeh Glow', css: 'blur(1.5px) brightness(120%) contrast(110%)' },
  { id: 'radial', name: 'Radial Flare', css: 'contrast(130%) brightness(115%)' },
  { id: 'motion', name: 'Motion Pulse', css: 'blur(2px) contrast(140%)' },
  { id: 'vignette', name: 'Vignette', css: 'contrast(125%) brightness(90%)' },
  { id: 'hdr', name: 'HDR Punch', css: 'contrast(140%) saturate(150%) brightness(105%)' },
  { id: 'oil', name: 'Oil Paint', css: 'contrast(160%) saturate(160%) brightness(95%)' },
  { id: 'watercolor', name: 'Watercolor', css: 'saturate(180%) contrast(90%) brightness(115%)' },
  { id: 'halftone', name: 'Halftone Pop', css: 'contrast(200%) grayscale(50%)' },
  { id: 'glitch', name: 'Digital Glitch', css: 'hue-rotate(120deg) invert(15%) contrast(150%)' },
];

const SWATCH_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#78350f', '#064e3b', '#0c4a6e', '#4c1d95',
];

export const DiaryCanvas: React.FC<DiaryCanvasProps> = ({
  entry,
  settings,
  onSave,
  onBack,
  onUpdateSettings,
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [avatar, setAvatar] = useState(
    entry?.avatar || { type: 'emoji' as const, value: '📔', bgColor: '#0284c7' }
  );

  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>(
    entry?.audioRecordings || []
  );
  const [mediaItems, setMediaItems] = useState<CanvasMediaItem[]>(
    entry?.media || []
  );
  const [reminder, setReminder] = useState<EntryReminder | undefined>(entry?.reminder);
  const [canvasBg, setCanvasBg] = useState<CanvasBackground | undefined>(
    entry?.canvasBackground
  );

  const [fontFamily, setFontFamily] = useState(
    entry?.fontFamily || settings.activeFontFamily || 'Plus Jakarta Sans'
  );

  // Canvas wide typography states
  const [lineHeight, setLineHeight] = useState('1.6');
  const [letterSpacing, setLetterSpacing] = useState('normal');
  const [wordSpacing, setWordSpacing] = useState('normal');
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');

  // Canva-style Docked Tool category:
  // 'styles' | 'headings' | 'paragraph' | 'spacing' | 'colors' | 'media' | 'audio' | 'fonts'
  const [canvaCategory, setCanvaCategory] = useState<
    'styles' | 'headings' | 'paragraph' | 'spacing' | 'colors' | 'media' | 'audio' | 'fonts' | null
  >(null);

  // Modals
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState<CanvasMediaItem | null>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  // Reminder inputs
  const [reminderTime, setReminderTime] = useState(
    entry?.reminder
      ? new Date(entry.reminder.dueTimestamp).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [reminderNote, setReminderNote] = useState(entry?.reminder?.title || '');

  // Background Opacity
  const [bgOpacity, setBgOpacity] = useState(entry?.canvasBackground?.opacity ?? 0.25);
  const [bgUrl, setBgUrl] = useState(entry?.canvasBackground?.url || '');

  // Dragging & Resizing Refs
  const isDraggingMediaRef = useRef(false);
  const isResizingMediaRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; itemX: number; itemY: number; itemW: number; itemH: number }>({
    x: 0,
    y: 0,
    itemX: 0,
    itemY: 0,
    itemW: 120,
    itemH: 120,
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarImageInputRef = useRef<HTMLInputElement | null>(null);

  const createdAtTimestamp = entry?.createdAt || Date.now();

  useEffect(() => {
    if (editorRef.current && content) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, []);

  // SELECTION PRESERVATION ENGINE (Crucial for Canva-Style Tools)
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }, []);

  // Listen to selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      saveSelection();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [saveSelection]);

  // Execute command while preserving selection
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    saveSelection();
    handleEditorInput();
  };

  // Custom Tag Wrapping for specialized typography: Strong, Emphasis, Del, Mark, Overline, Code, Small
  const wrapSelectedText = (tag: string, inlineStyle?: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      executeFormat('formatBlock', tag);
      return;
    }

    const range = sel.getRangeAt(0);
    const selectedContent = range.extractContents();
    const element = document.createElement(tag);
    if (inlineStyle) {
      element.setAttribute('style', inlineStyle);
    }
    element.appendChild(selectedContent);
    range.insertNode(element);
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(element);
    sel.addRange(newRange);
    savedRangeRef.current = newRange.cloneRange();
    handleEditorInput();
  };

  // Section Heading Formatter (H1 to H20)
  const applyHeadingLevel = (level: number) => {
    restoreSelection();
    if (level <= 6) {
      executeFormat('formatBlock', `h${level}`);
    } else {
      // H7 to H20 styled heading paragraphs
      const fontSizeRem = Math.max(0.85, 2.2 - (level - 1) * 0.08);
      wrapSelectedText(
        'p',
        `font-size: ${fontSizeRem}rem; font-weight: 700; line-height: 1.3; margin-top: 1rem; margin-bottom: 0.5rem;`
      );
    }
  };

  // Continuous Auto-Save Engine
  const triggerAutoSave = (currentTitle: string, currentHtml: string) => {
    const plainText = editorRef.current?.innerText || '';
    if (!currentTitle.trim() && !plainText.trim() && mediaItems.length === 0 && audioRecordings.length === 0) {
      return;
    }

    const updatedEntry: DiaryEntry = {
      id: entry?.id || 'diary_' + Date.now(),
      title: currentTitle.trim() || plainText.slice(0, 24).trim() || 'Untitled Diary',
      content: currentHtml,
      plainText,
      createdAt: createdAtTimestamp,
      updatedAt: Date.now(),
      avatar,
      folderId: entry?.folderId || 'all',
      isPinned: entry?.isPinned || false,
      audioRecordings,
      media: mediaItems,
      canvasBackground: bgUrl ? { url: bgUrl, opacity: bgOpacity } : undefined,
      reminder,
      tags: entry?.tags || [],
      fontFamily,
    };
    onSave(updatedEntry);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setContent(html);
      triggerAutoSave(title, html);
    }
  };

  const handleExplicitSave = () => {
    const plainText = editorRef.current?.innerText || '';
    if (!title.trim() && !plainText.trim() && mediaItems.length === 0 && audioRecordings.length === 0) {
      onBack();
      return;
    }
    const finalTitle = title.trim() || plainText.slice(0, 25).trim() || 'Untitled Diary';
    const updatedEntry: DiaryEntry = {
      id: entry?.id || 'diary_' + Date.now(),
      title: finalTitle,
      content: editorRef.current?.innerHTML || content,
      plainText,
      createdAt: createdAtTimestamp,
      updatedAt: Date.now(),
      avatar,
      folderId: entry?.folderId || 'all',
      isPinned: entry?.isPinned || false,
      audioRecordings,
      media: mediaItems,
      canvasBackground: bgUrl ? { url: bgUrl, opacity: bgOpacity } : undefined,
      reminder,
      tags: entry?.tags || [],
      fontFamily,
    };
    onSave(updatedEntry);
    onBack();
  };

  // CLIPBOARD & GBOARD GIF INTERCEPTION (Guarantees normal text paste works!)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        foundImage = true;
        e.preventDefault(); // ONLY prevent default if it's an image or GIF!
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          const isGif = file.type.includes('gif') || file.name.endsWith('.gif');
          const newMedia: CanvasMediaItem = {
            id: 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            type: isGif ? 'gif' : 'image',
            url,
            name: file.name || (isGif ? 'Gboard GIF' : 'Pasted Image'),
            x: 20 + Math.random() * 20,
            y: 20 + Math.random() * 20,
            width: isGif ? 140 : 160,
            height: isGif ? 140 : 160,
            rotation: 0,
            filter: 'none',
          };
          setMediaItems((prev) => [...prev, newMedia]);
          setActiveMediaId(newMedia.id);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
    // If it's normal text or HTML, do NOT prevent default! Native clipboard paste executes normally!
  };

  // Add Vector Sticker
  const handleAddPresetSticker = (svgUri: string, name: string) => {
    const newMedia: CanvasMediaItem = {
      id: 'stk_' + Date.now(),
      type: 'sticker',
      url: svgUri,
      name,
      x: 30 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      width: 120,
      height: 120,
      rotation: 0,
      filter: 'none',
    };
    setMediaItems((prev) => [...prev, newMedia]);
    setActiveMediaId(newMedia.id);
    setCanvaCategory(null);
  };

  // Custom Image Upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isGif = file.type === 'image/gif';
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newMedia: CanvasMediaItem = {
        id: 'media_' + Date.now(),
        type: isGif ? 'gif' : 'image',
        url,
        name: file.name,
        x: 25,
        y: 25,
        width: 150,
        height: 150,
        rotation: 0,
        filter: 'none',
      };
      setMediaItems((prev) => [...prev, newMedia]);
      setActiveMediaId(newMedia.id);
      setCanvaCategory(null);
    };
    reader.readAsDataURL(file);
  };

  // Audio Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newRec: AudioRecording = {
        id: 'aud_' + Date.now(),
        url,
        duration: 0,
        date: Date.now(),
        title: file.name || 'Audio File',
      };
      setAudioRecordings((prev) => [...prev, newRec]);
      setCanvaCategory(null);
    };
    reader.readAsDataURL(file);
  };

  // Custom Font Upload
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

      const styleEl = document.createElement('style');
      styleEl.innerHTML = `@font-face { font-family: '${fontName}'; src: url('${dataUrl}'); }`;
      document.head.appendChild(styleEl);

      const customFontObj: CustomFont = {
        id: 'font_' + Date.now(),
        name: fontName,
        dataUrl,
        fontFamily: fontName,
        fileName: file.name,
      };

      if (onUpdateSettings) {
        onUpdateSettings({
          ...settings,
          customFonts: [...(settings.customFonts || []), customFontObj],
          activeFontFamily: fontName,
        });
      }
      setFontFamily(fontName);
      setCanvaCategory(null);
    };
    reader.readAsDataURL(file);
  };

  // UNIFIED MEDIA DRAG & CORNER RESIZE HANDLERS
  const handleMediaTouchStart = (e: React.TouchEvent | React.MouseEvent, item: CanvasMediaItem, isResizeHandle = false) => {
    e.stopPropagation();
    setActiveMediaId(item.id);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (isResizeHandle) {
      isResizingMediaRef.current = true;
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        itemX: item.x,
        itemY: item.y,
        itemW: item.width || 120,
        itemH: item.height || 120,
      };
    } else {
      isDraggingMediaRef.current = true;
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        itemX: item.x,
        itemY: item.y,
        itemW: item.width || 120,
        itemH: item.height || 120,
      };
    }
  };

  const handleContainerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!activeMediaId) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    if (isDraggingMediaRef.current) {
      const dxPx = clientX - dragStartRef.current.x;
      const dyPx = clientY - dragStartRef.current.y;
      const dxPct = (dxPx / containerRect.width) * 100;
      const dyPct = (dyPx / containerRect.height) * 100;

      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === activeMediaId
            ? {
                ...m,
                x: Math.max(0, Math.min(85, dragStartRef.current.itemX + dxPct)),
                y: Math.max(0, Math.min(85, dragStartRef.current.itemY + dyPct)),
              }
            : m
        )
      );
    } else if (isResizingMediaRef.current) {
      const dxPx = clientX - dragStartRef.current.x;
      const newWidth = Math.max(60, Math.min(320, dragStartRef.current.itemW + dxPx));
      const newHeight = newWidth;

      setMediaItems((prev) =>
        prev.map((m) =>
          m.id === activeMediaId
            ? {
                ...m,
                width: newWidth,
                height: newHeight,
              }
            : m
        )
      );
    }
  };

  const handleContainerEnd = () => {
    isDraggingMediaRef.current = false;
    isResizingMediaRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMove}
      onTouchMove={handleContainerMove}
      onMouseUp={handleContainerEnd}
      onTouchEnd={handleContainerEnd}
      onClick={() => {
        saveSelection();
        setActiveMediaId(null);
      }}
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        fontFamily,
      }}
      className="flex flex-col h-full overflow-hidden relative"
    >
      {/* Custom Background Wallpaper */}
      {bgUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Top Header Bar */}
      <div
        className="px-4 py-3 border-b border-[var(--theme-border)] backdrop-blur-md z-30 shrink-0 flex items-center justify-between"
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={handleExplicitSave}
            className="p-1.5 rounded-full hover:bg-[var(--theme-surface-hover)] transition-colors"
            title="Save & Back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Profile Pic Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarPicker(true);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg border border-[var(--theme-border)] overflow-hidden shrink-0 shadow-sm active:scale-95 transition-transform"
            style={{ backgroundColor: avatar.bgColor || 'var(--theme-accent)' }}
            title="Change Avatar"
          >
            {avatar.type === 'emoji' ? (
              <span>{avatar.value}</span>
            ) : (
              <img src={avatar.value} alt="avatar" className="w-full h-full object-cover" />
            )}
          </button>

          {/* Title Heading */}
          <input
            type="text"
            placeholder="Diary Title / Heading..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutoSave(e.target.value, content);
            }}
            className="bg-transparent text-sm sm:text-base font-bold text-[var(--theme-text)] placeholder-slate-500 focus:outline-none flex-1 truncate"
          />
        </div>

        {/* Right Corner: Reminder + Save */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReminderPicker(true);
            }}
            className={`p-2 rounded-xl transition-colors ${
              reminder
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-300 hover:text-white hover:bg-[var(--theme-surface-hover)]'
            }`}
            title="Set Reminder Notification"
          >
            <Bell size={18} />
          </button>

          <button
            onClick={handleExplicitSave}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--theme-accent-contrast)',
            }}
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 flex flex-col max-w-2xl mx-auto w-full">
        {/* Voice Memos list */}
        {audioRecordings.length > 0 && (
          <div className="mb-4 space-y-2 p-3 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic size={14} />
              <span>Voice Memos ({audioRecordings.length})</span>
            </span>
            <div className="space-y-1.5">
              {audioRecordings.map((rec) => (
                <AudioPlayerItem
                  key={rec.id}
                  recording={rec}
                  onDelete={() => setAudioRecordings(audioRecordings.filter((r) => r.id !== rec.id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* PURE NATURAL TEXT EDITING AREA (Normal Keyboard & Clipboard!) */}
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning
          inputMode="text"
          autoCapitalize="sentences"
          spellCheck={true}
          onInput={handleEditorInput}
          onBlur={handleEditorInput}
          onPaste={handlePaste}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onTouchEnd={saveSelection}
          dir={textDirection}
          data-placeholder="Write your personal reflections... Tap keyboard GIF button or Canva tools below!"
          className="flex-1 min-h-[350px] focus:outline-none leading-relaxed text-base sm:text-lg select-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500 empty:before:pointer-events-none"
          style={{
            lineHeight,
            letterSpacing,
            wordSpacing,
          }}
        />

        {/* UNIFIED DRAGGABLE & RESIZABLE MEDIA LAYER */}
        {mediaItems.map((item) => {
          const isSelected = activeMediaId === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaId(item.id);
              }}
              onTouchStart={(e) => handleMediaTouchStart(e, item, false)}
              onMouseDown={(e) => handleMediaTouchStart(e, item, false)}
              style={{
                top: `${item.y}%`,
                left: `${item.x}%`,
                width: `${item.width}px`,
                height: `${item.height}px`,
                transform: `rotate(${item.rotation || 0}deg)`,
              }}
              className={`absolute cursor-move z-20 transition-shadow ${
                isSelected ? 'ring-2 ring-[var(--theme-accent)] rounded-2xl shadow-2xl p-1' : ''
              }`}
            >
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-xl"
                style={{ filter: item.filter || 'none' }}
              />

              {/* Corner Resize Drag Handle */}
              {isSelected && (
                <>
                  <div
                    onTouchStart={(e) => handleMediaTouchStart(e, item, true)}
                    onMouseDown={(e) => handleMediaTouchStart(e, item, true)}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg cursor-nwse-resize active:scale-125"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-accent-contrast)',
                    }}
                    title="Drag corner to resize"
                  >
                    <Maximize2 size={13} />
                  </div>

                  {/* Filter & Delete Quick Toolbar */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-full px-2 py-1 flex items-center gap-2 shadow-xl text-xs z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMediaItem(item);
                      }}
                      className="text-[var(--theme-accent)] hover:opacity-80 p-0.5"
                      title="Apply Filter"
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaItems(mediaItems.filter((m) => m.id !== item.id));
                        setActiveMediaId(null);
                      }}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* CANVA-STYLE DOCKED FORMATTING POPOVER DRAWER */}
      {canvaCategory && (
        <div
          style={{
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
          }}
          className="border-t p-3 z-40 shadow-2xl text-xs max-h-64 overflow-y-auto animate-slideDown"
        >
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[var(--theme-border)]">
            <span className="font-bold capitalize flex items-center gap-1.5 text-[var(--theme-accent)]">
              <Sparkles size={14} />
              <span>Canva {canvaCategory} Suite</span>
            </span>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCanvaCategory(null)}
              className="p-1 opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* 1. CHARACTER STYLES POPOVER */}
          {canvaCategory === 'styles' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('selectAll')}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold"
                >
                  Select All
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('cut')}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1"
                >
                  <Scissors size={13} />
                  <span>Cut</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('copy')}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('bold')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center gap-1"
                >
                  <Bold size={13} />
                  <span>Bold</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('strong')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-extrabold"
                >
                  Strong
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('italic')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] italic flex items-center gap-1"
                >
                  <Italic size={13} />
                  <span>Italic</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('em')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] italic"
                >
                  Emphasis
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('underline')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] underline flex items-center gap-1"
                >
                  <Underline size={13} />
                  <span>Underline</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('strikeThrough')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] line-through flex items-center gap-1"
                >
                  <Strikethrough size={13} />
                  <span>Strikethrough</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('del')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] line-through opacity-75"
                >
                  Delete
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('span', 'text-decoration: overline;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] overline"
                >
                  Overline
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('mark', 'background-color: #fef08a; color: #1e293b; padding: 2px 4px; border-radius: 4px;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold text-amber-300"
                >
                  Mark / Highlight
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('subscript')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-1"
                >
                  <Subscript size={13} />
                  <span>Subscript</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('superscript')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-1"
                >
                  <Superscript size={13} />
                  <span>Superscript</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('code', 'font-family: monospace; background: rgba(120,120,120,0.2); padding: 2px 5px; border-radius: 4px;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-mono"
                >
                  Monospace / Inline Code
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('small')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[10px]"
                >
                  Small Text
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = prompt('Enter Web Link URL:');
                    if (url) executeFormat('createLink', url);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sky-400 flex items-center gap-1 font-semibold"
                >
                  <LinkIcon size={13} />
                  <span>WebLink</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. SECTION HEADINGS (H1 to H20, Title, Subtitle, Display, Hero, Caption, Label) */}
          {canvaCategory === 'headings' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('h1', 'font-size: 2.25rem; font-weight: 800; line-height: 1.2;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-black text-sm"
                >
                  Document Title
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('p', 'font-size: 1.25rem; font-weight: 500; opacity: 0.8;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-medium text-xs opacity-80"
                >
                  Subtitle
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('div', 'font-size: 2.75rem; font-weight: 900; letter-spacing: -0.04em;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-black text-xs text-amber-400"
                >
                  Display Text
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('div', 'font-size: 3.25rem; font-weight: 900; line-height: 1.1;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-black text-xs text-rose-400"
                >
                  Hero Text
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('p', 'font-size: 0.75rem; opacity: 0.65; font-style: italic;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[11px] italic opacity-60"
                >
                  Caption
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelectedText('span', 'font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(56,189,248,0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px;')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[10px] font-bold uppercase tracking-wider text-sky-400"
                >
                  Label
                </button>
              </div>

              {/* Headings H1 to H20 Grid */}
              <div className="pt-2 border-t border-[var(--theme-border)] space-y-1.5">
                <span className="font-bold opacity-75 block text-[11px]">
                  Section Headings (H1 to H20):
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                    <button
                      key={lvl}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyHeadingLevel(lvl)}
                      className="py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold text-center hover:border-[var(--theme-accent)] transition-colors"
                    >
                      H{lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. PARAGRAPH, LISTS & ALIGNMENT POPOVER */}
          {canvaCategory === 'paragraph' && (
            <div className="space-y-3">
              {/* Alignments */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('justifyLeft')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Left Align"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('justifyCenter')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Center Align"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('justifyRight')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Right Align"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('justifyFull')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('indent')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="First-line Indent"
                >
                  <CornerDownRight size={16} />
                </button>
              </div>

              {/* Lists Suite */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--theme-border)]">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('insertUnorderedList')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1.5"
                >
                  <List size={15} />
                  <span>Bulleted / Unordered List</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeFormat('insertOrderedList')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1.5"
                >
                  <ListOrdered size={15} />
                  <span>Numbered / Ordered List</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    executeFormat('insertHTML', '<p>☑ <span style="text-decoration: none;">Task item</span></p>');
                  }}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1.5 text-emerald-400"
                >
                  <CheckSquare size={15} />
                  <span>Task List / Checklist</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    executeFormat('insertHTML', '<dl><dt><strong>Term</strong></dt><dd>Definition description</dd></dl>');
                  }}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1.5 text-sky-400"
                >
                  <FileText size={15} />
                  <span>Definition / Description</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    executeFormat('insertHTML', '<ul><li>Main item<ul><li>Nested sub-item</li></ul></li></ul>');
                  }}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold flex items-center gap-1.5 text-purple-400 col-span-2"
                >
                  <ListTree size={15} />
                  <span>Nested Hierarchy List</span>
                </button>
              </div>

              {/* Text Direction */}
              <div className="pt-2 border-t border-[var(--theme-border)] flex items-center justify-between">
                <span className="font-semibold">Text Direction:</span>
                <div className="flex gap-2">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTextDirection('ltr')}
                    className={`px-3 py-1 rounded-xl border font-bold ${
                      textDirection === 'ltr' ? 'bg-[var(--theme-accent)] text-white' : 'opacity-60'
                    }`}
                  >
                    Left-to-Right (LTR)
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTextDirection('rtl')}
                    className={`px-3 py-1 rounded-xl border font-bold ${
                      textDirection === 'rtl' ? 'bg-[var(--theme-accent)] text-white' : 'opacity-60'
                    }`}
                  >
                    Right-to-Left (RTL)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. SPACING, LEADING & TRACKING POPOVER */}
          {canvaCategory === 'spacing' && (
            <div className="space-y-3">
              {/* Line Height / Leading */}
              <div>
                <span className="font-bold opacity-75 block mb-1.5">
                  Line Height / Leading ({lineHeight}):
                </span>
                <div className="flex gap-1.5">
                  {['1.2', '1.4', '1.6', '1.8', '2.0', '2.4'].map((lh) => (
                    <button
                      key={lh}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setLineHeight(lh)}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold ${
                        lineHeight === lh
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing / Tracking */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <span className="font-bold opacity-75 block mb-1.5">
                  Letter Spacing / Tracking ({letterSpacing}):
                </span>
                <div className="flex gap-1.5">
                  {[
                    { id: '-0.03em', name: 'Tight' },
                    { id: 'normal', name: 'Normal' },
                    { id: '0.05em', name: 'Wide' },
                    { id: '0.12em', name: 'Very Wide' },
                  ].map((ls) => (
                    <button
                      key={ls.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setLetterSpacing(ls.id)}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold ${
                        letterSpacing === ls.id
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
                      }`}
                    >
                      {ls.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Spacing */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <span className="font-bold opacity-75 block mb-1.5">
                  Word Spacing ({wordSpacing}):
                </span>
                <div className="flex gap-1.5">
                  {[
                    { id: 'normal', name: 'Normal' },
                    { id: '0.15em', name: 'Expanded' },
                    { id: '0.3em', name: 'Wide Words' },
                  ].map((ws) => (
                    <button
                      key={ws.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setWordSpacing(ws.id)}
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold ${
                        wordSpacing === ws.id
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
                      }`}
                    >
                      {ws.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. COLORS & HIGHLIGHT POPOVER */}
          {canvaCategory === 'colors' && (
            <div className="space-y-3">
              {/* ForeColor */}
              <div>
                <span className="font-bold opacity-75 block mb-1.5">
                  Text Color (ForeColor):
                </span>
                <div className="flex flex-wrap gap-2">
                  {SWATCH_COLORS.map((c) => (
                    <button
                      key={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('foreColor', c)}
                      className="w-7 h-7 rounded-full border border-white/20 shadow-sm active:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Highlight Fill */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <span className="font-bold opacity-75 block mb-1.5">
                  Highlight Background (Fill Color):
                </span>
                <div className="flex flex-wrap gap-2">
                  {['#fef08a', '#bbf7d0', '#fed7aa', '#fecdd3', '#bae6fd', '#e9d5ff'].map((c) => (
                    <button
                      key={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => executeFormat('hiliteColor', c)}
                      className="w-7 h-7 rounded-full border border-white/20 shadow-sm active:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. MEDIA, FILTERS & BACKGROUND WALLPAPER POPOVER */}
          {canvaCategory === 'media' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center justify-center gap-1.5 text-sky-400"
                >
                  <ImageIcon size={15} />
                  <span>Upload Image / GIF</span>
                </button>
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />

                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => bgImageInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center justify-center gap-1.5 text-amber-400"
                >
                  <Palette size={15} />
                  <span>Wallpaper Background</span>
                </button>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      setBgUrl(url);
                      setCanvasBg({ url, opacity: bgOpacity });
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Wallpaper Opacity Slider */}
              {bgUrl && (
                <div className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-2">
                  <span className="opacity-75 text-[11px]">Wallpaper Opacity:</span>
                  <input
                    type="range"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={bgOpacity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBgOpacity(val);
                      setCanvasBg({ url: bgUrl, opacity: val });
                    }}
                    className="flex-1 accent-[var(--theme-accent)]"
                  />
                  <button
                    onClick={() => {
                      setBgUrl('');
                      setCanvasBg(undefined);
                    }}
                    className="text-rose-400 text-xs font-semibold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Preset Stickers */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <span className="font-bold opacity-75 block mb-1.5">Preset Stickers:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_STICKERS.map((stk) => (
                    <button
                      key={stk.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleAddPresetSticker(stk.svgDataUri, stk.name)}
                      className="p-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] shrink-0 hover:scale-110 transition-transform"
                    >
                      <img src={stk.svgDataUri} alt={stk.name} className="w-9 h-9 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. VOICE & AUDIO POPOVER */}
          {canvaCategory === 'audio' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowAudioRecorder(true)}
                  className="p-3 rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex flex-col items-center justify-center gap-1.5 text-emerald-400 shadow-sm"
                >
                  <Mic size={20} />
                  <span>Record Voice Memo</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex flex-col items-center justify-center gap-1.5 text-sky-400 shadow-sm"
                >
                  <Music size={20} />
                  <span>Upload Audio File</span>
                </button>
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* 8. BILINGUAL & CUSTOM TTF FONTS POPOVER */}
          {canvaCategory === 'fonts' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center justify-between">
                <div>
                  <span className="font-bold block">Upload Custom Font (.TTF/.WOFF)</span>
                  <p className="text-[10px] opacity-60">Saves in app storage and encrypted backup</p>
                </div>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => fontFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[var(--theme-accent)] text-white font-bold rounded-lg text-xs"
                >
                  Upload
                </button>
                <input
                  ref={fontFileInputRef}
                  type="file"
                  accept=".ttf,.woff,.woff2,.otf"
                  onChange={handleFontUpload}
                  className="hidden"
                />
              </div>

              {/* Hindi Devanagari Fonts */}
              <div>
                <span className="font-bold text-amber-400 block mb-1.5">🇮🇳 Hindi Devanagari Fonts:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {HINDI_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFontFamily(f.id);
                        setCanvaCategory(null);
                      }}
                      className={`p-2 rounded-xl border text-left font-medium ${
                        fontFamily === f.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Prose Fonts */}
              <div>
                <span className="font-bold text-sky-400 block mb-1.5">🌐 English Prose Fonts:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ENGLISH_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFontFamily(f.id);
                        setCanvaCategory(null);
                      }}
                      className={`p-2 rounded-xl border text-left font-medium ${
                        fontFamily === f.id
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                          : 'border-[var(--theme-border)] bg-[var(--theme-bg)]'
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
        </div>
      )}

      {/* CANVA-STYLE DOCKED HORIZONTAL CATEGORIES TOOLBAR (Above Keyboard) */}
      <div
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
        className="px-2 py-2 border-t z-30 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar backdrop-blur-md"
      >
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'styles' ? null : 'styles')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'styles'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <Type size={14} />
          <span>Styles</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'headings' ? null : 'headings')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'headings'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <Heading size={14} />
          <span>Headings (H1-H20)</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'paragraph' ? null : 'paragraph')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'paragraph'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <AlignLeft size={14} />
          <span>Format & Lists</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'spacing' ? null : 'spacing')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'spacing'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <Sliders size={14} />
          <span>Spacing</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'colors' ? null : 'colors')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'colors'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <Palette size={14} />
          <span>Colors</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'media' ? null : 'media')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'media'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <ImageIcon size={14} />
          <span>Media & Filters</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'audio' ? null : 'audio')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'audio'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <Mic size={14} />
          <span>Audio</span>
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCanvaCategory(canvaCategory === 'fonts' ? null : 'fonts')}
          className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 shrink-0 border transition-all text-xs ${
            canvaCategory === 'fonts'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-75 hover:opacity-100'
          }`}
        >
          <span className="truncate max-w-[70px]">{fontFamily.split(' ')[0]}</span>
          <ChevronDown size={13} />
        </button>
      </div>

      {/* 20 IMAGE FILTERS MODAL WITH HORIZONTAL LIVE THUMBNAILS */}
      {editingMediaItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          <div
            onClick={() => setEditingMediaItem(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            className="relative border-t rounded-t-3xl p-4 shadow-2xl z-10 max-w-lg mx-auto w-full space-y-3"
          >
            <div className="w-10 h-1.5 bg-slate-600 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[var(--theme-accent)]" />
                  <span>20 Image Filters & Adjustments</span>
                </h3>
                <p className="text-[11px] opacity-60">Instant live preview</p>
              </div>
              <button
                onClick={() => setEditingMediaItem(null)}
                className="p-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Preview Display */}
            <div className="h-44 w-full rounded-2xl overflow-hidden bg-[var(--theme-bg)] flex items-center justify-center border border-[var(--theme-border)]">
              <img
                src={editingMediaItem.url}
                alt="filter preview"
                className="max-h-full max-w-full object-contain"
                style={{ filter: editingMediaItem.filter || 'none' }}
              />
            </div>

            {/* Horizontal Thumbnails Carousel */}
            <div className="flex gap-2.5 overflow-x-auto py-2 no-scrollbar">
              {IMAGE_FILTERS.map((filt) => (
                <button
                  key={filt.id}
                  onClick={() => {
                    const updated = { ...editingMediaItem, filter: filt.css };
                    setEditingMediaItem(updated);
                    setMediaItems((prev) =>
                      prev.map((m) => (m.id === updated.id ? updated : m))
                    );
                  }}
                  className={`flex flex-col items-center shrink-0 p-1.5 rounded-2xl border transition-all ${
                    (editingMediaItem.filter || 'none') === filt.css
                      ? 'border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/40 scale-105'
                      : 'border-[var(--theme-border)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-white/10 mb-1">
                    <img
                      src={editingMediaItem.url}
                      alt={filt.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filt.css }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold truncate max-w-[65px]">
                    {filt.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingMediaItem(null)}
              className="w-full py-2 bg-[var(--theme-accent)] text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULED REMINDER MODAL */}
      {showReminderPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowReminderPicker(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            className="relative border rounded-3xl p-5 w-full max-w-xs shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                <Bell size={18} />
                <span>Diary Reminder</span>
              </h3>
              <button onClick={() => setShowReminderPicker(false)} className="p-1 opacity-60">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="opacity-75 block mb-1">Reminder Date & Time:</label>
                <input
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="opacity-75 block mb-1">Notification Note:</label>
                <input
                  type="text"
                  placeholder="e.g. Read today's diary reflections"
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {reminder && (
                  <button
                    onClick={() => {
                      setReminder(undefined);
                      setShowReminderPicker(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-500/20 text-rose-400 font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => {
                    const due = new Date(reminderTime).getTime();
                    setReminder({
                      dueTimestamp: due,
                      title: reminderNote || title || 'Diary Reminder',
                      isTriggered: false,
                    });
                    setShowReminderPicker(false);
                  }}
                  className="flex-1 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  Set Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR PICKER MODAL */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowAvatarPicker(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            className="relative border rounded-3xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--theme-border)]">
              <h4 className="text-sm font-bold">Choose Profile Avatar / Icon</h4>
              <button onClick={() => setShowAvatarPicker(false)} className="p-1 opacity-60">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => avatarImageInputRef.current?.click()}
                className="flex-1 py-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold text-xs flex items-center justify-center gap-1.5 text-[var(--theme-accent)]"
              >
                <Upload size={14} />
                <span>Upload Custom Image / GIF</span>
              </button>
              <input
                ref={avatarImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const url = ev.target?.result as string;
                    setAvatar({
                      type: file.type.includes('gif') ? 'gif' : 'image',
                      value: url,
                    });
                    setShowAvatarPicker(false);
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
            </div>

            <div className="pt-2 border-t border-[var(--theme-border)] flex items-center justify-between text-xs">
              <span className="opacity-75">Emoji Background Color:</span>
              <input
                type="color"
                value={avatar.bgColor || '#0284c7'}
                onChange={(e) => setAvatar({ ...avatar, bgColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-[var(--theme-border)]"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto">
              {EMOJI_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setAvatar({ type: 'emoji', value: emoji, bgColor: avatar.bgColor || '#0284c7' });
                    setShowAvatarPicker(false);
                  }}
                  className="w-14 h-14 rounded-2xl bg-[var(--theme-bg)] hover:bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] flex items-center justify-center text-2xl hover:scale-105 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUDIO VOICE RECORDER MODAL */}
      {showAudioRecorder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowAudioRecorder(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            className="relative border rounded-3xl p-5 w-full max-w-sm shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                <Mic size={18} />
                <span>Live Voice Memo Recorder</span>
              </h3>
              <button onClick={() => setShowAudioRecorder(false)} className="p-1 opacity-60">
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
    </div>
  );
};
