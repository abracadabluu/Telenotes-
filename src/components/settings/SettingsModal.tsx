import React, { useState } from 'react';
import {
  X,
  Palette,
  Shield,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Sliders,
  Check,
  Key,
  BookOpen,
  MessageSquare,
  Type,
  Layout,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AppSettings,
  ThemeId,
  StorageBreakdown,
  DiaryEntry,
  BookProject,
} from '../../types';
import {
  formatBytes,
  downloadBlob,
  encryptPayload,
  decryptPayload,
  hashSecret,
  generateRandomSalt,
  saveHiddenVaultBackup,
  recoverFromHiddenVault,
} from '../../services/cryptoVault';

interface SettingsModalProps {
  settings: AppSettings;
  storageBreakdown: StorageBreakdown;
  entries: DiaryEntry[];
  books: BookProject[];
  currentMode: 'diary' | 'books';
  onSwitchMode: (mode: 'diary' | 'books') => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRestoreData: (restored: {
    entries?: DiaryEntry[];
    books?: BookProject[];
    settings?: AppSettings;
  }) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  storageBreakdown,
  entries,
  books,
  currentMode,
  onSwitchMode,
  onUpdateSettings,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'mode' | 'theme' | 'fonts' | 'feed' | 'security' | 'backup' | 'storage'
  >('mode');

  // Security editing state
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [newMasterKey, setNewMasterKey] = useState('');
  const [masterKeyChangeMsg, setMasterKeyChangeMsg] = useState('');

  // Backup & Restore state
  const [restoreSecretKey, setRestoreSecretKey] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    diaries: true,
    books: true,
    settings: true,
  });
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [hiddenVaultMsg, setHiddenVaultMsg] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Custom colors
  const [customAccent, setCustomAccent] = useState(
    settings.customTheme?.accentColor || '#38bdf8'
  );
  const [customBg, setCustomBg] = useState(
    settings.customTheme?.bgColor || '#090d16'
  );

  // Switch Theme
  const handleThemeChange = (themeId: ThemeId) => {
    onUpdateSettings({
      ...settings,
      theme: themeId,
      customTheme:
        themeId === 'custom'
          ? {
              accentColor: customAccent,
              bgColor: customBg,
              surfaceColor: '#1e293b',
            }
          : settings.customTheme,
    });
  };

  // Change PIN
  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      setPinChangeMsg('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinChangeMsg('PINs do not match');
      return;
    }

    const salt = generateRandomSalt();
    const passcodeHash = await hashSecret(newPin, salt);

    onUpdateSettings({
      ...settings,
      security: {
        ...settings.security,
        passcodeHash,
        salt,
      },
    });

    setPinChangeMsg('PIN updated successfully!');
    setNewPin('');
    setConfirmNewPin('');
  };

  // Change Master Key
  const handleChangeMasterKey = async () => {
    if (!newMasterKey.trim() || newMasterKey.length < 6) {
      setMasterKeyChangeMsg('Master Key must be at least 6 characters');
      return;
    }

    const salt = settings.security.salt || generateRandomSalt();
    const masterKeyHash = await hashSecret(newMasterKey.trim(), salt);

    onUpdateSettings({
      ...settings,
      security: {
        ...settings.security,
        masterKeyHash,
        masterKeyHint: newMasterKey.slice(0, 8) + '...',
      },
    });

    setMasterKeyChangeMsg('Master Key updated!');
    setNewMasterKey('');
  };

  // Manual Encrypted Backup Download (.telenotes)
  const handleDownloadBackup = async () => {
    try {
      setIsBackingUp(true);
      const secret = settings.security.masterKeyHint || 'telenotes_vault_key';
      const backupPayload = {
        entries,
        books,
        settings,
        exportTimestamp: Date.now(),
        app: 'Telenotes',
      };
      const encrypted = await encryptPayload(backupPayload, secret);
      downloadBlob(
        JSON.stringify(encrypted, null, 2),
        `telenotes_encrypted_backup_${new Date().toISOString().split('T')[0]}.telenotes`,
        'application/json'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Immediate Hidden Vault Backup
  const handleInstantHiddenVaultBackup = async () => {
    setIsBackingUp(true);
    const key = settings.security.masterKeyHint || 'telenotes_vault_key';
    const success = await saveHiddenVaultBackup(entries, books, settings, key);
    setIsBackingUp(false);
    if (success) {
      setHiddenVaultMsg('Encrypted hidden backup saved to local storage!');
      onUpdateSettings({
        ...settings,
        autoBackup: {
          ...settings.autoBackup,
          lastBackupTimestamp: Date.now(),
        },
      });
      setTimeout(() => setHiddenVaultMsg(null), 4000);
    } else {
      setHiddenVaultMsg('Failed to save backup.');
    }
  };

  // Restore from Hidden Vault Storage
  const handleRestoreFromHiddenStorage = async () => {
    setRestoreMsg(null);
    setRestoreError(null);
    if (!restoreSecretKey) {
      setRestoreError('Please enter your Master Key to decrypt the hidden backup');
      return;
    }
    const recovered = await recoverFromHiddenVault(restoreSecretKey);
    if (!recovered) {
      setRestoreError('Invalid Master Key or no hidden backup found on this device.');
      return;
    }

    onRestoreData({
      entries: restoreOptions.diaries ? recovered.entries : undefined,
      books: restoreOptions.books ? recovered.books : undefined,
      settings: restoreOptions.settings ? recovered.settings : undefined,
    });

    setRestoreMsg('Vault restored successfully from device storage!');
    setRestoreSecretKey('');
  };

  // File Upload Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDecryptAndRestoreFile = async () => {
    if (!restoreFileContent) {
      setRestoreError('Please select a .telenotes backup file first.');
      return;
    }
    if (!restoreSecretKey) {
      setRestoreError('Please enter the Master Secret Key used when creating the backup.');
      return;
    }

    try {
      const parsedPkg = JSON.parse(restoreFileContent);
      const decrypted = await decryptPayload<{
        entries?: DiaryEntry[];
        books?: BookProject[];
        settings?: AppSettings;
      }>(parsedPkg, restoreSecretKey);

      onRestoreData({
        entries: restoreOptions.diaries ? decrypted.entries : undefined,
        books: restoreOptions.books ? decrypted.books : undefined,
        settings: restoreOptions.settings ? decrypted.settings : undefined,
      });

      setRestoreMsg('Encrypted backup successfully restored!');
      setRestoreError(null);
      setRestoreFileContent(null);
      setRestoreSecretKey('');
    } catch (err) {
      console.error(err);
      setRestoreError('Decryption failed! Please check your Master Secret Key.');
    }
  };

  const HINDI_FONTS = [
    { id: 'Poppins', name: 'Poppins (Modern Clean)', sample: 'नमस्ते' },
    { id: 'Rozha One', name: 'Rozha One (Bold Headline)', sample: 'डायरी' },
    { id: 'Noto Sans Devanagari', name: 'Noto Sans (Standard Book)', sample: 'किताब' },
    { id: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari (Editorial Serif)', sample: 'अध्याय' },
    { id: 'Kalam', name: 'Kalam (Warm Handwritten)', sample: 'यादें' },
    { id: 'Yatra One', name: 'Yatra One (Vintage Wooden)', sample: 'यात्रा' },
  ];

  const ENGLISH_FONTS = [
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (Crisp Modern)' },
    { id: 'Outfit', name: 'Outfit (Geometric Editorial)' },
    { id: 'Lora', name: 'Lora (Classic Literary Serif)' },
    { id: 'JetBrains Mono', name: 'JetBrains Mono (Monospace Code)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fadeIn">
      {/* Outside Click Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Sliding Hamburger Drawer */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-sm">
              TN
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Telenotes Studio
              </h2>
              <p className="text-[11px] text-slate-400">Settings & Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* PROMINENT TOP MODE SWITCH BUTTON */}
        <div className="p-3 bg-gradient-to-r from-sky-950/40 to-slate-900 border-b border-slate-800/80">
          {currentMode === 'diary' ? (
            <button
              onClick={() => {
                onSwitchMode('books');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-700/20 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white transition-all shadow-md group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-amber-200">
                    Switch to Book Writing Studio
                  </div>
                  <div className="text-[11px] text-amber-300/70">
                    Open 2x2 leather covers & chapters
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-amber-500/30 text-amber-200">
                Go ➔
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                onSwitchMode('diary');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-600/30 to-sky-700/20 border border-sky-500/40 hover:border-sky-400 text-sky-200 hover:text-white transition-all shadow-md group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-300 group-hover:scale-105 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-sky-200">
                    Switch to Telegram Diary
                  </div>
                  <div className="text-[11px] text-sky-300/70">
                    Open chat feed & quick notes
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-sky-500/30 text-sky-200">
                Go ➔
              </span>
            </button>
          )}
        </div>

        {/* Tab Navigation Icons */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('mode')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'mode'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout size={14} />
            <span>Landing</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'theme'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={14} />
            <span>Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'fonts'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type size={14} />
            <span>Fonts</span>
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} />
            <span>Customize</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={14} />
            <span>Security</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive size={14} />
            <span>Backup</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          {/* TAB 1: DEFAULT LANDING PAGE */}
          {activeTab === 'mode' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Default App Landing Page
                </h3>
                <p className="text-xs text-slate-400">
                  Choose which studio opens automatically whenever you launch the app.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() =>
                    onUpdateSettings({ ...settings, landingPage: 'diary' })
                  }
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    settings.landingPage === 'diary'
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <MessageSquare
                    size={20}
                    className={
                      settings.landingPage === 'diary'
                        ? 'text-sky-400 mt-0.5'
                        : 'text-slate-500 mt-0.5'
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>Telegram Diary Stream</span>
                      {settings.landingPage === 'diary' && (
                        <Check size={16} className="text-sky-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Fast conversational diary entries, voice recordings, and multimedia stream.
                    </div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    onUpdateSettings({ ...settings, landingPage: 'books' })
                  }
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    settings.landingPage === 'books'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <BookOpen
                    size={20}
                    className={
                      settings.landingPage === 'books'
                        ? 'text-amber-400 mt-0.5'
                        : 'text-slate-500 mt-0.5'
                    }
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>Books Writing Studio</span>
                      {settings.landingPage === 'books' && (
                        <Check size={16} className="text-amber-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      2x2 leather book covers, multi-chapter novels, word goals, and outlines.
                    </div>
                  </div>
                </button>
              </div>

              {/* Toolbar Position Preference */}
              <div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 mb-2">
                  Formatting Toolbar Position
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() =>
                      onUpdateSettings({ ...settings, toolbarPosition: 'bottom' })
                    }
                    className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                      settings.toolbarPosition === 'bottom'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    Bottom Docked
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSettings({ ...settings, toolbarPosition: 'top' })
                    }
                    className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                      settings.toolbarPosition === 'top'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    Top Docked
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THEMES */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Preset Color Themes
                </h3>
                <p className="text-xs text-slate-400">
                  Select your favorite atmosphere or create a custom palette.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'telegram-dark' as ThemeId,
                    name: 'Telegram Dark',
                    bg: '#0f172a',
                    border: '#38bdf8',
                  },
                  {
                    id: 'midnight-onyx' as ThemeId,
                    name: 'Midnight Onyx',
                    bg: '#020617',
                    border: '#94a3b8',
                  },
                  {
                    id: 'emerald-forest' as ThemeId,
                    name: 'Emerald Forest',
                    bg: '#064e3b',
                    border: '#34d399',
                  },
                  {
                    id: 'cyberpunk-violet' as ThemeId,
                    name: 'Cyberpunk Violet',
                    bg: '#1e1b4b',
                    border: '#c084fc',
                  },
                  {
                    id: 'sepia-paper' as ThemeId,
                    name: 'Sepia Paper',
                    bg: '#fef3c7',
                    border: '#b45309',
                  },
                  {
                    id: 'minimal-light' as ThemeId,
                    name: 'Minimal Light',
                    bg: '#f8fafc',
                    border: '#0284c7',
                  },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`p-3 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                      settings.theme === th.id
                        ? 'border-sky-400 ring-2 ring-sky-400/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    style={{ backgroundColor: th.bg }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className="w-3.5 h-3.5 rounded-full border"
                        style={{ backgroundColor: th.border, borderColor: '#fff' }}
                      />
                      {settings.theme === th.id && (
                        <Check size={14} className="text-sky-400" />
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold text-left"
                      style={{
                        color:
                          th.id === 'sepia-paper' || th.id === 'minimal-light'
                            ? '#0f172a'
                            : '#f8fafc',
                      }}
                    >
                      {th.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Theme Colors */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Custom Color Palette
                  </span>
                  <button
                    onClick={() => handleThemeChange('custom')}
                    className={`text-xs px-2.5 py-1 rounded font-medium ${
                      settings.theme === 'custom'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Apply Custom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customAccent}
                        onChange={(e) => {
                          setCustomAccent(e.target.value);
                          if (settings.theme === 'custom') {
                            onUpdateSettings({
                              ...settings,
                              customTheme: {
                                ...settings.customTheme!,
                                accentColor: e.target.value,
                              },
                            });
                          }
                        }}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-slate-300 font-mono text-[11px]">
                        {customAccent}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customBg}
                        onChange={(e) => {
                          setCustomBg(e.target.value);
                          if (settings.theme === 'custom') {
                            onUpdateSettings({
                              ...settings,
                              customTheme: {
                                ...settings.customTheme!,
                                bgColor: e.target.value,
                              },
                            });
                          }
                        }}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-slate-300 font-mono text-[11px]">
                        {customBg}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILINGUAL FONTS */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Bilingual Typography
                </h3>
                <p className="text-xs text-slate-400">
                  Select fonts for both Hindi Devanagari and English writing.
                </p>
              </div>

              {/* Hindi Fonts */}
              <div>
                <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🇮🇳 Hindi Devanagari Fonts</span>
                </div>
                <div className="space-y-1.5">
                  {HINDI_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          activeFontFamily: font.id,
                        })
                      }
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                        settings.activeFontFamily === font.id
                          ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                          : 'border-slate-800 bg-slate-950/30 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-base text-amber-300 font-medium px-2 py-0.5 rounded bg-slate-800"
                          style={{ fontFamily: font.id }}
                        >
                          {font.sample}
                        </span>
                        <span className="text-xs" style={{ fontFamily: font.id }}>
                          {font.name}
                        </span>
                      </div>
                      {settings.activeFontFamily === font.id && (
                        <Check size={16} className="text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Fonts */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🌐 English Prose Fonts</span>
                </div>
                <div className="space-y-1.5">
                  {ENGLISH_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          activeFontFamily: font.id,
                        })
                      }
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                        settings.activeFontFamily === font.id
                          ? 'border-sky-400 bg-sky-500/10 text-sky-200'
                          : 'border-slate-800 bg-slate-950/30 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs" style={{ fontFamily: font.id }}>
                        {font.name}
                      </span>
                      {settings.activeFontFamily === font.id && (
                        <Check size={16} className="text-sky-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOMEPAGE CUSTOMIZATION */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Feed & Studio Customization
                </h3>
                <p className="text-xs text-slate-400">
                  Control snippet previews and tag visibility on your homepages.
                </p>
              </div>

              {/* Diary Feed Toggles */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <span className="text-xs font-semibold text-sky-300 block">
                  Diary Homepage Elements
                </span>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Horizontal Tag / Folder Bar</span>
                  <input
                    type="checkbox"
                    checked={settings.diaryFeedConfig.showTagsBar}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        diaryFeedConfig: {
                          ...settings.diaryFeedConfig,
                          showTagsBar: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Plain Text Snippet Preview</span>
                  <input
                    type="checkbox"
                    checked={settings.diaryFeedConfig.snippetPreview}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        diaryFeedConfig: {
                          ...settings.diaryFeedConfig,
                          snippetPreview: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Date & Time on Cards</span>
                  <input
                    type="checkbox"
                    checked={settings.diaryFeedConfig.showDate}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        diaryFeedConfig: {
                          ...settings.diaryFeedConfig,
                          showDate: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Word Count in Snippet</span>
                  <input
                    type="checkbox"
                    checked={settings.diaryFeedConfig.showWordCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        diaryFeedConfig: {
                          ...settings.diaryFeedConfig,
                          showWordCount: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Media Badges (Audio/Stickers)</span>
                  <input
                    type="checkbox"
                    checked={settings.diaryFeedConfig.showMediaCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        diaryFeedConfig: {
                          ...settings.diaryFeedConfig,
                          showMediaCount: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>
              </div>

              {/* Books Grid Toggles */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <span className="text-xs font-semibold text-amber-300 block">
                  Books 2x2 Studio Elements
                </span>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Target Word Count Progress</span>
                  <input
                    type="checkbox"
                    checked={settings.booksGridConfig.showWordGoal}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        booksGridConfig: {
                          ...settings.booksGridConfig,
                          showWordGoal: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Show Book Genre Tag</span>
                  <input
                    type="checkbox"
                    checked={settings.booksGridConfig.showGenreBadge}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        booksGridConfig: {
                          ...settings.booksGridConfig,
                          showGenreBadge: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & MASTER KEY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Military-Grade Vault Security
                </h3>
                <p className="text-xs text-slate-400">
                  Protect your writings with 4-digit PIN and 256-bit Master Key.
                </p>
              </div>

              {/* Passcode Toggle */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <label className="flex items-center justify-between text-xs text-slate-200 font-semibold cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Lock size={16} className="text-sky-400" />
                    <span>Enable Passcode Lock</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.security.isPasscodeEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          isPasscodeEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-700"
                  />
                </label>

                {settings.security.isPasscodeEnabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="New 4-digit PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 text-center tracking-widest"
                      />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="Confirm PIN"
                        value={confirmNewPin}
                        onChange={(e) =>
                          setConfirmNewPin(e.target.value.replace(/\D/g, ''))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 text-center tracking-widest"
                      />
                    </div>
                    <button
                      onClick={handleChangePin}
                      className="w-full py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save Passcode
                    </button>
                    {pinChangeMsg && (
                      <p className="text-[11px] text-sky-400 text-center">
                        {pinChangeMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Master Secret Key */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <Key size={16} />
                  <span>Master Encryption Key</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This key encrypts your local hidden vault and cloud backups. Keep it secret!
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new Master Secret Key"
                    value={newMasterKey}
                    onChange={(e) => setNewMasterKey(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
                  />
                  <button
                    onClick={handleChangeMasterKey}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Save
                  </button>
                </div>
                {masterKeyChangeMsg && (
                  <p className="text-[11px] text-emerald-400">{masterKeyChangeMsg}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Automated Backup & Restore
                </h3>
                <p className="text-xs text-slate-400">
                  Schedule auto-backups or recover data after reinstallation using your Master Key.
                </p>
              </div>

              {/* Auto Backup Interval Selector */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <Clock size={16} />
                  <span>Automatic Backup Schedule</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['off', '6h', 'daily', 'weekly'] as const).map((interval) => (
                    <button
                      key={interval}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          autoBackup: {
                            ...settings.autoBackup,
                            interval,
                          },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-all ${
                        settings.autoBackup.interval === interval
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {interval}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Last auto backup:</span>
                  <span>
                    {settings.autoBackup.lastBackupTimestamp
                      ? new Date(
                          settings.autoBackup.lastBackupTimestamp
                        ).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {/* Hidden Device Storage Recovery (Requirement #7) */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Sparkles size={16} />
                  <span>Hidden Device Storage Recovery</span>
                </div>
                <p className="text-[11px] text-emerald-200/70">
                  App reinstall hone ke baad apna hidden storage search karke Master Key se data restore kar lega.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleInstantHiddenVaultBackup}
                    disabled={isBackingUp}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HardDrive size={14} />
                    <span>Save Hidden Backup Now</span>
                  </button>
                </div>
                {hiddenVaultMsg && (
                  <p className="text-[11px] text-emerald-400 text-center font-medium">
                    {hiddenVaultMsg}
                  </p>
                )}

                <div className="pt-2 border-t border-emerald-800/40 space-y-2">
                  <input
                    type="password"
                    placeholder="Enter Master Key to Restore from Hidden Storage"
                    value={restoreSecretKey}
                    onChange={(e) => setRestoreSecretKey(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
                  />
                  <button
                    onClick={handleRestoreFromHiddenStorage}
                    className="w-full py-1.5 bg-slate-800 hover:bg-emerald-700 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    <span>Restore from Hidden Storage</span>
                  </button>
                </div>
              </div>

              {/* Manual Encrypted File Export / Import */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Encrypted File Vault (.telenotes)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={isBackingUp}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Export Encrypted Vault</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block text-[11px] text-slate-400">
                    Upload .telenotes backup file to restore:
                  </label>
                  <input
                    type="file"
                    accept=".telenotes,.json"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-sky-300 hover:file:bg-slate-700"
                  />
                  {restoreFileContent && (
                    <button
                      onClick={handleDecryptAndRestoreFile}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload size={14} />
                      <span>Decrypt & Restore File</span>
                    </button>
                  )}
                </div>

                {restoreMsg && (
                  <p className="text-[11px] text-emerald-400 text-center font-medium">
                    {restoreMsg}
                  </p>
                )}
                {restoreError && (
                  <p className="text-[11px] text-rose-400 text-center font-medium">
                    {restoreError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
