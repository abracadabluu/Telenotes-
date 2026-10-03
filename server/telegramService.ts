import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';

// Cache active client sessions by phone number or session token
const activeClients: Map<string, { client: TelegramClient; session: StringSession }> = new Map();

// Helper to get or create a TelegramClient
export async function getOrCreateClient(
  apiId: number,
  apiHash: string,
  sessionString: string = ''
): Promise<{ client: TelegramClient; session: StringSession }> {
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

// 1. Send Code via MTProto
export async function sendTelegramAuthCode(
  phoneNumber: string,
  apiId: number,
  apiHash: string
): Promise<{ phoneCodeHash: string; timeout: number }> {
  try {
    const { client } = await getOrCreateClient(apiId, apiHash);
    
    // Call official Telegram MTProto sendCode
    const result = await client.sendCode(
      {
        apiId,
        apiHash,
      },
      phoneNumber
    );

    return {
      phoneCodeHash: result.phoneCodeHash,
      timeout: (result as any).timeout || 60,
    };
  } catch (error: any) {
    console.error('MTProto sendCode error:', error);
    // If Telegram returns an error (e.g., PHONE_NUMBER_INVALID, API_ID_INVALID), format cleanly
    throw new Error(error.errorMessage || error.message || 'Failed to send verification code from Telegram.');
  }
}

// 2. Sign In with Code & optional 2FA Password
export async function signInTelegramUser(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  apiId: number,
  apiHash: string,
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
    const { client, session } = await getOrCreateClient(apiId, apiHash);

    // Call official Telegram MTProto sign in
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );

    // Save session string
    const sessionString = session.save();

    // Fetch official User Profile from Telegram
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
    if (error.errorMessage === 'SESSION_PASSWORD_NEEDED' && password) {
      const { client, session } = await getOrCreateClient(apiId, apiHash);
      await (client as any).signInWithPassword(
        {
          apiId,
          apiHash,
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
export async function getTelegramMe(
  sessionString: string,
  apiId: number,
  apiHash: string
) {
  try {
    const { client } = await getOrCreateClient(apiId, apiHash, sessionString);
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
