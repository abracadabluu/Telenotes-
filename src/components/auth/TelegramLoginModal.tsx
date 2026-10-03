import React, { useState, useEffect } from 'react';
import {
  Phone,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Server,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { TelegramUser } from '../../types';
import {
  sendTelegramCode,
  verifyTelegramCode,
  checkTelegramBackendStatus,
  BackendStatus,
  saveAuthUser,
} from '../../services/telegramAuth';

interface TelegramLoginModalProps {
  isOpen: boolean;
  onSuccess: (user: TelegramUser) => void;
}

export const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkTelegramBackendStatus().then((status) => {
        setBackendStatus(status);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await sendTelegramCode(phoneNumber);
      setPhoneCodeHash(result.phoneCodeHash);
      setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await verifyTelegramCode(
        phoneNumber,
        otpCode,
        phoneCodeHash,
        password2FA || undefined
      );
      onSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SESSION_PASSWORD_NEEDED') {
        setStep('password');
        setErrorMessage('This Telegram account has Two-Step Verification (2FA) enabled. Please enter your Cloud Password.');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Invalid code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '') || '9876543210';
    const suffix = cleanedPhone.slice(-4);
    const demoUser: TelegramUser = {
      id: 'tg_' + cleanedPhone,
      username: 'user_' + suffix,
      firstName: 'Telegram User',
      lastName: `(${suffix})`,
      phone: phoneNumber.trim() || '+91 98765 43210',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanedPhone}&backgroundColor=0e1621,17212b,2b5278`,
      bio: '🎙️ Live on TeleSpaces | Voice Spaces Enthusiast',
      isVerified: true,
    };
    saveAuthUser(demoUser, 'demo_session_' + Date.now());
    onSuccess(demoUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#17212b] border border-[#242f3d] p-6 shadow-2xl text-slate-100 flex flex-col space-y-5 animate-scaleUp">
        {/* Telegram Branding Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#2b5278] flex items-center justify-center text-white shadow-lg shadow-sky-500/10">
            <svg
              className="w-9 h-9 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Log in to Telegram</h2>
          <p className="text-xs text-slate-400">
            Please confirm your country code and enter your phone number.
          </p>
        </div>

        {/* Backend Credentials Status Indicator */}
        {backendStatus && !backendStatus.isConfigured && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Server size={14} className="text-amber-400 shrink-0" />
              <span>Developer Setup Required:</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Real Telegram OTP ke liye <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">server/config.ts</code> me apna <strong className="text-white">api_id</strong> aur <strong className="text-white">api_hash</strong> insert karein.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone size={14} className="text-[#38bdf8]" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                required
                autoFocus
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm focus:outline-none focus:border-[#38bdf8] transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                We will send the verification code to Telegram on your phone.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-[#2b5278] hover:bg-[#326291] text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            {/* Quick instant sandbox button */}
            <div className="pt-2 border-t border-[#242f3d]">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-[#242f3d]/60 hover:bg-[#242f3d] text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles size={14} className="text-sky-400" />
                <span>Instant Test / Sandbox Login</span>
              </button>
            </div>
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <span className="text-xs text-slate-400">
                Code sent to <strong className="text-white">{phoneNumber}</strong>
              </span>
              <div className="pt-2">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="• • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Check Telegram Service Notifications on your other device.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="py-3 px-4 rounded-2xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 font-semibold text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || otpCode.length < 3}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm bg-[#2b5278] hover:bg-[#326291] text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* 2FA Password Step */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound size={14} className="text-amber-400" />
                <span>Two-Step Verification Password</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter your Cloud Password"
                value={password2FA}
                onChange={(e) => setPassword2FA(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#0e1621] border border-[#242f3d] text-white text-sm focus:outline-none focus:border-[#38bdf8]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="py-3 px-4 rounded-2xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 font-semibold text-xs transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !password2FA}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm bg-[#2b5278] hover:bg-[#326291] text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Unlock Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
