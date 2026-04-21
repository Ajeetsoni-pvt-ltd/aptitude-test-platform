// src/pages/TestSetupPage.tsx
// Futuristic multi-step test configuration wizard with Subtopic Selection

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTestApi, getSubtopicsApi } from '@/api/testApi';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import StartTestModal, { type StartTestConfig } from '@/components/ui/StartTestModal';
import { ChevronRight, ChevronLeft, Zap, Brain, Hash, Clock, AlertTriangle, Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Data ─────────────────────────────────────────────────────────
const TOPICS = [
  { value: 'Quantitative Aptitude', label: 'Quantitative Aptitude', icon: '🔢', desc: 'Numbers, arithmetic, algebra', color: 'cyan' },
  { value: 'Verbal Ability',        label: 'Verbal Ability',        icon: '📖', desc: 'Grammar, vocabulary, comprehension', color: 'violet' },
  { value: 'Logical Reasoning',     label: 'Logical Reasoning',     icon: '🧠', desc: 'Patterns, puzzles, deductions', color: 'magenta' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Foundation level', icon: '●', color: 'text-neon-green' },
  { value: 'medium', label: 'Medium', desc: 'Intermediate',     icon: '●', color: 'text-neon-amber' },
  { value: 'hard',   label: 'Hard',   desc: 'Competitive exam', icon: '●', color: 'text-neon-red' },
  { value: 'all',    label: 'Mixed',  desc: 'All difficulties', icon: '◆', color: 'text-neon-cyan' },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

// ── Step indicator ────────────────────────────────────────────────
const StepDot = ({ step, current, label }: { step: number; current: number; label: string }) => {
  const done   = step < current;
  const active = step === current;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn(
        'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300',
        done   && 'bg-neon-cyan border-neon-cyan text-cyber-black shadow-[0_0_12px_rgba(0,245,255,0.6)]',
        active && 'bg-neon-violet/20 border-neon-violet text-neon-violet shadow-[0_0_12px_rgba(157,0,255,0.4)] animate-neon-pulse',
        !done && !active && 'border-white/15 text-white/20'
      )}>
        {done ? <Check size={14} /> : step}
      </div>
      <span className={cn('text-[10px] font-inter uppercase tracking-wider', active ? 'text-neon-violet' : done ? 'text-neon-cyan' : 'text-white/20')}>
        {label}
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
const TestSetupPage = () => {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1);
  const [topic,      setTopic]      = useState('');
  const [subtopics,  setSubtopics]  = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);
  const [subtopicsError, setSubtopicsError] = useState('');
  const [diff,       setDiff]       = useState('all');
  const [count,      setCount]      = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);

  const timeMin = count * 2;

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (!topic) {
      setSubtopics([]);
      setSelectedSubtopics([]);
      return;
    }

    const fetchSubtopics = async () => {
      setSubtopicsLoading(true);
      setSubtopicsError('');
      try {
        const res = await getSubtopicsApi(topic);
        console.info('Subtopics API response:', res);

        if (res.success && res.data) {
          const nextSubtopics = Array.isArray(res.data.subtopics) ? res.data.subtopics : [];
          setSubtopics(nextSubtopics);
          setSelectedSubtopics([]); // Reset selection when topic changes
          if (!Array.isArray(res.data.subtopics)) {
            setSubtopicsError('Subtopics response was malformed.');
          }
        } else {
          setSubtopics([]);
          setSubtopicsError(res.message || 'No subtopics found for the selected topic.');
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message 
          || 'Failed to fetch subtopics. Try again.';
        setSubtopicsError(msg);
        setSubtopics([]);
        console.error('Failed to fetch subtopics for topic:', topic, err);
      } finally {
        setSubtopicsLoading(false);
      }
    };

    fetchSubtopics();
  }, [topic]);

  // Toggle subtopic selection
  const toggleSubtopic = (subtopic: string) => {
    setSelectedSubtopics(prev => 
      prev.includes(subtopic)
        ? prev.filter(s => s !== subtopic)
        : [...prev, subtopic]
    );
  };

  // Called when user clicks "Start Now" inside the modal
  const handleLaunch = async (config: StartTestConfig) => {
    if (!topic) { setError('Please select a topic first.'); return; }

    setError('');
    setLoading(true);

    const questionCount = config.questionCount;
    const timeSeconds   = config.timeMinutes * 60;

    try {
      const res = await startTestApi({
        topic,
        difficulty: diff === 'all' ? undefined : diff,
        count: questionCount,
        title: `${topic}${selectedSubtopics.length > 0 ? ' — ' + selectedSubtopics.join(', ') : ''} — ${diff === 'all' ? 'Mixed' : diff.charAt(0).toUpperCase() + diff.slice(1)} (${questionCount}Q)`,
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
      });
      if (res.success && res.data) {
        setShowModal(false);
        navigate('/test', {
          state: {
            attemptId:      res.data.attemptId,
            questions:      res.data.questions,
            title:          res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime:      timeSeconds,
            isProctored:    config.environment === 'proctored',
          },
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start test. Please try again.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Initiate</p>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Test <span className="gradient-text-cyan-violet">Configuration</span>
          </h1>
        </div>
      </div>

      {/* Step indicator - Updated to show 4 steps */}
      <div className="flex items-center gap-2 mb-8 animate-fade-up text-sm">
        <StepDot step={1} current={step} label="Topic" />
        <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/30 via-white/10 to-neon-violet/30" />
        <StepDot step={2} current={step} label="Subtopic" />
        <div className="flex-1 h-px bg-gradient-to-r from-neon-violet/30 via-white/10 to-neon-cyan/30" />
        <StepDot step={3} current={step} label="Config" />
        <div className="flex-1 h-px bg-gradient-to-r from-neon-cyan/30 via-white/10 to-neon-violet/30" />
        <StepDot step={4} current={step} label="Launch" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Wizard steps ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: Topic */}
          {step === 1 && (
            <NeonCard variant="cyan" className="animate-fade-up" padding="p-6">
              <h2 className="font-inter font-semibold text-white mb-1 flex items-center gap-2">
                <Brain size={18} className="text-neon-cyan" />
                Choose Your Domain
              </h2>
              <p className="text-white/30 text-sm mb-5 font-inter">Select the aptitude category to practice</p>

              <div className="space-y-3">
                {TOPICS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setTopic(t.value); setError(''); }}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left group',
                      topic === t.value
                        ? t.color === 'cyan'    ? 'border-neon-cyan/60 bg-neon-cyan/8 shadow-[0_0_20px_rgba(0,245,255,0.15)]'
                        : t.color === 'violet'  ? 'border-neon-violet/60 bg-neon-violet/8 shadow-[0_0_20px_rgba(157,0,255,0.15)]'
                        : 'border-neon-magenta/60 bg-neon-magenta/8 shadow-[0_0_20px_rgba(255,0,170,0.15)]'
                        : 'border-white/8 hover:border-white/20 bg-white/[0.02]'
                    )}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div className="flex-1">
                      <p className={cn('font-inter font-semibold text-sm transition-colors',
                        topic === t.value
                          ? t.color === 'cyan' ? 'text-neon-cyan' : t.color === 'violet' ? 'text-neon-violet' : 'text-neon-magenta'
                          : 'text-white/70 group-hover:text-white/90')}>
                        {t.label}
                      </p>
                      <p className="text-white/30 text-xs font-inter mt-0.5">{t.desc}</p>
                    </div>
                    {topic === t.value && (
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        t.color === 'cyan' ? 'bg-neon-cyan text-cyber-black' : t.color === 'violet' ? 'bg-neon-violet text-white' : 'bg-neon-magenta text-white'
                      )}>
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                  <AlertTriangle size={14} className="text-neon-red" />
                  <p className="text-neon-red text-sm font-inter">{error}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <HoloButton variant="cyan" size="md" onClick={() => { if (!topic) { setError('Select a topic first.'); return; } setStep(2); }} icon={<ChevronRight size={16} />}>
                  Continue
                </HoloButton>
              </div>
            </NeonCard>
          )}

          {/* STEP 2: Subtopic Selection */}
          {step === 2 && (
            <NeonCard variant="magenta" className="animate-fade-up" padding="p-6">
              <h2 className="font-inter font-semibold text-white mb-1 flex items-center gap-2">
                <Layers size={18} className="text-neon-magenta" />
                Select Subtopics
              </h2>
              <p className="text-white/30 text-sm mb-5 font-inter">Choose one or more subtopics to customize your test</p>

              {subtopicsLoading && (
                <div className="text-center py-8">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-neon-magenta"></div>
                  </div>
                  <p className="text-white/40 text-sm mt-3 font-inter">Loading subtopics...</p>
                </div>
              )}

              {!subtopicsLoading && subtopics.length === 0 && !subtopicsError && (
                <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/25">
                  <p className="text-neon-cyan text-sm font-inter">
                    ✨ No specific subtopics found. Questions will be selected from the entire "{topic}" topic.
                  </p>
                </div>
              )}

              {subtopicsError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-neon-red/8 border border-neon-red/25 animate-fade-in mb-4">
                  <AlertTriangle size={14} className="text-neon-red" />
                  <p className="text-neon-red text-sm font-inter">{subtopicsError}</p>
                </div>
              )}

              {!subtopicsLoading && subtopics.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest font-inter">Available Subtopics ({subtopics.length})</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedSubtopics([...subtopics])}
                        className="text-xs text-neon-magenta hover:underline font-inter"
                      >
                        Select All
                      </button>
                      <span className="text-white/20">·</span>
                      <button
                        onClick={() => setSelectedSubtopics([])}
                        className="text-xs text-white/40 hover:text-white/60 font-inter"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {subtopics.map((subtopic) => (
                      <button
                        key={subtopic}
                        onClick={() => toggleSubtopic(subtopic)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left',
                          selectedSubtopics.includes(subtopic)
                            ? 'border-neon-magenta/60 bg-neon-magenta/10 shadow-[0_0_15px_rgba(255,0,170,0.15)]'
                            : 'border-white/8 hover:border-white/20 bg-white/[0.02]'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                          selectedSubtopics.includes(subtopic)
                            ? 'border-neon-magenta bg-neon-magenta/30'
                            : 'border-white/20 bg-transparent'
                        )}>
                          {selectedSubtopics.includes(subtopic) && (
                            <Check size={12} className="text-neon-magenta" />
                          )}
                        </div>
                        <span className={cn(
                          'text-sm font-inter transition-colors',
                          selectedSubtopics.includes(subtopic)
                            ? 'text-neon-magenta font-semibold'
                            : 'text-white/70 group-hover:text-white/90'
                        )}>
                          {subtopic}
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedSubtopics.length > 0 ? (
                    <div className="p-3 rounded-lg bg-neon-magenta/5 border border-neon-magenta/20 mb-4">
                      <p className="text-white/70 text-xs font-inter mb-2">
                        <span className="text-neon-magenta font-semibold">{selectedSubtopics.length}</span> subtopic{selectedSubtopics.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubtopics.map((s) => (
                          <span key={s} className="inline-block px-2 py-1 text-xs rounded-full bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 mb-4">
                      <p className="text-neon-cyan text-xs font-inter">
                        ✨ No subtopics selected — questions will be drawn from all subtopics in "{topic}".
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <HoloButton variant="ghost" size="md" onClick={() => { setStep(1); setSubtopicsError(''); }} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton 
                  variant="magenta" 
                  size="md" 
                  onClick={() => { 
                    setStep(3); 
                    setSubtopicsError('');
                  }} 
                  icon={<ChevronRight size={16} />}
                >
                  Continue
                </HoloButton>
              </div>
            </NeonCard>
          )}

          {/* STEP 3: Config */}
          {step === 3 && (
            <NeonCard variant="violet" className="animate-fade-up" padding="p-6">
              <h2 className="font-inter font-semibold text-white mb-1 flex items-center gap-2">
                <Zap size={18} className="text-neon-violet" />
                Configure Parameters
              </h2>
              <p className="text-white/30 text-sm mb-6 font-inter">Set difficulty and default question count</p>

              {/* Difficulty */}
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-inter">Difficulty Level</p>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDiff(d.value)}
                      className={cn(
                        'p-3.5 rounded-xl border text-left transition-all duration-200',
                        diff === d.value
                          ? 'border-neon-violet/60 bg-neon-violet/10 shadow-[0_0_15px_rgba(157,0,255,0.15)]'
                          : 'border-white/8 hover:border-white/20 bg-white/[0.02]'
                      )}
                    >
                      <span className={cn('text-sm font-bold mr-2', d.color)}>{d.icon}</span>
                      <span className="text-white/80 text-sm font-inter font-medium">{d.label}</span>
                      <p className="text-white/25 text-xs mt-1 font-inter">{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default question count */}
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-inter flex items-center gap-2">
                  <Hash size={12} /> Default Questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={cn(
                        'w-14 h-14 rounded-xl border-2 font-orbitron font-bold text-lg transition-all duration-200',
                        count === n
                          ? 'border-neon-violet bg-neon-violet/15 text-neon-violet shadow-[0_0_15px_rgba(157,0,255,0.3)]'
                          : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-white/20 text-xs mt-2 font-inter flex items-center gap-1.5">
                  <Clock size={11} /> Estimated time: {timeMin} minutes · Customisable in launch dialog
                </p>
              </div>

              <div className="flex justify-between">
                <HoloButton variant="ghost" size="md" onClick={() => setStep(2)} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton variant="violet" size="md" onClick={() => setStep(4)} icon={<ChevronRight size={16} />}>
                  Preview
                </HoloButton>
              </div>
            </NeonCard>
          )}

          {/* STEP 4: Confirm & Launch Modal */}
          {step === 4 && (
            <NeonCard variant="cyan" className="animate-fade-up" padding="p-6">
              <h2 className="font-inter font-semibold text-white mb-1 flex items-center gap-2">
                <Zap size={18} className="text-neon-cyan" />
                Ready to Launch
              </h2>
              <p className="text-white/30 text-sm mb-6 font-inter">Choose your environment and customize last details</p>

              {/* Summary cards */}
              <div className="grid gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/[0.025] border border-white/5">
                  <p className="text-white/30 text-xs font-inter mb-1">Domain</p>
                  <p className="font-orbitron font-bold text-lg text-neon-cyan">{topic}</p>
                </div>
                {selectedSubtopics.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/5">
                    <p className="text-white/30 text-xs font-inter mb-2">Subtopics ({selectedSubtopics.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSubtopics.map((s) => (
                        <span key={s} className="inline-block px-2 py-1 text-xs rounded-full bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/5">
                    <p className="text-white/30 text-xs font-inter mb-1">Difficulty</p>
                    <p className="font-orbitron font-bold text-lg text-neon-violet">{diff === 'all' ? 'Mixed' : diff}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.025] border border-white/5">
                    <p className="text-white/30 text-xs font-inter mb-1">Default Q</p>
                    <p className="font-orbitron font-bold text-lg text-neon-green">{count}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15 mb-5">
                <p className="text-neon-cyan text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Zap size={12} /> Final Configuration
                </p>
                <p className="text-white/35 text-xs font-inter">
                  Clicking "Configure & Launch" opens the test configuration dialog where you can set the exact number of questions, time limit, and choose between proctored or normal mode.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                  <AlertTriangle size={14} className="text-neon-red" />
                  <p className="text-neon-red text-sm font-inter">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <HoloButton variant="ghost" size="md" onClick={() => setStep(3)} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton variant="cyan" size="md" onClick={() => setShowModal(true)} icon={<ChevronRight size={16} />}>
                  Configure & Launch
                </HoloButton>
              </div>
            </NeonCard>
          )}
        </div>

        {/* ── Right: Live Preview ────────────────────────────– */}
        <NeonCard variant="default" padding="p-5" className="h-fit animate-fade-up-delay">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-4 font-inter">Configuration Preview</p>

          <div className="space-y-4">
            {[
              { label: 'Domain', value: topic || '—', color: 'neon-cyan' },
              selectedSubtopics.length > 0 ? { label: 'Subtopics', value: `${selectedSubtopics.length} selected`, color: 'neon-magenta' } : null,
              { label: 'Difficulty', value: diff === 'all' ? 'Mixed' : diff.charAt(0).toUpperCase() + diff.slice(1), color: 'neon-violet' },
              { label: 'Questions', value: `${count} Q`, color: 'neon-green' },
              { label: 'Est. Time', value: `${timeMin} min`, color: 'neon-amber' },
            ].filter(Boolean).map((item) => (
              <div key={item!.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.025] border border-white/5">
                <span className="text-white/30 text-xs font-inter">{item!.label}</span>
                <span className={cn('text-xs font-mono-code font-semibold', `text-${item!.color}`)}>
                  {item!.value}
                </span>
              </div>
            ))}

            <div className="flex justify-center mt-4">
              <div className="relative">
                <svg width={100} height={100} viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx={50} cy={50} r={40} strokeWidth={5} stroke="rgba(255,255,255,0.06)" fill="none" />
                  <circle cx={50} cy={50} r={40} strokeWidth={5}
                    stroke="#00F5FF" fill="none" strokeLinecap="round"
                    strokeDasharray={251.3}
                    strokeDashoffset={251.3 - (count / 30) * 251.3}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,255,0.8))', transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-orbitron text-xl font-bold text-neon-cyan">{count}</span>
                  <span className="text-white/25 text-[10px]">questions</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>
      </div>

      {/* ── Start Test Modal ───────────────────────────────────── */}
      <StartTestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleLaunch}
        loading={loading}
        defaultCount={count}
        defaultTime={timeMin}
      />
    </AppLayout>
  );
};

export default TestSetupPage;
