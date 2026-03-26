// frontend/src/pages/LoginPage.tsx
// ─────────────────────────────────────────────────────────────
// Login Page — Email + Password form
// Zustand authStore se login() action use karo
// Success → /dashboard, Error → form mein dikhao
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const LoginPage = () => {
  const navigate  = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  // ─── Local Form State ──────────────────────────────────────
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });

  // ─── Input Change Handler ──────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // User type kare toh error clear ho
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  // ─── Client-side Validation ────────────────────────────────
  const validate = (): boolean => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = 'Email required hai.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email daalo (example@gmail.com).';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password required hai.';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password kam se kam 6 characters ka hona chahiye.';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // ─── Form Submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard', { replace: true }); // Success → Dashboard
    } catch {
      // Error Zustand store mein already save ho gaya → UI mein dikhega
    }
  };

  // ─── UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ─── Logo + Title ──────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-gray-900">Aptitude Test Platform</h1>
          <p className="text-gray-500 mt-1">TCS NQT • CAT • Bank Exams</p>
        </div>

        {/* ─── Login Card ────────────────────────────────── */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Welcome Back! 👋
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Apne account mein login karo
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ─── API Error Message ──────────────────────── */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ─── Email Field ──────────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ajeet@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">⚠ {formErrors.email}</p>
                )}
              </div>

              {/* ─── Password Field ───────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${formErrors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">⚠ {formErrors.password}</p>
                )}
              </div>

              {/* ─── Submit Button ────────────────────────── */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-lg">⏳</span>
                    Login ho raha hai...
                  </span>
                ) : (
                  '🔐 Login Karo'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-gray-500 text-sm">
              Account nahi hai?{' '}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                Register karo →
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
