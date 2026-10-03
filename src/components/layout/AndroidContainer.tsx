import React from 'react';
import { ThemeId } from '../../types';

interface AndroidContainerProps {
  children: React.ReactNode;
  theme: ThemeId;
  customTheme?: {
    accentColor: string;
    bgColor: string;
    surfaceColor: string;
  };
}

export const AndroidContainer: React.FC<AndroidContainerProps> = ({
  children,
  theme,
  customTheme,
}) => {
  // Theme-specific styling classes
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'telegram-dark':
        return 'bg-[#0f172a] text-slate-100';
      case 'midnight-onyx':
        return 'bg-[#020617] text-slate-100';
      case 'emerald-forest':
        return 'bg-[#064e3b] text-emerald-100';
      case 'cyberpunk-violet':
        return 'bg-[#1e1b4b] text-purple-100';
      case 'sepia-paper':
        return 'bg-[#fef3c7] text-[#78350f]';
      case 'minimal-light':
        return 'bg-[#f8fafc] text-slate-900';
      case 'custom':
        return 'text-slate-100';
      default:
        return 'bg-[#0f172a] text-slate-100';
    }
  };

  const customStyle: React.CSSProperties =
    theme === 'custom' && customTheme
      ? {
          backgroundColor: customTheme.bgColor,
          color: '#f8fafc',
        }
      : {};

  return (
    <div
      style={customStyle}
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden select-none antialiased ${getThemeWrapperClass()} pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]`}
    >
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
