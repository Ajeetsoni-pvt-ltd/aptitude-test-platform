// src/pages/TestPage.tsx
// Futuristic full-screen test interface

import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useFullscreen from '@/hooks/useFullscreen';
import useAntiCheat  from '@/hooks/useAntiCheat';
import useTimer      from '@/hooks/useTimer';
import { submitTestApi } from '@/api/testApi';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';
import HoloButton from '@/components/ui/HoloButton';
import ProgressRing from '@/components/ui/ProgressRing';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Zap, Maximize, Minimize } from 'lucide-react';

type AnswerMap = Record<string, string>;

// ── Question navigator button ───────────────────────────────────
const NavBtn = ({ index, isCurrent, isAnswered, onClick }: {
  index: number; isCurrent: boolean; isAnswered: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-9 h-9 rounded-lg text-xs font-bold font-orbitron transition-all duration-200 border',
      isCurrent  && 'bg-neon-cyan text-cyber-black border-neon-cyan shadow-[0_0_12px_rgba(0,245,255,0.6)] scale-110',
      isAnswered && !isCurrent && 'bg-neon-green/15 text-neon-green border-neon-green/40',
      !isCurrent && !isAnswered && 'bg-white/[0.03] text-white/30 border-white/8 hover:border-white/25 hover:text-white/60'
    )}
  >
    {index + 1}
  </button>
);

// ── Pre-start screen ────────────────────────────────────────────
const PreScreen = ({ title, questionCount, totalTime, onStart }: {
  title: string; questionCount: number; totalTime: number; onStart: () => void;
}) => (
  <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #00F5FF, transparent 65%)' }} />
    </div>

    <div className="relative z-10 w-full max-w-md text-center animate-fade-up">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6
        bg-gradient-to-br from-neon-cyan/15 to-neon-violet/15
        border border-neon-cyan/30 shadow-[0_0_40px_rgba(0,245,255,0.2)] animate-float">
        <Zap size={36} className="text-neon-cyan" />
      </div>

      <h1 className="font-orbitron text-2xl font-bold text-white mb-2 tracking-wide">{title}</h1>
      <p className="text-white/30 text-sm font-inter mb-2">
        {questionCount} Neural Challenges · {totalTime / 60} Minutes
      </p>

      <div className="flex justify-center gap-8 my-6">
        {[
          { label: 'Questions', value: questionCount, color: 'text-neon-cyan' },
          { label: 'Minutes',   value: totalTime / 60, color: 'text-neon-amber' },
          { label: 'Points',    value: questionCount,  color: 'text-neon-green' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={cn('font-orbitron text-3xl font-bold', s.color)}>{s.value}</p>
            <p className="text-white/25 text-xs font-inter mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 border border-neon-amber/15 mb-6 text-left">
        <p className="text-neon-amber text-xs font-semibold mb-2 flex items-center gap-1.5">
          <AlertTriangle size={12} /> Neural Protocol
        </p>
        <ul className="space-y-1.5 text-white/35 text-xs font-inter">
          {[
            'Test launches in fullscreen mode',
            'Tab switching is detected and logged',
            'Auto-submits when time expires',
            'Session cannot be retaken',
          ].map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className="text-neon-amber/50">▸</span> {r}
            </li>
          ))}
        </ul>
      </div>

      <HoloButton
        variant="cyan"
        size="xl"
        fullWidth
        onClick={onStart}
        className="font-orbitron tracking-widest"
        icon={<Maximize size={18} />}
      >
        ENTER NEURAL TEST
      </HoloButton>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────
const TestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    attemptId:      string;
    questions:      Question[];
    title:          string;
    totalQuestions: number;
    totalTime:      number;
  } | null;

  useEffect(() => {
    if (!state?.attemptId) navigate('/test-setup', { replace: true });
  }, [state, navigate]);

  if (!state?.attemptId) return null;

  return (
    <TestContent
      attemptId={state.attemptId}
      questions={state.questions}
      title={state.title}
      totalTime={state.totalTime}
    />
  );
};

const TestContent = ({
  attemptId, questions, title, totalTime,
}: {
  attemptId: string; questions: Question[]; title: string; totalTime: number;
}) => {
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [started,     setStarted]     = useState(false);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [answers,     setAnswers]     = useState<AnswerMap>({});
  const [submitting,  setSubmitting]  = useState(false);

  const { warningCount, isWarningVisible, lastWarning, dismissWarning } =
    useAntiCheat(started);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      await exitFullscreen();
      try {
        const answersArray = questions.map((q) => ({
          questionId:     q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent:      Math.round(totalTime / questions.length),
        }));
        const res = await submitTestApi(attemptId, { answers: answersArray, totalTime });
        if (res.success && res.data) {
          navigate('/result', { state: { result: res.data, title, isAutoSubmit: auto }, replace: true });
        }
      } catch { setSubmitting(false); }
    },
    [answers, attemptId, exitFullscreen, submitting, navigate, questions, title, totalTime]
  );

  const { formattedTime, timeLeft } = useTimer(totalTime, () => handleSubmit(true));

  const q            = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress      = Math.round((answeredCount / questions.length) * 100);
  const isTimeCrit    = timeLeft <= 60;
  const letters       = ['A', 'B', 'C', 'D', 'E'];

  if (!started) {
    return (
      <PreScreen
        title={title}
        questionCount={questions.length}
        totalTime={totalTime}
        onStart={async () => { await enterFullscreen(); setStarted(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col overflow-hidden">

      {/* ── Anti-cheat warning ────────────────────────────── */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-strong rounded-2xl border border-neon-red/40 shadow-[0_0_40px_rgba(255,51,102,0.3)] p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-neon-red/15 border border-neon-red/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-neon-red" />
            </div>
            <h2 className="font-orbitron text-lg font-bold text-neon-red mb-2">Violation Detected</h2>
            <p className="text-white/60 text-sm font-inter mb-2">{lastWarning?.message}</p>
            <p className="text-neon-red/60 text-xs font-mono-code mb-6">
              Warning {warningCount}/3 {warningCount >= 3 && '— Further violations risk auto-submit'}
            </p>
            <HoloButton variant="danger" fullWidth onClick={dismissWarning}>
              Acknowledged — Resume Test
            </HoloButton>
          </div>
        </div>
      )}

      {/* ── Top bar ───────────────────────────────────────── */}
      <header className={cn(
        'flex items-center justify-between px-4 sm:px-6 h-14 border-b flex-shrink-0 backdrop-blur-sm',
        isTimeCrit
          ? 'border-neon-red/30 bg-neon-red/5'
          : 'border-white/5 bg-cyber-black/80'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center flex-shrink-0">
            <Zap size={13} className="text-cyber-black" />
          </div>
          <span className="font-orbitron text-sm font-bold text-white/70 hidden sm:block truncate max-w-xs">{title}</span>
        </div>

        {/* Timer */}
        <div className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-full border font-orbitron text-lg font-bold tracking-widest transition-all duration-300',
          isTimeCrit
            ? 'bg-neon-red/15 border-neon-red/40 text-neon-red shadow-[0_0_20px_rgba(255,51,102,0.4)] animate-neon-pulse'
            : 'bg-white/4 border-white/10 text-neon-cyan'
        )}>
          {formattedTime}
        </div>

        <div className="flex items-center gap-3">
          {warningCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-neon-red/15 border border-neon-red/30 text-neon-red font-mono-code animate-neon-pulse">
              ⚠ {warningCount}
            </span>
          )}
          <span className="text-white/30 text-xs font-mono-code hidden sm:block">
            {currentIdx + 1}/{questions.length}
          </span>
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <HoloButton
            variant="cyan"
            size="sm"
            onClick={() => handleSubmit(false)}
            loading={submitting}
            icon={<Send size={13} />}
          >
            Submit
          </HoloButton>
        </div>
      </header>

      {/* ── Progress bar ──────────────────────────────────── */}
      <div className="h-0.5 bg-white/5 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-all duration-500"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, boxShadow: '0 0 8px rgba(0,245,255,0.6)' }}
        />
      </div>

      {/* ── Main test area ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">

            {/* Q header */}
            <div className="flex items-center justify-between mb-6 animate-fade-up">
              <div className="flex items-center gap-2">
                <span className="text-white/20 text-xs font-mono-code uppercase tracking-widest">Question</span>
                <span className="font-orbitron text-2xl font-bold text-white">{currentIdx + 1}</span>
                <span className="text-white/20 font-mono-code text-sm">/ {questions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border font-inter font-medium capitalize',
                  q.difficulty === 'easy'   && 'bg-neon-green/10 border-neon-green/30 text-neon-green',
                  q.difficulty === 'medium' && 'bg-neon-amber/10 border-neon-amber/30 text-neon-amber',
                  q.difficulty === 'hard'   && 'bg-neon-red/10 border-neon-red/30 text-neon-red',
                )}>
                  {q.difficulty}
                </span>
                {answers[q._id] && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-inter">
                    Answered
                  </span>
                )}
              </div>
            </div>

            {/* Question text */}
            <div className="glass-card rounded-2xl p-6 border border-white/6 mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <p className="text-white/90 text-base sm:text-lg font-inter leading-relaxed">
                {q.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const selected = answers[q._id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                    className={cn(
                      'answer-option w-full flex items-center gap-4 text-left',
                      'animate-fade-up',
                      selected && 'selected'
                    )}
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-orbitron flex-shrink-0 transition-all duration-200',
                      selected
                        ? 'bg-neon-cyan text-cyber-black shadow-[0_0_10px_rgba(0,245,255,0.6)]'
                        : 'bg-white/5 text-white/30 border border-white/8'
                    )}>
                      {letters[i]}
                    </span>
                    <span className={cn('font-inter text-sm transition-colors', selected ? 'text-neon-cyan' : 'text-white/70')}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Prev / Next */}
            <div className="flex justify-between mt-8">
              <HoloButton
                variant="ghost"
                size="md"
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                disabled={currentIdx === 0}
                icon={<ChevronLeft size={16} />}
              >
                Previous
              </HoloButton>
              {currentIdx < questions.length - 1 ? (
                <HoloButton
                  variant="cyan"
                  size="md"
                  onClick={() => setCurrentIdx((p) => p + 1)}
                  icon={<ChevronRight size={16} />}
                >
                  Next
                </HoloButton>
              ) : (
                <HoloButton
                  variant="magenta"
                  size="md"
                  onClick={() => handleSubmit(false)}
                  loading={submitting}
                  icon={<Send size={16} />}
                >
                  Submit Test
                </HoloButton>
              )}
            </div>
          </div>
        </div>

        {/* ── Right sidebar: Navigator ───────────────────── */}
        <div className="hidden lg:flex flex-col gap-4 w-52 border-l border-white/5 p-4 overflow-y-auto flex-shrink-0">

          {/* Ring */}
          <div className="flex flex-col items-center gap-2 py-2">
            <ProgressRing value={progress} size={80} strokeWidth={5} color="cyan" label="Done" />
            <p className="text-white/25 text-xs font-inter">{answeredCount}/{questions.length} answered</p>
          </div>

          <div className="divider-neon-cyan opacity-20" />

          {/* Question grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((_, i) => (
              <NavBtn
                key={i}
                index={i}
                isCurrent={i === currentIdx}
                isAnswered={!!answers[questions[i]._id]}
                onClick={() => setCurrentIdx(i)}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs font-inter">
            {[
              { color: 'bg-neon-cyan', label: 'Current' },
              { color: 'bg-neon-green/30 border border-neon-green/50', label: `Answered (${answeredCount})` },
              { color: 'bg-white/5 border border-white/10', label: `Skipped (${questions.length - answeredCount})` },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={cn('w-3.5 h-3.5 rounded flex-shrink-0', l.color)} />
                <span className="text-white/30">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
