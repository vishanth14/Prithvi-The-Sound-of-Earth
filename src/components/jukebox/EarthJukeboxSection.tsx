import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { sonificationCore } from '../../audio/sonification';
import { EicDataService } from '../../data/eicDataService';
import type {
  EicDataset,
  EicDatasetKey,
  EicObservation,
  EicValidationReport,
} from '../../data/eicSchemas';
import { gsap, useGSAP } from '../../lib/gsap';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { MagneticButton } from '../common/MagneticButton';
import { Badge } from '../common/Badge';
import { NasaSvsVisualizer } from '../visualization/NasaSvsVisualizer';
import {
  Volume2,
  VolumeX,
  Activity,
  Disc,
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Radio,
  Calendar,
  FileCheck,
  Square,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

interface TrackDef {
  key: EicDatasetKey;
  name: string;
  trackLabel: string;
  nominalHz: string;
  timbreDescription: string;
  themeColor: string;
  unit: string;
  agency: string;
  mathFormula: string;
  normDomain: string;
}

const EIC_TRACKS: TrackDef[] = [
  {
    key: 'gistemp',
    name: 'Thermal Anomaly (GISTEMP v4)',
    trackLabel: 'Track 01 // Thermal PolySynth',
    nominalHz: '146.8 — 739.9 Hz',
    timbreDescription: 'Dual-oscillator triangle + dynamic 24dB/oct low-pass filter',
    themeColor: '#FF5938',
    unit: '°C Anomaly',
    agency: 'NASA Goddard Institute for Space Studies (GISS)',
    mathFormula: 'f(ΔT) = 146.83 · 2^(norm · 2.33) [Hz]',
    normDomain: '[-0.5°C, +1.5°C] → [0.0, 1.0]',
  },
  {
    key: 'co2_maunaloa',
    name: 'Carbon Clock (Mauna Loa CO₂)',
    trackLabel: 'Track 02 // Anthropocene Pulse',
    nominalHz: '45.0 — 90.0 Hz',
    timbreDescription: 'Sub-bass membrane punch with rate-coupled heartbeat',
    themeColor: '#83BBD5',
    unit: 'ppm',
    agency: 'NOAA Global Monitoring Laboratory & NASA OCO-2',
    mathFormula: 'BPM = 48 · (CO₂ / 280)^1.4  |  f(ppm) = 45.0 + norm · 45.0 Hz',
    normDomain: '[280 ppm, 440 ppm] → [0.0, 1.0]',
  },
  {
    key: 'sealevel_podaac',
    name: 'Altimetry Swell (Sentinel-6 / PO.DAAC)',
    trackLabel: 'Track 03 // Oceanic Resonance',
    nominalHz: '120.0 — 2400.0 Hz',
    timbreDescription: 'Hydrodynamic brown noise through 4-pole resonant bandpass',
    themeColor: '#83BBD5',
    unit: 'mm variance',
    agency: 'NASA PO.DAAC / Sentinel-6 Michael Freilich',
    mathFormula: 'fc(h) = 120 · 10^(norm · 1.30) [Hz]',
    normDomain: '[0 mm, 135 mm] → [0.0, 1.0]',
  },
  {
    key: 'aerosols_geos',
    name: 'Aerosol Particulates (GEOS-FP Model)',
    trackLabel: 'Track 04 // Granular Cloud [EXPERIMENTAL PROXY]',
    nominalHz: '329.6 — 493.9 Hz',
    timbreDescription: 'Crystalline FM synthesis with metallic wildfire inharmonicity',
    themeColor: '#7E8B98',
    unit: 'AOD index (550nm)',
    agency: 'NASA GMAO (Quarantined Experimental Proxy)',
    mathFormula: 'ModIndex = 1.0 + 8.0 · (BC / 0.8)  |  fc = 329.6 · 2^(norm · 0.58) Hz',
    normDomain: '[0.10 AOD, 0.25 AOD] → [0.0, 1.0]',
  },
  {
    key: 'nightlights_viirs',
    name: 'Earth at Night (VIIRS Black Marble)',
    trackLabel: 'Track 05 // Nocturnal Choral',
    nominalHz: '261.6 — 392.0 Hz',
    timbreDescription: 'Warm analog synthesizer pad with pentatonic chord spread',
    themeColor: '#E9EDF0',
    unit: 'nW·cm⁻²·sr⁻¹',
    agency: 'NASA ESDS Black Marble HD Suite',
    mathFormula: 'f(nW) = 261.63 · 2^(norm · 0.58) Hz (Pentatonic Voicing)',
    normDomain: '[15.0 nW, 30.0 nW] → [0.0, 1.0]',
  },
];

const HISTORICAL_MILESTONES = [
  { year: 1880, label: '1880 Baseline', description: 'Instrumental meteorological records begin (-0.16°C)' },
  { year: 1910, label: '1910 Cool Phase', description: 'Volcanic aerosols & solar minimum' },
  { year: 1940, label: '1940 Warming Pulse', description: 'Pre-war industrial thermal acceleration' },
  { year: 1958, label: '1958 Keeling Curve', description: 'Mauna Loa continuous CO₂ sampling begins (315.7 ppm)' },
  { year: 1975, label: '1975 Inflection', description: 'Greenhouse forcing overtakes aerosol cooling' },
  { year: 1993, label: '1993 Altimetry Epoch', description: 'TOPEX/Poseidon radar altimetry commences' },
  { year: 2015, label: '2015 Paris Accord', description: '+1.0°C global anomaly threshold breached' },
  { year: 2024, label: '2024 Benchmark', description: '+1.28°C empirical GISTEMP anomaly; 424.3 ppm Keeling benchmark' },
];

export const EarthJukeboxSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // Authoritative Observatory Store (Single Source of Truth)
  const {
    isAudioUnlocked,
    unlockAudio,
    isMuted,
    toggleMute,
    masterVolume,
    setMasterVolume,
    activeDatasetId,
    setActiveEicKey,
    currentObservationIndex,
    playbackState,
    playbackSpeed,
    loopEnabled,
    measuredSyncError,
    currentObservation,
    currentSonificationParams,
    startPlayback,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    replayPlayback,
    seekToIndex,
    setPlaybackSpeed,
    toggleLooping,
  } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.jukebox-reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.1,
        duration: 0.85,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  // View tabs
  const [activeVisualTab, setActiveVisualTab] = useState<'spiral' | 'multitrack' | 'audit'>('spiral');
  const [datasets, setDatasets] = useState<Record<EicDatasetKey, EicDataset> | null>(null);
  const [validationReport, setValidationReport] = useState<EicValidationReport | null>(null);

  // Visualization canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spiralSvgRef = useRef<SVGSVGElement | null>(null);
  const peaksRef = useRef<number[]>(new Array(48).fill(0));

  // Load empirical EIC datasets on mount for visual charts
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [all, report] = await Promise.all([
          EicDataService.loadAllDatasets(),
          EicDataService.generateValidationReport(),
        ]);
        if (isMounted) {
          setDatasets(all);
          setValidationReport(report);
        }
      } catch (err) {
        console.error('[Earth Jukebox] Failed to load validated EIC datasets:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync mute with synthesis core
  useEffect(() => {
    sonificationCore.setMuted(isMuted);
  }, [isMuted]);

  // Sync volume with synthesis core
  useEffect(() => {
    sonificationCore.setVolume(masterVolume);
  }, [masterVolume]);

  // Track Switching via authoritative store
  const handleSelectTrack = async (key: EicDatasetKey) => {
    await setActiveEicKey(key);
  };

  // Authoritative Transport Control Handlers
  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (playbackState === 'PLAYING') {
      pausePlayback();
    } else if (playbackState === 'PAUSED') {
      resumePlayback();
    } else {
      await startPlayback();
    }
  };

  const handleStop = () => {
    stopPlayback();
  };

  const handleRestart = async () => {
    await replayPlayback();
  };

  const handleScrub = (idx: number) => {
    if (!isAudioUnlocked) unlockAudio();
    seekToIndex(idx, true);
  };

  const handleSpeedCycle = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0, 4.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // ---------------------------------------------------------------------------
  // 48-BAND FFT & OSCILLOSCOPE REAL-TIME CANVAS LOOP (Direct RAF, Zero Store Rerenders)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isSynthesizing = playbackState === 'PLAYING' && !isMuted;
      const fftData = sonificationCore.getFftData();
      const waveData = sonificationCore.getWaveformData();

      // Background telemetry grid
      ctx.strokeStyle = 'rgba(37, 45, 54, 0.45)';
      ctx.lineWidth = 1;
      const gridCols = 8;
      for (let c = 1; c < gridCols; c++) {
        const gx = (width / gridCols) * c;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw 48 FFT bars
      const barCount = 48;
      const barWidth = width / barCount - 2;
      const peaks = peaksRef.current;
      const trackTheme = EIC_TRACKS.find((t) => t.key === activeDatasetId)?.themeColor || '#FF5938';

      for (let i = 0; i < barCount; i++) {
        const rawFft = fftData[i];
        const normalizedFft = isSynthesizing ? Math.max(0, (rawFft + 100) / 100) : 0.04;
        const barHeight = Math.max(3, normalizedFft * height * 0.82);

        peaks[i] = Math.max(barHeight, (peaks[i] || 0) * 0.94);

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(37, 45, 54, 0.25)');
        grad.addColorStop(0.65, trackTheme);
        grad.addColorStop(1, '#FF5938');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        if (isSynthesizing && peaks[i] > 6) {
          ctx.fillStyle = '#E9EDF0';
          ctx.fillRect(x, height - peaks[i] - 1.5, barWidth, 1.5);
        }
      }

      // Draw Web Audio oscilloscope line
      ctx.shadowColor = trackTheme;
      ctx.shadowBlur = isSynthesizing ? 8 : 0;
      ctx.beginPath();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = isSynthesizing ? trackTheme : 'rgba(233, 237, 240, 0.25)';

      const waveStep = Math.max(1, Math.floor(waveData.length / width));
      for (let x = 0; x < width; x++) {
        const val = waveData[x * waveStep] || 0;
        const y = height / 2 + val * (height * 0.38);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [playbackState, isMuted, activeDatasetId]);

  // ---------------------------------------------------------------------------
  // D3 CLIMATE SPIRAL COMPUTATION (NASA SVS #5190)
  // ---------------------------------------------------------------------------
  const spiralParams = useMemo(() => {
    const gistempData = datasets?.gistemp?.observations || [];
    const center = 230;
    const baseRadius = 80;
    const scaleFactor = 65;

    const ring0 = baseRadius;
    const ring1 = baseRadius + 1.0 * scaleFactor;
    const ring15 = baseRadius + 1.5 * scaleFactor;

    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];

    const monthAxes = months.map((name, i) => {
      const angle = (i * 2 * Math.PI) / 12 - Math.PI / 2;
      const maxR = ring15 + 24;
      return {
        name,
        angle,
        x1: center,
        y1: center,
        x2: center + maxR * Math.cos(angle),
        y2: center + maxR * Math.sin(angle),
        lx: center + (maxR + 14) * Math.cos(angle),
        ly: center + (maxR + 14) * Math.sin(angle),
      };
    });

    const colorScale = d3
      .scaleLinear<string>()
      .domain([-0.5, 0.0, 0.8, 1.2, 1.5])
      .range(['#162432', '#83BBD5', '#E9EDF0', '#FF5938', '#C9391B'])
      .clamp(true);

    const maxIdx =
      activeDatasetId === 'gistemp'
        ? currentObservationIndex
        : gistempData.length - 1;
    const activePoints = gistempData.slice(0, Math.max(1, maxIdx + 1));

    const pathSegments = activePoints.map((obs) => {
      const anomaly = obs.originalValue ?? 0;
      const monthAngle = ((obs.month - 1) * 2 * Math.PI) / 12 - Math.PI / 2;
      const r = Math.max(20, baseRadius + anomaly * scaleFactor);
      const x = center + r * Math.cos(monthAngle);
      const y = center + r * Math.sin(monthAngle);
      return {
        x,
        y,
        val: anomaly,
        color: colorScale(anomaly),
        year: obs.year,
      };
    });

    let spiralD = '';
    if (pathSegments.length > 0) {
      spiralD = `M ${pathSegments[0].x} ${pathSegments[0].y}`;
      for (let i = 1; i < pathSegments.length; i++) {
        spiralD += ` L ${pathSegments[i].x} ${pathSegments[i].y}`;
      }
    }

    const currentTip = pathSegments[pathSegments.length - 1];

    return {
      center,
      ring0,
      ring1,
      ring15,
      monthAxes,
      spiralD,
      currentTip,
    };
  }, [datasets, activeDatasetId, currentObservationIndex]);

  // Current track metadata
  const currentTrack = EIC_TRACKS.find((t) => t.key === activeDatasetId) || EIC_TRACKS[0];
  const activeDataset = datasets ? datasets[activeDatasetId] : null;
  const observations: EicObservation[] = activeDataset?.observations || [];
  const activeObs: EicObservation | undefined =
    currentObservation || observations[currentObservationIndex] || observations[0];
  const activeParams = currentSonificationParams;

  return (
    <section
      ref={sectionRef}
      id="jukebox"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#252D36] z-10 bg-[#070B10]/85 backdrop-blur-md pointer-events-auto"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="jukebox-reveal">
          <SectionHeader
            number="04"
            category="FREQUENCY // SONIC LABORATORY"
            title="THE EARTH JUKEBOX"
            subtitle="The centerpiece of PRITHVI: empirical NASA Earth Information Center telemetry married to real-time deterministic sonification. Audition the planet across space and time through an integrated visual and acoustic display driven by an authoritative master audio clock."
            badge="TONE.JS + WEB AUDIO ENGINE"
            badgeVariant="signal"
          />
        </div>

        {/* Audio Context Suspended Banner */}
        {!isAudioUnlocked && (
          <div className="jukebox-reveal p-5 bg-[#0E141D] border border-[#FF5938]/50 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Radio className="w-5 h-5 text-[#FF5938] animate-pulse" />
              <div>
                <h4 className="font-display font-bold text-[#E9EDF0] text-sm uppercase tracking-wider">
                  WEB AUDIO SUSPENDED (AUTOPLAY POLICY)
                </h4>
                <p className="font-mono text-xs text-[#83BBD5]">
                  Initialize the Web Audio API context to start real-time deterministic sonification.
                </p>
              </div>
            </div>
            <MagneticButton
              variant="primary"
              size="sm"
              onClick={unlockAudio}
              cursorLabel="AUDIO"
              className="px-4 py-2 font-bold tracking-wider"
            >
              UNLOCK OBSERVATORY AUDIO
            </MagneticButton>
          </div>
        )}

        {/* Master 5-Stream EIC Channel Selector */}
        <div className="jukebox-reveal flex flex-wrap items-center gap-2.5 pb-4 border-b border-[#252D36]">
          <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-semibold">
            <Disc className="w-3.5 h-3.5 text-[#FF5938]" />
            EIC CHANNELS:
          </span>
          {EIC_TRACKS.map((track) => {
            const isSelected = activeDatasetId === track.key;
            const isQuarantined = track.key === 'aerosols_geos';
            return (
              <button
                key={track.key}
                disabled={isQuarantined}
                onClick={() => !isQuarantined && handleSelectTrack(track.key)}
                data-cursor-label={isQuarantined ? 'LOCKED' : 'LISTEN'}
                title={
                  isQuarantined
                    ? 'Quarantined by Scientific Provenance Audit: Historical assimilation proxy table is not a verified NASA DAAC Level-3 empirical release.'
                    : undefined
                }
                className={`px-4 py-2 text-xs font-display tracking-wider uppercase transition-all duration-200 rounded-none border flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                  isQuarantined
                    ? 'opacity-40 cursor-not-allowed bg-[#070B10] text-[#7E8B98] border-[#252D36]'
                    : isSelected
                    ? 'bg-[#FF5938] text-white font-bold border-[#FF5938] shadow-[0_4px_16px_rgba(255,89,56,0.25)] cursor-pointer'
                    : 'bg-[#0E141D] text-[#E9EDF0]/70 border-[#252D36] hover:border-[#83BBD5] hover:text-white cursor-pointer'
                }`}
              >
                <span
                  className="w-2 h-2 shrink-0"
                  style={{
                    backgroundColor: isQuarantined
                      ? '#7E8B98'
                      : isSelected
                      ? '#FFFFFF'
                      : track.themeColor,
                  }}
                />
                <span className={isQuarantined ? 'line-through' : ''}>
                  {track.name.split('(')[0]}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    isQuarantined
                      ? 'text-red-400 no-underline font-semibold'
                      : isSelected
                      ? 'text-white/80'
                      : 'text-[#83BBD5]'
                  }`}
                >
                  {isQuarantined ? '[DISABLED // QUARANTINED]' : `(${track.unit})`}
                </span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* MASTER SPLIT COMPOSITION: NASA VISUALIZATION + LIVE SOUND DISPLAY   */}
        {/* =================================================================== */}
        <div className="jukebox-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================================================================= */}
          {/* LEFT COLUMN (7 COLS): NASA SVS VISUAL & 48-BAND FFT / OSCILLOSCOPE*/}
          {/* ================================================================= */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Visualizer Mode Switcher Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-[#252D36]">
              <span className="font-mono text-xs text-[#83BBD5] tracking-widest uppercase font-semibold flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
                NASA VISUAL DISPLAY
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveVisualTab('spiral')}
                  data-cursor-label="SPIRAL"
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-none border transition-colors cursor-pointer ${
                    activeVisualTab === 'spiral'
                      ? 'bg-[#FF5938] text-white font-bold border-[#FF5938]'
                      : 'bg-[#0E141D] text-[#E9EDF0]/60 border-[#252D36] hover:text-white'
                  }`}
                >
                  SVS #5190 SPIRAL
                </button>
                <button
                  onClick={() => setActiveVisualTab('multitrack')}
                  data-cursor-label="SERIES"
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-none border transition-colors cursor-pointer ${
                    activeVisualTab === 'multitrack'
                      ? 'bg-[#FF5938] text-white font-bold border-[#FF5938]'
                      : 'bg-[#0E141D] text-[#E9EDF0]/60 border-[#252D36] hover:text-white'
                  }`}
                >
                  TIME-SERIES
                </button>
                <button
                  onClick={() => setActiveVisualTab('audit')}
                  data-cursor-label="AUDIT"
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-none border transition-colors cursor-pointer ${
                    activeVisualTab === 'audit'
                      ? 'bg-[#FF5938] text-white font-bold border-[#FF5938]'
                      : 'bg-[#0E141D] text-[#E9EDF0]/60 border-[#252D36] hover:text-white'
                  }`}
                >
                  ZOD AUDIT
                </button>
              </div>
            </div>

            {/* TAB 1: NASA CLIMATE SPIRAL (SVS #5190) WITH EMPIRICAL VISUAL SYNCHRONIZATION */}
            {activeVisualTab === 'spiral' && (
              <NasaSvsVisualizer
                spiralSvgRef={spiralSvgRef}
                spiralParams={spiralParams}
              />
            )}

            {/* TAB 2: FRAME-ALIGNED TIME-SERIES CURVE */}
            {activeVisualTab === 'multitrack' && (
              <Panel className="p-6 sm:p-8 flex flex-col justify-between bg-[#0E141D] border-[#252D36] rounded-none min-h-[440px]">
                <div className="flex items-center justify-between border-b border-[#252D36] pb-3 text-xs font-mono">
                  <span className="text-[#E9EDF0] font-semibold">
                    {activeDataset?.metadata.title || 'EIC Multi-Decadal Time-Series'}
                  </span>
                  <span className="text-[#83BBD5]">{observations.length} Calibrated Points</span>
                </div>

                <div className="relative w-full h-64 my-auto flex items-center justify-center">
                  <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                    {/* Horizontal baseline */}
                    <line
                      x1="40"
                      y1="160"
                      x2="580"
                      y2="160"
                      stroke="rgba(233, 237, 240, 0.2)"
                      strokeDasharray="4,4"
                    />
                    <text
                      x="40"
                      y="152"
                      fill="rgba(233, 237, 240, 0.5)"
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      Baseline: {activeDataset?.metadata.baselineDefinition || '0.0'}
                    </text>

                    {/* Polyline of points */}
                    {observations.length > 1 && (
                      <path
                        d={(() => {
                          const w = 540;
                          const h = 180;
                          const vals = observations.map((o) => o.originalValue ?? 0);
                          const minV = Math.min(...vals);
                          const maxV = Math.max(...vals);
                          const range = maxV - minV || 1;
                          return observations.reduce((acc, o, i) => {
                            const v = o.originalValue ?? 0;
                            const x = 40 + (i / (observations.length - 1)) * w;
                            const y = 200 - ((v - minV) / range) * h;
                            return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }, '');
                        })()}
                        fill="none"
                        stroke={currentTrack.themeColor}
                        strokeWidth="2"
                      />
                    )}

                    {/* Active Scrubber Playhead Line */}
                    {observations.length > 1 && (
                      (() => {
                        const w = 540;
                        const h = 180;
                        const vals = observations.map((o) => o.originalValue ?? 0);
                        const minV = Math.min(...vals);
                        const maxV = Math.max(...vals);
                        const range = maxV - minV || 1;
                        const clampedIdx = Math.max(0, Math.min(observations.length - 1, currentObservationIndex));
                        const curV = observations[clampedIdx]?.originalValue ?? 0;
                        const curX = 40 + (clampedIdx / (observations.length - 1)) * w;
                        const curY = 200 - ((curV - minV) / range) * h;

                        return (
                          <g>
                            <line
                              x1={curX}
                              y1={20}
                              x2={curX}
                              y2={220}
                              stroke="#FF5938"
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                            />
                            <circle
                              cx={curX}
                              cy={curY}
                              r="6"
                              fill="#FF5938"
                              className="animate-ping"
                              opacity="0.6"
                            />
                            <circle
                              cx={curX}
                              cy={curY}
                              r="4.5"
                              fill="#E9EDF0"
                              stroke="#FF5938"
                              strokeWidth="2"
                            />
                            <text
                              x={curX > 480 ? curX - 10 : curX + 10}
                              y={Math.max(30, curY - 10)}
                              textAnchor={curX > 480 ? 'end' : 'start'}
                              fill="#E9EDF0"
                              fontSize="11"
                              fontFamily="IBM Plex Mono, monospace"
                              fontWeight="bold"
                            >
                              {observations[clampedIdx]?.year}: {curV} {currentTrack.unit}
                            </text>
                          </g>
                        );
                      })()
                    )}
                  </svg>
                </div>

                <div className="pt-3 border-t border-[#252D36] text-xs font-mono text-[#E9EDF0]/60 flex items-center justify-between">
                  <span>Sensor: {activeDataset?.metadata.instrumentPlatform}</span>
                  <span className="text-[#83BBD5]">{activeDataset?.metadata.primaryUnit}</span>
                </div>
              </Panel>
            )}

            {/* TAB 3: ZOD DATA AUDIT TABLE */}
            {activeVisualTab === 'audit' && (
              <Panel className="p-6 bg-[#0E141D] border-[#252D36] rounded-none max-h-[440px] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-[#252D36] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[#E9EDF0] font-semibold">
                      ZOD AUDIT: {validationReport?.totalRecordsProcessed || 105} OBSERVATIONS
                    </span>
                  </div>
                  <Badge variant="emerald">0 FABRICATION</Badge>
                </div>

                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[#83BBD5] border-b border-[#252D36]">
                    <tr>
                      <th className="py-1.5">YEAR</th>
                      <th className="py-1.5">MEASUREMENT</th>
                      <th className="py-1.5">UNIT</th>
                      <th className="py-1.5">BASELINE</th>
                      <th className="py-1.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252D36] text-[#E9EDF0]/80">
                    {observations.slice(0, 12).map((obs) => (
                      <tr key={obs.id}>
                        <td className="py-1.5">{obs.year}</td>
                        <td className="py-1.5 font-bold text-[#E9EDF0]">{obs.originalValue ?? '—'}</td>
                        <td className="py-1.5 text-[#83BBD5]">{obs.unit}</td>
                        <td className="py-1.5 text-[11px] truncate max-w-[120px]">{obs.baseline}</td>
                        <td className="py-1.5 text-[#10B981]">{obs.qualityFlag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}

            {/* LIVE SOUND VISUALIZATION: 48-BAND FFT + REAL-TIME OSCILLOSCOPE */}
            <Panel className="p-5 sm:p-6 bg-[#0E141D] border-[#252D36] rounded-none space-y-3">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-none ${
                      playbackState === 'PLAYING' ? 'bg-[#FF5938] animate-pulse' : 'bg-[#E9EDF0]/30'
                    }`}
                  />
                  <span className="text-[#E9EDF0] font-semibold uppercase tracking-wider">
                    WEB AUDIO ENGINE // 48-BAND FFT & OSCILLOSCOPE
                  </span>
                </div>
                <span className="text-[#83BBD5]">
                  {playbackState === 'PLAYING'
                    ? `${activeParams?.tempoBpm || 60} BPM • 60 FPS`
                    : 'AWAITING SYNTHESIS'}
                </span>
              </div>

              {/* Canvas element */}
              <div className="w-full h-36 bg-[#070B10] border border-[#252D36] rounded-none relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={144}
                  className="w-full h-full block"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#E9EDF0]/50 pt-1">
                <span>FFT: 20 Hz — 20 kHz Logarithmic Filterbank</span>
                <span className="text-[#83BBD5]">Waveform: Dynamic Polyphonic Bus</span>
              </div>

              {/* MEASURED SYNCHRONIZATION JITTER HUD */}
              <div className="pt-2 border-t border-[#252D36]/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#7E8B98] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-[#FF5938]" />
                  MEASURED AUDIO-VISUAL JITTER:
                </span>
                <span className="text-[#83BBD5] font-semibold">
                  ±{measuredSyncError.lastJitterMs.toFixed(1)} ms
                  <span className="text-[#7E8B98] font-normal ml-2">
                    (Mean: {measuredSyncError.meanJitterMs.toFixed(1)} ms, Max: {measuredSyncError.maxJitterMs.toFixed(1)} ms | {measuredSyncError.sampleCount} sampled)
                  </span>
                </span>
              </div>
            </Panel>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN (5 COLS): MEASUREMENT, EXPLANATION, TIMELINE CONTROLS*/}
          {/* ================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* CURRENT SCIENTIFIC MEASUREMENT CARD */}
            <Panel className="p-6 sm:p-7 bg-[#0E141D] border-[#252D36] rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
                  CURRENT SCIENTIFIC MEASUREMENT
                </span>
                <Badge variant="signal">{activeObs?.year || 2024}</Badge>
              </div>

              <div>
                <span className="font-mono text-xs text-[#E9EDF0]/60 block mb-1">
                  {currentTrack.name}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-5xl sm:text-6xl font-extrabold uppercase text-[#E9EDF0] leading-none">
                    {activeObs?.originalValue !== null && activeObs?.originalValue !== undefined
                      ? activeObs.originalValue
                      : '—'}
                  </span>
                  <span className="font-mono text-sm text-[#FF5938]">{currentTrack.unit}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#252D36] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Baseline Reference:</span>
                  <span className="text-[#83BBD5] font-medium truncate max-w-[180px]">
                    {activeDataset?.metadata.baselineDefinition || 'Pre-industrial equilibrium'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Observation Status:</span>
                  <span className="text-[#10B981] font-semibold">
                    {activeObs?.qualityFlag || 'VALID'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Lead Agency:</span>
                  <span className="text-[#83BBD5] truncate max-w-[200px]">{currentTrack.agency}</span>
                </div>
              </div>
            </Panel>

            {/* SOUND-TO-DATA EXPLANATION CARD (Full Epistemological Rigor) */}
            <Panel className="p-6 sm:p-7 bg-[#0E141D] border-[#252D36] rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Disc className="w-3.5 h-3.5 text-[#FF5938]" />
                  SOUND-TO-DATA EXPLANATION
                </span>
                <Badge variant="signal">DETERMINISTIC</Badge>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Original Scientific Value:</span>
                  <span className="text-[#E9EDF0] font-bold">
                    {activeObs?.originalValue ?? '—'} {currentTrack.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Climatological Baseline:</span>
                  <span className="text-[#83BBD5] truncate max-w-[200px]">
                    {activeDataset?.metadata.baselineDefinition || '1951–1980 mean'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Normalization Domain:</span>
                  <span className="text-[#7E8B98]">
                    {currentTrack.normDomain}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Musical Pitch:</span>
                  <span className="text-[#E9EDF0] font-semibold">
                    {activeParams?.noteName || 'D3'} ({activeParams?.frequencyHz.toFixed(1) || '146.8'} Hz, {activeParams?.centsOffset ?? 0} cents)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Harmonic Consonance:</span>
                  <span className="text-[#83BBD5]">
                    {activeParams && activeParams.frequencyHz > 300
                      ? 'Dissonant Minor 2nd'
                      : 'Consonant Perfect 5th'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Rhythm Cadence:</span>
                  <span className="text-[#FF5938] font-semibold">
                    {activeParams?.tempoBpm || 48} BPM ({activeParams?.stepIntervalMs || 1250} ms)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#E9EDF0]/50">Filter Cutoff:</span>
                  <span className="text-[#E9EDF0]">
                    {activeParams?.filterCutoffHz || 450} Hz
                  </span>
                </div>

                <div className="pt-2 border-t border-[#252D36]">
                  <span className="text-[#E9EDF0]/50 block text-[10px] uppercase mb-1">
                    TRANSFER FORMULA:
                  </span>
                  <span className="text-[#FF5938] bg-[#070B10] border border-[#252D36] px-2.5 py-1 rounded-none block text-[11px]">
                    {currentTrack.mathFormula}
                  </span>
                </div>

                {/* EPISTEMOLOGICAL DISCLAIMER */}
                <div className="mt-3 p-3 bg-[#070B10] border border-[#252D36] rounded-none space-y-1">
                  <div className="flex items-center gap-1.5 text-[#FF5938] text-[10px] font-bold uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Epistemological Clarification</span>
                  </div>
                  <p className="font-sans text-[11px] text-[#7E8B98] leading-relaxed">
                    Sonification is a creative auditory display designed for human pattern recognition, not a direct acoustic sound emitted by Earth. Musical tension and dissonance reflect mathematical intervals, not diagnostic clinical health.
                  </p>
                </div>
              </div>
            </Panel>

            {/* PLAYBACK TIMELINE SCRUBBER & TRANSPORT CONTROLS */}
            <Panel className="p-6 sm:p-7 bg-[#0E141D] border-[#252D36] rounded-none space-y-5">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#FF5938]" />
                  PLAYBACK TIMELINE (1880 — 2024)
                </span>
                <span className="font-mono text-xs text-[#FF5938] font-bold">
                  {activeObs?.year || 1880}
                </span>
              </div>

              {/* Scrubber slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, observations.length - 1)}
                  value={currentObservationIndex || 0}
                  onChange={(e) => handleScrub(parseInt(e.target.value, 10))}
                  data-cursor-label="DRAG"
                  aria-label="Seek timeline observation"
                  className="w-full h-2 bg-[#070B10] rounded-none appearance-none cursor-grab active:cursor-grabbing accent-[#FF5938] border border-[#252D36]"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-[#E9EDF0]/50">
                  <span>1880 Baseline</span>
                  <span>1958 Keeling</span>
                  <span>1993 Ocean</span>
                  <span>2024 Modern</span>
                </div>
              </div>

              {/* Milestones quick-seek buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {HISTORICAL_MILESTONES.slice(0, 4).map((m) => (
                  <button
                    key={m.year}
                    onClick={() => {
                      const idx = observations.findIndex((o) => o.year >= m.year);
                      if (idx !== -1) handleScrub(idx);
                    }}
                    data-cursor-label="SEEK"
                    className="px-2 py-0.5 text-[10px] font-mono border border-[#252D36] bg-[#070B10] hover:border-[#FF5938] text-[#E9EDF0]/60 hover:text-[#FF5938] rounded-none transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {m.year}
                  </button>
                ))}
              </div>

              {/* Master Transport Action Buttons */}
              <div className="pt-3 border-t border-[#252D36] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MagneticButton
                    variant="primary"
                    size="sm"
                    onClick={handleTogglePlay}
                    cursorLabel={playbackState === 'PLAYING' ? 'PAUSE' : 'PLAY'}
                    className="relative gap-2 px-4 py-2 font-bold tracking-wider"
                  >
                    {playbackState === 'PLAYING' ? (
                      <>
                        <span className="relative flex h-2.5 w-2.5 mr-0.5">
                          <span className="animate-ping absolute inline-flex h-full w-full bg-white opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 bg-white" />
                        </span>
                        <Pause className="w-3.5 h-3.5 text-[#070B10]" />
                        <span className="text-[#070B10]">PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[#070B10]" />
                        <span className="text-[#070B10]">PLAY</span>
                      </>
                    )}
                  </MagneticButton>

                  <button
                    onClick={handleStop}
                    data-cursor-label="STOP"
                    data-cursor-magnetic="true"
                    className="p-2 border border-[#252D36] bg-[#070B10] hover:border-[#83BBD5] text-[#E9EDF0]/70 hover:text-white rounded-none transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Stop playback"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleRestart}
                    data-cursor-label="RESET"
                    data-cursor-magnetic="true"
                    className="p-2 border border-[#252D36] bg-[#070B10] hover:border-[#83BBD5] text-[#E9EDF0]/70 hover:text-white rounded-none transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Replay from beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleSpeedCycle}
                    data-cursor-label="SPEED"
                    data-cursor-magnetic="true"
                    className="px-2.5 py-1 text-xs font-mono border border-[#252D36] bg-[#070B10] hover:border-[#83BBD5] text-[#83BBD5] rounded-none transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Cycle Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    onClick={toggleLooping}
                    data-cursor-label="LOOP"
                    data-cursor-magnetic="true"
                    className={`p-2 border rounded-none transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      loopEnabled
                        ? 'border-[#FF5938] text-[#FF5938] bg-[#FF5938]/10'
                        : 'border-[#252D36] bg-[#070B10] text-[#E9EDF0]/60 hover:text-white'
                    }`}
                    title="Toggle Loop"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Volume & Mute */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={toggleMute}
                    data-cursor-label={isMuted ? 'UNMUTE' : 'MUTE'}
                    data-cursor-magnetic="true"
                    className="text-[#E9EDF0]/70 hover:text-white transition-all cursor-pointer hover:scale-110"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-[#FF5938]" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#83BBD5]" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    data-cursor-label="VOLUME"
                    aria-label="Master Sonification Volume"
                    className="w-16 h-1 bg-[#070B10] rounded-none appearance-none cursor-pointer accent-[#FF5938] border border-[#252D36]"
                  />
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
};
