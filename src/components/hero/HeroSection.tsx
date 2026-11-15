import React, { useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { gsap, useGSAP } from '../../lib/gsap';
import { Button } from '../common/Button';
import { EarthCanvas } from '../canvas/EarthCanvas';
import { ArrowDown, Compass, Headphones } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAudioUnlocked, unlockAudio, startPlayback } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.hero-meta',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.1, clearProps: 'transform' }
      )
        .fromTo(
          '.hero-title',
          { opacity: 0, y: 40, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1, clearProps: 'transform' },
          '-=0.5'
        )
        .fromTo(
          '.hero-subtitle',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, clearProps: 'transform' },
          '-=0.7'
        )
        .fromTo(
          '.hero-quote',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, clearProps: 'transform' },
          '-=0.6'
        )
        .fromTo(
          '.hero-actions',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        )
        .fromTo(
          '.hero-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.8, clearProps: 'all' },
          '-=0.4'
        );
    },
    { scope: containerRef }
  );

  const handleExplore = () => {
    const explorerEl = document.getElementById('explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDiscoverSound = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
      await startPlayback();
    }
    const listenEl =
      document.getElementById('jukebox') ||
      document.getElementById('sonification') ||
      document.getElementById('eic-jukebox');
    if (listenEl) {
      listenEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen w-full flex flex-col justify-between pt-28 pb-12 px-6 sm:px-10 lg:px-16 overflow-hidden z-10 selection:bg-[#D1B77D]/30 selection:text-[#F0EEE5]"
    >
      {/* 1. Full-Screen Photorealistic 3D Earth Anchor */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto z-0 flex items-center justify-center">
        <EarthCanvas interactive={true} />
        {/* Subtle radial depth gradient for editorial text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111820] via-transparent to-[#111820]/60 pointer-events-none" />
      </div>

      {/* 2. Top Editorial Metadata */}
      <div className="hero-meta relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#F0EEE5]/10 pb-4 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-[13px] tracking-[0.25em] text-[#D1B77D] font-medium uppercase">
            CHAPTER 01
          </span>
          <span className="text-[#F0EEE5]/30">/</span>
          <span className="font-sans text-xs sm:text-[13px] tracking-widest text-[#F0EEE5]/80 font-normal uppercase">
            THE LIVING PLANET
          </span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="font-mono text-[11px] sm:text-xs tracking-widest text-[#F0EEE5]/60 uppercase">
            NASA SPACE APPS 2026
          </span>
          <span className="text-[#F0EEE5]/20 hidden sm:inline">•</span>
          <span className="font-mono text-[11px] sm:text-xs tracking-widest text-[#D1B77D]/90 uppercase hidden sm:inline">
            THE EARTH INFORMATION JUKEBOX
          </span>
        </div>
      </div>

      {/* 3. Center Monumental Editorial Typography */}
      <div className="relative z-10 max-w-4xl mx-auto w-full my-auto text-center py-4 sm:py-6 flex flex-col items-center">
        {/* Expressive Master Title */}
        <h1 className="hero-title font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-[#F0EEE5] leading-[0.9] select-none">
          PRITHVI
        </h1>

        {/* Editorial Subtitle */}
        <p className="hero-subtitle font-sans text-xs sm:text-sm md:text-base lg:text-lg font-medium tracking-[0.3em] text-[#D1B77D] uppercase mt-3 mb-5">
          THE SOUND OF EARTH
        </p>

        {/* Supporting Line */}
        <div className="hero-quote max-w-xl mx-auto mb-8 px-4">
          <p className="font-serif italic text-lg sm:text-2xl text-[#F0EEE5]/95 font-light leading-relaxed">
            &ldquo;Every change has a sound. Every sound tells a story.&rdquo;
          </p>
        </div>

        {/* Primary Editorial Actions */}
        <div className="hero-actions flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleExplore}
            icon={<Compass className="w-4 h-4 text-[#111820]" />}
          >
            EXPLORE THE PLANET
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleDiscoverSound}
            icon={<Headphones className="w-4 h-4 text-[#D1B77D]" />}
          >
            DISCOVER THE SOUND
          </Button>
        </div>
      </div>

      {/* 4. Bottom Editorial Anchor & Scroll Invitation */}
      <div className="hero-footer relative z-10 max-w-7xl w-full mx-auto flex items-center justify-between pt-6 border-t border-[#F0EEE5]/10 text-xs text-[#F0EEE5]/60 font-sans">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#E16D54]" />
          <span className="font-mono tracking-widest text-[11px] uppercase">
            ORBITAL HARMONICS IN SYNC
          </span>
        </div>

        <button
          onClick={handleExplore}
          className="group flex items-center gap-2 hover:text-[#D1B77D] transition-colors cursor-pointer"
        >
          <span className="tracking-widest uppercase text-[11px] font-mono">SCROLL TO DESCEND</span>
          <ArrowDown className="w-3.5 h-3.5 text-[#D1B77D] group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    </section>
  );
};
