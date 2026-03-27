// frontend/src/pages/TestPage.tsx
// ─────────────────────────────────────────────────────────────
// Test Page — Full-screen exam environment
// Features: Timer, Questions, Options, Navigator, Anti-cheat
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useFullscreen  from '@/hooks/useFullscreen';
import useAntiCheat   from '@/hooks/useAntiCheat';
import useTimer       from '@/hooks/useTimer';
import { submitTestApi } from '@/api/testApi';
import type { Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';

// ─── Answer Map Type ───────────────────────────────────────────
// { questionId: selectedAnswer }
type AnswerMap = Record<string, string>;

// ─── Question Navigator Button ─────────────────────────────────
const NavButton = ({
  index, isCurrent, isAnswered, onClick,
}: {
  index: number; isCurrent: boolean; isAnswered: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border-2
      ${isCurrent  ? 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-md' :
        isAnswered ? 'bg-green-100 text-green-700 border-green-400' :
                     'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
  >
    {index + 1}
  </button>
);

const TestPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ─── Data from TestSetupPage (via navigate state) ──────────
  const state = location.state as {
    attemptId:      string;
    questions:      Question[];
    title:          string;
    totalQuestions: number;
    totalTime:      number;
  } | null;

  // ─── Agar direct URL pe aaya (state nahi hai) ─────────────
  useEffect(() => {
    if (!state?.attemptId) {
      navigate('/test-setup', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.attemptId) return null;

  const { attemptId, questions, title, totalTime } = state;

  return (
    <TestContent
      attemptId={attemptId}
      questions={questions}
      title={title}
      totalTime={totalTime}
    />
  );
};

// ─── Alag component — hooks ko safely use karne ke liye ───────
const TestContent = ({
  attemptId, questions, title, totalTime,
}: {
  attemptId: string;
  questions: Question[];
  title: string;
  totalTime: number;
}) => {
  const navigate = useNavigate();

  // ─── Hooks ─────────────────────────────────────────────────
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [isTestStarted, setIsTestStarted] = useState(false);

  const { warningCount, isWarningVisible, lastWarning, dismissWarning } =
    useAntiCheat(isTestStarted);

  // ─── Test State ────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<AnswerMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Submit Handler (useCallback — timer se safe reference) ─
  const handleSubmit = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      // Fullscreen exit karo before navigate
      await exitFullscreen();

      try {
        // Answers array banao
        const answersArray = questions.map((q) => ({
          questionId:     q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent:      Math.round(totalTime / questions.length), // Average
        }));

        const response = await submitTestApi(attemptId, {
          answers: answersArray,
          totalTime,
        });

        if (response.success && response.data) {
          navigate('/result', {
            state: {
              result: response.data,
              title,
              isAutoSubmit,
            },
            replace: true,
          });
        }
      } catch (err) {
        console.error('Submit error:', err);
        setIsSubmitting(false);
      }
    },
    [answers, attemptId, exitFullscreen, isSubmitting, navigate, questions, title, totalTime]
  );

  // ─── Timer — time up hone par auto submit ─────────────────
  const handleTimeUp = useCallback(() => {
    handleSubmit(true);
  }, [handleSubmit]);

  const { formattedTime, timeLeft } = useTimer(
    isTestStarted ? totalTime : totalTime,
    handleTimeUp
  );

  // ─── Option Select ─────────────────────────────────────────
  const handleSelectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount   = Object.keys(answers).length;
  const skippedCount    = questions.length - answeredCount;
  const isTimeCritical  = timeLeft <= 60; // Last 1 minute

  // ─── PRE-SCREEN: Test shuru karne se pehle ─────────────────
  if (!isTestStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 mb-6">
            {questions.length} questions • {totalTime / 60} minutes
          </p>

          <div className="bg-amber-50 rounded-xl p-4 text-left mb-6 text-sm space-y-2 border border-amber-200">
            <p className="font-semibold text-amber-800">⚠️ Test shuru karne se pehle:</p>
            <p className="text-amber-700">🖥️ Test fullscreen mode mein khulega</p>
            <p className="text-amber-700">🚫 Tab switch karne par warning milegi</p>
            <p className="text-amber-700">⏱️ Timer shuru hote hi ruk nahi sakta</p>
            <p className="text-amber-700">✅ Sab ready hai? Toh Start karo!</p>
          </div>

          <Button
            onClick={async () => {
              await enterFullscreen();
              setIsTestStarted(true);
            }}
            className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            🚀 Test Shuru Karo (Fullscreen)
          </Button>
        </div>
      </div>
    );
  }

  // ─── MAIN TEST UI ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* ═══ TOP BAR ════════════════════════════════════════ */}
      <header className={`px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-md
        ${isTimeCritical ? 'bg-red-600' : 'bg-indigo-700'} text-white transition-colors`}>

        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <span className="font-semibold hidden sm:block truncate max-w-xs">{title}</span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xl font-bold
          ${isTimeCritical ? 'bg-red-800 animate-pulse' : 'bg-indigo-900'}`}>
          ⏱️ {formattedTime}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:block">
            {currentIndex + 1} / {questions.length}
          </span>
          {warningCount > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              ⚠️ {warningCount} Warning
            </Badge>
          )}
          <Button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white font-bold"
          >
            {isSubmitting ? '⏳ Submitting...' : '✅ Submit'}
          </Button>
        </div>
      </header>

      {/* ═══ ANTI-CHEAT WARNING POPUP ══════════════════════ */}
      {isWarningVisible && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-3">🚨</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Warning!</h2>
            <p className="text-gray-700 mb-2">{lastWarning?.message}</p>
            <p className="text-gray-500 text-sm mb-4">
              Warnings: {warningCount}/3
              {warningCount >= 3 && ' — Aur warnings pe auto-submit ho sakta hai!'}
            </p>
            <Button
              onClick={dismissWarning}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
            >
              Samajh Gaya — Test Continue Karo
            </Button>
          </div>
        </div>
      )}

      {/* ═══ MAIN AREA ════════════════════════════════════ */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full p-4 gap-4">

        {/* ─── LEFT: Question + Options ──────────────────── */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-md p-6 min-h-[400px] flex flex-col">

            {/* Question Number + Difficulty */}
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-sm px-3 py-1">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <Badge
                className={
                  currentQuestion.difficulty === 'easy'   ? 'bg-green-100 text-green-700'  :
                  currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }
              >
                {currentQuestion.difficulty}
              </Badge>
            </div>

            {/* Question Text */}
            <p className="text-lg font-medium text-gray-800 mb-6 leading-relaxed flex-1">
              {currentQuestion.questionText}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const letters    = ['A', 'B', 'C', 'D'];
                const isSelected = answers[currentQuestion._id] === option;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(currentQuestion._id, option)}
                    className={`w-full p-4 rounded-xl text-left flex items-center gap-3 border-2
                      font-medium transition-all duration-150
                      ${isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${isSelected ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {letters[idx]}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
              >
                ← Previous
              </Button>
              <span className="text-sm text-gray-400 self-center">
                {answers[currentQuestion._id] ? '✅ Answered' : '⭕ Not answered'}
              </span>
              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentIndex((p) => p + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  ✅ Submit Test
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Question Navigator ─────────────────── */}
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-md p-4 sticky top-20">
            <h3 className="font-bold text-gray-700 text-sm mb-3">
              🗂️ Question Navigator
            </h3>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {questions.map((q, idx) => (
                <NavButton
                  key={q._id}
                  index={idx}
                  isCurrent={idx === currentIndex}
                  isAnswered={!!answers[q._id]}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-600"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400"></div>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border-2 border-gray-200"></div>
                <span>Skipped ({skippedCount})</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Fullscreen toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="w-full mt-4 text-xs"
            >
              {isFullscreen ? '⊠ Exit Fullscreen' : '⊞ Fullscreen'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
