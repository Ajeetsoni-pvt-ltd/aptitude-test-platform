// src/components/landing/ContactSection.tsx
import { useEffect, useRef, useState } from 'react';
import { Mail, Github, Send } from 'lucide-react';

const ContactSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="contact" ref={ref} className="relative py-24 md:py-32 bg-black overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(ellipse, #f97316, transparent 70%)' }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-12 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">Contact</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Get in <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">Touch</span></h2>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">Have questions or feedback? We'd love to hear from you.</p>
        </div>
        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-700 delay-200 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Contact form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm text-zinc-400 mb-1.5">Name</label>
              <input id="contact-name" type="text" placeholder="Your name" className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-300" />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm text-zinc-400 mb-1.5">Email</label>
              <input id="contact-email" type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-300" />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm text-zinc-400 mb-1.5">Message</label>
              <textarea id="contact-message" rows={4} placeholder="Your message..." className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-300 resize-none" />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-black font-semibold rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25">
              <Send size={18} /> Send Message
            </button>
          </form>
          {/* Contact info */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center"><Mail size={20} className="text-orange-400" /></div>
                <h3 className="text-white font-semibold">Email Us</h3>
              </div>
              <a href="mailto:support@aptitudetest.site" className="text-orange-300 hover:text-orange-200 text-sm transition-colors duration-300">support@aptitudetest.site</a>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center"><Github size={20} className="text-orange-400" /></div>
                <h3 className="text-white font-semibold">Open Source</h3>
              </div>
              <a href="https://github.com/Ajeetsoni-pvt-ltd/aptitude-test-platform" target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 text-sm transition-colors duration-300">View on GitHub →</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
