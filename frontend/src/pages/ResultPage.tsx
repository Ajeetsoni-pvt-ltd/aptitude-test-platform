// src/pages/ResultPage.tsx
// Dramatic score reveal + holographic result breakdown

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import ProgressRing from '@/components/ui/ProgressRing';
import { RotateCcw, LayoutDashboard, BarChart3, Share2, AlertTriangle, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);

  const state = location.state as {
    result: {
      attemptId: string;
      score: number;
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      skippedCount: number;
      topicPerformance: Record<string, { correct: number; total: number }>;
    };
    title: string;
    isAutoSubmit?: boolean;
  } | null;

  useEffect(() => {
    if (!state?.result) { navigate('/dashboard', { replace: true }); return; }
    const t = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(t);
  }, [state, navigate]);

  if (!state?.result) return null;

  const { result, title, isAutoSubmit } = state;
  const { score, totalQuestions, correctCount, incorrectCount, skippedCount, topicPerformance } = result;

  const scoreColor: 'green' | 'cyan' | 'amber' | 'red' =
    score >= 80 ? 'green' : score >= 60 ? 'cyan' : score >= 40 ? 'amber' : 'red';

  const grade =
    score >= 80 ? 'NEURAL-GRADE' :
    score >= 60 ? 'PROFICIENT'   :
    score >= 40 ? 'AVERAGE'      : 'NEEDS WORK';

  const gradeColor =
    score >= 80 ? 'text-neon-green' :
    score >= 60 ? 'text-neon-cyan'  :
    score >= 40 ? 'text-neon-amber' : 'text-neon-red';

  const gradeDesc =
    score >= 80 ? 'Outstanding performance. You are exam-ready!' :
    score >= 60 ? 'Solid result. A bit more practice and you\'ll ace it.' :
    score >= 40 ? 'Average result. Focus on weak areas consistently.' :
                  'Keep at it. Every attempt strengthens your neural network.';

  return (
    <div className="min-h-screen bg-cyber-black relative flex flex-col items-center justify-center p-4 py-12 overflow-hidden">

      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${score >= 60 ? '#00F5FF' : '#FF3366'}, transparent 65%)` }} />
        <div className="absolute inset-0 cyber-grid opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">

        {/* Auto-submit banner */}
        {isAutoSubmit && (
          <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-neon-amber/8 border border-neon-amber/25 animate-fade-in">
            <AlertTriangle size={16} className="text-neon-amber flex-shrink-0" />
            <p className="text-neon-amber text-sm font-inter">Time expired — test was auto-submitted.</p>
          </div>
        )}

        {/* ── Score reveal card ──────────────────────────── */}
        <NeonCard variant={scoreColor} padding="p-8" className="text-center mb-6 overflow-hidden">
          {/* Header stripe */}
          <div className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            score >= 80 ? 'bg-gradient-to-r from-transparent via-neon-green to-transparent' :
            score >= 60 ? 'bg-gradient-to-r from-transparent via-neon-cyan to-transparent'  :
            score >= 40 ? 'bg-gradient-to-r from-transparent via-neon-amber to-transparent' :
                          'bg-gradient-to-r from-transparent via-neon-red to-transparent'
          )} />

          <div className="mb-2 text-white/25 text-xs font-inter uppercase tracking-widest">Test Complete</div>
          <h1 className="font-orbitron text-lg font-bold text-white mb-6 px-4 truncate">{title}</h1>

          {/* Score ring */}
          <div className={cn('flex justify-center mb-6', revealed ? 'animate-score-reveal' : 'opacity-0')}>
            <ProgressRing
              value={score}
              size={180}
              strokeWidth={10}
              color={scoreColor}
              label="Score"
            />
          </div>

          {/* Grade */}
          <div className={cn('font-orbitron text-2xl font-bold mb-2', gradeColor, revealed && 'animate-fade-up')}>
            {grade}
          </div>
          <p className="text-white/40 text-sm font-inter mb-6">{gradeDesc}</p>

          {/* Breakdown row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Correct',  value: correctCount,   questions: totalQuestions, color: 'neon-green',   icon: '✓' },
              { label: 'Wrong',    value: incorrectCount,  questions: totalQuestions, color: 'neon-red',     icon: '✗' },
              { label: 'Skipped',  value: skippedCount,    questions: totalQuestions, color: 'neon-amber',   icon: '↷' },
            ].map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  'rounded-xl p-4 border transition-all duration-300',
                  `bg-${item.color}/5 border-${item.color}/20`,
                  revealed && 'animate-fade-up'
                )}
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <p className={cn('text-3xl font-orbitron font-bold', `text-${item.color}`)}>{item.value}</p>
                <p className="text-white/30 text-xs font-inter mt-1">{item.icon} {item.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap justify-center mt-6">
            <HoloButton variant="violet" size="md" onClick={() => navigate(`/solutions/${result.attemptId}`)} icon={<Star size={15} />}>
              Review Solutions
            </HoloButton>
            <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')} icon={<RotateCcw size={15} />}>
              New Test
            </HoloButton>
            <HoloButton variant="ghost" size="md" onClick={() => navigate('/analysis')} icon={<BarChart3 size={15} />}>
              Analytics
            </HoloButton>
            <HoloButton variant="ghost" size="md" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard size={15} />}>
              Dashboard
            </HoloButton>
          </div>
        </NeonCard>

        {/* ── Topic Performance ──────────────────────────── */}
        {Object.keys(topicPerformance).length > 0 && (
          <NeonCard variant="default" padding="p-6" className="mb-6 animate-fade-up-delay">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-neon-cyan" />
              Topic Breakdown
            </h2>
            <div className="space-y-4">
              {Object.entries(topicPerformance).map(([topic, perf]) => {
                const pct = Math.round((perf.correct / perf.total) * 100);
                const barColor = pct >= 70 ? '#00FF88' : pct >= 40 ? '#FFB700' : '#FF3366';
                return (
                  <div key={topic}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white/60 text-sm font-inter">{topic}</span>
                      <span className="font-mono-code text-sm font-semibold" style={{ color: barColor }}>
                        {perf.correct}/{perf.total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: revealed ? `${pct}%` : '0%',
                          background: barColor,
                          boxShadow: `0 0 8px ${barColor}`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </NeonCard>
        )}

        {/* ── Holographic Certificate ─────────────────────── */}
        {score >= 60 && (
          <NeonCard variant="amber" padding="p-6" className="animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-neon-amber/15 border border-neon-amber/30 flex items-center justify-center flex-shrink-0 animate-float">
                {score >= 80 ? <Trophy size={28} className="text-neon-amber" /> : <Star size={28} className="text-neon-amber" />}
              </div>
              <div className="flex-1">
                <p className="font-orbitron text-sm font-bold text-neon-amber">
                  {score >= 80 ? 'EXCELLENCE CERTIFICATE' : 'COMPLETION CERTIFICATE'}
                </p>
                <p className="text-white/35 text-xs font-inter mt-1">
                  Awarded for scoring {score}% on {title}
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-neon-amber/60 hover:text-neon-amber text-xs font-inter transition-colors">
                <Share2 size={13} /> Share
              </button>
            </div>
          </NeonCard>
        )}
      </div>
    </div>
  );
};

export default ResultPage;