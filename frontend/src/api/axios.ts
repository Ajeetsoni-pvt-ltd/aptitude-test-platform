// frontend/src/api/axios.ts
// ─────────────────────────────────────────────────────────────
// Axios Instance — Centralized HTTP Client
// ─────────────────────────────────────────────────────────────

import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
  const raw = value?.trim() || '/api';
  const withoutTrailingSlash = raw.replace(/\/$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

export const BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

// ─── Axios Instance ───────────────────────────────────────────
// IMPORTANT: Do NOT set a default Content-Type header here.
// Axios auto-sets Content-Type based on the request body:
//   - JSON data → application/json
//   - FormData  → multipart/form-data (with correct boundary)
// A hardcoded Content-Type breaks file uploads (multer requires
// multipart/form-data with boundary, which only the browser can set).
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 120s — Gemini AI responses can take 30-90s
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
