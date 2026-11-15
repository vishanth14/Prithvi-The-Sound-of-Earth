import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { useExperienceStore } from '../../orchestrator/experienceStore';
import type { ChapterId } from '../../orchestrator/experienceTypes';
import { PrithviWordmark } from '../common/PrithviWordmark';
import { Volume2, VolumeX, Menu, X, Command } from 'lucide-react';

export interface NavChapter {
  id: string;
  label: string;
  number: string;
  targetId: string;
}

const MINIMAL_CHAPTERS: NavChapter[] = [
  { id: 'hero', label: 'HOME', number: '01', targetId: 'hero' },
  { id: 'explorer', label: 'EXPLORE', number: '02', targetId: 'explorer' },
  { id: 'stories', label: 'STORIES', number: '03', targetId: 'stories' },
  { id: 'jukebox', label: 'LISTEN', number: '04', targetId: 'jukebox' },
  { id: 'signal', label: 'SCIENCE', number: '05', targetId: 'signal' },
];

const CHAPTER_NAV_MAP: Record<string, ChapterId> = {
  hero: 'ch1-origin',
  explorer: 'ch2-orbit',
  fleet: 'ch2-orbit',
  stories: 'ch3-signals',
  jukebox: 'ch4-frequency',
  listen: 'ch4-frequency',
  signal: 'ch5-decoding',
  science: 'ch5-decoding',
  'open-science': 'ch6-beyond',
  methodology: 'ch6-beyond',
};

interface NavbarProps {
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenShortcuts }) => {
  const {
    isAudioUnlocked,
    isMuted,
    toggleMute,
    unlockAudio,
    transportState,
    startPlayback,
    pausePlayback,
    currentSonificationParams,
  } = useObservatoryStore();

  const { currentChapter, navigateToChapter } = useExperienceStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleAudioAction = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
      await startPlayback();
    } else {
      if (transportState === 'PLAYING') {
        pausePlayback();
      } else {
        await startPlayback();
      }
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (id: string) => {
    setMobileMenuOpen(false);
    const targetChapter = CHAPTER_NAV_MAP[id] || 'ch1-origin';
    navigateToChapter(targetChapter);
  };

  const isChapterActive = (chapterId: string) => {
    const targetChapter = CHAPTER_NAV_MAP[chapterId];
    return currentChapter === targetChapter;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#070B10]/92 backdrop-blur-md border-b border-[#252D36] py-3 shadow-[0_4px_30px_rgba(0,0,0,0.7)]'
            : 'bg-transparent border-b border-[#252D36]/30 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* 1. Proprietary PRITHVI Aerospace Wordmark */}
          <button
            onClick={() => scrollToChapter('hero')}
            data-cursor-label="PRITHVI"
            className="flex items-center group cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5938]"
          >
            <PrithviWordmark size="sm" showMissionTag={true} showSubtitle={false} />
          </button>

          {/* 2. Center Minimal Chapter Navigation (01 / HOME, 02 / EXPLORE, etc.) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {MINIMAL_CHAPTERS.map((chapter) => {
              const active = isChapterActive(chapter.id);
              return (
                <button
                  key={chapter.id}
                  onClick={() => scrollToChapter(chapter.id)}
                  data-cursor-label={chapter.label}
                  className={`group flex items-baseline gap-1.5 text-xs uppercase tracking-widest font-display font-bold transition-all duration-200 cursor-pointer ${
                    active ? 'text-[#E9EDF0]' : 'text-[#7E8B98] hover:text-[#E9EDF0]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] transition-colors duration-200 ${
                      active ? 'text-[#FF5938]' : 'text-[#83BBD5]/60 group-hover:text-[#FF5938]'
                    }`}
                  >
                    {chapter.number}
                  </span>
                  <span className="text-[#252D36] text-[10px] font-mono">/</span>
                  <span className="relative">
                    {chapter.label}
                    {active && (
                      <span className="absolute -bottom-1.5 left-0 w-full h-[2px] bg-[#FF5938]" />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* 3. Right Minimalist Audio Status & Keymap */}
          <div className="flex items-center gap-3 sm:gap-4">
            {!isAudioUnlocked ? (
              <button
                onClick={handleAudioAction}
                data-cursor-label="AUDIO"
                data-cursor-magnetic="true"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-display font-bold tracking-wider uppercase border border-[#FF5938] bg-[#FF5938]/15 hover:bg-[#FF5938] text-[#E9EDF0] hover:text-[#070B10] transition-all duration-200 cursor-pointer"
                title="Activate Real-Time Scientific Sonification Engine"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full bg-[#FF5938] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 bg-[#FF5938]" />
                </span>
                <span className="font-bold text-xs tracking-wider">LISTEN</span>
              </button>
            ) : (
              <div className="inline-flex items-center border border-[#252D36] bg-[#0E141D] px-3 py-1 gap-2.5">
                <button
                  onClick={handleAudioAction}
                  data-cursor-label={transportState === 'PLAYING' ? 'PAUSE' : 'PLAY'}
                  data-cursor-magnetic="true"
                  className="flex items-center gap-2 text-xs font-mono tracking-wide text-[#E9EDF0] hover:text-[#83BBD5] transition-colors cursor-pointer"
                  title={transportState === 'PLAYING' ? 'Pause Sonification' : 'Play Sonification'}
                >
                  <span
                    className={`w-2 h-2 ${
                      transportState === 'PLAYING'
                        ? 'bg-[#FF5938] animate-pulse'
                        : 'bg-[#7E8B98]'
                    }`}
                  />
                  <span className="font-mono text-[11px] font-semibold">
                    {transportState === 'PLAYING' && currentSonificationParams
                      ? `${currentSonificationParams.noteName} • ${currentSonificationParams.tempoBpm} BPM`
                      : 'PAUSED'}
                  </span>
                </button>

                <div className="w-[1px] h-3 bg-[#252D36]" />

                <button
                  onClick={handleToggleMute}
                  data-cursor-label={isMuted ? 'UNMUTE' : 'MUTE'}
                  className="text-[#7E8B98] hover:text-[#E9EDF0] transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#FF5938]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#83BBD5]" />
                  )}
                </button>
              </div>
            )}

            {/* Subtle Keyboard Keymap Pill */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                data-cursor-label="KEYMAP"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wider text-[#7E8B98] hover:text-[#E9EDF0] border border-[#252D36] hover:border-[#83BBD5] transition-all cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <Command className="w-3 h-3 text-[#FF5938]" />
                <span>?</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-cursor-label="MENU"
              className="md:hidden p-2 text-[#E9EDF0] hover:text-white border border-[#252D36] cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 4. Unobtrusive Scroll-Progress Indicator */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-[#FF5938] transition-[width] duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </header>

      {/* Mobile Minimal Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#070B10]/98 backdrop-blur-2xl pt-24 px-8 pb-10 flex flex-col justify-between border-b border-[#252D36] md:hidden">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-[#83BBD5] tracking-widest uppercase pb-2 border-b border-[#252D36]">
              OBSERVATORY DIRECTORY
            </span>
            {MINIMAL_CHAPTERS.map((chapter) => {
              const active = isChapterActive(chapter.id);
              return (
                <button
                  key={chapter.id}
                  onClick={() => scrollToChapter(chapter.id)}
                  className="flex items-center justify-between py-3 border-b border-[#252D36]/60 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-[#FF5938]">{chapter.number}</span>
                    <span
                      className={`font-display text-2xl tracking-wide uppercase ${
                        active ? 'text-[#FF5938] font-bold' : 'text-[#E9EDF0]'
                      }`}
                    >
                      {chapter.label}
                    </span>
                  </div>
                  {active && <span className="w-2 h-2 bg-[#FF5938]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[#252D36] flex flex-col gap-4">
            <button
              onClick={() => {
                handleAudioAction();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3.5 bg-[#FF5938] text-[#070B10] font-display font-bold text-xs tracking-widest uppercase text-center cursor-pointer"
            >
              {!isAudioUnlocked
                ? 'LISTEN TO EARTH'
                : transportState === 'PLAYING'
                ? 'PAUSE SONIFICATION'
                : 'RESUME SONIFICATION'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
