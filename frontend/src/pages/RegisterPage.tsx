// src/pages/RegisterPage.tsx
// ─────────────────────────────────────────────────────────────
// Registration Page — Updated for Email Verification Flow
// After signup → shows "Check your email" success screen
// Includes resend verification option
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { resendVerificationApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Mail, Lock, User, Eye, EyeOff, Zap, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const RegisterPage = () => {
  const { register, isLoading, error, clearError, registrationSuccess, registrationEmail, clearRegistration } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeName: '',
    branch: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    collegeName: '',
    branch: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  // Resend verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
    clearError();
  };

  const validate = (): boolean => {
    const errors = {
      name: '',
      email: '',
      collegeName: '',
      branch: '',
      section: '',
      password: '',
      confirmPassword: '',
    };
    let valid = true;

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name required (min 2 chars).';
      valid = false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email required.';
      valid = false;
    }
    if (!formData.collegeName.trim() || formData.collegeName.trim().length < 2) {
      errors.collegeName = 'College name is required.';
      valid = false;
    }
    if (!formData.branch.trim() || formData.branch.trim().length < 2) {
      errors.branch = 'Branch is required.';
      valid = false;
    }
    if (!formData.section.trim()) {
      errors.section = 'Section is required.';
      valid = false;
    }

    // Strong password validation
    const p = formData.password;
    if (p.length < 8) {
      errors.password = 'Minimum 8 characters.';
      valid = false;
    } else if (!/[A-Z]/.test(p)) {
      errors.password = 'Must contain an uppercase letter.';
      valid = false;
    } else if (!/[a-z]/.test(p)) {
      errors.password = 'Must contain a lowercase letter.';
      valid = false;
    } else if (!/[0-9]/.test(p)) {
      errors.password = 'Must contain a number.';
      valid = false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p)) {
      errors.password = 'Must contain a special character.';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        collegeName: formData.collegeName.trim(),
        branch: formData.branch.trim(),
        section: formData.section.trim(),
      });
      // registrationSuccess will be set by the store
    } catch {
      // store handles visible error state
    }
  };

  const handleResendVerification = async () => {
    if (!registrationEmail || resendCooldown > 0) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendVerificationApi(registrationEmail);
      setResendMessage(res.message);
      // Start 60s cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColors = ['', '#FF3366', '#FFB700', '#FFB700', '#00FF88', '#00FF88'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  // ─── Post-Signup Success Screen ─────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10]"
            style={{ background: 'radial-gradient(circle, #00FF88, transparent 65%)' }}
          />
          <div
            className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }}
          />
          <div className="absolute inset-0 cyber-grid opacity-40" />
        </div>

        <div className="relative z-10 w-full max-w-md animate-fade-up">
          <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
            <div
              className="h-0.5 w-full"
              style={{ background: 'linear-gradient(90deg, #00FF88, #00CCAA, #9D00FF)' }}
            />

            <div className="p-8 text-center">
              {/* Success Icon */}
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                bg-gradient-to-br from-neon-green/15 to-neon-green/5
                border border-neon-green/30 shadow-[0_0_40px_rgba(0,255,136,0.2)]
                animate-float"
              >
                <Mail size={32} className="text-neon-green" />
              </div>

              <h1 className="font-orbitron text-2xl font-bold text-white tracking-wider mb-3">
                CHECK YOUR EMAIL
              </h1>
              <p className="text-white/50 text-sm font-inter mb-2 leading-relaxed">
                We&apos;ve sent a verification link to
              </p>
              <p className="text-neon-green font-inter font-semibold text-base mb-6">
                {registrationEmail}
              </p>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 text-left">
                <p className="text-white/40 text-sm font-inter leading-relaxed">
                  📧 Click the link in the email to verify your account.
                  <br />
                  ⏱ The link expires in <strong className="text-white/60">30 minutes</strong>.
                  <br />
                  📥 Check your spam folder if you don&apos;t see it.
                </p>
              </div>

              {/* Resend Verification */}
              <div className="mb-6">
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0}
                  className="inline-flex items-center gap-2 text-sm font-inter text-neon-violet hover:text-neon-violet/80
                    transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : resendLoading
                      ? 'Sending...'
                      : 'Resend verification email'}
                </button>
                {resendMessage && (
                  <p className="text-white/40 text-xs mt-2 font-inter">{resendMessage}</p>
                )}
              </div>

              {/* Login Link */}
              <Link
                to="/login"
                onClick={() => clearRegistration()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                  bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10
                  border border-white/10 hover:border-neon-cyan/30
                  text-white font-inter text-sm font-medium
                  transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,245,255,0.1)]"
              >
                Go to Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Form ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #00F5FF, transparent 65%)' }}
        />
        <div className="absolute inset-0 cyber-grid opacity-40" />
        <div
          className="absolute left-0 right-0 h-[2px] opacity-10 animate-scan"
          style={{ background: 'linear-gradient(90deg, transparent, #9D00FF, transparent)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3
            bg-gradient-to-br from-neon-violet/20 to-neon-magenta/20
            border border-neon-violet/30 shadow-[0_0_25px_rgba(157,0,255,0.3)]
            animate-float"
          >
            <Zap size={24} className="text-neon-violet" />
          </div>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wider">
            CREATE ACCOUNT
          </h1>
          <p className="text-white/30 text-xs font-inter mt-1 tracking-widest uppercase">
            Neural Identity Registration
          </p>
        </div>

        <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, #9D00FF, #FF00AA, #9D00FF)' }}
          />

          <div className="p-7">
            <h2 className="font-inter text-lg font-semibold text-white mb-1">Register</h2>
            <p className="text-white/30 text-sm font-inter mb-6">
              Initialize your neural profile
            </p>

            {error && (
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
                disabled={isLoading}
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
                disabled={isLoading}
                error={formErrors.email}
                icon={<Mail size={15} />}
              />

              <CyberInput
                label="College Name"
                id="collegeName"
                name="collegeName"
                type="text"
                placeholder="Your college"
                value={formData.collegeName}
                onChange={handleChange}
                disabled={isLoading}
                error={formErrors.collegeName}
                icon={<User size={15} />}
              />

              <div className="grid grid-cols-2 gap-4">
                <CyberInput
                  label="Branch"
                  id="branch"
                  name="branch"
                  type="text"
                  placeholder="CSE"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={formErrors.branch}
                  icon={<User size={15} />}
                />

                <CyberInput
                  label="Section"
                  id="section"
                  name="section"
                  type="text"
                  placeholder="A"
                  value={formData.section}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={formErrors.section}
                  icon={<User size={15} />}
                />
              </div>

              <div className="space-y-1.5">
                <CyberInput
                  label="Password"
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 8 chars, Aa1@"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={formErrors.password}
                  icon={<Lock size={15} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                {formData.password && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background:
                                pwStrength >= i
                                  ? strengthColors[pwStrength]
                                  : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="text-[11px] font-inter"
                        style={{ color: strengthColors[pwStrength] }}
                      >
                        {strengthLabels[pwStrength]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-inter text-white/25">
                      <span className={/[A-Z]/.test(formData.password) ? 'text-neon-green/70' : ''}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase
                      </span>
                      <span className={/[a-z]/.test(formData.password) ? 'text-neon-green/70' : ''}>
                        {/[a-z]/.test(formData.password) ? '✓' : '○'} Lowercase
                      </span>
                      <span className={/[0-9]/.test(formData.password) ? 'text-neon-green/70' : ''}>
                        {/[0-9]/.test(formData.password) ? '✓' : '○'} Number
                      </span>
                      <span className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-neon-green/70' : ''}>
                        {/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '○'} Special
                      </span>
                      <span className={formData.password.length >= 8 ? 'text-neon-green/70' : ''}>
                        {formData.password.length >= 8 ? '✓' : '○'} 8+ chars
                      </span>
                    </div>
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
                disabled={isLoading}
                error={formErrors.confirmPassword}
                icon={<Lock size={15} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConf((s) => !s)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />

              <HoloButton
                type="submit"
                variant="violet"
                size="lg"
                fullWidth
                loading={isLoading}
                className="mt-3 font-orbitron tracking-widest"
              >
                REGISTER IDENTITY
              </HoloButton>
            </form>

            <p className="text-center text-white/30 text-sm font-inter mt-5">
              Already registered?{' '}
              <Link
                to="/login"
                className="text-neon-violet hover:text-neon-violet/80 font-semibold transition-colors hover:underline underline-offset-2"
              >
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
