// src/components/landing/Footer.tsx
import { Zap } from 'lucide-react';

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Contact', href: '#contact' },
  { label: 'Login', href: '/login' },
];

const Footer = () => {
  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.getElementById(href.replace('#', ''));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="relative bg-zinc-950 border-t border-transparent">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center shadow-md">
              <Zap size={16} className="text-black" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">AptitudeTest</span>
              <p className="text-zinc-600 text-xs">Master your aptitude. Ace your future.</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <button key={link.label} onClick={() => scrollTo(link.href)} className="text-sm text-zinc-500 hover:text-orange-300 transition-colors duration-300">
                {link.label}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-zinc-600 text-center md:text-right">
            © {new Date().getFullYear()} AptitudeTest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
