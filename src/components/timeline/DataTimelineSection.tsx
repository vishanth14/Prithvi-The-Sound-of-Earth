import React, { useRef } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { EARTH_DATASETS } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Volume2,
  Activity,
  Info,
  Sparkles,
} from 'lucide-react';

export const DataTimelineSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    activeDataset,
    selectedYear,
    transportState,
    startPlayback,
    pausePlayback,
    seekToYear,
    isAudioUnlocked,
    unlockAudio,
    currentObservation,
    currentSonificationParams,
  } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.timeline-reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  const dataset = EARTH_DATASETS[activeDataset];
  const data = dataset.data;

  const currentPoint =
    data.find((d) => d.year === selectedYear) ||
    data.reduce((prev, curr) =>
      Math.abs(curr.year - selectedYear) < Math.abs(prev.year - selectedYear) ? curr : prev
    );

  const isPlaying = transportState === 'PLAYING';

  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (isPlaying) {
      pausePlayback();
    } else {
      await startPlayback();
    }
  };

  // Scale computation
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="timeline-reveal">
          <SectionHeader
            number="04"
            category="TEMPORAL OBSERVATORY RECORD"
            title="SCIENTIFIC DATA TIMELINE"
            subtitle={`Interactive time-series progression from ${data[0].year} to ${
              data[data.length - 1].year
            }. Scrub across multi-decadal observations to witness historical climate shifts and synchronized auditory evolution.`}
            badge="1880 — 2026 CHRONOLOGY"
            badgeVariant="sand"
          />
        </div>

        {/* Timeline Playback Controls & Year Readout */}
        <div className="timeline-reveal flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6 bg-[#0C1017] border border-[#F0EEE5]/10 rounded-sm">
          <div className="flex items-center gap-3.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTogglePlay}
              icon={
                isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )
              }
            >
              {isPlaying ? 'PAUSE TIMELINE' : 'PLAY TIMELINE & AUDIO'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => seekToYear(data[0].year)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              RESET TO {data[0].year}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {isAudioUnlocked && <Volume2 className="w-4 h-4 text-[#E16D54] animate-pulse" />}
            <span className="font-mono text-xs text-[#F0EEE5]/60 uppercase tracking-wider">
              ACTIVE TIMEFRAME:
            </span>
            <span className="font-sans text-3xl sm:text-4xl font-light text-[#F0EEE5] tracking-tight">
              {currentPoint.year}
            </span>
            <Badge variant="sand">{dataset.shortCode}</Badge>
          </div>
        </div>

        {/* SVG Sparkline & Interactive Data Points Area */}
        <Panel className="timeline-reveal overflow-hidden bg-[#0C1017] border-[#F0EEE5]/10 p-6 sm:p-8">
          <div className="h-44 sm:h-56 w-full relative flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${data.length * 20} 100`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="editorialTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D1B77D" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#D1B77D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <polygon
                points={`0,100 ${data
                  .map((d, i) => {
                    const x = i * 20;
                    const y = 100 - ((d.value - minVal) / range) * 80;
                    return `${x},${y}`;
                  })
                  .join(' ')} ${(data.length - 1) * 20},100`}
                fill="url(#editorialTimelineGrad)"
              />

              {/* Polyline line */}
              <polyline
                points={data
                  .map((d, i) => {
                    const x = i * 20;
                    const y = 100 - ((d.value - minVal) / range) * 80;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#D1B77D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active Point Indicator Marker */}
              {data.map((d, i) => {
                const isSelected = d.year === currentPoint.year;
                const x = i * 20;
                const y = 100 - ((d.value - minVal) / range) * 80;

                if (!isSelected) return null;

                return (
                  <g key={d.year}>
                    <line
                      x1={x}
                      y1="0"
                      x2={x}
                      y2="100"
                      stroke="rgba(240, 238, 229, 0.4)"
                      strokeDasharray="2,2"
                    />
                    <circle cx={x} cy={y} r="5" fill="#E16D54" />
                    <circle cx={x} cy={y} r="10" fill="none" stroke="#E16D54" strokeWidth="1.5">
                      <animate
                        attributeName="r"
                        values="6;14;6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="1;0;1"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Scrubber Range Slider */}
          <div className="mt-8 pt-5 border-t border-[#F0EEE5]/10">
            <input
              type="range"
              role="slider"
              aria-label="Timeline Year Scrubber"
              aria-valuenow={currentPoint.year}
              aria-valuemin={data[0].year}
              aria-valuemax={data[data.length - 1].year}
              aria-valuetext={`Observation Year ${currentPoint.year}, Value ${currentPoint.value} ${dataset.unit}`}
              min={data[0].year}
              max={data[data.length - 1].year}
              step={1}
              value={currentPoint.year}
              onChange={(e) => {
                const yr = Number(e.target.value);
                seekToYear(yr);
              }}
              className="w-full accent-[#E16D54] cursor-pointer h-2 bg-[#111820] border border-[#F0EEE5]/20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-[#F0EEE5]/60 mt-3">
              <span>RECORD START: {data[0].year}</span>
              <span className="text-[#D1B77D] tracking-wider uppercase font-semibold">
                DRAG SCRUBBER TO SHIFT TIMEFRAME
              </span>
              <span>LATEST DATA: {data[data.length - 1].year}</span>
            </div>
          </div>
        </Panel>

        {/* Selected Data Point Detail Cards */}
        <div className="timeline-reveal grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <Panel className="flex flex-col justify-between bg-[#0C1017] border-[#F0EEE5]/10 p-6 sm:p-7">
            <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em]">
              MEASURED RECORD ({currentPoint.year})
            </span>
            <div className="my-4">
              <span className="font-sans text-4xl sm:text-5xl font-light text-[#E16D54] tracking-tight">
                {currentPoint.value > 0 && activeDataset === 'temperature'
                  ? `+${currentPoint.value}`
                  : currentPoint.value}
              </span>
              <span className="font-mono text-sm text-[#F0EEE5]/70 ml-2">{dataset.unit}</span>
            </div>
            <span className="font-mono text-xs text-[#F0EEE5]/50">
              Source: {dataset.leadAgency}
            </span>
          </Panel>

          <Panel className="md:col-span-2 flex flex-col justify-between bg-[#0C1017] border-[#F0EEE5]/10 p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#D1B77D]" />
              <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] font-semibold">
                HISTORICAL & SCIENTIFIC MILESTONE
              </span>
            </div>
            <p className="font-serif italic text-sm sm:text-base text-[#F0EEE5]/85 leading-relaxed">
              "{currentPoint.milestone ||
                currentObservation?.milestone ||
                `Instrumental observation period for ${currentPoint.year}. Satellite and ground station records indicate steady trend line progression.`}"
            </p>
            <div className="pt-4 border-t border-[#F0EEE5]/10 flex items-center justify-between text-xs font-mono text-[#F0EEE5]/50">
              <span>Scientific Status: Peer-Reviewed & Calibrated</span>
              <span className="text-[#D1B77D]">NASA Space Apps 2026</span>
            </div>
          </Panel>
        </div>

        {/* Live Sound-to-Data Legend HUD */}
        {currentSonificationParams && (
          <Panel className="timeline-reveal p-6 sm:p-7 bg-[#0C1017] border-[#D1B77D]/20">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EEE5]/10">
              <div className="flex items-center gap-2 text-[#D1B77D] font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                <Info className="w-3.5 h-3.5" />
                <span>SOUND-TO-DATA SYNCHRONIZED LEGEND</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#F0EEE5]/60">
                <Activity className="w-3.5 h-3.5 text-[#E16D54] animate-pulse" />
                <span>CADENCE: {currentSonificationParams.tempoBpm} BPM</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 text-[10px] uppercase tracking-wider block">
                  PITCH FREQUENCY:
                </span>
                <span className="text-[#D1B77D] font-bold text-sm block">
                  {currentSonificationParams.frequencyHz} Hz ({currentSonificationParams.noteName})
                </span>
                <p className="text-[#F0EEE5]/75 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.pitchFormula}
                </p>
              </div>

              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 text-[10px] uppercase tracking-wider block">
                  CADENCE & INTERVAL:
                </span>
                <span className="text-[#E16D54] font-bold text-sm block">
                  {currentSonificationParams.tempoBpm} BPM ({currentSonificationParams.stepIntervalMs}ms)
                </span>
                <p className="text-[#F0EEE5]/75 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.rhythmFormula}
                </p>
              </div>

              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 text-[10px] uppercase tracking-wider block">
                  DYNAMIC FILTER:
                </span>
                <span className="text-[#F0EEE5] font-bold text-sm block">
                  {currentSonificationParams.filterCutoffHz} Hz Cutoff
                </span>
                <p className="text-[#F0EEE5]/75 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.intensityFormula}
                </p>
              </div>

              <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1.5 rounded-sm">
                <span className="text-[#F0EEE5]/50 text-[10px] uppercase tracking-wider block">
                  PSYCHOACOUSTIC STATE:
                </span>
                <span className="text-[#D1B77D] font-bold text-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#E16D54]" />
                  <span>{currentSonificationParams.explanation.dissonanceInterpretation.split(' ')[0]} Tension</span>
                </span>
                <p className="text-[#F0EEE5]/75 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.dissonanceInterpretation}
                </p>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </section>
  );
};
