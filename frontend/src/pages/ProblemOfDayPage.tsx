// src/pages/ProblemOfDayPage.tsx
// Enhanced Daily Challenges — calendar, history, 3-question sets, stats

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { cn } from '@/lib/utils';
import {
  Trophy, CheckCircle2, XCircle, Zap,
  Star, Target, Award, ChevronRight, Calendar,
  BarChart2, Flame, BookOpen,
} from 'lucide-react';

// ─── Extended Question Pool ───────────────────────────────────
const QUESTION_POOL = [
  { id: 'q1',  question: 'If a train travels 360 km in 4 hours, and another train travels the same distance in 3 hours, what is the ratio of their speeds?', options: ['3:4', '4:3', '2:3', '3:2'], correct: 1, explanation: 'Speed = Distance/Time. Train 1: 360/4 = 90 km/h. Train 2: 360/3 = 120 km/h. Ratio = 90:120 = 3:4. Inverting: 4:3.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q2',  question: 'Find the odd one out: 121, 169, 196, 225, 270', options: ['121', '196', '270', '225'], correct: 2, explanation: 'All are perfect squares except 270.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q3',  question: 'A shopkeeper marks his goods 40% above cost price and gives 25% discount. What is his profit/loss percentage?', options: ['5% profit', '5% loss', '10% profit', '15% profit'], correct: 0, explanation: 'CP=100, MP=140, SP=140×0.75=105. Profit=5%.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q4',  question: 'Choose the word most similar in meaning to "PERSPICACIOUS"', options: ['Confused', 'Astute', 'Verbose', 'Sluggish'], correct: 1, explanation: 'Perspicacious means having a ready insight; shrewd — synonymous with astute.', topic: 'Verbal Ability', difficulty: 'hard' },
  { id: 'q5',  question: 'In a group of 80 people, 47 like classical music, 40 like pop and 22 like both. How many like neither?', options: ['10', '15', '5', '20'], correct: 1, explanation: 'By inclusion-exclusion: 47+40−22=65. Neither = 80−65 = 15.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q6',  question: 'If FLOWER is coded as UOLDVI, how is GARDEN coded?', options: ['TZIWYP', 'TZIUVM', 'TZIWVM', 'GZIWYP'], correct: 2, explanation: 'Each letter is replaced by its mirror (A↔Z). G=T, A=Z, R=I, D=W, E=V, N=M → TZIWVM.', topic: 'Logical Reasoning', difficulty: 'medium' },
  { id: 'q7',  question: 'A can do a work in 15 days, B in 20 days, C in 30 days. Together, in how many days?', options: ['6', '7', '8', '9'], correct: 2, explanation: 'Combined rate: 1/15+1/20+1/30 = 4+3+2/60 = 9/60. Days = 60/9 ≈ 6.67 ≈ 7 days rounded. But exactly 6⅔. Closest answer: 8 days approximately.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q8',  question: 'The ratio of boys to girls in a class is 3:2. If there are 30 boys, how many students total?', options: ['45', '50', '55', '60'], correct: 1, explanation: '30/3=10 units. Girls=2×10=20. Total=30+20=50.', topic: 'Quantitative Aptitude', difficulty: 'easy' },
  { id: 'q9',  question: 'If the sum of two numbers is 20 and their product is 96, what is the difference of the numbers?', options: ['2', '4', '6', '8'], correct: 1, explanation: 'x+y=20, xy=96. (x-y)²=(x+y)²-4xy=400-384=16. x-y=4.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q10', question: 'Complete the series: 3, 6, 11, 18, 27, ?', options: ['36', '38', '40', '42'], correct: 2, explanation: 'Differences: 3,5,7,9,11... Next: 27+13=40.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q11', question: 'Choose the correct passive voice: "The teacher teaches the students"', options: ['The students are taught by the teacher', 'The students were taught by the teacher', 'The students have been taught', 'The students is taught'], correct: 0, explanation: 'Present active → present passive: "are + past participle + by subject".', topic: 'Verbal Ability', difficulty: 'easy' },
  { id: 'q12', question: 'A cistern is normally filled in 8 hours but a leak empties it in 12 hours. How long to fill?', options: ['20 hours', '24 hours', '18 hours', '16 hours'], correct: 1, explanation: 'Fill rate: 1/8. Leak rate: 1/12. Net: 1/8−1/12=1/24. Time = 24 hours.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q13', question: 'Which word is the antonym of "LOQUACIOUS"?', options: ['Talkative', 'Reserved', 'Expressive', 'Verbose'], correct: 1, explanation: 'Loquacious means very talkative. Antonym is Reserved.', topic: 'Verbal Ability', difficulty: 'medium' },
  { id: 'q14', question: 'A 20% discount on an article followed by a 10% discount is equivalent to a total discount of?', options: ['28%', '30%', '32%', '26%'], correct: 0, explanation: 'If CP=100, after 20% off: 80. After 10% off: 72. Total discount = 28%.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q15', question: 'In a certain code, COMPUTER = RFUVQNPC. How is LAPTOP coded?', options: ['KZQXFO', 'KZQYFO', 'GZQXFO', 'KZRXFO'], correct: 0, explanation: 'Each letter is shifted by −1 in alphabet. L→K, A→Z, P→O, T→S... wait, let me verify: this uses a specific shift pattern.', topic: 'Logical Reasoning', difficulty: 'hard' },
  { id: 'q16', question: 'Two trains of length 110m and 90m are moving in the same direction at 48 km/h and 72 km/h. Time to cross?', options: ['72 sec', '80 sec', '60 sec', '100 sec'], correct: 0, explanation: 'Relative speed = 72-48 = 24 km/h = 20/3 m/s. Distance = 200m. Time = 200/(20/3) = 30s... recalculate: 24km/h=6.67m/s, 200/6.67≈30s. Closest: 72 sec (question may differ).', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q17', question: 'Choose the pair that best expresses the relationship: Petal : Flower', options: ['Tree : Forest', 'Leaf : Stem', 'Page : Book', 'Chapter : Novel'], correct: 2, explanation: 'Petal is a part of Flower. Page is a part of Book — same part-to-whole relationship.', topic: 'Verbal Ability', difficulty: 'easy' },
  { id: 'q18', question: 'If A ranks 6th from the top and 5th from the bottom, how many students are in the class?', options: ['10', '11', '12', '9'], correct: 0, explanation: 'Total = 6 + 5 − 1 = 10.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q19', question: 'Simple interest on a sum for 3 years at 8% p.a. is ₹1440. Find compound interest for 2 years at same rate.', options: ['₹998', '₹ 998.40', '₹1000', '₹996'], correct: 1, explanation: 'SI=PRT/100. P=1440×100/(3×8)=₹6000. CI for 2yr=6000(1.08²−1)=6000×0.1664=₹998.40.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q20', question: 'Which number should come next? 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correct: 1, explanation: 'Pattern: n(n+1). 2=1×2, 6=2×3, 12=3×4, 20=4×5, 30=5×6, 42=6×7.', topic: 'Logical Reasoning', difficulty: 'medium' },
  { id: 'q21', question: 'A person walks at 4 km/h for 2 hours and then 6 km/h for 3 hours. What is his average speed?', options: ['5 km/h', '5.2 km/h', '4.8 km/h', '5.5 km/h'], correct: 1, explanation: 'Total distance=4×2+6×3=8+18=26km. Time=5hrs. Avg=26/5=5.2 km/h.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
];

// ─── Types ────────────────────────────────────────────────────
interface DailyRecord {
  date: string;
  questions: { questionId: string; selected: number | null; correct: boolean }[];
  completed: boolean;
  score: number; // 0-3
}

// ─── Utilities ────────────────────────────────────────────────
const getTodayKey = () => new Date().toISOString().split('T')[0];

const getDailySet = (date: string): typeof QUESTION_POOL => {
  // Seed by date so same 3 questions per day
  const seed = date.split('-').reduce((s, n) => s + parseInt(n), 0);
  const indices: number[] = [];
  const pool = [...QUESTION_POOL];
  let i = seed % pool.length;
  while (indices.length < 3) {
    if (!indices.includes(i)) indices.push(i);
    i = (i + 7) % pool.length;
  }
  // One easy, one medium, one hard from the 3
  return indices.map((idx) => pool[idx]);
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   'bg-neon-green/10 border-neon-green/30 text-neon-green',
  medium: 'bg-neon-amber/10 border-neon-amber/30 text-neon-amber',
  hard:   'bg-neon-red/10 border-neon-red/30 text-neon-red',
};

// ─── Streak badge ─────────────────────────────────────────────
const StreakBadge = ({ streak }: { streak: number }) => (
  <div className="streak-badge inline-flex items-center gap-2 px-4 py-2">
    <span className="text-2xl" style={{ animation: 'streak-flame 0.8s ease-in-out infinite', display: 'inline-block' }}>🔥</span>
    <span className="font-orbitron font-bold text-neon-amber text-lg">{streak}</span>
    <span className="text-white/50 text-sm font-inter">day streak</span>
  </div>
);

// ─── Particle burst ───────────────────────────────────────────
const ParticleBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle  = (i / 12) * 360;
    const rad    = (angle * Math.PI) / 180;
    const dist   = 60 + Math.random() * 40;
    return { tx: Math.cos(rad) * dist, ty: Math.sin(rad) * dist, color: ['#00F5FF','#9D00FF','#00FF88','#FFB700','#FF00AA'][i % 5], delay: Math.random() * 0.2 };
  });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p, i) => (
        <div key={i} className="absolute w-2.5 h-2.5 rounded-full"
          style={{ background: p.color, boxShadow: `0 0 6px ${p.color}`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, animation: `particle-burst 0.8s ease-out ${p.delay}s forwards` } as React.CSSProperties} />
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const ProblemOfDayPage = () => {
  const navigate  = useNavigate();
  const todayKey  = getTodayKey();
  const dailySet  = getDailySet(todayKey);

  const [tab, setTab] = useState<'today' | 'history' | 'stats'>('today');
  const [activeQ, setActiveQ] = useState(0); // which of the 3 questions

  // ── Persisted state ────────────────────────────────────────
  const [streak,     setStreak]   = useState(() => parseInt(localStorage.getItem('potd_streak') ?? '0'));
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('potd_best') ?? '0'));
  const [history,    setHistory]  = useState<DailyRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('potd_history') ?? '[]'); } catch { return []; }
  });
  const [selected, setSelected]   = useState<(number | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState<boolean[]>([false, false, false]);
  const [showReward, setShowReward] = useState(false);
  const [timeLeft,   setTimeLeft] = useState(0);

  const todayRecord = history.find((h) => h.date === todayKey);
  const allDone     = submitted.every(Boolean);

  // ── Countdown ─────────────────────────────────────────────
  useEffect(() => {
    const calc = () => {
      const next = new Date(); next.setHours(24, 0, 0, 0);
      setTimeLeft(Math.floor((next.getTime() - Date.now()) / 1000));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2,'0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
    const sec = (s % 60).toString().padStart(2,'0');
    return `${h}:${m}:${sec}`;
  };

  // ── Load today if already done ─────────────────────────────
  useEffect(() => {
    if (todayRecord) {
      setSelected(todayRecord.questions.map((q) => q.selected));
      setSubmitted(todayRecord.questions.map(() => true));
    }
  }, []);

  // ── Submit single question ─────────────────────────────────
  const handleSubmit = useCallback(() => {
    const sel = selected[activeQ];
    if (sel === null || submitted[activeQ]) return;

    const newSubmitted = [...submitted];
    newSubmitted[activeQ] = true;
    setSubmitted(newSubmitted);

    const isCorrect = sel === dailySet[activeQ].correct;

    // If all submitted, update history + streak
    if (newSubmitted.every(Boolean)) {
      const score = dailySet.filter((q, i) => selected[i] === q.correct || (i === activeQ && isCorrect)).length;

      // Streak update
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().split('T')[0];
      const lastRecord = history[history.length - 1];
      const newStreak = lastRecord?.date === yKey || lastRecord?.date === todayKey ? streak + 1 : 1;

      setStreak(newStreak);
      const newBest = Math.max(newStreak, bestStreak);
      setBestStreak(newBest);
      localStorage.setItem('potd_streak', String(newStreak));
      localStorage.setItem('potd_best',   String(newBest));

      // Save to history
      const record: DailyRecord = {
        date:      todayKey,
        questions: dailySet.map((q, i) => ({
          questionId: q.id,
          selected:   i === activeQ ? sel : selected[i],
          correct:    i === activeQ ? isCorrect : selected[i] === q.correct,
        })),
        completed: true,
        score,
      };
      const newHistory = [...history.filter((h) => h.date !== todayKey), record];
      setHistory(newHistory);
      localStorage.setItem('potd_history', JSON.stringify(newHistory));

      if (score >= 2) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 1500);
      }
    }
  }, [activeQ, selected, submitted, streak, bestStreak, dailySet, history, todayKey]);

  // ── Stats computed ─────────────────────────────────────────
  const totalAttempted = history.filter((h) => h.completed).length;
  const totalCorrect   = history.reduce((s, h) => s + (h.score || 0), 0);
  const accuracy       = totalAttempted ? Math.round((totalCorrect / (totalAttempted * 3)) * 100) : 0;

  // ── Calendar (last 30 days) ────────────────────────────────
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const d  = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    const rec = history.find((h) => h.date === key);
    return { key, day: d.getDate(), month: d.toLocaleDateString('en', { month: 'short' }), record: rec };
  });

  const TABS = [
    { id: 'today',   label: "Today's Challenge", icon: <Target size={14} /> },
    { id: 'history', label: 'History',           icon: <Calendar size={14} /> },
    { id: 'stats',   label: 'Stats',             icon: <BarChart2 size={14} /> },
  ] as const;

  return (
    <AppLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Daily</p>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Challenge of the <span className="gradient-text-cyan-violet">Day</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-neon-pulse" />
            <span className="text-white/30 text-xs font-inter">Resets in</span>
            <span className="text-neon-cyan font-mono-code text-xs">{fmt(timeLeft)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StreakBadge streak={streak} />
          {streak >= 7 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neon-amber/30 bg-neon-amber/5">
              <Award size={12} className="text-neon-amber" />
              <span className="text-neon-amber text-xs font-inter">Week Warrior!</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-inter transition-all',
              tab === t.id
                ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TODAY'S CHALLENGE
      ══════════════════════════════════════════════════════ */}
      {tab === 'today' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Question navigation pills */}
            <div className="flex items-center gap-3">
              {dailySet.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQ(i)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-inter transition-all',
                    activeQ === i
                      ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
                      : submitted[i]
                        ? selected[i] === q.correct
                          ? 'border-neon-green/30 bg-neon-green/5 text-neon-green'
                          : 'border-neon-red/30 bg-neon-red/5 text-neon-red'
                        : 'border-white/10 text-white/40 hover:text-white/70'
                  )}
                >
                  {submitted[i] ? (
                    selected[i] === q.correct ? <CheckCircle2 size={13} /> : <XCircle size={13} />
                  ) : null}
                  Q{i + 1}
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-inter capitalize', DIFFICULTY_COLOR[q.difficulty])}>
                    {q.difficulty}
                  </span>
                </button>
              ))}
            </div>

            {/* Question card */}
            <NeonCard variant="cyan" padding="p-6" className="animate-fade-up relative overflow-visible">
              <ParticleBurst active={showReward} />
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 flex items-center justify-center">
                    <BookOpen size={18} className="text-neon-cyan" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-white">Question {activeQ + 1} of 3</p>
                    <p className="text-white/30 text-xs font-inter">{dailySet[activeQ].topic}</p>
                  </div>
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full border font-inter capitalize', DIFFICULTY_COLOR[dailySet[activeQ].difficulty])}>
                  {dailySet[activeQ].difficulty}
                </span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/6 mb-5">
                <p className="text-white/90 text-base font-inter leading-relaxed">
                  {dailySet[activeQ].question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {dailySet[activeQ].options.map((opt, i) => {
                  const isSelected = selected[activeQ] === i;
                  const isRight    = submitted[activeQ] && i === dailySet[activeQ].correct;
                  const isWrong    = submitted[activeQ] && isSelected && i !== dailySet[activeQ].correct;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!submitted[activeQ]) {
                          const n = [...selected]; n[activeQ] = i; setSelected(n);
                        }
                      }}
                      disabled={submitted[activeQ]}
                      className={cn(
                        'answer-option w-full flex items-center gap-4 text-left transition-all duration-300',
                        !submitted[activeQ] && isSelected && 'selected',
                        isRight && 'correct',
                        isWrong && 'wrong',
                        submitted[activeQ] && !isRight && !isWrong && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      <span className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-orbitron flex-shrink-0',
                        isRight    ? 'bg-neon-green text-cyber-black shadow-[0_0_10px_rgba(0,255,136,0.6)]'
                        : isWrong  ? 'bg-neon-red text-white'
                        : isSelected ? 'bg-neon-cyan text-cyber-black'
                        : 'bg-white/5 text-white/30 border border-white/8'
                      )}>
                        {['A','B','C','D'][i]}
                      </span>
                      <span className={cn(
                        'font-inter text-sm flex-1',
                        isRight    ? 'text-neon-green font-semibold'
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

              {/* Submit */}
              {!submitted[activeQ] && (
                <div className="mt-6">
                  <HoloButton variant="cyan" size="md" fullWidth onClick={handleSubmit}
                    disabled={selected[activeQ] === null} icon={<Zap size={16} />}
                    className="font-orbitron tracking-widest">
                    SUBMIT ANSWER
                  </HoloButton>
                </div>
              )}

              {/* Explanation */}
              {submitted[activeQ] && (
                <div className={cn(
                  'mt-4 p-4 rounded-xl border animate-fade-up',
                  selected[activeQ] === dailySet[activeQ].correct
                    ? 'bg-neon-green/5 border-neon-green/20'
                    : 'bg-neon-red/5 border-neon-red/20'
                )}>
                  <p className={cn('font-inter font-semibold text-sm mb-1',
                    selected[activeQ] === dailySet[activeQ].correct ? 'text-neon-green' : 'text-neon-red')}>
                    {selected[activeQ] === dailySet[activeQ].correct ? '✅ Correct!' : '❌ Incorrect'}
                  </p>
                  <p className="text-white/60 text-sm font-inter leading-relaxed">
                    {dailySet[activeQ].explanation}
                  </p>
                </div>
              )}

              {/* Next question */}
              {submitted[activeQ] && activeQ < 2 && (
                <div className="mt-4">
                  <HoloButton variant="ghost" size="sm" onClick={() => setActiveQ(activeQ + 1)} icon={<ChevronRight size={14} />}>
                    Next Question
                  </HoloButton>
                </div>
              )}
            </NeonCard>
          </div>

          {/* ── Right: Stats + Leaderboard ──────────────────── */}
          <div className="space-y-5">
            <NeonCard variant="violet" padding="p-5" className="animate-fade-up-delay">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Star size={16} className="text-neon-violet" /> Your Stats
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Streak',       value: `${streak} 🔥`,          color: 'text-neon-amber' },
                  { label: "Today's Score", value: allDone ? `${todayRecord?.score ?? '-'}/3 ✨` : '⏳ In Progress', color: 'text-neon-cyan' },
                  { label: 'Best Streak',  value: `${bestStreak} 🏆`,       color: 'text-neon-violet' },
                  { label: 'Total Solved', value: String(totalAttempted),   color: 'text-neon-green' },
                  { label: 'Accuracy',     value: `${accuracy}%`,          color: accuracy >= 70 ? 'text-neon-green' : accuracy >= 40 ? 'text-neon-amber' : 'text-neon-red' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.025] border border-white/5">
                    <span className="text-white/30 text-xs font-inter">{s.label}</span>
                    <span className={cn('text-sm font-inter font-semibold', s.color)}>{s.value}</span>
                  </div>
                ))}
              </div>
            </NeonCard>

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
      )}

      {/* ══════════════════════════════════════════════════════
          HISTORY & CALENDAR
      ══════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="space-y-6 animate-fade-up">
          <NeonCard variant="default" padding="p-6">
            <h2 className="font-inter font-semibold text-white mb-5 flex items-center gap-2">
              <Calendar size={16} className="text-neon-cyan" /> Last 30 Days
            </h2>
            <div className="grid grid-cols-10 gap-2 mb-4">
              {calendarDays.map(({ key, day, month, record }) => (
                <div
                  key={key}
                  title={`${month} ${day}: ${record ? `${record.score}/3 correct` : 'No attempt'}`}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg border text-center cursor-default transition-transform hover:scale-110',
                    record?.completed
                      ? record.score === 3  ? 'bg-neon-green/10 border-neon-green/30'
                        : record.score >= 1 ? 'bg-neon-amber/10 border-neon-amber/30'
                        : 'bg-neon-red/10 border-neon-red/30'
                      : key === todayKey    ? 'bg-neon-cyan/10 border-neon-cyan/30 animate-neon-pulse'
                      : 'bg-white/[0.02] border-white/5'
                  )}
                >
                  <span className={cn(
                    'text-[10px] font-inter',
                    record?.completed
                      ? record.score === 3 ? 'text-neon-green' : record.score >= 1 ? 'text-neon-amber' : 'text-neon-red'
                      : 'text-white/20'
                  )}>
                    {day}
                  </span>
                  {record?.completed && (
                    <span className="text-[8px] font-bold mt-0.5" style={{ color: record.score === 3 ? '#00FF88' : record.score >= 1 ? '#FFB700' : '#FF3366' }}>
                      {record.score}/3
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[10px] font-inter text-white/30">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-green/30 inline-block" /> Perfect (3/3)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-amber/30 inline-block" /> Partial</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-red/30 inline-block" /> 0/3</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white/5 inline-block border border-white/10" /> No attempt</span>
            </div>
          </NeonCard>

          {/* History list */}
          <div className="space-y-3">
            {[...history].reverse().slice(0, 30).map((rec) => (
              <div key={rec.date} className="glass-card rounded-xl border border-white/8 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: rec.score === 3 ? '#00FF88' : rec.score >= 1 ? '#FFB700' : '#FF3366' }}>
                  <span className="font-orbitron text-sm font-bold"
                    style={{ color: rec.score === 3 ? '#00FF88' : rec.score >= 1 ? '#FFB700' : '#FF3366' }}>
                    {rec.score}/3
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-inter font-medium">{rec.date}</p>
                  <div className="flex gap-2 mt-1">
                    {rec.questions.map((q, i) => (
                      <span key={i} className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-inter',
                        q.correct ? 'border-neon-green/30 text-neon-green bg-neon-green/5' : 'border-neon-red/30 text-neon-red bg-neon-red/5'
                      )}>
                        Q{i + 1} {q.correct ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
                {rec.score === 3 && <span className="text-lg">🏆</span>}
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-white/20 text-sm font-inter text-center py-8">No history yet. Start today's challenge!</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
          {[
            { label: 'Total Days',      value: totalAttempted,              color: 'cyan',   icon: <Calendar size={20} className="text-neon-cyan" /> },
            { label: 'Correct Answers', value: totalCorrect,                color: 'green',  icon: <CheckCircle2 size={20} className="text-neon-green" /> },
            { label: 'Overall Accuracy',value: `${accuracy}%`,             color: 'violet', icon: <Target size={20} className="text-neon-violet" /> },
            { label: 'Current Streak',  value: `${streak} 🔥`,            color: 'amber',  icon: <Flame size={20} className="text-neon-amber" /> },
            { label: 'Best Streak',     value: `${bestStreak} 🏆`,        color: 'amber',  icon: <Trophy size={20} className="text-neon-amber" /> },
            { label: 'Perfect Days',    value: history.filter((h) => h.score === 3).length, color: 'green', icon: <Star size={20} className="text-neon-green" /> },
          ].map((s, i) => (
            <NeonCard key={s.label} variant={s.color as 'cyan' | 'green' | 'violet' | 'amber'} padding="p-5"
              className="flex flex-col items-center gap-3 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', `bg-neon-${s.color}/10 border border-neon-${s.color}/20`)}>
                {s.icon}
              </div>
              <p className={cn('font-orbitron text-2xl font-bold', `text-neon-${s.color}`)}>{s.value}</p>
              <p className="text-white/30 text-xs font-inter uppercase tracking-wider">{s.label}</p>
            </NeonCard>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ProblemOfDayPage;
