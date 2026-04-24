import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  X,
  Zap,
} from "lucide-react";
import { demoQuestions } from "@/data/demoQuestions";

const TOTAL_TIME = 600;
const TOTAL_QUESTIONS = demoQuestions.length;

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const TimerDisplay = ({ timeLeft }: { timeLeft: number }) => {
  const isWarning = timeLeft < 120;
  return (
    <div
      className={`flex items-center gap-2 font-mono text-lg font-semibold tabular-nums ${
        isWarning ? "text-red-500 animate-pulse" : "text-orange-400"
      }`}
    >
      <Clock size={18} className="shrink-0" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
};

interface PaletteProps {
  currentIndex: number;
  selectedOptions: (number | null)[];
  visitedFlags: boolean[];
  onJump: (index: number) => void;
}

const QuestionPalette = ({
  currentIndex,
  selectedOptions,
  visitedFlags,
  onJump,
}: PaletteProps) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
      const isAnswered = selectedOptions[i] !== null;
      const isCurrent = i === currentIndex;
      const isVisited = visitedFlags[i];
      let dotClass =
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ";
      if (isCurrent) {
        dotClass += "bg-orange-500 text-black ring-2 ring-orange-300 ring-offset-2 ring-offset-zinc-950 scale-110";
      } else if (isAnswered) {
        dotClass += "bg-green-500 text-black hover:bg-green-400";
      } else if (isVisited) {
        dotClass += "bg-zinc-600 text-zinc-300 hover:bg-zinc-500";
      } else {
        dotClass += "bg-zinc-700 text-zinc-400 hover:bg-zinc-600";
      }
      return (
        <button key={i} className={dotClass} onClick={() => onJump(i)}>
          {i + 1}
        </button>
      );
    })}
  </div>
);

interface ModalProps {
  answeredCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal = ({ answeredCount, onCancel, onConfirm }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl shadow-orange-500/10">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <X size={20} />
      </button>
      <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-orange-500/15 border border-orange-500/30">
        <AlertTriangle size={28} className="text-orange-400" />
      </div>
      <h3 className="text-xl font-bold text-white text-center mb-2">Submit Test?</h3>
      <p className="text-zinc-400 text-center mb-6 text-sm leading-relaxed">
        You have answered{" "}
        <span className="text-orange-400 font-semibold">{answeredCount}/{TOTAL_QUESTIONS}</span>{" "}
        questions.
        {answeredCount < TOTAL_QUESTIONS && " Unanswered questions will be marked as skipped."}{" "}
        Submit anyway?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Yes, Submit
        </button>
      </div>
    </div>
  </div>
);

const DemoTestPage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>(
    () => Array(TOTAL_QUESTIONS).fill(null)
  );
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visitedFlags, setVisitedFlags] = useState<boolean[]>(() => {
    const flags = Array(TOTAL_QUESTIONS).fill(false) as boolean[];
    flags[0] = true;
    return flags;
  });
  const [showModal, setShowModal] = useState(false);

  const selectedRef = useRef(selectedOptions);
  selectedRef.current = selectedOptions;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const isSubmittedRef = useRef(isSubmitted);
  isSubmittedRef.current = isSubmitted;

  const doSubmit = useCallback(() => {
    if (isSubmittedRef.current) return;
    setIsSubmitted(true);
    navigate("/demo/result", {
      state: {
        selectedOptions: selectedRef.current,
        timeTaken: TOTAL_TIME - timeLeftRef.current,
      },
    });
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [doSubmit]);

  const goTo = (index: number) => {
    if (index < 0 || index >= TOTAL_QUESTIONS) return;
    setCurrentIndex(index);
    setVisitedFlags((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleSelect = (optIndex: number) => {
    setSelectedOptions((prev) => {
      const next = [...prev];
      next[currentIndex] = prev[currentIndex] === optIndex ? null : optIndex;
      return next;
    });
  };

  const currentQ = demoQuestions[currentIndex];
  const answeredCount = selectedOptions.filter((o) => o !== null).length;
  const optionLabels: [string, string, string, string] = ["A", "B", "C", "D"];

  if (isSubmitted) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold text-lg hidden sm:inline">AptitudeTest</span>
              <span className="text-zinc-500 text-sm hidden md:inline">— Demo Test</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TimerDisplay timeLeft={timeLeft} />
            <button
              onClick={() => setShowModal(true)}
              className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Send size={14} />
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-400">
            Question <span className="text-orange-400">{currentIndex + 1}</span> of {TOTAL_QUESTIONS}
          </span>
          <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400 uppercase tracking-wide">
            {currentQ.topic}
          </span>
        </div>

        {/* Question card */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8">
          <p className="text-white text-lg md:text-xl leading-relaxed font-medium mb-8">
            {currentQ.question}
          </p>
          <div className="flex flex-col gap-3">
            {currentQ.options.map((opt, oi) => {
              const isSelected = selectedOptions[currentIndex] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(oi)}
                  className={`flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-orange-400/50 hover:bg-zinc-800/80"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected ? "bg-orange-500 text-black" : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {optionLabels[oi]}
                  </span>
                  <span className="text-sm md:text-base">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Palette */}
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500 text-center mb-3 uppercase tracking-wider font-medium">
            Question Navigator
          </p>
          <QuestionPalette
            currentIndex={currentIndex}
            selectedOptions={selectedOptions}
            visitedFlags={visitedFlags}
            onJump={goTo}
          />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Answered</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-zinc-600" /> Visited</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-zinc-700" /> Not Visited</span>
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="sm:hidden flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold text-sm"
          >
            <Send size={14} /> Submit
          </button>
          {currentIndex < TOTAL_QUESTIONS - 1 ? (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              <Send size={14} /> Submit Test
            </button>
          )}
        </div>
      </main>

      {showModal && (
        <ConfirmModal
          answeredCount={answeredCount}
          onCancel={() => setShowModal(false)}
          onConfirm={() => { setShowModal(false); doSubmit(); }}
        />
      )}
    </div>
  );
};

export default DemoTestPage;
