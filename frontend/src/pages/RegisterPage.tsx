// src/pages/RegisterPage.tsx
// Futuristic cyber-neon registration

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const navigate  = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass]    = useState(false);
  const [showConf, setShowConf]    = useState(false);
  const [success,  setSuccess]     = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  const validate = (): boolean => {
    const errors = { name: '', email: '', password: '', confirmPassword: '' };
    let valid    = true;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name required (min 2 chars).'; valid = false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email required.'; valid = false;
    }
    if (formData.password.length < 6) {
      errors.password = 'Minimum 6 characters.'; valid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'; valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch { /* error in store */ }
  };

  // Password strength
  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColors = ['', '#FF3366', '#FFB700', '#FFB700', '#00FF88', '#00FF88'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Neural-grade'];

  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #00F5FF, transparent 65%)' }} />
        <div className="absolute inset-0 cyber-grid opacity-40" />
        <div className="absolute left-0 right-0 h-[2px] opacity-10 animate-scan"
          style={{ background: 'linear-gradient(90deg, transparent, #9D00FF, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3
            bg-gradient-to-br from-neon-violet/20 to-neon-magenta/20
            border border-neon-violet/30 shadow-[0_0_25px_rgba(157,0,255,0.3)]
            animate-float">
            <Zap size={24} className="text-neon-violet" />
          </div>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wider">CREATE ACCOUNT</h1>
          <p className="text-white/30 text-xs font-inter mt-1 tracking-widest uppercase">Neural Identity Registration</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #9D00FF, #FF00AA, #9D00FF)' }} />

          <div className="p-7">
            <h2 className="font-inter text-lg font-semibold text-white mb-1">Register</h2>
            <p className="text-white/30 text-sm font-inter mb-6">Initialize your neural profile</p>

            {/* Success state */}
            {success && (
              <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-neon-green/8 border border-neon-green/25 animate-fade-in">
                <CheckCircle2 size={16} className="text-neon-green flex-shrink-0" />
                <p className="text-neon-green text-sm font-inter">Identity verified! Entering NEXUS...</p>
              </div>
            )}

            {/* API Error */}
            {error && !success && (
              <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
                <p className="text-neon-red text-sm font-inter">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <CyberInput
                label="Full Name"
                id="name"
                name="name"
                type="text"
                placeholder="Agent Name"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading || success}
                error={formErrors.name}
                icon={<User size={15} />}
              />

              <CyberInput
                label="Email Address"
                id="email"
                name="email"
                type="email"
                placeholder="agent@nexus.io"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading || success}
                error={formErrors.email}
                icon={<Mail size={15} />}
              />

              <div className="space-y-1.5">
                <CyberInput
                  label="Password"
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading || success}
                  error={formErrors.password}
                  icon={<Lock size={15} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPass((s) => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                {/* Strength bar */}
                {formData.password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4,5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: pwStrength >= i ? strengthColors[pwStrength] : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-inter" style={{ color: strengthColors[pwStrength] }}>
                      {strengthLabels[pwStrength]}
                    </span>
                  </div>
                )}
              </div>

              <CyberInput
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type={showConf ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading || success}
                error={formErrors.confirmPassword}
                icon={<Lock size={15} />}
                rightIcon={
                  <button type="button" onClick={() => setShowConf((s) => !s)} className="text-white/30 hover:text-white/60 transition-colors">
                    {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <HoloButton
                type="submit"
                variant="violet"
                size="lg"
                fullWidth
                loading={isLoading || success}
                className="mt-3 font-orbitron tracking-widest"
              >
                REGISTER IDENTITY
              </HoloButton>
            </form>

            <p className="text-center text-white/30 text-sm font-inter mt-5">
              Already registered?{' '}
              <Link to="/login" className="text-neon-violet hover:text-neon-violet/80 font-semibold transition-colors hover:underline underline-offset-2">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
