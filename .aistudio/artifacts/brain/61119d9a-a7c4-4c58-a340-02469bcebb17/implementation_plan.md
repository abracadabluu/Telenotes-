# Telenotes Architecture & UI/UX Transformation Plan

Modernize Telenotes into a dual-mode **Telegram-Style Diary & Book Writing Studio** with native full-screen responsiveness, bilingual typography (English + Hindi), rich category-based formatting toolbars, vintage leather 2x2 book studio grids, sliding Hamburger settings drawer, and auto-backup synchronization.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1:
> - **Formatting Toolbar Position**: Docked at the bottom above the keyboard by default on mobile (with a toggle in Settings to switch to top).
> - **Font Support**: Equal first-class support for custom English fonts (`Outfit`, `Plus Jakarta Sans`, `Lora Serif`, `JetBrains Mono`) and Hindi Devanagari fonts (`Rozha One`, `Poppins Devanagari`, `Noto Sans Devanagari`, `Tiro Devanagari`, `Kalam`, `Yatra One`).
> - **Book Studio Cover Style**: 2x2 grid of compact vintage leather texture covers with gold/silver embossed typography, bookmark ribbon, and customizable cover art.

---

## 1. Overview & Core Concept

Telenotes transforms from a hybrid note app into a dedicated, distraction-free **Dual Studio**:
1. **Diary Studio**: Fast, encrypted, Telegram-style conversational stream for personal reflections, voice notes, stickers/GIFs, and rich multimedia entries.
2. **Book Studio**: Structured multi-chapter book authoring suite with 2x2 visual book covers, chapter outlines, word counters, and character bibles.

Users select their default landing page (`diary` or `books`), seamlessly switch between them from the top of the sliding Hamburger menu, and author content with professional typography across English and Hindi.

---

## 2. User Experience & Visual Design

```
┌──────────────────────────────────────────────────────────────┐
│  COMMON TOP BAR:  [☰ Hamburger]   Telenotes   [🔍] [🔒 Lock] │
├──────────────────────────────────────────────────────────────┤
│  DIARY MODE (Telegram Feed)   │  BOOK MODE (2x2 Grid)        │
│  - Optional Folder / Tag bar  │  ┌───────────┐ ┌───────────┐ │
│  - Search & filter bar        │  │ [Leather] │ │ [Leather] │ │
│  - Chat stream with snippets  │  │ Book 1    │ │ Book 2    │ │
│  - Long-press context action  │  └───────────┘ └───────────┘ │
│  - Floating Write (+) Button  │  ┌───────────┐ ┌───────────┐ │
│                               │  │ Book 3    │ │ + New Book│ │
│                               │  └───────────┘ └───────────┘ │
├──────────────────────────────────────────────────────────────┤
│  SLIDING HAMBURGER SETTINGS DRAWER (Left Slide-Over)         │
│  [⚡ SWITCH TO BOOKS / DIARY] (Top Prominent Action)         │
│  • Theme Engine: Telegram Dark, Midnight, Emerald, Violet... │
│  • Typography: English & Hindi Font Selectors                │
│  • Security: PIN, Fingerprint & Master Key Recovery          │
│  • Automated Backup: Frequency Timer & Drive Sync (No Zip)   │
│  • Canvas & Feed Customizers: Toolbar dock, tags, snippets   │
└──────────────────────────────────────────────────────────────┘
```

### Visual Themes & Design Constitution
- **Viewport**: 100% full-bleed edge-to-edge (`w-full min-h-screen`), discarding artificial phone frames and gaps. Adapts automatically to Android system bars and gestures via CSS safe-area insets.
- **Themes**:
  1. *Telegram Slate Dark* (Default: `#0f172a`, deep blue-slate)
  2. *Midnight Onyx* (`#020617`, OLED pitch black with silver accents)
  3. *Emerald Forest* (`#064e3b` / `#022c22`, rich dark jade)
  4. *Cyberpunk Violet* (`#1e1b4b` / `#2e1065`, electric neon purple)
  5. *Sepia Book Paper* (`#fef3c7` / `#78350f`, warm editorial parchment)
  6. *Minimal Snow Light* (`#f8fafc`, clean off-white)
  7. *Custom Accent & Background Color Picker*
- **Click-Outside Policy**: Every modal, contextual dropdown, sticker picker, and long-press sheet has a backdrop click listener that dismisses it instantly.

---

## 3. Key Feature Specifications (13 User Requirements)

### 1. Complete Removal of To-dos
- Delete `TodoItem` type and all references across `src/types/index.ts`, `src/App.tsx`, `TelegramFeed.tsx`, and `DiaryCanvas.tsx`.
- Remove the to-do list widget from the canvas and starter data.

### 2. Native Full-Screen Device Adaptation
- In `AndroidContainer.tsx`, replace the fixed 412px bordered simulator frame with responsive, fluid full-bleed layout (`w-full h-full min-h-screen flex flex-col bg-slate-950`).
- Remove extra top/bottom gaps; support `pt-safe` and `pb-safe` so content flows naturally on phones, tablets, and desktops.

### 3. Dual Landing Pages & Adaptive Home Pages
- New user preference: `landingPage: 'diary' | 'books'`.
- On launch, the app directly opens the chosen landing page.
- Home page actions, search filters, and FAB (+) adapt to whether Diary or Book Studio is active.

### 4. Common Header Across Both Modes
- Top navigation bar consistently displays:
  - Left: Hamburger Menu (`☰`) button.
  - Center: Wordmark (`Telenotes`).
  - Right: Search trigger (`🔍`) + Security Lock (`🔒`).

### 5. Sliding Hamburger Navigation Drawer
- Slides smoothly from left with blur backdrop.
- **Top Prominent Button**: Directly switches between Diary Homepage and Books Homepage (showing whichever mode is currently inactive).
- Settings sections:
  - **Themes & Styling**: 6 preset palettes + custom hex accents.
  - **Typography**: Active font family (English + Hindi options).
  - **Feed Customization**: Toggle tag bar, customize snippet elements (date, word count, plain text, media counter).
  - **Security & Master Key**: Modernized PIN, biometric toggle, master key reveal, and hidden storage key phrase.
  - **Backup & Auto-Sync**: Schedule automated backups (Off, Every 6h, Daily, Weekly); removed zip download button.

### 6. Automated Backup & Reinstallation Recovery
- Backup interval state saved in settings (`autoBackupInterval: 'off' | '6h' | 'daily' | 'weekly'`).
- Local storage snapshot saved with cryptographic timestamp.
- Encrypted export file generation (`.telenotes` vault) and hidden key phrase restore flow.

### 7. Diary Homepage Enhancements
- User toggle to show or hide the horizontal tags bar.
- Snippet configurator in Settings: select which items appear in list items.
- Removed kebab (`⋮`) menu buttons from row corners.
- **Long-Press Gesture**: Press-and-hold (or right-click) triggers an iOS/Telegram-style bottom action sheet with options: Pin/Unpin, Edit, Duplicate, Change Mood/Folder, Export PDF/Text, Delete.
- Mandatory outside-click dismissal for all popups.

### 8. Books Homepage (2x2 Visual Studio Grid)
- Books presented in a 2-column grid (`grid grid-cols-2 gap-4`).
- Compact vintage leather texture cards with gold/bronze title foil, author line, genre, and chapter/word progress.
- Custom Book Cover selector (presets + custom image URL/upload).
- Long-press on any book card opens contextual sheet (Edit info, Change cover, Duplicate, Export book manuscript, Delete).

### 9. Diary Writing Canvas (Comprehensive Typography & Media Suite)
- **Floating Text Selection Toolbar**: Automatically appears over selected text:
  - *Inline Styles*: Bold, Strong, Italic, Emphasis, Underline, Strikethrough, Delete, Highlight/Mark, Superscript, Subscript, Monospace, Inline Code, Small Text, Overline.
  - *Colors & Links*: Text ForeColor picker, Text Background Fill Color, Link maker.
- **Category-Based Docked Formatting Bar** (positionable at Bottom or Top via user setting):
  - *Alignment & Spacing*: Left, Center, Right, Justify, Line Height, Paragraph Spacing, Letter Spacing, Word Spacing, First-line Indent, Hanging Indent, Text Direction (LTR / RTL).
  - *Headings & Hierarchy*: Title, Subtitle, H1, H2, H3, H4, H5, H6, Display / Hero Text, Caption, Label.
  - *Lists*: Unordered / Bulleted, Ordered / Numbered, Checklist / Task List, Definition / Description List, Nested List.
- **Bilingual Font Support**:
  - English: `Outfit`, `Plus Jakarta Sans`, `Lora`, `JetBrains Mono`.
  - Hindi: `Rozha One`, `Poppins Devanagari`, `Noto Sans Devanagari`, `Tiro Devanagari`, `Kalam`, `Yatra One`.
- **Stickers & Gboard GIFs**:
  - Transparent borderless rendering (removed rigid square frames).
  - Dynamic size slider for stickers & GIFs.
  - Supports image paste / Gboard GIF input.
- **Canvas Images & Media**:
  - Free drag-and-drop placement.
  - Display modes: Inline text flow, Floating side card, Full-bleed hero banner.
- **Canvas Background**:
  - Custom wallpaper upload / URL with opacity / transparency slider (`0%` to `100%`).
- **Audio Voice Recording**: Retained and polished.

### 10. Books Canvas (Novel Studio with Chapters Drawer)
- Inherits 100% of the rich formatting, fonts, background customization, and media tools from the Diary Canvas.
- Dedicated **Chapters Sidebar / Drawer**:
  - Add, rename, delete, and reorder chapters.
  - Chapter word count vs book goal tracker.
  - Chapter status tags (Draft, Revision, Final).
  - Quick jump between chapters without losing scroll position.

---

## 4. Technical Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  - Global State: entries, books, settings, activeView       │
│  - Mode State: currentMode ('diary' | 'books')              │
│  - Navigation State: isHamburgerOpen, isLockOpen            │
│  - Auto-Backup Timer: background interval check             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐        ┌──────────▼──────────┐
    │  AndroidContainer   │        │   HamburgerDrawer   │
    │  - Native Full-Bleed│        │  - Mode Switcher    │
    │  - Common Top Bar   │        │  - Themes & Fonts   │
    │  - Dialogs & Sheets │        │  - Security & Vault │
    └──────────┬──────────┘        └─────────────────────┘
               │
   ┌───────────┴───────────────────────────────┐
   │                                           │
┌──▼───────────────────┐           ┌───────────▼───────────┐
│     TelegramFeed     │           │      BooksGallery     │
│ - Tag bar (optional) │           │ - 2x2 Leather Grid    │
│ - Long-press sheets  │           │ - Custom Covers       │
│ - Filter & Search    │           │ - Long-press sheets   │
└──┬───────────────────┘           └───────────┬───────────┘
   │                                           │
┌──▼───────────────────┐           ┌───────────▼───────────┐
│     DiaryCanvas      │           │      BookStudio       │
│ - Selection Toolbar  │           │ - Inherits Formatting │
│ - Docked Format Bar  │           │ - Chapters Drawer     │
│ - Stickers & GIFs    │           │ - Word Count Goals    │
│ - Custom BG + Opacity│           │ - Chapter Statuses    │
└──────────────────────┘           └───────────────────────┘
```

---

## 5. Verification & Testing Strategy
1. **Compilation & Type Safety**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript errors after removing to-dos and introducing bilingual fonts and chapters.
2. **Device Scaling**: Verify full-screen edge-to-edge responsiveness on mobile ($375\text{px}$) and desktop ($1440\text{px}$).
3. **Modal Click-Outside**: Test that tapping anywhere outside the Hamburger drawer, long-press sheets, color pickers, and sticker drawers immediately closes them.
4. **Offline Persistence**: Verify all state (entries, books, themes, settings, landing page preference) is preserved in `localStorage` and crypto vault.
