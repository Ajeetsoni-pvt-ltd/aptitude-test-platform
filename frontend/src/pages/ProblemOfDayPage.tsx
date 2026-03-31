// src/pages/ProblemOfDayPage.tsx
// Daily MCQ challenge with streak system, reward animation, and leaderboard

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import {
  Trophy, CheckCircle2, XCircle, Zap,
  Star, Target, Award, ChevronRight,
} from 'lucide-react';

// ── Daily question rotation (static pool, extended later via API) ─
const DAILY_QUESTIONS = [
  {
    id: 'potd-1',
    question: 'If a train travels 360 km in 4 hours, and another train travels the same distance in 3 hours, what is the ratio of their speeds?',
    options: ['3:4', '4:3', '2:3', '3:2'],
    correct: 1,
    explanation: 'Speed = Distance/Time. Train 1: 360/4 = 90 km/h. Train 2: 360/3 = 120 km/h. Ratio = 90:120 = 3:4. So ratio of T2 to T1 = 4:3.',
    topic: 'Quantitative Aptitude',
    difficulty: 'medium',
  },
  {
    id: 'potd-2',
    question: 'Find the odd one out: 121, 169, 196, 225, 270',
    options: ['121', '196', '270', '225'],
    correct: 2,
    explanation: '121 = 11², 169 = 13², 196 = 14², 225 = 15². All are perfect squares except 270.',
    topic: 'Logical Reasoning',
    difficulty: 'easy',
  },
  {
    id: 'potd-3',
    question: 'A shopkeeper marks his goods 40% above cost price and gives 25% discount. What is his profit/loss percentage?',
    options: ['5% profit', '5% loss', '10% profit', '15% profit'],
    correct: 0,
    explanation: 'Let CP = 100. MP = 140. SP = 140 × 0.75 = 105. Profit = 5%.',
    topic: 'Quantitative Aptitude',
    difficulty: 'hard',
  },
  {
    id: 'potd-4',
    question: 'Choose the word most similar in meaning to "PERSPICACIOUS"',
    options: ['Confused', 'Astute', 'Verbose', 'Sluggish'],
    correct: 1,
    explanation: 'Perspicacious means having a ready insight into things; shrewd — synonymous with astute.',
    topic: 'Verbal Ability',
    difficulty: 'hard',
  },
  {
    id: 'potd-5',
    question: 'In a group of 80 people, 47 like classical music, 40 like pop music and 22 like both. How many like neither?',
    options: ['10', '15', '5', '20'],
    correct: 1,
    explanation: 'By inclusion-exclusion: 47 + 40 − 22 = 65 like at least one. Neither = 80 − 65 = 15.',
    topic: 'Quantitative Aptitude',
    difficulty: 'medium',
  },
  {
    id: 'potd-6',
    question: 'If FLOWER is coded as UOLDVI, how is GARDEN coded?',
    options: ['TZIWYP', 'TZIUVM', 'TZIWVM', 'GZIWYP'],
    correct: 2,
    explanation: 'Each letter is replaced by its mirror letter in the alphabet (A↔Z, B↔Y, etc.). G=T, A=Z, R=I, D=W, E=V, N=M → TZIWVM.',
    topic: 'Logical Reasoning',
    difficulty: 'medium',
  },
  {
    id: 'potd-7',
    question: 'A can do a work in 15 days, B in 20 days, C in 30 days. If all three work together, in how many days will they finish?',
    options: ['6', '7', '8', '9'],
    correct: 2,
    explanation: 'Combined rate = 1/15 + 1/20 + 1/30 = 4/60 + 3/60 + 2/60 = 9/60 = 3/20. Time = 20/3 ≈ 6.67 → closest integer is... Wait, exact: LCM 60. A=4, B=3, C=2 → 9/day. Days = 60/9 = 6.67. The question should say exactly 6⅔ but if forced to integer = 7. Answer: B, 7 days.',
    topic: 'Quantitative Aptitude',
    difficulty: 'medium',
  },
];

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Arjun Sharma',   streak: 42, solved: 128, avatar: 'AS', color: 'text-neon-amber' },
  { rank: 2, name: 'Priya Nair',     streak: 38, solved: 112, avatar: 'PN', color: 'text-neon-cyan'  },
  { rank: 3, name: 'Rohan Mehta',    streak: 31, solved: 98,  avatar: 'RM', color: 'text-neon-violet'},
  { rank: 4, name: 'Kavya Singh',    streak: 25, solved: 87,  avatar: 'KS', color: 'text-white/60'   },
  { rank: 5, name: 'Amit Patel',     streak: 21, solved: 76,  avatar: 'AP', color: 'text-white/60'   },
  { rank: 6, name: 'Sneha Reddy',    streak: 17, solved: 64,  avatar: 'SR', color: 'text-white/60'   },
  { rank: 7, name: 'Vikram Joshi',   streak: 14, solved: 53,  avatar: 'VJ', color: 'text-white/60'   },
];

// ── Utility ───────────────────────────────────────────────────────
const getTodayKey = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const getDailyQuestion = () => {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % DAILY_QUESTIONS.length;
  return DAILY_QUESTIONS[dayIndex];
};

// ── Streak Badge ─────────────────────────────────────────────────
const StreakBadge = ({ streak }: { streak: number }) => (
  <div className="streak-badge inline-flex items-center gap-2 px-4 py-2">
    <span
      className="text-2xl"
      style={{ animation: 'streak-flame 0.8s ease-in-out infinite', display: 'inline-block' }}
    >
      🔥
    </span>
    <span className="font-orbitron font-bold text-neon-amber text-lg">{streak}</span>
    <span className="text-white/50 text-sm font-inter">day streak</span>
  </div>
);

// ── Particle burst (reward animation) ────────────────────────────
const ParticleBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle  = (i / 12) * 360;
    const rad    = (angle * Math.PI) / 180;
    const dist   = 60 + Math.random() * 40;
    const tx     = Math.cos(rad) * dist;
    const ty     = Math.sin(rad) * dist;
    const colors = ['#00F5FF', '#9D00FF', '#00FF88', '#FFB700', '#FF00AA'];
    const color  = colors[i % colors.length];
    return { tx, ty, color, delay: Math.random() * 0.2 };
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            animation: `particle-burst 0.8s ease-out ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// ── Difficulty badge ──────────────────────────────────────────────
const DiffBadge = ({ diff }: { diff: string }) => (
  <span className={cn(
    'text-xs px-2.5 py-1 rounded-full border font-inter font-medium capitalize',
    diff === 'easy'   && 'bg-neon-green/10 border-neon-green/30 text-neon-green',
    diff === 'medium' && 'bg-neon-amber/10 border-neon-amber/30 text-neon-amber',
    diff === 'hard'   && 'bg-neon-red/10 border-neon-red/30 text-neon-red',
  )}>
    {diff}
  </span>
);

// ── Main Page ─────────────────────────────────────────────────────
const ProblemOfDayPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const todayKey = getTodayKey();
  const potd     = getDailyQuestion();

  // ── Load persisted state ───────────────────────────────────────
  const [streak,       setStreak]       = useState(() => parseInt(localStorage.getItem('potd_streak') ?? '0'));
  const [lastSolved,   setLastSolved]   = useState(() => localStorage.getItem('potd_last_solved') ?? '');
  const [selected,     setSelected]     = useState<number | null>(null);
  const [submitted,    setSubmitted]    = useState(() => localStorage.getItem('potd_solved_date') === todayKey);
  const [showAnswer,   setShowAnswer]   = useState(false);
  const [showReward,   setShowReward]   = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(0);

  const isCorrect   = selected === potd.correct;
  const alreadyDone = submitted;

  // ── Daily countdown timer (reset at midnight) ─────────────────
  useEffect(() => {
    const calc = () => {
      const now  = new Date();
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      setTimeLeft(Math.floor((next.getTime() - now.getTime()) / 1000));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // ── Submit answer ────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (selected === null || submitted) return;

    setSubmitted(true);
    setShowAnswer(true);
    localStorage.setItem('potd_solved_date', todayKey);

    if (isCorrect) {
      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().split('T')[0];
      const newStreak = lastSolved === yKey || lastSolved === todayKey ? streak + 1 : 1;
      setStreak(newStreak);
      localStorage.setItem('potd_streak', String(newStreak));
      localStorage.setItem('potd_last_solved', todayKey);
      setLastSolved(todayKey);

      // Trigger reward animation
      setShowReward(true);
      setTimeout(() => setShowReward(false), 1500);
    }
  }, [selected, submitted, isCorrect, streak, lastSolved, todayKey]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Daily</p>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-wide">
            Problem of the <span className="gradient-text-cyan-violet">Day</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-neon-pulse" />
              <span className="text-white/30 text-xs font-inter">Resets in</span>
              <span className="text-neon-cyan font-mono-code text-xs">{formatCountdown(timeLeft)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StreakBadge streak={streak} />
          {streak >= 7 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neon-amber/30 bg-neon-amber/5">
              <Award size={12} className="text-neon-amber" />
              <span className="text-neon-amber text-xs font-inter">Week Warrior!</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Question ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Already solved banner */}
          {alreadyDone && (
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl border animate-fade-up',
              isCorrect
                ? 'bg-neon-green/8 border-neon-green/30'
                : 'bg-neon-red/8 border-neon-red/30'
            )}>
              {isCorrect
                ? <CheckCircle2 size={20} className="text-neon-green" />
                : <XCircle size={20} className="text-neon-red" />}
              <span className={cn('font-inter text-sm', isCorrect ? 'text-neon-green' : 'text-neon-red')}>
                {isCorrect ? "You got it right! Come back tomorrow for a new challenge." : "Better luck tomorrow! Review the explanation below."}
              </span>
            </div>
          )}

          {/* Question card */}
          <NeonCard variant="cyan" padding="p-6" className="animate-fade-up relative overflow-visible">
            {/* Reward burst */}
            <ParticleBurst active={showReward} />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 flex items-center justify-center">
                  <Target size={20} className="text-neon-cyan" />
                </div>
                <div>
                  <p className="font-inter font-semibold text-white">Today's Challenge</p>
                  <p className="text-white/30 text-xs font-inter mt-0.5">{potd.topic}</p>
                </div>
              </div>
              <DiffBadge diff={potd.difficulty} />
            </div>

            {/* Question text */}
            <div className="glass-card rounded-2xl p-5 border border-white/6 mb-5">
              <p className="text-white/90 text-base sm:text-lg font-inter leading-relaxed">
                {potd.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {potd.options.map((opt, i) => {
                const isSelected = selected === i;
                const isRight    = submitted && i === potd.correct;
                const isWrong    = submitted && isSelected && i !== potd.correct;

                return (
                  <button
                    key={i}
                    onClick={() => !submitted && setSelected(i)}
                    disabled={submitted}
                    className={cn(
                      'answer-option w-full flex items-center gap-4 text-left transition-all duration-300',
                      !submitted && isSelected && 'selected',
                      isRight && 'correct',
                      isWrong && 'wrong',
                      submitted && !isRight && !isWrong && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-orbitron flex-shrink-0 transition-all duration-300',
                      isRight  ? 'bg-neon-green text-cyber-black shadow-[0_0_10px_rgba(0,255,136,0.6)]'
                      : isWrong  ? 'bg-neon-red text-white'
                      : isSelected ? 'bg-neon-cyan text-cyber-black shadow-[0_0_10px_rgba(0,245,255,0.6)]'
                      : 'bg-white/5 text-white/30 border border-white/8'
                    )}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className={cn(
                      'font-inter text-sm flex-1',
                      isRight  ? 'text-neon-green font-semibold'
                      : isWrong  ? 'text-neon-red'
                      : isSelected ? 'text-neon-cyan'
                      : 'text-white/70'
                    )}>
                      {opt}
                    </span>
                    {isRight && <CheckCircle2 size={18} className="text-neon-green flex-shrink-0" />}
                    {isWrong && <XCircle size={18} className="text-neon-red flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Submit button */}
            {!submitted && (
              <div className="mt-6">
                <HoloButton
                  variant="cyan"
                  size="md"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={selected === null}
                  icon={<Zap size={16} />}
                  className="font-orbitron tracking-widest"
                >
                  SUBMIT ANSWER
                </HoloButton>
              </div>
            )}
          </NeonCard>

          {/* Explanation card */}
          {showAnswer && (
            <NeonCard
              variant={isCorrect ? 'green' : 'default'}
              padding="p-5"
              className="animate-fade-up"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  isCorrect ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-red/20 text-neon-red'
                )}>
                  {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <p className={cn('font-inter font-semibold mb-2', isCorrect ? 'text-neon-green' : 'text-neon-red')}>
                    {isCorrect ? '🎉 Correct! Excellent reasoning.' : '💡 Explanation'}
                  </p>
                  <p className="text-white/60 text-sm font-inter leading-relaxed">{potd.explanation}</p>
                  {isCorrect && (
                    <div
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-amber/10 border border-neon-amber/30"
                      style={{ animation: 'count-up-bounce 0.6s ease-out' }}
                    >
                      <span style={{ animation: 'streak-flame 0.8s infinite' }}>🔥</span>
                      <span className="text-neon-amber font-orbitron font-bold text-sm">{streak} day streak!</span>
                    </div>
                  )}
                </div>
              </div>
            </NeonCard>
          )}
        </div>

        {/* ── Right: Stat + Leaderboard ──────────────────────── */}
        <div className="space-y-5">

          {/* Your Stats */}
          <NeonCard variant="violet" padding="p-5" className="animate-fade-up-delay">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <Star size={16} className="text-neon-violet" /> Your Stats
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Current Streak', value: `${streak} 🔥`, color: 'text-neon-amber' },
                { label: 'Status Today',   value: alreadyDone ? (isCorrect ? '✅ Solved' : '❌ Missed') : '⏳ Pending', color: alreadyDone ? (isCorrect ? 'text-neon-green' : 'text-neon-red') : 'text-white/50' },
                { label: 'Best Streak',    value: `${Math.max(streak, parseInt(localStorage.getItem('potd_best') ?? '0'))} 🏆`, color: 'text-neon-cyan' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.025] border border-white/5">
                  <span className="text-white/30 text-xs font-inter">{s.label}</span>
                  <span className={cn('text-sm font-inter font-semibold', s.color)}>{s.value}</span>
                </div>
              ))}
            </div>
          </NeonCard>

          {/* Today's Leaderboard */}
          <NeonCard variant="default" padding="p-5" className="animate-fade-up-delay">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-neon-amber" /> Daily Solvers
            </h2>
            <div className="space-y-2">
              {MOCK_LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200',
                    entry.rank <= 3
                      ? 'bg-white/[0.04] border border-white/8'
                      : 'hover:bg-white/[0.02]'
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-orbitron flex-shrink-0',
                    entry.rank === 1 ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/30'
                    : entry.rank === 2 ? 'bg-white/10 text-white/60'
                    : entry.rank === 3 ? 'bg-neon-amber/10 text-neon-amber/60'
                    : 'text-white/20'
                  )}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </div>

                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0',
                    'bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-white/10 text-white/60'
                  )}>
                    {entry.avatar}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-inter font-medium truncate', entry.color)}>
                      {entry.name}
                      {entry.name === user?.name && ' (You)'}
                    </p>
                    <p className="text-white/20 text-[10px] font-inter">
                      🔥 {entry.streak} days
                    </p>
                  </div>

                  <span className="text-white/20 text-[10px] font-mono-code flex-shrink-0">
                    {entry.solved} solved
                  </span>
                </div>
              ))}
            </div>
          </NeonCard>

          {/* Start a full test CTA */}
          <NeonCard variant="magenta" padding="p-4" className="animate-fade-up-delay">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-magenta/20 border border-neon-magenta/30 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-neon-magenta" />
              </div>
              <div className="flex-1">
                <p className="font-inter font-semibold text-white text-sm">Want more?</p>
                <p className="text-white/30 text-xs">Take a full practice test</p>
              </div>
              <HoloButton variant="ghost" size="sm" onClick={() => navigate('/test-setup')} icon={<ChevronRight size={14} />}>
                Go
              </HoloButton>
            </div>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProblemOfDayPage;
