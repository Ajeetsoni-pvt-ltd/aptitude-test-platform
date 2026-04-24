// src/components/landing/FeaturesSection.tsx
// Screenshot-driven features showcase with alternating layout and browser-frame mockups

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import dashboardImg from "@/assets/samplepages/Dashboard.png";
import analysisImg from "@/assets/samplepages/Analysis.png";
import fullLengthImg from "@/assets/samplepages/FullLengthTest.png";
import leaderboardImg from "@/assets/samplepages/Leaderboard.png";
import problemOfDayImg from "@/assets/samplepages/ProblemOfDay.png";
import testHistoryImg from "@/assets/samplepages/TestHistory.png";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Feature {
  id: number;
  title: string;
  tagline: string;
  description: string;
  image: string;
  badge: string;
  accentColor: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const features: Feature[] = [
  {
    id: 1,
    title: "Smart Dashboard",
    tagline: "Your command center",
    description:
      "Get a bird's-eye view of your performance the moment you log in. See your overall accuracy, tests attempted, time spent, topic-wise strength heatmap, and quick-action shortcuts — all in one glanceable layout.",
    image: dashboardImg,
    badge: "Overview",
    accentColor: "from-orange-500 to-amber-400",
  },
  {
    id: 2,
    title: "Deep Analysis",
    tagline: "Know exactly where you stand",
    description:
      "Go beyond raw scores. The Analysis page breaks down your performance by topic, difficulty level, time-per-question, and accuracy trends over time — so you always know what to improve next.",
    image: analysisImg,
    badge: "Analytics",
    accentColor: "from-yellow-500 to-orange-400",
  },
  {
    id: 3,
    title: "Full Length Tests",
    tagline: "Exam-day simulation",
    description:
      "Experience real exam pressure with timed, full-length aptitude tests. Strict time limits, auto-submit, section-wise navigation, and live proctoring — exactly how it'll feel on the actual day.",
    image: fullLengthImg,
    badge: "Practice",
    accentColor: "from-amber-500 to-yellow-400",
  },
  {
    id: 4,
    title: "Leaderboard",
    tagline: "Rise through the ranks",
    description:
      "See where you stand among thousands of aspirants. Filter by test type, date range, or topic. Compete, get motivated, and benchmark your progress against top performers in real time.",
    image: leaderboardImg,
    badge: "Competition",
    accentColor: "from-orange-600 to-red-400",
  },
  {
    id: 5,
    title: "Problem of the Day",
    tagline: "One problem. Every day. Build the habit.",
    description:
      "Stay sharp with a hand-picked daily challenge. Maintain your streak, earn consistency badges, and tackle problems across rotating topics — the easiest way to make aptitude practice a daily ritual.",
    image: problemOfDayImg,
    badge: "Daily",
    accentColor: "from-yellow-400 to-amber-300",
  },
  {
    id: 6,
    title: "Test History",
    tagline: "Every attempt. Every insight.",
    description:
      "Never lose track of your journey. Review every test you've ever taken — scores, time taken, topic breakdown, and detailed solution walkthroughs. Spot patterns, revisit mistakes, and measure real growth.",
    image: testHistoryImg,
    badge: "History",
    accentColor: "from-amber-600 to-orange-500",
  },
];

// ---------------------------------------------------------------------------
// Scroll-reveal hook
// ---------------------------------------------------------------------------

const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
};

// ---------------------------------------------------------------------------
// Browser-frame mockup
// ---------------------------------------------------------------------------

const BrowserFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-orange-500/20">
    {/* Chrome bar */}
    <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/90 border-b border-zinc-700/50">
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      {/* URL bar */}
      <div className="flex-1 ml-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-700/50 text-xs text-zinc-500 max-w-xs">
          <svg
            className="w-3 h-3 text-zinc-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11c0-1.1.9-2 2-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.05 11a9 9 0 0117.9 0M3.05 13a9 9 0 0017.9 0"
            />
          </svg>
          <span className="truncate">aptitudetest.site</span>
        </div>
      </div>
    </div>
    {/* Content */}
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Feature row
// ---------------------------------------------------------------------------

interface FeatureRowProps {
  feature: Feature;
  reversed: boolean;
}

export const FeatureRow = ({ feature, reversed }: FeatureRowProps) => {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal(0.15);

  // Animation classes
  const textSlide = visible
    ? "translate-x-0 opacity-100"
    : reversed
      ? "translate-x-10 opacity-0"
      : "-translate-x-10 opacity-0";

  const imageSlide = visible
    ? "translate-x-0 opacity-100"
    : reversed
      ? "-translate-x-10 opacity-0"
      : "translate-x-10 opacity-0";

  // Text block
  const textBlock = (
    <div
      className={`flex flex-col justify-center transition-all duration-700 ease-out delay-100 ${textSlide}`}
    >
      {/* Badge */}
      <span
        className={`inline-flex w-fit items-center px-3.5 py-1 mb-5 text-xs font-semibold tracking-wide uppercase rounded-full bg-gradient-to-r ${feature.accentColor} text-black`}
      >
        {feature.badge}
      </span>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
        {feature.title}
      </h3>

      {/* Tagline */}
      <p className="text-sm md:text-base text-orange-300 italic mb-4">
        {feature.tagline}
      </p>

      {/* Description */}
      <p className="text-zinc-400 leading-relaxed text-sm md:text-base mb-6 max-w-lg">
        {feature.description}
      </p>

      {/* CTA */}
      <button
        onClick={() => navigate("/login")}
        className="group/btn inline-flex w-fit items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-semibold text-sm hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
      >
        Get Started
        <ArrowRight
          size={16}
          className="transition-transform duration-300 group-hover/btn:translate-x-1"
        />
      </button>
    </div>
  );

  // Image block
  const imageBlock = (
    <div
      className={`transition-all duration-700 ease-out delay-200 ${imageSlide} hover:-translate-y-2 hover:transition-transform hover:duration-500`}
    >
      <BrowserFrame>
        <img
          src={feature.image}
          alt={`${feature.title} screenshot`}
          loading="lazy"
          className="w-full h-auto block"
        />
      </BrowserFrame>
    </div>
  );

  return (
    <div ref={ref} className="py-10 md:py-16">
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
          reversed ? "lg:direction-rtl" : ""
        }`}
      >
        {/* Mobile: always text-first */}
        <div className={`lg:hidden`}>
          {textBlock}
        </div>
        <div className="lg:hidden">
          {imageBlock}
        </div>

        {/* Desktop: alternating */}
        {reversed ? (
          <>
            <div className="hidden lg:block">{imageBlock}</div>
            <div className="hidden lg:block">{textBlock}</div>
          </>
        ) : (
          <>
            <div className="hidden lg:block">{textBlock}</div>
            <div className="hidden lg:block">{imageBlock}</div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section header (scroll-reveal)
// ---------------------------------------------------------------------------

const SectionHeader = () => {
  const { ref, visible } = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className={`text-center max-w-3xl mx-auto mb-8 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Eyebrow */}
      <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">
        See It In Action
      </span>

      {/* Heading */}
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
        Built for{" "}
        <span className="bg-gradient-to-r from-orange-500 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
          Serious Aspirants
        </span>
      </h2>

      {/* Subtitle */}
      <p className="text-lg text-zinc-400 leading-relaxed">
        Every feature designed to close the gap between where you are and where
        you need to be.
      </p>

      {/* Gradient underline */}
      <div className="mt-6 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-amber-300" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

const BottomCTA = () => {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal(0.15);

  return (
    <div
      ref={ref}
      className={`text-center mt-12 md:mt-20 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Ready to start your journey?
      </h3>
      <p className="text-zinc-400 text-sm mb-6 max-w-lg mx-auto">
        No account needed · 10 Questions · Quantitative Aptitude · ~10 Minutes
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => navigate("/login")}
          className="group/cta inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-black font-semibold text-base hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]"
        >
          Get Started Free
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover/cta:translate-x-1"
          />
        </button>
        <button
          onClick={() => navigate("/demo")}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-orange-500/40 hover:border-orange-500 text-orange-300 font-semibold text-base transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]"
        >
          <span>⚡</span> Try Free Demo
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative py-24 px-4 bg-black overflow-hidden"
    >
      {/* Background glow accents */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-orange-500/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-400/[0.03] blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader />

        {/* Divider */}
        <div className="border-t border-zinc-800/50 mb-4" />

        {/* Feature rows */}
        {features.map((feature, index) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            reversed={index % 2 !== 0}
          />
        ))}

        <BottomCTA />
      </div>
    </section>
  );
};

export default FeaturesSection;
