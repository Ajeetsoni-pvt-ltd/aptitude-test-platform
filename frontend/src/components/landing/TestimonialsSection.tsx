// src/components/landing/TestimonialsSection.tsx
import { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma', role: 'Placed at TCS Digital', initials: 'PS',
    quote: 'This platform was a game-changer for my placement prep. The topic-wise tests helped me identify weak areas and the analytics gave me clear direction.',
    color: 'from-orange-500 to-yellow-400',
  },
  {
    name: 'Rahul Verma', role: 'CAT Aspirant', initials: 'RV',
    quote: 'My quantitative aptitude score improved by 40% in just 2 months. The Problem of the Day feature kept me consistent and motivated.',
    color: 'from-yellow-400 to-amber-300',
  },
  {
    name: 'Anita Desai', role: 'Educator & Coach', initials: 'AD',
    quote: "The cleanest aptitude platform I've seen. My students love the interface, and the proctoring features ensure assessment integrity.",
    color: 'from-amber-400 to-orange-500',
  },
];

const TestimonialsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="testimonials" ref={ref} className="relative py-24 md:py-32 bg-zinc-950 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(ellipse, #f97316, transparent 60%)' }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Loved by <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">Students & Educators</span></h2>
          <p className="text-lg text-zinc-400 leading-relaxed">Hear from the people who've transformed their preparation journey with our platform.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className={`group relative transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: vis ? `${200 + i * 150}ms` : '0ms' }}>
              <div className="relative p-6 md:p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/25 transition-all duration-500 h-full flex flex-col">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(ellipse at top, rgba(249,115,22,0.05), transparent 60%)' }} />
                <div className="relative flex-1 flex flex-col">
                  <Quote size={28} className="text-orange-500/20 mb-4" />
                  <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, j) => (<Star key={j} size={16} className="text-orange-400 fill-orange-400" />))}</div>
                  <p className="text-zinc-400 text-sm leading-relaxed flex-1 mb-6 group-hover:text-zinc-300 transition-colors duration-300">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-black shadow-md`}>{t.initials}</div>
                    <div><p className="text-sm font-semibold text-white">{t.name}</p><p className="text-xs text-zinc-500">{t.role}</p></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
