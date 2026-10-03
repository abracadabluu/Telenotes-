import React, { useState, useEffect } from 'react';
import { TelegramUser, VoiceRoom, DirectCallSession } from './types';
import { getStoredAuthUser, saveAuthUser, logoutTelegram } from './services/telegramAuth';
import { TelegramLoginModal } from './components/auth/TelegramLoginModal';
import { SpacesDashboard } from './components/home/SpacesDashboard';
import { SpaceRoomView } from './components/spaces/SpaceRoomView';
import { DirectCallView } from './components/calls/DirectCallView';

const DEFAULT_DEMO_USER: TelegramUser = {
  id: 'tg_user_main',
  username: 'voice_creator',
  firstName: 'Pavel',
  lastName: 'Host',
  phone: '+1 (555) 019-2834',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: 'TeleSpaces Host & Community Lead',
  isVerified: true,
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TelegramUser | null>(() => {
    return getStoredAuthUser() || DEFAULT_DEMO_USER;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<DirectCallSession | null>(null);

  // Sync title & metadata
  useEffect(() => {
    document.title = 'TeleCall - High-Fidelity Telegram Voice Spaces & Calling';
  }, []);

  const handleLoginSuccess = (user: TelegramUser) => {
    saveAuthUser(user);
    setCurrentUser(user);
    setIsLoginModalOpen(false);
  };

  const handleStartCall = (peer: TelegramUser) => {
    if (!currentUser) return;
    const session: DirectCallSession = {
      callId: 'call_' + Date.now(),
      peerUser: peer,
      isIncoming: false,
      status: 'calling',
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
    };
    setActiveCallSession(session);
  };

  const handleEndCall = () => {
    setActiveCallSession(null);
  };

  const handleLogout = async () => {
    await logoutTelegram();
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0e1621] text-white flex flex-col overflow-hidden antialiased select-none pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]">
      {/* Active Twitter Spaces View */}
      {activeRoom && currentUser ? (
        <SpaceRoomView
          room={activeRoom}
          currentUser={currentUser}
          onLeave={() => setActiveRoom(null)}
        />
      ) : activeCallSession && currentUser ? (
        /* Active Direct 1-on-1 Call View */
        <DirectCallView
          session={activeCallSession}
          currentUser={currentUser}
          onEndCall={handleEndCall}
        />
      ) : currentUser ? (
        /* Main TeleSpaces Home Dashboard */
        <SpacesDashboard
          currentUser={currentUser}
          onJoinRoom={(room) => setActiveRoom(room)}
          onStartCall={handleStartCall}
          onLogout={handleLogout}
        />
      ) : (
        /* Unauthenticated Splash */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#2b5278] flex items-center justify-center text-white shadow-2xl">
            <svg
              className="w-11 h-11 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">TeleCall</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Official Telegram Voice Calling & Voice Spaces Client.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="py-3 px-8 rounded-2xl bg-[#2b5278] hover:bg-[#326291] font-bold text-sm shadow-xl text-white"
          >
            Log in with Phone Number
          </button>
        </div>
      )}

      {/* Telegram Phone + OTP Login Modal */}
      <TelegramLoginModal
        isOpen={isLoginModalOpen}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
