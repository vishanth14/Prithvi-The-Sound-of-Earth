import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { sonificationCore } from '../../audio/sonification';
import {
  audioTransport,
  type TransportState,
  type TransportTickPayload,
} from '../../audio/audioTransport';
import { mapObservationToAudio } from '../../audio/dataMapping';
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
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
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
}

const EIC_TRACKS: TrackDef[] = [
  {
    key: 'gistemp',
    name: 'Thermal Anomaly (GISTEMP v4)',
    trackLabel: 'Track 01 // Thermal PolySynth',
    nominalHz: '146.8 — 739.9 Hz',
    timbreDescription: 'Dual-oscillator triangle + dynamic 24dB/oct low-pass filter',
    themeColor: '#D1B77D',
    unit: '°C Anomaly',
    agency: 'NASA Goddard Institute for Space Studies (GISS)',
    mathFormula: 'f(ΔT) = 220 · 2^(ΔT / 1.2)',
  },
  {
    key: 'co2_maunaloa',
    name: 'Carbon Clock (Mauna Loa CO₂)',
    trackLabel: 'Track 02 // Anthropocene Pulse',
    nominalHz: '45.0 — 90.0 Hz',
    timbreDescription: 'Sub-bass membrane punch with rate-coupled heartbeat',
    themeColor: '#E16D54',
    unit: 'ppm',
    agency: 'NOAA Global Monitoring Laboratory & NASA OCO-2',
    mathFormula: 'BPM = 48 · (CO₂ / 280)^1.4',
  },
  {
    key: 'sealevel_podaac',
    name: 'Altimetry Swell (Sentinel-6 / PO.DAAC)',
    trackLabel: 'Track 03 // Oceanic Resonance',
    nominalHz: '120.0 — 2400.0 Hz',
    timbreDescription: 'Hydrodynamic brown noise through 4-pole resonant bandpass',
    themeColor: '#508CA4',
    unit: 'mm variance',
    agency: 'NASA PO.DAAC / Sentinel-6 Michael Freilich',
    mathFormula: 'fc(h) = 120 + 2280 · (h / 120)',
  },
  {
    key: 'aerosols_geos',
    name: 'Aerosol Particulates (GEOS-FP Smoke)',
    trackLabel: 'Track 04 // Granular Cloud',
    nominalHz: '329.6 — 493.9 Hz',
    timbreDescription: 'Crystalline FM synthesis with metallic wildfire inharmonicity',
    themeColor: '#9D8DF1',
    unit: 'AOD index (550nm)',
    agency: 'NASA Global Modeling and Assimilation Office (GMAO)',
    mathFormula: 'ModIndex = 0.2 + 2.5 · (AOD / 0.5)',
  },
  {
    key: 'nightlights_viirs',
    name: 'Earth at Night (VIIRS Black Marble)',
    trackLabel: 'Track 05 // Nocturnal Choral',
    nominalHz: '261.6 — 392.0 Hz',
    timbreDescription: 'Warm analog synthesizer pad with pentatonic chord spread',
    themeColor: '#4EBA97',
    unit: 'nW·cm⁻²·sr⁻¹',
    agency: 'NASA ESDS Black Marble HD Suite',
    mathFormula: 'Gain = 0.2 + 0.7 · min(1, R / 100)',
  },
];

const HISTORICAL_MILESTONES = [
  { year: 1880, label: '1880 Baseline', description: 'Instrumental meteorological records begin' },
  { year: 1910, label: '1910 Cool Phase', description: 'Volcanic aerosols & solar minimum' },
  { year: 1940, label: '1940 Warming Pulse', description: 'Pre-war industrial thermal acceleration' },
  { year: 1958, label: '1958 Keeling Curve', description: 'Mauna Loa continuous CO₂ sampling begins' },
  { year: 1970, label: '1970 First Earth Day', description: 'Initial satellite thermal instruments deployed' },
  { year: 1993, label: '1993 Altimetry Epoch', description: 'TOPEX/Poseidon radar altimetry commences' },
  { year: 2015, label: '2015 Paris Accord', description: '+1.0°C global anomaly threshold breached' },
  { year: 2026, label: '2026 Anthropocene', description: '+1.45°C sustained anomaly; 429 ppm CO₂' },
];

export const EarthJukeboxSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    isAudioUnlocked,
    unlockAudio,
    isMuted,
    toggleMute,
    masterVolume,
    setMasterVolume,
    activeEicKey,
    setActiveEicKey,
    selectedObservationIndex,
    seekToIndex,
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

  // View state
  const [activeVisualTab, setActiveVisualTab] = useState<'spiral' | 'multitrack' | 'audit'>('spiral');
  const [datasets, setDatasets] = useState<Record<EicDatasetKey, EicDataset> | null>(null);
  const [validationReport, setValidationReport] = useState<EicValidationReport | null>(null);
  const [transportState, setTransportState] = useState<TransportState>('STOPPED');
  const [currentPayload, setCurrentPayload] = useState<TransportTickPayload | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Visualization canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spiralSvgRef = useRef<SVGSVGElement | null>(null);
  const peaksRef = useRef<number[]>(new Array(48).fill(0));

  // Load empirical EIC datasets
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
          const defaultObs = all[activeEicKey].observations;
          audioTransport.loadSequence(defaultObs, selectedObservationIndex || 0);
          const activeObs = defaultObs[selectedObservationIndex || 0] || defaultObs[0];
          const params = mapObservationToAudio(activeObs);
          setCurrentPayload({
            observation: activeObs,
            params,
            index: selectedObservationIndex || 0,
            totalRecords: defaultObs.length,
            progressPercent: ((selectedObservationIndex || 0) / (defaultObs.length - 1)) * 100,
          });
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

  // Listen to Transport events
  useEffect(() => {
    const unsubTick = audioTransport.onTick((payload) => {
      setCurrentPayload(payload);
    });

    const unsubState = audioTransport.onStateChange((state) => {
      setTransportState(state);
    });

    return () => {
      unsubTick();
      unsubState();
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

  // Handle Track Switching
  const handleSelectTrack = useCallback(
    async (key: EicDatasetKey) => {
      await setActiveEicKey(key);
      if (!datasets) return;
      const obs = datasets[key].observations;
      const wasPlaying = transportState === 'PLAYING';
      audioTransport.loadSequence(obs, 0);
      const params = mapObservationToAudio(obs[0]);
      setCurrentPayload({
        observation: obs[0],
        params,
        index: 0,
        totalRecords: obs.length,
        progressPercent: 0,
      });

      if (wasPlaying) {
        audioTransport.play();
      }
    },
    [datasets, transportState, setActiveEicKey]
  );

  // Transport Control Actions
  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (transportState === 'PLAYING') {
      audioTransport.pause();
    } else {
      audioTransport.play();
    }
  };

  const handleRestart = () => {
    audioTransport.seekToIndex(0, true);
    seekToIndex(0, true);
  };

  const handleScrub = (idx: number) => {
    if (!isAudioUnlocked) unlockAudio();
    audioTransport.seekToIndex(idx, true);
    seekToIndex(idx, true);
  };

  const handleSpeedCycle = () => {
    const speeds = [0.5, 1.0, 2.0, 4.0];
    const nextIdx = (speeds.indexOf(speedMultiplier) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeedMultiplier(nextSpeed);
    audioTransport.setSpeedMultiplier(nextSpeed);
  };

  const handleToggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    audioTransport.setIsLooping(next);
  };

  // ---------------------------------------------------------------------------
  // 48-BAND FFT & OSCILLOSCOPE REAL-TIME CANVAS LOOP
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

      const isSynthesizing = transportState === 'PLAYING' && !isMuted;
      const fftData = sonificationCore.getFftData();
      const waveData = sonificationCore.getWaveformData();

      // Background telemetry grid
      ctx.strokeStyle = 'rgba(240, 238, 229, 0.04)';
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
      const trackTheme = EIC_TRACKS.find((t) => t.key === activeEicKey)?.themeColor || '#D1B77D';

      for (let i = 0; i < barCount; i++) {
        const rawFft = fftData[i];
        const normalizedFft = isSynthesizing ? Math.max(0, (rawFft + 100) / 100) : 0.04;
        const barHeight = Math.max(3, normalizedFft * height * 0.82);

        peaks[i] = Math.max(barHeight, (peaks[i] || 0) * 0.94);

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(209, 183, 125, 0.08)');
        grad.addColorStop(0.65, trackTheme);
        grad.addColorStop(1, '#F0EEE5');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        if (isSynthesizing && peaks[i] > 6) {
          ctx.fillStyle = '#F0EEE5';
          ctx.fillRect(x, height - peaks[i] - 1.5, barWidth, 1.5);
        }
      }

      // Draw Web Audio oscilloscope line
      ctx.shadowColor = trackTheme;
      ctx.shadowBlur = isSynthesizing ? 8 : 0;
      ctx.beginPath();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = isSynthesizing ? trackTheme : 'rgba(240, 238, 229, 0.25)';

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
  }, [transportState, isMuted, activeEicKey]);

  // ---------------------------------------------------------------------------
  // D3 CLIMATE SPIRAL COMPUTATION (NASA SVS #4976)
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
      .range(['#17465B', '#F0EEE5', '#D1B77D', '#E16D54', '#B83A2E'])
      .clamp(true);

    const maxIdx =
      activeEicKey === 'gistemp'
        ? selectedObservationIndex
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
  }, [datasets, activeEicKey, selectedObservationIndex]);

  // Current track metadata
  const currentTrack = EIC_TRACKS.find((t) => t.key === activeEicKey) || EIC_TRACKS[0];
  const activeDataset = datasets ? datasets[activeEicKey] : null;
  const observations: EicObservation[] = activeDataset?.observations || [];
  const activeObs: EicObservation | undefined =
    currentPayload?.observation || observations[selectedObservationIndex] || observations[0];
  const activeParams = currentPayload?.params;

  return (
    <section
      ref={sectionRef}
      id="jukebox"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="jukebox-reveal">
          <SectionHeader
            number="04"
            category="PRIMARY CHALLENGE EXPERIENCE"
            title="THE EARTH JUKEBOX"
            subtitle="The centerpiece of PRITHVI: empirical NASA Earth Information Center telemetry married to real-time deterministic sonification. Audition the planet across space and time through an integrated visual and acoustic display."
            badge="TONE.JS + WEB AUDIO ENGINE"
            badgeVariant="signal"
          />
        </div>

        {/* Audio Context Suspended Banner */}
        {!isAudioUnlocked && (
          <div className="jukebox-reveal p-5 bg-[#E16D54]/10 border border-[#E16D54]/30 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Radio className="w-5 h-5 text-[#E16D54] animate-pulse" />
              <div>
                <h4 className="font-sans font-semibold text-[#F0EEE5] text-sm uppercase tracking-wide">
                  WEB AUDIO SUSPENDED (AUTOPLAY POLICY)
                </h4>
                <p className="font-serif italic text-xs text-[#F0EEE5]/75">
                  Initialize the Web Audio API context to start real-time deterministic sonification.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={unlockAudio}>
              UNLOCK OBSERVATORY AUDIO
            </Button>
          </div>
        )}

        {/* Master 5-Stream EIC Channel Selector */}
        <div className="jukebox-reveal flex flex-wrap items-center gap-2.5 pb-4 border-b border-[#F0EEE5]/10">
          <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-semibold">
            <Disc className="w-3.5 h-3.5 text-[#D1B77D]" />
            EIC CHANNELS:
          </span>
          {EIC_TRACKS.map((track) => {
            const isSelected = activeEicKey === track.key;
            return (
              <button
                key={track.key}
                onClick={() => handleSelectTrack(track.key)}
                className={`px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-200 rounded-full flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_16px_rgba(240,238,229,0.15)]'
                    : 'bg-transparent text-[#F0EEE5]/65 border border-[#F0EEE5]/15 hover:border-[#D1B77D] hover:text-[#D1B77D]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: track.themeColor }}
                />
                <span>{track.name.split('(')[0]}</span>
                <span
                  className={`text-[10px] font-mono ${
                    isSelected ? 'text-[#111820]/70' : 'text-[#D1B77D]'
                  }`}
                >
                  ({track.unit})
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
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EEE5]/10">
              <span className="font-mono text-xs text-[#D1B77D] tracking-widest uppercase font-semibold flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#D1B77D]" />
                NASA VISUAL DISPLAY
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveVisualTab('spiral')}
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-full transition-colors cursor-pointer ${
                    activeVisualTab === 'spiral'
                      ? 'bg-[#D1B77D] text-[#111820] font-semibold'
                      : 'text-[#F0EEE5]/60 hover:text-[#F0EEE5] border border-[#F0EEE5]/15'
                  }`}
                >
                  SVS #4976 SPIRAL
                </button>
                <button
                  onClick={() => setActiveVisualTab('multitrack')}
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-full transition-colors cursor-pointer ${
                    activeVisualTab === 'multitrack'
                      ? 'bg-[#D1B77D] text-[#111820] font-semibold'
                      : 'text-[#F0EEE5]/60 hover:text-[#F0EEE5] border border-[#F0EEE5]/15'
                  }`}
                >
                  TIME-SERIES
                </button>
                <button
                  onClick={() => setActiveVisualTab('audit')}
                  className={`px-3 py-1 text-[11px] font-mono tracking-wider uppercase rounded-full transition-colors cursor-pointer ${
                    activeVisualTab === 'audit'
                      ? 'bg-[#D1B77D] text-[#111820] font-semibold'
                      : 'text-[#F0EEE5]/60 hover:text-[#F0EEE5] border border-[#F0EEE5]/15'
                  }`}
                >
                  ZOD AUDIT
                </button>
              </div>
            </div>

            {/* TAB 1: NASA CLIMATE SPIRAL (SVS #4976) */}
            {activeVisualTab === 'spiral' && (
              <Panel className="p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden bg-[#0C1017] border-[#F0EEE5]/10">
                <div className="w-full flex items-center justify-between mb-4 border-b border-[#F0EEE5]/10 pb-3 text-xs font-mono text-[#F0EEE5]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E16D54] animate-ping" />
                    <span className="text-[#F0EEE5] font-semibold">
                      NASA SVS #4976 // GISTEMP POLAR ANOMALY SPIRAL
                    </span>
                  </div>
                  <span className="text-[#D1B77D]">1880 — 2026 PROGRESSION</span>
                </div>

                <div className="relative w-full aspect-square max-w-[440px] flex items-center justify-center">
                  <svg
                    ref={spiralSvgRef}
                    viewBox="0 0 460 460"
                    className="w-full h-full overflow-visible select-none"
                  >
                    {/* Month Radial Axes */}
                    {spiralParams.monthAxes.map((axis) => (
                      <g key={axis.name}>
                        <line
                          x1={axis.x1}
                          y1={axis.y1}
                          x2={axis.x2}
                          y2={axis.y2}
                          stroke="rgba(240, 238, 229, 0.08)"
                          strokeDasharray="2,3"
                        />
                        <text
                          x={axis.lx}
                          y={axis.ly}
                          fill="rgba(240, 238, 229, 0.5)"
                          fontSize="9"
                          fontFamily="IBM Plex Mono, monospace"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {axis.name}
                        </text>
                      </g>
                    ))}

                    {/* Concentric Limit Rings */}
                    <circle
                      cx={spiralParams.center}
                      cy={spiralParams.center}
                      r={spiralParams.ring0}
                      fill="none"
                      stroke="rgba(240, 238, 229, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={spiralParams.center + 6}
                      y={spiralParams.center - spiralParams.ring0 - 4}
                      fill="rgba(240, 238, 229, 0.6)"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      0.0°C (1951-1980 mean)
                    </text>

                    <circle
                      cx={spiralParams.center}
                      cy={spiralParams.center}
                      r={spiralParams.ring1}
                      fill="none"
                      stroke="#D1B77D"
                      strokeWidth="1"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={spiralParams.center + 6}
                      y={spiralParams.center - spiralParams.ring1 - 4}
                      fill="#D1B77D"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      +1.0°C Warning Ring
                    </text>

                    <circle
                      cx={spiralParams.center}
                      cy={spiralParams.center}
                      r={spiralParams.ring15}
                      fill="none"
                      stroke="#E16D54"
                      strokeWidth="1.25"
                      strokeOpacity="0.75"
                      strokeDasharray="3,3"
                    />
                    <text
                      x={spiralParams.center + 6}
                      y={spiralParams.center - spiralParams.ring15 - 4}
                      fill="#E16D54"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      +1.5°C Paris Accord Target
                    </text>

                    {/* Dynamic Polar Spiral Line */}
                    {spiralParams.spiralD && (
                      <path
                        d={spiralParams.spiralD}
                        fill="none"
                        stroke="#D1B77D"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Current Scrubber Head */}
                    {spiralParams.currentTip && (
                      <g>
                        <circle
                          cx={spiralParams.currentTip.x}
                          cy={spiralParams.currentTip.y}
                          r="6"
                          fill="#E16D54"
                          className="animate-ping"
                          opacity="0.6"
                        />
                        <circle
                          cx={spiralParams.currentTip.x}
                          cy={spiralParams.currentTip.y}
                          r="4"
                          fill="#F0EEE5"
                          stroke="#E16D54"
                          strokeWidth="2"
                        />
                      </g>
                    )}
                  </svg>
                </div>

                <div className="w-full flex items-center justify-between pt-4 border-t border-[#F0EEE5]/10 text-xs font-mono text-[#F0EEE5]/60 mt-3">
                  <span>Polar Radius = Anomaly Magnitude</span>
                  <span className="text-[#D1B77D]">12 Spokes = Annual Respiration</span>
                </div>
              </Panel>
            )}

            {/* TAB 2: TIME-SERIES CURVE */}
            {activeVisualTab === 'multitrack' && (
              <Panel className="p-6 sm:p-8 flex flex-col justify-between bg-[#0C1017] border-[#F0EEE5]/10 min-h-[440px]">
                <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3 text-xs font-mono">
                  <span className="text-[#F0EEE5] font-semibold">
                    {activeDataset?.metadata.title || 'EIC Multi-Decadal Time-Series'}
                  </span>
                  <span className="text-[#D1B77D]">{observations.length} Calibrated Points</span>
                </div>

                <div className="relative w-full h-64 my-auto flex items-center justify-center">
                  <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                    {/* Horizontal baseline */}
                    <line
                      x1="40"
                      y1="160"
                      x2="580"
                      y2="160"
                      stroke="rgba(240, 238, 229, 0.2)"
                      strokeDasharray="4,4"
                    />
                    <text
                      x="40"
                      y="152"
                      fill="rgba(240, 238, 229, 0.5)"
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
                  </svg>
                </div>

                <div className="pt-3 border-t border-[#F0EEE5]/10 text-xs font-mono text-[#F0EEE5]/60 flex items-center justify-between">
                  <span>Sensor: {activeDataset?.metadata.instrumentPlatform}</span>
                  <span className="text-[#D1B77D]">{activeDataset?.metadata.primaryUnit}</span>
                </div>
              </Panel>
            )}

            {/* TAB 3: ZOD DATA AUDIT TABLE */}
            {activeVisualTab === 'audit' && (
              <Panel className="p-6 bg-[#0C1017] border-[#F0EEE5]/10 max-h-[440px] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[#F0EEE5] font-semibold">
                      ZOD AUDIT: {validationReport?.totalRecordsProcessed || 105} OBSERVATIONS
                    </span>
                  </div>
                  <Badge variant="emerald">0 FABRICATION</Badge>
                </div>

                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[#D1B77D] border-b border-[#F0EEE5]/10">
                    <tr>
                      <th className="py-1.5">YEAR</th>
                      <th className="py-1.5">MEASUREMENT</th>
                      <th className="py-1.5">UNIT</th>
                      <th className="py-1.5">BASELINE</th>
                      <th className="py-1.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EEE5]/05 text-[#F0EEE5]/80">
                    {observations.slice(0, 12).map((obs) => (
                      <tr key={obs.id}>
                        <td className="py-1.5">{obs.year}</td>
                        <td className="py-1.5 font-bold text-[#F0EEE5]">{obs.originalValue ?? '—'}</td>
                        <td className="py-1.5 text-[#D1B77D]">{obs.unit}</td>
                        <td className="py-1.5 text-[11px] truncate max-w-[120px]">{obs.baseline}</td>
                        <td className="py-1.5 text-[#10B981]">{obs.qualityFlag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}

            {/* LIVE SOUND VISUALIZATION: 48-BAND FFT + REAL-TIME OSCILLOSCOPE */}
            <Panel className="p-5 sm:p-6 bg-[#0C1017] border-[#F0EEE5]/10 space-y-3">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      transportState === 'PLAYING' ? 'bg-[#E16D54] animate-pulse' : 'bg-[#F0EEE5]/30'
                    }`}
                  />
                  <span className="text-[#F0EEE5] font-semibold uppercase tracking-wider">
                    WEB AUDIO ENGINE // 48-BAND FFT & OSCILLOSCOPE
                  </span>
                </div>
                <span className="text-[#D1B77D]">
                  {transportState === 'PLAYING'
                    ? `${activeParams?.tempoBpm || 60} BPM • 60 FPS`
                    : 'AWAITING SYNTHESIS'}
                </span>
              </div>

              {/* Canvas element */}
              <div className="w-full h-36 bg-[#06080C] border border-[#F0EEE5]/10 rounded-sm relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={144}
                  className="w-full h-full block"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#F0EEE5]/50 pt-1">
                <span>FFT: 20 Hz — 20 kHz Logarithmic Filterbank</span>
                <span className="text-[#D1B77D]">Waveform: Dynamic Polyphonic Bus</span>
              </div>
            </Panel>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN (5 COLS): MEASUREMENT, EXPLANATION, TIMELINE CONTROLS*/}
          {/* ================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* CURRENT SCIENTIFIC MEASUREMENT CARD */}
            <Panel className="p-6 sm:p-7 bg-[#0C1017] border-[#F0EEE5]/10 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#D1B77D]" />
                  CURRENT SCIENTIFIC MEASUREMENT
                </span>
                <Badge variant="sand">{activeObs?.year || 2026}</Badge>
              </div>

              <div>
                <span className="font-mono text-xs text-[#F0EEE5]/60 block mb-1">
                  {currentTrack.name}
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-4xl sm:text-5xl font-normal text-[#F0EEE5]">
                    {activeObs?.originalValue !== null && activeObs?.originalValue !== undefined
                      ? activeObs.originalValue
                      : '—'}
                  </span>
                  <span className="font-mono text-sm text-[#D1B77D]">{currentTrack.unit}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EEE5]/10 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Baseline Reference:</span>
                  <span className="text-[#F0EEE5] font-medium truncate max-w-[180px]">
                    {activeDataset?.metadata.baselineDefinition || 'Pre-industrial equilibrium'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Observation Status:</span>
                  <span className="text-[#10B981] font-semibold">
                    {activeObs?.qualityFlag || 'VALID'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Lead Agency:</span>
                  <span className="text-[#D1B77D] truncate max-w-[200px]">{currentTrack.agency}</span>
                </div>
              </div>
            </Panel>

            {/* SOUND-TO-DATA EXPLANATION CARD */}
            <Panel className="p-6 sm:p-7 bg-[#0C1017] border-[#F0EEE5]/10 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Disc className="w-3.5 h-3.5 text-[#D1B77D]" />
                  SOUND-TO-DATA EXPLANATION
                </span>
                <Badge variant="signal">DETERMINISTIC</Badge>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Musical Pitch:</span>
                  <span className="text-[#F0EEE5] font-semibold">
                    {activeParams?.noteName || 'D3'} ({activeParams?.frequencyHz.toFixed(1) || '146.8'} Hz)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Harmonic Consonance:</span>
                  <span className="text-[#D1B77D]">
                    {activeParams && activeParams.frequencyHz > 300
                      ? 'Dissonant Minor 2nd'
                      : 'Consonant Perfect 5th'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Rhythm Cadence:</span>
                  <span className="text-[#E16D54] font-semibold">
                    {activeParams?.tempoBpm || 48} BPM ({activeParams?.stepIntervalMs || 1250} ms)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#F0EEE5]/50">Filter Cutoff:</span>
                  <span className="text-[#F0EEE5]">
                    {activeParams?.filterCutoffHz || 450} Hz
                  </span>
                </div>

                <div className="pt-2 border-t border-[#F0EEE5]/10">
                  <span className="text-[#F0EEE5]/50 block text-[10px] uppercase mb-1">
                    TRANSFER FORMULA:
                  </span>
                  <span className="text-[#D1B77D] bg-[#111820] px-2.5 py-1 rounded block text-[11px]">
                    {currentTrack.mathFormula}
                  </span>
                </div>
              </div>
            </Panel>

            {/* PLAYBACK TIMELINE SCRUBBER & TRANSPORT CONTROLS */}
            <Panel className="p-6 sm:p-7 bg-[#0C1017] border-[#F0EEE5]/10 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0EEE5]/10 pb-3">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-widest font-semibold flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#D1B77D]" />
                  PLAYBACK TIMELINE (1880 — 2026)
                </span>
                <span className="font-mono text-xs text-[#F0EEE5]">
                  {activeObs?.year || 1880}
                </span>
              </div>

              {/* Scrubber slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, observations.length - 1)}
                  value={selectedObservationIndex || 0}
                  onChange={(e) => handleScrub(parseInt(e.target.value, 10))}
                  aria-label="Seek timeline observation"
                  className="w-full h-2 bg-[#111820] rounded-lg appearance-none cursor-pointer accent-[#D1B77D]"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-[#F0EEE5]/50">
                  <span>1880 Baseline</span>
                  <span>1958 Keeling</span>
                  <span>1993 Ocean</span>
                  <span>2026 Modern</span>
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
                    className="px-2 py-0.5 text-[10px] font-mono border border-[#F0EEE5]/10 hover:border-[#D1B77D] text-[#F0EEE5]/60 hover:text-[#D1B77D] rounded-full transition-colors cursor-pointer"
                  >
                    {m.year}
                  </button>
                ))}
              </div>

              {/* Master Transport Action Buttons */}
              <div className="pt-3 border-t border-[#F0EEE5]/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTogglePlay}
                    icon={
                      transportState === 'PLAYING' ? (
                        <Pause className="w-4 h-4 text-[#111820]" />
                      ) : (
                        <Play className="w-4 h-4 text-[#111820]" />
                      )
                    }
                  >
                    {transportState === 'PLAYING' ? 'PAUSE' : 'PLAY'}
                  </Button>

                  <button
                    onClick={handleRestart}
                    className="p-2 border border-[#F0EEE5]/15 hover:border-[#D1B77D] text-[#F0EEE5]/70 hover:text-[#F0EEE5] rounded-full transition-colors cursor-pointer"
                    title="Reset to 1880 origin"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSpeedCycle}
                    className="px-2.5 py-1 text-xs font-mono border border-[#F0EEE5]/15 hover:border-[#D1B77D] text-[#D1B77D] rounded-full transition-colors cursor-pointer"
                    title="Cycle Playback Speed"
                  >
                    {speedMultiplier}x
                  </button>

                  <button
                    onClick={handleToggleLoop}
                    className={`p-2 border rounded-full transition-colors cursor-pointer ${
                      isLooping
                        ? 'border-[#D1B77D] text-[#D1B77D] bg-[#D1B77D]/10'
                        : 'border-[#F0EEE5]/15 text-[#F0EEE5]/60 hover:text-[#F0EEE5]'
                    }`}
                    title="Toggle Loop"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume & Mute */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={toggleMute}
                    className="text-[#F0EEE5]/70 hover:text-[#F0EEE5] transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-[#E16D54]" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-[#D1B77D]" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    aria-label="Master Sonification Volume"
                    className="w-16 h-1 bg-[#111820] rounded-lg appearance-none cursor-pointer accent-[#D1B77D]"
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
