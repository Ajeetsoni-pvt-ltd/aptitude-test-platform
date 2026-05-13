// src/pages/ForgotPasswordPage.tsx
// ─────────────────────────────────────────────────────────────
// Forgot Password Page — Request password reset email
// Always shows success message (anti-enumeration)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Mail, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validate = (): boolean => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await forgotPasswordApi(email.trim().toLowerCase());
      setSuccess(true);
      setMessage(res.message);
    } catch {
      // Even on error, show generic success to prevent enumeration
      setSuccess(true);
      setMessage('If an account exists with this email, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #FFB700, transparent 65%)' }}
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
            style={{ background: 'linear-gradient(90deg, #FFB700, #FF8800, #FFB700)' }}
          />

          <div className="p-8">
            {!success ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                    bg-gradient-to-br from-yellow-500/15 to-orange-500/10
                    border border-yellow-500/30 shadow-[0_0_30px_rgba(255,183,0,0.2)]
                    animate-float">
                    <KeyRound size={28} className="text-yellow-400" />
                  </div>
                  <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-2">
                    FORGOT PASSWORD
                  </h1>
                  <p className="text-white/40 text-sm font-inter leading-relaxed">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <CyberInput
                    label="Email Address"
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="agent@nexus.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    disabled={isLoading}
                    error={emailError}
                    icon={<Mail size={16} />}
                  />

                  <HoloButton
                    type="submit"
                    variant="violet"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    className="font-orbitron tracking-widest"
                  >
                    SEND RESET LINK
                  </HoloButton>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-neon-cyan text-sm font-inter hover:underline underline-offset-2 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-neon-green/15 to-neon-green/5
                  border border-neon-green/30 shadow-[0_0_40px_rgba(0,255,136,0.2)]
                  animate-float">
                  <Mail size={32} className="text-neon-green" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  CHECK YOUR EMAIL
                </h1>
                <p className="text-white/50 text-sm font-inter mb-6 leading-relaxed">
                  {message}
                </p>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 text-left">
                  <p className="text-white/40 text-sm font-inter leading-relaxed">
                    📧 Check your inbox for a password reset link.
                    <br />
                    ⏱ The link expires in <strong className="text-white/60">30 minutes</strong>.
                    <br />
                    📥 Don&apos;t forget to check your spam folder.
                  </p>
                </div>

                <Link to="/login">
                  <HoloButton
                    variant="cyan"
                    size="lg"
                    fullWidth
                    className="font-orbitron tracking-widest"
                  >
                    BACK TO LOGIN
                  </HoloButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-white/15 text-xs font-inter mt-6 tracking-wider">
          ApptitudeTest.live • SECURE RECOVERY
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
