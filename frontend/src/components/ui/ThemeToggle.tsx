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
 * Shows current theme with icon and optional label
 */
export default function ThemeToggle({ className, size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  const buttonSize = size === 'sm' ? 'h-9 px-2' : size === 'lg' ? 'h-11 px-3' : 'h-10 px-2.5';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg border border-white/10 flex items-center gap-2',
        'text-white/50 hover:text-white/80 hover:border-white/20',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        'transition-all duration-300 ease-out',
        buttonSize,
        className
      )}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={iconSize} className="transition-transform duration-300" />
          {showLabel && <span className="text-sm font-inter">Light</span>}
        </>
      ) : (
        <>
          <Moon size={iconSize} className="transition-transform duration-300" />
          {showLabel && <span className="text-sm font-inter">Dark</span>}
        </>
      )}
    </button>
  );
}
