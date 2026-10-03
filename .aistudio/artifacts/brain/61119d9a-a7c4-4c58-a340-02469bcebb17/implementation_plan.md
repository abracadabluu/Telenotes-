# Full-Stack Telegram MTProto & WebRTC Voice Gateway Implementation Plan

This plan details the complete full-stack backend architecture, MTProto integration (using GramJS), and WebRTC audio gateway to transform TeleSpaces from a UI prototype into an authentic, production-ready Telegram client application.

---

## 1. Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TeleSpaces Frontend (React)              │
│   • Phone Number & API ID/Hash Entry                        │
│   • Twitter Spaces Voice Room UI & Stage Moderation         │
│   • Web Audio Analyser & Real-Time Speaking Visualizer      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON & WebSockets
┌──────────────────────────────▼──────────────────────────────┐
│             TeleSpaces Full-Stack Server (server.ts)        │
│   • Express API & Vite Middleware Bridge                    │
│   • Session Manager & StringSession Cache                   │
│   • WebRTC Signaling & Voice Stream Gateway                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Binary MTProto 2.0 TCP/TLS
┌──────────────────────────────▼──────────────────────────────┐
│                 Telegram Production Data Centers            │
│   • DC 1-5 (e.g., 149.154.167.50:443)                      │
│   • auth.sendCode / auth.signIn                             │
│   • phone.createGroupCall / phone.joinGroupCall (Voice Chats)│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Proposed Changes & Implementation Steps

### A. Full-Stack Setup & Dependencies
- Install required packages:
  - `telegram` (Official GramJS MTProto 2.0 implementation in TypeScript)
  - `express`, `cors` and their dev types `@types/express`, `@types/cors`
  - `tsx` for high-performance TypeScript server execution
- Update `package.json`:
  - `"dev": "tsx server.ts"`
  - `"start": "node dist-server/server.js"` (or `tsx server.ts`)

### B. MTProto Backend Service (`server/telegramClient.ts` & `server.ts`)
- **MTProto Session Management**:
  - Instantiate `TelegramClient` with user-supplied `api_id`, `api_hash`, and persistent `StringSession`.
  - Connect to Telegram Production DCs over secure MTProto TLS.
- **Authentication Endpoints**:
  - `POST /api/telegram/send-code`: Calls `client.sendCode({ apiId, apiHash, phoneNumber })`. Returns `phoneCodeHash`.
  - `POST /api/telegram/sign-in`: Calls `client.signInUser({ apiId, apiHash, phoneCode, password })`. Returns encrypted `sessionString` and user profile (`id`, `username`, `firstName`, `avatarUrl`, `phone`).
  - `POST /api/telegram/me`: Validates session string, retrieves fresh profile data, and checks Telegram connection status.
- **Telegram Group Voice Chats (Spaces) Engine**:
  - `POST /api/telegram/voice-chats/create`: Calls `client.invoke(new Api.phone.CreateGroupCall(...))` to provision a real voice room on Telegram servers.
  - `POST /api/telegram/voice-chats/join`: Calls `client.invoke(new Api.phone.JoinGroupCall(...))` returning WebRTC payload data.
  - `POST /api/telegram/voice-chats/toggle-mute`: Enforces host mute/unmute and raise hand permissions.

### C. Live WebRTC Voice Gateway (`server/webrtcGateway.ts`)
- Provide WebRTC audio mesh signaling via WebSockets/SSE so users in the same room code can transmit and hear real microphone audio with sub-100ms latency.
- Link WebRTC participant states with Telegram MTProto user profiles.

### D. Frontend API Client (`src/services/apiClient.ts`)
- Replace mock functions with real `fetch('/api/telegram/*')` calls.
- Persist the real MTProto `sessionString` in `localStorage` so the user stays permanently logged in across app restarts.
- Show live Telegram Server Connection Status indicator (`DC 2 Connected (MTProto 2.0)`).

---

## 3. Verification & Testing Plan
1. **Dependency Verification**: Confirm `telegram` (GramJS) and `express` install cleanly.
2. **Server Launch**: Start `server.ts` on port 3000 with Vite middleware mounted.
3. **Auth Test**:
   - Send code to user's Telegram phone number via MTProto `auth.sendCode`.
   - Verify Telegram Service Notification OTP received on official Telegram app.
   - Complete `auth.signIn` and retrieve authentic user profile.
4. **Voice Space Creation**: Test creating a Space with Room Code, verify host stage rules, and test WebRTC mic stream across participants.
5. **Lint & Build**: Execute `compile_applet` and `lint_applet` to ensure zero compilation errors.
