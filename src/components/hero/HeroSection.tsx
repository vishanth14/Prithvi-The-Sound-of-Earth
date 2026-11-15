import React, { useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { useExperienceStore } from '../../orchestrator/experienceStore';
import { MagneticButton } from '../common/MagneticButton';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { ArrowDown, Compass, Headphones } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAudioUnlocked, unlockAudio, startPlayback } = useObservatoryStore();
  const { navigateToChapter } = useExperienceStore();

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
        // 2. Top mission identification metadata reveals
        .fromTo(
          '.hero-meta',
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, clearProps: 'transform' },
          '-=0.8'
        )
        // 3. Main typography reveals through a precision mask
        .fromTo(
          '.hero-char-title',
          { yPercent: 115 },
          { yPercent: 0, duration: 1.25, ease: 'power4.out' },
          '-=0.7'
        )
        // 4. Subheading follows naturally
        .fromTo(
          '.hero-subtitle',
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.out' },
          '-=0.85'
        )
        // 5. Supporting quote line settles
        .fromTo(
          '.hero-quote',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
          '-=0.7'
        )
        // 6. CTAs appear with subtle directional movement
        .fromTo(
          '.hero-actions',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
          '-=0.6'
        )
        // 7. Bottom mission telemetry and scroll prompt reveal
        .fromTo(
          '.hero-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.85, clearProps: 'all' },
          '-=0.5'
        );

      // Continuous Scroll-Driven Exit Choreography: glides typography upward as camera dollies into atmosphere
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
        animation: gsap.to('.hero-content-wrapper', {
          y: -75,
          opacity: 0,
          ease: 'power1.in',
        }),
      });

      // Subtle Aerospace Pointer Parallax on Monumental Typography
      const xToTitle = gsap.quickTo('.hero-char-title', 'x', { duration: 0.9, ease: 'power2.out' });
      const yToTitle = gsap.quickTo('.hero-char-title', 'y', { duration: 0.9, ease: 'power2.out' });
      const xToSubtitle = gsap.quickTo('.hero-subtitle', 'x', { duration: 1.1, ease: 'power2.out' });
      const yToSubtitle = gsap.quickTo('.hero-subtitle', 'y', { duration: 1.1, ease: 'power2.out' });

      const handlePointer = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        xToTitle(nx * 8);
        yToTitle(ny * 5);
        xToSubtitle(nx * 4);
        yToSubtitle(ny * 3);
      };

      window.addEventListener('pointermove', handlePointer, { passive: true });
      return () => {
        window.removeEventListener('pointermove', handlePointer);
      };
    },
    { scope: containerRef }
  );

  const handleBeginJourney = () => {
    navigateToChapter('ch2-orbit');
  };

  const handleListenToEarth = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
      await startPlayback();
    }
    navigateToChapter('ch4-frequency');
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen h-[100dvh] w-full flex flex-col justify-between pt-24 pb-8 sm:pb-10 px-6 sm:px-10 lg:px-16 overflow-hidden z-10 bg-transparent selection:bg-[#FF5938]/30 selection:text-[#E9EDF0]"
    >
      {/* Editorial Depth Vignettes: framed top & bottom while leaving persistent 3D Earth crystal clear at center */}
      <div className="hero-backdrop absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#070B10]/90 via-[#070B10]/40 to-transparent pointer-events-none" />
      <div className="hero-backdrop absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070B10] to-transparent pointer-events-none" />
      <div className="hero-backdrop absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,#070B10_95%)] pointer-events-none" />

      {/* 1. Top Aerospace Mission Metadata */}
      <div className="hero-meta relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#252D36] pb-4 max-w-7xl w-full mx-auto pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-[0.25em] text-[#FF5938] font-bold uppercase">
            CHAPTER 01
          </span>
          <span className="text-[#252D36]">/</span>
          <span className="font-display font-bold text-sm tracking-wider text-[#E9EDF0] uppercase">
            ORIGIN
          </span>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="font-mono text-[11px] tracking-widest text-[#83BBD5] uppercase font-semibold">
            MISSION EO-26 // NASA SPACE APPS 2026
          </span>
          <span className="text-[#252D36] hidden sm:inline">•</span>
          <span className="font-mono text-[11px] tracking-widest text-[#7E8B98] uppercase hidden sm:inline">
            NASA EOS CONSTELLATION BASELINE (705 KM • 98.2°)
          </span>
        </div>
      </div>

      {/* 2. Center Monumental Editorial Typography (Scroll-exit scrubbed) */}
      <div className="hero-content-wrapper relative z-10 max-w-5xl mx-auto w-full my-auto text-center py-2 sm:py-4 flex flex-col items-center pointer-events-none">
        {/* Mission Index Identification */}
        <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1 bg-[#070B10]/75 backdrop-blur-md border border-[#252D36]/80 rounded-xs font-mono text-[10px] tracking-[0.28em] text-[#7E8B98] uppercase shadow-lg">
          <span className="w-1.5 h-1.5 bg-[#FF5938]" />
          <span>EXPEDITION IDENTIFIER: PRITHVI-EO26</span>
          <span className="text-[#252D36]">|</span>
          <span className="text-[#83BBD5] font-semibold">MULTIVERSE VENDHAN</span>
        </div>

        {/* Main Title Reveal through Precision Aerospace Mask */}
        <div className="relative px-6 py-2">
          {/* Subtle Technical Crop Marks */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#FF5938]/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#FF5938]/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#FF5938]/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#FF5938]/40" />

          <div className="overflow-hidden py-1">
            <h1 className="hero-char-title font-display text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11.5rem] font-extrabold tracking-tight text-[#E9EDF0] leading-[0.82] select-none uppercase drop-shadow-[0_4px_24px_rgba(7,11,16,0.95)]">
              PRITHVI
            </h1>
          </div>
        </div>

        {/* Subtitle Reveal through Precision Mask */}
        <div className="overflow-hidden mt-2.5 sm:mt-4">
          <p className="hero-subtitle font-mono text-xs sm:text-sm md:text-base tracking-[0.35em] sm:tracking-[0.45em] text-[#83BBD5] uppercase font-bold drop-shadow-[0_2px_12px_rgba(7,11,16,0.95)]">
            THE SOUND OF EARTH
          </p>
        </div>

        {/* Supporting Line */}
        <div className="hero-quote max-w-xl mx-auto mt-3 sm:mt-5 px-4">
          <p className="font-sans text-sm sm:text-lg md:text-xl text-[#E9EDF0] font-light leading-relaxed drop-shadow-[0_2px_12px_rgba(7,11,16,0.95)]">
            &ldquo;Every change has a sound. Every sound tells a story.&rdquo;
          </p>
        </div>

        {/* Primary and Secondary Editorial CTAs */}
        <div className="hero-actions flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 pointer-events-auto w-full max-w-md sm:max-w-none px-4 sm:px-0">
          {/* Primary CTA */}
          <MagneticButton
            onClick={handleBeginJourney}
            cursorLabel="EXPLORE"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 hover:tracking-widest transition-all duration-300"
          >
            <Compass className="w-4 h-4 text-[#070B10] group-hover:rotate-45 transition-transform duration-300" />
            <span>BEGIN THE JOURNEY</span>
          </MagneticButton>

          {/* Secondary CTA */}
          <MagneticButton
            onClick={handleListenToEarth}
            cursorLabel="LISTEN"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#070B10]/85 backdrop-blur-md hover:tracking-widest transition-all duration-300"
          >
            <Headphones className="w-4 h-4 text-[#83BBD5] group-hover:scale-110 transition-transform duration-200" />
            <span>LISTEN TO EARTH</span>
          </MagneticButton>
        </div>
      </div>

      {/* 3. Bottom Mission Telemetry Ticker & Exploration Prompt */}
      <div className="hero-footer relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#252D36] pt-4 max-w-7xl w-full mx-auto text-xs font-mono text-[#7E8B98] pointer-events-none">
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
          className="group flex items-center gap-2.5 hover:text-[#E9EDF0] text-[#7E8B98] transition-colors cursor-pointer pointer-events-auto"
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
