# TeleSpaces: Telegram Voice Spaces & Calling Client Implementation Plan

Pivoting the application from the diary studio into **TeleSpaces** — a dedicated Telegram voice client engineered exclusively for **1-on-1 Voice Calling** and **Twitter Spaces-style Group Voice Chat Rooms** accessible via unique Room Codes, with host stage moderation and participant rules.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed with the user:
> - **Full Pivot**: Drop the diary concept entirely in favor of a specialized Telegram Voice Spaces & Calling client.
> - **Authentication Flow**: Official Telegram phone number login with OTP code verification (with user-provided `api_id` and `api_hash`).
> - **Twitter Spaces Experience**: 3-tier room hierarchy (Host, Speakers, Listeners), Raise Hand queue, host-enforced room rules, live audio frequency visualizers, and room code sharing.
> - **Direct Calling**: Dedicated dialer and contact calling with full audio controls (Mute, Speaker, Device selection, Call timer).

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 TeleSpaces Client Application                │
├──────────────────────────────┬──────────────────────────────┤
│      Authentication Layer    │       Audio Engine Layer     │
│   • Phone Number Input       │   • WebRTC MediaStream Mesh  │
│   • Telegram API ID & Hash   │   • Web Audio AnalyserNode   │
│   • OTP Code Verification    │   • Active Speaker Detection │
│   • Secure Session Store     │   • Audio Waveform Canvas    │
├──────────────────────────────┼──────────────────────────────┤
│       Spaces / Voice Rooms   │       Direct Voice Calls     │
│   • Unique 6-Digit Room Code │   • 1-on-1 Dial by Username  │
│   • Host Rules Engine        │   • Outgoing / Incoming Ring │
│   • Stage & Raise-Hand Queue │   • In-Call Duration Timer   │
│   • Live Floating Reactions  │   • Proximity / Audio Output │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Proposed Changes & Implementation Steps

### A. Core Models & Type Definitions (`src/types/index.ts`)
- `TelegramUser`: ID, username, firstName, lastName, phone, avatarUrl, isVerified.
- `VoiceRoom` (Space):
  - `id`, `code` (e.g., `SPACE-8492`), `title`, `topic`, `createdAt`, `hostId`.
  - `rules`: `maxSpeakers`, `allowAudienceToSpeak`, `muteOnJoin`, `requireApproval`, `recordingEnabled`.
  - `participants`: Map of user IDs to role (`host` | `co-host` | `speaker` | `listener`), `isMuted`, `isSpeaking`, `raisedHandTimestamp`.
  - `activeReactions`: Floating emoji feedback (`❤️`, `🔥`, `👏`, `💯`, `🎉`).
- `DirectCallSession`: `callId`, `peerUser`, `status` (`calling` | `ringing` | `connected` | `ended`), `startTime`, `isMuted`, `isSpeakerOn`.

### B. Telegram Authentication & Session Service (`src/services/telegramAuth.ts`)
- Client-side Telegram MTProto / API proxy service:
  - Phone number validation and country code picker.
  - Send authentication code request (`auth.sendCode`).
  - Sign in with code (`auth.signIn`) and optional 2FA password (`auth.checkPassword`).
  - Store encrypted session string and user profile in persistent storage.
  - Pre-configure default client credentials with option for user to input their custom `api_id` and `api_hash`.

### C. Real-Time WebRTC Audio & Voice Visualizer Engine (`src/services/voiceEngine.ts`)
- Web Audio API integration:
  - `AudioContext` with `AnalyserNode` for real-time frequency analysis.
  - Active speaker voice activity detection (VAD): Highlights avatar with animated glowing rings when voice volume crosses speech threshold.
  - Waveform visualizer canvas rendering dynamic audio bars.
  - Mic control: `setMuted(boolean)`, noise suppression, echo cancellation.

### D. Twitter Spaces Voice Room (`src/components/spaces/SpaceRoomView.tsx`)
- **Stage (Top Area)**:
  - Host and Co-Hosts with golden crown badges.
  - Speakers grid with real-time waveform halos when talking.
  - Mute/Unmute toggle indicator on each speaker avatar.
- **Audience Area (Bottom Scrollable)**:
  - Listeners grid with profile pictures and names.
  - "Raised Hand" badge indicators for listeners requesting the mic.
- **Host Control Panel**:
  - Accept/Deny speaker requests.
  - "Mute All" emergency button.
  - Room rule editor (change max speakers, toggle audience speaking permissions).
  - End Space confirmation.
- **Listener Action Bar**:
  - ✋ "Raise Hand" / "Lower Hand" button.
  - Quick emoji reactions button (bursts animated floating hearts/claps across the screen).
  - Share Room Code button (copyable link & code).
  - "Leave Quietly" button.

### E. Direct 1-on-1 Voice Calling (`src/components/calls/DirectCallView.tsx`)
- Full-screen calling interface:
  - Caller/Receiver avatar with pulsating connection ripple effect.
  - Call status: "Calling...", "Ringing...", "Connected (02:45)".
  - Controls: Mute Microphone, Speaker Toggle, Keypad, End Call.

### F. Home Dashboard & Room Discovery (`src/components/home/SpacesDashboard.tsx`)
- Header: User Profile (Telegram avatar, username), Connection status, Start New Space button.
- Quick Join: Enter 6-digit Room Code to immediately enter any active voice space.
- Active Spaces Feed: List of ongoing voice rooms with live listener counts, topic tags, and "Join as Listener" button.
- Recent Direct Calls tab.
- "Create a Space" modal: Set title, select topic, configure host rules, and generate room code.

### G. Android Edge-to-Edge & Performance Integration
- Clean, dark Telegram theme (Deep obsidian `#0e1621` and `#17212b`).
- Set Capacitor settings for microphone audio recording and background audio stream preservation.

---

## 3. Verification & Testing Plan
1. **Login Flow**: Test phone number format, OTP entry simulation, and custom API ID/Hash inputs.
2. **Space Creation & Room Codes**: Create a space, verify unique 6-digit code generation, and test joining from another session or tab via code.
3. **Host Stage Moderation**:
   - Test raising hand as a listener.
   - Host approves request -> listener promotes to speaker.
   - Host mutes speaker or demotes back to listener.
4. **Audio Engine & Visualizers**: Verify microphone audio stream captures real mic input, drives waveform visualizer, and illuminates speaking rings.
5. **Direct Calls**: Test initiating a call, timer duration, mute/speaker toggles, and end call flow.
6. **Build Verification**: Run `compile_applet` and `lint_applet` to confirm 0 compilation errors.
