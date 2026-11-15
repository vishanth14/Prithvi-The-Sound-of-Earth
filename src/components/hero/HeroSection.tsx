import React, { useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { gsap, useGSAP } from '../../lib/gsap';
import { EarthCanvas } from '../canvas/EarthCanvas';
import { ArrowDown, Compass, Headphones } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAudioUnlocked, unlockAudio, startPlayback } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // 1. Opening atmospheric fade & cosmic backdrop
      tl.fromTo(
        '.hero-backdrop',
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.inOut' }
      )
        // 2. Earth slowly emerges from cosmic darkness
        .fromTo(
          '.hero-earth-layer',
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out' },
          '-=0.8'
        )
        // 3. Top mission identification metadata reveals
        .fromTo(
          '.hero-meta',
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, clearProps: 'transform' },
          '-=1.2'
        )
        // 4. Main typography reveals through a precision mask
        .fromTo(
          '.hero-char-title',
          { yPercent: 115 },
          { yPercent: 0, duration: 1.25, ease: 'power4.out' },
          '-=1.0'
        )
        // 5. Subheading follows naturally
        .fromTo(
          '.hero-subtitle',
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.out' },
          '-=0.85'
        )
        // 6. Supporting quote line settles
        .fromTo(
          '.hero-quote',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
          '-=0.7'
        )
        // 7. CTAs appear with subtle directional movement
        .fromTo(
          '.hero-actions',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
          '-=0.6'
        )
        // 8. Bottom mission telemetry and scroll prompt reveal
        .fromTo(
          '.hero-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.85, clearProps: 'all' },
          '-=0.5'
        );
    },
    { scope: containerRef }
  );

  const handleBeginJourney = () => {
    const explorerEl = document.getElementById('explorer');
    if (explorerEl) {
      explorerEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleListenToEarth = async () => {
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
      className="relative min-h-screen h-[100dvh] w-full flex flex-col justify-between pt-24 pb-8 sm:pb-10 px-6 sm:px-10 lg:px-16 overflow-hidden z-10 bg-[#070B10] selection:bg-[#FF5938]/30 selection:text-[#E9EDF0]"
    >
      {/* 1. Full-Screen Photorealistic 3D Earth — Dominant & Completely Visible */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto z-0 flex items-center justify-center hero-earth-layer">
        <EarthCanvas interactive={true} />
        {/* Editorial depth vignettes: leaves Earth radiant at center while framing text */}
        <div className="hero-backdrop absolute inset-0 bg-gradient-to-t from-[#070B10] via-transparent to-[#070B10]/75 pointer-events-none" />
        <div className="hero-backdrop absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_35%,#070B10_92%)] pointer-events-none" />
      </div>

      {/* 2. Top Aerospace Mission Metadata */}
      <div className="hero-meta relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#252D36] pb-4 max-w-7xl w-full mx-auto pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-[0.25em] text-[#FF5938] font-bold uppercase">
            CHAPTER 01
          </span>
          <span className="text-[#252D36]">/</span>
          <span className="font-display font-bold text-sm tracking-wider text-[#E9EDF0] uppercase">
            THE LIVING PLANET
          </span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="font-mono text-[11px] tracking-widest text-[#83BBD5] uppercase font-semibold">
            EXPEDITION PRITHVI // NASA SPACE APPS 2026
          </span>
          <span className="text-[#252D36] hidden sm:inline">•</span>
          <span className="font-mono text-[11px] tracking-widest text-[#7E8B98] uppercase hidden sm:inline">
            ALT 705 KM • INCL 98.2°
          </span>
        </div>
      </div>

      {/* 3. Center Monumental Editorial Typography (Charles Leclerc Inspiration) */}
      <div className="relative z-10 max-w-5xl mx-auto w-full my-auto text-center py-4 sm:py-8 flex flex-col items-center pointer-events-none">
        {/* Main Title Reveal through Precision Mask */}
        <div className="overflow-hidden py-1">
          <h1 className="hero-char-title font-display text-[5.5rem] xs:text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] xl:text-[14rem] font-extrabold tracking-tight text-[#E9EDF0] leading-[0.82] select-none uppercase">
            PRITHVI
          </h1>
        </div>

        {/* Subtitle Reveal through Precision Mask */}
        <div className="overflow-hidden mt-3 sm:mt-5">
          <p className="hero-subtitle font-mono text-xs sm:text-sm md:text-base tracking-[0.35em] sm:tracking-[0.45em] text-[#83BBD5] uppercase font-bold drop-shadow-[0_2px_10px_rgba(7,11,16,0.95)]">
            THE SOUND OF EARTH
          </p>
        </div>

        {/* Supporting Line */}
        <div className="hero-quote max-w-xl mx-auto mt-4 sm:mt-6 px-4">
          <p className="font-sans text-base sm:text-xl md:text-2xl text-[#E9EDF0] font-light leading-relaxed drop-shadow-[0_2px_10px_rgba(7,11,16,0.95)]">
            &ldquo;Every change has a sound. Every sound tells a story.&rdquo;
          </p>
        </div>

        {/* Primary and Secondary Editorial CTAs */}
        <div className="hero-actions flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-7 sm:mt-10 pointer-events-auto w-full max-w-md sm:max-w-none px-4 sm:px-0">
          {/* Primary CTA */}
          <button
            onClick={handleBeginJourney}
            data-cursor-label="JOURNEY"
            data-cursor-magnetic="true"
            className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 bg-[#FF5938] hover:bg-[#E84C2C] text-[#070B10] font-display font-extrabold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(255,89,56,0.3)] hover:shadow-[0_6px_32px_rgba(255,89,56,0.5)] active:translate-y-0.5"
          >
            <Compass className="w-4 h-4 text-[#070B10] group-hover:rotate-45 transition-transform duration-300" />
            <span>BEGIN THE JOURNEY</span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleListenToEarth}
            data-cursor-label="LISTEN"
            data-cursor-magnetic="true"
            className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 border border-[#252D36] hover:border-[#83BBD5] bg-[#070B10]/85 backdrop-blur-md text-[#E9EDF0] font-display font-extrabold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer hover:bg-[#0E141D] active:translate-y-0.5"
          >
            <Headphones className="w-4 h-4 text-[#83BBD5] group-hover:scale-110 transition-transform duration-200" />
            <span>LISTEN TO EARTH</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Mission Telemetry Ticker & Exploration Prompt */}
      <div className="hero-footer relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#252D36] pt-4 max-w-7xl w-full mx-auto text-xs font-mono text-[#7E8B98]">
        {/* Live Empirical State */}
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-[#FF5938] animate-pulse" />
          <span className="font-mono tracking-widest text-[11px] uppercase text-[#83BBD5] font-semibold">
            NASA EIC OBSERVATORY ACTIVE
          </span>
          <span className="hidden sm:inline text-[#252D36]">|</span>
          <span className="hidden sm:inline text-[#7E8B98]">
            1880 — 2024 EMPIRICAL MULTI-DECADAL RECORD
          </span>
        </div>

        {/* Small Scroll Indicator Inviting Exploration */}
        <button
          onClick={handleBeginJourney}
          data-cursor-label="SCROLL"
          className="group flex items-center gap-2.5 hover:text-[#E9EDF0] text-[#7E8B98] transition-colors cursor-pointer"
        >
          <span className="tracking-widest uppercase text-[10px] font-mono">SCROLL TO EXPLORE</span>
          <div className="w-5 h-5 flex items-center justify-center border border-[#252D36] group-hover:border-[#FF5938] transition-colors">
            <ArrowDown className="w-3 h-3 text-[#FF5938] group-hover:translate-y-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </section>
  );
};
