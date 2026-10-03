import dotenv from 'dotenv';
dotenv.config();

/**
 * =========================================================================
 *  TELESPACES TELEGRAM DEVELOPER CREDENTIALS CONFIGURATION
 * =========================================================================
 * 
 * Aapko Telegram se mile `api_id` aur `api_hash` yahan insert karne hain.
 * 
 * Options:
 * 1. .env file me add karein:
 *    TELEGRAM_API_ID=12345678
 *    TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
 * 
 * 2. Ya fir direct neeche DEFAULT_TELEGRAM_API_ID aur DEFAULT_TELEGRAM_API_HASH me paste karein:
 */

// Yahan apna Telegram API ID dalein (numbers only)
const DEFAULT_TELEGRAM_API_ID = '';

// Yahan apna Telegram API Hash dalein (hexadecimal string)
const DEFAULT_TELEGRAM_API_HASH = '';

export const TELEGRAM_CONFIG = {
  // Read from environment variable or fallback to developer default
  apiId: process.env.TELEGRAM_API_ID
    ? parseInt(process.env.TELEGRAM_API_ID, 10)
    : DEFAULT_TELEGRAM_API_ID
    ? parseInt(DEFAULT_TELEGRAM_API_ID, 10)
    : 0,

  apiHash: process.env.TELEGRAM_API_HASH || DEFAULT_TELEGRAM_API_HASH || '',

  // Server port
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,

  // Check if real developer credentials are provided
  isConfigured(): boolean {
    return Boolean(this.apiId && this.apiId > 0 && this.apiHash && this.apiHash.length > 10);
  },
};
