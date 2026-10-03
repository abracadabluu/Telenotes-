# Pure Encrypted Diary Studio & UI/UX Transformation Plan (Revised)

Transform Telenotes into a dedicated **100% Pure Encrypted Diary Application** with native edge-to-edge status bar blending, default read-mode for saved entries with an edit pencil button, unified drag & resize engine for images/GIFs/stickers, native standard device keyboard behavior, keyboard-level Gboard GIF integration, right-sliding settings drawer with 15 strict visual themes, swipe actions with 16 export formats, dual pattern/PIN biometrics lock, and an advanced writing canvas.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed and refined:
> - **Saved Diary Opens in Read Mode**: Tapping any saved entry opens in clean, distraction-free **Read Mode**. A prominent **Pencil (Edit)** button (`✏️`) in the top right corner opens the Writing Canvas. Newly created entries ("+ New Diary") open directly into the Editing Canvas.
> - **Unified Drag & Resize for Images, GIFs & Stickers**: All visual media (images, stickers, and Gboard animated GIFs) share identical interactive bounding boxes with touch/mouse drag placement and corner resize handles.
> - **Native Standard Keyboard**: The canvas editor uses standard natural text attributes (`inputMode="text"`, `autoCapitalize="sentences"`, `spellCheck={true}`) so that device Gboard displays in its standard layout without forced numeric rows.
> - **Keyboard-Level GIF Integration**: IME Rich Content & Clipboard listener on the writing canvas (`onPaste`, `beforeinput`, `dataTransfer`) to capture animated GIFs from Gboard and place them on the canvas.
> - **Swipe Action Style**: Slide-out buttons revealed underneath the row on left/right swipe (Pin to top, 16-Format Export, Delete with confirmation).
> - **Security Lock Style**: Both 4-digit numeric PIN and 3x3 graphical pattern lock alongside fingerprint biometrics.
> - **Image Filter Layout**: Horizontal thumbnail carousel with instant live preview for all 20 image filters.
> - **Total Books Removal**: Complete elimination of books sections, chapters, and models to focus exclusively on diary writing.

---

## 1. Overview & Core Concept

Telenotes transforms into a streamlined, high-performance personal diary application built for mobile touch ergonomics:
- **Clean Full-Screen Viewport**: Full-bleed edge-to-edge rendering with status bar and navigation bar integration (`WindowCompat.setDecorFitsSystemWindows(false)`), without artificial chassis or double paddings.
- **Dedicated Read Mode & Instant Edit Transition**: Saved diaries open in an immersive reading layout with typography styling, audio playback, and visual attachments. Tapping the pencil icon opens the full studio canvas.
- **Unified Media Manipulation**: Images, Gboard GIFs, and stickers can all be moved anywhere and resized with corner touch handles.
- **Telegram Chat-Style Stream**: Fast, fluid diary list with swipe-to-reveal actions and customizable metadata previews.

---

## 2. User Experience & Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ TELENOTES                                  [🔍] [🔒] [☰]    │
├─────────────────────────────────────────────────────────────┤
│  DIARY STREAM (Swipeable Rows)                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Avatar]  Morning Reflections             10:45 AM    │  │
│  │           Woke up early to watch the sunrise...       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ◀── Swipe Left/Right ──▶                                    │
│  [📌 Pin]  [📥 Export (16 Formats)]  [🗑️ Delete]            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Avatar]  Tea & Rain at Sunset            Oct 2       │  │
│  │           Quiet drops tapping on the window glass...  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│                           [ + Write New Diary ] (Float Bar) │
├─────────────────────────────────────────────────────────────┤
│  READ MODE (Saved Entry):                                   │
│  [← Back]  Morning Reflections               [🔔] [✏️ Edit] │
│  - Rich formatted text                                      │
│  - Draggable & resizable media/GIFs/stickers                │
│  - Voice note playback                                      │
├─────────────────────────────────────────────────────────────┤
│  RIGHT-SLIDING SETTINGS DRAWER                              │
│  • 15 Strict Themes (Light, Dark, AMOLED, Cyberpunk,        │
│    Nordic, Retro, Material You, Glassmorphism, Custom...)  │
│  • Security: 4-digit PIN, 3x3 Pattern Lock, Biometrics      │
│  • Preview Customizer: Avatar, 1/2 lines, Date, Time        │
│  • AES-256 Vault: Local Hidden Storage & Google Drive       │
└─────────────────────────────────────────────────────────────┘
```

### Visual Themes & Design Constitution
- **Strict Theme Engine**: Applies custom CSS variables directly to `<html>`, `<body>`, and root containers so status bars, navigation bars, cards, dialogs, and text harmonize strictly:
  1. *Light Theme* (Crisp white canvas, slate-900 typography)
  2. *Dark Theme* (Classic Telegram deep slate `#0f172a`)
  3. *AMOLED Black* (Pure `#000000` with high-contrast text)
  4. *System Default* (Detects `prefers-color-scheme`)
  5. *Cyberpunk Neon* (Deep obsidian with electric cyan & magenta)
  6. *Minimalist Monochrome* (Pure grayscale, high-contrast stark minimalism)
  7. *Nordic Pastel* (Muted fjord slate, soft sage, warm mist)
  8. *Retro Vintage Paper* (Warm parchment, sepia ink, antique aesthetic)
  9. *Midnight Ocean* (Deep abyssal navy `#031526` with bioluminescent cyan)
  10. *Forest Emerald* (Rich botanical green `#064e3b` with mint accents)
  11. *Sunset Terracotta* (Warm adobe `#431407` with amber glow)
  12. *Material You Dynamic* (Android 14+ tonal palette adaptation)
  13. *Glassmorphism* (Backdrop blur with frosted translucent borders)
  14. *Neumorphism* (Soft dual-tone inset & extruded shadows)
  15. *Custom Hex Color Theme* (User custom hex color picker)

---

## 3. Key Feature Specifications

### 1. Saved Diary Read Mode & Pencil Trigger
- Tapping any entry from the homepage opens `DiaryReader`:
  - Header: Back arrow (`←`), entry avatar & title, reminder indicator (`🔔`), and Edit pencil button (`✏️`).
  - Distraction-free reader layout rendering rich text, voice player, custom background wallpaper, and media attachments without cursor or keyboard interference.
  - Tapping the pencil icon immediately launches `DiaryCanvas` in edit mode with current state preserved.

### 2. Unified Drag & Resize Engine (Images, GIFs, Stickers)
- Single interactive media layer on the canvas:
  - Supports image uploads, custom stickers, and Gboard animated GIFs.
  - Each item features:
    - Free dragging (`touchmove` / `mousemove` with clamped bounds).
    - Corner drag handle for fluid bidirectional resizing (scaling width & height).
    - Quick actions bar: Bring to Front, Send to Back, Filter/Edit, Delete.

### 3. Keyboard & Gboard GIF Integration
- Standard natural text attributes (`inputMode="text"`, `autoCapitalize="sentences"`, `spellCheck={true}`).
- Intercept Gboard's image commit payloads (`onPaste` and `beforeinput`) to extract `image/gif` and image file blobs directly, converting them into movable canvas GIF stickers/images.

### 4. Complete Removal of Books Features
- Delete `BookStudio.tsx`, `BooksGallery.tsx`, and all book models (`BookProject`, `BookChapter`, `BookCharacter`, `BookCoverStyle`) across types, storage calculations, and state.
- Focus 100% of application logic on diary entries.

### 5. Homepage & Top Header
- **Top Header**:
  - Left corner: App title **Telenotes**.
  - Right corner: Search icon (`🔍`), Quick Lock vault (`🔒`), and Hamburger icon (`☰`) that opens the Settings drawer from the **right side**.
- **Floating Action Bar**:
  - Centered or bottom-right elevated vertical button / pill: **+ New Diary**.

### 6. Swipe Gestures & 16-Format Export Suite
- **Swipe-to-Reveal Row**: Smooth drag gesture on touch or mouse reveal slide-out action buttons:
  - **Pin to Top**: Toggle pinned status with instant reordering.
  - **Export**: Opens modal supporting 16 export file formats:
    `.txt`, `.rtf`, `.doc`, `.docx`, `.odt`, `.pages`, `.wpd`, `.tex`, `.md`, `.rst`, `.asciidoc`, `.pdf`, `.epub`, `.mobi`, `.xps`, `.fodt`.
  - **Delete**: Confirmation dialog before irreversible deletion.

### 7. Right-Sliding Settings Drawer
- **Themes Tab**: Selection of the 15 themes with live application across the whole app.
- **Security Tab**: Toggle passcode; switch between 4-digit PIN and interactive 3x3 Pattern Lock; toggle Biometrics unlock.
- **Customisation Tab**:
  - Toggle profile picture on list items.
  - Content preview length: `Off`, `1 Line`, `2 Lines`.
  - Toggle creation date.
  - Toggle creation time.
- **Backup & Restore Tab**:
  - AES-256 encrypted hidden storage vault (`.telenotes_vault/` or hidden localStorage key).
  - Mandatory encryption secret key confirmation prior to backup.
  - Verification of secret key to restore data upon app reinstallation.
  - Google Drive cloud backup with identical AES-256 encryption.

### 8. Diary Writing Canvas & Formatting Tools
- **Header**:
  - Profile pic selector: Emoji (with background color picker), uploaded image, or GIF.
  - Heading / Title input right beside profile picture.
  - Right corner: Save button + Scheduled Reminder button (date/time picker with native notifications).
  - Continuous auto-save engine: Auto-saves any non-empty entry in real time. If empty and exited without save, discards cleanly.
- **Footer Formatting Toolbar**:
  - **Character & Typography Styles** (selected text):
    - Select All, Cut, Copy, Bold, Strong, Italic, Emphasis, Underline, Strikethrough, Delete, Highlight, Mark, Superscript, Subscript, Monospace, Inline Code, Small Text, Overline, Text Color, ForeColor, Text Background Color, Fill Color, WebLink, Title, Subtitle, Section Headings (H1 to H20), Display Text, Hero Text, Caption, Label.
  - **Canvas-Wide Formatting**:
    - Lists: Unordered, Bulleted, Ordered, Numbered, Task/Checklist, Definition/Description, Nested List.
    - Alignment: Left, Center, Right, Justify.
    - Spacing: Line Height, Leading, Paragraph Spacing, Letter Spacing, Tracking, Word Spacing, First-line Indent, Hanging Indent, Text Direction (LTR / RTL).
- **Image Editing & Filters**:
  - Image editor modal with Crop, Adjust (brightness, contrast, saturation), Markup, and **20 image filters with horizontal live thumbnail previews**:
    1. Grayscale, 2. Sepia, 3. Warm Tone, 4. Cool Tone, 5. Vivid, 6. Matte, 7. Invert, 8. Retro Film Grain, 9. Polaroid, 10. Cyberpunk Neon, 11. Lomo, 12. Duotone, 13. Gaussian Blur, 14. Bokeh, 15. Radial Blur, 16. Motion Blur, 17. Vignette, 18. HDR, 19. Oil Paint, 20. Watercolor, 21. Halftone Pop Art, 22. Digital Glitch.
- **Custom Background**: Image upload with transparency/opacity slider (0.05 to 1.0).
- **Audio Files**: Voice recording with waveform audio player + external audio file uploader supporting all audio formats.
- **Custom Fonts**: Preloaded popular English & Hindi fonts + Custom `.ttf` / `.woff` / `.otf` font uploader stored in persistent storage and included in encrypted backups.

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  - State: entries, folders, settings (15 themes, security)  │
│  - Active View: 'feed' | 'read' | 'canvas'                  │
│  - Right-Sliding Settings Drawer Trigger                    │
│  - Fullscreen Theme Root & Auto-Save Manager                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐        ┌──────────▼──────────┐
    │  AndroidContainer   │        │   SettingsDrawer    │
    │  - Edge-to-Edge Sync│        │  - 15 Themes Engine │
    │  - Status Bar Blend │        │  - PIN / Pattern UI │
    │  - No Fake Frames   │        │  - Preview Toggles  │
    └──────────┬──────────┘        │  - AES-256 Vault    │
               │                   └─────────────────────┘
   ┌───────────┴───────────────────────────────┐
   │                                           │
┌──▼───────────────────┐           ┌───────────▼───────────┐
│     TelegramFeed     │           │      DiaryReader      │
│ - Swipeable Rows     │           │ - Read-Only Mode      │
│ - Slide-out Actions  │           │ - [✏️] Edit Trigger    │
│ - 16-Format Exporter │           │ - Voice Player        │
│ - Floating Write Bar │           │ - Media Viewer        │
└──┬───────────────────┘           └───────────┬───────────┘
   │                                           │
   └───────────────────┬───────────────────────┘
                       │
            ┌──────────▼──────────┐
            │     DiaryCanvas     │
            │ - Auto-Save Engine  │
            │ - Avatar Header     │
            │ - Typography Suite  │
            │ - Unified Drag/Scale│
            │   (Img/GIF/Sticker) │
            │ - 20 Image Filters  │
            │ - Gboard GIF Paste  │
            │ - Audio & TTF Fonts │
            └─────────────────────┘
```

---

## 5. Verification & Testing Strategy
1. **Compilation**: Run `compile_applet` and `lint_applet` to ensure 0 TypeScript errors after complete removal of books and introduction of swipe gestures, read mode, pattern lock, and 16 export generators.
2. **Read Mode & Edit Transition**: Verify clicking saved entry opens Read Mode, and clicking pencil opens Edit Canvas. Verify clicking "+ New Diary" opens Edit Canvas directly.
3. **Unified Drag & Resize**: Verify images, Gboard GIFs, and stickers can be freely moved and scaled with corner handles.
4. **Theme Application**: Verify all 15 themes strictly alter colors, backgrounds, borders, and status bar blend.
5. **Swipe Ergonomics**: Verify left and right swipe smoothly reveals Pin, Export, and Delete on touch devices.
6. **Keyboard & Gboard GIFs**: Verify default Qwerty keyboard behavior without forced numbers row, and test GIF paste into editor.
