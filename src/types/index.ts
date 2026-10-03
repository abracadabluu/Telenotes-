// Telegram Voice Spaces & Calling Client Data Models

export type ParticipantRole = 'host' | 'co-host' | 'speaker' | 'listener';

export interface TelegramUser {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  phone: string;
  avatarUrl: string;
  bio?: string;
  isVerified?: boolean;
}

export interface RoomRules {
  maxSpeakers: number; // e.g. 10 (or unlimited within Telegram limits)
  allowAudienceToSpeak: boolean; // if false, only host can invite speakers
  muteOnJoin: boolean; // whether new speakers join muted
  requireApproval: boolean; // listeners must raise hand and get approved
  recordingEnabled: boolean; // host records the space audio
}

export interface SpaceParticipant {
  user: TelegramUser;
  role: ParticipantRole;
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100 for live waveform visualization
  hasRaisedHand: boolean;
  joinedAt: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  x: number; // percentage across screen 10-90%
}

export interface VoiceRoom {
  id: string;
  code: string; // 6-character room code, e.g. "TL-8492"
  title: string;
  topic: string;
  hostId: string;
  hostUser: TelegramUser;
  createdAt: number;
  isLive: boolean;
  rules: RoomRules;
  participants: Record<string, SpaceParticipant>;
  handRaiseQueue: string[]; // array of userIds
  isRecording?: boolean;
}

export type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended';

export interface DirectCallSession {
  callId: string;
  peerUser: TelegramUser;
  isIncoming: boolean;
  status: CallStatus;
  startTime?: number;
  durationSeconds: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
}

export interface TelegramApiConfig {
  apiId: string;
  apiHash: string;
}

// Backwards-Compatible Types for Storage & Canvas Utilities
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

export type ExportFormat =
  | 'pdf' | 'txt' | 'docx' | 'md' | 'rtf' | 'doc' | 'odt' | 'fodt'
  | 'epub' | 'mobi' | 'tex' | 'rst' | 'asciidoc' | 'pages' | 'wpd' | 'xps';

export interface EntryAvatar {
  type: 'emoji' | 'image' | 'gif';
  value: string;
  bgColor?: string;
}

export interface AudioRecording {
  id: string;
  url: string;
  duration: number;
  date: number;
  title?: string;
}

export interface CanvasMediaItem {
  id: string;
  type: 'image' | 'sticker' | 'gif';
  url: string;
  name?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  filter?: string;
}

export interface EntryReminder {
  dueTimestamp: number;
  title: string;
  isTriggered: boolean;
}

export interface CanvasBackground {
  url: string;
  opacity: number;
}

export interface CustomFont {
  id: string;
  name: string;
  dataUrl: string;
  fontFamily: string;
  fileName: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  plainText: string;
  createdAt: number;
  updatedAt: number;
  avatar: EntryAvatar;
  folderId?: string;
  isPinned: boolean;
  audioRecordings: AudioRecording[];
  media: CanvasMediaItem[];
  canvasBackground?: CanvasBackground;
  reminder?: EntryReminder;
  tags: string[];
  fontFamily?: string;
}

export interface StorageBreakdown {
  totalBytes: number;
  textBytes?: number;
  mediaBytes: number;
  audioBytes: number;
  diariesBytes: number;
  fontsBytes: number;
  percentageUsed?: number;
}

export interface AppSettings {
  theme: ThemeId;
  customHexColor?: string;
  activeFontFamily: string;
  previewConfig: {
    showAvatar: boolean;
    contentLines: number;
    showDate: boolean;
    showTime: boolean;
  };
  security: {
    isPasscodeEnabled: boolean;
    passcodeType: 'pin' | 'pattern';
    passcodeHash?: string;
    patternPoints?: number[];
    salt?: string;
    biometricsEnabled: boolean;
    autoLockDelayMinutes: number;
    isSetupDone: boolean;
    masterKeyHash?: string;
    masterKeyHint?: string;
  };
  backupConfig: {
    hiddenVaultKeySet: boolean;
    autoBackupInterval: 'hourly' | 'daily' | 'weekly' | 'manual';
    lastBackupTimestamp: number;
  };
  customFonts: CustomFont[];
}
