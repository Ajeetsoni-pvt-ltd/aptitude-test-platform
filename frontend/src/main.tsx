// frontend/src/main.tsx
// ─────────────────────────────────────────────────────────────
// App Entry Point
// BrowserRouter → React Router ka context provide karta hai
// Sab routes BrowserRouter ke andar hone chahiye [web:133]
// ─────────────────────────────────────────────────────────────

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
