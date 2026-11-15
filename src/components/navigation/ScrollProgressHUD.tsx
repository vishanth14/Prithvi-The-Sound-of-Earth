import React, { useEffect, useState } from 'react';
import { scrollState } from '../../lib/scrollState';
import { uiAudioFeedback } from '../../audio/uiAudioFeedback';
import { useExperienceStore } from '../../orchestrator/experienceStore';
import type { ChapterId } from '../../orchestrator/experienceTypes';

interface ChapterMilestone {
  chapterId: ChapterId;
  domId: string;
  number: string;
  label: string;
  progress: number;
}

const CHAPTER_MILESTONES: ChapterMilestone[] = [
  { chapterId: 'ch1-origin', domId: 'hero', number: '01', label: 'ORIGIN', progress: 0.05 },
  { chapterId: 'ch2-orbit', domId: 'explorer', number: '02', label: 'ORBIT', progress: 0.22 },
  { chapterId: 'ch3-signals', domId: 'stories', number: '03', label: 'SIGNALS', progress: 0.44 },
  { chapterId: 'ch4-frequency', domId: 'jukebox', number: '04', label: 'FREQUENCY', progress: 0.62 },
  { chapterId: 'ch5-decoding', domId: 'signal', number: '05', label: 'DECODING', progress: 0.80 },
  { chapterId: 'ch6-beyond', domId: 'open-science', number: '06', label: 'BEYOND', progress: 0.95 },
];

export const ScrollProgressHUD: React.FC = () => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(CHAPTER_MILESTONES[0]);
  const { navigateToChapter } = useExperienceStore();

  useEffect(() => {
    let prevChapterId = CHAPTER_MILESTONES[0].chapterId;
    let animId: number;

    const updateHUD = () => {
      const p = scrollState.progress;
      setCurrentProgress(p);

      // Determine active chapter milestone
      let current = CHAPTER_MILESTONES[0];
      if (p >= 0.88) current = CHAPTER_MILESTONES[5];
      else if (p >= 0.72) current = CHAPTER_MILESTONES[4];
      else if (p >= 0.52) current = CHAPTER_MILESTONES[3];
      else if (p >= 0.36) current = CHAPTER_MILESTONES[2];
      else if (p >= 0.12) current = CHAPTER_MILESTONES[1];
      else current = CHAPTER_MILESTONES[0];

      if (current.chapterId !== prevChapterId) {
        prevChapterId = current.chapterId;
        setActiveChapter(current);
        uiAudioFeedback.play('chapter');
      }

      animId = requestAnimationFrame(updateHUD);
    };

    animId = requestAnimationFrame(updateHUD);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleNavigateToChapter = (chapterId: ChapterId) => {
    uiAudioFeedback.play('click');
    navigateToChapter(chapterId);
  };

  return (
    <aside
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-3 pointer-events-auto select-none"
      aria-label="Mission Chapter Progression"
    >
      {/* 1. Active Chapter Mission Callout */}
      <div className="relative flex flex-col items-end gap-0.5 bg-[#070B10]/92 border border-[#252D36] px-3 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {/* Subtle corner mark */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#FF5938]" />
        
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF5938] animate-pulse" />
          <span className="font-mono text-[9px] font-bold tracking-[0.25em] text-[#FF5938] uppercase">
            CH. {activeChapter.number}
          </span>
        </div>
        <span className="font-display font-extrabold text-xs tracking-wider text-[#E9EDF0] uppercase">
          {activeChapter.label}
        </span>
        <div className="flex items-center gap-2 font-mono text-[8px] text-[#7E8B98] tracking-widest mt-0.5">
          <span>MISSION EO-26</span>
          <span>•</span>
          <span className="text-[#83BBD5]">
            PROGRESS {Math.round(currentProgress * 100)}%
          </span>
        </div>
      </div>

      {/* 2. Vertical Telemetry Rail & Milestone Chapter Notches */}
      <div className="relative flex flex-col items-center justify-between h-48 py-1 pr-1">
        {/* Continuous Track Background Line */}
        <div className="absolute top-0 right-[7px] w-[1px] h-full bg-[#252D36]/80" />

        {/* Live Active Progress Indicator Fill Line */}
        <div
          className="absolute top-0 right-[7px] w-[1px] bg-gradient-to-b from-[#FF5938] via-[#FF5938] to-[#83BBD5] transition-all duration-100"
          style={{ height: `${Math.min(100, Math.max(0, currentProgress * 100))}%` }}
        />

        {/* Dynamic Orbital Marker Head */}
        <div
          className="absolute right-[5px] w-2 h-2 -translate-x-0 -translate-y-1/2 bg-[#FF5938] shadow-[0_0_8px_#FF5938] transition-all duration-75 pointer-events-none"
          style={{ top: `${Math.min(100, Math.max(0, currentProgress * 100))}%` }}
        />

        {/* Milestone Notches */}
        {CHAPTER_MILESTONES.map((milestone) => {
          const isActive = activeChapter.chapterId === milestone.chapterId;
          return (
            <button
              key={milestone.chapterId}
              onClick={() => handleNavigateToChapter(milestone.chapterId)}
              data-cursor-label="EXPLORE"
              title={`Jump to Chapter ${milestone.number}: ${milestone.label}`}
              className="group relative flex items-center justify-end w-8 h-5 cursor-pointer focus-visible:outline-none"
            >
              {/* Tooltip on hover */}
              <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono text-[8px] tracking-widest text-[#E9EDF0] bg-[#070B10] border border-[#252D36] px-1.5 py-0.5 whitespace-nowrap shadow-md pointer-events-none">
                {milestone.number} {milestone.label}
              </span>

              {/* Milestone Notch */}
              <span
                className={`relative z-10 transition-all duration-200 ${
                  isActive
                    ? 'w-3 h-1 bg-[#FF5938] shadow-[0_0_6px_#FF5938]'
                    : 'w-1.5 h-[1px] bg-[#7E8B98] group-hover:w-2.5 group-hover:bg-[#E9EDF0]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
};
