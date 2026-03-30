// src/pages/LoginPage.tsx
// Futuristic cyber-neon login with glassmorphism card + scanline overlay

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Mail, Lock, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate  = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  const validate = (): boolean => {
    const errors = { email: '', password: '' };
    let valid    = true;
    if (!formData.email.trim()) {
      errors.email = 'Email is required.'; valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address.'; valid = false;
    }
    if (!formData.password) {
      errors.password = 'Password is required.'; valid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Minimum 6 characters required.'; valid = false;
    }
    setFormErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard', { replace: true });
    } catch { /* error in store */ }
  };

  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">

      {/* ── Ambient glows ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #00F5FF, transparent 65%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 cyber-grid opacity-40" />
        {/* Scan line */}
        <div className="absolute left-0 right-0 h-[2px] opacity-10 animate-scan"
          style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, transparent)' }} />
      </div>

      {/* ── Login Card ────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">

        {/* Logo block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
            bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20
            border border-neon-cyan/30 shadow-[0_0_30px_rgba(0,245,255,0.3)]
            animate-float">
            <Zap size={28} className="text-neon-cyan" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-wider">
            NEXUS
          </h1>
          <p className="text-white/35 text-sm font-inter mt-1 tracking-widest uppercase">
            Aptitude Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">

          {/* Card header stripe */}
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #00F5FF, #9D00FF, #FF00AA)' }} />

          <div className="p-8">
            <h2 className="font-inter text-xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-white/35 text-sm font-inter mb-6">Sign in to your neural session</p>

            {/* API Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
                <p className="text-neon-red text-sm font-inter leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <CyberInput
                label="Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="agent@nexus.io"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                error={formErrors.email}
                icon={<Mail size={16} />}
              />

              <CyberInput
                label="Password"
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                error={formErrors.password}
                icon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <HoloButton
                type="submit"
                variant="cyan"
                size="lg"
                fullWidth
                loading={isLoading}
                className="mt-2 font-orbitron tracking-widest"
              >
                INITIALIZE SESSION
              </HoloButton>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/20 text-xs font-inter">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Register link */}
            <p className="text-center text-white/35 text-sm font-inter">
              New to Nexus?{' '}
              <Link to="/register" className="text-neon-cyan hover:text-neon-cyan/80 font-semibold transition-colors hover:underline underline-offset-2">
                Create account →
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/15 text-xs font-inter mt-6 tracking-wider">
          CLASSIFIED PLATFORM • AUTHORIZED ACCESS ONLY
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
