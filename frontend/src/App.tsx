// frontend/src/App.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import AppRouter from '@/routes/AppRouter';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  return <AppRouter />;
}

export default App;
