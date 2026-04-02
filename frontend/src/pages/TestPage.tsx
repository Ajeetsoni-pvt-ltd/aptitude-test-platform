// src/pages/TestPage.tsx
// Full-featured test page: proctored mode (camera + fullscreen + 3-strike auto-submit)
// and normal mode (no proctoring).

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useFullscreen    from '@/hooks/useFullscreen';
import useAntiCheat     from '@/hooks/useAntiCheat';
import useFaceDetection from '@/hooks/useFaceDetection';
import useTimer         from '@/hooks/useTimer';
import { submitTestApi } from '@/api/testApi';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';
import { getAssetUrl, getOptionLetter } from '@/lib/question';
import HoloButton        from '@/components/ui/HoloButton';
import ProgressRing      from '@/components/ui/ProgressRing';
import FaceTrackerOverlay from '@/components/ui/FaceTrackerOverlay';
import {
  ChevronLeft, ChevronRight, Send, AlertTriangle, Zap,
  Maximize, Minimize, Shield,
} from 'lucide-react';

type AnswerMap = Record<string, string>;

const MAX_TAB_SWITCHES = 3;

// ── Question navigator button ────────────────────────────────────
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

// ── Mobile block screen ──────────────────────────────────────────
const MobileBlockScreen = () => (
  <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-6 text-center">
    <div className="w-20 h-20 rounded-2xl bg-neon-red/15 border border-neon-red/30 flex items-center justify-center mb-6 animate-float">
      <AlertTriangle size={36} className="text-neon-red" />
    </div>
    <h1 className="font-orbitron text-2xl font-bold text-white mb-3">Desktop Required</h1>
    <p className="text-white/60 text-sm font-inter max-w-sm leading-relaxed mb-6">
      This test is only available on Desktop or Laptop (PC). The advanced proctoring and neural interface are not compatible with mobile devices.
    </p>
    <p className="text-neon-red/80 font-mono-code text-xs uppercase tracking-widest p-3 border border-neon-red/20 bg-neon-red/5 rounded-lg inline-block">
      Please switch to a desktop or PC to take the test.
    </p>
  </div>
);

// ── Pre-start screen ─────────────────────────────────────────────
const PreScreen = ({
  title, questionCount, totalTime, isProctored, onStart,
}: {
  title: string; questionCount: number; totalTime: number;
  isProctored: boolean; onStart: () => void;
}) => (
  <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle, ${isProctored ? '#9D00FF' : '#00F5FF'}, transparent 65%)` }} />
    </div>

    <div className="relative z-10 w-full max-w-md text-center animate-fade-up">
      <div className={cn(
        'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 animate-float',
        isProctored
          ? 'bg-gradient-to-br from-neon-violet/15 to-neon-magenta/15 border border-neon-violet/30 shadow-[0_0_40px_rgba(157,0,255,0.2)]'
          : 'bg-gradient-to-br from-neon-cyan/15 to-neon-violet/15 border border-neon-cyan/30 shadow-[0_0_40px_rgba(0,245,255,0.2)]'
      )}>
        {isProctored ? <Shield size={36} className="text-neon-violet" /> : <Zap size={36} className="text-neon-cyan" />}
      </div>

      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4',
        isProctored
          ? 'border-neon-violet/40 bg-neon-violet/10 text-neon-violet text-xs font-mono-code'
          : 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan text-xs font-mono-code'
      )}>
        <div className={cn('w-1.5 h-1.5 rounded-full animate-neon-pulse', isProctored ? 'bg-neon-violet' : 'bg-neon-cyan')} />
        {isProctored ? 'PROCTORED MODE' : 'NORMAL MODE'}
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

      <div className={cn(
        'glass-card rounded-xl p-4 mb-6 text-left',
        isProctored ? 'border border-neon-violet/15' : 'border border-neon-amber/15'
      )}>
        <p className={cn('text-xs font-semibold mb-2 flex items-center gap-1.5',
          isProctored ? 'text-neon-violet' : 'text-neon-amber')}>
          <AlertTriangle size={12} />
          {isProctored ? 'Proctoring Protocols' : 'Test Protocols'}
        </p>
        <ul className="space-y-1.5 text-white/35 text-xs font-inter">
          {isProctored ? [
            'Fullscreen mode activated automatically',
            'Camera enabled — keep face in frame',
            'After 3 tab switches, test auto-submits',
            'Keyboard shortcuts (F12, DevTools) blocked',
            'Results logged with proctoring data',
          ] : [
            'Auto-submits when time expires',
            'Session cannot be retaken',
            'No fullscreen requirement',
          ]}
          {(isProctored ? [] : []).map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className="text-neon-amber/50">▸</span> {r}
            </li>
          ))}
          {(isProctored ? [
            'Fullscreen mode activated automatically',
            'Camera enabled — keep face in frame',
            'After 3 tab switches, test auto-submits',
            'Keyboard shortcuts (F12, DevTools) blocked',
            'Results logged with proctoring data',
          ] : [
            'Auto-submits when time expires',
            'Session cannot be retaken',
            'No fullscreen requirement',
          ]).map((r) => (
            <li key={r} className="flex items-center gap-2">
              <span className={cn(isProctored ? 'text-neon-violet/50' : 'text-neon-amber/50')}>▸</span> {r}
            </li>
          ))}
        </ul>
      </div>

      <HoloButton
        variant={isProctored ? 'violet' : 'cyan'}
        size="xl"
        fullWidth
        onClick={onStart}
        className="font-orbitron tracking-widest"
        icon={isProctored ? <Shield size={18} /> : <Maximize size={18} />}
      >
        {isProctored ? 'ENTER PROCTORED TEST' : 'START TEST'}
      </HoloButton>
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────
const TestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    attemptId:      string;
    questions:      Question[];
    title:          string;
    totalQuestions: number;
    totalTime:      number;
    isProctored?:   boolean;
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
      isProctored={state.isProctored ?? false}
    />
  );
};

// ── TestContent ──────────────────────────────────────────────────
const TestContent = ({
  attemptId, questions, title, totalTime, isProctored,
}: {
  attemptId: string; questions: Question[]; title: string;
  totalTime: number; isProctored: boolean;
}) => {
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [started,    setStarted]    = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const autoSubmitCalledRef         = useRef(false);

  // ── Face Detection (proctored only) ─────────────────────────
  const {
    videoRef, isFaceDetected, isActive: cameraActive,
    cameraError, isLoading: cameraLoading, startCamera, stopCamera,
  } = useFaceDetection(isProctored);

  // ── Anti-Cheat ───────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    if (!autoSubmitCalledRef.current) {
      autoSubmitCalledRef.current = true;
      handleSubmit(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { warningCount, tabSwitchCount, isWarningVisible, lastWarning, dismissWarning } =
    useAntiCheat({
      isTestActive:  started,
      mode:          isProctored ? 'proctored' : 'normal',
      maxTabSwitches: MAX_TAB_SWITCHES,
      onAutoSubmit:  handleAutoSubmit,
    });

  // ── Submit handler ───────────────────────────────────────────
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      if (isProctored) { stopCamera(); await exitFullscreen(); }
      try {
        const answersArray = questions.map((q) => ({
          questionId:     q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent:      Math.round(totalTime / questions.length),
        }));
        const res = await submitTestApi(attemptId, { answers: answersArray, totalTime });
        if (res.success && res.data) {
          navigate('/result', { state: { result: res.data, title, isAutoSubmit: auto, isProctored }, replace: true });
        }
      } catch { setSubmitting(false); }
    },
    [answers, attemptId, exitFullscreen, submitting, navigate, questions, title, totalTime, isProctored, stopCamera]
  );

  // Timer auto-submit
  const { formattedTime, timeLeft } = useTimer(totalTime, () => handleSubmit(true));

  // ── Start test ───────────────────────────────────────────────
  const handleStart = async () => {
    if (isProctored) {
      await enterFullscreen();
      const cameraStarted = await startCamera();
      if (!cameraStarted) {
        // If camera failed, exit fullscreen and abort
        await exitFullscreen();
        return; // cameraError will show up, can't continue
      }
    }
    setStarted(true);
  };

  const isMobile = window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    return <MobileBlockScreen />;
  }

  const q             = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress      = Math.round((answeredCount / questions.length) * 100);
  const isTimeCrit    = timeLeft <= 60;
  if (!started) {
    return (
      <div className="relative">
        <PreScreen
          title={title}
          questionCount={questions.length}
          totalTime={totalTime}
          isProctored={isProctored}
          onStart={handleStart}
        />
        {cameraError && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-neon-red/10 border border-neon-red/50 text-neon-red px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(255,51,102,0.3)] backdrop-blur-md animate-fade-in flex items-center gap-3 w-[90%] max-w-md">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <p className="text-sm font-inter font-medium leading-snug">{cameraError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col overflow-hidden">

      {/* ── Face Tracker Overlay (proctored only) ──────────── */}
      {isProctored && (
        <FaceTrackerOverlay
          videoRef={videoRef}
          isFaceDetected={isFaceDetected}
          isActive={cameraActive}
          cameraError={cameraError}
          isLoading={cameraLoading}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={MAX_TAB_SWITCHES}
        />
      )}

      {/* ── Anti-cheat warning modal ───────────────────────── */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-strong rounded-2xl border border-neon-red/40 shadow-[0_0_40px_rgba(255,51,102,0.3)] p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-neon-red/15 border border-neon-red/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-neon-red" />
            </div>
            <h2 className="font-orbitron text-lg font-bold text-neon-red mb-2">Violation Detected</h2>
            <p className="text-white/60 text-sm font-inter mb-2">{lastWarning?.message}</p>
            {isProctored && (
              <p className={cn(
                'text-xs font-mono-code mb-6',
                tabSwitchCount >= MAX_TAB_SWITCHES ? 'text-neon-red animate-neon-pulse' : 'text-neon-red/60'
              )}>
                Tab Switches: {tabSwitchCount}/{MAX_TAB_SWITCHES}
                {tabSwitchCount >= MAX_TAB_SWITCHES && ' — AUTO-SUBMITTING...'}
              </p>
            )}
            {tabSwitchCount < MAX_TAB_SWITCHES && (
              <HoloButton variant="danger" fullWidth onClick={dismissWarning}>
                Acknowledged — Resume Test
              </HoloButton>
            )}
          </div>
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────── */}
      <header className={cn(
        'flex items-center justify-between px-4 sm:px-6 h-14 border-b flex-shrink-0 backdrop-blur-sm',
        isTimeCrit
          ? 'border-neon-red/30 bg-neon-red/5'
          : 'border-white/5 bg-cyber-black/80'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
            isProctored
              ? 'bg-gradient-to-br from-neon-violet to-neon-magenta'
              : 'bg-gradient-to-br from-neon-cyan to-neon-violet'
          )}>
            {isProctored ? <Shield size={13} className="text-white" /> : <Zap size={13} className="text-cyber-black" />}
          </div>
          <span className="font-orbitron text-sm font-bold text-white/70 hidden sm:block truncate max-w-xs">{title}</span>
          {isProctored && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-neon-violet/30 bg-neon-violet/10 text-neon-violet font-mono-code">
              <div className="w-1 h-1 rounded-full bg-neon-violet animate-neon-pulse" />
              PROCTORED
            </span>
          )}
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
              ⚠ {tabSwitchCount}/{MAX_TAB_SWITCHES}
            </span>
          )}
          <span className="text-white/30 text-xs font-mono-code hidden sm:block">
            {currentIdx + 1}/{questions.length}
          </span>
          {!isProctored && (
            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          )}
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

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="h-0.5 bg-white/5 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-all duration-500"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, boxShadow: '0 0 8px rgba(0,245,255,0.6)' }}
        />
      </div>

      {/* ── Main test area ─────────────────────────────────── */}
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
              {q.questionImage ? (
                <div className="flex flex-col items-center gap-4">
                  {q.questionText && (
                    <p className="text-white/90 text-sm sm:text-base font-inter text-center leading-relaxed">
                      {q.questionText}
                    </p>
                  )}
                  <img
                    src={getAssetUrl(q.questionImage)}
                    alt="Question"
                    className="max-w-full max-h-96 rounded-lg object-contain shadow-[0_0_30px_rgba(0,245,255,0.2)]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-white/90 text-base sm:text-lg font-inter leading-relaxed">
                  {q.questionText}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, i) => {
                const optionLetter = getOptionLetter(i);
                const selected = answers[q._id] === optionLetter;

                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q._id]: optionLetter }))}
                    className={cn(
                      'answer-option w-full flex flex-col items-start gap-4 text-left animate-fade-up',
                      selected && 'selected',
                      option.image && 'justify-start'
                    )}
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <div className="flex items-start sm:items-center gap-4 w-full">
                      <span className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-orbitron flex-shrink-0 transition-all duration-200 mt-1 sm:mt-0',
                        selected
                          ? 'bg-neon-cyan text-cyber-black shadow-[0_0_10px_rgba(0,245,255,0.6)]'
                          : 'bg-white/5 text-white/30 border border-white/8'
                      )}>
                        {optionLetter}
                      </span>

                      {option.image ? (
                        <div className="flex-1">
                          <img
                            src={getAssetUrl(option.image)}
                            alt={`Option ${optionLetter}`}
                            className="max-w-xs max-h-40 rounded-lg object-contain"
                            loading="lazy"
                          />
                          {option.text && (
                            <p className={cn(
                              'text-xs mt-2 font-inter transition-colors',
                              selected ? 'text-neon-cyan' : 'text-white/50'
                            )}>
                              {option.text}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className={cn('font-inter text-sm transition-colors flex-1', selected ? 'text-neon-cyan' : 'text-white/70')}>
                          {option.text}
                        </span>
                      )}
                    </div>
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

        {/* ── Right sidebar: Navigator ───────────────────────────── */}
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

          {/* Proctoring status in sidebar */}
          {isProctored && (
            <>
              <div className="divider-neon-violet opacity-20" />
              <div className="space-y-2">
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-inter">Proctoring</p>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', cameraActive ? 'bg-neon-green animate-neon-pulse' : 'bg-white/20')} />
                  <span className="text-white/30 text-[11px] font-inter">Camera</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', isFullscreen ? 'bg-neon-green animate-neon-pulse' : 'bg-neon-amber')} />
                  <span className="text-white/30 text-[11px] font-inter">Fullscreen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', tabSwitchCount === 0 ? 'bg-neon-green' : tabSwitchCount < MAX_TAB_SWITCHES ? 'bg-neon-amber' : 'bg-neon-red')} />
                  <span className="text-white/30 text-[11px] font-inter">Tab: {tabSwitchCount}/{MAX_TAB_SWITCHES}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;
