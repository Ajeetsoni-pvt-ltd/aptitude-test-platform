// frontend/src/api/axios.ts
// ─────────────────────────────────────────────────────────────
// Axios Instance — Centralized HTTP Client
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

// 🔥 Base URL (env + fallback)
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://13.201.55.196:5000';

// ─── Axios Instance ───────────────────────────────────────────
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`, // ✅ IMPORTANT (/api added)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST Interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apt_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE Interceptor ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔴 Unauthorized → Auto logout
    if (error.response?.status === 401) {
      localStorage.removeItem('apt_token');
      localStorage.removeItem('apt_user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;