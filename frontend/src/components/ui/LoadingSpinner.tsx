// src/components/ui/LoadingSpinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: { outer: 24, inner: 16, border: 2 },
  md: { outer: 40, inner: 28, border: 3 },
  lg: { outer: 64, inner: 44, border: 4 },
  xl: { outer: 96, inner: 68, border: 5 },
};

const LoadingSpinner = ({ size = 'md', className, label }: LoadingSpinnerProps) => {
  const { outer, inner, border } = sizeMap[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative flex items-center justify-center" style={{ width: outer, height: outer }}>
        {/* Outer ring — spins clockwise */}
        <div
          className="absolute rounded-full animate-ring-spin"
          style={{
            width:  outer,
            height: outer,
            border: `${border}px solid transparent`,
            borderTopColor: '#00F5FF',
            borderRightColor: 'rgba(0,245,255,0.3)',
            filter: 'drop-shadow(0 0 6px rgba(0,245,255,0.8))',
          }}
        />
        {/* Inner ring — spins counter-clockwise */}
        <div
          className="absolute rounded-full animate-ring-spin-reverse"
          style={{
            width:  inner,
            height: inner,
            border: `${border}px solid transparent`,
            borderTopColor: '#9D00FF',
            borderLeftColor: 'rgba(157,0,255,0.3)',
            filter: 'drop-shadow(0 0 6px rgba(157,0,255,0.8))',
          }}
        />
        {/* Center dot */}
        <div
          className="rounded-full bg-neon-cyan animate-neon-pulse"
          style={{ width: border * 2, height: border * 2, boxShadow: '0 0 8px rgba(0,245,255,1)' }}
        />
      </div>

      {label && (
        <p className="text-white/40 text-sm font-inter tracking-widest uppercase animate-neon-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
