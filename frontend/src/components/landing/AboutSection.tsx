// src/components/landing/AboutSection.tsx
// Mission statement + stat cards with animated counters

import { useEffect, useRef, useState } from 'react';
import { Users, BookOpen, ThumbsUp, Target, Sparkles, TrendingUp } from 'lucide-react';

const stats = [
  { icon: Users, value: '10,000+', label: 'Tests Taken', color: 'from-orange-500 to-yellow-400' },
  { icon: BookOpen, value: '500+', label: 'Questions', color: 'from-yellow-400 to-amber-300' },
  { icon: ThumbsUp, value: '98%', label: 'Satisfaction', color: 'from-amber-400 to-orange-500' },
];

const highlights = [
  { icon: Target, text: 'Topic-wise & full-length tests' },
  { icon: Sparkles, text: 'AI-powered performance insights' },
  { icon: TrendingUp, text: 'Adaptive difficulty scaling' },
];

const AboutSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-zinc-950 overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, #f97316, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">
            About Us
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Empowering Aspirants with{' '}
            <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
              Smart Practice
            </span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            We believe every student deserves access to high-quality aptitude preparation. Our platform combines intelligent test design, real-time analytics, and competitive features to help you achieve your career goals.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className={`space-y-8 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-5">
              {highlights.map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border border-orange-500/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange-500/10 transition-shadow duration-300">
                    <item.icon size={20} className="text-orange-400" />
                  </div>
                  <p className="text-zinc-300 text-base leading-relaxed pt-2">{item.text}</p>
                </div>
              ))}
            </div>

            <p className="text-zinc-500 text-sm leading-relaxed pl-0.5">
              Built by educators and engineers who understand what it takes to crack competitive exams. Whether you're preparing for placements, government exams, or skill assessments — we've got you covered.
            </p>
          </div>

          {/* Right: Stat cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-orange-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-orange-500/5"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.05), transparent 70%)' }} />
                
                <div className="relative flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon size={22} className="text-black" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
