export interface AudioRecording {
  id: string;
  url: string; // base64 or blob url
  duration: number; // in seconds
  date: number;
  title: string;
}

export interface CanvasMediaItem {
  id: string;
  type: 'image' | 'sticker' | 'gif';
  url: string;
  name: string;
  x: number; // percentage (0 to 100) or px
  y: number;
  width: number;
  height: number;
  rotation: number;
  filter?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
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
    type: 'emoji' | 'image' | 'gif';
    value: string;
    bgColor?: string;
  };
  folderId: string;
  isPinned: boolean;
  mood?: string;
  audioRecordings: AudioRecording[];
  media: CanvasMediaItem[];
  canvasBackground?: CanvasBackground;
  reminder?: EntryReminder;
  tags: string[];
  fontFamily?: string;
  fontSize?: number;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem?: boolean;
}

export type ThemeId =
  | 'light'
  | 'dark'
  | 'amoled'
  | 'system'
  | 'cyberpunk-neon'
  | 'minimalist-monochrome'
  | 'nordic-pastel'
  | 'retro-vintage'
  | 'midnight-ocean'
  | 'forest-emerald'
  | 'sunset-terracotta'
  | 'material-you'
  | 'glassmorphism'
  | 'neumorphism'
  | 'custom';

export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string; // base64 of TTF/WOFF/OTF
  fontFamily: string;
  fileName: string;
}

export interface AppSettings {
  theme: ThemeId;
  customHexColor?: string;
  activeFontFamily: string;
  previewConfig: {
    showAvatar: boolean;
    contentLines: 0 | 1 | 2; // 0 = off, 1 line, 2 lines
    showDate: boolean;
    showTime: boolean;
  };
  security: {
    isPasscodeEnabled: boolean;
    passcodeType: 'pin' | 'pattern';
    passcodeHash: string; // SHA-256 hash of PIN or pattern path
    patternPoints: number[]; // e.g. [0, 1, 2, 5]
    salt: string;
    biometricsEnabled: boolean;
    autoLockDelayMinutes: number; // 0 = immediate, 1, 5, 15, 30, -1 = never
    isSetupDone: boolean;
    masterKeyHash: string;
    masterKeyHint?: string;
  };
  backupConfig: {
    hiddenVaultKeySet: boolean;
    autoBackupInterval: 'off' | '6h' | 'daily' | 'weekly';
    lastBackupTimestamp?: number;
    hiddenVaultKey?: string;
  };
  customFonts: CustomFont[];
}

export interface StorageBreakdown {
  diariesBytes: number;
  audioBytes: number;
  mediaBytes: number;
  fontsBytes: number;
  totalBytes: number;
}

export type ExportFormat =
  | 'txt'
  | 'rtf'
  | 'doc'
  | 'docx'
  | 'odt'
  | 'pages'
  | 'wpd'
  | 'tex'
  | 'md'
  | 'rst'
  | 'asciidoc'
  | 'pdf'
  | 'epub'
  | 'mobi'
  | 'xps'
  | 'fodt';
