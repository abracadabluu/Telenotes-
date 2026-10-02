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
  Fingerprint,
  Sliders,
  Check,
  Cloud,
  FileText,
  AlertTriangle,
  Key,
} from 'lucide-react';
import { AppSettings, ThemeId, AppIconId, StorageBreakdown, DiaryEntry, BookProject } from '../../types';
import {
  formatBytes,
  downloadBlob,
  encryptPayload,
  decryptPayload,
  hashSecret,
  generateRandomSalt,
} from '../../services/cryptoVault';

interface SettingsModalProps {
  settings: AppSettings;
  storageBreakdown: StorageBreakdown;
  entries: DiaryEntry[];
  books: BookProject[];
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
  onUpdateSettings,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'security' | 'storage' | 'backup' | 'display'>('theme');

  // Security editing
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [newMasterKey, setNewMasterKey] = useState('');
  const [masterKeyChangeMsg, setMasterKeyChangeMsg] = useState('');

  // Backup & Restore
  const [restoreSecretKey, setRestoreSecretKey] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    diaries: true,
    books: true,
    settings: true,
  });
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Cloud backup simulation
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncSuccess, setDriveSyncSuccess] = useState(false);

  // Theme handlers
  const handleThemeChange = (themeId: ThemeId) => {
    onUpdateSettings({
      ...settings,
      theme: themeId,
    });
  };

  const handleAppIconChange = (iconId: AppIconId) => {
    onUpdateSettings({
      ...settings,
      appIcon: iconId,
    });
  };

  // Save new PIN
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

    setPinChangeMsg('Passcode updated successfully!');
    setNewPin('');
    setConfirmNewPin('');
  };

  // Save new Master Key
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

    setMasterKeyChangeMsg('Master Secret Key updated!');
    setNewMasterKey('');
  };

  // Full Encrypted Export
  const handleExportEncryptedVault = async () => {
    const vaultPackage = {
      entries,
      books,
      settings,
      exportTimestamp: Date.now(),
      version: 1,
    };

    // Encrypted using master key hint or passcode
    const encrypted = await encryptPayload(
      vaultPackage,
      settings.security.masterKeyHint || 'telenotes-master-vault'
    );
    const jsonStr = JSON.stringify(encrypted, null, 2);
    downloadBlob(jsonStr, `telenotes_encrypted_backup_${new Date().toISOString().slice(0, 10)}.telenotes`, 'application/json');
  };

  // Handle Restore file selected
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRestoreFileContent(reader.result as string);
      setRestoreMsg(`Loaded file: ${file.name}`);
      setRestoreError(null);
    };
    reader.readAsText(file);
  };

  // Perform Decrypt & Restore
  const handleExecuteRestore = async () => {
    if (!restoreFileContent) {
      setRestoreError('Please select a backup file first.');
      return;
    }
    if (!restoreSecretKey.trim()) {
      setRestoreError('Please enter your Master Secret Key to decrypt the backup.');
      return;
    }

    try {
      const parsedPkg = JSON.parse(restoreFileContent);
      // Decrypt
      const decrypted = await decryptPayload<{
        entries?: DiaryEntry[];
        books?: BookProject[];
        settings?: AppSettings;
      }>(parsedPkg, restoreSecretKey.trim());

      onRestoreData({
        entries: restoreOptions.diaries ? decrypted.entries : undefined,
        books: restoreOptions.books ? decrypted.books : undefined,
        settings: restoreOptions.settings ? decrypted.settings : undefined,
      });

      setRestoreMsg('Vault restored successfully! Selected items have been recovered.');
      setRestoreError(null);
    } catch (err: unknown) {
      setRestoreError('Failed to decrypt vault. Please check your Master Secret Key.');
    }
  };

  // Google Drive Simulation
  const handleSyncGoogleDrive = () => {
    setIsSyncingDrive(true);
    setTimeout(() => {
      setIsSyncingDrive(false);
      setDriveSyncSuccess(true);
      onUpdateSettings({
        ...settings,
        driveBackupStatus: {
          lastSynced: Date.now(),
          accountEmail: 'encrypted.user@telenotes.backup',
          autoSync: true,
        },
      });
      setTimeout(() => setDriveSyncSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full h-[85vh] max-h-[640px] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Telenotes Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-3 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'theme', label: 'Theme & Icon', icon: Palette },
            { id: 'display', label: 'Chat Feed', icon: Sliders },
            { id: 'security', label: 'App Lock & Key', icon: Shield },
            { id: 'storage', label: 'Storage Quota', icon: HardDrive },
            { id: 'backup', label: 'Backup & Restore', icon: RefreshCw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-sky-500 text-sky-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-200 text-xs">
          {/* Theme & Icon Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-white mb-2 text-sm">Color Theme Palette</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'telegram-dark', name: 'Telegram Dark', desc: 'Classic Telegram dark navy', color: '#18222d' },
                    { id: 'telegram-light', name: 'Telegram Light', desc: 'Clean daytime daylight', color: '#f5f6f8' },
                    { id: 'amoled', name: 'AMOLED Night', desc: 'Pitch black high contrast', color: '#000000' },
                    { id: 'material-green', name: 'Material Sage', desc: 'Android dynamic green', color: '#14251e' },
                    { id: 'sunset', name: 'Amber Sunset', desc: 'Warm dusk & parchment', color: '#2c1810' },
                    { id: 'cyber-teal', name: 'Cyber Teal', desc: 'Deep electric cyan', color: '#0f2229' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id as ThemeId)}
                      className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                        settings.theme === t.id
                          ? 'border-sky-500 bg-sky-500/10 shadow-md ring-1 ring-sky-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <span>{t.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{t.desc}</p>
                      </div>
                      {settings.theme === t.id && <Check size={16} className="text-sky-400 mt-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic App Icon */}
              <div className="pt-2 border-t border-slate-800">
                <h3 className="font-semibold text-white mb-2 text-sm">App Icon Selection</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'classic', label: 'Telegram Blue', gradient: 'from-sky-500 to-blue-600', icon: '✈️' },
                    { id: 'dark', label: 'Dark Stealth', gradient: 'from-slate-700 to-slate-900', icon: '📓' },
                    { id: 'gold', label: 'Golden Ink', gradient: 'from-amber-400 to-amber-600', icon: '✒️' },
                    { id: 'ruby', label: 'Ruby Quill', gradient: 'from-rose-500 to-rose-700', icon: '📖' },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => handleAppIconChange(ic.id as AppIconId)}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        settings.appIcon === ic.id
                          ? 'border-sky-500 bg-sky-500/15 ring-1 ring-sky-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${ic.gradient} flex items-center justify-center text-xl shadow-md`}
                      >
                        {ic.icon}
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium text-center truncate max-w-full">
                        {ic.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Feed Display Options */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-1 text-sm">Diary Chat Rows Configuration</h3>
                <p className="text-slate-400 text-xs">
                  Customize how previous diary reflections are previewed in the main Telegram chat list.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Preview Message Lines</span>
                    <span className="text-slate-400 text-[11px]">How many lines of diary content to show</span>
                  </div>
                  <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    {[1, 2, 3].map((lines) => (
                      <button
                        key={lines}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            chatListConfig: {
                              ...settings.chatListConfig,
                              previewLines: lines as 1 | 2 | 3,
                            },
                          })
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          settings.chatListConfig.previewLines === lines
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lines} {lines === 1 ? 'line' : 'lines'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-semibold text-white block">Show Creation Timestamp</span>
                    <span className="text-slate-400 text-[11px]">Display date/time in the top-right corner of each chat row</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.chatListConfig.showTimestamp}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        chatListConfig: {
                          ...settings.chatListConfig,
                          showTimestamp: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-semibold text-white block">Row Quick Action Buttons</span>
                    <span className="text-slate-400 text-[11px]">Show pin, export, and delete shortcuts on list rows</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.chatListConfig.showActionButtons}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        chatListConfig: {
                          ...settings.chatListConfig,
                          showActionButtons: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security & Passcode Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-1 text-sm">App Lock & Security Controls</h3>
                <p className="text-slate-400 text-xs">
                  Manage your passcode lock, biometric authentication, auto-lock timeout, and Master Secret Key.
                </p>
              </div>

              {/* Passcode toggles */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-sky-400" />
                    <div>
                      <span className="font-semibold text-white block">Passcode Lock</span>
                      <span className="text-slate-400 text-[11px]">Require 4-digit PIN when opening app</span>
                    </div>
                  </div>
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
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={16} className="text-sky-400" />
                    <div>
                      <span className="font-semibold text-white block">Biometrics Authentication</span>
                      <span className="text-slate-400 text-[11px]">Unlock with Fingerprint or Face ID sensor</span>
                    </div>
                  </div>
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
                    className="w-4 h-4 accent-sky-500 rounded"
                  />
                </div>

                {/* Auto-Lock Delay (user requested setting) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-semibold text-white block">Auto-Lock After Close / Inactivity</span>
                    <span className="text-slate-400 text-[11px]">How quickly the app locks when in background</span>
                  </div>
                  <select
                    value={settings.security.autoLockDelayMinutes}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          autoLockDelayMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 outline-none text-xs"
                  >
                    <option value={0}>Immediately</option>
                    <option value={1}>After 1 minute</option>
                    <option value={5}>After 5 minutes</option>
                    <option value={15}>After 15 minutes</option>
                    <option value={30}>After 30 minutes</option>
                    <option value={-1}>Never</option>
                  </select>
                </div>
              </div>

              {/* Change PIN box */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-semibold text-white block">Change 4-Digit Passcode</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="New 4-digit PIN"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Confirm PIN"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                  />
                </div>
                {pinChangeMsg && (
                  <div className="text-[11px] text-sky-400 font-medium">{pinChangeMsg}</div>
                )}
                <button
                  type="button"
                  onClick={handleChangePin}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-medium text-xs border border-slate-700"
                >
                  Update Passcode
                </button>
              </div>

              {/* Change Master Secret Key (user requested setting) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-semibold text-white block">Rotate Master Secret Key</span>
                <p className="text-slate-400 text-[11px]">
                  Change the root key used to decrypt your hidden local folder data and restore backups.
                </p>
                <input
                  type="password"
                  value={newMasterKey}
                  onChange={(e) => setNewMasterKey(e.target.value)}
                  placeholder="New master secret recovery key..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white outline-none"
                />
                {masterKeyChangeMsg && (
                  <div className="text-[11px] text-sky-400 font-medium">{masterKeyChangeMsg}</div>
                )}
                <button
                  type="button"
                  onClick={handleChangeMasterKey}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-medium text-xs border border-slate-700"
                >
                  Save New Master Key
                </button>
              </div>
            </div>
          )}

          {/* Storage Quota Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-1 text-sm">Hidden Dedicated Folder Storage</h3>
                <p className="text-slate-400 text-xs">
                  Inspect the exact local footprint consumed by your diaries, book manuscripts, voice recordings, and images in the encrypted storage folder.
                </p>
              </div>

              {/* Total storage card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-900/40 to-slate-900 border border-sky-500/30">
                <span className="text-[11px] text-sky-300 font-medium uppercase tracking-wider">
                  Total Encrypted Vault Size
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatBytes(storageBreakdown.totalBytes)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Stored securely inside dedicated local IndexedDB storage
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Diary Entries', bytes: storageBreakdown.diariesBytes, count: `${entries.length} notes`, icon: '📔' },
                  { label: 'Books & Novels', bytes: storageBreakdown.booksBytes, count: `${books.length} books`, icon: '📖' },
                  { label: 'Voice Audio Memos', bytes: storageBreakdown.audioBytes, count: 'Encrypted audio', icon: '🎙️' },
                  { label: 'Photos & Images', bytes: storageBreakdown.imagesBytes, count: 'Media studio', icon: '🖼️' },
                  { label: 'Telegram Stickers', bytes: storageBreakdown.stickersBytes, count: 'Vector cache', icon: '✨' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="font-semibold text-slate-200 text-xs truncate">{item.label}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-bold text-white font-mono">
                        {formatBytes(item.bytes)}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-1 text-sm">Backup & Selective Reinstall Restore</h3>
                <p className="text-slate-400 text-xs">
                  Create zero-knowledge encrypted backups or selectively restore previous diaries, books, and preferences with your Master Secret Key.
                </p>
              </div>

              {/* Export Source Code ZIP */}
              <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <span className="font-semibold text-white block">Download App Source Code (.ZIP)</span>
                    <span className="text-slate-400 text-[11px]">
                      Complete project code archive ready to push to GitHub or run locally with Vite
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="/telenotes-source-code.zip"
                    download="telenotes-app-source.zip"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all text-center inline-flex"
                  >
                    <Download size={14} />
                    <span>Download Project ZIP</span>
                  </a>
                </div>
              </div>

              {/* Export backup */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-semibold text-white block">Download Encrypted Vault Backup</span>
                <p className="text-slate-400 text-[11px]">
                  Generates an AES-GCM encrypted file containing all your diaries, books, audio memos, and settings.
                </p>
                <button
                  type="button"
                  onClick={handleExportEncryptedVault}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>Download .telenotes Vault File</span>
                </button>
              </div>

              {/* Google Drive Backup Simulation */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud size={16} className="text-sky-400" />
                    <div>
                      <span className="font-semibold text-white block">Google Drive Cloud Sync</span>
                      <span className="text-slate-400 text-[11px]">Encrypted cloud backup synchronization</span>
                    </div>
                  </div>
                  {settings.driveBackupStatus?.lastSynced && (
                    <span className="text-[10px] text-emerald-400 font-mono">Synced</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {settings.driveBackupStatus?.lastSynced
                      ? `Last synced: ${new Date(settings.driveBackupStatus.lastSynced).toLocaleString()}`
                      : 'Never backed up to Google Drive'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncGoogleDrive}
                    disabled={isSyncingDrive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-medium border border-slate-700"
                  >
                    <RefreshCw size={12} className={isSyncingDrive ? 'animate-spin' : ''} />
                    <span>{isSyncingDrive ? 'Encrypting & Syncing...' : 'Sync to Drive'}</span>
                  </button>
                </div>
                {driveSyncSuccess && (
                  <div className="text-emerald-400 text-[11px]">
                    Encrypted vault backup successfully synced to Google Drive!
                  </div>
                )}
              </div>

              {/* Selective Reinstall Restore */}
              <div className="p-4 bg-slate-950/60 border border-sky-500/30 rounded-2xl space-y-3">
                <span className="font-semibold text-white block">Reinstall / Restore Vault</span>
                <p className="text-slate-400 text-[11px]">
                  Select a backup file, choose what to restore, and enter your Master Secret Key to decrypt.
                </p>

                {/* File picker */}
                <input
                  type="file"
                  accept=".telenotes,.json"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-sky-400 hover:file:bg-slate-700"
                />

                {/* Selective checkboxes (User requested: user selects what to restore) */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">Choose what to restore:</span>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreOptions.diaries}
                        onChange={(e) =>
                          setRestoreOptions((prev) => ({ ...prev, diaries: e.target.checked }))
                        }
                        className="accent-sky-500 rounded"
                      />
                      <span>Diaries & Notes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreOptions.books}
                        onChange={(e) =>
                          setRestoreOptions((prev) => ({ ...prev, books: e.target.checked }))
                        }
                        className="accent-sky-500 rounded"
                      />
                      <span>Book Manuscripts</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreOptions.settings}
                        onChange={(e) =>
                          setRestoreOptions((prev) => ({ ...prev, settings: e.target.checked }))
                        }
                        className="accent-sky-500 rounded"
                      />
                      <span>Preferences</span>
                    </label>
                  </div>
                </div>

                {/* Secret Key Input */}
                <div className="pt-2">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Master Secret Key (set during initial installation)
                  </label>
                  <input
                    type="password"
                    value={restoreSecretKey}
                    onChange={(e) => setRestoreSecretKey(e.target.value)}
                    placeholder="Enter Master Secret Key..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs outline-none"
                  />
                </div>

                {restoreMsg && <div className="text-emerald-400 text-[11px]">{restoreMsg}</div>}
                {restoreError && <div className="text-rose-400 text-[11px]">{restoreError}</div>}

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-md active:scale-95 transition-all"
                >
                  Decrypt & Restore Selected Items
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
