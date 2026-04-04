// src/components/layout/AppLayout.tsx
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import AIAssistant from '@/components/ui/AIAssistant';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  /** Pass true for pages that want full-screen (no padding, like Test page) */
  fullScreen?: boolean;
}

const AppLayout = ({ children, className, fullScreen = false }: AppLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled,      setScrolled]      = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-x-hidden">

      {/* ── Ambient background blobs ────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00F5FF, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #9D00FF, transparent 70%)' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #FF00AA, transparent 70%)' }} />
        {/* Cyber grid */}
        <div className="absolute inset-0 cyber-grid opacity-60" />
      </div>

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ── Mobile Overlay Sidebar ───────────────────────── */}
      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed left-0 top-0 h-screen z-40 lg:hidden animate-slide-in-left">
            <Sidebar isMobile onClose={() => setMobileNavOpen(false)} />
          </div>
        </>
      )}

      {/* ── Mobile Top Bar ───────────────────────────────── */}
      <header className={cn(
        'lg:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 gap-3',
        'border-b transition-all duration-300',
        scrolled
          ? 'border-white/10 bg-cyber-black/90 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      )}>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
            <span className="text-[10px] font-orbitron font-bold text-cyber-black">N</span>
          </div>
          <span className="font-orbitron text-sm font-bold text-white">NEXUS</span>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main
        className={cn(
          'relative z-10 min-h-screen',
          'lg:transition-all lg:duration-400',
          /* Push content right of sidebar on desktop */
          'lg:pl-[260px]',
          !fullScreen && 'pt-14 lg:pt-0',
          className
        )}
      >
        {fullScreen ? children : (
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        )}
      </main>

      {/* ── Floating AI Assistant ────────────────────────── */}
      <AIAssistant />
    </div>
  );
};

export default AppLayout;
