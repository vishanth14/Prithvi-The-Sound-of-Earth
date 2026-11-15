import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './lib/gsap';
import { useObservatoryStore } from './store/useObservatoryStore';
import { PersistentEarthCanvas } from './components/canvas/PersistentEarthCanvas';
import { CustomCursor } from './components/common/CustomCursor';
import { Navbar } from './components/navigation/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { EarthExplorerSection } from './components/explorer/EarthExplorerSection';
import { FleetSection } from './components/fleet/FleetSection';
import { EarthStoriesSection } from './components/stories/EarthStoriesSection';
import { EarthJukeboxSection } from './components/jukebox/EarthJukeboxSection';
import { SoundToScienceSection } from './components/science/SoundToScienceSection';
import { MethodologySection } from './components/methodology/MethodologySection';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { scrollState } from './lib/scrollState';

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
    scrollState.prefersReducedMotion = prefersReducedMotion;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0.1 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });

    // Continuous scroll synchronization with shared scrollState and ScrollTrigger
    lenis.on('scroll', (e: { progress: number; velocity: number; scroll: number }) => {
      scrollState.progress = Math.max(0, Math.min(1, e.progress));
      scrollState.velocity = e.velocity;
      scrollState.scrollY = e.scroll;
      ScrollTrigger.update();
    });

    // Single unified animation frame ticker
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Section scroll trackers linking viewport to 3D Camera coordinates and chapter progress
    const sections: {
      id: string;
      target: 'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science';
    }[] = [
      { id: 'hero', target: 'hero' },
      { id: 'explorer', target: 'explorer' },
      { id: 'fleet', target: 'fleet' },
      { id: 'stories', target: 'fleet' },
      { id: 'jukebox', target: 'sonification' },
      { id: 'signal', target: 'science' },
      { id: 'open-science', target: 'science' },
    ];

    const triggers: ScrollTrigger[] = [];

    sections.forEach(({ id, target }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onUpdate: (self) => {
          if (id === 'hero') scrollState.chapterProgress.hero = self.progress;
          if (id === 'explorer') scrollState.chapterProgress.explorer = self.progress;
          if (id === 'fleet') scrollState.chapterProgress.fleet = self.progress;
          if (id === 'stories') scrollState.chapterProgress.stories = self.progress;
          if (id === 'jukebox') scrollState.chapterProgress.jukebox = self.progress;
          if (id === 'signal') scrollState.chapterProgress.signal = self.progress;
          if (id === 'open-science') scrollState.chapterProgress.openScience = self.progress;
        },
        onEnter: () => {
          setActiveSection(id);
          setActiveCameraTarget(target);
          scrollState.activeChapter = id as any;
        },
        onEnterBack: () => {
          setActiveSection(id);
          setActiveCameraTarget(target);
          scrollState.activeChapter = id as any;
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
    <div className="relative min-h-screen w-full bg-[#070B10] text-[#E9EDF0] overflow-x-hidden selection:bg-[#FF5938] selection:text-white">
      {/* 0. Custom Space-Inspired Aerospace Cursor */}
      <CustomCursor />

      {/* 1. Root Persistent 3D Planetary Environment (Single WebGL Canvas) */}
      <div
        id="persistent-earth-root"
        className="fixed inset-0 w-full h-full z-0 pointer-events-auto"
        aria-hidden="true"
      >
        <PersistentEarthCanvas />
      </div>

      {/* 2. Global Observatory Navigation Bar */}
      <Navbar onOpenShortcuts={() => setShortcutsOpen(true)} />

      {/* 3. Accessible Keyboard Navigation Guide Dialog */}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* 4. Main Continuous Scrollytelling Sequence */}
      <main className="relative z-10 w-full flex flex-col pointer-events-none">
        {/* CHAPTER 01 — ORBITAL ENTRY */}
        <HeroSection />

        {/* CHAPTER 02 — THE PLANET */}
        <EarthExplorerSection />
        <FleetSection />

        {/* CHAPTER 03 — PLANETARY SIGNALS */}
        <EarthStoriesSection />

        {/* CHAPTER 04 — EARTH IN SOUND */}
        <EarthJukeboxSection />

        {/* CHAPTER 05 — UNDERSTANDING THE DATA */}
        <SoundToScienceSection />

        {/* CHAPTER 06 — OPEN SCIENCE */}
        <MethodologySection />
      </main>
    </div>
  );
};

export default App;
