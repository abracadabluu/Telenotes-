# TeleCall: MTProto Session Logout, Android WebView API Bridge & TeleCall Rebranding Plan

This plan resolves the two major issues reported:
1. **Real MTProto Session Logout**: Terminating the Telegram session directly on Telegram official servers (`Api.auth.LogOut`) when logging out.
2. **Android WebView & Dev APK Fix**: Resolving relative `/api/...` fetch calls that return `index.html` (`Unexpected token '<'`) on Android Capacitor WebView by detecting native platforms and routing requests to the live backend server.
3. **App Name Update**: Updating the app branding and Android configuration to **TeleCall**.

---

## 1. Root Cause Analysis

### A. The "Unexpected token '<', '<html> <he'..." error in Android APK
- In Capacitor Android APK, files are loaded from `http://localhost/` or `capacitor://localhost/`.
- When the frontend does `fetch('/api/telegram/send-code')`, the local Android asset server catches the request and falls back to serving `index.html` (SPA fallback).
- When `res.json()` attempts to parse the HTML page, it throws: `Unexpected token '<', "<html> <he"... is not valid JSON`.
- **Fix**: Create a centralized `getApiBaseUrl()` utility:
  - If running in native Capacitor (`Capacitor.isNativePlatform()` or hostname is `localhost` without port 3000), route calls to the live cloud server URL (`https://ais-dev-jerx2loq5b76kwmk4eyf3m-80533556186.asia-southeast1.run.app`).
  - Provide a quick server URL setting in the app so the developer can also point to any custom self-hosted server if needed.

### B. Telegram Session remaining active on Logout
- Previously, `logoutTelegram()` only cleared `localStorage`.
- Because GramJS `auth.signIn` registers a real session in Telegram DC, Telegram keeps the session active in the user's "Active Sessions" list.
- **Fix**:
  - Add backend endpoint `POST /api/telegram/logout` that calls `client.invoke(new Api.auth.LogOut())`.
  - When the user taps "Log out" in the app, it calls this endpoint, immediately terminating the Singapore session on Telegram's official servers.

### C. Developer Warning Banner Fix
- The banner `"Developer Setup Required..."` showed because `/api/telegram/status` was failing inside the APK with the HTML parsing error.
- Once the API URL is routed to the live server, `/api/telegram/status` correctly returns `{ isConfigured: true }`, automatically hiding the banner.

---

## 2. Proposed Changes

### A. Backend MTProto Logout Endpoint (`server/telegramService.ts` & `server.ts`)
- Implement `logoutTelegramUser(sessionString)`:
  - Connects client with session string.
  - Calls `await client.invoke(new Api.auth.LogOut())`.
  - Removes from active clients map.
- Mount `POST /api/telegram/logout` in `server.ts`.

### B. Centralized API Base URL Resolver (`src/services/apiConfig.ts`)
- Detects whether the app is running in browser preview or Android Capacitor WebView.
- In Capacitor APK, routes all `/api/...` calls to the live server domain (`https://ais-dev-jerx2loq5b76kwmk4eyf3m-80533556186.asia-southeast1.run.app`).
- Allows local override if the user is running `server.ts` on their own local IP / port.

### C. Frontend Auth & Logout Integration (`src/services/telegramAuth.ts`)
- Update all `fetch()` calls to use `getApiUrl(path)`.
- Update `logoutTelegram()` to asynchronously call `/api/telegram/logout` before clearing `localStorage`.

### D. TeleCall Branding & Android Configuration
- Update Header, Sidebar, Login Modal, and Page Title to **TeleCall**.
- Update `android/app/src/main/res/values/strings.xml` to `app_name = "TeleCall"`.
- Re-sync Capacitor and package updated `telenotes-source-code.zip`.

---

## 3. Verification & Testing Plan
1. **API URL Resolution**: Confirm `getApiUrl('/api/telegram/status')` returns full URL when running in Android WebView.
2. **Logout Endpoint Test**: Test `POST /api/telegram/logout` with valid session string and verify session termination.
3. **TypeScript & Build**: Run `lint_applet` and `compile_applet`.
4. **Android Sync**: Run `npx cap sync android` and generate fresh clean APK project zip.
