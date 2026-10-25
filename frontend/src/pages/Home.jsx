import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Topics from '../components/Topics';
import HowItWorks from '../components/HowItWorks';
import About from '../components/About';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        <Topics />
        <HowItWorks />
        <About />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
