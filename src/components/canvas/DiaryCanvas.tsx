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
  Move,
  CornerDownRight,
  Upload,
  Crop,
  SlidersHorizontal,
  Maximize2,
  Film,
  Music,
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
  { id: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari (Book Serif)' },
  { id: 'Kalam', name: 'Kalam (Handwritten)' },
  { id: 'Yatra One', name: 'Yatra One (Vintage Wooden)' },
];

const ENGLISH_FONTS = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
  { id: 'Outfit', name: 'Outfit' },
  { id: 'Lora', name: 'Lora (Literary Serif)' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono' },
];

// 20+ Image Filters with CSS strings (Requirement #6-a)
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
  const [fontSize, setFontSize] = useState(entry?.fontSize || 16);

  // Active footer tool tabs
  const [activeTab, setActiveTab] = useState<'char' | 'canvas' | 'media' | 'fonts' | null>(null);

  // Selection Floating Toolbar state
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);

  // Modals & Drawers
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [editingMediaItem, setEditingMediaItem] = useState<CanvasMediaItem | null>(null);

  // Active selected media item on canvas for dragging / resizing
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  // Reminder date input state
  const [reminderTime, setReminderTime] = useState(
    entry?.reminder
      ? new Date(entry.reminder.dueTimestamp).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [reminderNote, setReminderNote] = useState(entry?.reminder?.title || '');

  // Canvas Background Opacity state
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

  // Format doc execCommand wrapper
  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    handleEditorInput();
  };

  // Text selection detector for floating toolbar
  const handleSelectionCheck = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      setFloatingPos(null);
      return;
    }

    if (editorRef.current.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (rect && containerRect) {
        setFloatingPos({
          top: Math.max(10, rect.top - containerRect.top - 48),
          left: Math.max(
            10,
            Math.min(containerRect.width - 290, rect.left - containerRect.left + rect.width / 2 - 145)
          ),
        });
      }
    } else {
      setFloatingPos(null);
    }
  };

  // Continuous Auto-Save Engine (Requirement #6)
  const triggerAutoSave = (currentTitle: string, currentHtml: string) => {
    const plainText = editorRef.current?.innerText || '';
    if (!currentTitle.trim() && !plainText.trim() && mediaItems.length === 0 && audioRecordings.length === 0) {
      return; // Do not auto-save empty entries
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
      fontSize,
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

  // Explicit Save Button
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
      fontSize,
    };
    onSave(updatedEntry);
    onBack();
  };

  // KEYBOARD-LEVEL GBOARD GIF & IMAGE PASTE INTERCEPTION (User requirement #1 & latest revision)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
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
        return;
      }
    }
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
    setActiveTab(null);
  };

  // Custom Image / GIF Upload
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
      setActiveTab(null);
    };
    reader.readAsDataURL(file);
  };

  // External Audio File Upload (Requirement #6-a)
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
        title: file.name || 'Audio Memo',
      };
      setAudioRecordings((prev) => [...prev, newRec]);
      setActiveTab(null);
    };
    reader.readAsDataURL(file);
  };

  // Custom Font File (.ttf/.woff/.otf) Upload (Requirement #6-a)
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

      // Create font-face dynamic style
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
      setActiveTab(null);
    };
    reader.readAsDataURL(file);
  };

  // UNIFIED MEDIA DRAG & CORNER RESIZE HANDLERS (Requirement #10 & latest revision)
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
      const newHeight = newWidth; // Keep aspect ratio proportional

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

  const activeMedia = mediaItems.find((m) => m.id === activeMediaId);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMove}
      onTouchMove={handleContainerMove}
      onMouseUp={handleContainerEnd}
      onTouchEnd={handleContainerEnd}
      onClick={() => {
        handleSelectionCheck();
        setActiveMediaId(null);
      }}
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
        fontFamily,
      }}
      className="flex flex-col h-full select-none overflow-hidden relative"
    >
      {/* Custom Background Wallpaper with Opacity (Requirement #6-a & #13) */}
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

      {/* Top Header Bar (Requirement #6) */}
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

          {/* Profile Pic Button: Emoji with bg color, custom image, or GIF */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarPicker(true);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg border border-[var(--theme-border)] overflow-hidden shrink-0 shadow-sm active:scale-95 transition-transform"
            style={{ backgroundColor: avatar.bgColor || 'var(--theme-accent)' }}
            title="Change Avatar / Icon"
          >
            {avatar.type === 'emoji' ? (
              <span>{avatar.value}</span>
            ) : (
              <img src={avatar.value} alt="avatar" className="w-full h-full object-cover" />
            )}
          </button>

          {/* Diary Heading / Title input right beside profile pic */}
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

        {/* Right Corner: Reminder Button + Save Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Scheduled Reminder Button */}
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

          {/* Save Button */}
          <button
            onClick={handleExplicitSave}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 bg-[var(--theme-accent)] text-white hover:opacity-90"
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

        {/* Pure Natural Text Editing Area (Requirement #1 & latest revision) */}
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
          onMouseUp={handleSelectionCheck}
          onTouchEnd={handleSelectionCheck}
          data-placeholder="Write your personal diary entry here... Tap keyboard GIF button to paste GIFs directly!"
          className="flex-1 min-h-[350px] focus:outline-none leading-relaxed text-base sm:text-lg empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500 empty:before:pointer-events-none"
          style={{ fontSize: `${fontSize}px` }}
        />

        {/* UNIFIED DRAGGABLE & RESIZABLE MEDIA LAYER (Images, GIFs, Stickers) */}
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
              className={`absolute cursor-move select-none z-20 transition-shadow ${
                isSelected ? 'ring-2 ring-[var(--theme-accent)] rounded-2xl shadow-2xl p-1' : ''
              }`}
            >
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-xl"
                style={{ filter: item.filter || 'none' }}
              />

              {/* Corner Resize Drag Handle (Requirement #10 & latest revision) */}
              {isSelected && (
                <>
                  <div
                    onTouchStart={(e) => handleMediaTouchStart(e, item, true)}
                    onMouseDown={(e) => handleMediaTouchStart(e, item, true)}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[var(--theme-accent)] text-white flex items-center justify-center shadow-lg cursor-nwse-resize active:scale-125"
                    title="Drag to resize"
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

      {/* FLOATING TEXT SELECTION TOOLBAR (Requirement #6-a) */}
      {floatingPos && (
        <div
          style={{ top: `${floatingPos.top}px`, left: `${floatingPos.left}px` }}
          className="absolute z-40 bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl rounded-2xl p-1.5 flex items-center gap-1 text-[var(--theme-text)] backdrop-blur-md animate-scaleUp"
        >
          <button
            onClick={() => formatDoc('bold')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Bold"
          >
            <Bold size={15} />
          </button>
          <button
            onClick={() => formatDoc('italic')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Italic"
          >
            <Italic size={15} />
          </button>
          <button
            onClick={() => formatDoc('underline')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Underline"
          >
            <Underline size={15} />
          </button>
          <button
            onClick={() => formatDoc('strikeThrough')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Strikethrough"
          >
            <Strikethrough size={15} />
          </button>
          <button
            onClick={() => formatDoc('hiliteColor', '#fef08a')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg text-amber-300"
            title="Highlight / Mark"
          >
            <Highlighter size={15} />
          </button>
          <button
            onClick={() => formatDoc('subscript')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Subscript"
          >
            <Subscript size={15} />
          </button>
          <button
            onClick={() => formatDoc('superscript')}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg"
            title="Superscript"
          >
            <Superscript size={15} />
          </button>
          <button
            onClick={() => {
              const url = prompt('Enter Web Link URL:');
              if (url) formatDoc('createLink', url);
            }}
            className="p-1.5 hover:bg-[var(--theme-surface-hover)] rounded-lg text-[var(--theme-accent)]"
            title="Create WebLink"
          >
            <LinkIcon size={15} />
          </button>
        </div>
      )}

      {/* FOOTER EXPANDED TOOLBAR PALETTE */}
      {activeTab && (
        <div
          style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
          className="border-t p-3 z-30 animate-slideDown shadow-2xl text-xs max-h-56 overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--theme-border)]">
            <span className="font-bold capitalize">{activeTab} Formatting Suite</span>
            <button onClick={() => setActiveTab(null)} className="p-1 opacity-60 hover:opacity-100">
              <X size={16} />
            </button>
          </div>

          {/* 1. Character & Typography Suite (Requirement #6-a) */}
          {activeTab === 'char' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => formatDoc('selectAll')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-semibold"
                >
                  Select All
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'h1')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold"
                >
                  H1
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'h2')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold"
                >
                  H2
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'h3')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold"
                >
                  H3
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'h4')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold"
                >
                  H4
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'p')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                >
                  Paragraph
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'pre')}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--theme-bg)] border border-[var(--theme-border)] font-mono"
                >
                  Code Block
                </button>
              </div>

              {/* Headings H1 to H20 slider/selector */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--theme-border)]">
                <span className="opacity-75">Section Heading Level:</span>
                <select
                  onChange={(e) => formatDoc('formatBlock', e.target.value)}
                  className="bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg px-2 py-1 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={`h${lvl}`}>
                      Heading {lvl} (H{lvl})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 2. Canvas-Wide Formatting Suite (Requirement #6-a) */}
          {activeTab === 'canvas' && (
            <div className="space-y-3">
              {/* Alignments */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => formatDoc('justifyLeft')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Left Align"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyCenter')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Center Align"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyRight')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Right Align"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => formatDoc('justifyFull')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="Justify"
                >
                  <AlignJustify size={16} />
                </button>
                <button
                  onClick={() => formatDoc('indent')}
                  className="p-2 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
                  title="First-line Indent"
                >
                  <CornerDownRight size={16} />
                </button>
              </div>

              {/* Lists */}
              <div className="flex gap-2 pt-2 border-t border-[var(--theme-border)]">
                <button
                  onClick={() => formatDoc('insertUnorderedList')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-1.5 font-semibold"
                >
                  <List size={15} />
                  <span>Bulleted List</span>
                </button>
                <button
                  onClick={() => formatDoc('insertOrderedList')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-1.5 font-semibold"
                >
                  <ListOrdered size={15} />
                  <span>Numbered List</span>
                </button>
                <button
                  onClick={() => formatDoc('formatBlock', 'blockquote')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center gap-1.5 font-semibold"
                >
                  <Quote size={15} />
                  <span>Quote Block</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Media, Audio & Wallpaper (Requirement #6-a) */}
          {activeTab === 'media' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center justify-center gap-1.5"
                >
                  <ImageIcon size={15} className="text-sky-400" />
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
                  onClick={() => audioFileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center justify-center gap-1.5"
                >
                  <Music size={15} className="text-emerald-400" />
                  <span>Upload Audio File</span>
                </button>
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                <button
                  onClick={() => setShowAudioRecorder(true)}
                  className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] font-bold flex items-center justify-center gap-1.5 col-span-2 text-emerald-400"
                >
                  <Mic size={15} />
                  <span>Record Live Voice Memo</span>
                </button>
              </div>

              {/* Vector Stickers Row */}
              <div className="pt-2 border-t border-[var(--theme-border)]">
                <span className="font-bold opacity-75 block mb-1.5">Preset Stickers:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_STICKERS.map((stk) => (
                    <button
                      key={stk.id}
                      onClick={() => handleAddPresetSticker(stk.svgDataUri, stk.name)}
                      className="p-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] shrink-0 hover:scale-110 transition-transform"
                    >
                      <img src={stk.svgDataUri} alt={stk.name} className="w-9 h-9 object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpaper Background with Opacity Slider */}
              <div className="pt-2 border-t border-[var(--theme-border)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold opacity-75">Canvas Background Wallpaper</span>
                  <button
                    onClick={() => bgImageInputRef.current?.click()}
                    className="text-[11px] text-[var(--theme-accent)] font-semibold"
                  >
                    Select Image
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
                {bgUrl && (
                  <div className="flex items-center gap-2">
                    <span className="opacity-60 text-[10px]">Opacity:</span>
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
                      className="flex-1 accent-[var(--theme-accent)] cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        setBgUrl('');
                        setCanvasBg(undefined);
                      }}
                      className="text-rose-400 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Bilingual Typography & Custom TTF Fonts (Requirement #6-a) */}
          {activeTab === 'fonts' && (
            <div className="space-y-3">
              {/* Custom TTF Font Uploader */}
              <div className="p-2.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] flex items-center justify-between">
                <div>
                  <span className="font-bold block">Upload Custom Font (.TTF / .WOFF)</span>
                  <p className="text-[10px] opacity-60">Saves to app storage and backs up with vault</p>
                </div>
                <button
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
                      onClick={() => {
                        setFontFamily(f.id);
                        setActiveTab(null);
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
                      onClick={() => {
                        setFontFamily(f.id);
                        setActiveTab(null);
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

      {/* FOOTER FORMATTING DOCKED BAR */}
      <div
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
        className="px-3 py-2.5 border-t z-30 shrink-0 flex items-center justify-between gap-1 text-xs backdrop-blur-md"
      >
        <button
          onClick={() => setActiveTab(activeTab === 'char' ? null : 'char')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
            activeTab === 'char'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-70 hover:opacity-100'
          }`}
        >
          <Type size={15} />
          <span>Styles</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'canvas' ? null : 'canvas')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
            activeTab === 'canvas'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-70 hover:opacity-100'
          }`}
        >
          <AlignLeft size={15} />
          <span>Format</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'media' ? null : 'media')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
            activeTab === 'media'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-70 hover:opacity-100'
          }`}
        >
          <ImageIcon size={15} />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'fonts' ? null : 'fonts')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
            activeTab === 'fonts'
              ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
              : 'border-[var(--theme-border)] opacity-70 hover:opacity-100'
          }`}
        >
          <span className="truncate max-w-[65px]">{fontFamily.split(' ')[0]}</span>
          <ChevronDown size={13} />
        </button>
      </div>

      {/* 20 IMAGE FILTERS MODAL WITH HORIZONTAL LIVE THUMBNAIL PREVIEWS (Requirement #6-a & user answer) */}
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
                <p className="text-[11px] opacity-60">Tap any filter for instant live preview</p>
              </div>
              <button
                onClick={() => setEditingMediaItem(null)}
                className="p-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Large Preview */}
            <div className="h-44 w-full rounded-2xl overflow-hidden bg-[var(--theme-bg)] flex items-center justify-center border border-[var(--theme-border)]">
              <img
                src={editingMediaItem.url}
                alt="filter preview"
                className="max-h-full max-w-full object-contain"
                style={{ filter: editingMediaItem.filter || 'none' }}
              />
            </div>

            {/* Horizontal Thumbnail Carousel with Instant Live Preview */}
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

      {/* SCHEDULED REMINDER MODAL (Requirement #6) */}
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

      {/* PROFILE PIC PICKER MODAL (Requirement #6: Emoji with bg color, custom image, or GIF) */}
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

            {/* Custom Image / GIF Upload Button */}
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

            {/* Emoji Background Color Picker */}
            <div className="pt-2 border-t border-[var(--theme-border)] flex items-center justify-between text-xs">
              <span className="opacity-75">Emoji Background Color:</span>
              <input
                type="color"
                value={avatar.bgColor || '#0284c7'}
                onChange={(e) => setAvatar({ ...avatar, bgColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-[var(--theme-border)]"
              />
            </div>

            {/* Emojis Grid */}
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
