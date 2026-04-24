// src/pages/LandingPage.tsx
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/ui/animated-shader-hero';
import AboutSection from '@/components/landing/AboutSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/landing/Footer';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <section id="home">
        <Hero
          trustBadge={{ text: "Trusted by 10,000+ aspirants", icons: ["✨"] }}
          headline={{ line1: "Master Aptitude.", line2: "Ace Your Future." }}
          subtitle="Practice topic-wise aptitude tests, track your performance, and compete on leaderboards — all in one platform built for serious aspirants."
          buttons={{
            primary: { text: "Get Started Free", onClick: () => navigate('/login') },
            secondary: { text: "Explore Features", onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }
          }}
        />
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
