import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { hashSecret, generateRandomSalt } from '../../services/cryptoVault';

interface FirstTimeSetupWizardProps {
  onComplete: (config: {
    passcodeHash: string;
    salt: string;
    masterKeyHash: string;
    masterKeyHint: string;
  }) => void;
}

const DEFAULT_SECRET_WORDS = [
  'velvet', 'quill', 'stellar', 'cipher', 'zenith', 'harbor',
  'ember', 'mosaic', 'cascade', 'whisper', 'silver', 'aurora'
];

export const FirstTimeSetupWizard: React.FC<FirstTimeSetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'masterKey' | 'pin'>('masterKey');
  const [secretKey, setSecretKey] = useState(DEFAULT_SECRET_WORDS.join('-'));
  const [copied, setCopied] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    if (pin.length !== 4) {
      setPinError('Passcode must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('Passcodes do not match');
      return;
    }

    const salt = generateRandomSalt();
    const passcodeHash = await hashSecret(pin, salt);
    const masterKeyHash = await hashSecret(secretKey.trim(), salt);

    onComplete({
      passcodeHash,
      salt,
      masterKeyHash,
      masterKeyHint: secretKey.slice(0, 8) + '...',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {step === 'masterKey' ? (
          <>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center border border-sky-400/30">
                <Key size={28} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Master Secret Key</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Telenotes encrypts all your personal diaries, books, and media locally. This secret key will decrypt and restore your vault if you reinstall or switch devices.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>YOUR PRIVATE VAULT KEY</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="hover:text-slate-200"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full bg-transparent text-sm font-mono text-sky-300 tracking-wide outline-none border-b border-slate-800 focus:border-sky-500 py-1"
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>
                Save this key safely in a password manager. Nobody—not even the app creators—can decrypt your diary without it.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setStep('pin')}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/20 active:scale-98 transition-all"
            >
              Continue to Passcode Setup
            </button>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-400/30">
                <Lock size={28} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Create 4-Digit Passcode</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Set a quick passcode to unlock your Telenotes app every day.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Enter 4-digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] font-mono text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] font-mono text-white outline-none focus:border-sky-500"
                />
              </div>

              {pinError && (
                <div className="text-rose-400 text-xs text-center font-medium">{pinError}</div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('masterKey')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 active:scale-98 transition-all"
              >
                Complete Setup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
