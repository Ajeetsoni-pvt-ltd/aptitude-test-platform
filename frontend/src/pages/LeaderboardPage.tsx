// src/pages/LeaderboardPage.tsx
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import { useAuthStore } from '@/store/authStore';
import { Trophy, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock leaderboard data
const LEADERS = [
  { rank: 1,  name: 'Priya Sharma',   score: 97, tests: 42, badge: 'Grandmaster' },
  { rank: 2,  name: 'Rahul Verma',    score: 94, tests: 38, badge: 'Master' },
  { rank: 3,  name: 'Ananya Singh',   score: 91, tests: 51, badge: 'Expert' },
  { rank: 4,  name: 'Karan Mehta',    score: 89, tests: 29, badge: 'Advanced' },
  { rank: 5,  name: 'Divya Gupta',    score: 87, tests: 33, badge: 'Advanced' },
  { rank: 6,  name: 'Amit Kumar',     score: 85, tests: 24, badge: 'Proficient' },
  { rank: 7,  name: 'Sneha Joshi',    score: 83, tests: 19, badge: 'Proficient' },
  { rank: 8,  name: 'Vikram Das',     score: 80, tests: 22, badge: 'Proficient' },
  { rank: 9,  name: 'Pooja Nair',     score: 78, tests: 17, badge: 'Rising' },
  { rank: 10, name: 'Rohan Tiwari',   score: 76, tests: 15, badge: 'Rising' },
];

const RANK_COLORS = { 1: 'neon-amber', 2: 'neon-cyan', 3: 'neon-violet' };
const RANK_ICONS  = { 1: '🥇', 2: '🥈', 3: '🥉' };

const LeaderboardPage = () => {
  const { user } = useAuthStore();

  return (
    <AppLayout>
      <div className="mb-8 animate-fade-up">
        <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Global</p>
        <h1 className="font-orbitron text-2xl font-bold text-white">
          Neural <span className="gradient-text-cyan-magenta">Leaderboard</span>
        </h1>
        <p className="text-white/25 text-sm font-inter mt-1.5">Top performers across the NEXUS network</p>
      </div>

      {/* Podium — top 3 */}
      <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-up">
        {[LEADERS[1], LEADERS[0], LEADERS[2]].map((l, i) => {
          const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          const color = RANK_COLORS[actualRank as keyof typeof RANK_COLORS] ?? 'neon-cyan';
          const heights = ['h-28', 'h-36', 'h-24'];
          return (
            <NeonCard
              key={l.rank}
              variant={color.replace('neon-', '') as 'amber' | 'cyan' | 'violet'}
              padding="p-4"
              className={cn('flex flex-col items-center justify-end text-center', heights[i])}
            >
              <div className="mb-2">{RANK_ICONS[actualRank as keyof typeof RANK_ICONS]}</div>
              <NeuralAvatar name={l.name} size="sm" showRing={false} />
              <p className="text-white/70 text-xs font-inter mt-1.5 truncate w-full text-center">{l.name.split(' ')[0]}</p>
              <p className={cn('font-orbitron text-lg font-bold', `text-${color}`)}>{l.score}%</p>
            </NeonCard>
          );
        })}
      </div>

      {/* Full table */}
      <NeonCard variant="default" padding="p-5" className="animate-fade-up-delay">
        <div className="flex items-center gap-2 mb-5">
          <Trophy size={16} className="text-neon-amber" />
          <h2 className="font-inter font-semibold text-white">Rankings</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-mono-code animate-neon-pulse">
            LIVE
          </span>
        </div>

        <div className="space-y-2">
          {LEADERS.map((l, i) => {
            const isMe     = user?.name === l.name;
            const rankColor = RANK_COLORS[l.rank as keyof typeof RANK_COLORS];

            return (
              <div
                key={l.rank}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-300',
                  isMe
                    ? 'border-neon-cyan/40 bg-neon-cyan/8 shadow-[0_0_20px_rgba(0,245,255,0.08)]'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/12',
                  'animate-fade-up'
                )}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-orbitron text-sm font-bold flex-shrink-0',
                  rankColor
                    ? `bg-${rankColor}/15 text-${rankColor} shadow-[0_0_10px_rgba(255,183,0,0.3)]`
                    : 'bg-white/5 text-white/30'
                )}>
                  {l.rank <= 3 ? RANK_ICONS[l.rank as keyof typeof RANK_ICONS] : l.rank}
                </div>

                {/* Avatar + name */}
                <NeuralAvatar name={l.name} size="sm" showRing={false} />
                <div className="flex-1 min-w-0">
                  <p className={cn('font-inter font-semibold text-sm truncate', isMe ? 'text-neon-cyan' : 'text-white/80')}>
                    {l.name} {isMe && <span className="text-xs">(You)</span>}
                  </p>
                  <p className="text-white/25 text-xs font-mono-code">{l.tests} tests · {l.badge}</p>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('font-orbitron font-bold text-lg', rankColor ? `text-${rankColor}` : 'text-white/60')}>
                    {l.score}%
                  </p>
                  {l.rank <= 3 && (
                    <div className="flex justify-end mt-0.5">
                      {Array.from({ length: Math.min(l.rank <= 1 ? 5 : l.rank <= 2 ? 4 : 3) }).map((_, j) => (
                        <Zap key={j} size={8} className="text-neon-amber" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* My rank placeholder */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-white/20 text-sm font-inter">
          <Crown size={14} />
          <span>Complete more tests to climb the global rankings</span>
        </div>
      </NeonCard>
    </AppLayout>
  );
};

export default LeaderboardPage;
