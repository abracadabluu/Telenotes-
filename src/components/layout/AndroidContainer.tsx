import React, { useState } from 'react';
import { Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { ThemeId } from '../../types';

interface AndroidContainerProps {
  children: React.ReactNode;
  theme: ThemeId;
}

export const AndroidContainer: React.FC<AndroidContainerProps> = ({ children, theme }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Theme-specific styling classes
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'telegram-dark':
        return 'bg-[#18222d] text-slate-100';
      case 'telegram-light':
        return 'bg-[#f5f6f8] text-slate-900';
      case 'amoled':
        return 'bg-black text-slate-100';
      case 'material-green':
        return 'bg-[#14251e] text-emerald-100';
      case 'sunset':
        return 'bg-[#2c1810] text-amber-100';
      case 'cyber-teal':
        return 'bg-[#0f2229] text-cyan-100';
      default:
        return 'bg-[#18222d] text-slate-100';
    }
  };

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-2 relative select-none overflow-hidden">
      {/* Viewport Switcher */}
      <div className="hidden sm:flex fixed top-2 right-2 z-50 items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-full px-2.5 py-1 shadow-lg backdrop-blur-md text-[11px] text-slate-300">
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
            !isFullscreen ? 'bg-sky-500 text-white font-semibold shadow-sm' : 'hover:text-white'
          }`}
          title="Phone Frame View"
        >
          <Smartphone size={12} />
          <span>Phone</span>
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
            isFullscreen ? 'bg-sky-500 text-white font-semibold shadow-sm' : 'hover:text-white'
          }`}
          title="Expanded View"
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span>Full</span>
        </button>
      </div>

      {/* Smartphone Chassis Container */}
      <div
        className={`transition-all duration-300 relative flex flex-col overflow-hidden ${
          isFullscreen
            ? 'w-full h-full max-w-full rounded-none border-none'
            : 'w-full sm:w-[412px] h-full sm:h-[96%] sm:max-h-[860px] sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_20px_50px_rgba(0,0,0,0.8)] sm:ring-1 sm:ring-slate-700/60'
        } ${getThemeWrapperClass()}`}
      >
        {/* Subtle camera punch-hole on top of phone */}
        {!isFullscreen && (
          <div className="hidden sm:flex absolute top-1.5 left-1/2 -translate-x-1/2 z-40 items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-black border border-slate-700/40 shadow-inner" />
          </div>
        )}

                {/* Inner App Shell */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
