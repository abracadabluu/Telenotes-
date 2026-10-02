export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

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
}

export interface MediaAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // image/png, audio/mp3, etc.
  size: number;
}

export interface EntryReminder {
  dueTimestamp: number;
  title: string;
  isTriggered: boolean;
  repeat?: 'none' | 'daily' | 'weekly';
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
  todos: TodoItem[];
  audioRecordings: AudioRecording[];
  stickers: CanvasSticker[];
  attachments: MediaAttachment[];
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

export interface BookProject {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  coverImage?: string;
  genre: string;
  targetWords: number;
  createdAt: number;
  updatedAt: number;
  chapters: BookChapter[];
  characters: BookCharacter[];
  outlineNotes: string;
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
  | 'telegram-light'
  | 'amoled'
  | 'material-green'
  | 'sunset'
  | 'cyber-teal';

export type AppIconId = 'classic' | 'dark' | 'gold' | 'ruby' | 'emerald';

export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string;
  fontFamily: string;
}

export interface AppSettings {
  theme: ThemeId;
  appIcon: AppIconId;
  chatListConfig: {
    previewLines: 1 | 2 | 3;
    showTimestamp: boolean;
    showActionButtons: boolean;
    compactMode: boolean;
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
  };
  customFonts: CustomFont[];
  driveBackupStatus?: {
    lastSynced?: number;
    accountEmail?: string;
    autoSync: boolean;
  };
}

export interface StorageBreakdown {
  diariesBytes: number;
  booksBytes: number;
  audioBytes: number;
  imagesBytes: number;
  stickersBytes: number;
  totalBytes: number;
}
