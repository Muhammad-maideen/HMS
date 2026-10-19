import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleBtn({ size = 'md', className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (size === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-9 h-9 rounded-xl bg-white dark:bg-neutral-800/90 border border-neutral-200/90 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-neutral-700" />
        )}
      </button>
    );
  }

  if (size === 'sm') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-1 rounded-md text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-all flex items-center gap-1 text-[10px] font-semibold ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="hidden sm:inline">Light</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Dark</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-black dark:hover:border-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-neutral-700" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
