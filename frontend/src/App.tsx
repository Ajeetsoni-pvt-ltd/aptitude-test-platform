// frontend/src/App.tsx
// ─────────────────────────────────────────────────────────────
// App Root — initAuth call karo on startup
// initAuth → localStorage check → token restore karo
// ─────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // App start hone pe ek baar chalega
    // localStorage mein saved token/user → Zustand mein restore hoga
    initAuth();
  }, [initAuth]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mt-10 text-indigo-600">
        🎯 Aptitude Test Platform
      </h1>
      <p className="text-center text-gray-500 mt-2">
        Frontend Setup Complete! Step 4 mein Router add hoga.
      </p>
    </div>
  );
}

export default App;
