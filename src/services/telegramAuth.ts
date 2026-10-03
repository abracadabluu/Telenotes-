import { TelegramUser, TelegramApiConfig } from '../types';

const STORAGE_KEY_USER = 'telespaces_auth_user';
const STORAGE_KEY_API_CONFIG = 'telespaces_api_config';
const STORAGE_KEY_SESSION = 'telespaces_session_token';

// Default public API credentials (fallback if user hasn't input their own)
const DEFAULT_API_CONFIG: TelegramApiConfig = {
  apiId: '2040',
  apiHash: 'b18441a1ff607e10a989891a5462e627',
};

export const getStoredApiConfig = (): TelegramApiConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_API_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse api config', e);
  }
  return DEFAULT_API_CONFIG;
};

export const saveApiConfig = (config: TelegramApiConfig): void => {
  localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(config));
};

export const getStoredAuthUser = (): TelegramUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse auth user', e);
  }
  return null;
};

export const saveAuthUser = (user: TelegramUser): void => {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEY_SESSION, 'tg_sess_' + Date.now());
};

export const logoutTelegram = (): void => {
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_SESSION);
};

// Simulate Telegram Auth API Flow
export interface SendCodeResult {
  phoneCodeHash: string;
  timeout: number;
}

export const sendTelegramCode = async (
  phone: string,
  apiConfig?: TelegramApiConfig
): Promise<SendCodeResult> => {
  // Simulate network request to Telegram MTProto Gateway
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  if (!phone || phone.length < 7) {
    throw new Error('Please enter a valid international phone number.');
  }

  const phoneCodeHash = 'hash_' + Math.random().toString(36).substring(2, 10);
  return {
    phoneCodeHash,
    timeout: 60,
  };
};

export const verifyTelegramCode = async (
  phone: string,
  code: string,
  phoneCodeHash: string
): Promise<TelegramUser> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!code || code.trim().length < 4) {
    throw new Error('Invalid Telegram verification code.');
  }

  // Derive username and name from phone number or profile
  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  const suffix = cleanedPhone.slice(-4) || 'user';
  
  const user: TelegramUser = {
    id: 'tg_' + cleanedPhone,
    username: 'tg_' + suffix,
    firstName: 'Telegram User',
    lastName: `(${suffix})`,
    phone: phone.trim(),
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanedPhone}&backgroundColor=0e1621,17212b,2b5278`,
    bio: '🎙️ Live on TeleSpaces | Voice Chat Enthusiast',
    isVerified: true,
  };

  saveAuthUser(user);
  return user;
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
