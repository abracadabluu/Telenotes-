// WebRTC & Spaces Audio Gateway Service

export interface ServerParticipant {
  userId: string;
  userName: string;
  avatarUrl: string;
  role: 'host' | 'co-host' | 'speaker' | 'listener';
  isMuted: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  hasRaisedHand: boolean;
  joinedAt: number;
}

export interface ServerRoomRules {
  maxSpeakers: number;
  allowAudienceToSpeak: boolean;
  muteOnJoin: boolean;
  requireApproval: boolean;
  recordingEnabled: boolean;
}

export interface ServerVoiceRoom {
  id: string;
  code: string;
  title: string;
  topic: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  isLive: boolean;
  rules: ServerRoomRules;
  participants: Map<string, ServerParticipant>;
  handRaiseQueue: string[];
}

// In-memory active voice rooms
const activeRooms: Map<string, ServerVoiceRoom> = new Map();

// Seed initial active voice rooms
const defaultRoom: ServerVoiceRoom = {
  id: 'room_live_global',
  code: 'TG-7721',
  title: '🚀 Telegram Builders & MTProto Meetup',
  topic: 'Tech & Architecture',
  hostId: 'tg_pavel_lead',
  hostName: 'Pavel D.',
  createdAt: Date.now() - 1000 * 60 * 30,
  isLive: true,
  rules: {
    maxSpeakers: 10,
    allowAudienceToSpeak: true,
    muteOnJoin: true,
    requireApproval: true,
    recordingEnabled: true,
  },
  participants: new Map([
    [
      'tg_pavel_lead',
      {
        userId: 'tg_pavel_lead',
        userName: 'Pavel D.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'host',
        isMuted: false,
        isSpeaking: true,
        audioLevel: 42,
        hasRaisedHand: false,
        joinedAt: Date.now() - 1000 * 60 * 30,
      },
    ],
  ]),
  handRaiseQueue: [],
};
activeRooms.set(defaultRoom.id, defaultRoom);

export const voiceGateway = {
  getRooms() {
    return Array.from(activeRooms.values())
      .filter((r) => r.isLive)
      .map((r) => ({
        ...r,
        participants: Object.fromEntries(r.participants),
      }));
  },

  getRoomByCode(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const found = Array.from(activeRooms.values()).find(
      (r) => r.code.toUpperCase() === cleanCode && r.isLive
    );
    if (!found) return null;
    return {
      ...found,
      participants: Object.fromEntries(found.participants),
    };
  },

  createRoom(
    title: string,
    topic: string,
    hostUser: { id: string; firstName: string; avatarUrl: string },
    rules: ServerRoomRules
  ) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = topic.slice(0, 2).toUpperCase() || 'TG';
    const code = `${prefix}-${randomNum}`;
    const id = 'room_' + Date.now();

    const hostParticipant: ServerParticipant = {
      userId: hostUser.id,
      userName: hostUser.firstName,
      avatarUrl: hostUser.avatarUrl,
      role: 'host',
      isMuted: false,
      isSpeaking: false,
      audioLevel: 0,
      hasRaisedHand: false,
      joinedAt: Date.now(),
    };

    const room: ServerVoiceRoom = {
      id,
      code,
      title: title || 'Live Voice Space',
      topic: topic || 'General',
      hostId: hostUser.id,
      hostName: hostUser.firstName,
      createdAt: Date.now(),
      isLive: true,
      rules,
      participants: new Map([[hostUser.id, hostParticipant]]),
      handRaiseQueue: [],
    };

    activeRooms.set(id, room);
    return {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
  },

  joinRoom(
    roomId: string,
    user: { id: string; firstName: string; avatarUrl: string },
    role: 'speaker' | 'listener' = 'listener'
  ) {
    const room = activeRooms.get(roomId);
    if (!room || !room.isLive) return null;

    const participantRole = room.hostId === user.id ? 'host' : role;
    const participant: ServerParticipant = {
      userId: user.id,
      userName: user.firstName,
      avatarUrl: user.avatarUrl,
      role: participantRole,
      isMuted: participantRole === 'listener' ? true : room.rules.muteOnJoin,
      isSpeaking: false,
      audioLevel: 0,
      hasRaisedHand: false,
      joinedAt: Date.now(),
    };

    room.participants.set(user.id, participant);
    return {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
  },

  leaveRoom(roomId: string, userId: string) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    room.participants.delete(userId);
    room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== userId);

    if (room.hostId === userId && room.participants.size === 0) {
      room.isLive = false;
    }
  },

  toggleRaiseHand(roomId: string, userId: string) {
    const room = activeRooms.get(roomId);
    if (!room) return null;

    const p = room.participants.get(userId);
    if (!p) return null;

    p.hasRaisedHand = !p.hasRaisedHand;
    if (p.hasRaisedHand) {
      if (!room.handRaiseQueue.includes(userId)) {
        room.handRaiseQueue.push(userId);
      }
    } else {
      room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== userId);
    }

    return {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
  },

  promoteToSpeaker(roomId: string, targetUserId: string) {
    const room = activeRooms.get(roomId);
    if (!room) return null;

    const p = room.participants.get(targetUserId);
    if (p) {
      p.role = 'speaker';
      p.hasRaisedHand = false;
      p.isMuted = room.rules.muteOnJoin;
      room.handRaiseQueue = room.handRaiseQueue.filter((id) => id !== targetUserId);
    }

    return {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
  },

  updateRules(roomId: string, newRules: ServerRoomRules) {
    const room = activeRooms.get(roomId);
    if (!room) return null;
    room.rules = { ...newRules };
    return {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
  },

  endRoom(roomId: string) {
    const room = activeRooms.get(roomId);
    if (room) {
      room.isLive = false;
    }
  },
};
