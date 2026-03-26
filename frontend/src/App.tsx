// frontend/src/App.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AppRouter from '@/routes/AppRouter';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <AppRouter />;
}

export default App;
