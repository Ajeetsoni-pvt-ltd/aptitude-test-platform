// src/components/ui/ThemeToggle.tsx
import { useThemeStore } from '@/store/themeStore';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Global Theme Toggle Component
 * Provides Light/Dark mode switching with smooth transitions
 * Self-theming: adapts its own appearance to the current theme
 */
export default function ThemeToggle({ className, size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isLight = theme === 'light';

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const buttonSize = size === 'sm' ? 'h-9 px-2' : size === 'lg' ? 'h-11 px-3' : 'h-10 px-2.5';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg border flex items-center gap-2',
        'transition-all duration-300 ease-out',
        // Dark mode: white-transparent styles
        !isLight && [
          'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20',
          'bg-white/[0.02] hover:bg-white/[0.05]',
        ],
        // Light mode: dark-transparent styles — explicit, doesn't rely on CSS overrides
        isLight && [
          'border-black/10 text-slate-500 hover:text-slate-800 hover:border-black/20',
          'bg-black/[0.04] hover:bg-black/[0.07]',
        ],
        buttonSize,
        className
      )}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      {isLight ? (
        <>
          <Moon size={iconSize} className="transition-transform duration-300" />
          {showLabel && <span className="text-sm font-inter">Dark</span>}
        </>
      ) : (
        <>
          <Sun size={iconSize} className="transition-transform duration-300" />
          {showLabel && <span className="text-sm font-inter">Light</span>}
        </>
      )}
    </button>
  );
}
