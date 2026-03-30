// src/components/ui/HoloButton.tsx
import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type HoloVariant = 'cyan' | 'magenta' | 'violet' | 'ghost' | 'danger';
type HoloSize    = 'sm' | 'md' | 'lg' | 'xl';

interface HoloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: HoloVariant;
  size?: HoloSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<HoloVariant, string> = {
  cyan:    'btn-holo-cyan text-cyber-black',
  magenta: 'btn-holo-magenta text-white',
  violet:  'btn-holo-violet text-white',
  ghost:   'btn-ghost-neon',
  danger:  'bg-gradient-to-r from-red-800 to-rose-600 text-white border border-red-500/40 hover:shadow-[0_0_25px_rgba(255,51,102,0.5)] hover:-translate-y-0.5 transition-all duration-300',
};

const sizeStyles: Record<HoloSize, string> = {
  sm: 'px-4 py-2 text-xs rounded-lg',
  md: 'px-6 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3 text-base rounded-xl',
  xl: 'px-10 py-4 text-lg rounded-2xl',
};

const HoloButton = ({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: HoloButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 font-semibold font-inter tracking-wide',
        'transition-all duration-300 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default HoloButton;
