// src/pages/SolutionReviewPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getAttemptByIdApi } from '@/api/testApi';
import { ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TestAttempt, Question } from '@/types';

// Extend TestAttempt to match the populated questions structure
interface PopulatedAttempt extends TestAttempt {
  questions: Question[];
  answers: Array<{
    question: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

const SolutionReviewPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<PopulatedAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    const fetchAttempt = async () => {
      try {
        setIsLoading(true);
        const res = await getAttemptByIdApi(attemptId);
        if (res.success && res.data) {
          setAttempt(res.data as PopulatedAttempt);
        } else {
          setError('Failed to load test attempt.');
        }
      } catch (err: unknown) {
        setError('Error loading attempt details: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center flex-col items-center h-[60vh] gap-4">
          <LoadingSpinner size="lg" label="Extracting neural logs..." />
        </div>
      </AppLayout>
    );
  }

  if (error || !attempt) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh]">
          <AlertTriangle size={48} className="text-neon-red mb-4" />
          <h2 className="text-xl font-orbitron font-bold text-white mb-2">Diagnostic Error</h2>
          <p className="text-white/40 font-inter mb-6">{error || 'Test data not found'}</p>
          <HoloButton variant="cyan" onClick={() => navigate('/analysis')}>
            Back to Analytics
          </HoloButton>
        </div>
      </AppLayout>
    );
  }

  const { score, questions, answers, title } = attempt;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => navigate('/result', { state: { result: attempt, title } })} 
                className="text-white/30 hover:text-white/70 transition-colors p-1"
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-white/30 text-xs font-inter uppercase tracking-widest">
                Post-Test Diagnostic
              </p>
            </div>
            <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
              Solution <span className="gradient-text-cyan-violet">Review</span>
            </h1>
            <p className="text-white/60 text-sm font-inter mt-1.5 flex flex-wrap gap-3">
              <span>Test: {title}</span>
              <span className="text-white/20">|</span>
              <span className={cn(
                  "font-orbitron font-bold",
                  score >= 80 ? 'text-neon-green' : score >= 60 ? 'text-neon-cyan' : score >= 40 ? 'text-neon-amber' : 'text-neon-red'
              )}>Scan Score: {score}%</span>
            </p>
          </div>
        </div>

        {/* Questions Feed */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const studentAnsRow = answers.find((a) => a.question.toString() === q._id);
            const selectedAns = studentAnsRow?.selectedAnswer;
            const isCorrect = studentAnsRow?.isCorrect;
            const isSkipped = !selectedAns;

            const boxVariant = isCorrect ? 'green' : (isSkipped ? 'amber' : 'red');

            return (
              <NeonCard 
                key={q._id} 
                variant={boxVariant} 
                padding="p-6" 
                className="animate-fade-up border-l-4"
                style={{
                  borderLeftColor: isCorrect ? '#00FF88' : (isSkipped ? '#FFB700' : '#FF3366'),
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {/* Question Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-orbitron font-bold text-white/50">Q{index + 1}.</span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono-code font-bold",
                      isCorrect ? "bg-neon-green/10 text-neon-green border border-neon-green/30" :
                      isSkipped ? "bg-neon-amber/10 text-neon-amber border border-neon-amber/30" :
                      "bg-neon-red/10 text-neon-red border border-neon-red/30"
                    )}>
                      {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                    </span>
                  </div>
                  <span className="text-xs bg-white/5 text-white/40 px-2 py-1 rounded font-mono-code">
                    {q.topic}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-white/90 text-sm md:text-base font-inter leading-relaxed mb-6">
                  {q.questionText}
                </p>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {q.options.map((opt, i) => {
                    const isStudentChoice = opt === selectedAns;
                    const isActualAnswer = opt === q.correctAnswer;
                    
                    let rowClass = "border border-white/5 bg-white/[0.02]";
                    let icon = null;

                    if (isActualAnswer && isStudentChoice) {
                      rowClass = "border-neon-green/50 bg-neon-green/10";
                      icon = <CheckCircle2 size={16} className="text-neon-green" />;
                    } else if (isActualAnswer && !isStudentChoice) {
                      rowClass = "border-neon-green/30 bg-neon-green/5";
                      icon = <CheckCircle2 size={16} className="text-neon-green/50" />;
                    } else if (!isActualAnswer && isStudentChoice) {
                      rowClass = "border-neon-red/50 bg-neon-red/10 animate-fade-in";
                      icon = <XCircle size={16} className="text-neon-red" />;
                    }

                    return (
                      <div key={i} className={cn("p-3 rounded-lg flex items-center gap-3 transition-colors", rowClass)}>
                        <span className="w-6 h-6 rounded flex items-center justify-center bg-black/40 text-white/40 text-xs font-orbitron flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={cn(
                          "flex-1 font-inter text-sm",
                          isActualAnswer ? "text-neon-green font-medium" : 
                          isStudentChoice ? "text-neon-red line-through opacity-70" : "text-white/60"
                        )}>
                          {opt}
                        </span>
                        {icon && <div className="flex-shrink-0">{icon}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan/50" />
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-orbitron text-[11px] uppercase tracking-widest text-neon-cyan/80 mb-1.5">
                        Solution Blueprint
                      </h4>
                      <p className="text-white/70 text-sm font-inter leading-relaxed">
                        {q.explanation || 'Detailed explanation currently restricted from neural logs.'}
                      </p>
                    </div>
                  </div>
                </div>

              </NeonCard>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default SolutionReviewPage;
