import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from './store/useObservatoryStore';
import { useExperienceStore } from './orchestrator/experienceStore';
import { experienceOrchestrator } from './orchestrator/experienceOrchestrator';
import { CHAPTER_CONFIGS } from './orchestrator/chapterConfig';
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
import { ScrollProgressHUD } from './components/navigation/ScrollProgressHUD';
import { scrollState } from './lib/scrollState';

export const App: React.FC = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const {
    setActiveSection,
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

  // Central Cinematic Experience Orchestration Lifecycle
  useEffect(() => {
    experienceOrchestrator.init();

    // Synchronize Experience Store with Observatory Store
    const unsub = useExperienceStore.subscribe((state) => {
      const config = CHAPTER_CONFIGS[state.currentChapter];
      if (config) {
        setActiveSection(config.domId);
        scrollState.activeChapter = config.domId as any;
      }
    });

    // Handle deep link hash on page entry (#hero, #explorer, #stories, #jukebox, #signal, #open-science)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const matched = Object.values(CHAPTER_CONFIGS).find((c) => c.domId === hash);
      if (matched) {
        setTimeout(() => {
          useExperienceStore.getState().navigateToChapter(matched.id, { duration: 0.1 });
        }, 180);
      }
    }

    return () => {
      unsub();
      experienceOrchestrator.dispose();
    };
  }, [setActiveSection]);

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

      {/* 2. Global Observatory Navigation Bar & Mission Progress HUD */}
      <Navbar onOpenShortcuts={() => setShortcutsOpen(true)} />
      <ScrollProgressHUD />

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
