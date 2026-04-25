// src/pages/LandingPage.tsx
import { lazy, Suspense } from 'react';
import Navbar from '@/components/landing/Navbar';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/landing/Footer';
import { useNavigate } from 'react-router-dom';

const Hero = lazy(() => import('@/components/ui/animated-shader-hero'));

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <section id="home">
        <Suspense fallback={
          <div className="w-full h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent 
                            rounded-full animate-spin" />
          </div>
        }>
          <Hero
            trustBadge={{ text: "Trusted by 10,000+ aspirants", icons: ["✨"] }}
            headline={{ line1: "Master Aptitude.", line2: "Ace Your Future." }}
            subtitle="Practice topic-wise aptitude tests, track your performance, and compete on leaderboards — all in one platform built for serious aspirants."
            buttons={{
              primary: { text: "Get Started Free", onClick: () => navigate('/login') },
              secondary: { text: "Explore Features", onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }
            }}
          />
        </Suspense>
      </section>
      <AboutSection />
      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default LandingPage;

