// src/pages/DashboardPage.tsx
// Futuristic dashboard with KPI stats, charts, activity feed

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyResultsApi, startScheduledTestApi } from '@/api/testApi';
import { getMyScheduledTestsApi } from '@/api/scheduledApi';
import type { TestAttempt } from '@/types';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import StatCard from '@/components/ui/StatCard';
import HoloButton from '@/components/ui/HoloButton';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  BookOpen, Trophy, Clock, TrendingUp, Plus, ArrowRight,
  Zap, Target, ChevronRight, Star, Activity, Brain, Flame, Lock, Calendar, AlertCircle
} from 'lucide-react';

// ── Custom chart tooltip ──────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border border-neon-cyan/20 rounded-lg px-3 py-2">
      <p className="text-white/40 text-xs font-inter">{label}</p>
      <p className="text-neon-cyan font-orbitron text-sm font-bold">{payload[0].value}%</p>
    </div>
  );
};

// ── Score badge ───────────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number }) => {
  if (score >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/25 font-inter">Excellent</span>;
  if (score >= 60) return <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 font-inter">Good</span>;
  if (score >= 40) return <span className="text-xs px-2 py-0.5 rounded-full bg-neon-amber/15 text-neon-amber border border-neon-amber/25 font-inter">Average</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-neon-red/15 text-neon-red border border-neon-red/25 font-inter">Needs Work</span>;
};

// ── Quick action card ─────────────────────────────────────────────
const QuickAction = ({
  icon, label, desc, onClick, color = 'cyan',
}: { icon: React.ReactNode; label: string; desc: string; onClick: () => void; color?: string }) => (
  <button
    onClick={onClick}
    className={`neon-card ${color} p-4 text-left w-full group transition-all duration-300`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
      ${
        color === 'cyan' ? 'bg-neon-cyan/10 text-neon-cyan'
        : color === 'violet' ? 'bg-neon-violet/10 text-neon-violet'
        : color === 'amber' ? 'bg-neon-amber/10 text-neon-amber'
        : 'bg-neon-magenta/10 text-neon-magenta'
      }
      group-hover:scale-110 transition-transform duration-200`}>
      {icon}
    </div>
    <p className="font-semibold text-white text-sm font-inter">{label}</p>
    <p className="text-white/35 text-xs mt-0.5 font-inter">{desc}</p>
    <ChevronRight size={14} className={`mt-2 ${
      color === 'cyan' ? 'text-neon-cyan'
      : color === 'violet' ? 'text-neon-violet'
      : color === 'amber' ? 'text-neon-amber'
      : 'text-neon-magenta'
    } group-hover:translate-x-1 transition-transform`} />
  </button>
);

// ── Problem of the Day mini-card for dashboard ────────────────────
const PotdCard = ({ navigate }: { navigate: (to: string) => void }) => {
  const streak     = parseInt(localStorage.getItem('potd_streak') ?? '0');
  const solvedToday = localStorage.getItem('potd_solved_date') === new Date().toISOString().split('T')[0];
  return (
    <NeonCard variant="amber" className="mb-6 animate-fade-up" padding="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-amber/20 to-orange-500/20 border border-neon-amber/30 flex items-center justify-center flex-shrink-0">
            <Flame size={24} className="text-neon-amber" style={{ animation: 'streak-flame 0.8s ease-in-out infinite' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-inter font-semibold text-white">Problem of the Day</p>
              {streak > 0 && (
                <span className="streak-badge inline-flex items-center gap-1 px-2 py-0.5">
                  <span className="text-sm">🔥</span>
                  <span className="font-orbitron font-bold text-neon-amber text-xs">{streak}</span>
                </span>
              )}
            </div>
            <p className="text-white/30 text-xs font-inter mt-0.5">
              {solvedToday ? '✅ Solved today — come back tomorrow!' : '⚡ Today\'s challenge is waiting'}
            </p>
          </div>
        </div>
        <HoloButton variant="ghost" size="sm" onClick={() => navigate('/problem-of-day')} icon={<ChevronRight size={14} />}>
          {solvedToday ? 'Review' : 'Solve Now'}
        </HoloButton>
      </div>
    </NeonCard>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate          = useNavigate();
  const { user }          = useAuthStore();
  const [attempts,  setAttempts]  = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);

  // Scheduled tests and starting logic
  const [scheduledTests, setScheduledTests] = useState<any[]>([]);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const [resAttempts, resScheduled] = await Promise.all([
          getMyResultsApi(1, 5),
          getMyScheduledTestsApi()
        ]);

        if (resAttempts.success && resAttempts.data) {
          setAttempts(resAttempts.data.attempts);
          setTotalTests(resAttempts.data.pagination.totalAttempts);
        }

        if (resScheduled.success && resScheduled.data) {
          setScheduledTests(resScheduled.data);
        }
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleStartScheduled = async (test: any) => {
    if (test.status === 'locked' || startingTestId) return;
    
    setError(null);
    setStartingTestId(test._id);
    try {
      const res = await startScheduledTestApi(test._id);

      if (res.success && res.data) {
        navigate('/test', {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
            title: res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime: res.data.durationSeconds ?? test.timeLimit * 60,
            isProctored: true, // Force proctoring for admin scheduled tests
          },
        });
      } else {
        // Handle API errors (including "already attempted")
        const errorMessage = res.message || 'Failed to start test. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start test. Please try again.';
      setError(errorMessage);
      console.error("Failed to start scheduled test", err);
    } finally {
      setStartingTestId(null);
    }
  };

  const avgScore  = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;
  const totalMin  = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.totalTime || 0), 0) / 60) : 0;

  // Chart data — recent 5 scores reversed
  const chartData = [...attempts].reverse().map((a, i) => ({
    name:  `T${i + 1}`,
    score: a.score,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <AppLayout>
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-sm font-inter uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-wide">
            {user?.name?.split(' ')[0] ?? 'Agent'}{' '}
            <span className="gradient-text-cyan-violet">Dashboard</span>
          </h1>
          <p className="text-white/35 text-sm font-inter mt-1.5 flex items-center gap-2">
            <Activity size={14} className="text-neon-green animate-neon-pulse" />
            Neural systems operational
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <NeuralAvatar name={user?.name ?? 'User'} role={user?.role} size="md" />
        </div>
      </div>

      {/* ── KPI Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tests"
          value={totalTests}
          icon={<BookOpen size={20} />}
          variant="cyan"
          subtext="Lifetime attempts"
        />
        <StatCard
          label="Avg Score"
          value={`${avgScore}%`}
          icon={<TrendingUp size={20} />}
          variant="violet"
          subtext="Across all tests"
          trend={avgScore > 60 ? { value: 5, label: 'vs last month' } : { value: -2, label: 'vs last month' }}
        />
        <StatCard
          label="Best Score"
          value={`${bestScore}%`}
          icon={<Trophy size={20} />}
          variant="green"
          subtext="Personal record"
        />
        <StatCard
          label="Time Spent"
          value={`${totalMin}m`}
          icon={<Clock size={20} />}
          variant="amber"
          subtext="Total practice"
        />
      </div>

      {/* ── Main content grid ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">

        {/* Score trend chart — 2 cols */}
        <NeonCard variant="cyan" className="lg:col-span-2 animate-fade-up" padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-inter font-semibold text-white">Score Trend</h2>
              <p className="text-white/30 text-xs mt-0.5">Recent performance trajectory</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-neon-pulse" />
              <span className="text-neon-cyan text-xs font-mono-code">LIVE</span>
            </div>
          </div>

          {attempts.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#00F5FF"
                  strokeWidth={2.5}
                  fill="url(#scoreGrad)"
                  dot={{ fill: '#00F5FF', r: 4, strokeWidth: 2, stroke: '#080810' }}
                  activeDot={{ r: 6, fill: '#00F5FF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-white/20 text-sm font-inter">Complete a test to see your trend</p>
            </div>
          )}
        </NeonCard>

        {/* Performance ring */}
        <NeonCard variant="violet" className="animate-fade-up-delay" padding="p-5">
          <h2 className="font-inter font-semibold text-white mb-4">Performance</h2>
          <div className="flex flex-col items-center gap-4">
            <ProgressRing value={avgScore} size={140} strokeWidth={8} color="violet" label="Avg Score" />
            <div className="w-full space-y-2">
              {[
                { label: 'Accuracy',    value: avgScore,  color: '#9D00FF' },
                { label: 'Completion',  value: Math.min(totalTests * 10, 100), color: '#00F5FF' },
                { label: 'Consistency', value: bestScore > 0 ? Math.round((avgScore / bestScore) * 100) : 0, color: '#00FF88' },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="text-white/30 text-xs w-20 font-inter">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${m.value}%`, background: m.color, boxShadow: `0 0 6px ${m.color}` }}
                    />
                  </div>
                  <span className="text-white/40 text-xs w-8 text-right font-mono-code">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="mb-6 animate-fade-up">
        <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-neon-cyan" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction
            icon={<Plus size={20} />}
            label="New Test"
            desc="Start a practice session"
            onClick={() => navigate('/test-setup')}
            color="cyan"
          />
          <QuickAction
            icon={<Flame size={20} />}
            label="Daily Challenge"
            desc="Today's problem + streak"
            onClick={() => navigate('/problem-of-day')}
            color="amber"
          />
          <QuickAction
            icon={<Brain size={20} />}
            label="Analysis"
            desc="View deep analytics"
            onClick={() => navigate('/analysis')}
            color="violet"
          />
          <QuickAction
            icon={<Star size={20} />}
            label="Leaderboard"
            desc="See global rankings"
            onClick={() => navigate('/leaderboard')}
            color="magenta"
          />
        </div>
      </div>

      {/* ── Problem of the Day Card ─────────────────────────── */}
      <PotdCard navigate={navigate} />

      {/* ── Scheduled / Upcoming Tests ─────────────────────── */}
      {scheduledTests.length > 0 && (
        <NeonCard variant="violet" className="animate-fade-up mb-8" padding="p-5">
           <div className="flex items-center gap-2 mb-5">
             <Calendar size={18} className="text-neon-violet" />
             <h2 className="font-inter font-semibold text-white">Upcoming & Assigned Tests</h2>
           </div>

           {/* Error alert for test start failures */}
           {error && (
             <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
               <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="text-neon-red text-sm font-inter leading-snug">{error}</p>
               </div>
               <button
                 onClick={() => setError(null)}
                 className="text-neon-red/60 hover:text-neon-red transition-colors flex-shrink-0 ml-2"
               >
                 ✕
               </button>
             </div>
           )}
           
           <div className="grid md:grid-cols-2 gap-4">
             {scheduledTests.map(test => {
               const isLocked = test.status === 'locked';
               
               return (
                 <div key={test._id} className={cn(
                   "p-4 rounded-xl border relative overflow-hidden group transition-all duration-300",
                   isLocked ? "border-white/5 bg-white/[0.02]" : "border-neon-cyan/30 bg-neon-cyan/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
                 )}>
                   <div className="flex justify-between items-start mb-2">
                     <p className="font-inter font-medium text-white/90 text-sm truncate pr-2 group-hover:text-white">{test.title}</p>
                     
                     {isLocked ? (
                       <span className="flex-shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-neon-amber/30 text-neon-amber bg-neon-amber/5 font-mono-code">
                         <Lock size={10} /> LOCKED
                       </span>
                     ) : test.status === 'live' ? (
                       <span className="flex-shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-neon-green/30 text-neon-green bg-neon-green/5 font-mono-code animate-neon-pulse">
                         <div className="w-1.5 h-1.5 rounded-full bg-neon-green" /> LIVE
                       </span>
                     ) : (
                       <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/50 bg-white/5 font-mono-code">
                         ENDED
                       </span>
                     )}
                   </div>
                   
                   <p className="text-white/40 text-xs font-inter mb-4 line-clamp-1">{test.topic} · {test.questionCount} Questions · {test.timeLimit} Minutes</p>
                   
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] text-white/30 uppercase tracking-wider font-inter">Scheduled For</p>
                       <p className={cn("text-xs font-mono-code mt-0.5", isLocked ? "text-neon-amber" : "text-white/60")}>
                         {new Date(test.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                       </p>
                     </div>
                     
                     <HoloButton 
                       variant={isLocked ? "ghost" : "cyan"} 
                       size="sm" 
                       onClick={() => handleStartScheduled(test)}
                       disabled={isLocked || test.status === 'completed'}
                       loading={startingTestId === test._id}
                       icon={isLocked ? <Lock size={14} /> : <Zap size={14} />}
                     >
                       {isLocked ? "Wait" : test.status === 'live' ? "Start Now" : "Missed"}
                     </HoloButton>
                   </div>
                   
                   {/* Background accent */}
                   {!isLocked && test.status === 'live' && (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-3xl -z-10 rounded-full mix-blend-screen transform translate-x-1/2 -translate-y-1/2" />
                   )}
                 </div>
               );
             })}
           </div>
        </NeonCard>
      )}

      {/* ── Recent Attempts ────────────────────────────────── */}
      <NeonCard variant="default" className="animate-fade-up" padding="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-inter font-semibold text-white">Recent Tests</h2>
            <p className="text-white/30 text-xs mt-0.5 font-inter">Your last {attempts.length} sessions</p>
          </div>
          {totalTests > 5 && (
            <HoloButton variant="ghost" size="sm" onClick={() => navigate('/history')} icon={<ArrowRight size={14} />}>
              View All
            </HoloButton>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading neural data..." />
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
              <Target size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 font-inter text-sm">No test attempts yet</p>
            <HoloButton variant="cyan" size="sm" onClick={() => navigate('/test-setup')} icon={<Plus size={14} />}>
              Take Your First Test
            </HoloButton>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt, idx) => (
              <div
                key={attempt._id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]
                  hover:border-neon-cyan/20 hover:bg-neon-cyan/[0.03] transition-all duration-300 group
                  animate-fade-up"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-white/30 font-mono-code text-xs">#{idx + 1}</span>
                </div>

                {/* Title + date */}
                <div className="flex-1 min-w-0">
                  <p className="font-inter font-medium text-white/80 text-sm truncate group-hover:text-white transition-colors">
                    {attempt.title}
                  </p>
                  <p className="text-white/25 text-xs mt-0.5 font-mono-code">
                    {new Date(attempt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs font-inter">
                  <span className="text-neon-green/70">✓ {attempt.correctCount}</span>
                  <span className="text-neon-red/70">✗ {attempt.incorrectCount}</span>
                  <span className="text-white/25">↷ {attempt.skippedCount}</span>
                </div>

                {/* Score + badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-orbitron font-bold text-neon-cyan text-lg">{attempt.score}%</span>
                  <ScoreBadge score={attempt.score} />
                </div>
              </div>
            ))}
          </div>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default DashboardPage;
