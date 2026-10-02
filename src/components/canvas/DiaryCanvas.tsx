import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
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
  Highlighter,
  Upload,
  Clock,
  Sparkles,
  X,
  Plus,
  Check,
  Edit2,
  Table as TableIcon,
} from 'lucide-react';
import { DiaryEntry, AudioRecording, CanvasSticker, MediaAttachment, TodoItem, EntryReminder, Folder } from '../../types';
import { PRESET_STICKERS, StickerDefinition } from './Stickers';
import { AudioRecorder, AudioPlayerItem } from './AudioRecorder';
import { ImageEditorModal } from './ImageEditorModal';

interface DiaryCanvasProps {
  entry?: DiaryEntry | null;
  folders: Folder[];
  currentFolderId: string;
  onSave: (entry: DiaryEntry) => void;
  onBack: () => void;
}

const EMOJI_AVATARS = ['📔', '✨', '☕', '🌿', '🌙', '🔥', '🚀', '💡', '🎨', '🎯', '🐱', '📖', '❤️', '💎', '🌸', '🌊'];

export const DiaryCanvas: React.FC<DiaryCanvasProps> = ({
  entry,
  folders,
  currentFolderId,
  onSave,
  onBack,
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [folderId, setFolderId] = useState(entry?.folderId || currentFolderId || 'all');
  const [avatar, setAvatar] = useState(
    entry?.avatar || { type: 'emoji' as const, value: '📔', bgColor: '#3b82f6' }
  );

  const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>(entry?.audioRecordings || []);
  const [stickers, setStickers] = useState<CanvasSticker[]>(entry?.stickers || []);
  const [attachments, setAttachments] = useState<MediaAttachment[]>(entry?.attachments || []);
  const [reminder, setReminder] = useState<EntryReminder | undefined>(entry?.reminder);

  const [fontFamily, setFontFamily] = useState(entry?.fontFamily || 'font-sans');
  const [fontSize, setFontSize] = useState(entry?.fontSize || 16);

  // Modal & Drawer states
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDate, setReminderDate] = useState(
    entry?.reminder
      ? new Date(entry.reminder.dueTimestamp).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );

  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  // Link dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const customStickerInputRef = useRef<HTMLInputElement | null>(null);
  const customFontInputRef = useRef<HTMLInputElement | null>(null);

  const createdAtTimestamp = entry?.createdAt || Date.now();

  useEffect(() => {
    if (editorRef.current && content) {
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, []);

  // Format command exec
  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  // Insert link
  const insertLink = () => {
    if (!linkUrl) return;
    const finalUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    if (linkText) {
      const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline;">${linkText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      formatDoc('createLink', finalUrl);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    handleEditorInput();
  };

  // Insert Table
  const insertTable = () => {
    const tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #475569;">
      <thead>
        <tr style="background: rgba(56, 189, 248, 0.15);">
          <th style="border: 1px solid #475569; padding: 6px 10px;">Header 1</th>
          <th style="border: 1px solid #475569; padding: 6px 10px;">Header 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #475569; padding: 6px 10px;">Item A</td>
          <td style="border: 1px solid #475569; padding: 6px 10px;">Description</td>
        </tr>
      </tbody>
    </table><p></p>`;
    document.execCommand('insertHTML', false, tableHtml);
    handleEditorInput();
  };

  // Sticker dragging
  const handleStickerPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setActiveStickerId(id);
    const container = canvasContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialStickerX = sticker.x;
    const initialStickerY = sticker.y;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const deltaXPercent = ((moveEvt.clientX - startX) / rect.width) * 100;
      const deltaYPercent = ((moveEvt.clientY - startY) / rect.height) * 100;

      setStickers((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const nextX = Math.max(2, Math.min(88, initialStickerX + deltaXPercent));
          const nextY = Math.max(2, Math.min(88, initialStickerY + deltaYPercent));
          return { ...s, x: nextX, y: nextY };
        })
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleAddSticker = (stDef: StickerDefinition) => {
    const newSticker: CanvasSticker = {
      id: 'stk_' + Date.now(),
      stickerUrl: stDef.svgDataUri,
      name: stDef.name,
      x: 35 + Math.random() * 20,
      y: 20 + Math.random() * 30,
      scale: 1,
      rotation: (Math.random() - 0.5) * 20,
    };
    setStickers((prev) => [...prev, newSticker]);
    setShowStickerDrawer(false);
  };

  const handleAddCustomSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newSticker: CanvasSticker = {
        id: 'stk_' + Date.now(),
        stickerUrl: dataUrl,
        name: file.name,
        x: 40,
        y: 30,
        scale: 1,
        rotation: 0,
      };
      setStickers((prev) => [...prev, newSticker]);
      setShowStickerDrawer(false);
    };
    reader.readAsDataURL(file);
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAtt: MediaAttachment = {
        id: 'att_' + Date.now(),
        name: file.name,
        url: dataUrl,
        type: file.type || 'image/jpeg',
        size: file.size,
      };
      setAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
  };

  // Custom Font .ttf Upload
  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fontUrl = reader.result as string;
      const fontName = 'CustomFont_' + Date.now();
      const newStyle = document.createElement('style');
      newStyle.appendChild(
        document.createTextNode(`@font-face { font-family: '${fontName}'; src: url('${fontUrl}'); }`)
      );
      document.head.appendChild(newStyle);
      setFontFamily(fontName);
    };
    reader.readAsDataURL(file);
  };

  // Save Entry
  const handleSave = () => {
    const plainText = editorRef.current?.innerText || content.replace(/<[^>]*>?/gm, ' ');
    const finalTitle = title.trim() || 'Untitled Diary Entry';

    const savedEntry: DiaryEntry = {
      id: entry?.id || 'diary_' + Date.now(),
      title: finalTitle,
      content,
      plainText,
      createdAt: createdAtTimestamp,
      updatedAt: Date.now(),
      avatar,
      folderId,
      isPinned: entry?.isPinned || false,
      todos: entry?.todos || [],
      audioRecordings,
      stickers,
      attachments,
      reminder,
      tags: entry?.tags || [],
      fontFamily,
      fontSize,
    };

    onSave(savedEntry);
  };

  const formattedDate = new Date(createdAtTimestamp).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(createdAtTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-hidden relative">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <ArrowLeft size={19} />
          </button>

          {/* Avatar selector button */}
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-sky-600/30 border border-sky-400/40 hover:scale-105 transition-transform"
            title="Choose Diary Profile Icon"
          >
            {avatar.type === 'image' ? (
              <img src={avatar.value} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{avatar.value}</span>
            )}
          </button>

          {/* Folder selector pill */}
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 outline-none hover:bg-slate-750"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.icon} {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Reminder button */}
          <button
            type="button"
            onClick={() => setShowReminderPicker(true)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              reminder
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Set Reminder Notification"
          >
            <Bell size={18} />
          </button>

          {/* Primary Save CTA */}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <Save size={15} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Formatting & Media Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto text-slate-300 text-xs shrink-0 scrollbar-none">
        {/* Text styling */}
        <button
          type="button"
          onClick={() => formatDoc('bold')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center font-bold"
          title="Bold (Ctrl+B)"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('italic')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center italic"
          title="Italic (Ctrl+I)"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('underline')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center underline"
          title="Underline (Ctrl+U)"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('strikeThrough')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center line-through"
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => formatDoc('formatBlock', '<h1>')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('formatBlock', '<h2>')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Font Family selector & TTF loader */}
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-[11px] rounded px-1.5 py-0.5 text-slate-200 outline-none shrink-0"
        >
          <option value="font-sans">Modern Sans</option>
          <option value="font-serif">Literary Serif</option>
          <option value="font-mono">Monospace</option>
          <option value="'Noto Sans Devanagari', sans-serif">Hindi / Devanagari</option>
          {fontFamily.startsWith('CustomFont_') && <option value={fontFamily}>Loaded Custom TTF</option>}
        </select>

        <button
          type="button"
          onClick={() => customFontInputRef.current?.click()}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-sky-400 shrink-0"
          title="Upload .TTF Custom Font"
        >
          <Type size={15} />
        </button>
        <input
          type="file"
          ref={customFontInputRef}
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFontUpload}
          className="hidden"
        />

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => formatDoc('justifyLeft')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('justifyCenter')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('justifyRight')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Hyperlink */}
        <button
          type="button"
          onClick={() => setShowLinkDialog(true)}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-sky-400"
          title="Insert Web Link"
        >
          <LinkIcon size={15} />
        </button>

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => formatDoc('insertUnorderedList')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Bulleted List"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('insertOrderedList')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Numbered List"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => formatDoc('formatBlock', '<blockquote>')}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Quote Block"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onClick={insertTable}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center"
          title="Insert Table"
        >
          <TableIcon size={15} />
        </button>

        <span className="w-px h-4 bg-slate-700/80 mx-1 shrink-0" />

        {/* Media Shortcuts */}
        <button
          type="button"
          onClick={() => setShowStickerDrawer(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 shrink-0"
          title="Telegram Stickers"
        >
          <Smile size={14} />
          <span>Stickers</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 shrink-0"
          title="Add Photo"
        >
          <ImageIcon size={14} />
          <span>Photo</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setShowAudioRecorder(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 shrink-0"
          title="Record Voice Memo"
        >
          <Mic size={14} />
          <span>Voice</span>
        </button>
      </div>

      {/* Main Canvas Scrollable Area */}
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative"
        style={{
          fontFamily: fontFamily.startsWith('font-') ? undefined : fontFamily,
        }}
      >
        {/* Creation Date & Time in Corner (User requested corner display) */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock size={13} className="text-sky-400" />
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedTime}</span>
          </div>
          <span className="text-[11px] text-slate-500">Encrypted Local Vault</span>
        </div>

        {/* Heading Box (User requested heading box at top) */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Diary Heading / Title..."
          className="w-full bg-transparent text-xl md:text-2xl font-bold text-white placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-sky-500/40 pb-1 transition-colors"
        />

        {/* Audio Memo Drawer/Player Area if any */}
        {showAudioRecorder && (
          <AudioRecorder
            onSaveRecording={(rec) => {
              setAudioRecordings((prev) => [...prev, rec]);
              setShowAudioRecorder(false);
            }}
            onCancel={() => setShowAudioRecorder(false)}
          />
        )}

        {audioRecordings.length > 0 && (
          <div className="space-y-2">
            {audioRecordings.map((rec) => (
              <AudioPlayerItem
                key={rec.id}
                recording={rec}
                onDelete={() => setAudioRecordings((prev) => prev.filter((r) => r.id !== rec.id))}
              />
            ))}
          </div>
        )}

        {/* Media Attachments & Photos */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 py-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video flex items-center justify-center shadow-lg"
              >
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingImage(att.url)}
                    className="p-2 bg-sky-600/90 text-white rounded-lg hover:bg-sky-500 shadow-md transition-transform active:scale-95"
                    title="Edit in Photo Studio"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="p-2 bg-rose-600/90 text-white rounded-lg hover:bg-rose-500 shadow-md transition-transform active:scale-95"
                    title="Remove Photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rich Text Writing Content Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          className={`min-h-[220px] outline-none text-slate-200 leading-relaxed space-y-3 prose prose-invert max-w-none ${fontFamily}`}
          style={{ fontSize: `${fontSize}px` }}
          data-placeholder="Start writing your thoughts, reflections, or daily notes..."
        />


        {/* Freeform Draggable Canvas Stickers Layer */}
        {stickers.map((stk) => (
          <div
            key={stk.id}
            onPointerDown={(e) => handleStickerPointerDown(e, stk.id)}
            className={`absolute cursor-move select-none touch-none transition-shadow ${
              activeStickerId === stk.id ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 z-40' : 'z-20'
            }`}
            style={{
              left: `${stk.x}%`,
              top: `${stk.y}%`,
              transform: `translate(-50%, -50%) rotate(${stk.rotation}deg) scale(${stk.scale})`,
            }}
          >
            <div className="relative group">
              <img
                src={stk.stickerUrl}
                alt={stk.name}
                className="w-16 h-16 pointer-events-none drop-shadow-xl animate-sticker-float"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStickers((prev) => prev.filter((s) => s.id !== stk.id));
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reminder Scheduler Modal */}
      {showReminderPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">Set Diary Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              You will receive a chat-style notification when this diary reflection is due.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Notification Time</label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {reminder && (
                <button
                  type="button"
                  onClick={() => {
                    setReminder(undefined);
                    setShowReminderPicker(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300"
                >
                  Clear Reminder
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const due = new Date(reminderDate).getTime();
                  if (!isNaN(due)) {
                    setReminder({
                      dueTimestamp: due,
                      title: title || 'Diary Reminder',
                      isTriggered: false,
                    });
                  }
                  setShowReminderPicker(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Choose Diary Avatar</h3>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {EMOJI_AVATARS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setAvatar({ type: 'emoji', value: em, bgColor: '#3b82f6' });
                    setShowAvatarPicker(false);
                  }}
                  className="h-12 rounded-xl bg-slate-800/80 hover:bg-sky-600/30 text-2xl flex items-center justify-center hover:scale-110 transition-all border border-slate-700/60"
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Or use photo upload:</span>
              <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200">
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      setAvatar({ type: 'image', value: r.result as string });
                      setShowAvatarPicker(false);
                    };
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Sticker Drawer */}
      {showStickerDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[75vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile size={18} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100">Telegram Sticker Pack</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStickerDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Tap any sticker to place on canvas. You can drag and position it anywhere!
            </p>

            <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[50vh] p-1">
              {PRESET_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleAddSticker(stk)}
                  className="flex flex-col items-center p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:scale-105 transition-all group"
                >
                  <img src={stk.svgDataUri} alt={stk.name} className="w-12 h-12 drop-shadow" />
                  <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full group-hover:text-slate-200">
                    {stk.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Import custom sticker:</span>
              <button
                type="button"
                onClick={() => customStickerInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 rounded-lg text-slate-200"
              >
                <Upload size={13} />
                <span>Upload Sticker</span>
              </button>
              <input
                type="file"
                ref={customStickerInputRef}
                accept="image/*"
                onChange={handleAddCustomSticker}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Web Link Modal */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                <LinkIcon size={16} className="text-sky-400" />
                <span>Insert Web Link</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400">Display Text (optional):</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. My Favorite Source"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400">Target Web URL:</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditorModal
          imageUrl={editingImage}
          onSave={(edited) => {
            setAttachments((prev) =>
              prev.map((att) => (att.url === editingImage ? { ...att, url: edited } : att))
            );
            setEditingImage(null);
          }}
          onClose={() => setEditingImage(null)}
        />
      )}
    </div>
  );
};
