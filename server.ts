import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  sendTelegramAuthCode,
  signInTelegramUser,
  getTelegramMe,
} from './server/telegramService.js';
import { voiceGateway } from './server/voiceGateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // --- Telegram MTProto Authentication API Routes ---

  // 1. Send Code via MTProto
  app.post('/api/telegram/send-code', async (req, res) => {
    try {
      const { phoneNumber, apiId, apiHash } = req.body;
      if (!phoneNumber || !apiId || !apiHash) {
        res.status(400).json({ error: 'Missing phoneNumber, apiId, or apiHash.' });
        return;
      }

      const result = await sendTelegramAuthCode(
        phoneNumber,
        parseInt(apiId, 10),
        apiHash
      );
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/telegram/send-code:', err.message);
      res.status(400).json({ error: err.message || 'Failed to send Telegram code.' });
    }
  });

  // 2. Sign In via MTProto
  app.post('/api/telegram/sign-in', async (req, res) => {
    try {
      const { phoneNumber, phoneCode, phoneCodeHash, apiId, apiHash, password } = req.body;
      if (!phoneNumber || !phoneCode || !phoneCodeHash || !apiId || !apiHash) {
        res.status(400).json({ error: 'Missing required sign-in parameters.' });
        return;
      }

      const result = await signInTelegramUser(
        phoneNumber,
        phoneCode,
        phoneCodeHash,
        parseInt(apiId, 10),
        apiHash,
        password
      );
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/telegram/sign-in:', err.message);
      res.status(400).json({ error: err.message || 'Failed to sign in to Telegram.' });
    }
  });

  // 3. Get Current User via MTProto Session
  app.post('/api/telegram/me', async (req, res) => {
    try {
      const { sessionString, apiId, apiHash } = req.body;
      if (!sessionString || !apiId || !apiHash) {
        res.status(400).json({ error: 'Missing sessionString, apiId, or apiHash.' });
        return;
      }

      const user = await getTelegramMe(
        sessionString,
        parseInt(apiId, 10),
        apiHash
      );
      res.json({ user });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Session expired.' });
    }
  });

  // --- Telegram Voice Spaces / Chat Rooms API Routes ---

  // List all active spaces
  app.get('/api/telegram/voice-chats', (req, res) => {
    res.json({ rooms: voiceGateway.getRooms() });
  });

  // Get space by 6-digit room code
  app.get('/api/telegram/voice-chats/code/:code', (req, res) => {
    const room = voiceGateway.getRoomByCode(req.params.code);
    if (!room) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }
    res.json({ room });
  });

  // Create new Space
  app.post('/api/telegram/voice-chats/create', (req, res) => {
    const { title, topic, hostUser, rules } = req.body;
    if (!hostUser || !hostUser.id) {
      res.status(400).json({ error: 'Invalid hostUser' });
      return;
    }
    const room = voiceGateway.createRoom(title, topic, hostUser, rules);
    res.json({ room });
  });

  // Join Space
  app.post('/api/telegram/voice-chats/join', (req, res) => {
    const { roomId, user, role } = req.body;
    const room = voiceGateway.joinRoom(roomId, user, role);
    if (!room) {
      res.status(404).json({ error: 'Space not found or ended' });
      return;
    }
    res.json({ room });
  });

  // Leave Space
  app.post('/api/telegram/voice-chats/leave', (req, res) => {
    const { roomId, userId } = req.body;
    voiceGateway.leaveRoom(roomId, userId);
    res.json({ success: true });
  });

  // Toggle Raise Hand
  app.post('/api/telegram/voice-chats/raise-hand', (req, res) => {
    const { roomId, userId } = req.body;
    const room = voiceGateway.toggleRaiseHand(roomId, userId);
    res.json({ room });
  });

  // Host Action: Promote to Speaker
  app.post('/api/telegram/voice-chats/promote', (req, res) => {
    const { roomId, targetUserId } = req.body;
    const room = voiceGateway.promoteToSpeaker(roomId, targetUserId);
    res.json({ room });
  });

  // Host Action: Update Rules
  app.post('/api/telegram/voice-chats/rules', (req, res) => {
    const { roomId, rules } = req.body;
    const room = voiceGateway.updateRules(roomId, rules);
    res.json({ room });
  });

  // --- Frontend Integration (Vite Middleware in Dev / Static in Prod) ---
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TeleSpaces Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
