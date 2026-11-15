import React, { useState, useEffect } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { Volume2, VolumeX, Menu, X, Command } from 'lucide-react';

export interface NavChapter {
  id: string;
  label: string;
  number: string;
}

const CHAPTERS: NavChapter[] = [
  { id: 'hero', label: 'THE LIVING PLANET', number: '01' },
  { id: 'explorer', label: 'A PLANET IN MOTION', number: '02' },
  { id: 'stories', label: 'WHAT EARTH IS TELLING US', number: '03' },
  { id: 'jukebox', label: 'THE EARTH JUKEBOX', number: '04' },
  { id: 'signal', label: 'UNDERSTAND THE SIGNAL', number: '05' },
  { id: 'open-science', label: 'OPEN SCIENCE', number: '06' },
];

interface NavbarProps {
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenShortcuts }) => {
  const {
    isAudioUnlocked,
    isMuted,
    toggleMute,
    unlockAudio,
    activeSection,
    setActiveSection,
    transportState,
    startPlayback,
    pausePlayback,
    currentSonificationParams,
  } = useObservatoryStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);

    // Map chapter id to actual DOM element
    let targetId = id;
    if (id === 'listen') targetId = 'jukebox';
    if (id === 'science') targetId = 'signal';
    if (id === 'methodology') targetId = 'open-science';

    const element = document.getElementById(targetId) || document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isChapterActive = (chapterId: string) => {
    if (chapterId === 'hero' && activeSection === 'hero') return true;
    if (chapterId === 'explorer' && (activeSection === 'explorer' || activeSection === 'fleet')) return true;
    if (chapterId === 'stories' && (activeSection === 'stories' || activeSection === 'eic-jukebox')) return true;
    if (chapterId === 'jukebox' && (activeSection === 'jukebox' || activeSection === 'sonification' || activeSection === 'timeline' || activeSection === 'listen')) return true;
    if (chapterId === 'signal' && (activeSection === 'signal' || activeSection === 'science')) return true;
    if (chapterId === 'open-science' && (activeSection === 'open-science' || activeSection === 'methodology')) return true;
    return false;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#111820]/90 backdrop-blur-md border-b border-[#F0EEE5]/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)] py-3 sm:py-4'
            : 'bg-transparent border-b border-[#F0EEE5]/05 py-5 sm:py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* 1. Left Editorial Wordmark */}
          <button
            onClick={() => scrollToChapter('hero')}
            className="flex flex-col text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg sm:text-xl tracking-wider text-[#F0EEE5] group-hover:text-white transition-colors">
                PRITHVI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E16D54]" />
            </div>
            <span className="font-sans text-[10px] sm:text-[11px] tracking-widest uppercase text-[#D1B77D]/90 font-medium">
              An Earth Observatory
            </span>
          </button>

          {/* 2. Center Chapter Navigation (01 / HOME, etc.) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {CHAPTERS.map((chapter) => {
              const active = isChapterActive(chapter.id);
              return (
                <button
                  key={chapter.id}
                  onClick={() => scrollToChapter(chapter.id)}
                  className={`group flex items-center gap-2 text-xs uppercase tracking-widest font-sans transition-all duration-300 cursor-pointer ${
                    active
                      ? 'text-[#F0EEE5] font-semibold'
                      : 'text-[#F0EEE5]/60 hover:text-[#F0EEE5]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] transition-colors duration-300 ${
                      active ? 'text-[#D1B77D]' : 'text-[#F0EEE5]/40 group-hover:text-[#D1B77D]'
                    }`}
                  >
                    {chapter.number}
                  </span>
                  <span className="relative">
                    {chapter.label}
                    {active && (
                      <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#D1B77D]" />
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
                className="inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-sans tracking-wider uppercase border border-[#E16D54]/50 bg-[#E16D54]/10 hover:bg-[#E16D54] text-[#F0EEE5] hover:text-white transition-all duration-300 cursor-pointer rounded-full"
                title="Activate Real-Time Scientific Sonification Engine"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E16D54] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E16D54]" />
                </span>
                <span className="font-medium text-[11px] sm:text-xs">LISTEN TO EARTH</span>
              </button>
            ) : (
              <div className="inline-flex items-center border border-[#F0EEE5]/20 bg-[#111820]/70 rounded-full px-3 py-1 gap-2.5 backdrop-blur-md">
                <button
                  onClick={handleAudioAction}
                  className="flex items-center gap-2 text-xs font-sans tracking-wide text-[#F0EEE5] hover:text-[#D1B77D] transition-colors cursor-pointer"
                  title={transportState === 'PLAYING' ? 'Pause Sonification' : 'Play Sonification'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      transportState === 'PLAYING'
                        ? 'bg-[#E16D54] animate-pulse'
                        : 'bg-[#F0EEE5]/40'
                    }`}
                  />
                  <span className="font-mono text-[11px]">
                    {transportState === 'PLAYING' && currentSonificationParams
                      ? `${currentSonificationParams.noteName} • ${currentSonificationParams.tempoBpm} BPM`
                      : 'PAUSED'}
                  </span>
                </button>

                <div className="w-[1px] h-3 bg-[#F0EEE5]/20" />

                <button
                  onClick={handleToggleMute}
                  className="text-[#F0EEE5]/70 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#E16D54]" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#D1B77D]" />
                  )}
                </button>
              </div>
            )}

            {/* Subtle Keyboard Keymap Pill */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono tracking-wider text-[#F0EEE5]/60 hover:text-[#F0EEE5] border border-[#F0EEE5]/15 hover:border-[#F0EEE5]/30 rounded-full transition-all cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <Command className="w-3 h-3 text-[#D1B77D]" />
                <span>?</span>
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#F0EEE5] hover:text-white border border-[#F0EEE5]/20 rounded-full"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Editorial Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#111820]/98 backdrop-blur-2xl pt-24 px-8 pb-10 flex flex-col justify-between border-b border-[#F0EEE5]/10 md:hidden">
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-mono text-[#D1B77D] tracking-widest uppercase">
              CHAPTERS
            </span>
            {CHAPTERS.map((chapter) => {
              const active = isChapterActive(chapter.id);
              return (
                <button
                  key={chapter.id}
                  onClick={() => scrollToChapter(chapter.id)}
                  className="flex items-center justify-between py-3 border-b border-[#F0EEE5]/10 text-left transition-colors"
                >
                  <span
                    className={`font-display text-2xl tracking-wide ${
                      active ? 'text-[#E16D54] font-semibold' : 'text-[#F0EEE5]'
                    }`}
                  >
                    {chapter.label}
                  </span>
                  <span className="font-mono text-sm text-[#D1B77D]">{chapter.number}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[#F0EEE5]/15 flex flex-col gap-4">
            <button
              onClick={() => {
                handleAudioAction();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3.5 bg-[#E16D54] text-[#F0EEE5] font-sans font-semibold text-xs tracking-widest uppercase rounded-full text-center"
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
