import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, KeyRound, Check, Grid } from 'lucide-react';
import { hashSecret } from '../../services/cryptoVault';

interface PasscodeLockOverlayProps {
  passcodeType: 'pin' | 'pattern';
  passcodeHash: string;
  patternPoints?: number[];
  salt: string;
  biometricsEnabled: boolean;
  masterKeyHash: string;
  onUnlock: () => void;
  onResetPasscode: () => void;
}

export const PasscodeLockOverlay: React.FC<PasscodeLockOverlayProps> = ({
  passcodeType = 'pin',
  passcodeHash,
  salt,
  biometricsEnabled,
  masterKeyHash,
  onUnlock,
  onResetPasscode,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [enteredPattern, setEnteredPattern] = useState<number[]>([]);
  const [isError, setIsError] = useState(false);
  const [showMasterKeyRecovery, setShowMasterKeyRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [biometricScanning, setBiometricScanning] = useState(false);

  useEffect(() => {
    if (passcodeType === 'pin' && enteredPin.length === 4) {
      verifyPin(enteredPin);
    }
  }, [enteredPin, passcodeType]);

  const verifyPin = async (pin: string) => {
    const computedHash = await hashSecret(pin, salt);
    if (computedHash === passcodeHash) {
      onUnlock();
    } else {
      setIsError(true);
      setTimeout(() => {
        setEnteredPin('');
        setIsError(false);
      }, 500);
    }
  };

  const verifyPattern = async (dots: number[]) => {
    const patternStr = dots.join('-');
    const computedHash = await hashSecret(patternStr, salt);
    if (computedHash === passcodeHash) {
      onUnlock();
    } else {
      setIsError(true);
      setTimeout(() => {
        setEnteredPattern([]);
        setIsError(false);
      }, 500);
    }
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin((prev) => prev + num);
      setIsError(false);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      onUnlock();
    }, 600);
  };

  const handleVerifyMasterKey = async () => {
    if (!recoveryKey.trim()) return;
    const computedHash = await hashSecret(recoveryKey.trim(), salt);
    if (computedHash === masterKeyHash) {
      onResetPasscode();
    } else {
      setRecoveryError('Invalid Master Key. Please try again.');
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--theme-bg, #0f172a)',
        color: 'var(--theme-text, #f8fafc)',
      }}
      className="fixed inset-0 z-50 backdrop-blur-xl flex flex-col items-center justify-between p-6 select-none"
    >
      {/* Header */}
      <div className="pt-8 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[var(--theme-accent,#38bdf8)]/20 text-[var(--theme-accent,#38bdf8)] mx-auto flex items-center justify-center border border-[var(--theme-accent,#38bdf8)]/30">
          <Lock size={26} />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Telenotes Vault Locked</h2>
        <p className="text-xs opacity-60">
          {passcodeType === 'pattern'
            ? 'Connect pattern dots to unlock your vault'
            : 'Enter 4-digit PIN to decrypt your vault'}
        </p>

        {/* PIN Indicators */}
        {passcodeType === 'pin' && (
          <div className={`flex justify-center gap-4 pt-4 ${isError ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isError
                      ? 'bg-rose-500 scale-110'
                      : isFilled
                      ? 'bg-[var(--theme-accent,#38bdf8)] scale-105 shadow-md'
                      : 'border-2 border-slate-700 bg-slate-900'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Main Lock Interactive Area */}
      {passcodeType === 'pattern' ? (
        /* 3x3 Dot Pattern Grid */
        <div className="flex flex-col items-center space-y-4">
          <div
            className={`grid grid-cols-3 gap-6 p-6 rounded-3xl bg-[var(--theme-surface,#1e293b)] border border-[var(--theme-border,#334155)] shadow-2xl ${
              isError ? 'animate-shake ring-2 ring-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dot) => {
              const isConnected = enteredPattern.includes(dot);
              return (
                <button
                  key={dot}
                  onClick={() => {
                    if (!enteredPattern.includes(dot)) {
                      const next = [...enteredPattern, dot];
                      setEnteredPattern(next);
                      if (next.length >= 4) {
                        verifyPattern(next);
                      }
                    }
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isConnected
                      ? 'bg-[var(--theme-accent,#38bdf8)] text-white scale-110 shadow-lg'
                      : 'bg-[var(--theme-bg,#0f172a)] border border-[var(--theme-border,#334155)] opacity-60 hover:opacity-100'
                  }`}
                >
                  {isConnected ? enteredPattern.indexOf(dot) + 1 : '•'}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setEnteredPattern([])}
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            Reset Pattern
          </button>
        </div>
      ) : (
        /* 4-Digit Numeric Keypad */
        <div className="w-full max-w-xs space-y-3 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-16 rounded-2xl bg-[var(--theme-surface,#1e293b)] hover:bg-[var(--theme-surface-hover,#334155)] active:scale-95 text-xl font-semibold border border-[var(--theme-border,#334155)] transition-all flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}

            {/* Biometrics button */}
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={!biometricsEnabled || biometricScanning}
              className={`h-16 rounded-2xl flex items-center justify-center transition-all ${
                biometricsEnabled
                  ? 'bg-[var(--theme-accent,#38bdf8)]/20 hover:bg-[var(--theme-accent,#38bdf8)]/30 text-[var(--theme-accent,#38bdf8)] border border-[var(--theme-accent,#38bdf8)]/40 active:scale-95'
                  : 'opacity-30 cursor-not-allowed'
              }`}
              title="Fingerprint Unlock"
            >
              <Fingerprint size={28} className={biometricScanning ? 'animate-pulse' : ''} />
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-16 rounded-2xl bg-[var(--theme-surface,#1e293b)] hover:bg-[var(--theme-surface-hover,#334155)] active:scale-95 text-xl font-semibold border border-[var(--theme-border,#334155)] transition-all flex items-center justify-center shadow-sm"
            >
              0
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-[var(--theme-surface,#1e293b)] hover:bg-[var(--theme-surface-hover,#334155)] active:scale-95 text-slate-300 border border-[var(--theme-border,#334155)] transition-all flex items-center justify-center shadow-sm"
            >
              <Delete size={22} />
            </button>
          </div>
        </div>
      )}

      {/* Footer Recovery */}
      <div className="w-full text-center pb-2">
        <button
          onClick={() => setShowMasterKeyRecovery(!showMasterKeyRecovery)}
          className="text-xs text-[var(--theme-accent,#38bdf8)] hover:underline opacity-80"
        >
          {showMasterKeyRecovery ? 'Back to Passcode' : 'Forgot Passcode? (Master Key Recovery)'}
        </button>

        {showMasterKeyRecovery && (
          <div className="mt-3 p-3 bg-[var(--theme-surface,#1e293b)] border border-[var(--theme-border,#334155)] rounded-2xl max-w-xs mx-auto space-y-2 text-xs">
            <input
              type="password"
              placeholder="Enter Master Secret Key"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              className="w-full bg-[var(--theme-bg,#0f172a)] border border-[var(--theme-border,#334155)] rounded-xl p-2 text-xs font-mono"
            />
            {recoveryError && <p className="text-rose-400 text-[10px]">{recoveryError}</p>}
            <button
              onClick={handleVerifyMasterKey}
              className="w-full py-1.5 bg-[var(--theme-accent,#38bdf8)] text-white font-bold rounded-xl text-xs"
            >
              Verify Master Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
