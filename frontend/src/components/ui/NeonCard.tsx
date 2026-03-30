// src/components/ui/NeonCard.tsx
import { cn } from '@/lib/utils';
import type { ReactNode, CSSProperties } from 'react';

type NeonVariant = 'default' | 'cyan' | 'magenta' | 'violet' | 'green' | 'amber' | 'red';

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  variant?: NeonVariant;
  hover?: boolean;
  onClick?: () => void;
  padding?: string;
  style?: CSSProperties;
}

const variantClass: Record<NeonVariant, string> = {
  default: '',
  cyan:    'cyan',
  magenta: 'magenta',
  violet:  'violet',
  green:   'green',
  amber:   'amber',
  red:     'red',
};

const NeonCard = ({
  children,
  className,
  variant = 'default',
  hover = true,
  onClick,
  padding = 'p-6',
  style,
}: NeonCardProps) => {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'neon-card',
        variantClass[variant],
        padding,
        !hover && '[&:hover]:transform-none [&:hover]:shadow-none',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default NeonCard;
