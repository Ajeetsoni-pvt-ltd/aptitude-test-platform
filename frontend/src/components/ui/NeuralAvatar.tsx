// src/components/ui/NeuralAvatar.tsx
import { cn } from '@/lib/utils';

interface NeuralAvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRing?: boolean;
  className?: string;
  imageUrl?: string;
}

const sizeMap = {
  sm: { outer: 36, inner: 28, fontSize: 'text-xs', ringStroke: 1.5 },
  md: { outer: 48, inner: 36, fontSize: 'text-sm', ringStroke: 2 },
  lg: { outer: 72, inner: 56, fontSize: 'text-lg', ringStroke: 2.5 },
  xl: { outer: 100, inner: 78, fontSize: 'text-2xl', ringStroke: 3 },
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const NeuralAvatar = ({
  name,
  role,
  size = 'md',
  showRing = true,
  className,
  imageUrl,
}: NeuralAvatarProps) => {
  const { outer, inner, fontSize, ringStroke } = sizeMap[size];
  const ringColor = role === 'admin' ? '#9D00FF' : '#00F5FF';
  const ringGlow  = role === 'admin' ? 'rgba(157,0,255,0.8)' : 'rgba(0,245,255,0.8)';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: outer, height: outer }}
    >
      {showRing && (
        <svg
          className="absolute inset-0 animate-ring-spin"
          width={outer}
          height={outer}
          viewBox={`0 0 ${outer} ${outer}`}
        >
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={outer / 2 - ringStroke / 2}
            fill="none"
            stroke={ringColor}
            strokeWidth={ringStroke}
            strokeDasharray="4 8"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${ringGlow})` }}
          />
        </svg>
      )}

      {/* Avatar circle */}
      <div
        className={cn('rounded-full flex items-center justify-center font-orbitron font-bold', fontSize)}
        style={{
          width: inner,
          height: inner,
          background: role === 'admin'
            ? 'linear-gradient(135deg, #3B0066, #9D00FF)'
            : 'linear-gradient(135deg, #003344, #00F5FF)',
          boxShadow: `0 0 15px ${ringGlow.replace('0.8', '0.4')}`,
          color: '#fff',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-full" />
        ) : (
          getInitials(name)
        )}
      </div>

      {/* Online indicator */}
      <div
        className="absolute bottom-0 right-0 rounded-full border-2 border-cyber-black animate-neon-pulse"
        style={{
          width:  size === 'sm' ? 8 : size === 'xl' ? 14 : 10,
          height: size === 'sm' ? 8 : size === 'xl' ? 14 : 10,
          background: '#00FF88',
          boxShadow: '0 0 8px rgba(0,255,136,0.8)',
        }}
      />
    </div>
  );
};

export default NeuralAvatar;
