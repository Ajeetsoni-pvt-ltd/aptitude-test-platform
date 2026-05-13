// src/pages/ResetPasswordPage.tsx
// ─────────────────────────────────────────────────────────────
// Reset Password Page — Set new password using reset token
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');

    const p = password;
    if (p.length < 8) {
      setPasswordError('Minimum 8 characters.');
      valid = false;
    } else if (!/[A-Z]/.test(p)) {
      setPasswordError('Must contain an uppercase letter.');
      valid = false;
    } else if (!/[a-z]/.test(p)) {
      setPasswordError('Must contain a lowercase letter.');
      valid = false;
    } else if (!/[0-9]/.test(p)) {
      setPasswordError('Must contain a number.');
      valid = false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p)) {
      setPasswordError('Must contain a special character.');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      setError('Reset token is missing from the URL.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const pwStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthColors = ['', '#FF3366', '#FFB700', '#FFB700', '#00FF88', '#00FF88'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 cyber-grid opacity-40" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-fade-up">
          <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #FF3366, #FF00AA, #FF3366)' }} />
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                bg-gradient-to-br from-neon-red/15 to-neon-red/5
                border border-neon-red/30">
                <XCircle size={32} className="text-neon-red" />
              </div>
              <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                INVALID LINK
              </h1>
              <p className="text-white/50 text-sm font-inter mb-6">
                No reset token found in the URL. Please request a new password reset.
              </p>
              <Link to="/forgot-password">
                <HoloButton variant="violet" size="lg" fullWidth className="font-orbitron tracking-widest">
                  REQUEST NEW RESET
                </HoloButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #00F5FF, transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }}
        />
        <div className="absolute inset-0 cyber-grid opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
          <div
            className="h-0.5 w-full"
            style={{
              background: success
                ? 'linear-gradient(90deg, #00FF88, #00CCAA, #00FF88)'
                : 'linear-gradient(90deg, #00F5FF, #9D00FF, #00F5FF)',
            }}
          />

          <div className="p-8">
            {!success ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                    bg-gradient-to-br from-neon-cyan/15 to-neon-violet/10
                    border border-neon-cyan/30 shadow-[0_0_30px_rgba(0,245,255,0.2)]
                    animate-float">
                    <Lock size={28} className="text-neon-cyan" />
                  </div>
                  <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-2">
                    RESET PASSWORD
                  </h1>
                  <p className="text-white/40 text-sm font-inter">
                    Enter your new password below.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                    <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
                    <p className="text-neon-red text-sm font-inter">{error}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <CyberInput
                      label="New Password"
                      id="new-password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min 8 chars, Aa1@"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                        setError('');
                      }}
                      disabled={isLoading}
                      error={passwordError}
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
                    {password && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex gap-1 flex-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{
                                  background: pwStrength >= i ? strengthColors[pwStrength] : 'rgba(255,255,255,0.1)',
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-inter" style={{ color: strengthColors[pwStrength] }}>
                            {strengthLabels[pwStrength]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-inter text-white/25">
                          <span className={/[A-Z]/.test(password) ? 'text-neon-green/70' : ''}>
                            {/[A-Z]/.test(password) ? '✓' : '○'} Uppercase
                          </span>
                          <span className={/[a-z]/.test(password) ? 'text-neon-green/70' : ''}>
                            {/[a-z]/.test(password) ? '✓' : '○'} Lowercase
                          </span>
                          <span className={/[0-9]/.test(password) ? 'text-neon-green/70' : ''}>
                            {/[0-9]/.test(password) ? '✓' : '○'} Number
                          </span>
                          <span className={/[^A-Za-z0-9]/.test(password) ? 'text-neon-green/70' : ''}>
                            {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Special
                          </span>
                          <span className={password.length >= 8 ? 'text-neon-green/70' : ''}>
                            {password.length >= 8 ? '✓' : '○'} 8+ chars
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <CyberInput
                    label="Confirm Password"
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConf ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmError('');
                    }}
                    disabled={isLoading}
                    error={confirmError}
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
                    variant="cyan"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    className="mt-2 font-orbitron tracking-widest"
                  >
                    SET NEW PASSWORD
                  </HoloButton>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-neon-green/15 to-neon-green/5
                  border border-neon-green/30 shadow-[0_0_40px_rgba(0,255,136,0.2)]
                  animate-float">
                  <ShieldCheck size={32} className="text-neon-green" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  PASSWORD UPDATED
                </h1>
                <p className="text-white/50 text-sm font-inter mb-6 leading-relaxed">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <Link to="/login">
                  <HoloButton
                    variant="cyan"
                    size="lg"
                    fullWidth
                    className="font-orbitron tracking-widest"
                  >
                    GO TO LOGIN
                  </HoloButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/15 text-xs font-inter mt-6 tracking-wider">
          ApptitudeTest.live • SECURE RESET
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
