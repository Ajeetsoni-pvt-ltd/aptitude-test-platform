// src/pages/LeaderboardPage.tsx
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { getLeaderboardApi } from '@/api/userApi';
import {
  Trophy, Star, ChevronRight, Users,
  CheckCircle, BarChart2, Loader, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  score: number;
  tests: number;
  badge: string;
  isCurrentUser?: boolean;
}

// ── Animated Counter Hook ────────────────────────────────────────
const useCountUp = (end: number, duration = 1400, start = true) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) { setCount(0); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, start]);

  return count;
};

// ── Circular Progress — proper animated ring ─────────────────────
const CircularProgress = ({
  percentage, color, size = 52,
}: {
  percentage: number; color: string; size?: number;
}) => {
  const radius = 15.9;
  const circumference = 2 * Math.PI * radius;
  const [displayDash, setDisplayDash] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayDash((percentage / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="mx-auto my-1"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx="18" cy="18" r={radius}
        fill="none" stroke="#3f3f46" strokeWidth="2.5"
      />
      <circle
        cx="18" cy="18" r={radius}
        fill="none" stroke={color}
        strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${displayDash} ${circumference - displayDash}`}
        strokeDashoffset="0"
        style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
      />
    </svg>
  );
};

// ── Initials Helper ──────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

// ── Badge Color Helper ───────────────────────────────────────────
const getBadgeStyle = (badge: string) => {
  if (badge === 'Neural Master') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  if (badge === 'Elite')         return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  if (badge === 'Advanced')      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
  if (badge === 'Proficient')    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (badge === 'Intermediate')  return 'bg-green-500/20 text-green-300 border-green-500/30';
  return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50';
};

// ── Podium Card (compact) ────────────────────────────────────────
const PodiumCard = ({
  entry, animate,
}: {
  entry: LeaderboardEntry; animate: boolean;
}) => {
  const rank = entry.rank;
  const animatedScore = useCountUp(Math.round(entry.score), 1400, animate);
  const isFirst = rank === 1;

  const theme = rank === 1
    ? {
        gradient: 'from-yellow-400 via-amber-500 to-orange-600',
        textGradient: 'from-yellow-300 to-amber-400',
        ring: 'from-yellow-400 to-amber-600',
        initialsColor: 'text-yellow-400',
        icon: '👑',
        starCount: 5,
        starColor: 'fill-yellow-400 text-yellow-400',
        badgeBg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        ringHex: '#f59e0b',
      }
    : rank === 2
    ? {
        gradient: 'from-slate-300 via-zinc-400 to-slate-500',
        textGradient: 'from-slate-200 to-zinc-400',
        ring: 'from-slate-300 to-zinc-500',
        initialsColor: 'text-slate-300',
        icon: '🥈',
        starCount: 4,
        starColor: 'fill-slate-300 text-slate-300',
        badgeBg: 'bg-gradient-to-r from-slate-300 to-zinc-500',
        ringHex: '#94a3b8',
      }
    : {
        gradient: 'from-amber-600 via-orange-700 to-amber-800',
        textGradient: 'from-amber-500 to-orange-600',
        ring: 'from-amber-600 to-orange-800',
        initialsColor: 'text-amber-500',
        icon: '🥉',
        starCount: 3,
        starColor: 'fill-amber-500 text-amber-500',
        badgeBg: 'bg-gradient-to-r from-amber-600 to-orange-700',
        ringHex: '#d97706',
      };

  return (
    <div
      className={cn(
        'relative group transition-all duration-500',
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      )}
      style={{ transitionDelay: rank === 2 ? '0ms' : rank === 1 ? '150ms' : '300ms' }}
    >
      {/* Outer glow */}
      <div className={cn(
        'absolute -inset-[2px] bg-gradient-to-b rounded-2xl transition-opacity blur-sm',
        theme.gradient,
        'opacity-30 group-hover:opacity-60'
      )} />

      <div className={cn(
        'relative bg-zinc-900/95 rounded-2xl text-center border border-white/10',
        'flex flex-col items-center justify-center',
        isFirst ? 'p-5 pt-7' : 'p-4 pt-6'
      )}>
        {/* Rank badge — compact floating pill */}
        <div className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-black text-xs text-black shadow-lg',
          theme.badgeBg
        )}>
          #{rank}
        </div>

        {/* Crown / Medal — small, tight */}
        <div className={cn(isFirst ? 'text-xl mb-0.5' : 'text-lg mb-0.5')}>
          {theme.icon}
        </div>

        {/* Avatar with gradient ring — 56px / 48px */}
        <div className="relative mx-auto mb-2"
          style={{ width: isFirst ? 56 : 48, height: isFirst ? 56 : 48 }}
        >
          <div className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-br p-[2px]',
            theme.ring
          )}>
            <div className={cn(
              'w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold',
              isFirst ? 'text-base' : 'text-sm',
              theme.initialsColor
            )}>
              {getInitials(entry.name)}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900" />
        </div>

        {/* Name + meta — compact */}
        <h3 className="text-white font-semibold text-sm mt-1 truncate w-full">
          {entry.name}
        </h3>
        <p className="text-zinc-600 text-xs mb-2">
          {entry.badge} · {entry.tests} test{entry.tests !== 1 ? 's' : ''}
        </p>

        {/* Score — controlled size */}
        <div className={cn(
          'font-black bg-gradient-to-r bg-clip-text text-transparent mb-1',
          theme.textGradient,
          isFirst ? 'text-3xl' : 'text-2xl'
        )}>
          {animatedScore}%
        </div>

        {/* Circular progress ring — properly animated */}
        <CircularProgress
          percentage={Math.round(entry.score)}
          color={theme.ringHex}
          size={isFirst ? 52 : 44}
        />

        {/* Stars — small */}
        <div className="flex justify-center gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11}
              className={i < theme.starCount ? theme.starColor : 'text-zinc-700'} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
const LeaderboardPage = () => {
  const { user } = useAuthStore();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLeaderboardApi(50);

        if (response.success && response.data) {
          setLeaders(response.data.leaderboard);
        } else {
          setError(response.message || 'Failed to load leaderboard');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Error loading leaderboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Trigger mount animations after data loads
  useEffect(() => {
    if (!isLoading && leaders.length > 0) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, leaders.length]);

  // Podium order: 2nd, 1st, 3rd
  const topThree = leaders.slice(0, 3).sort((a, b) => {
    if (a.rank === 2) return -1;
    if (b.rank === 2) return 1;
    if (a.rank === 1) return -1;
    return 1;
  });

  // Computed stats
  const totalParticipants = leaders.length;
  const totalTests = leaders.reduce((s, l) => s + l.tests, 0);
  const topScore = leaders.length > 0 ? Math.round(leaders[0]?.score ?? 0) : 0;
  const avgScore = leaders.length > 0
    ? Math.round(leaders.reduce((s, l) => s + l.score, 0) / leaders.length)
    : 0;

  return (
    <AppLayout>
      {/* ── Ambient background glows — subtle ─────────────────── */}
      <div className="fixed top-0 left-1/4 w-72 h-72 bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-yellow-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* ── Hero Header ───────────────────────────────────────── */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.04] via-purple-500/[0.04] to-pink-500/[0.04] rounded-3xl blur-3xl" />
        <div className="relative z-10 flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium tracking-widest uppercase font-inter">
                Live Rankings
              </span>
            </div>
            <h1 className="font-orbitron text-2xl md:text-3xl lg:text-4xl font-black tracking-tight">
              <span className="text-white">Neural </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="text-zinc-500 mt-1.5 text-sm font-inter">Top performers across the NEXUS network</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold font-inter">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Podium — Top 3 ────────────────────────────────────── */}
      <div className="mb-8">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto items-end">
            {[52, 64, 48].map((h, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex items-center justify-center animate-pulse"
                style={{ height: `${h * 4}px` }}>
                <Loader size={20} className="text-zinc-600 animate-spin" />
              </div>
            ))}
          </div>
        ) : topThree.length >= 3 ? (
          <>
            {/* Desktop: 3 columns, items-end = podium effect */}
            <div className="hidden md:grid md:grid-cols-3 gap-5 items-end max-w-3xl mx-auto">
              {topThree.map((entry) => (
                <div key={entry.userId} style={{ order: entry.rank === 2 ? 0 : entry.rank === 1 ? 1 : 2 }}>
                  <PodiumCard entry={entry} animate={mounted} />
                </div>
              ))}
            </div>
            {/* Mobile: 1st on top, 2nd + 3rd side-by-side */}
            <div className="md:hidden space-y-3">
              {leaders.slice(0, 1).map((entry) => (
                <PodiumCard key={entry.userId} entry={entry} animate={mounted} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                {leaders.slice(1, 3).map((entry) => (
                  <PodiumCard key={entry.userId} entry={entry} animate={mounted} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-500 py-10 font-inter">
            <Trophy size={32} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-sm">Not enough data for podium yet</p>
          </div>
        )}
      </div>

      {/* ── Rankings Table ─────────────────────────────────────── */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 md:p-5 mb-6 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <Trophy size={16} className="text-yellow-400" />
            </div>
            <h2 className="text-white font-bold text-lg font-inter">Rankings</h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-[10px] font-semibold font-inter tracking-wider">LIVE DATA</span>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-red-400" />
            </div>
            <p className="text-red-400 font-inter text-sm">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader size={24} className="text-cyan-400 animate-spin" />
            <span className="text-zinc-500 font-inter text-xs">Loading rankings...</span>
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-10">
            <Trophy size={32} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-zinc-500 font-inter text-sm">No leaderboard data available yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaders.map((l, i) => {
              const isMe = l.isCurrentUser || user?.name === l.name;
              const rankColors: Record<number, string> = {
                1: 'text-yellow-400',
                2: 'text-slate-300',
                3: 'text-pink-400',
              };
              const ringColors: Record<number, string> = {
                1: 'from-yellow-400 to-amber-600',
                2: 'from-slate-300 to-zinc-500',
                3: 'from-amber-600 to-orange-800',
              };
              const barColors: Record<number, string> = {
                1: 'from-yellow-400 to-amber-500',
                2: 'from-slate-300 to-zinc-400',
                3: 'from-pink-400 to-purple-500',
              };

              return (
                <div
                  key={l.userId}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer',
                    isMe
                      ? 'border-cyan-500/30 bg-cyan-500/[0.06] shadow-[0_0_20px_rgba(0,245,255,0.05)]'
                      : 'border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/20',
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  )}
                  style={{
                    transitionDelay: mounted ? `${Math.min(i * 50, 500)}ms` : '0ms',
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {l.rank <= 3 ? (
                      <span className="text-lg">{l.rank === 1 ? '🥇' : l.rank === 2 ? '🥈' : '🥉'}</span>
                    ) : (
                      <span className="text-zinc-500 font-bold text-sm font-inter">#{l.rank}</span>
                    )}
                  </div>

                  {/* Avatar with gradient ring — 40px */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'p-[2px] rounded-full bg-gradient-to-br',
                      ringColors[l.rank] ?? 'from-zinc-600 to-zinc-800'
                    )}>
                      <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center font-bold text-xs text-white font-inter">
                        {getInitials(l.name)}
                      </div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-zinc-900" />
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-semibold font-inter text-sm truncate', isMe ? 'text-cyan-400' : 'text-white')}>
                        {l.name}
                        {isMe && <span className="text-cyan-400/60 ml-1 text-xs">(You)</span>}
                      </span>
                      <span className={cn('px-1.5 py-px rounded-full text-[10px] font-medium border hidden sm:inline-block', getBadgeStyle(l.badge))}>
                        {l.badge}
                      </span>
                    </div>
                    <p className="text-zinc-600 text-xs mt-0.5 font-inter">
                      {l.tests} test{l.tests !== 1 ? 's' : ''} attempted
                    </p>
                  </div>

                  {/* Score + mini progress bar */}
                  <div className="text-right flex-shrink-0">
                    <div className={cn(
                      'text-lg font-bold mb-0.5',
                      rankColors[l.rank] ?? 'text-zinc-300'
                    )}>
                      {Math.round(l.score)}%
                    </div>
                    <div className="w-20 h-1 bg-zinc-700/60 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-[1200ms] ease-out',
                          barColors[l.rank] ?? 'from-zinc-400 to-zinc-500'
                        )}
                        style={{ width: mounted ? `${Math.round(l.score)}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <ChevronRight
                    size={14}
                    className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all flex-shrink-0 hidden sm:block"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational footer */}
        {!isLoading && !error && leaders.length > 0 && (
          <div className="mt-5 pt-3 border-t border-zinc-800/50 flex items-center justify-center gap-2 text-zinc-600 text-xs font-inter">
            <Crown size={12} />
            <span>Complete more tests to climb the global rankings</span>
          </div>
        )}
      </div>

      {/* ── Bottom Stats Strip ─────────────────────────────────── */}
      {!isLoading && !error && leaders.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 transition-all duration-700',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: '500ms' }}
        >
          {[
            { label: 'Total Participants', value: totalParticipants, icon: Users, c1: 'bg-cyan-500/10', c2: 'text-cyan-400' },
            { label: 'Tests Completed', value: totalTests, icon: CheckCircle, c1: 'bg-green-500/10', c2: 'text-green-400' },
            { label: 'Top Score', value: `${topScore}%`, icon: Trophy, c1: 'bg-yellow-500/10', c2: 'text-yellow-400' },
            { label: 'Average Score', value: `${avgScore}%`, icon: BarChart2, c1: 'bg-purple-500/10', c2: 'text-purple-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-3.5 hover:border-zinc-700/60 transition-colors group"
            >
              <div className={cn('p-1.5 rounded-lg w-fit mb-2 transition-transform group-hover:scale-110', stat.c1)}>
                <stat.icon size={15} className={stat.c2} />
              </div>
              <div className="text-xl font-black text-white font-inter">{stat.value}</div>
              <div className="text-zinc-500 text-xs font-inter mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LeaderboardPage;
