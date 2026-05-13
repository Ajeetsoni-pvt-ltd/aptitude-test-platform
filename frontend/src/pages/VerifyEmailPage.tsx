// src/pages/VerifyEmailPage.tsx
// ─────────────────────────────────────────────────────────────
// Email Verification Page
// Reads token from URL, calls verify API, shows status
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailApi, resendVerificationApi } from '@/api/authApi';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';

type VerifyStatus = 'loading' | 'success' | 'error' | 'expired' | 'no-token';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('No verification token found in the URL.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await verifyEmailApi(token);
        setStatus('success');
        setMessage(res.message);
      } catch (err: unknown) {
        const errMsg =
          (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || 'Verification failed.';

        if (errMsg.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(errMsg);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim() || resendCooldown > 0) return;

    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await resendVerificationApi(resendEmail.trim().toLowerCase());
      setResendMessage(res.message);
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
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black relative flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.10]"
          style={{
            background: `radial-gradient(circle, ${
              status === 'success' ? '#00FF88' : status === 'loading' ? '#00F5FF' : '#FF3366'
            }, transparent 65%)`,
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 65%)' }}
        />
        <div className="absolute inset-0 cyber-grid opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="glass-strong rounded-2xl border border-white/8 shadow-glass-strong overflow-hidden">
          <div
            className="h-0.5 w-full"
            style={{
              background:
                status === 'success'
                  ? 'linear-gradient(90deg, #00FF88, #00CCAA, #00FF88)'
                  : status === 'loading'
                    ? 'linear-gradient(90deg, #00F5FF, #9D00FF, #00F5FF)'
                    : 'linear-gradient(90deg, #FF3366, #FF00AA, #FF3366)',
            }}
          />

          <div className="p-8 text-center">
            {/* ── Loading State ───────────────────── */}
            {status === 'loading' && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-neon-cyan/15 to-neon-cyan/5
                  border border-neon-cyan/30 shadow-[0_0_40px_rgba(0,245,255,0.2)]">
                  <Loader2 size={32} className="text-neon-cyan animate-spin" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  VERIFYING EMAIL
                </h1>
                <p className="text-white/40 text-sm font-inter">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {/* ── Success State ───────────────────── */}
            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-neon-green/15 to-neon-green/5
                  border border-neon-green/30 shadow-[0_0_40px_rgba(0,255,136,0.2)]
                  animate-float">
                  <ShieldCheck size={32} className="text-neon-green" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  EMAIL VERIFIED
                </h1>
                <p className="text-white/50 text-sm font-inter mb-2 leading-relaxed">
                  {message}
                </p>
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neon-green/8 border border-neon-green/20 mb-6">
                  <CheckCircle2 size={16} className="text-neon-green" />
                  <span className="text-neon-green text-sm font-inter font-medium">
                    Your account is now active
                  </span>
                </div>
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
              </>
            )}

            {/* ── Error State ────────────────────── */}
            {(status === 'error' || status === 'no-token') && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-neon-red/15 to-neon-red/5
                  border border-neon-red/30 shadow-[0_0_40px_rgba(255,51,102,0.2)]">
                  <XCircle size={32} className="text-neon-red" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  VERIFICATION FAILED
                </h1>
                <p className="text-white/50 text-sm font-inter mb-6 leading-relaxed">
                  {message}
                </p>
                <Link to="/login">
                  <HoloButton
                    variant="violet"
                    size="lg"
                    fullWidth
                    className="font-orbitron tracking-widest"
                  >
                    GO TO LOGIN
                  </HoloButton>
                </Link>
              </>
            )}

            {/* ── Expired State (with resend option) ─── */}
            {status === 'expired' && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6
                  bg-gradient-to-br from-yellow-500/15 to-yellow-500/5
                  border border-yellow-500/30 shadow-[0_0_40px_rgba(255,183,0,0.2)]">
                  <RefreshCw size={32} className="text-yellow-400" />
                </div>
                <h1 className="font-orbitron text-xl font-bold text-white tracking-wider mb-3">
                  LINK EXPIRED
                </h1>
                <p className="text-white/50 text-sm font-inter mb-6 leading-relaxed">
                  {message}
                </p>

                {/* Resend Form */}
                <div className="text-left space-y-4 mb-6">
                  <CyberInput
                    label="Your Email"
                    id="resend-email"
                    name="resend-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    disabled={resendLoading}
                    icon={<Mail size={15} />}
                  />
                  <HoloButton
                    variant="violet"
                    size="lg"
                    fullWidth
                    loading={resendLoading}
                    disabled={!resendEmail.trim() || resendCooldown > 0}
                    onClick={handleResend}
                    className="font-orbitron tracking-widest"
                  >
                    {resendCooldown > 0
                      ? `RESEND IN ${resendCooldown}s`
                      : 'RESEND VERIFICATION'}
                  </HoloButton>
                </div>

                {resendMessage && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-neon-green/8 border border-neon-green/20 mb-4">
                    <CheckCircle2 size={14} className="text-neon-green" />
                    <span className="text-neon-green text-xs font-inter">{resendMessage}</span>
                  </div>
                )}

                <Link to="/login" className="text-neon-cyan text-sm font-inter hover:underline underline-offset-2">
                  ← Back to Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-xs font-inter mt-6 tracking-wider">
          ApptitudeTest.live • SECURE VERIFICATION
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
