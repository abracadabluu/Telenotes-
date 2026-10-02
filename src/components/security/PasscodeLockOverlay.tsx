import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, ShieldAlert, KeyRound, Check } from 'lucide-react';
import { hashSecret } from '../../services/cryptoVault';

interface PasscodeLockOverlayProps {
  passcodeHash: string;
  salt: string;
  biometricsEnabled: boolean;
  masterKeyHash: string;
  onUnlock: () => void;
  onResetPasscode: () => void;
}

export const PasscodeLockOverlay: React.FC<PasscodeLockOverlayProps> = ({
  passcodeHash,
  salt,
  biometricsEnabled,
  masterKeyHash,
  onUnlock,
  onResetPasscode,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [showMasterKeyRecovery, setShowMasterKeyRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [biometricScanning, setBiometricScanning] = useState(false);

  useEffect(() => {
    if (enteredPin.length === 4) {
      verifyPin(enteredPin);
    }
  }, [enteredPin]);

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
    }, 900);
  };

  const handleVerifyMasterKey = async () => {
    if (!recoveryKey.trim()) return;
    const computedHash = await hashSecret(recoveryKey.trim(), salt);
    if (computedHash === masterKeyHash) {
      onResetPasscode();
    } else {
      setRecoveryError('Invalid Master Secret Key. Please verify and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-slate-100 flex flex-col items-center justify-between p-6 select-none">
      {/* Header */}
      <div className="pt-8 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center border border-sky-400/30">
          <Lock size={26} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Telenotes Vault Locked</h2>
        <p className="text-xs text-slate-400">
          Enter 4-digit passcode to decrypt your notes
        </p>

        {/* PIN Indicators */}
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
                    ? 'bg-sky-400 scale-105 shadow-md shadow-sky-500/40'
                    : 'border-2 border-slate-700 bg-slate-900'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-3 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-xl font-semibold text-white border border-slate-800 transition-all flex items-center justify-center shadow-sm"
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
                ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-400/30 active:scale-95'
                : 'text-slate-700 opacity-40 cursor-not-allowed'
            }`}
            title="Biometric Fingerprint Unlock"
          >
            <Fingerprint size={28} className={biometricScanning ? 'animate-pulse' : ''} />
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-xl font-semibold text-white border border-slate-800 transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all flex items-center justify-center"
            title="Backspace"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Master Key Recovery trigger */}
        <div className="text-center pt-3">
          <button
            type="button"
            onClick={() => setShowMasterKeyRecovery(true)}
            className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
          >
            Forgot PIN? Decrypt with Master Secret Key
          </button>
        </div>
      </div>

      {/* Master Secret Key Recovery Modal */}
      {showMasterKeyRecovery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <KeyRound size={20} className="text-sky-400" />
              <h3 className="text-base font-bold text-white">Restore with Secret Key</h3>
            </div>
            <p className="text-xs text-slate-400">
              Enter the Master Secret Key you saved during initial setup to unlock and reset your passcode.
            </p>

            <textarea
              value={recoveryKey}
              onChange={(e) => {
                setRecoveryKey(e.target.value);
                setRecoveryError('');
              }}
              placeholder="Enter your master secret passphrase or key..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-sky-300 font-mono h-24 outline-none focus:border-sky-500"
            />

            {recoveryError && (
              <div className="text-rose-400 text-xs font-medium">{recoveryError}</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMasterKeyRecovery(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyMasterKey}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Verify & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
