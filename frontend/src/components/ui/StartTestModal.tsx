// frontend/src/components/ui/StartTestModal.tsx
// Modal: Customize questions, time, and proctoring mode before launching test.

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield, BookOpen, Clock, Sliders, X, Camera, EyeOff,
  AlertTriangle, ChevronRight
} from 'lucide-react';
import HoloButton from './HoloButton';

type TestEnvironment = 'proctored' | 'normal';

interface StartTestModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onStart:        (config: StartTestConfig) => void;
  loading:        boolean;
  defaultCount?:  number;
  defaultTime?:   number; // in minutes
}

export interface StartTestConfig {
  questionCount:  number;
  timeMinutes:    number;
  environment:    TestEnvironment;
}

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;
const MIN_TIME      = 5;
const MAX_TIME      = 180;

const StartTestModal = ({
  isOpen, onClose, onStart, loading,
  defaultCount = 10,
  defaultTime,
}: StartTestModalProps) => {
  const [count,       setCount]       = useState(defaultCount);
  const [time,        setTime]        = useState(defaultTime ?? defaultCount * 2);
  const [environment, setEnvironment] = useState<TestEnvironment>('proctored');
  const [countInput,  setCountInput]  = useState(String(defaultCount));
  const [timeInput,   setTimeInput]   = useState(String(defaultTime ?? defaultCount * 2));

  // Sync sliders ↔ text inputs
  const handleCountChange = (val: number) => {
    const v = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, val));
    setCount(v); setCountInput(String(v));
    if (!defaultTime) { setTime(v * 2); setTimeInput(String(v * 2)); }
  };
  const handleTimeChange = (val: number) => {
    const v = Math.max(MIN_TIME, Math.min(MAX_TIME, val));
    setTime(v); setTimeInput(String(v));
  };

  // Reset on re-open
  useEffect(() => {
    if (isOpen) {
      handleCountChange(defaultCount);
    }
  }, [isOpen, defaultCount]);

  if (!isOpen) return null;

  const countPct = ((count - MIN_QUESTIONS) / (MAX_QUESTIONS - MIN_QUESTIONS)) * 100;
  const timePct  = ((time  - MIN_TIME)      / (MAX_TIME - MIN_TIME)) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg pointer-events-auto animate-fade-up"
          style={{
            background: 'rgba(8,8,16,0.95)',
            border: '1px solid rgba(0,245,255,0.2)',
            borderRadius: '20px',
            boxShadow: '0 0 80px rgba(0,245,255,0.12), 0 0 160px rgba(157,0,255,0.08)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 flex items-center justify-center">
                <Sliders size={18} className="text-neon-cyan" />
              </div>
              <div>
                <h2 className="font-orbitron text-lg font-bold text-white">Configure Test</h2>
                <p className="text-white/30 text-xs font-inter mt-0.5">Customize your session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white/70 hover:border-white/20 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* ── Question Count ─────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest font-inter">
                  <BookOpen size={13} className="text-neon-cyan" />
                  Questions
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={MIN_QUESTIONS} max={MAX_QUESTIONS}
                    value={countInput}
                    onChange={e => { setCountInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n)) handleCountChange(n); }}
                    onBlur={() => handleCountChange(parseInt(countInput) || MIN_QUESTIONS)}
                    className="w-16 h-8 text-center font-orbitron font-bold text-neon-cyan text-sm bg-transparent border border-neon-cyan/30 rounded-lg focus:outline-none focus:border-neon-cyan/70 transition-colors"
                  />
                </div>
              </div>
              {/* Slider */}
              <div className="relative h-2 bg-white/5 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
                  style={{ width: `${countPct}%`, background: 'linear-gradient(90deg, #00F5FF, #9D00FF)', boxShadow: '0 0 8px rgba(0,245,255,0.5)' }}
                />
                <input
                  type="range" min={MIN_QUESTIONS} max={MAX_QUESTIONS} value={count}
                  onChange={e => handleCountChange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  style={{ accentColor: '#00F5FF' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neon-cyan border-2 border-cyber-black shadow-[0_0_8px_rgba(0,245,255,0.8)] pointer-events-none transition-all"
                  style={{ left: `calc(${countPct}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/20 font-mono-code">{MIN_QUESTIONS}</span>
                <span className="text-[10px] text-white/20 font-mono-code">{MAX_QUESTIONS}</span>
              </div>
            </div>

            {/* ── Time ──────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-widest font-inter">
                  <Clock size={13} className="text-neon-amber" />
                  Time Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={MIN_TIME} max={MAX_TIME}
                    value={timeInput}
                    onChange={e => { setTimeInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n)) handleTimeChange(n); }}
                    onBlur={() => handleTimeChange(parseInt(timeInput) || MIN_TIME)}
                    className="w-16 h-8 text-center font-orbitron font-bold text-neon-amber text-sm bg-transparent border border-neon-amber/30 rounded-lg focus:outline-none focus:border-neon-amber/70 transition-colors"
                  />
                  <span className="text-white/30 text-xs font-inter">min</span>
                </div>
              </div>
              <div className="relative h-2 bg-white/5 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
                  style={{ width: `${timePct}%`, background: 'linear-gradient(90deg, #FFB700, #FF6B00)', boxShadow: '0 0 8px rgba(255,183,0,0.5)' }}
                />
                <input
                  type="range" min={MIN_TIME} max={MAX_TIME} value={time}
                  onChange={e => handleTimeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neon-amber border-2 border-cyber-black shadow-[0_0_8px_rgba(255,183,0,0.8)] pointer-events-none"
                  style={{ left: `calc(${timePct}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-white/20 font-mono-code">{MIN_TIME}m</span>
                <span className="text-[10px] text-white/20 font-mono-code">{MAX_TIME}m</span>
              </div>
            </div>

            {/* ── Environment Toggle ─────────────────────────── */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest font-inter mb-3 flex items-center gap-2">
                <Shield size={13} className="text-neon-violet" />
                Test Environment
              </p>
              <div className="grid grid-cols-2 gap-3">

                {/* Proctored */}
                <button
                  onClick={() => setEnvironment('proctored')}
                  className={cn(
                    'relative p-4 rounded-xl border text-left transition-all duration-300 group overflow-hidden',
                    environment === 'proctored'
                      ? 'border-neon-violet/60 bg-neon-violet/10 shadow-[0_0_20px_rgba(157,0,255,0.2)]'
                      : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                  )}
                >
                  {environment === 'proctored' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 to-transparent" />
                  )}
                  <div className="relative z-10">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                      environment === 'proctored'
                        ? 'bg-neon-violet/20 text-neon-violet'
                        : 'bg-white/5 text-white/30 group-hover:text-white/50'
                    )}>
                      <Camera size={16} />
                    </div>
                    <p className={cn(
                      'font-inter font-semibold text-sm',
                      environment === 'proctored' ? 'text-neon-violet' : 'text-white/60'
                    )}>
                      Full Test
                    </p>
                    <p className="text-white/30 text-[11px] mt-1 font-inter">📹 Camera · Fullscreen · Tab Watch</p>
                    {environment === 'proctored' && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-neon-pulse" />
                        <span className="text-neon-violet text-[10px] font-mono-code">PROCTORED</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Normal */}
                <button
                  onClick={() => setEnvironment('normal')}
                  className={cn(
                    'relative p-4 rounded-xl border text-left transition-all duration-300 group overflow-hidden',
                    environment === 'normal'
                      ? 'border-neon-cyan/60 bg-neon-cyan/10 shadow-[0_0_20px_rgba(0,245,255,0.2)]'
                      : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
                  )}
                >
                  {environment === 'normal' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent" />
                  )}
                  <div className="relative z-10">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                      environment === 'normal'
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'bg-white/5 text-white/30 group-hover:text-white/50'
                    )}>
                      <EyeOff size={16} />
                    </div>
                    <p className={cn(
                      'font-inter font-semibold text-sm',
                      environment === 'normal' ? 'text-neon-cyan' : 'text-white/60'
                    )}>
                      Normal
                    </p>
                    <p className="text-white/30 text-[11px] mt-1 font-inter">📖 No camera · No monitoring</p>
                    {environment === 'normal' && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                        <span className="text-neon-cyan text-[10px] font-mono-code">RELAXED</span>
                      </div>
                    )}
                  </div>
                </button>

              </div>

              {/* Proctored warnings */}
              {environment === 'proctored' && (
                <div className="mt-3 p-3 rounded-xl bg-neon-amber/5 border border-neon-amber/20 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-neon-amber flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-white/40 font-inter space-y-0.5">
                      <p>• Camera access required. Face must stay in frame.</p>
                      <p>• After 3 tab switches, test is auto-submitted.</p>
                      <p>• Fullscreen is mandatory. Escape triggers warning.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Summary ───────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Questions', value: count, color: 'text-neon-cyan' },
                { label: 'Minutes',   value: time,  color: 'text-neon-amber' },
                { label: 'Mode',      value: environment === 'proctored' ? 'SECURED' : 'OPEN', color: environment === 'proctored' ? 'text-neon-violet' : 'text-neon-green' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.025] border border-white/5">
                  <p className={cn('font-orbitron font-bold text-xl', s.color)}>{s.value}</p>
                  <p className="text-white/25 text-[10px] font-inter mt-0.5 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Actions ───────────────────────────────────── */}
            <div className="flex gap-3">
              <HoloButton variant="ghost" size="md" onClick={onClose} className="flex-1">
                Cancel
              </HoloButton>
              <HoloButton
                variant={environment === 'proctored' ? 'violet' : 'cyan'}
                size="md"
                loading={loading}
                onClick={() => onStart({ questionCount: count, timeMinutes: time, environment })}
                icon={<ChevronRight size={16} />}
                className="flex-[2] font-orbitron tracking-widest"
              >
                {environment === 'proctored' ? '🔐 START SECURED' : '🚀 START NOW'}
              </HoloButton>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default StartTestModal;
