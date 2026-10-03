import React from 'react';
import { ThemeId } from '../../types';

interface AndroidContainerProps {
  children: React.ReactNode;
  theme: ThemeId;
}

export const AndroidContainer: React.FC<AndroidContainerProps> = ({ children, theme }) => {
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
    <div className={`w-screen h-[100dvh] min-h-[100dvh] m-0 p-0 overflow-hidden relative select-none flex flex-col ${getThemeWrapperClass()}`}>
      {/* Inner App Shell - Full Edge-to-Edge Fill */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {children}
      </div>
    </div>
  );
};
