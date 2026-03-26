// frontend/src/hooks/useFullscreen.ts
// ─────────────────────────────────────────────────────────────
// Custom Hook: Fullscreen API wrapper
// Kyun: Browser fullscreen API thoda verbose hai + cross-browser issues
// Yeh hook ek clean interface deta hai [web:175]
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

const useFullscreen = (): UseFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── Fullscreen state track karo ──────────────────────────
  // User ESC press kare toh bhi detect hona chahiye
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // ─── Enter Fullscreen ──────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  // ─── Exit Fullscreen ───────────────────────────────────────
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen };
};

export default useFullscreen;
