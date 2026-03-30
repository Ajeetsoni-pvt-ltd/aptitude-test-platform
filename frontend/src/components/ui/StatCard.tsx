// src/components/ui/StatCard.tsx
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import NeonCard from './NeonCard';

type StatVariant = 'cyan' | 'magenta' | 'violet' | 'green' | 'amber';

interface StatCardProps {
  label:    string;
  value:    string | number;
  subtext?: string;
  icon:     ReactNode;
  variant?: StatVariant;
  trend?:   { value: number; label: string };
  className?: string;
}

const variantAccent: Record<StatVariant, string> = {
  cyan:    'text-neon-cyan',
  magenta: 'text-neon-magenta',
  violet:  'text-neon-violet',
  green:   'text-neon-green',
  amber:   'text-neon-amber',
};

const variantIconBg: Record<StatVariant, string> = {
  cyan:    'bg-neon-cyan/10 text-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.2)]',
  magenta: 'bg-neon-magenta/10 text-neon-magenta shadow-[0_0_15px_rgba(255,0,170,0.2)]',
  violet:  'bg-neon-violet/10 text-neon-violet shadow-[0_0_15px_rgba(157,0,255,0.2)]',
  green:   'bg-neon-green/10 text-neon-green shadow-[0_0_15px_rgba(0,255,136,0.2)]',
  amber:   'bg-neon-amber/10 text-neon-amber shadow-[0_0_15px_rgba(255,183,0,0.2)]',
};

const StatCard = ({ label, value, subtext, icon, variant = 'cyan', trend, className }: StatCardProps) => {
  return (
    <NeonCard variant={variant} padding="p-5" className={cn('animate-fade-up', className)}>
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl', variantIconBg[variant])}>
          {icon}
        </div>

        {/* Trend */}
        {trend && (
          <div className={cn(
            'text-xs font-mono-code font-medium px-2 py-1 rounded-md',
            trend.value >= 0
              ? 'bg-neon-green/10 text-neon-green'
              : 'bg-neon-red/10 text-neon-red'
          )}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-white/40 text-xs font-inter uppercase tracking-widest">{label}</p>
        <p className={cn('text-3xl font-orbitron font-bold mt-1 tracking-wide', variantAccent[variant])}>
          {value}
        </p>
        {subtext && (
          <p className="text-white/30 text-xs mt-1 font-inter">{subtext}</p>
        )}
        {trend && (
          <p className="text-white/30 text-xs mt-1">{trend.label}</p>
        )}
      </div>
    </NeonCard>
  );
};

export default StatCard;
