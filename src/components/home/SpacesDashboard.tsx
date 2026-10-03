import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Phone,
  Search,
  Users,
  Shield,
  LogOut,
  Sliders,
  Sparkles,
  ArrowRight,
  Headphones,
  Check,
  X,
  Lock,
  Mic,
  ChevronRight,
} from 'lucide-react';
import {
  TelegramUser,
  VoiceRoom,
  RoomRules,
  DirectCallSession,
} from '../../types';
import { spacesStore } from '../../services/spacesStore';
import { DEMO_TELEGRAM_CONTACTS, logoutTelegram } from '../../services/telegramAuth';

interface SpacesDashboardProps {
  currentUser: TelegramUser;
  onJoinRoom: (room: VoiceRoom) => void;
  onStartCall: (peer: TelegramUser) => void;
  onLogout: () => void;
}

export const SpacesDashboard: React.FC<SpacesDashboardProps> = ({
  currentUser,
  onJoinRoom,
  onStartCall,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'spaces' | 'calls'>('spaces');
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  // Create Space Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [spaceTitle, setSpaceTitle] = useState('');
  const [spaceTopic, setSpaceTopic] = useState('Tech & Architecture');
  const [newRoomRules, setNewRoomRules] = useState<RoomRules>({
    maxSpeakers: 10,
    allowAudienceToSpeak: true,
    muteOnJoin: true,
    requireApproval: true,
    recordingEnabled: false,
  });

  // Direct Call custom username dialer
  const [dialQuery, setDialQuery] = useState('');

  useEffect(() => {
    const unsub = spacesStore.subscribe((allRooms) => {
      setRooms(allRooms.filter((r) => r.isLive));
    });
    return () => unsub();
  }, []);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    if (!roomCodeInput.trim()) return;

    const targetRoom = spacesStore.getRoomByCode(roomCodeInput.trim());
    if (targetRoom) {
      spacesStore.joinSpace(targetRoom.id, currentUser, 'listener');
      onJoinRoom(targetRoom);
      setRoomCodeInput('');
    } else {
      setCodeError(`No active Space found with code "${roomCodeInput.trim()}". Check code or start your own!`);
    }
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceTitle.trim()) return;

    const created = spacesStore.createSpace(
      spaceTitle.trim(),
      spaceTopic,
      currentUser,
      newRoomRules
    );
    setShowCreateModal(false);
    setSpaceTitle('');
    onJoinRoom(created);
  };

  const handleDialUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialQuery.trim()) return;

    const cleanUsername = dialQuery.trim().replace(/^@/, '');
    const peer: TelegramUser = {
      id: 'tg_peer_' + cleanUsername,
      username: cleanUsername,
      firstName: cleanUsername,
      phone: '+1 555 ' + Math.floor(1000 + Math.random() * 9000),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}&backgroundColor=17212b,2b5278`,
      bio: 'Telegram User',
    };
    onStartCall(peer);
    setDialQuery('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1621] text-white overflow-hidden antialiased select-none">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#17212b] border-b border-[#242f3d] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2b5278]">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.firstName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white leading-tight">
                {currentUser.firstName}
              </h1>
              {currentUser.isVerified && (
                <span className="text-[#38bdf8] text-xs">✓</span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              @{currentUser.username}
            </span>
          </div>
        </div>

        {/* Right Corner: TeleCall Branding & Logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242f3d] text-[11px] font-bold text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span>TeleCall</span>
          </div>
          <button
            onClick={async () => {
              await logoutTelegram();
              onLogout();
            }}
            className="p-2 rounded-full bg-[#242f3d] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Log Out from Telegram"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Spaces vs Calls */}
      <div className="px-4 pt-3 pb-1 flex gap-2 shrink-0 bg-[#0e1621]">
        <button
          onClick={() => setActiveTab('spaces')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'spaces'
              ? 'bg-[#2b5278] text-white shadow-lg shadow-sky-900/20'
              : 'bg-[#17212b] text-slate-400 hover:text-white'
          }`}
        >
          <Radio size={15} />
          <span>Live Spaces ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'calls'
              ? 'bg-[#2b5278] text-white shadow-lg shadow-sky-900/20'
              : 'bg-[#17212b] text-slate-400 hover:text-white'
          }`}
        >
          <Phone size={15} />
          <span>Direct Calls</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {activeTab === 'spaces' ? (
          <>
            {/* Quick Room Code Join Bar */}
            <div className="p-4 rounded-3xl bg-[#17212b] border border-[#242f3d] shadow-lg space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Enter Room Code
              </span>
              <form onSubmit={handleJoinByCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TG-7721"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-[#2b5278] hover:bg-[#326291] text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span>Join</span>
                  <ArrowRight size={14} />
                </button>
              </form>
              {codeError && (
                <p className="text-[11px] text-rose-400 pt-1 font-medium">{codeError}</p>
              )}
            </div>

            {/* Primary Action Button: Start a Voice Space */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 px-6 rounded-3xl font-bold text-sm bg-gradient-to-r from-[#2b5278] to-[#0284c7] hover:opacity-95 text-white shadow-xl shadow-sky-600/10 flex items-center justify-between group active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Mic size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Start a Voice Space</span>
                  <span className="block text-xs text-sky-200 opacity-80">
                    Host a Twitter Spaces-style room with custom rules
                  </span>
                </div>
              </div>
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            </button>

            {/* Live Spaces List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                Active Live Spaces ({rooms.length})
              </span>

              {rooms.length === 0 ? (
                <div className="text-center py-12 p-6 rounded-3xl bg-[#17212b] border border-[#242f3d] space-y-2">
                  <Radio size={28} className="mx-auto text-slate-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-300">No active spaces</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Be the first to start a space or enter a room code above to join friends.
                  </p>
                </div>
              ) : (
                rooms.map((room) => {
                  const speakers = Object.values(room.participants).filter(
                    (p) => p.role === 'host' || p.role === 'speaker'
                  );
                  const listenerCount = Object.keys(room.participants).length;

                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        spacesStore.joinSpace(room.id, currentUser, 'listener');
                        onJoinRoom(room);
                      }}
                      className="p-4 rounded-3xl bg-[#17212b] hover:bg-[#1d2a37] border border-[#242f3d] hover:border-[#2b5278] shadow-md transition-all cursor-pointer space-y-3 group active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#242f3d] text-[#38bdf8] border border-[#2b5278] inline-block mb-1.5">
                            {room.topic}
                          </span>
                          <h3 className="text-base font-bold text-white group-hover:text-[#38bdf8] transition-colors leading-snug">
                            {room.title}
                          </h3>
                        </div>

                        <span className="text-xs font-mono font-bold px-2 py-1 rounded-xl bg-[#0e1621] text-slate-300 border border-[#242f3d]">
                          {room.code}
                        </span>
                      </div>

                      {/* Speakers Avatars Row & Stats */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {speakers.slice(0, 4).map((s) => (
                            <img
                              key={s.user.id}
                              src={s.user.avatarUrl}
                              alt={s.user.firstName}
                              className="inline-block h-7 w-7 rounded-full ring-2 ring-[#17212b] object-cover"
                            />
                          ))}
                          {speakers.length > 4 && (
                            <div className="h-7 w-7 rounded-full bg-[#242f3d] ring-2 ring-[#17212b] flex items-center justify-center text-[10px] font-bold text-slate-300">
                              +{speakers.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Users size={14} />
                          <span>{listenerCount} listening</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* DIRECT CALLS TAB */
          <div className="space-y-4">
            {/* Username Dialer */}
            <div className="p-4 rounded-3xl bg-[#17212b] border border-[#242f3d] shadow-lg space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Direct Call by Username
              </span>
              <form onSubmit={handleDialUser} className="flex gap-2">
                <input
                  type="text"
                  placeholder="@username or phone..."
                  value={dialQuery}
                  onChange={(e) => setDialQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </button>
              </form>
            </div>

            {/* Demo Contacts */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                Frequent Telegram Voice Contacts
              </span>
              <div className="space-y-2">
                {DEMO_TELEGRAM_CONTACTS.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-3xl bg-[#17212b] border border-[#242f3d] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-[#242f3d]">
                        <img
                          src={contact.avatarUrl}
                          alt={contact.firstName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-white">
                            {contact.firstName} {contact.lastName || ''}
                          </span>
                          {contact.isVerified && (
                            <span className="text-[#38bdf8] text-xs">✓</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          @{contact.username}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartCall(contact)}
                      className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all active:scale-95"
                      title="Start Voice Call"
                    >
                      <Phone size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SPACE MODAL WITH HOST RULES CONFIGURATION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#17212b] border border-[#242f3d] p-6 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#242f3d]">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-[#38bdf8]" />
                <h3 className="text-base font-bold">Start a Voice Space</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Space Title / Discussion Topic:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Tech Architecture & Telegram Bots"
                  value={spaceTitle}
                  onChange={(e) => setSpaceTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Category:
                </label>
                <select
                  value={spaceTopic}
                  onChange={(e) => setSpaceTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm focus:outline-none focus:border-[#38bdf8]"
                >
                  <option value="Tech & Architecture">Tech & Architecture</option>
                  <option value="Crypto & Web3">Crypto & Web3</option>
                  <option value="Music & Vibes">Music & Vibes</option>
                  <option value="Casual & Social">Casual & Social</option>
                  <option value="Gaming & Esports">Gaming & Esports</option>
                  <option value="Business & Startups">Business & Startups</option>
                </select>
              </div>

              {/* Host Rules Settings */}
              <div className="space-y-3 pt-2 border-t border-[#242f3d]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-400" />
                  <span>Host Rules & Stage Restrictions</span>
                </span>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-xs">
                  <span>Allow Audience to Request Mic:</span>
                  <input
                    type="checkbox"
                    checked={newRoomRules.allowAudienceToSpeak}
                    onChange={(e) =>
                      setNewRoomRules({
                        ...newRoomRules,
                        allowAudienceToSpeak: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-xs">
                  <span>Require Host Approval to Speak:</span>
                  <input
                    type="checkbox"
                    checked={newRoomRules.requireApproval}
                    onChange={(e) =>
                      setNewRoomRules({
                        ...newRoomRules,
                        requireApproval: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-xs">
                  <span>Mute on Join:</span>
                  <input
                    type="checkbox"
                    checked={newRoomRules.muteOnJoin}
                    onChange={(e) =>
                      setNewRoomRules({
                        ...newRoomRules,
                        muteOnJoin: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-xs">
                  <span>Record Space Audio:</span>
                  <input
                    type="checkbox"
                    checked={newRoomRules.recordingEnabled}
                    onChange={(e) =>
                      setNewRoomRules({
                        ...newRoomRules,
                        recordingEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-xs">
                  <span>Max Stage Speakers:</span>
                  <select
                    value={newRoomRules.maxSpeakers}
                    onChange={(e) =>
                      setNewRoomRules({
                        ...newRoomRules,
                        maxSpeakers: parseInt(e.target.value),
                      })
                    }
                    className="bg-[#17212b] border border-[#242f3d] rounded-lg px-2 py-1 text-white"
                  >
                    <option value={5}>5 Speakers</option>
                    <option value={10}>10 Speakers</option>
                    <option value={20}>20 Speakers</option>
                    <option value={50}>50 Speakers</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#2b5278] to-[#0284c7] hover:opacity-95 text-white shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Radio size={16} />
                  <span>Go Live Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
