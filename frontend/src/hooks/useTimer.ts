// frontend/src/hooks/useTimer.ts
// ─────────────────────────────────────────────────────────────
// Custom Hook: Countdown Timer
// totalSeconds se countdown karo
// timeUp callback → auto submit trigger hoga
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  timeLeft: number;       // Seconds bacha hai
  formattedTime: string;  // "MM:SS" format
  isRunning: boolean;
  isTimeUp: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  elapsedSeconds: number; // Kitna time gaya (submit ke liye)
}

const useTimer = (
  totalSeconds: number,
  onTimeUp: () => void   // Time khatam hone par call hoga
): UseTimerReturn => {
  const [timeLeft, setTimeLeft]   = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isTimeUp, setIsTimeUp]   = useState(false);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time (total - remaining)
  const elapsedSeconds = totalSeconds - timeLeft;

  // ─── Timer Start ───────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsTimeUp(true);
          setIsRunning(false);
          onTimeUp(); // Parent ko batao → auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, onTimeUp]);

  // ─── MM:SS format ─────────────────────────────────────────
  const formattedTime = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;

  const pauseTimer  = useCallback(() => setIsRunning(false), []);
  const resumeTimer = useCallback(() => setIsRunning(true), []);

  return {
    timeLeft, formattedTime, isRunning,
    isTimeUp, pauseTimer, resumeTimer, elapsedSeconds
  };
};

export default useTimer;
