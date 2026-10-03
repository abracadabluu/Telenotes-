import React, { useState, useEffect, useRef } from 'react';
import {
  DiaryEntry,
  BookProject,
  Folder,
  AppSettings,
  StorageBreakdown,
} from './types';
import { AndroidContainer } from './components/layout/AndroidContainer';
import { TelegramFeed } from './components/home/TelegramFeed';
import { DiaryCanvas } from './components/canvas/DiaryCanvas';
import { BooksGallery } from './components/book/BooksGallery';
import { BookStudio } from './components/book/BookStudio';
import { SettingsModal } from './components/settings/SettingsModal';
import { PasscodeLockOverlay } from './components/security/PasscodeLockOverlay';
import { NotificationBanner } from './components/notifications/NotificationBanner';
import {
  calculateStorageBreakdown,
  saveHiddenVaultBackup,
} from './services/cryptoVault';

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'All Notes', icon: '💬', color: '#38bdf8', isSystem: true },
  { id: 'personal', name: 'Personal', icon: '🌱', color: '#10b981' },
  { id: 'ideas', name: 'Story Ideas', icon: '💡', color: '#f59e0b' },
  { id: 'work', name: 'Manuscripts', icon: '📚', color: '#6366f1' },
];

const INITIAL_SETTINGS: AppSettings = {
  landingPage: 'diary',
  theme: 'telegram-dark',
  appIcon: 'classic',
  activeFontFamily: 'Plus Jakarta Sans',
  toolbarPosition: 'bottom',
  diaryFeedConfig: {
    showTagsBar: true,
    snippetPreview: true,
    showDate: true,
    showWordCount: true,
    showMediaCount: true,
    compactMode: false,
  },
  booksGridConfig: {
    showWordGoal: true,
    showGenreBadge: true,
  },
  security: {
    isPasscodeEnabled: true,
    passcodeHash: 'YwZ2oj0/ddlkZjawVv2jPxBetlG8JsRmKkOrUbK5f+g=', // Default PIN: 1234
    salt: 'telenotes_demo_salt_16',
    biometricsEnabled: true,
    autoLockDelayMinutes: 5,
    isSetupDone: true,
    masterKeyHash: 'JM6O14fBpVf0SNFr6kDNOO9gOM6BA4kUY4CMnyOvizw=',
    masterKeyHint: 'velvet-quill-cipher',
  },
  autoBackup: {
    interval: 'daily',
    lastBackupTimestamp: Date.now(),
  },
  customFonts: [],
};

const STARTER_DIARIES: DiaryEntry[] = [
  {
    id: 'diary_starter_1',
    title: 'Welcome to Telenotes',
    content: `<h3>Your Encrypted Telegram-Style Diary & Book Studio</h3>
    <p>Every diary entry appears here just like a message in a private chat thread. You can write with <em>rich typography</em> in both <strong>English and Hindi</strong>, drag borderless stickers & GIFs anywhere on the canvas, record voice memos, and set custom wallpapers.</p>
    <blockquote>"The scariest moment is always just before you start. After that, things can only get better." — Stephen King</blockquote>
    <p>Tap the <strong>☰ menu</strong> in the top left to switch between your Diary and your 2x2 Book Writing Studio.</p>`,
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
    stickers: [
      {
        id: 'stk_demo_1',
        stickerUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FFD13B"/><ellipse cx="50" cy="62" rx="28" ry="22" fill="%23F6BE22"/><circle cx="38" cy="42" r="6" fill="%23222"/><circle cx="62" cy="42" r="6" fill="%23222"/><polygon points="44,52 56,52 50,62" fill="%23FF7A00"/></svg>',
        name: 'Quill Duck',
        x: 75,
        y: 25,
        scale: 1,
        rotation: 10,
      },
    ],
    attachments: [],
    tags: ['welcome', 'guide'],
  },
  {
    id: 'diary_starter_2',
    title: 'Late Night Coffee & Reflection',
    content: `<p>A quiet evening with fresh brew. Jotting down observations from today. The rain outside is tapping against the glass pane.</p>
    <p>Need to outline the plot twist for Chapter 4 in the Book Studio tomorrow morning.</p>`,
    plainText: 'A quiet evening with fresh brew. Jotting down observations from today. The rain outside is tapping against the glass pane.',
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
    stickers: [],
    attachments: [],
    tags: ['coffee', 'reflection'],
  },
];

const STARTER_BOOKS: BookProject[] = [
  {
    id: 'book_starter_1',
    title: 'The Whispering Pines',
    subtitle: 'Book 1: The Echoes of Dawn',
    author: 'A. B. Giri',
    genre: 'Mystery / Adventure',
    targetWords: 30000,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
    coverStyle: {
      texture: 'leather-classic',
      goldFoil: true,
      ribbonColor: '#f59e0b',
    },
    chapters: [
      {
        id: 'chap_1',
        title: 'Chapter 1: The Hidden Valley',
        order: 1,
        content: `<h2>The Arrival</h2>
        <p>The mist hung low over the valley of Whispering Pines as the old steam train rattled to a slow halt. Arthur adjusted his spectacles and stepped onto the damp wooden planks of the station platform. The air was thick with the scent of wet pine needles and distant woodsmoke.</p>
        <p>In his breast pocket, the sealed wax letter felt warm against his chest—the only key to his late grandfather's estate.</p>`,
        wordCount: 84,
        status: 'draft',
      },
      {
        id: 'chap_2',
        title: 'Chapter 2: The Brass Clockmaker',
        order: 2,
        content: `<p>Deep within the village cobblestones, a shop with a tilted wooden sign caught Arthur's gaze: <em>Horology & Curiosities</em>. The rhythmic ticking of a hundred gears echoed through the dark mahogany interior.</p>`,
        wordCount: 38,
        status: 'draft',
      },
    ],
    characters: [
      {
        id: 'char_1',
        name: 'Arthur Sterling',
        role: 'Protagonist',
        notes: 'An archivist who inherits an enigmatic estate filled with cipher notebooks.',
      },
      {
        id: 'char_2',
        name: 'Eliza Moore',
        role: 'Clockmaker Apprentice',
        notes: 'Resourceful and quick-witted; knows every secret tunnel under the pine forest.',
      },
    ],
    outlineNotes: 'Three-Act Structure: Arthur arrives, uncovers the brass cipher box, and must race against the winter solstice.',
  },
  {
    id: 'book_starter_2',
    title: 'Shadows of Varanasi',
    subtitle: 'A Historical Noir',
    author: 'K. Sharma',
    genre: 'Historical Fiction',
    targetWords: 45000,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    coverStyle: {
      texture: 'leather-cognac',
      goldFoil: true,
      ribbonColor: '#ef4444',
    },
    chapters: [
      {
        id: 'chap_v1',
        title: 'अध्याय 1: घाटों की शाम',
        order: 1,
        content: `<p>दशाश्वमेध घाट पर आरती की घंटियों की गूंज गंगा के जल पर तैर रही थी। कबीर ने अपनी नाव को किनारे से बांधा और पुरानी डायरी निकाली।</p>`,
        wordCount: 32,
        status: 'draft',
      },
    ],
    characters: [],
    outlineNotes: '',
  },
];

export default function App() {
  // Persistence state
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_entries_v3');
      return saved ? JSON.parse(saved) : STARTER_DIARIES;
    } catch {
      return STARTER_DIARIES;
    }
  });

  const [books, setBooks] = useState<BookProject[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_books_v3');
      return saved ? JSON.parse(saved) : STARTER_BOOKS;
    } catch {
      return STARTER_BOOKS;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_folders_v3');
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('telenotes_settings_v3');
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

  // App Navigation & Active View
  // Initial landing page based on user setting (Requirement #3 & #4)
  const [activeView, setActiveView] = useState<
    'feed' | 'diary' | 'booksGallery' | 'bookStudio'
  >(() => (settings.landingPage === 'books' ? 'booksGallery' : 'feed'));

  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookProject | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');

  // Hamburger Settings Drawer state (Requirement #6)
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState<boolean>(false);

  // Security & Lock State
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Notification State
  const [activeNotification, setActiveNotification] = useState<{
    entry: DiaryEntry;
    title: string;
  } | null>(null);

  // Storage breakdown
  const [storageBreakdown, setStorageBreakdown] = useState<StorageBreakdown>(() =>
    calculateStorageBreakdown(entries, books)
  );

  const lastActivityRef = useRef<number>(Date.now());

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem('telenotes_entries_v3', JSON.stringify(entries));
      setStorageBreakdown(calculateStorageBreakdown(entries, books));
    } catch (e) {
      console.error(e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_books_v3', JSON.stringify(books));
      setStorageBreakdown(calculateStorageBreakdown(entries, books));
    } catch (e) {
      console.error(e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_folders_v3', JSON.stringify(folders));
    } catch (e) {
      console.error(e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_settings_v3', JSON.stringify(settings));
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

  // Automated Backup Daemon (Requirement #7)
  useEffect(() => {
    const backupInterval = settings.autoBackup?.interval || 'daily';
    if (backupInterval === 'off') return;

    let intervalMs = 86400000; // 24 hours
    if (backupInterval === '6h') intervalMs = 21600000;
    if (backupInterval === 'weekly') intervalMs = 604800000;

    const lastBackup = settings.autoBackup?.lastBackupTimestamp || 0;
    if (Date.now() - lastBackup > intervalMs) {
      const secret = settings.security.masterKeyHint || 'telenotes_vault_key';
      saveHiddenVaultBackup(entries, books, settings, secret).then((saved) => {
        if (saved) {
          setSettings((prev) => ({
            ...prev,
            autoBackup: {
              ...prev.autoBackup,
              lastBackupTimestamp: Date.now(),
            },
          }));
        }
      });
    }
  }, [entries, books, settings.autoBackup]);

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
    setActiveView('feed');
    setSelectedEntry(null);
  };

  const handleDeleteDiary = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setActiveView('feed');
    }
  };

  const handleDuplicateDiary = (entry: DiaryEntry) => {
    const duplicated: DiaryEntry = {
      ...entry,
      id: 'diary_' + Date.now(),
      title: `${entry.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
    };
    setEntries((prev) => [duplicated, ...prev]);
  };

  const handleTogglePin = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  };

  // Handlers for Book CRUD
  const handleSaveBook = (savedBook: BookProject) => {
    setBooks((prev) => {
      const exists = prev.some((b) => b.id === savedBook.id);
      if (exists) {
        return prev.map((b) => (b.id === savedBook.id ? savedBook : b));
      }
      return [savedBook, ...prev];
    });
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (selectedBook?.id === bookId) {
      setSelectedBook(null);
      setActiveView('booksGallery');
    }
  };

  const handleDuplicateBook = (book: BookProject) => {
    const duplicated: BookProject = {
      ...book,
      id: 'book_' + Date.now(),
      title: `${book.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chapters: book.chapters.map((c) => ({
        ...c,
        id: 'chap_' + Math.random().toString(36).slice(2, 9),
      })),
    };
    setBooks((prev) => [duplicated, ...prev]);
  };

  const handleAddFolder = (name: string, icon: string) => {
    const newFolder: Folder = {
      id: 'fld_' + Date.now(),
      name,
      icon,
      color: '#38bdf8',
    };
    setFolders((prev) => [...prev, newFolder]);
    setActiveFolderId(newFolder.id);
  };

  const handleRestoreData = (restored: {
    entries?: DiaryEntry[];
    books?: BookProject[];
    settings?: AppSettings;
  }) => {
    if (restored.entries) setEntries(restored.entries);
    if (restored.books) setBooks(restored.books);
    if (restored.settings) setSettings(restored.settings);
  };

  const currentMode =
    activeView === 'booksGallery' || activeView === 'bookStudio'
      ? 'books'
      : 'diary';

  return (
    <AndroidContainer theme={settings.theme} customTheme={settings.customTheme}>
      {/* Reminder Floating Banner */}
      {activeNotification && (
        <NotificationBanner
          notification={activeNotification}
          onOpen={(entry) => {
            setSelectedEntry(entry);
            setActiveView('diary');
            setActiveNotification(null);
          }}
          onDismiss={() => setActiveNotification(null)}
        />
      )}

      {/* Passcode Lock Overlay if locked */}
      {isLocked && settings.security.isPasscodeEnabled ? (
        <PasscodeLockOverlay
          passcodeHash={settings.security.passcodeHash}
          salt={settings.security.salt}
          biometricsEnabled={settings.security.biometricsEnabled}
          masterKeyHash={settings.security.masterKeyHash}
          onUnlock={() => setIsLocked(false)}
          onResetPasscode={() => {
            setIsLocked(false);
            setIsSettingsDrawerOpen(true);
          }}
        />
      ) : (
        /* Main Application Router */
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
          {/* DIARY HOMEPAGE (Telegram Feed) */}
          {activeView === 'feed' && (
            <TelegramFeed
              entries={entries}
              folders={folders}
              activeFolderId={activeFolderId}
              settings={settings}
              onSelectEntry={(entry) => {
                setSelectedEntry(entry);
                setActiveView('diary');
              }}
              onCreateNewEntry={() => {
                setSelectedEntry(null);
                setActiveView('diary');
              }}
              onLockApp={() => setIsLocked(true)}
              onOpenSettings={() => setIsSettingsDrawerOpen(true)}
              onTogglePin={handleTogglePin}
              onDeleteEntry={handleDeleteDiary}
              onDuplicateEntry={handleDuplicateDiary}
              onChangeFolder={setActiveFolderId}
              onAddFolder={handleAddFolder}
            />
          )}

          {/* DIARY CANVAS */}
          {activeView === 'diary' && (
            <DiaryCanvas
              entry={selectedEntry}
              folders={folders}
              currentFolderId={activeFolderId}
              settings={settings}
              onSave={handleSaveDiary}
              onBack={() => {
                setActiveView('feed');
                setSelectedEntry(null);
              }}
            />
          )}

          {/* BOOKS HOMEPAGE (2x2 Grid) */}
          {activeView === 'booksGallery' && (
            <BooksGallery
              books={books}
              settings={settings}
              onSelectBook={(book) => {
                setSelectedBook(book);
                setActiveView('bookStudio');
              }}
              onCreateBook={handleSaveBook}
              onDeleteBook={handleDeleteBook}
              onDuplicateBook={handleDuplicateBook}
              onUpdateBook={handleSaveBook}
              onLockApp={() => setIsLocked(true)}
              onOpenSettings={() => setIsSettingsDrawerOpen(true)}
            />
          )}

          {/* BOOKS WRITING STUDIO CANVAS */}
          {activeView === 'bookStudio' && selectedBook && (
            <BookStudio
              book={selectedBook}
              settings={settings}
              onSaveBook={handleSaveBook}
              onBack={() => {
                setActiveView('booksGallery');
                setSelectedBook(null);
              }}
            />
          )}

          {/* SLIDING HAMBURGER SETTINGS DRAWER (Requirements #5 & #6) */}
          {isSettingsDrawerOpen && (
            <SettingsModal
              settings={settings}
              storageBreakdown={storageBreakdown}
              entries={entries}
              books={books}
              currentMode={currentMode}
              onSwitchMode={(newMode) => {
                if (newMode === 'books') {
                  setActiveView('booksGallery');
                } else {
                  setActiveView('feed');
                }
              }}
              onUpdateSettings={setSettings}
              onRestoreData={handleRestoreData}
              onClose={() => setIsSettingsDrawerOpen(false)}
            />
          )}
        </div>
      )}
    </AndroidContainer>
  );
}
