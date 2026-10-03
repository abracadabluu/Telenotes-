import React, { useState, useEffect, useRef } from 'react';
import {
  DiaryEntry,
  BookProject,
  Folder,
  AppSettings,
  StorageBreakdown,
  TodoItem,
} from './types';
import { AndroidContainer } from './components/layout/AndroidContainer';
import { TelegramFeed } from './components/home/TelegramFeed';
import { DiaryCanvas } from './components/canvas/DiaryCanvas';
import { BookStudio } from './components/book/BookStudio';
import { SettingsModal } from './components/settings/SettingsModal';
import { FirstTimeSetupWizard } from './components/security/FirstTimeSetupWizard';
import { PasscodeLockOverlay } from './components/security/PasscodeLockOverlay';
import { NotificationBanner } from './components/notifications/NotificationBanner';
import { calculateStorageBreakdown } from './services/cryptoVault';

// Default initial state
const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'All Nudes', icon: '🫂', color: '#38bdf8', isSystem: true },
  { id: 'personal', name: 'Personal', icon: '🌱', color: '#10b981' },
  { id: 'ideas', name: 'Story Ideas', icon: '💡', color: '#f59e0b' },
  { id: 'work', name: 'Manuscripts', icon: '📚', color: '#6366f1' },
];

const INITIAL_SETTINGS: AppSettings = {
  theme: 'telegram-dark',
  appIcon: 'classic',
  chatListConfig: {
    previewLines: 2,
    showTimestamp: true,
    showActionButtons: true,
    compactMode: false,
  },
  security: {
    isPasscodeEnabled: true,
    passcodeHash: 'YwZ2oj0/ddlkZjawVv2jPxBetlG8JsRmKkOrUbK5f+g=', // Default PIN: 1234
    salt: 'telenotes_demo_salt_16',
    biometricsEnabled: true,
    autoLockDelayMinutes: 5,
    isSetupDone: true, // Opened ready to explore with default PIN 1234
    masterKeyHash: 'JM6O14fBpVf0SNFr6kDNOO9gOM6BA4kUY4CMnyOvizw=',
    masterKeyHint: 'velvet-quill...',
  },
  customFonts: [],
};

const STARTER_DIARIES: DiaryEntry[] = [
  {
    id: 'diary_starter_1',
    title: 'Welcome to Telenotes',
    content: `<h3>Your Encrypted Telegram-Style Diary & Book Studio</h3>
    <p>Every diary entry appears here just like a message in a private chat thread. You can customize the <strong>profile avatar</strong>, write with <em>rich typography</em>, drag animated stickers anywhere on the canvas, record voice memos, and set reminders.</p>
    <blockquote>"The scariest moment is always just before you start. After that, things can only get better." — Stephen King</blockquote>
    <p>Check out the <a href="https://telegram.org" target="_blank" style="color: #38bdf8; text-decoration: underline;">Telegram-style UI ergonomics</a> and start penning your thoughts.</p>`,
    plainText: 'Welcome to Telenotes. Every diary entry appears here just like a message in a private chat thread. You can customize the profile avatar and write with rich typography.',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    avatar: {
      type: 'emoji',
      value: '✨',
      bgColor: '#0284c7',
    },
    folderId: 'all',
    isPinned: true,
    todos: [
      { id: 't1', text: 'Customize my app theme in Settings', done: false },
      { id: 't2', text: 'Record a voice memo in Diary canvas', done: true },
      { id: 't3', text: 'Outline my novel in Book Studio', done: false },
    ],
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
    todos: [
      { id: 't2_1', text: 'Review Chapter 3 manuscript draft', done: true },
    ],
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
];

const DEFAULT_TODOS: TodoItem[] = [
  { id: 'todo_1', text: 'Customize app theme & dynamic icon', done: false },
  { id: 'todo_2', text: 'Write first encrypted diary reflection', done: false },
  { id: 'todo_3', text: 'Outline Chapter 1 in Book Studio', done: true },
];

export default function App() {
  // Persistence state
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_entries_v2');
      return saved ? JSON.parse(saved) : STARTER_DIARIES;
    } catch {
      return STARTER_DIARIES;
    }
  });

  const [books, setBooks] = useState<BookProject[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_books_v2');
      return saved ? JSON.parse(saved) : STARTER_BOOKS;
    } catch {
      return STARTER_BOOKS;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_folders_v2');
      return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
    } catch {
      return DEFAULT_FOLDERS;
    }
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem('telenotes_todos_v2');
      return saved ? JSON.parse(saved) : DEFAULT_TODOS;
    } catch {
      return DEFAULT_TODOS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('telenotes_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_SETTINGS, ...parsed, security: { ...INITIAL_SETTINGS.security, ...parsed.security, isSetupDone: true } };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // App Navigation & Active View
  const [activeView, setActiveView] = useState<'feed' | 'diary' | 'bookStudio' | 'settings'>('feed');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');

  // Security & Lock State (Default unlocked so user immediately sees their diaries!)
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
      localStorage.setItem('telenotes_entries_v2', JSON.stringify(entries));
      setStorageBreakdown(calculateStorageBreakdown(entries, books));
    } catch (e) {
      console.error(e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_books_v2', JSON.stringify(books));
      setStorageBreakdown(calculateStorageBreakdown(entries, books));
    } catch (e) {
      console.error(e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_folders_v2', JSON.stringify(folders));
    } catch (e) {
      console.error(e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('telenotes_todos_v2', JSON.stringify(todos));
    } catch (e) {
      console.error(e);
    }
  }, [todos]);

  // Activity tracking for auto-lock timer
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Auto-lock delay monitor
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
          // Trigger reminder
          setActiveNotification({
            entry,
            title: `Reminder: ${entry.reminder.title || entry.title}`,
          });

          // Mark triggered
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
  };

  // Handlers for Folders
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

  // Handlers for Todos
  const handleAddTodo = (text: string) => {
    const newTodo: TodoItem = {
      id: 'td_' + Date.now(),
      text,
      done: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Restore Data
  const handleRestoreData = (restored: {
    entries?: DiaryEntry[];
    books?: BookProject[];
    settings?: AppSettings;
  }) => {
    if (restored.entries) setEntries(restored.entries);
    if (restored.books) setBooks(restored.books);
    if (restored.settings) setSettings(restored.settings);
  };

  return (
    <AndroidContainer theme={settings.theme}>
      {/* Reminder Floating Chat Banner */}
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
            setActiveView('settings');
          }}
        />
      ) : (
        /* Main Application Router */
        <>
          {activeView === 'feed' && (
            <TelegramFeed
              entries={entries}
              folders={folders}
              activeFolderId={activeFolderId}
              settings={settings}
              todos={todos}
              onSelectEntry={(entry) => {
                setSelectedEntry(entry);
                setActiveView('diary');
              }}
              onCreateNewEntry={() => {
                setSelectedEntry(null);
                setActiveView('diary');
              }}
              onOpenBookStudio={() => setActiveView('bookStudio')}
              onLockApp={() => setIsLocked(true)}
              onOpenSettings={() => setActiveView('settings')}
              onTogglePin={handleTogglePin}
              onDeleteEntry={handleDeleteDiary}
              onChangeFolder={setActiveFolderId}
              onAddFolder={handleAddFolder}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
            />
          )}

          {activeView === 'diary' && (
            <DiaryCanvas
              entry={selectedEntry}
              folders={folders}
              currentFolderId={activeFolderId}
              onSave={handleSaveDiary}
              onBack={() => {
                setActiveView('feed');
                setSelectedEntry(null);
              }}
            />
          )}

          {activeView === 'bookStudio' && (
            <BookStudio
              books={books}
              onSaveBook={handleSaveBook}
              onDeleteBook={handleDeleteBook}
              onBack={() => setActiveView('feed')}
            />
          )}

          {activeView === 'settings' && (
            <SettingsModal
              settings={settings}
              storageBreakdown={storageBreakdown}
              entries={entries}
              books={books}
              onUpdateSettings={setSettings}
              onRestoreData={handleRestoreData}
              onClose={() => setActiveView('feed')}
            />
          )}
        </>
      )}
    </AndroidContainer>
  );
}
