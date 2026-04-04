// frontend/src/store/themeStore.ts
// ─────────────────────────────────────────────────────────────
// Zustand Theme Store — Global Theme State Management
// Persists user's theme preference to localStorage
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';

// ─── localStorage Key ────────────────────────────────────────
const THEME_KEY = 'apt_theme';

// ─── Theme Type ─────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';

// ─── Store State + Actions ka TypeScript Type ─────────────────
interface ThemeState {
  // State
  theme: ThemeMode;
  
  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;  toggleThemeTemporarily: () => void;  initTheme: () => void;  // Call on app start to restore saved theme
}

// ─── Store Create karo ────────────────────────────────────────
export const useThemeStore = create<ThemeState>((set, get) => ({
  
  // ─── Initial State ─────────────────────────────────────────
  theme: 'dark',

  // ═══════════════════════════════════════════════════════════
  // ACTION: setTheme
  // Set the theme and persist to localStorage
  // Also apply to document element for Tailwind's darkMode
  // ═══════════════════════════════════════════════════════════
  setTheme: (theme: ThemeMode) => {
    set({ theme });
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: toggleTheme
  // Switch between dark and light modes
  // ═══════════════════════════════════════════════════════════
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: toggleThemeTemporarily
  // Switch theme during test without persisting to localStorage
  // This allows flexible theme switching during tests without
  // overwriting the user's saved global preference
  // ═══════════════════════════════════════════════════════════
  toggleThemeTemporarily: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    applyTheme(newTheme);
    // Note: Does NOT call localStorage.setItem - theme reverts on page reload
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: initTheme
  // App start hone pe call karo (App.tsx mein)
  // localStorage se saved theme fetch karo, not found ho to 'dark' use karo
  // ═══════════════════════════════════════════════════════════
  initTheme: () => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const theme = (savedTheme && ['dark', 'light'].includes(savedTheme)) ? savedTheme : 'dark';
    
    set({ theme });
    applyTheme(theme);
  },
}));

// ─── Helper: Apply theme to DOM ──────────────────────────────
// This function applies the theme by:
// 1. Adding/removing 'light' class on document element for custom CSS
// 2. Setting CSS variables for non-Tailwind components
function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;
  
  if (theme === 'light') {
    doc.classList.add('light');
  } else {
    doc.classList.remove('light');
  }
  
  // Optional: Set custom CSS variable for non-Tailwind components
  doc.style.setProperty('--theme-mode', theme);
}
