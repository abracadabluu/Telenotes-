import { VoiceRoom, TelegramUser, SpaceParticipant, RoomRules, FloatingReaction, ParticipantRole } from '../types';

const STORAGE_KEY_SPACES = 'telespaces_active_rooms';
const BROADCAST_CHANNEL_NAME = 'telespaces_sync_channel';

// Default starter public spaces for instant live experience
const INITIAL_DEMO_SPACES: VoiceRoom[] = [
  {
    id: 'space_demo_1',
    code: 'TG-7721',
    title: '🚀 Telegram Builders & Bot Developers Meetup',
    topic: 'Tech & Architecture',
    hostId: 'tg_contact_3',
    hostUser: {
      id: 'tg_contact_3',
      username: 'dev_pavel',
      firstName: 'Pavel',
      lastName: 'D.',
      phone: '+971 50 123 4567',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Freedom & Privacy First 🚀',
      isVerified: true,
    },
    createdAt: Date.now() - 1000 * 60 * 25,
    isLive: true,
    rules: {
      maxSpeakers: 10,
      allowAudienceToSpeak: true,
      muteOnJoin: true,
      requireApproval: true,
      recordingEnabled: true,
    },
    participants: {
      tg_contact_3: {
        user: {
          id: 'tg_contact_3',
          username: 'dev_pavel',
          firstName: 'Pavel',
          lastName: 'D.',
          phone: '+971 50 123 4567',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          bio: 'Freedom & Privacy First 🚀',
          isVerified: true,
        },
        role: 'host',
        isMuted: false,
        isSpeaking: true,
        audioLevel: 45,
        hasRaisedHand: false,
        joinedAt: Date.now() - 1000 * 60 * 25,
      },
      tg_contact_1: {
        user: {
          id: 'tg_contact_1',
          username: 'alex_voice',
          firstName: 'Alex',
          lastName: 'V.',
          phone: '+1 (555) 234-5678',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: 'Host of Crypto & Tech Spaces | Always open to chat',
          isVerified: true,
        },
        role: 'speaker',
        isMuted: true,
        isSpeaking: false,
        audioLevel: 0,
        hasRaisedHand: false,
        joinedAt: Date.now() - 1000 * 60 * 18,
      },
      tg_contact_2: {
        user: {
          id: 'tg_contact_2',
          username: 'sarah_spaces',
          firstName: 'Sarah',
          lastName: 'Connor',
          phone: '+44 7911 123456',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          bio: 'Audio Producer & Podcaster 🎙️',
          isVerified: false,
        },
        role: 'listener',
        isMuted: true,
        isSpeaking: false,
        audioLevel: 0,
        hasRaisedHand: true,
        joinedAt: Date.now() - 1000 * 60 * 10,
      },
    },
    handRaiseQueue: ['tg_contact_2'],
    isRecording: true,
  },
  {
    id: 'space_demo_2',
    code: 'VC-4890',
    title: '🎵 Late Night Ambient Music & Casual Chill Chat',
    topic: 'Music & Vibes',
    hostId: 'tg_contact_1',
    hostUser: {
      id: 'tg_contact_1',
      username: 'alex_voice',
      firstName: 'Alex',
      lastName: 'V.',
      phone: '+1 (555) 234-5678',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Host of Crypto & Tech Spaces | Always open to chat',
      isVerified: true,
    },
    createdAt: Date.now() - 1000 * 60 * 45,
    isLive: true,
    rules: {
      maxSpeakers: 6,
      allowAudienceToSpeak: true,
      muteOnJoin: false,
      requireApproval: false,
      recordingEnabled: false,
    },
    participants: {
      tg_contact_1: {
        user: {
          id: 'tg_contact_1',
          username: 'alex_voice',
          firstName: 'Alex',
          lastName: 'V.',
          phone: '+1 (555) 234-5678',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: 'Host of Crypto & Tech Spaces | Always open to chat',
          isVerified: true,
        },
        role: 'host',
        isMuted: false,
        isSpeaking: false,
        audioLevel: 0,
        hasRaisedHand: false,
        joinedAt: Date.now() - 1000 * 60 * 45,
      },
    },
    handRaiseQueue: [],
  },
];

class SpacesStore {
  private static instance: SpacesStore;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(rooms: VoiceRoom[]) => void> = new Set();
  private reactionListeners: Set<(reaction: FloatingReaction) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'ROOMS_UPDATE') {
            this.notifyListeners();
          } else if (event.data?.type === 'REACTION_EVENT') {
            this.reactionListeners.forEach((cb) => cb(event.data.reaction));
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  public static getInstance(): SpacesStore {
    if (!SpacesStore.instance) {
      SpacesStore.instance = new SpacesStore();
    }
    return SpacesStore.instance;
  }

  public getAllRooms(): VoiceRoom[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SPACES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    }
    // Initialize defaults
    localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(INITIAL_DEMO_SPACES));
    return INITIAL_DEMO_SPACES;
  }

  public getRoomByCode(code: string): VoiceRoom | null {
    const cleanCode = code.trim().toUpperCase();
    const rooms = this.getAllRooms();
    return rooms.find((r) => r.code.toUpperCase() === cleanCode && r.isLive) || null;
  }

  public getRoomById(roomId: string): VoiceRoom | null {
    const rooms = this.getAllRooms();
    return rooms.find((r) => r.id === roomId && r.isLive) || null;
  }

  public saveRooms(rooms: VoiceRoom[]): void {
    localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(rooms));
    this.notifyListeners();
    this.channel?.postMessage({ type: 'ROOMS_UPDATE' });
  }

  public createSpace(
    title: string,
    topic: string,
    hostUser: TelegramUser,
    rules: RoomRules
  ): VoiceRoom {
    const rooms = this.getAllRooms();
    
    // Generate unique 6-character room code (e.g. TG-3942)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = topic.slice(0, 2).toUpperCase() || 'TG';
    const code = `${prefix}-${randomNum}`;

    const hostParticipant: SpaceParticipant = {
      user: hostUser,
      role: 'host',
      isMuted: false,
      isSpeaking: false,
      audioLevel: 0,
      hasRaisedHand: false,
      joinedAt: Date.now(),
    };

    const newRoom: VoiceRoom = {
      id: 'space_' + Date.now(),
      code,
      title: title.trim() || 'Live Voice Space',
      topic: topic.trim() || 'General',
      hostId: hostUser.id,
      hostUser,
      createdAt: Date.now(),
      isLive: true,
      rules,
      participants: {
        [hostUser.id]: hostParticipant,
      },
      handRaiseQueue: [],
      isRecording: rules.recordingEnabled,
    };

    const updated = [newRoom, ...rooms];
    this.saveRooms(updated);
    return newRoom;
  }

  public joinSpace(roomId: string, user: TelegramUser, preferredRole?: ParticipantRole): VoiceRoom | null {
    const rooms = this.getAllRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId && r.isLive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
    const isHost = room.hostId === user.id;
    const defaultRole: ParticipantRole = isHost ? 'host' : (preferredRole || 'listener');

    const participant: SpaceParticipant = {
      user,
      role: defaultRole,
      isMuted: defaultRole === 'listener' ? true : room.rules.muteOnJoin,
      isSpeaking: false,
      audioLevel: 0,
      hasRaisedHand: false,
      joinedAt: Date.now(),
    };

    room.participants[user.id] = participant;
    rooms[roomIndex] = { ...room };
    this.saveRooms(rooms);
    return rooms[roomIndex];
  }

  public leaveSpace(roomId: string, userId: string): void {
    const rooms = this.getAllRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1) return;

    const room = rooms[roomIndex];
    delete room.participants[userId];
    room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== userId);

    // If host leaves and no other participants remain, end room
    if (room.hostId === userId && Object.keys(room.participants).length === 0) {
      room.isLive = false;
    }

    rooms[roomIndex] = { ...room };
    this.saveRooms(rooms);
  }

  // Host Controls: Promote listener to speaker
  public promoteToSpeaker(roomId: string, targetUserId: string): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.participants[targetUserId]) return;

    room.participants[targetUserId].role = 'speaker';
    room.participants[targetUserId].hasRaisedHand = false;
    room.participants[targetUserId].isMuted = room.rules.muteOnJoin;
    room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== targetUserId);

    this.saveRooms([...rooms]);
  }

  // Host Controls: Demote speaker to listener
  public demoteToListener(roomId: string, targetUserId: string): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.participants[targetUserId]) return;

    room.participants[targetUserId].role = 'listener';
    room.participants[targetUserId].isMuted = true;
    room.participants[targetUserId].isSpeaking = false;
    room.participants[targetUserId].audioLevel = 0;

    this.saveRooms([...rooms]);
  }

  // Host Controls: Mute all speakers
  public muteAll(roomId: string): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    Object.keys(room.participants).forEach((uid) => {
      if (uid !== room.hostId) {
        room.participants[uid].isMuted = true;
        room.participants[uid].isSpeaking = false;
        room.participants[uid].audioLevel = 0;
      }
    });

    this.saveRooms([...rooms]);
  }

  // Host Controls: Update Room Rules live
  public updateRoomRules(roomId: string, newRules: RoomRules): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    room.rules = { ...newRules };
    this.saveRooms([...rooms]);
  }

  // Host Controls: End Space
  public endSpace(roomId: string): void {
    const rooms = this.getAllRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);
    if (roomIndex === -1) return;

    rooms[roomIndex].isLive = false;
    this.saveRooms(rooms);
  }

  // Listener Controls: Toggle Raise Hand
  public toggleRaiseHand(roomId: string, userId: string): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.participants[userId]) return;

    const participant = room.participants[userId];
    participant.hasRaisedHand = !participant.hasRaisedHand;

    if (participant.hasRaisedHand) {
      if (!room.handRaiseQueue.includes(userId)) {
        room.handRaiseQueue.push(userId);
      }
    } else {
      room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== userId);
    }

    this.saveRooms([...rooms]);
  }

  // Participant Controls: Toggle Mute
  public toggleMute(roomId: string, userId: string): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.participants[userId]) return;

    const participant = room.participants[userId];
    if (participant.role === 'listener') return; // listeners cannot unmute themselves

    participant.isMuted = !participant.isMuted;
    if (participant.isMuted) {
      participant.isSpeaking = false;
      participant.audioLevel = 0;
    }

    this.saveRooms([...rooms]);
  }

  // Update participant speaking level
  public updateAudioLevel(roomId: string, userId: string, level: number, isSpeaking: boolean): void {
    const rooms = this.getAllRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.participants[userId]) return;

    room.participants[userId].audioLevel = level;
    room.participants[userId].isSpeaking = isSpeaking;
    this.saveRooms([...rooms]);
  }

  // Send Floating Emoji Reaction
  public broadcastReaction(reaction: FloatingReaction): void {
    this.reactionListeners.forEach((cb) => cb(reaction));
    this.channel?.postMessage({ type: 'REACTION_EVENT', reaction });
  }

  public subscribe(callback: (rooms: VoiceRoom[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getAllRooms());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeReactions(callback: (reaction: FloatingReaction) => void): () => void {
    this.reactionListeners.add(callback);
    return () => {
      this.reactionListeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const rooms = this.getAllRooms();
    this.listeners.forEach((cb) => cb(rooms));
  }
}

export const spacesStore = SpacesStore.getInstance();
