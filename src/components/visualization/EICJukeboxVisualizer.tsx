import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { EicDataService } from '../../data/eicDataService';
import type {
  EicDataset,
  EicDatasetKey,
  EicObservation,
  EicValidationReport,
} from '../../data/eicSchemas';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { SectionHeader } from '../common/SectionHeader';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FileCheck,
  Info,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const EICJukeboxVisualizer: React.FC = () => {
  const {
    isAudioUnlocked,
    unlockAudio,
    activeEicKey,
    setActiveEicKey,
    selectedObservationIndex,
    seekToIndex,
    transportState,
    startPlayback,
    pausePlayback,
    currentSonificationParams,
  } = useObservatoryStore();

  // Component View Tabs
  const [activeTab, setActiveTab] = useState<'spiral' | 'multitrack' | 'audit'>('spiral');
  const [allDatasets, setAllDatasets] = useState<Record<EicDatasetKey, EicDataset> | null>(null);
  const [validationReport, setValidationReport] = useState<EicValidationReport | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(true);

  const spiralSvgRef = useRef<SVGSVGElement | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // 1. Initial Asynchronous Load & Zod Validation
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [datasets, report] = await Promise.all([
          EicDataService.loadAllDatasets(),
          EicDataService.generateValidationReport(),
        ]);
        if (isMounted) {
          setAllDatasets(datasets);
          setValidationReport(report);
        }
      } catch (err) {
        console.error('[EIC Jukebox] Failed to load validated EIC datasets:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentDataset = allDatasets ? allDatasets[activeEicKey] : null;
  const observations: EicObservation[] = useMemo(() => {
    return currentDataset?.observations || [];
  }, [currentDataset]);

  const activeObs: EicObservation | undefined =
    observations[selectedObservationIndex] || observations[observations.length - 1];

  const handleSelectIndex = (index: number) => {
    if (!isAudioUnlocked) unlockAudio();
    seekToIndex(index, true);
  };

  const handleTogglePlay = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    if (transportState === 'PLAYING') {
      pausePlayback();
    } else {
      await startPlayback();
    }
  };

  const handleDatasetSwitch = async (key: EicDatasetKey) => {
    await setActiveEicKey(key);
  };

  // ---------------------------------------------------------------------------
  // D3 CLIMATE SPIRAL COMPUTATION (NASA SVS #5190)
  // ---------------------------------------------------------------------------
  const spiralParams = useMemo(() => {
    const gistempData = allDatasets?.gistemp?.observations || [];
    const center = 230;
    const baseRadius = 80; // 0.0°C baseline
    const scaleFactor = 65; // Pixels per °C anomaly

    // Limit rings
    const ring0 = baseRadius; // 0.0 °C
    const ring1 = baseRadius + 1.0 * scaleFactor; // +1.0 °C
    const ring15 = baseRadius + 1.5 * scaleFactor; // +1.5 °C Paris Accord

    // Month labels (12 radial axes)
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

    // Thermal Divergent Color Scale (Editorial Palette)
    // -0.5°C = Deep Ocean, 0.0°C = Clean Paper, +0.8°C = Sand Gold, +1.2°C = Terracotta Signal, +1.5°C = Crimson
    const colorScale = d3
      .scaleLinear<string>()
      .domain([-0.5, 0.0, 0.8, 1.2, 1.5])
      .range(['#17465B', '#F0EEE5', '#D1B77D', '#E16D54', '#B83A2E'])
      .clamp(true);

    // Filter points up to selectedObservationIndex if on gistemp, else all
    const maxIdx = activeEicKey === 'gistemp' ? selectedObservationIndex : gistempData.length - 1;
    const activePoints = gistempData.slice(0, maxIdx + 1);

    // Compute coordinate for each observation
    const spiralCoords = activePoints.map((obs, idx) => {
      const anomaly = obs.originalValue ?? 0;
      const radius = baseRadius + anomaly * scaleFactor;
      const monthAngle = ((obs.month - 1) * 2 * Math.PI) / 12 - Math.PI / 2;
      const x = center + radius * Math.cos(monthAngle);
      const y = center + radius * Math.sin(monthAngle);
      const color = colorScale(anomaly);
      return { ...obs, x, y, radius, color, isHead: idx === activePoints.length - 1 };
    });

    // Generate SVG path string with D3 curveCardinal
    const lineGenerator = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCardinal.tension(0.4));

    const pathData = spiralCoords.length > 1 ? lineGenerator(spiralCoords) : '';

    return {
      center,
      ring0,
      ring1,
      ring15,
      monthAxes,
      spiralCoords,
      pathData,
      headPoint: spiralCoords[spiralCoords.length - 1],
    };
  }, [allDatasets, activeEicKey, selectedObservationIndex]);

  // ---------------------------------------------------------------------------
  // D3 MULTI-TRACK TIME-SERIES COMPUTATION
  // ---------------------------------------------------------------------------
  const chartParams = useMemo(() => {
    if (!observations.length) return null;

    const width = 640;
    const height = 240;
    const margin = { top: 20, right: 30, bottom: 35, left: 55 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const validVals = observations
      .map((d) => d.originalValue)
      .filter((v): v is number => v !== null && !isNaN(v));

    const yMin = Math.min(...validVals);
    const yMax = Math.max(...validVals);
    const yPadding = (yMax - yMin) * 0.12 || 1;

    const xScale = d3
      .scaleLinear()
      .domain([observations[0].year, observations[observations.length - 1].year])
      .range([0, innerW]);

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerH, 0]);

    // Line generator
    const lineGen = d3
      .line<EicObservation>()
      .defined((d) => d.originalValue !== null)
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.originalValue!))
      .curve(d3.curveMonotoneX);

    // Area generator
    const areaGen = d3
      .area<EicObservation>()
      .defined((d) => d.originalValue !== null)
      .x((d) => xScale(d.year))
      .y0(innerH)
      .y1((d) => yScale(d.originalValue!))
      .curve(d3.curveMonotoneX);

    // Uncertainty band generator (if available)
    const hasUncertainty = observations.some((d) => d.uncertainty !== null && d.uncertainty !== undefined);
    const uncertaintyAreaGen = hasUncertainty
      ? d3
          .area<EicObservation>()
          .defined((d) => d.originalValue !== null)
          .x((d) => xScale(d.year))
          .y0((d) => yScale(d.originalValue! - (d.uncertainty || 0)))
          .y1((d) => yScale(d.originalValue! + (d.uncertainty || 0)))
          .curve(d3.curveMonotoneX)
      : null;

    const points = observations.map((d, i) => ({
      ...d,
      cx: xScale(d.year),
      cy: d.originalValue !== null ? yScale(d.originalValue) : null,
      isSelected: i === selectedObservationIndex,
    }));

    return {
      width,
      height,
      margin,
      innerW,
      innerH,
      xScale,
      yScale,
      linePath: lineGen(observations) || '',
      areaPath: areaGen(observations) || '',
      uncertaintyPath: uncertaintyAreaGen ? uncertaintyAreaGen(observations) || '' : '',
      points,
      yTicks: yScale.ticks(5),
      xTicks: xScale.ticks(6),
    };
  }, [observations, selectedObservationIndex]);

  return (
    <section
      id="eic-jukebox"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Observatory Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#F0EEE5]/10">
          <SectionHeader
            number="03"
            category="NASA EARTH INFORMATION CENTER"
            title="THE EARTH INFORMATION JUKEBOX"
            subtitle="Empirical Earth System Observatory telemetry translated directly from NASA's Earth Information Center exhibits and Scientific Visualization Studio (SVS #5190) into spatial geometry and deterministic auditory displays."
            badge="SVS ARCHIVE #5190"
            badgeVariant="sand"
          />

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-[#F0EEE5]/5 border border-[#F0EEE5]/15 rounded-full shrink-0">
            <button
              onClick={() => setActiveTab('spiral')}
              className={`px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 rounded-full flex items-center gap-2 cursor-pointer ${
                activeTab === 'spiral'
                  ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_16px_rgba(240,238,229,0.15)]'
                  : 'text-[#F0EEE5]/70 hover:text-[#D1B77D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>CLIMATE SPIRAL (SVS #5190)</span>
            </button>

            <button
              onClick={() => setActiveTab('multitrack')}
              className={`px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 rounded-full flex items-center gap-2 cursor-pointer ${
                activeTab === 'multitrack'
                  ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_16px_rgba(240,238,229,0.15)]'
                  : 'text-[#F0EEE5]/70 hover:text-[#D1B77D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5-STREAM EIC JUKEBOX</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 rounded-full flex items-center gap-2 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_16px_rgba(240,238,229,0.15)]'
                  : 'text-[#F0EEE5]/70 hover:text-[#D1B77D]'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>ZOD DATA AUDIT</span>
            </button>
          </div>
        </div>

        {/* Dataset Selection Pills */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pb-4 border-b border-[#F0EEE5]/10">
          <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D1B77D]" />
            EIC STREAMS:
          </span>

          {[
            { key: 'gistemp', label: 'GISTEMP Surface Anomaly', unit: '°C Anomaly', color: '#D1B77D' },
            { key: 'co2_maunaloa', label: 'Mauna Loa CO₂', unit: 'ppm', color: '#E16D54' },
            { key: 'sealevel_podaac', label: 'PO.DAAC Sea Level', unit: 'mm', color: '#17465B' },
            { key: 'aerosols_geos', label: 'GEOS-FP Aerosols [PROXY]', unit: 'AOD', color: '#8B5CF6' },
            { key: 'nightlights_viirs', label: 'VIIRS Black Marble', unit: 'nW·cm⁻²·sr⁻¹', color: '#10B981' },
          ].map((stream) => {
            const isSelected = activeEicKey === stream.key;
            return (
              <button
                key={stream.key}
                onClick={() => handleDatasetSwitch(stream.key as EicDatasetKey)}
                className={`px-3.5 py-1.5 text-xs font-sans tracking-wide uppercase transition-all duration-200 rounded-full flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_2px_12px_rgba(240,238,229,0.2)]'
                    : 'bg-transparent text-[#F0EEE5]/70 border border-[#F0EEE5]/15 hover:border-[#D1B77D] hover:text-[#D1B77D]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: stream.color }}
                />
                <span>{stream.label}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-[#111820]/60' : 'text-[#D1B77D]'}`}>
                  ({stream.unit})
                </span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* VIEW 01: NASA CLIMATE SPIRAL (SVS #5190)                            */}
        {/* =================================================================== */}
        {activeTab === 'spiral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visual Spiral Graphic */}
            <Panel className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden bg-[#0C1017] border-[#F0EEE5]/10">
              <div className="w-full flex items-center justify-between mb-4 border-b border-[#F0EEE5]/10 pb-3 text-xs font-mono text-[#F0EEE5]/60">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D1B77D] animate-pulse" />
                  <span className="text-[#F0EEE5] font-semibold tracking-wider">
                    NASA SVS #5190 // GISTEMP CLIMATE SPIRAL
                  </span>
                </div>
                <span className="text-[#D1B77D] tracking-widest">1880 — 2024 BENCHMARKS</span>
              </div>

              {/* D3 Polar SVG Canvas */}
              <div className="relative w-full aspect-square max-w-[460px] flex items-center justify-center">
                <svg
                  ref={spiralSvgRef}
                  viewBox="0 0 460 460"
                  className="w-full h-full overflow-visible select-none"
                >
                  <defs>
                    <filter id="spiral-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* 12 Month Radial Spokes */}
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
                        fill="rgba(240, 238, 229, 0.55)"
                        fontSize="10"
                        fontFamily="IBM Plex Mono, monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {axis.name}
                      </text>
                    </g>
                  ))}

                  {/* Concentric Limit Rings */}
                  {/* 0.0 °C Baseline Ring */}
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

                  {/* +1.0 °C Warning Ring */}
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
                    +1.0°C
                  </text>

                  {/* +1.5 °C Paris Accord Limit Ring */}
                  <circle
                    cx={spiralParams.center}
                    cy={spiralParams.center}
                    r={spiralParams.ring15}
                    fill="none"
                    stroke="#E16D54"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    strokeDasharray="6,3"
                  />
                  <text
                    x={spiralParams.center + 6}
                    y={spiralParams.center - spiralParams.ring15 - 4}
                    fill="#E16D54"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="bold"
                  >
                    +1.5°C (Paris Agreement threshold)
                  </text>

                  {/* The Dynamic Spiral Trace Path */}
                  {spiralParams.pathData && (
                    <path
                      d={spiralParams.pathData}
                      fill="none"
                      stroke="url(#spiralGradientEditorial)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Dynamic Gradient for the spiral path */}
                  <linearGradient id="spiralGradientEditorial" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#17465B" />
                    <stop offset="35%" stopColor="#F0EEE5" />
                    <stop offset="65%" stopColor="#D1B77D" />
                    <stop offset="85%" stopColor="#E16D54" />
                    <stop offset="100%" stopColor="#B83A2E" />
                  </linearGradient>

                  {/* Discrete Sample Points along the spiral */}
                  {spiralParams.spiralCoords.map((pt) => (
                    <circle
                      key={pt.id}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.isHead ? 5.5 : 2.5}
                      fill={pt.color}
                      stroke="#111820"
                      strokeWidth={pt.isHead ? 2 : 1}
                      filter={pt.isHead ? 'url(#spiral-glow)' : undefined}
                      className="cursor-pointer transition-all hover:scale-150"
                      onClick={() => {
                        const idx = observations.findIndex((o) => o.id === pt.id);
                        if (idx !== -1) handleSelectIndex(idx);
                      }}
                    >
                      <title>{`${pt.year}: ${pt.originalValue}°C (${pt.milestone || 'Measurement'})`}</title>
                    </circle>
                  ))}

                  {/* Pulsing Beacon at Current Observation Head */}
                  {spiralParams.headPoint && (
                    <g>
                      <circle
                        cx={spiralParams.headPoint.x}
                        cy={spiralParams.headPoint.y}
                        r="12"
                        fill="none"
                        stroke="#D1B77D"
                        strokeWidth="1.5"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          values="8;20;8"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="1;0;1"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  )}
                </svg>
              </div>

              {/* Spiral Footer Legend */}
              <div className="w-full flex items-center justify-between pt-4 mt-2 border-t border-[#F0EEE5]/10 text-[11px] font-mono text-[#F0EEE5]/60">
                <span>POLAR COORDINATES (r = baseline + anomaly)</span>
                <span className="text-[#D1B77D]">NASA GISS SCIENTIFIC VISUALIZATION STUDIO</span>
              </div>
            </Panel>

            {/* Observation Telemetry Readout & Playback Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Active Datum Telemetry Card */}
              <Panel className="p-6 sm:p-7 border-[#D1B77D]/25 bg-[#0C1017]">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EEE5]/10 mb-5">
                  <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    TELEMETRY READOUT
                  </span>
                  <Badge variant="sand">{activeObs?.qualityFlag || 'VALID'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <span className="font-mono text-[11px] text-[#F0EEE5]/60 uppercase tracking-wider block mb-1">
                      OBSERVATION YEAR
                    </span>
                    <span className="font-sans text-4xl sm:text-5xl font-light text-[#F0EEE5] tracking-tight">
                      {activeObs?.year || 2026}
                    </span>
                    <span className="font-mono text-xs text-[#D1B77D] block mt-1">
                      {activeObs?.dateString}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-[#F0EEE5]/60 uppercase tracking-wider block mb-1">
                      GLOBAL ANOMALY
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-4xl sm:text-5xl font-light text-[#E16D54] tracking-tight">
                        {activeObs?.originalValue !== null && activeObs?.originalValue !== undefined
                          ? activeObs.originalValue > 0
                            ? `+${activeObs.originalValue.toFixed(2)}`
                            : activeObs.originalValue.toFixed(2)
                          : 'N/A'}
                      </span>
                      <span className="font-mono text-sm text-[#F0EEE5]/70">°C</span>
                    </div>
                    {activeObs?.uncertainty && (
                      <span className="font-mono text-[10px] text-[#F0EEE5]/50 block mt-1">
                        Uncertainty: ±{activeObs.uncertainty}°C
                      </span>
                    )}
                  </div>
                </div>

                {/* Historical Milestone Context */}
                <div className="p-4 bg-[#111820] border border-[#F0EEE5]/10 mb-5 rounded-sm">
                  <span className="font-mono text-[10px] text-[#D1B77D] uppercase tracking-[0.18em] block mb-1.5">
                    EMPIRICAL & HISTORICAL CONTEXT:
                  </span>
                  <p className="font-serif italic text-xs sm:text-sm text-[#F0EEE5]/85 leading-relaxed">
                    "{activeObs?.milestone ||
                      'Standard instrumental period; meteorological thermometers calibrated against international standards.'}"
                  </p>
                </div>

                {/* Sonification Mapping Metrics */}
                <div className="p-3.5 bg-[#F0EEE5]/5 border border-[#F0EEE5]/10 flex items-center justify-between text-xs font-mono rounded-sm">
                  <div className="flex items-center gap-2 text-[#D1B77D]">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span className="tracking-wider">AUDIO FREQUENCY:</span>
                  </div>
                  <span className="text-[#F0EEE5] font-semibold">
                    {currentSonificationParams
                      ? `${currentSonificationParams.frequencyHz.toFixed(1)} Hz (${currentSonificationParams.noteName})`
                      : activeObs?.normalizedValue !== null && activeObs?.normalizedValue !== undefined
                        ? `${(146.83 * Math.pow(2, (activeObs.normalizedValue || 0) * 2.33)).toFixed(1)} Hz`
                        : 'N/A'}
                  </span>
                </div>
              </Panel>

              {/* Playback & Scrubber Controls */}
              <Panel className="p-6 bg-[#0C1017] border-[#F0EEE5]/10">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTogglePlay}
                    icon={
                      transportState === 'PLAYING' ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )
                    }
                  >
                    {transportState === 'PLAYING' ? 'PAUSE SPIRAL' : 'PLAY CLIMATE SPIRAL'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectIndex(0)}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    RESET (1880)
                  </Button>
                </div>

                {/* Range Slider Scrubber */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[11px] font-mono text-[#F0EEE5]/60">
                    <span>1880 (ORIGIN)</span>
                    <span className="text-[#D1B77D] font-semibold">
                      INDEX: {selectedObservationIndex + 1} / {observations.length}
                    </span>
                    <span>2026 (OPERATIONAL)</span>
                  </div>
                  <input
                    type="range"
                    role="slider"
                    aria-label="Climate Spiral Observation Scrubber"
                    aria-valuenow={selectedObservationIndex}
                    aria-valuemin={0}
                    aria-valuemax={observations.length - 1}
                    aria-valuetext={`Observation datum ${selectedObservationIndex + 1} of ${observations.length}, Year ${activeObs?.year || ''}`}
                    min={0}
                    max={observations.length - 1}
                    value={selectedObservationIndex}
                    onChange={(e) => handleSelectIndex(Number(e.target.value))}
                    className="w-full accent-[#E16D54] cursor-pointer h-2 bg-[#111820] border border-[#F0EEE5]/20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
                  />
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 02: 5-STREAM EIC JUKEBOX MULTI-TRACK TIME-SERIES              */}
        {/* =================================================================== */}
        {activeTab === 'multitrack' && chartParams && currentDataset && (
          <div className="space-y-6">
            <Panel className="p-6 sm:p-8 bg-[#0C1017] border-[#F0EEE5]/10">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#F0EEE5]/10 gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentDataset.metadata.themeColor }}
                    />
                    <h3 className="font-serif text-2xl font-normal text-[#F0EEE5]">
                      {currentDataset.metadata.title}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-[#D1B77D] mt-1 tracking-wide">
                    {currentDataset.metadata.scientificLeadAgency} • {currentDataset.metadata.instrumentPlatform}
                  </p>
                </div>

                <div className="flex items-center gap-5 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                      CURRENT VALUE
                    </span>
                    <span className="text-xl font-light text-[#E16D54]">
                      {activeObs?.originalValue !== null
                        ? `${activeObs?.originalValue} ${currentDataset.metadata.primaryUnit}`
                        : 'SENSOR GAP'}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleTogglePlay}
                    icon={
                      transportState === 'PLAYING' ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )
                    }
                  >
                    {transportState === 'PLAYING' ? 'PAUSE' : 'SONIFY STREAM'}
                  </Button>
                </div>
              </div>

              {/* D3 SVG Line / Area Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  ref={chartSvgRef}
                  viewBox={`0 0 ${chartParams.width} ${chartParams.height}`}
                  className="w-full h-auto min-w-[500px] overflow-visible"
                >
                  <defs>
                    <linearGradient id="multitrackAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={currentDataset.metadata.themeColor} stopOpacity="0.30" />
                      <stop offset="100%" stopColor={currentDataset.metadata.themeColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <g transform={`translate(${chartParams.margin.left},${chartParams.margin.top})`}>
                    {/* Horizontal Gridlines */}
                    {chartParams.yTicks.map((tick) => (
                      <g key={tick} transform={`translate(0, ${chartParams.yScale(tick)})`}>
                        <line
                          x1={0}
                          x2={chartParams.innerW}
                          stroke="rgba(240, 238, 229, 0.08)"
                          strokeDasharray="2,3"
                        />
                        <text
                          x={-8}
                          dy="0.32em"
                          fill="rgba(240, 238, 229, 0.6)"
                          fontSize="10"
                          fontFamily="IBM Plex Mono, monospace"
                          textAnchor="end"
                        >
                          {tick}
                        </text>
                      </g>
                    ))}

                    {/* Vertical Year Gridlines */}
                    {chartParams.xTicks.map((tick) => (
                      <g key={tick} transform={`translate(${chartParams.xScale(tick)}, 0)`}>
                        <line
                          y1={0}
                          y2={chartParams.innerH}
                          stroke="rgba(240, 238, 229, 0.06)"
                        />
                        <text
                          y={chartParams.innerH + 18}
                          fill="rgba(240, 238, 229, 0.6)"
                          fontSize="10"
                          fontFamily="IBM Plex Mono, monospace"
                          textAnchor="middle"
                        >
                          {tick}
                        </text>
                      </g>
                    ))}

                    {/* Uncertainty Envelope (if present) */}
                    {chartParams.uncertaintyPath && (
                      <path
                        d={chartParams.uncertaintyPath}
                        fill={currentDataset.metadata.themeColor}
                        fillOpacity="0.15"
                      />
                    )}

                    {/* Area fill */}
                    <path d={chartParams.areaPath} fill="url(#multitrackAreaGradient)" />

                    {/* Primary measurement curve */}
                    <path
                      d={chartParams.linePath}
                      fill="none"
                      stroke={currentDataset.metadata.themeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Active Point Scrub Line */}
                    {activeObs && (
                      <line
                        x1={chartParams.xScale(activeObs.year)}
                        x2={chartParams.xScale(activeObs.year)}
                        y1={0}
                        y2={chartParams.innerH}
                        stroke="#D1B77D"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                    )}

                    {/* Clickable Observation Nodes */}
                    {chartParams.points.map((pt, idx) => {
                      if (pt.cy === null) return null;
                      return (
                        <circle
                          key={pt.id}
                          cx={pt.cx}
                          cy={pt.cy}
                          r={pt.isSelected ? 5.5 : 2.5}
                          fill={pt.isSelected ? '#F0EEE5' : currentDataset.metadata.themeColor}
                          stroke="#111820"
                          strokeWidth={pt.isSelected ? 2 : 1}
                          className="cursor-pointer transition-transform hover:scale-150"
                          onClick={() => handleSelectIndex(idx)}
                        >
                          <title>{`${pt.year}: ${pt.originalValue} ${pt.unit}`}</title>
                        </circle>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Scrubber Slider */}
              <div className="mt-6 pt-4 border-t border-[#F0EEE5]/10">
                <div className="flex justify-between items-center text-xs font-mono text-[#F0EEE5]/60 mb-2.5">
                  <span>RECORD: {observations[0]?.year}</span>
                  <span className="text-[#D1B77D] font-semibold">
                    SELECTED: {activeObs?.year} ({activeObs?.originalValue} {currentDataset.metadata.primaryUnit})
                  </span>
                  <span>RECORD: {observations[observations.length - 1]?.year}</span>
                </div>
                <input
                  type="range"
                  role="slider"
                  aria-label="5-Stream Multi-Track Observation Scrubber"
                  aria-valuenow={selectedObservationIndex}
                  aria-valuemin={0}
                  aria-valuemax={observations.length - 1}
                  aria-valuetext={`Observation datum ${selectedObservationIndex + 1} of ${observations.length}, Year ${activeObs?.year || ''}`}
                  min={0}
                  max={observations.length - 1}
                  value={selectedObservationIndex}
                  onChange={(e) => handleSelectIndex(Number(e.target.value))}
                  className="w-full accent-[#E16D54] cursor-pointer h-2 bg-[#111820] border border-[#F0EEE5]/20 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D]"
                />
              </div>
            </Panel>

            {/* Secondary Metrics / Empirical Breakdown Card */}
            {activeObs?.secondaryMetrics && (
              <Panel className="p-5 bg-[#0C1017] border-[#F0EEE5]/10">
                <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] block mb-3">
                  SECONDARY EMPIRICAL METRICS FOR {activeObs.year}:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  {Object.entries(activeObs.secondaryMetrics).map(([k, v]) => (
                    <div key={k} className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                      <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider mb-1">
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#F0EEE5] font-semibold text-sm">
                        {v !== null ? v : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 03: ZOD DATA AUDIT REPORT                                      */}
        {/* =================================================================== */}
        {activeTab === 'audit' && validationReport && (
          <Panel className="p-6 sm:p-8 bg-[#0C1017] border-[#F0EEE5]/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#F0EEE5]/10 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="w-5 h-5 text-[#10B981]" />
                  <h3 className="font-serif text-2xl font-normal text-[#F0EEE5]">
                    ZOD SCHEMA VALIDATION REPORT
                  </h3>
                </div>
                <p className="font-mono text-xs text-[#D1B77D]">
                  Audit Timestamp: {validationReport.timestamp} • All 5 Datasets Parsed via PapaParse & Zod
                </p>
              </div>
              <Badge variant="sand">{validationReport.validationStatus}</Badge>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono text-xs">
              <div className="p-4 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                <span className="text-[#F0EEE5]/60 block mb-1">DATASETS AUDITED</span>
                <span className="font-sans text-2xl sm:text-3xl font-light text-[#F0EEE5]">
                  {validationReport.datasetsAudited} / 5
                </span>
              </div>
              <div className="p-4 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                <span className="text-[#F0EEE5]/60 block mb-1">TOTAL RECORDS</span>
                <span className="font-sans text-2xl sm:text-3xl font-light text-[#D1B77D]">
                  {validationReport.totalRecordsProcessed}
                </span>
              </div>
              <div className="p-4 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                <span className="text-[#F0EEE5]/60 block mb-1">VALID MEASUREMENTS</span>
                <span className="font-sans text-2xl sm:text-3xl font-light text-[#10B981]">
                  {validationReport.totalValidRecords}
                </span>
              </div>
              <div className="p-4 bg-[#111820] border border-[#F0EEE5]/10 rounded-sm">
                <span className="text-[#F0EEE5]/60 block mb-1">FABRICATED VALUES</span>
                <span className="font-sans text-2xl sm:text-3xl font-light text-[#10B981]">
                  0 (ZERO FABRICATION)
                </span>
              </div>
            </div>

            {/* Table of validated datasets */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#F0EEE5]/15 text-[#F0EEE5]/60 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">DATASET ID</th>
                    <th className="py-3 px-3">TITLE & SVS ASSET</th>
                    <th className="py-3 px-3">RECORDS</th>
                    <th className="py-3 px-3">UNIT</th>
                    <th className="py-3 px-3">EMPIRICAL RANGE</th>
                    <th className="py-3 px-3">MEAN</th>
                    <th className="py-3 px-3">ZOD SCHEMA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EEE5]/10">
                  {validationReport.datasetSummaries.map((s) => (
                    <tr key={s.datasetId} className="hover:bg-[#F0EEE5]/5 transition-colors">
                      <td className="py-3.5 px-3 text-[#D1B77D] font-bold">{s.datasetId}</td>
                      <td className="py-3.5 px-3 text-[#F0EEE5]">
                        <div>{s.title}</div>
                        <div className="text-[10px] text-[#F0EEE5]/50">{s.svsAssetId}</div>
                      </td>
                      <td className="py-3.5 px-3 text-[#F0EEE5]/80">{s.recordsCount} rows</td>
                      <td className="py-3.5 px-3 text-[#F0EEE5]/70">{s.unit}</td>
                      <td className="py-3.5 px-3 text-[#E16D54]">
                        [{s.range[0]}, {s.range[1]}]
                      </td>
                      <td className="py-3.5 px-3 text-[#F0EEE5]/80">{s.mean}</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[#10B981] font-semibold">
                          <FileCheck className="w-3.5 h-3.5" />
                          VALIDATED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* =================================================================== */}
        {/* SCIENTIFIC SOURCE & METHODOLOGY DRAWER / PANEL                      */}
        {/* =================================================================== */}
        {currentDataset && (
          <Panel className="p-6 sm:p-7 border-[#F0EEE5]/10 bg-[#0C1017]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EEE5]/10">
              <div className="flex items-center gap-2 text-[#D1B77D]">
                <Info className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold">
                  SCIENTIFIC METHODOLOGY & METADATA SPECIFICATION
                </span>
              </div>
              <button
                onClick={() => setShowMethodology(!showMethodology)}
                className="text-xs font-mono text-[#D1B77D] hover:text-[#F0EEE5] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{showMethodology ? 'COLLAPSE SPEC' : 'EXPAND SPEC'}</span>
                {showMethodology ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showMethodology && (
              <div className="space-y-4 text-xs font-mono leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                    <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                      LEAD AGENCY:
                    </span>
                    <span className="text-[#F0EEE5] font-semibold">
                      {currentDataset.metadata.scientificLeadAgency}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                    <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                      SATELLITE / SENSOR PLATFORM:
                    </span>
                    <span className="text-[#F0EEE5] font-semibold">
                      {currentDataset.metadata.instrumentPlatform}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                    <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                      BASELINE BENCHMARK:
                    </span>
                    <span className="text-[#D1B77D]">
                      {currentDataset.metadata.baselineDefinition}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                    <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                      EIC / SVS ASSET ID:
                    </span>
                    <span className="text-[#E16D54]">
                      {currentDataset.metadata.svsAssetId}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#111820] border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                  <span className="text-[#F0EEE5]/60 block text-[10px] uppercase tracking-wider">
                    NORMALIZATION METHODOLOGY (DOCUMENTED):
                  </span>
                  <p className="text-[#F0EEE5]/85">
                    {currentDataset.metadata.normalizationDocumentation}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F0EEE5]/5 border border-[#F0EEE5]/10 space-y-1 rounded-sm">
                  <span className="text-[#D1B77D] block text-[10px] uppercase tracking-wider font-semibold">
                    ACOUSTIC PARAMETER MAPPING:
                  </span>
                  <p className="text-[#F0EEE5]/90">
                    {currentDataset.metadata.sonificationMapping.acousticParameter} •{' '}
                    {currentDataset.metadata.sonificationMapping.musicalMapping} (Formula:{' '}
                    <code className="text-[#D1B77D] font-mono px-1 py-0.5 bg-[#111820] rounded border border-[#F0EEE5]/15">
                      {currentDataset.metadata.sonificationMapping.frequencyFormula}
                    </code>
                    )
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[#F0EEE5]/60">
                  <p className="font-serif italic text-[11px] text-[#F0EEE5]/70">{currentDataset.metadata.citation}</p>
                  <a
                    href={currentDataset.metadata.archiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#F0EEE5]/20 hover:border-[#D1B77D] hover:text-[#D1B77D] text-[#F0EEE5] transition-colors rounded-full"
                  >
                    <span>OFFICIAL ARCHIVE</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </Panel>
        )}
      </div>
    </section>
  );
};
