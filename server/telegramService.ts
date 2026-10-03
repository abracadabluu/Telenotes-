import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import { TELEGRAM_CONFIG } from './config.js';

// Cache active client sessions
const activeClients: Map<string, { client: TelegramClient; session: StringSession }> = new Map();

// Helper to get or create a TelegramClient using developer credentials
export async function getOrCreateClient(
  sessionString: string = ''
): Promise<{ client: TelegramClient; session: StringSession }> {
  if (!TELEGRAM_CONFIG.isConfigured()) {
    throw new Error(
      'Developer Credentials Missing: Please insert your Telegram api_id and api_hash in server/config.ts or .env file.'
    );
  }

  const apiId = TELEGRAM_CONFIG.apiId;
  const apiHash = TELEGRAM_CONFIG.apiHash;
  const cacheKey = sessionString ? `sess_${sessionString.slice(0, 16)}` : `temp_${apiId}`;
  
  if (activeClients.has(cacheKey)) {
    const cached = activeClients.get(cacheKey)!;
    if (cached.client.connected) {
      return cached;
    }
  }

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    useWSS: false, // direct MTProto TCP in Node.js
  });

  await client.connect();
  const entry = { client, session: stringSession };
  activeClients.set(cacheKey, entry);
  return entry;
}

// Check Backend Status & Telegram MTProto Connection
export async function getTelegramBackendStatus(): Promise<{
  isConfigured: boolean;
  apiIdPreview: string;
  connectedToTelegramDC: boolean;
  message: string;
}> {
  const isConfigured = TELEGRAM_CONFIG.isConfigured();
  if (!isConfigured) {
    return {
      isConfigured: false,
      apiIdPreview: 'Not set',
      connectedToTelegramDC: false,
      message: 'Developer credentials not inserted yet. Configure server/config.ts or .env.',
    };
  }

  try {
    const { client } = await getOrCreateClient();
    return {
      isConfigured: true,
      apiIdPreview: `${TELEGRAM_CONFIG.apiId}`.slice(0, 3) + '***',
      connectedToTelegramDC: Boolean(client.connected),
      message: 'Connected to Telegram MTProto Data Centers.',
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      apiIdPreview: `${TELEGRAM_CONFIG.apiId}`.slice(0, 3) + '***',
      connectedToTelegramDC: false,
      message: err.message || 'Connecting to Telegram...',
    };
  }
}

// 1. Send Code via MTProto
export async function sendTelegramAuthCode(
  phoneNumber: string
): Promise<{ phoneCodeHash: string; timeout: number }> {
  try {
    const { client } = await getOrCreateClient();
    
    // Call official Telegram MTProto sendCode
    const result = await client.sendCode(
      {
        apiId: TELEGRAM_CONFIG.apiId,
        apiHash: TELEGRAM_CONFIG.apiHash,
      },
      phoneNumber
    );

    return {
      phoneCodeHash: result.phoneCodeHash,
      timeout: (result as any).timeout || 60,
    };
  } catch (error: any) {
    console.error('MTProto sendCode error:', error);
    throw new Error(error.errorMessage || error.message || 'Failed to send verification code from Telegram.');
  }
}

// 2. Sign In with Code & optional 2FA Password
export async function signInTelegramUser(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  password?: string
): Promise<{
  sessionString: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string;
    bio: string;
    isVerified: boolean;
  };
}> {
  try {
    const { client, session } = await getOrCreateClient();

    // Call official Telegram MTProto sign in
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );

    const sessionString = session.save();
    const me: any = await client.getMe();

    const user = {
      id: me?.id?.toString() || 'tg_' + phoneNumber.replace(/\D/g, ''),
      username: me?.username || 'user_' + phoneNumber.slice(-4),
      firstName: me?.firstName || 'Telegram User',
      lastName: me?.lastName || '',
      phone: me?.phone ? `+${me.phone}` : phoneNumber,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${me?.id || phoneNumber}&backgroundColor=0e1621,17212b,2b5278`,
      bio: me?.about || '🎙️ Live on TeleSpaces | Voice Chat Enthusiast',
      isVerified: Boolean(me?.verified),
    };

    return { sessionString, user };
  } catch (error: any) {
    console.error('MTProto signIn error:', error);

    // Handle 2FA password requirement
    if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      if (!password) {
        throw new Error('SESSION_PASSWORD_NEEDED');
      }

      const { client, session } = await getOrCreateClient();
      await (client as any).signInWithPassword(
        {
          apiId: TELEGRAM_CONFIG.apiId,
          apiHash: TELEGRAM_CONFIG.apiHash,
          password: async () => password,
        },
        {}
      );

      const sessionString = session.save();
      const me: any = await client.getMe();

      return {
        sessionString,
        user: {
          id: me?.id?.toString() || 'tg_user',
          username: me?.username || '',
          firstName: me?.firstName || 'Telegram User',
          lastName: me?.lastName || '',
          phone: me?.phone ? `+${me.phone}` : phoneNumber,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${me?.id || phoneNumber}&backgroundColor=0e1621,17212b,2b5278`,
          bio: me?.about || '',
          isVerified: Boolean(me?.verified),
        },
      };
    }

    throw new Error(error.errorMessage || error.message || 'Failed to verify code with Telegram.');
  }
}

// 3. Verify Session & Get Me
export async function getTelegramMe(sessionString: string) {
  try {
    const { client } = await getOrCreateClient(sessionString);
    const me: any = await client.getMe();
    if (!me) {
      throw new Error('Invalid or expired session');
    }

    return {
      id: me.id.toString(),
      username: me.username || '',
      firstName: me.firstName || 'Telegram User',
      lastName: me.lastName || '',
      phone: me.phone ? `+${me.phone}` : '',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${me.id}&backgroundColor=0e1621,17212b,2b5278`,
      bio: me.about || '',
      isVerified: Boolean(me.verified),
    };
  } catch (error: any) {
    console.error('MTProto getMe error:', error);
    throw new Error(error.errorMessage || error.message || 'Session expired.');
  }
}
