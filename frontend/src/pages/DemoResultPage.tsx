import { useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  RotateCcw,
  Home,
  Trophy,
  Target,
  TrendingUp,
  Dumbbell,
  Sprout,
} from "lucide-react";
import { demoQuestions } from "@/data/demoQuestions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DemoResultState {
  selectedOptions: (number | null)[];
  timeTaken: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const getFeedback = (score: number) => {
  if (score >= 9) return { icon: Trophy, text: "Outstanding! You're in the top tier.", color: "text-yellow-400" };
  if (score >= 7) return { icon: Target, text: "Great job! Strong aptitude foundation.", color: "text-green-400" };
  if (score >= 5) return { icon: TrendingUp, text: "Good effort. There's room to grow.", color: "text-blue-400" };
  if (score >= 3) return { icon: Dumbbell, text: "Keep practicing — consistency is key.", color: "text-orange-400" };
  return { icon: Sprout, text: "Everyone starts somewhere. Let's improve!", color: "text-emerald-400" };
};

const optionLabels: [string, string, string, string] = ["A", "B", "C", "D"];

// ---------------------------------------------------------------------------
// Accordion Item
// ---------------------------------------------------------------------------

interface AccordionProps {
  index: number;
  userAnswer: number | null;
}

const QuestionAccordion = ({ index, userAnswer }: AccordionProps) => {
  const [open, setOpen] = useState(false);
  const q = demoQuestions[index];
  const isCorrect = userAnswer === q.correctIndex;
  const isSkipped = userAnswer === null;

  const statusIcon = isSkipped ? (
    <MinusCircle size={18} className="text-zinc-500" />
  ) : isCorrect ? (
    <CheckCircle size={18} className="text-green-400" />
  ) : (
    <XCircle size={18} className="text-red-400" />
  );

  const statusLabel = isSkipped ? "Skipped" : isCorrect ? "Correct" : "Wrong";
  const statusColor = isSkipped ? "text-zinc-500" : isCorrect ? "text-green-400" : "text-red-400";

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-800/50 transition-colors"
      >
        {statusIcon}
        <span className="flex-1 text-sm text-zinc-300 truncate">
          <span className="text-zinc-500 font-medium">Q{index + 1}.</span>{" "}
          {q.question.slice(0, 80)}
          {q.question.length > 80 && "…"}
        </span>
        <span className={`text-xs font-medium ${statusColor} hidden sm:inline`}>{statusLabel}</span>
        {open ? (
          <ChevronUp size={16} className="text-zinc-500 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-zinc-500 shrink-0" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
          <p className="text-white text-sm leading-relaxed mb-4">{q.question}</p>
          <div className="flex flex-col gap-2 mb-4">
            {q.options.map((opt, oi) => {
              const isUserPick = userAnswer === oi;
              const isCorrectOpt = q.correctIndex === oi;
              let cls = "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ";
              if (isCorrectOpt) {
                cls += "bg-green-500/10 border-green-500/40 text-green-300";
              } else if (isUserPick && !isCorrectOpt) {
                cls += "bg-red-500/10 border-red-500/40 text-red-300";
              } else {
                cls += "bg-zinc-800/50 border-zinc-700/50 text-zinc-400";
              }
              return (
                <div key={oi} className={cls}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCorrectOpt ? "bg-green-500 text-black" : isUserPick ? "bg-red-500 text-black" : "bg-zinc-700 text-zinc-400"
                  }`}>
                    {optionLabels[oi]}
                  </span>
                  <span>{opt}</span>
                  {isCorrectOpt && <CheckCircle size={14} className="ml-auto text-green-400 shrink-0" />}
                  {isUserPick && !isCorrectOpt && <XCircle size={14} className="ml-auto text-red-400 shrink-0" />}
                </div>
              );
            })}
          </div>
          {/* Explanation */}
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-3">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{q.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DemoResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as DemoResultState | null;
  if (!state) return <Navigate to="/demo" replace />;

  const { selectedOptions, timeTaken } = state;
  const total = demoQuestions.length;
  const correct = selectedOptions.filter((opt, i) => opt === demoQuestions[i].correctIndex).length;
  const wrong = selectedOptions.filter((opt, i) => opt !== null && opt !== demoQuestions[i].correctIndex).length;
  const skipped = total - correct - wrong;
  const percentage = Math.round((correct / total) * 100);
  const feedback = getFeedback(correct);
  const FeedbackIcon = feedback.icon;

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* ── Score Card ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🎯 Your Demo Result</h1>
            <p className="text-zinc-500 text-sm">Quantitative Aptitude • 10 Questions</p>
          </div>

          {/* Score + Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Score</p>
              <p className="text-3xl font-bold text-white">{correct}<span className="text-zinc-500 text-lg">/{total}</span></p>
            </div>
            <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 p-4 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Time Taken</p>
              <p className="text-3xl font-bold text-orange-400">{formatTime(timeTaken)}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Accuracy</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 py-2.5">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm text-green-300 font-semibold">{correct} Correct</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5">
              <XCircle size={16} className="text-red-400" />
              <span className="text-sm text-red-300 font-semibold">{wrong} Wrong</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-700/30 border border-zinc-700/40 py-2.5">
              <MinusCircle size={16} className="text-zinc-400" />
              <span className="text-sm text-zinc-300 font-semibold">{skipped} Skipped</span>
            </div>
          </div>

          {/* Feedback */}
          <div className={`flex items-center gap-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-4 py-3 ${feedback.color}`}>
            <FeedbackIcon size={22} />
            <span className="font-semibold text-sm">{feedback.text}</span>
          </div>
        </div>

        {/* ── Question Review ─────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-orange-500 to-yellow-400" />
            Question Review
          </h2>
          <div className="flex flex-col gap-3">
            {demoQuestions.map((_, i) => (
              <QuestionAccordion key={i} index={i} userAnswer={selectedOptions[i]} />
            ))}
          </div>
        </div>

        {/* ── Conversion Block ────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Pulsing glow border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-orange-500 via-yellow-400 to-amber-500 animate-pulse opacity-60" />
          <div className="relative rounded-2xl bg-zinc-900 m-[1px] p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={20} className="text-orange-400" />
              <h3 className="text-xl font-bold text-white">Unlock the Full Platform</h3>
            </div>
            <ul className="space-y-2.5 mb-6">
              {[
                "500+ Quantitative Aptitude questions",
                "Topic-wise performance analytics",
                "Full-length timed tests with proctoring",
                "Leaderboard & peer comparison",
                "Daily Problem of the Day challenges",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Lock size={14} className="text-orange-500/60 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/register")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Register Free <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Actions ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4">
          <button
            onClick={() => navigate("/demo")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw size={16} /> Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            <Home size={16} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoResultPage;
