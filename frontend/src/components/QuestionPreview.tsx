import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Image as ImageIcon } from 'lucide-react';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';
import { getAssetUrl, getOptionLetter, questionHasImage, questionHasOptionImages } from '@/lib/question';

interface QuestionPreviewProps {
  questions: Question[];
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
}

export default function QuestionPreview({
  questions,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Question Preview',
  subtitle = 'Review the questions exactly as students will see them.',
  confirmLabel = 'Confirm Save',
}: QuestionPreviewProps) {
  const [expandedQIds, setExpandedQIds] = useState<Set<string>>(
    new Set(questions.slice(0, 3).map((q) => q._id))
  );

  const toggleExpanded = (questionId: string) => {
    setExpandedQIds((previous) => {
      const next = new Set(previous);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const imageQuestions = questions.filter((question) => questionHasImage(question)).length;
  const optionImageQuestions = questions.filter((question) => questionHasOptionImages(question)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div>
            <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl transition-colors"
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-card rounded-lg p-4 border border-neon-cyan/20 text-center">
            <p className="text-2xl font-bold text-neon-cyan font-orbitron">{questions.length}</p>
            <p className="text-xs text-white/50 font-inter mt-1">Total Questions</p>
          </div>
          <div className="glass-card rounded-lg p-4 border border-neon-green/20 text-center">
            <p className="text-2xl font-bold text-neon-green font-orbitron">
              {questions.filter((question) => !questionHasImage(question)).length}
            </p>
            <p className="text-xs text-white/50 font-inter mt-1">Text-led Questions</p>
          </div>
          <div className="glass-card rounded-lg p-4 border border-neon-violet/20 text-center">
            <p className="text-2xl font-bold text-neon-violet font-orbitron">{imageQuestions}</p>
            <p className="text-xs text-white/50 font-inter mt-1">Question Images</p>
          </div>
          <div className="glass-card rounded-lg p-4 border border-neon-amber/20 text-center">
            <p className="text-2xl font-bold text-neon-amber font-orbitron">{optionImageQuestions}</p>
            <p className="text-xs text-white/50 font-inter mt-1">Option Images</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {questions.map((question, index) => {
            const isExpanded = expandedQIds.has(question._id);
            const hasAnyImages = questionHasImage(question) || questionHasOptionImages(question);

            return (
              <div
                key={question._id}
                className="glass-card rounded-lg border border-white/6 overflow-hidden transition-all duration-300 hover:border-white/12"
              >
                <button
                  onClick={() => toggleExpanded(question._id)}
                  className={cn(
                    'w-full flex items-start justify-between gap-4 p-4 transition-all duration-200',
                    isExpanded && 'bg-white/5'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 text-left">
                    <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan font-bold text-sm font-orbitron">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/90 font-inter text-sm leading-relaxed line-clamp-2">
                        {question.questionText || 'Image-based question'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full font-inter font-medium',
                            question.difficulty === 'easy'
                              ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                              : question.difficulty === 'medium'
                                ? 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20'
                                : 'bg-neon-red/10 text-neon-red border border-neon-red/20'
                          )}
                        >
                          {question.difficulty}
                        </span>
                        {hasAnyImages && (
                          <span className="text-xs px-2 py-1 rounded-full bg-neon-violet/10 text-neon-violet border border-neon-violet/20 font-inter flex items-center gap-1">
                            <ImageIcon size={12} />
                            Images
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/10 font-inter">
                          {question.topic}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-white/40" />
                    ) : (
                      <ChevronDown size={18} className="text-white/40" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/6 p-4 bg-white/[0.02] space-y-4">
                    {question.questionText && (
                      <div>
                        <p className="text-white/60 text-xs font-mono-code uppercase tracking-widest mb-2">
                          Question Text
                        </p>
                        <p className="text-white/80 text-sm font-inter leading-relaxed">
                          {question.questionText}
                        </p>
                      </div>
                    )}

                    {question.questionImage && (
                      <div>
                        <p className="text-white/60 text-xs font-mono-code uppercase tracking-widest mb-2">
                          Question Image
                        </p>
                        <img
                          src={getAssetUrl(question.questionImage)}
                          alt="Question"
                          className="max-w-full max-h-72 rounded-lg object-contain border border-white/10"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-white/60 text-xs font-mono-code uppercase tracking-widest mb-2">
                        Options
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const optionLetter = getOptionLetter(optionIndex);
                          const isCorrect = question.correctAnswer === optionLetter;

                          return (
                            <div
                              key={`${question._id}-${optionLetter}`}
                              className={cn(
                                'border rounded-lg p-3 bg-white/[0.01]',
                                isCorrect ? 'border-neon-green/30' : 'border-white/10'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-white/40 font-bold text-xs font-orbitron flex-shrink-0 mt-0.5">
                                  {optionLetter}
                                </span>
                                <div className="flex-1 space-y-2">
                                  {option.text && (
                                    <p className="text-white/80 text-sm font-inter leading-relaxed">
                                      {option.text}
                                    </p>
                                  )}
                                  {option.image && (
                                    <img
                                      src={getAssetUrl(option.image)}
                                      alt={`Option ${optionLetter}`}
                                      className="max-w-xs max-h-32 rounded object-contain border border-white/10"
                                      loading="lazy"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {question.explanation && (
                      <div>
                        <p className="text-white/60 text-xs font-mono-code uppercase tracking-widest mb-2">
                          Explanation
                        </p>
                        <p className="text-white/70 text-sm font-inter leading-relaxed italic px-3 py-2 bg-neon-cyan/5 border border-neon-cyan/10 rounded">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-between sticky bottom-0 bg-black/80 backdrop-blur-md py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-white font-inter font-medium transition-all duration-200 hover:border-white/40 hover:bg-white/5"
          >
            Back
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-neon-violet to-neon-magenta text-white font-inter font-medium transition-all duration-200 flex items-center justify-center gap-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <CheckCircle size={16} />
              {isLoading ? 'Saving...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
