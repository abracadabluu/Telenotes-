# Developer Credentials Isolation & Production Telegram MTProto Backend Plan

This plan addresses moving the developer credentials (`api_id` and `api_hash`) out of the end-user login interface into server configuration (`.env` and `server/config.ts`), fixing the Telegram authentication flow, and providing a clean, authentic Telegram login experience with full backend MTProto synchronization.

---

## 1. Architectural Decisions

1. **Developer vs End-User Separation**:
   - `api_id` and `api_hash` belong exclusively to the application developer. They are stored securely in `server/config.ts` and read from environment variables (`.env`).
   - The end-user login modal will strictly ask for:
     1. **Phone Number** (with country code).
     2. **Official Telegram Verification Code (OTP)** sent by Telegram Service Notifications.
     3. (Optional) 2FA Cloud Password if the user has Two-Step Verification enabled on their Telegram account.

2. **Dedicated Credentials File**:
   - A single, dedicated configuration file: `server/config.ts` (with matching `.env.example`).
   - The user will be given the exact instructions on how to set their `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` in this file.

3. **Backend MTProto Reliability & Diagnostics**:
   - Add `/api/telegram/status` endpoint to verify if the server is successfully connected to Telegram Data Centers (DCs).
   - Return clean, actionable error messages for phone number formatting, rate limits (`FLOOD_WAIT`), or missing developer credentials.

---

## 2. Proposed Changes & Implementation Steps

### A. Developer Configuration (`server/config.ts` & `.env.example`)
- Create `server/config.ts`:
  - Reads `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from `process.env`.
  - Provides a single, clear place with prominent comments where the developer can paste their credentials.
- Create `.env.example`:
  - `TELEGRAM_API_ID=your_api_id_here`
  - `TELEGRAM_API_HASH=your_api_hash_here`
  - `PORT=3000`

### B. Clean Up Login UI (`src/components/auth/TelegramLoginModal.tsx`)
- Completely remove the custom API ID & Hash settings drawer.
- Present a sleek, authentic Telegram login UI:
  - Phone number input.
  - Telegram Service Notifications OTP input.
  - Optional 2FA password prompt (only shown if Telegram returns `SESSION_PASSWORD_NEEDED`).
  - Backend connection status indicator (shows "Connected to Telegram MTProto" or warns if API credentials are not yet inserted).

### C. Backend Engine (`server/telegramService.ts` & `server.ts`)
- Use `server/config.ts` to initialize GramJS `TelegramClient`.
- Implement `/api/telegram/status` endpoint:
  - Checks if developer credentials are configured.
  - Reports current connection status to Telegram DC (e.g., DC 2 / DC 4).
- Detailed error handling for `auth.sendCode`:
  - Handle `PHONE_NUMBER_INVALID`.
  - Handle `API_ID_INVALID` / `API_ID_PUBLISHED_FLOOD`.
  - Handle `FLOOD_WAIT_X` with friendly countdown.

### D. Client Auth Service (`src/services/telegramAuth.ts`)
- Remove client-side API ID/Hash requirements.
- Send simple `{ phoneNumber }` to `/api/telegram/send-code`.
- Send `{ phoneNumber, phoneCode, phoneCodeHash, password? }` to `/api/telegram/sign-in`.

---

## 3. Verification & Testing Plan
1. **Credentials Check**: Verify `server/config.ts` reads environment variables and defaults gracefully with actionable error messages.
2. **Status Route Check**: Call `GET /api/telegram/status` to confirm MTProto DC readiness.
3. **Login Flow Verification**:
   - Test Phone input and OTP prompt in the UI.
   - Verify that no developer credentials ever appear in frontend forms.
4. **Build & Lint Verification**: Run `lint_applet` and `compile_applet` to confirm 0 errors.
