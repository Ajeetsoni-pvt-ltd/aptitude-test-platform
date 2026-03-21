// frontend/src/api/axios.ts
// ─────────────────────────────────────────────────────────────
// Axios Instance — Centralized HTTP Client
// Request Interceptor  → Har request mein JWT token attach karo
// Response Interceptor → 401 pe auto logout karo
// Kyun: Har component mein token manually likhna avoid karte hain [web:117]
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

// ─── Axios Instance Create karo ───────────────────────────────
// baseURL → .env se aata hai (VITE_API_BASE_URL)
// timeout → 10 seconds ke baad request fail karao (server hang na kare)
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST Interceptor ───────────────────────────────────────
// Har request bhejne se PEHLE yeh chalega
// Token localStorage se nikalo aur header mein lagao
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apt_token'); // 'apt' = aptitude platform
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Modified config return karo
  },
  (error) => {
    // Request banne mein hi error aaya (rare case)
    return Promise.reject(error);
  }
);

// ─── RESPONSE Interceptor ──────────────────────────────────────
// Har response aane ke BAAD yeh chalega
// 401 → Token expire ho gaya → Logout karo + Login pe bhejo [web:116]
apiClient.interceptors.response.use(
  (response) => {
    // ✅ Successful response → directly return karo
    return response;
  },
  (error) => {
    // ❌ Error response
    if (error.response?.status === 401) {
      // Token invalid/expired → cleanup karo
      localStorage.removeItem('apt_token');
      localStorage.removeItem('apt_user');

      // Login page pe redirect karo (agar already /login pe nahi hain)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Error aage propagate karo → calling component handle karega
    return Promise.reject(error);
  }
);

export default apiClient;
