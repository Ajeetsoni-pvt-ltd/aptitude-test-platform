// frontend/src/hooks/useAntiCheat.ts
// ─────────────────────────────────────────────────────────────
// Custom Hook: Anti-cheat detection
// Tab switch, window blur, right-click detect karo [web:178]
// Kyun: Online exams mein cheating rokna zaroori hai
// HackerRank, TCS NQT sab yahi technique use karte hain
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

interface AntiCheatWarning {
  type: 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT';
  message: string;
  timestamp: Date;
}

interface UseAntiCheatReturn {
  warningCount: number;
  lastWarning: AntiCheatWarning | null;
  isWarningVisible: boolean;
  dismissWarning: () => void;
  violations: AntiCheatWarning[];
}

const MAX_WARNINGS = 3; // Itne warnings ke baad auto-submit message

const useAntiCheat = (isTestActive: boolean): UseAntiCheatReturn => {
  const [warningCount, setWarningCount]       = useState(0);
  const [lastWarning, setLastWarning]         = useState<AntiCheatWarning | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [violations, setViolations]           = useState<AntiCheatWarning[]>([]);

  // Ref use karo — stale closure avoid ke liye
  const isActiveRef = useRef(isTestActive);
  useEffect(() => { isActiveRef.current = isTestActive; }, [isTestActive]);

  // ─── Warning add karo ─────────────────────────────────────
  const addWarning = useCallback((type: AntiCheatWarning['type'], message: string) => {
    if (!isActiveRef.current) return; // Test active nahi → ignore

    const warning: AntiCheatWarning = { type, message, timestamp: new Date() };

    setViolations((prev) => [...prev, warning]);
    setLastWarning(warning);
    setWarningCount((prev) => prev + 1);
    setIsWarningVisible(true);
  }, []);

  // ─── Tab Switch Detection ──────────────────────────────────
  // visibilitychange event → document.hidden check karo [web:180]
  useEffect(() => {
    if (!isTestActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addWarning(
          'TAB_SWITCH',
          '⚠️ Tab switch detect hua! Exam mein tab switch karna allowed nahi hai.'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTestActive, addWarning]);

  // ─── Window Blur Detection ────────────────────────────────
  // Alt+Tab ya outside click detect karo [web:182]
  useEffect(() => {
    if (!isTestActive) return;

    const handleBlur = () => {
      addWarning(
        'WINDOW_BLUR',
        '⚠️ Window focus kho gayi! Alt+Tab ya bahar click allowed nahi hai.'
      );
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isTestActive, addWarning]);

  // ─── Right Click Block ─────────────────────────────────────
  useEffect(() => {
    if (!isTestActive) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Right click block
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [isTestActive]);

  // ─── Copy Paste Block ──────────────────────────────────────
  useEffect(() => {
    if (!isTestActive) return;

    const blockCopyPaste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', blockCopyPaste);
    return () => document.removeEventListener('keydown', blockCopyPaste);
  }, [isTestActive]);

  // ─── Warning Dismiss ───────────────────────────────────────
  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false);
  }, []);

  // ─── Max warnings reached? → Log karo ─────────────────────
  useEffect(() => {
    if (warningCount >= MAX_WARNINGS) {
      console.warn(`🚨 Max warnings (${MAX_WARNINGS}) reached!`);
    }
  }, [warningCount]);

  return { warningCount, lastWarning, isWarningVisible, dismissWarning, violations };
};

export default useAntiCheat;
