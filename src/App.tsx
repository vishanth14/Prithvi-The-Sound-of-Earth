import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './lib/gsap';
import { useObservatoryStore } from './store/useObservatoryStore';
import { StarfieldCanvas } from './components/canvas/StarfieldCanvas';
import { Navbar } from './components/navigation/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { EarthExplorerSection } from './components/explorer/EarthExplorerSection';
import { EICJukeboxVisualizer } from './components/visualization/EICJukeboxVisualizer';
import { FleetSection } from './components/fleet/FleetSection';
import { DataTimelineSection } from './components/timeline/DataTimelineSection';
import { SonificationLabSection } from './components/sonification/SonificationLabSection';
import { SoundToScienceSection } from './components/science/SoundToScienceSection';
import { MethodologySection } from './components/methodology/MethodologySection';
import { ShortcutsModal } from './components/common/ShortcutsModal';

export const App: React.FC = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const {
    setActiveSection,
    setActiveCameraTarget,
    transportState,
    startPlayback,
    pausePlayback,
    toggleMute,
    seekToIndex,
    selectedObservationIndex,
    setActiveEicKey,
    isAudioUnlocked,
    unlockAudio,
  } = useObservatoryStore();

  // Unified Lenis + GSAP ScrollTrigger Synchronization Loop
  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.1 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });

    // Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Single unified animation frame ticker
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Section scroll trackers linking viewport to 3D Camera coordinates
    const sections: { id: string; target: 'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science' }[] = [
      { id: 'hero', target: 'hero' },
      { id: 'explorer', target: 'explorer' },
      { id: 'eic-jukebox', target: 'fleet' },
      { id: 'fleet', target: 'fleet' },
      { id: 'timeline', target: 'timeline' },
      { id: 'sonification', target: 'sonification' },
      { id: 'science', target: 'science' },
      { id: 'methodology', target: 'science' },
    ];

    const triggers: ScrollTrigger[] = [];

    sections.forEach(({ id, target }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => {
          setActiveSection(id);
          setActiveCameraTarget(target);
        },
        onEnterBack: () => {
          setActiveSection(id);
          setActiveCameraTarget(target);
        },
      });
      triggers.push(trigger);
    });

    return () => {
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      triggers.forEach((t) => t.kill());
    };
  }, [setActiveSection, setActiveCameraTarget]);

  // Global Observatory Keyboard Accessibility Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isAudioUnlocked) {
          unlockAudio().then(() => startPlayback());
        } else if (transportState === 'PLAYING') {
          pausePlayback();
        } else {
          startPlayback();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekToIndex(Math.max(0, selectedObservationIndex - 1), true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekToIndex(selectedObservationIndex + 1, true);
      } else if (e.key === 'r' || e.key === 'R') {
        seekToIndex(0, true);
      } else if (e.key === '?') {
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        setActiveEicKey('gistemp');
      } else if (e.key === '2') {
        setActiveEicKey('co2_maunaloa');
      } else if (e.key === '3') {
        setActiveEicKey('sealevel_podaac');
      } else if (e.key === '4') {
        setActiveEicKey('aerosols_geos');
      } else if (e.key === '5') {
        setActiveEicKey('nightlights_viirs');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isAudioUnlocked,
    transportState,
    startPlayback,
    pausePlayback,
    toggleMute,
    seekToIndex,
    selectedObservationIndex,
    setActiveEicKey,
    unlockAudio,
  ]);

  return (
    <div className="relative min-h-screen w-full bg-[#02040a] text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Restrained Animated Cosmos Background */}
      <StarfieldCanvas />

      {/* 2. Global Observatory Navigation Bar */}
      <Navbar onOpenShortcuts={() => setShortcutsOpen(true)} />

      {/* 3. Accessible Keyboard Navigation Guide Dialog */}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* 4. Main Scrollytelling Sequence */}
      <main className="relative z-10 w-full flex flex-col">
        {/* Section 01: Cinematic Landing Hero */}
        <HeroSection />

        {/* Section 02: Interactive 3D Earth Exploration */}
        <EarthExplorerSection />

        {/* Section 03: NASA Earth Information Center Visualization (SVS Climate Spiral & 5-Stream Jukebox) */}
        <EICJukeboxVisualizer />

        {/* Section 04: NASA Earth Information Center Fleet */}
        <FleetSection />

        {/* Section 05: Multi-Decadal Data Timeline */}
        <DataTimelineSection />

        {/* Section 05: Real-Time Earth Sonification Laboratory */}
        <SonificationLabSection />

        {/* Section 06: Sound-to-Science Epistemology */}
        <SoundToScienceSection />

        {/* Section 07: Sources, Methodology & Space Apps Credits */}
        <MethodologySection />
      </main>
    </div>
  );
};

export default App;
