import React, { useState } from 'react';
import {
  X,
  Palette,
  Shield,
  Sliders,
  HardDrive,
  Check,
  Key,
  Lock,
  Grid,
  Fingerprint,
  Download,
  Upload,
  RefreshCw,
  FolderLock,
  Cloud,
} from 'lucide-react';
import { AppSettings, ThemeId, DiaryEntry, StorageBreakdown } from '../../types';
import { THEME_REGISTRY } from '../layout/AndroidContainer';
import {
  saveHiddenVaultBackup,
  recoverFromHiddenVault,
  hashSecret,
  generateRandomSalt,
  encryptPayload,
  downloadBlob,
  formatBytes,
} from '../../services/cryptoVault';

interface SettingsModalProps {
  settings: AppSettings;
  storageBreakdown: StorageBreakdown;
  entries: DiaryEntry[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRestoreData: (restored: { entries?: DiaryEntry[]; settings?: AppSettings }) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  storageBreakdown,
  entries,
  onUpdateSettings,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'security' | 'custom' | 'backup'>('themes');

  // Security editing state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [patternDots, setPatternDots] = useState<number[]>([]);
  const [securityMsg, setSecurityMsg] = useState('');

  // Backup & Restore state
  const [userBackupKey, setUserBackupKey] = useState('');
  const [confirmBackupKey, setConfirmBackupKey] = useState('');
  const [restoreKey, setRestoreKey] = useState('');
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);

  // Custom Hex Color
  const [customHex, setCustomHex] = useState(settings.customHexColor || '#38bdf8');

  // Handle Theme Change
  const handleSelectTheme = (themeId: ThemeId) => {
    onUpdateSettings({
      ...settings,
      theme: themeId,
      customHexColor: themeId === 'custom' ? customHex : settings.customHexColor,
    });
  };

  // Save PIN Passcode
  const handleSavePin = async () => {
    if (pinInput.length !== 4) {
      setSecurityMsg('PIN must be exactly 4 digits');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setSecurityMsg('PINs do not match');
      return;
    }
    const salt = generateRandomSalt();
    const passcodeHash = await hashSecret(pinInput, salt);
    onUpdateSettings({
      ...settings,
      security: {
        ...settings.security,
        isPasscodeEnabled: true,
        passcodeType: 'pin',
        passcodeHash,
        salt,
      },
    });
    setSecurityMsg('4-digit PIN saved successfully!');
    setPinInput('');
    setConfirmPinInput('');
  };

  // Save Pattern Passcode
  const handleSavePattern = async () => {
    if (patternDots.length < 4) {
      setSecurityMsg('Pattern must connect at least 4 dots');
      return;
    }
    const patternStr = patternDots.join('-');
    const salt = generateRandomSalt();
    const passcodeHash = await hashSecret(patternStr, salt);
    onUpdateSettings({
      ...settings,
      security: {
        ...settings.security,
        isPasscodeEnabled: true,
        passcodeType: 'pattern',
        passcodeHash,
        patternPoints: patternDots,
        salt,
      },
    });
    setSecurityMsg('Pattern lock saved successfully!');
    setPatternDots([]);
  };

  // Local Hidden Vault AES-256 Backup (Requirement #5-d)
  const handleCreateHiddenVaultBackup = async () => {
    setBackupStatusMsg(null);
    setBackupErrorMsg(null);
    if (!userBackupKey.trim() || userBackupKey.length < 6) {
      setBackupErrorMsg('Encryption key must be at least 6 characters');
      return;
    }
    if (userBackupKey !== confirmBackupKey) {
      setBackupErrorMsg('Encryption keys do not match');
      return;
    }

    const success = await saveHiddenVaultBackup(entries, settings, userBackupKey);
    if (success) {
      onUpdateSettings({
        ...settings,
        backupConfig: {
          ...settings.backupConfig,
          hiddenVaultKeySet: true,
          lastBackupTimestamp: Date.now(),
        },
      });
      setBackupStatusMsg('Encrypted hidden backup created in .telenotes_vault/!');
      setUserBackupKey('');
      setConfirmBackupKey('');
    } else {
      setBackupErrorMsg('Failed to create hidden backup');
    }
  };

  // Restore from Hidden Device Storage (Requirement #5-d)
  const handleRestoreFromHiddenVault = async () => {
    setBackupStatusMsg(null);
    setBackupErrorMsg(null);
    if (!restoreKey) {
      setBackupErrorMsg('Please enter your encryption key to decrypt');
      return;
    }
    const recovered = await recoverFromHiddenVault(restoreKey);
    if (!recovered) {
      setBackupErrorMsg('Invalid encryption key or no hidden backup found.');
      return;
    }

    onRestoreData({
      entries: recovered.entries,
      settings: recovered.settings,
    });
    setBackupStatusMsg('Vault successfully decrypted and restored!');
    setRestoreKey('');
  };

  // Export encrypted file for Google Drive
  const handleExportGoogleDriveVault = async () => {
    const key = settings.security.masterKeyHint || 'telenotes_drive_key';
    const payload = {
      entries,
      settings,
      app: 'Telenotes',
      encryptedAt: Date.now(),
    };
    const encrypted = await encryptPayload(payload, key);
    downloadBlob(
      JSON.stringify(encrypted, null, 2),
      `telenotes_drive_vault_${new Date().toISOString().split('T')[0]}.telenotes`,
      'application/json'
    );
  };

  const THEMES_LIST: ThemeId[] = [
    'light',
    'dark',
    'amoled',
    'system',
    'cyberpunk-neon',
    'minimalist-monochrome',
    'nordic-pastel',
    'retro-vintage',
    'midnight-ocean',
    'forest-emerald',
    'sunset-terracotta',
    'material-you',
    'glassmorphism',
    'neumorphism',
    'custom',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none animate-fadeIn">
      {/* Universal Outside Click Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Right-Sliding Drawer Container (Requirement #5) */}
      <div
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
        className="relative w-full max-w-sm sm:max-w-md h-full border-l shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-300"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/20 border border-[var(--theme-accent)]/40 flex items-center justify-center text-[var(--theme-accent)] font-bold text-sm">
              TN
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Settings</h2>
              <p className="text-[11px] opacity-60">Global Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full opacity-60 hover:opacity-100 hover:bg-[var(--theme-surface-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Main Tabs */}
        <div className="flex items-center p-2 border-b border-[var(--theme-border)] gap-1 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'themes'
                ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Palette size={14} />
            <span>Themes</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'security'
                ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Shield size={14} />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'custom'
                ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Sliders size={14} />
            <span>Customise</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'backup'
                ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <HardDrive size={14} />
            <span>Backup</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: 15 STRICT THEMES (Requirement #5-a) */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold">15 Strict Visual Themes</h3>
                <p className="opacity-60 mt-0.5">
                  Applies directly to the whole screen, cards, dialogs, and status bar.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {THEMES_LIST.map((tId) => {
                  const t = THEME_REGISTRY[tId];
                  const isSelected = settings.theme === tId;
                  return (
                    <button
                      key={tId}
                      onClick={() => handleSelectTheme(tId)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all ${
                        isSelected
                          ? 'border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/40 scale-[1.02]'
                          : 'border-[var(--theme-border)] hover:opacity-90'
                      }`}
                      style={{ backgroundColor: t.surface, color: t.text }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: t.accent }}
                        />
                        {isSelected && <Check size={14} className="text-[var(--theme-accent)]" />}
                      </div>
                      <span className="font-semibold text-xs truncate max-w-full">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Color Theme Picker */}
              <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-2 mt-2">
                <span className="font-bold block">Custom Color Theme</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      if (settings.theme === 'custom') {
                        onUpdateSettings({ ...settings, customHexColor: e.target.value });
                      }
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-[var(--theme-border)]"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      if (settings.theme === 'custom') {
                        onUpdateSettings({ ...settings, customHexColor: e.target.value });
                      }
                    }}
                    className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl px-3 py-2 font-mono text-xs"
                  />
                  <button
                    onClick={() => handleSelectTheme('custom')}
                    className="px-3 py-2 bg-[var(--theme-accent)] text-white font-bold rounded-xl"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY (PIN OR PATTERN + BIOMETRICS) (Requirement #5-b) */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold">App Security & Passcode</h3>
                <p className="opacity-60 mt-0.5">
                  Secure your diaries with a 4-digit PIN, 3x3 pattern lock, and biometrics.
                </p>
              </div>

              {/* Passcode Toggle */}
              <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-3">
                <label className="flex items-center justify-between font-semibold cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Lock size={16} className="text-[var(--theme-accent)]" />
                    <span>Enable Lock Screen</span>
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
                    className="w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0"
                  />
                </label>

                {/* Biometrics Toggle */}
                <label className="flex items-center justify-between font-semibold cursor-pointer pt-2 border-t border-[var(--theme-border)]">
                  <span className="flex items-center gap-2">
                    <Fingerprint size={16} className="text-emerald-400" />
                    <span>Unlock with Biometrics (Fingerprint)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.security.biometricsEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          biometricsEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[var(--theme-accent)] focus:ring-0"
                  />
                </label>

                {/* Passcode Style Switcher: PIN vs Pattern */}
                <div className="pt-2 border-t border-[var(--theme-border)] space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          security: { ...settings.security, passcodeType: 'pin' },
                        })
                      }
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all ${
                        settings.security.passcodeType === 'pin'
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] opacity-60'
                      }`}
                    >
                      4-Digit PIN
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          security: { ...settings.security, passcodeType: 'pattern' },
                        })
                      }
                      className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all ${
                        settings.security.passcodeType === 'pattern'
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                          : 'border-[var(--theme-border)] opacity-60'
                      }`}
                    >
                      3x3 Pattern Lock
                    </button>
                  </div>

                  {/* 4-Digit PIN Form */}
                  {settings.security.passcodeType === 'pin' ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="New 4-digit PIN"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-center font-mono text-sm tracking-widest"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="Confirm PIN"
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                          className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-center font-mono text-sm tracking-widest"
                        />
                      </div>
                      <button
                        onClick={handleSavePin}
                        className="w-full py-2 bg-[var(--theme-accent)] text-white font-bold rounded-xl"
                      >
                        Set PIN Passcode
                      </button>
                    </div>
                  ) : (
                    /* 3x3 Dot Pattern Grid */
                    <div className="space-y-3 flex flex-col items-center">
                      <span className="text-[11px] opacity-75">
                        Tap dots to draw pattern ({patternDots.length} connected)
                      </span>
                      <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dot) => {
                          const isConnected = patternDots.includes(dot);
                          return (
                            <button
                              key={dot}
                              onClick={() => {
                                if (!patternDots.includes(dot)) {
                                  setPatternDots([...patternDots, dot]);
                                }
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isConnected
                                  ? 'bg-[var(--theme-accent)] text-white scale-110 shadow-lg'
                                  : 'bg-[var(--theme-bg)] border border-[var(--theme-border)] opacity-60'
                              }`}
                            >
                              {isConnected ? patternDots.indexOf(dot) + 1 : '•'}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => setPatternDots([])}
                          className="flex-1 py-1.5 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)]"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleSavePattern}
                          className="flex-1 py-1.5 bg-[var(--theme-accent)] text-white font-bold rounded-xl"
                        >
                          Save Pattern
                        </button>
                      </div>
                    </div>
                  )}

                  {securityMsg && (
                    <p className="text-[11px] text-center text-emerald-400 font-semibold">
                      {securityMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMISATION (HOMEPAGE DIARY CARD PREVIEW) (Requirement #5-c) */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold">Homepage Card Customisation</h3>
                <p className="opacity-60 mt-0.5">
                  Control what details appear in each diary bar preview.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-3">
                {/* Profile Pic Toggle */}
                <label className="flex items-center justify-between font-semibold cursor-pointer">
                  <span>Show Profile Avatar / Icon</span>
                  <input
                    type="checkbox"
                    checked={settings.previewConfig.showAvatar}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        previewConfig: {
                          ...settings.previewConfig,
                          showAvatar: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[var(--theme-accent)]"
                  />
                </label>

                {/* Content Preview Lines */}
                <div className="pt-2 border-t border-[var(--theme-border)] space-y-1.5">
                  <span className="font-semibold block">Diary Content Preview</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 0 as const, label: 'Off' },
                      { val: 1 as const, label: '1 Line' },
                      { val: 2 as const, label: '2 Lines' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            previewConfig: {
                              ...settings.previewConfig,
                              contentLines: opt.val,
                            },
                          })
                        }
                        className={`py-1.5 rounded-xl border text-center font-bold ${
                          settings.previewConfig.contentLines === opt.val
                            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                            : 'border-[var(--theme-border)] opacity-60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Creation Date Toggle */}
                <label className="flex items-center justify-between font-semibold cursor-pointer pt-2 border-t border-[var(--theme-border)]">
                  <span>Show Creation Date</span>
                  <input
                    type="checkbox"
                    checked={settings.previewConfig.showDate}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        previewConfig: {
                          ...settings.previewConfig,
                          showDate: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[var(--theme-accent)]"
                  />
                </label>

                {/* Creation Time Toggle */}
                <label className="flex items-center justify-between font-semibold cursor-pointer pt-2 border-t border-[var(--theme-border)]">
                  <span>Show Creation Time</span>
                  <input
                    type="checkbox"
                    checked={settings.previewConfig.showTime}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        previewConfig: {
                          ...settings.previewConfig,
                          showTime: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[var(--theme-accent)]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE (LOCAL AES-256 HIDDEN FOLDER & DRIVE) (Requirement #5-d) */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold">Encrypted Backup & Recovery</h3>
                <p className="opacity-60 mt-0.5">
                  Total storage used: {formatBytes(storageBreakdown.totalBytes)} ({entries.length} entries)
                </p>
              </div>

              {/* Local Hidden Storage Backup */}
              <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <FolderLock size={16} />
                  <span>Device Hidden Folder Vault (.telenotes_vault/)</span>
                </div>
                <p className="text-[11px] opacity-75">
                  App creates a totally hidden AES-256 encrypted storage vault on the device. Set your private encryption key before backing up.
                </p>

                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Set Encryption Secret Key"
                    value={userBackupKey}
                    onChange={(e) => setUserBackupKey(e.target.value)}
                    className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-xs"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Encryption Key"
                    value={confirmBackupKey}
                    onChange={(e) => setConfirmBackupKey(e.target.value)}
                    className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-xs"
                  />
                  <button
                    onClick={handleCreateHiddenVaultBackup}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>Backup to Device Hidden Folder</span>
                  </button>
                </div>

                {/* Restore upon Reinstall */}
                <div className="pt-3 border-t border-[var(--theme-border)] space-y-2">
                  <span className="font-semibold block text-[11px]">
                    Restore after Reinstalling App
                  </span>
                  <input
                    type="password"
                    placeholder="Enter your Encryption Key to Restore"
                    value={restoreKey}
                    onChange={(e) => setRestoreKey(e.target.value)}
                    className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-xs"
                  />
                  <button
                    onClick={handleRestoreFromHiddenVault}
                    className="w-full py-2 bg-[var(--theme-surface-hover)] border border-[var(--theme-border)] font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    <span>Verify Key & Restore Vault</span>
                  </button>
                </div>

                {backupStatusMsg && (
                  <p className="text-[11px] text-emerald-400 text-center font-semibold">
                    {backupStatusMsg}
                  </p>
                )}
                {backupErrorMsg && (
                  <p className="text-[11px] text-rose-400 text-center font-semibold">
                    {backupErrorMsg}
                  </p>
                )}
              </div>

              {/* Google Drive Cloud Backup */}
              <div className="p-3.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-sky-400">
                  <Cloud size={16} />
                  <span>Google Drive Encrypted Vault</span>
                </div>
                <p className="text-[11px] opacity-75">
                  Exports your diaries in a single AES-256 encrypted .telenotes vault file ready for Google Drive backup.
                </p>
                <button
                  onClick={handleExportGoogleDriveVault}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>Export Encrypted Cloud Vault</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
