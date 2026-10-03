import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Hand,
  Share2,
  Crown,
  Volume2,
  VolumeX,
  X,
  Check,
  Radio,
  Users,
  Settings,
  AlertTriangle,
  Smile,
  Copy,
  CheckCheck,
  CircleDot,
  Shield,
  Sliders,
  LogOut,
} from 'lucide-react';
import {
  VoiceRoom,
  TelegramUser,
  SpaceParticipant,
  FloatingReaction,
  RoomRules,
} from '../../types';
import { spacesStore } from '../../services/spacesStore';
import { VoiceEngine } from '../../services/voiceEngine';

interface SpaceRoomViewProps {
  room: VoiceRoom;
  currentUser: TelegramUser;
  onLeave: () => void;
}

const EMOJI_REACTIONS = ['❤️', '🔥', '👏', '💯', '🚀', '😂', '🎉', '🤯'];

export const SpaceRoomView: React.FC<SpaceRoomViewProps> = ({
  room: initialRoom,
  currentUser,
  onLeave,
}) => {
  const [room, setRoom] = useState<VoiceRoom>(initialRoom);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  const [showReactionsPalette, setShowReactionsPalette] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Room rules form state for host
  const [rulesState, setRulesState] = useState<RoomRules>(initialRoom.rules);

  const voiceEngine = useRef(VoiceEngine.getInstance());
  const myParticipant = room.participants[currentUser.id];
  const isHost = room.hostId === currentUser.id;
  const isSpeaker = myParticipant?.role === 'speaker' || isHost;
  const isListener = !isSpeaker;

  // Sync room updates from store
  useEffect(() => {
    const unsubscribe = spacesStore.subscribe((rooms) => {
      const current = rooms.find((r) => r.id === initialRoom.id);
      if (current) {
        setRoom(current);
        setRulesState(current.rules);
      } else {
        // Space was ended by host
        onLeave();
      }
    });

    const unsubReactions = spacesStore.subscribeReactions((reaction) => {
      setFloatingReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3500);
    });

    return () => {
      unsubscribe();
      unsubReactions();
    };
  }, [initialRoom.id, onLeave]);

  // Handle local microphone & audio activity
  useEffect(() => {
    if (isSpeaker) {
      voiceEngine.current.startMicrophone();
      voiceEngine.current.setMuted(isMicMuted);

      const unsubAudio = voiceEngine.current.subscribeLevel((level, isSpeaking) => {
        spacesStore.updateAudioLevel(room.id, currentUser.id, level, isSpeaking);
      });

      return () => {
        unsubAudio();
        voiceEngine.current.stopMicrophone();
      };
    } else {
      voiceEngine.current.stopMicrophone();
    }
  }, [isSpeaker, isMicMuted, room.id, currentUser.id]);

  const toggleLocalMic = () => {
    if (!isSpeaker) return;
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    voiceEngine.current.setMuted(nextMuted);
    spacesStore.toggleMute(room.id, currentUser.id);
  };

  const handleToggleRaiseHand = () => {
    spacesStore.toggleRaiseHand(room.id, currentUser.id);
  };

  const handleSendReaction = (emoji: string) => {
    const reaction: FloatingReaction = {
      id: 'react_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      emoji,
      userId: currentUser.id,
      userName: currentUser.firstName,
      x: 15 + Math.random() * 70, // random horizontal offset 15% - 85%
    };
    spacesStore.broadcastReaction(reaction);
    setShowReactionsPalette(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveRules = () => {
    spacesStore.updateRoomRules(room.id, rulesState);
    setShowHostControls(false);
  };

  // Group participants by role
  const participantsList = Object.values(room.participants);
  const stageSpeakers = participantsList.filter(
    (p) => p.role === 'host' || p.role === 'co-host' || p.role === 'speaker'
  );
  const audienceListeners = participantsList.filter((p) => p.role === 'listener');

  return (
    <div className="fixed inset-0 z-40 bg-[#0e1621] text-white flex flex-col overflow-hidden antialiased select-none">
      {/* Floating Animated Emoji Particles */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-20 text-3xl animate-floatUp pointer-events-none drop-shadow-lg"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#17212b] border-b border-[#242f3d] flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold shrink-0">
            <Radio size={13} className="animate-pulse" />
            <span>LIVE</span>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate text-white leading-tight">
              {room.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
              <span className="text-[#38bdf8] font-medium">{room.topic}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                <span>{participantsList.length} listening</span>
              </span>
            </div>
          </div>
        </div>

        {/* Room Code Badge & Leave Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-xs font-mono font-bold text-[#38bdf8] border border-[#2b5278] transition-colors"
            title="Click to Copy Room Code"
          >
            <span>{room.code}</span>
            {copiedCode ? <CheckCheck size={13} /> : <Copy size={13} />}
          </button>

          {isHost && (
            <button
              onClick={() => setShowHostControls(true)}
              className="p-2 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white transition-colors relative"
              title="Host Settings & Requests"
            >
              <Settings size={18} />
              {room.handRaiseQueue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {room.handRaiseQueue.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              spacesStore.leaveSpace(room.id, currentUser.id);
              onLeave();
            }}
            className="px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition-colors"
          >
            <LogOut size={13} />
            <span>Leave quietly</span>
          </button>
        </div>
      </div>

      {/* Main Space Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-3xl mx-auto w-full">
        {/* STAGE AREA: Speakers & Host */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              <span>Speakers Stage ({stageSpeakers.length}/{room.rules.maxSpeakers})</span>
            </span>
            {room.isRecording && (
              <span className="text-[11px] text-rose-400 flex items-center gap-1 font-semibold">
                <CircleDot size={12} className="animate-pulse" />
                <span>REC</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {stageSpeakers.map((p) => {
              const isCurrentMe = p.user.id === currentUser.id;
              return (
                <div
                  key={p.user.id}
                  className="flex flex-col items-center text-center space-y-1.5 relative group"
                >
                  {/* Avatar with Animated Speaking Ring */}
                  <div className="relative">
                    <div
                      className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                        p.isSpeaking && !p.isMuted
                          ? 'border-[#38bdf8] ring-4 ring-[#38bdf8]/40 scale-105 shadow-lg shadow-sky-500/20'
                          : 'border-[#242f3d]'
                      }`}
                    >
                      <img
                        src={p.user.avatarUrl}
                        alt={p.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Role Badge (Crown for Host) */}
                    {p.role === 'host' && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                        <Crown size={13} className="fill-current" />
                      </div>
                    )}

                    {/* Mute Indicator */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md text-xs ${
                        p.isMuted ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                    >
                      {p.isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                    </div>

                    {/* Live Waveform Equalizer under Speaker */}
                    {p.isSpeaking && !p.isMuted && (
                      <div className="absolute -bottom-4 inset-x-0 flex items-center justify-center gap-0.5">
                        <span className="w-1 h-3 bg-[#38bdf8] rounded-full animate-bounce" />
                        <span className="w-1 h-5 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-2 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    )}
                  </div>

                  <div className="w-full truncate px-1">
                    <span className="text-xs font-bold text-white block truncate">
                      {p.user.firstName} {isCurrentMe && '(You)'}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize block truncate">
                      {p.role}
                    </span>
                  </div>

                  {/* Host Quick Action Dropdown */}
                  {isHost && !isCurrentMe && (
                    <button
                      onClick={() => spacesStore.demoteToListener(room.id, p.user.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#242f3d] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Move to audience
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AUDIENCE AREA: Listeners */}
        <div className="space-y-3 pt-6 border-t border-[#242f3d]">
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
            <Users size={14} />
            <span>Audience ({audienceListeners.length})</span>
          </span>

          {audienceListeners.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No audience members yet. Share code <strong className="text-[#38bdf8]">{room.code}</strong> to invite friends!
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {audienceListeners.map((p) => {
                const isCurrentMe = p.user.id === currentUser.id;
                return (
                  <div
                    key={p.user.id}
                    className="flex flex-col items-center text-center space-y-1 relative"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#242f3d]">
                        <img
                          src={p.user.avatarUrl}
                          alt={p.user.firstName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Raised Hand Badge */}
                      {p.hasRaisedHand && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs animate-bounce shadow-md">
                          ✋
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-300 truncate w-full px-1">
                      {p.user.firstName} {isCurrentMe && '(You)'}
                    </span>

                    {/* Host action: Promote */}
                    {isHost && (
                      <button
                        onClick={() => spacesStore.promoteToSpeaker(room.id, p.user.id)}
                        className="text-[10px] text-[#38bdf8] hover:underline"
                      >
                        Add speaker
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Reactions Palette Drawer */}
      {showReactionsPalette && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#17212b] border border-[#242f3d] rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl z-50 animate-scaleUp">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="text-2xl hover:scale-125 active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowReactionsPalette(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* BOTTOM ACTION TOOLBAR */}
      <div className="px-4 py-3 bg-[#17212b] border-t border-[#242f3d] flex items-center justify-between z-30 shrink-0">
        {/* Left: Mic Button (For Speakers) or Raise Hand (For Listeners) */}
        {isSpeaker ? (
          <button
            onClick={toggleLocalMic}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 ${
              isMicMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isMicMuted ? 'Muted (Tap to speak)' : 'Mic On'}</span>
          </button>
        ) : (
          <button
            onClick={handleToggleRaiseHand}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 ${
              myParticipant?.hasRaisedHand
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'bg-[#242f3d] hover:bg-[#2b394a] text-white'
            }`}
          >
            <Hand size={16} />
            <span>
              {myParticipant?.hasRaisedHand ? 'Hand Raised ✋' : 'Request to Speak ✋'}
            </span>
          </button>
        )}

        {/* Center: Emoji Reactions */}
        <button
          onClick={() => setShowReactionsPalette(!showReactionsPalette)}
          className="p-2.5 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white transition-colors"
          title="Send Reaction"
        >
          <Smile size={20} />
        </button>

        {/* Right: Share Room Code */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-xs font-bold text-[#38bdf8] transition-colors"
        >
          <Share2 size={15} />
          <span>{copiedCode ? 'Copied Link!' : 'Invite via Code'}</span>
        </button>
      </div>

      {/* HOST STAGE CONTROLS & RULES MODAL */}
      {showHostControls && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#17212b] border border-[#242f3d] p-5 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#242f3d]">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-amber-400" />
                <h3 className="text-base font-bold">Space Host Controls</h3>
              </div>
              <button
                onClick={() => setShowHostControls(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Speaker Requests Queue */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  ✋ Speaker Requests ({room.handRaiseQueue.length})
                </span>

                {room.handRaiseQueue.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-[#0e1621] rounded-2xl text-center">
                    No listeners have requested the mic yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {room.handRaiseQueue.map((uid) => {
                      const reqUser = room.participants[uid]?.user;
                      if (!reqUser) return null;
                      return (
                        <div
                          key={uid}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d]"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={reqUser.avatarUrl}
                              alt={reqUser.firstName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <span className="text-xs font-bold block">{reqUser.firstName}</span>
                              <span className="text-[10px] text-slate-400">@{reqUser.username}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => spacesStore.promoteToSpeaker(room.id, uid)}
                              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              title="Accept & Promote"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => spacesStore.toggleRaiseHand(room.id, uid)}
                              className="p-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Host Actions */}
              <div className="pt-2 border-t border-[#242f3d] space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Stage Moderation
                </span>
                <button
                  onClick={() => spacesStore.muteAll(room.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <VolumeX size={15} />
                  <span>Mute All Speakers</span>
                </button>
              </div>

              {/* Room Rules Configuration */}
              <div className="pt-2 border-t border-[#242f3d] space-y-3 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-400 block">
                  Room Rules & Permissions
                </span>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d]">
                  <span>Allow Audience to Speak:</span>
                  <input
                    type="checkbox"
                    checked={rulesState.allowAudienceToSpeak}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, allowAudienceToSpeak: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d]">
                  <span>Require Host Approval to Speak:</span>
                  <input
                    type="checkbox"
                    checked={rulesState.requireApproval}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, requireApproval: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d]">
                  <span>Mute Speakers on Entry:</span>
                  <input
                    type="checkbox"
                    checked={rulesState.muteOnJoin}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, muteOnJoin: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#38bdf8] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1621] border border-[#242f3d]">
                  <span>Max Stage Speakers:</span>
                  <select
                    value={rulesState.maxSpeakers}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, maxSpeakers: parseInt(e.target.value) })
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
            </div>

            <div className="pt-2 border-t border-[#242f3d] flex gap-2">
              <button
                onClick={() => {
                  if (confirm('End this space for everyone?')) {
                    spacesStore.endSpace(room.id);
                    onLeave();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs transition-colors"
              >
                End Space
              </button>
              <button
                onClick={handleSaveRules}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#2b5278] hover:bg-[#326291] text-white font-bold text-xs shadow-md transition-colors"
              >
                Save Room Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
