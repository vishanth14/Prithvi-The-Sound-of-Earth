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

  // Find min and max for chart scale
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] z-10"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="timeline-reveal">
          <SectionHeader
            number="04"
            category="MULTI-DECADAL RECORD"
            title="SCIENTIFIC DATA EXPLORATION TIMELINE"
            subtitle={`Interactive time-series progression from ${data[0].year} to ${
              data[data.length - 1].year
            }. Scrub across time or play the timeline to witness historical shifts and synchronized auditory evolution.`}
            badge="TEMPORAL SCRUBBER"
          />
        </div>

        {/* Timeline Playback Controls & Year Readout */}
        <div className="timeline-reveal flex flex-wrap items-center justify-between gap-4 p-4 bg-[#02040a]/80 border border-white/[0.08]">
          <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-3">
            {isAudioUnlocked && <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
            <span className="font-mono text-xs text-slate-400">ACTIVE TIMEFRAME:</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-cyan-300">
              {currentPoint.year}
            </span>
            <Badge variant="cyan">{dataset.shortCode}</Badge>
          </div>
        </div>

        {/* SVG Sparkline & Interactive Data Points Area */}
        <Panel className="timeline-reveal overflow-hidden">
          <div className="h-44 sm:h-56 w-full relative flex items-end">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${data.length * 20} 100`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={dataset.themeColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={dataset.themeColor} stopOpacity="0.0" />
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
                fill="url(#lineGrad)"
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
                stroke={dataset.themeColor}
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
                      stroke="rgba(56, 189, 248, 0.4)"
                      strokeDasharray="2,2"
                    />
                    <circle cx={x} cy={y} r="5" fill="#38bdf8" />
                    <circle cx={x} cy={y} r="10" fill="none" stroke="#38bdf8" strokeWidth="1.5">
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
          <div className="mt-6 pt-4 border-t border-white/[0.08]">
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
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
              <span>RECORD START: {data[0].year}</span>
              <span className="text-cyan-400">DRAG SCRUBBER TO SHIFT TIMEFRAME</span>
              <span>LATEST DATA: {data[data.length - 1].year}</span>
            </div>
          </div>
        </Panel>

        {/* Selected Data Point Detail Cards */}
        <div className="timeline-reveal grid grid-cols-1 md:grid-cols-3 gap-6">
          <Panel className="flex flex-col justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              MEASURED RECORD ({currentPoint.year})
            </span>
            <div className="my-3">
              <span
                className="font-display text-4xl font-bold"
                style={{ color: dataset.themeColor }}
              >
                {currentPoint.value > 0 && activeDataset === 'temperature'
                  ? `+${currentPoint.value}`
                  : currentPoint.value}
              </span>
              <span className="font-mono text-sm text-slate-400 ml-2">{dataset.unit}</span>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Source: {dataset.leadAgency}
            </span>
          </Panel>

          <Panel className="md:col-span-2 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs text-cyan-300 uppercase tracking-widest">
                HISTORICAL & SCIENTIFIC MILESTONE
              </span>
            </div>
            <p className="font-sans text-sm sm:text-base text-slate-200 leading-relaxed">
              {currentPoint.milestone ||
                currentObservation?.milestone ||
                `Instrumental observation period for ${currentPoint.year}. Satellite and ground station records indicate steady trend line progression.`}
            </p>
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Scientific Status: Peer-Reviewed & Calibrated</span>
              <span className="text-cyan-400/80">NASA Space Apps 2026</span>
            </div>
          </Panel>
        </div>

        {/* Live Sound-to-Data Legend HUD */}
        {currentSonificationParams && (
          <Panel className="timeline-reveal p-5 bg-[#020510]/90 border-cyan-500/20">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>SOUND-TO-DATA SYNCHRONIZED LEGEND</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Activity className="w-3.5 h-3.5 text-solar-gold animate-pulse" />
                <span>CADENCE: {currentSonificationParams.tempoBpm} BPM</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-2.5 bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] block">PITCH FREQUENCY:</span>
                <span className="text-solar-gold font-bold text-sm">
                  {currentSonificationParams.frequencyHz} Hz ({currentSonificationParams.noteName})
                </span>
                <p className="text-slate-300 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.pitchFormula}
                </p>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] block">CADENCE & INTERVAL:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {currentSonificationParams.tempoBpm} BPM ({currentSonificationParams.stepIntervalMs}ms)
                </span>
                <p className="text-slate-300 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.rhythmFormula}
                </p>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] block">DYNAMIC FILTER:</span>
                <span className="text-cyan-300 font-bold text-sm">
                  {currentSonificationParams.filterCutoffHz} Hz Cutoff
                </span>
                <p className="text-slate-300 text-[11px] font-sans leading-tight">
                  {currentSonificationParams.explanation.intensityFormula}
                </p>
              </div>

              <div className="p-2.5 bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400 text-[10px] block">PSYCHOACOUSTIC STATE:</span>
                <span className="text-rose-400 font-bold text-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{currentSonificationParams.explanation.dissonanceInterpretation.split(' ')[0]} Tension</span>
                </span>
                <p className="text-slate-300 text-[11px] font-sans leading-tight">
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
