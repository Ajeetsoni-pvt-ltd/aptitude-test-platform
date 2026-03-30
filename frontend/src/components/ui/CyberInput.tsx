// src/components/ui/CyberInput.tsx
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  icon?:        ReactNode;
  rightIcon?:   ReactNode;
  helperText?:  string;
}

const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, error, icon, rightIcon, helperText, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-inter font-medium text-white/50 uppercase tracking-widest">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-white/30 flex items-center pointer-events-none z-10">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            {...props}
            className={cn(
              'cyber-input w-full h-11 font-inter text-sm',
              'px-4',
              icon    && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-neon-red/50 focus:border-neon-red/70 focus:shadow-[0_0_0_3px_rgba(255,51,102,0.1)]',
              className
            )}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-white/30 flex items-center z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-neon-red text-xs font-inter flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-white/25 text-xs font-inter">{helperText}</p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';
export default CyberInput;
