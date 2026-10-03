export interface AudioRecording {
  id: string;
  url: string; // base64 or blob url
  duration: number; // in seconds
  date: number;
  title: string;
}

export interface CanvasSticker {
  id: string;
  stickerUrl: string;
  name: string;
  x: number; // percentage (0 to 100) or px
  y: number;
  scale: number;
  rotation: number;
  isGif?: boolean;
}

export interface MediaAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // image/png, image/gif, audio/mp3, etc.
  size: number;
  layoutMode?: 'inline' | 'floating' | 'banner';
  x?: number;
  y?: number;
  width?: number;
}

export interface EntryReminder {
  dueTimestamp: number;
  title: string;
  isTriggered: boolean;
  repeat?: 'none' | 'daily' | 'weekly';
}

export interface CanvasBackground {
  url: string;
  opacity: number; // 0.05 to 1.0
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string; // HTML rich content
  plainText: string;
  createdAt: number;
  updatedAt: number;
  avatar: {
    type: 'emoji' | 'image' | 'initials';
    value: string;
    bgColor?: string;
  };
  folderId: string;
  isPinned: boolean;
  mood?: string;
  audioRecordings: AudioRecording[];
  stickers: CanvasSticker[];
  attachments: MediaAttachment[];
  canvasBackground?: CanvasBackground;
  reminder?: EntryReminder;
  tags: string[];
  fontFamily?: string;
  fontSize?: number;
}

export interface BookChapter {
  id: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  notes?: string;
  status: 'draft' | 'revised' | 'complete';
}

export interface BookCharacter {
  id: string;
  name: string;
  role: string;
  notes: string;
  avatar?: string;
}

export type BookCoverTexture = 
  | 'leather-classic'
  | 'leather-dark'
  | 'leather-cognac'
  | 'leather-forest'
  | 'leather-crimson'
  | 'custom-image';

export interface BookCoverStyle {
  texture: BookCoverTexture;
  color?: string;
  goldFoil?: boolean;
  ribbonColor?: string;
  customCoverUrl?: string;
}

export interface BookProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  genre: string;
  targetWords: number;
  createdAt: number;
  updatedAt: number;
  coverStyle?: BookCoverStyle;
  chapters: BookChapter[];
  characters: BookCharacter[];
  outlineNotes: string;
  canvasBackground?: CanvasBackground;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem?: boolean;
}

export type ThemeId =
  | 'telegram-dark'
  | 'midnight-onyx'
  | 'emerald-forest'
  | 'cyberpunk-violet'
  | 'sepia-paper'
  | 'minimal-light'
  | 'custom';

export type AppIconId = 'classic' | 'dark' | 'gold' | 'ruby' | 'emerald';

export interface CustomFont {
  id: string;
  name: string;
  dataUrl?: string;
  fontFamily: string;
  language: 'en' | 'hi' | 'both';
}

export interface AppSettings {
  landingPage: 'diary' | 'books';
  theme: ThemeId;
  customTheme?: {
    accentColor: string;
    bgColor: string;
    surfaceColor: string;
  };
  appIcon: AppIconId;
  activeFontFamily: string;
  toolbarPosition: 'bottom' | 'top';
  diaryFeedConfig: {
    showTagsBar: boolean;
    snippetPreview: boolean;
    showDate: boolean;
    showWordCount: boolean;
    showMediaCount: boolean;
    compactMode: boolean;
  };
  booksGridConfig: {
    showWordGoal: boolean;
    showGenreBadge: boolean;
  };
  security: {
    isPasscodeEnabled: boolean;
    passcodeHash: string; // SHA-256 hash with salt
    salt: string;
    biometricsEnabled: boolean;
    autoLockDelayMinutes: number; // 0 = immediate, 1, 5, 15, 30, -1 = never
    isSetupDone: boolean;
    masterKeyHash: string;
    masterKeyHint?: string;
    recoveryPhrase?: string;
  };
  autoBackup: {
    interval: 'off' | '6h' | 'daily' | 'weekly';
    lastBackupTimestamp?: number;
    hiddenVaultKey?: string;
    cloudSyncEnabled?: boolean;
  };
  customFonts: CustomFont[];
}

export interface StorageBreakdown {
  diariesBytes: number;
  booksBytes: number;
  audioBytes: number;
  imagesBytes: number;
  stickersBytes: number;
  totalBytes: number;
}
