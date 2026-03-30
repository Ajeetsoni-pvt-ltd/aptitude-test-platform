// src/components/ui/ProgressRing.tsx
import { cn } from '@/lib/utils';

type RingColor = 'cyan' | 'magenta' | 'violet' | 'green' | 'amber' | 'red';

interface ProgressRingProps {
  value: number;      // 0–100
  size?: number;      // px
  strokeWidth?: number;
  color?: RingColor;
  showLabel?: boolean;
  label?: string;
  animating?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const colorMap: Record<RingColor, { stroke: string; shadow: string; text: string }> = {
  cyan:    { stroke: '#00F5FF', shadow: 'rgba(0,245,255,0.8)',    text: 'text-neon-cyan' },
  magenta: { stroke: '#FF00AA', shadow: 'rgba(255,0,170,0.8)',   text: 'text-neon-magenta' },
  violet:  { stroke: '#9D00FF', shadow: 'rgba(157,0,255,0.8)',   text: 'text-neon-violet' },
  green:   { stroke: '#00FF88', shadow: 'rgba(0,255,136,0.8)',   text: 'text-neon-green' },
  amber:   { stroke: '#FFB700', shadow: 'rgba(255,183,0,0.8)',   text: 'text-neon-amber' },
  red:     { stroke: '#FF3366', shadow: 'rgba(255,51,102,0.8)',  text: 'text-neon-red' },
};

const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 6,
  color = 'cyan',
  showLabel = true,
  label,
  className,
  children,
}: ProgressRingProps) => {
  const radius      = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct         = Math.min(Math.max(value, 0), 100);
  const offset      = circumference - (pct / 100) * circumference;
  const { stroke, shadow, text } = colorMap[color];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.06)"
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${shadow})`,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          showLabel && (
            <>
              <span className={cn('font-orbitron font-bold leading-none', text)} style={{ fontSize: size * 0.2 }}>
                {Math.round(pct)}%
              </span>
              {label && (
                <span className="text-white/40 mt-1" style={{ fontSize: size * 0.09 }}>
                  {label}
                </span>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
