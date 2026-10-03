import { TelegramUser } from '../types';
import { getApiUrl } from './apiConfig';

const STORAGE_KEY_USER = 'telecall_auth_user';
const STORAGE_KEY_SESSION = 'telecall_session_token';

// Compatibility with previous storage key
const LEGACY_STORAGE_KEY_USER = 'telespaces_auth_user';
const LEGACY_STORAGE_KEY_SESSION = 'telespaces_session_token';

export const getStoredAuthUser = (): TelegramUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem(LEGACY_STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse auth user', e);
  }
  return null;
};

export const saveAuthUser = (user: TelegramUser, sessionString?: string): void => {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  if (sessionString) {
    localStorage.setItem(STORAGE_KEY_SESSION, sessionString);
  }
};

export const getStoredSessionString = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_SESSION) || localStorage.getItem(LEGACY_STORAGE_KEY_SESSION);
};

/**
 * Logout: Terminate the MTProto session on Telegram's official Data Centers
 * so that it doesn't linger in user's Telegram Active Sessions list!
 */
export const logoutTelegram = async (): Promise<void> => {
  const sessionString = getStoredSessionString();
  
  if (sessionString && !sessionString.startsWith('demo_')) {
    try {
      await fetch(getApiUrl('/api/telegram/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionString }),
      });
      console.log('Terminated Telegram official session on remote server.');
    } catch (e) {
      console.warn('Network error while terminating Telegram session:', e);
    }
  }

  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(LEGACY_STORAGE_KEY_USER);
  localStorage.removeItem(LEGACY_STORAGE_KEY_SESSION);
};

export interface SendCodeResult {
  phoneCodeHash: string;
  timeout: number;
}

export interface BackendStatus {
  isConfigured: boolean;
  apiIdPreview: string;
  connectedToTelegramDC: boolean;
  message: string;
}

// Check Backend MTProto status
export const checkTelegramBackendStatus = async (): Promise<BackendStatus> => {
  try {
    const url = getApiUrl('/api/telegram/status');
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Backend status check failed:', e);
  }
  return {
    isConfigured: false,
    apiIdPreview: 'Unavailable',
    connectedToTelegramDC: false,
    message: 'Backend server offline or unreachable.',
  };
};

// 1. Send Code via Backend MTProto
export const sendTelegramCode = async (phone: string): Promise<SendCodeResult> => {
  const url = getApiUrl('/api/telegram/send-code');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone.trim(),
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.error('Non-JSON response received from server:', text.slice(0, 150));
    throw new Error(
      'Cannot connect to Telegram backend server. Please verify backend URL or internet connection.'
    );
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send verification code from Telegram.');
  }

  return {
    phoneCodeHash: data.phoneCodeHash,
    timeout: data.timeout || 60,
  };
};

// 2. Sign In via Backend MTProto
export const verifyTelegramCode = async (
  phone: string,
  code: string,
  phoneCodeHash: string,
  password?: string
): Promise<TelegramUser> => {
  const url = getApiUrl('/api/telegram/sign-in');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone.trim(),
      phoneCode: code.trim(),
      phoneCodeHash,
      password: password?.trim() || undefined,
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Server returned invalid response. Please check your backend connection.');
  }

  const data = await res.json();
  if (!res.ok) {
    if (data.error === 'SESSION_PASSWORD_NEEDED') {
      throw new Error('SESSION_PASSWORD_NEEDED');
    }
    throw new Error(data.error || 'Invalid verification code.');
  }

  saveAuthUser(data.user, data.sessionString);
  return data.user;
};

// Demo Telegram contacts for testing voice calls
export const DEMO_TELEGRAM_CONTACTS: TelegramUser[] = [
  {
    id: 'tg_contact_1',
    username: 'alex_voice',
    firstName: 'Alex',
    lastName: 'V.',
    phone: '+1 (555) 234-5678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Host of Crypto & Tech Spaces | Always open to chat',
    isVerified: true,
  },
  {
    id: 'tg_contact_2',
    username: 'sarah_spaces',
    firstName: 'Sarah',
    lastName: 'Connor',
    phone: '+44 7911 123456',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Audio Producer & Podcaster 🎙️',
    isVerified: false,
  },
  {
    id: 'tg_contact_3',
    username: 'dev_pavel',
    firstName: 'Pavel',
    lastName: 'D.',
    phone: '+971 50 123 4567',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Freedom & Privacy First 🚀',
    isVerified: true,
  },
];
