import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry, AppSettings, StorageBreakdown } from './types';
import { AndroidContainer } from './components/layout/AndroidContainer';
import { TelegramFeed } from './components/home/TelegramFeed';
import { DiaryReader } from './components/canvas/DiaryReader';
import { DiaryCanvas } from './components/canvas/DiaryCanvas';
import { SettingsModal } from './components/settings/SettingsModal';
import { PasscodeLockOverlay } from './components/security/PasscodeLockOverlay';
import { NotificationBanner } from './components/notifications/NotificationBanner';
import {
  calculateStorageBreakdown,
  saveHiddenVaultBackup,
  exportDiaryEntry,
} from './services/cryptoVault';

const INITIAL_SETTINGS: AppSettings = {
  theme: 'dark',
  activeFontFamily: 'Plus Jakarta Sans',
  previewConfig: {
    showAvatar: true,
    contentLines: 2,
    showDate: true,
    showTime: true,
  },
  security: {
    isPasscodeEnabled: true,
    passcodeType: 'pin',
    passcodeHash: 'YwZ2oj0/ddlkZjawVv2jPxBetlG8JsRmKkOrUbK5f+g=', // Default PIN: 1234
    patternPoints: [0, 1, 2, 5],
    salt: 'telenotes_demo_salt_16',
    biometricsEnabled: true,
    autoLockDelayMinutes: 5,
    isSetupDone: true,
    masterKeyHash: 'JM6O14fBpVf0SNFr6kDNOO9gOM6BA4kUY4CMnyOvizw=',
    masterKeyHint: 'velvet-quill-cipher',
  },
  backupConfig: {
    hiddenVaultKeySet: false,
    autoBackupInterval: 'daily',
    lastBackupTimestamp: Date.now(),
  },
  customFonts: [],
};

const STARTER_DIARIES: DiaryEntry[] = [
  {
    id: 'diary_starter_1',
    title: 'Welcome to Telenotes',
    content: `<h3>Your Encrypted Private Diary Studio</h3>
    <p>Every diary entry appears here just like a message in a private chat thread. You can write with <em>rich typography</em> in both <strong>English and Hindi</strong>, drag borderless stickers & GIFs anywhere on the canvas, record voice memos, and set custom wallpapers.</p>
    <blockquote>"The scariest moment is always just before you start. After that, things can only get better." — Stephen King</blockquote>
    <p>Tap the <strong>pencil button ✏️</strong> in the upper right corner to edit any saved diary, or swipe left/right to pin, export, and delete.</p>`,
    plainText: 'Welcome to Telenotes. Every diary entry appears here just like a message in a private chat thread. You can write with rich typography in both English and Hindi.',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    avatar: {
      type: 'emoji',
      value: '✨',
      bgColor: '#0284c7',
    },
    folderId: 'all',
    isPinned: true,
    audioRecordings: [],
    media: [
      {
        id: 'stk_demo_1',
        type: 'sticker',
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FFD13B"/><ellipse cx="50" cy="62" rx="28" ry="22" fill="%23F6BE22"/><circle cx="38" cy="42" r="6" fill="%23222"/><circle cx="62" cy="42" r="6" fill="%23222"/><polygon points="44,52 56,52 50,62" fill="%23FF7A00"/></svg>',
        name: 'Quill Duck',
        x: 70,
        y: 20,
        width: 120,
        height: 120,
        rotation: 10,
        filter: 'none',
      },
    ],
    tags: ['welcome', 'guide'],
  },
  {
    id: 'diary_starter_2',
    title: 'Late Night Coffee & Reflection',
    content: `<p>A quiet evening with fresh brew. Jotting down observations from today. The rain outside is tapping gently against the glass pane.</p>
    <p>Gboard GIFs paste directly into the writing canvas with full drag and resize controls.</p>`,
    plainText: 'A quiet evening with fresh brew. Jotting down observations from today. The rain outside is tapping gently against the glass pane.',
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 8,
    avatar: {
      type: 'emoji',
      value: '☕',
      bgColor: '#b45309',
    },
    folderId: 'personal',
    isPinned: false,
    audioRecordings: [],
    media: [],
    tags: ['coffee', 'reflection'],
  },
];

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_entries_v4');
      return saved ? JSON.parse(saved) : STARTER_DIARIES;
    } catch {
      return STARTER_DIARIES;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('telenotes_settings_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          security: {
            ...INITIAL_SETTINGS.security,
            ...parsed.security,
            isSetupDone: true,
          },
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // App Navigation: 'feed' (Stream) | 'read' (Saved Diary Reader) | 'canvas' (Writing & Edit Studio)
  const [activeView, setActiveView] = useState<'feed' | 'read' | 'canvas'>('feed');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // Right-Sliding Settings Drawer
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Lock Screen
  const [isLocked, setIsLocked] = useState(false);

  // Notifications
  const [activeNotification, setActiveNotification] = useState<{
    entry: DiaryEntry;
    title: string;
  } | null>(null);

  // Storage breakdown
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown>(() =>
    calculateStorageBreakdown(entries, settings.customFonts)
  );

  const lastActivityRef = useRef<number>(Date.now());

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('telenotes_entries_v4', JSON.stringify(entries));
      setStorageBreakdown(calculateStorageBreakdown(entries, settings.customFonts));
    } catch (e) {
      console.error(e);
    }
  }, [entries, settings.customFonts]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_settings_v4', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Activity tracking for auto-lock timer
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const checkInterval = window.setInterval(() => {
      if (
        !isLocked &&
        settings.security.isSetupDone &&
        settings.security.isPasscodeEnabled &&
        settings.security.autoLockDelayMinutes > 0
      ) {
        const idleMillis = Date.now() - lastActivityRef.current;
        const autoLockMillis = settings.security.autoLockDelayMinutes * 60 * 1000;
        if (idleMillis >= autoLockMillis) {
          setIsLocked(true);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(checkInterval);
    };
  }, [isLocked, settings.security]);

  // Automated Backup Daemon
  useEffect(() => {
    const backupInterval = settings.backupConfig?.autoBackupInterval || 'daily';
    if (backupInterval === 'off') return;

    let intervalMs = 86400000; // 24 hours
    if (backupInterval === '6h') intervalMs = 21600000;
    if (backupInterval === 'weekly') intervalMs = 604800000;

    const lastBackup = settings.backupConfig?.lastBackupTimestamp || 0;
    if (Date.now() - lastBackup > intervalMs) {
      const secret = settings.security.masterKeyHint || 'telenotes_vault_key';
      saveHiddenVaultBackup(entries, settings, secret).then((saved) => {
        if (saved) {
          setSettings((prev) => ({
            ...prev,
            backupConfig: {
              ...prev.backupConfig,
              lastBackupTimestamp: Date.now(),
            },
          }));
        }
      });
    }
  }, [entries, settings.backupConfig]);

  // Reminder Notification Daemon
  useEffect(() => {
    const reminderChecker = window.setInterval(() => {
      const now = Date.now();
      for (const entry of entries) {
        if (
          entry.reminder &&
          !entry.reminder.isTriggered &&
          entry.reminder.dueTimestamp <= now
        ) {
          setActiveNotification({
            entry,
            title: `Reminder: ${entry.reminder.title || entry.title}`,
          });

          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id && e.reminder
                ? { ...e, reminder: { ...e.reminder, isTriggered: true } }
                : e
            )
          );
          break;
        }
      }
    }, 5000);

    return () => clearInterval(reminderChecker);
  }, [entries]);

  // Handlers for Diary CRUD
  const handleSaveDiary = (savedEntry: DiaryEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === savedEntry.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEntry.id ? savedEntry : e));
      }
      return [savedEntry, ...prev];
    });
    setSelectedEntry(savedEntry);
  };

  const handleDeleteDiary = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setActiveView('feed');
    }
  };

  const handleTogglePin = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  };

  const handleRestoreData = (restored: {
    entries?: DiaryEntry[];
    settings?: AppSettings;
  }) => {
    if (restored.entries) setEntries(restored.entries);
    if (restored.settings) setSettings(restored.settings);
  };

  return (
    <AndroidContainer
      theme={settings.theme}
      customHexColor={settings.customHexColor}
      activeFontFamily={settings.activeFontFamily}
    >
      {/* Reminder Notification Banner */}
      {activeNotification && (
        <NotificationBanner
          notification={activeNotification}
          onOpen={(entry) => {
            setSelectedEntry(entry);
            setActiveView('read');
            setActiveNotification(null);
          }}
          onDismiss={() => setActiveNotification(null)}
        />
      )}

      {/* Passcode Lock Overlay */}
      {isLocked && settings.security.isPasscodeEnabled ? (
        <PasscodeLockOverlay
          passcodeType={settings.security.passcodeType || 'pin'}
          passcodeHash={settings.security.passcodeHash}
          patternPoints={settings.security.patternPoints}
          salt={settings.security.salt}
          biometricsEnabled={settings.security.biometricsEnabled}
          masterKeyHash={settings.security.masterKeyHash}
          onUnlock={() => setIsLocked(false)}
          onResetPasscode={() => {
            setIsLocked(false);
            setIsSettingsOpen(true);
          }}
        />
      ) : (
        /* Main Application View Flow */
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
          {/* 1. HOMEPAGE CHAT STREAM */}
          {activeView === 'feed' && (
            <TelegramFeed
              entries={entries}
              settings={settings}
              onSelectEntry={(entry) => {
                setSelectedEntry(entry);
                setActiveView('read'); // Requirement: Saved diary opens in read mode
              }}
              onCreateNewEntry={() => {
                setSelectedEntry(null);
                setActiveView('canvas'); // New diary opens directly into write canvas
              }}
              onLockApp={() => setIsLocked(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onTogglePin={handleTogglePin}
              onDeleteEntry={handleDeleteDiary}
            />
          )}

          {/* 2. READ MODE (Saved Diary) */}
          {activeView === 'read' && selectedEntry && (
            <DiaryReader
              entry={selectedEntry}
              settings={settings}
              onEdit={() => setActiveView('canvas')} // Pencil button transitions to canvas
              onBack={() => {
                setActiveView('feed');
                setSelectedEntry(null);
              }}
              onExport={() => exportDiaryEntry(selectedEntry, 'pdf')}
            />
          )}

          {/* 3. WRITING & EDITING CANVAS */}
          {activeView === 'canvas' && (
            <DiaryCanvas
              entry={selectedEntry}
              settings={settings}
              onSave={handleSaveDiary}
              onBack={() => {
                if (selectedEntry) {
                  setActiveView('read');
                } else {
                  setActiveView('feed');
                }
              }}
              onUpdateSettings={setSettings}
            />
          )}

          {/* RIGHT-SLIDING SETTINGS DRAWER */}
          {isSettingsOpen && (
            <SettingsModal
              settings={settings}
              storageBreakdown={storageBreakdown}
              entries={entries}
              onUpdateSettings={setSettings}
              onRestoreData={handleRestoreData}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
      )}
    </AndroidContainer>
  );
}
