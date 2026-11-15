import React, { useRef } from 'react';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { EARTH_DATASETS } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import type { DatasetKey } from '../../data/types';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { EarthCanvas } from '../canvas/EarthCanvas';
import {
  Thermometer,
  CloudRain,
  Waves,
  Trees,
  ShieldAlert,
  RotateCw,
  Volume2,
  MapPin,
  X,
  Radio,
} from 'lucide-react';

export const EarthExplorerSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    activeDataset,
    setActiveDataset,
    globeRotating,
    setGlobeRotating,
    activeSentinelId,
    hoveredSentinelId,
    selectSentinel,
    isAudioUnlocked,
    unlockAudio,
    startPlayback,
  } = useObservatoryStore();

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.explorer-reveal', {
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

  const dataset = EARTH_DATASETS[activeDataset];

  const datasetOptions: { id: DatasetKey; label: string; icon: React.ReactNode; color: string; number: string }[] = [
    {
      id: 'temperature',
      label: 'Surface Temp',
      number: '01',
      icon: <Thermometer className="w-3.5 h-3.5" />,
      color: '#D1B77D',
    },
    {
      id: 'co2',
      label: 'Carbon Dioxide',
      number: '02',
      icon: <CloudRain className="w-3.5 h-3.5" />,
      color: '#E16D54',
    },
    {
      id: 'seaLevel',
      label: 'Sea Level',
      number: '03',
      icon: <Waves className="w-3.5 h-3.5" />,
      color: '#508CA4',
    },
    {
      id: 'vegetation',
      label: 'Aerosol Depth',
      number: '04',
      icon: <Trees className="w-3.5 h-3.5" />,
      color: '#9D8DF1',
    },
    {
      id: 'ozone',
      label: 'Night Lights',
      number: '05',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      color: '#4EBA97',
    },
  ];

  const latestDataPoint = dataset.data[dataset.data.length - 1];

  const displaySentinelId = activeSentinelId || hoveredSentinelId;
  const currentSentinel = displaySentinelId
    ? CLIMATE_SENTINELS.find((s) => s.id === displaySentinelId)
    : null;

  const handleAuditSentinel = async (sentinelId: string) => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await selectSentinel(sentinelId);
    await startPlayback();
  };

  return (
    <section
      ref={sectionRef}
      id="explorer"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#F0EEE5]/10 z-10 bg-[#111820]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="explorer-reveal">
          <SectionHeader
            number="02"
            category="PLANETARY OBSERVATORY"
            title="INTERACTIVE 3D EARTH ATLAS"
            subtitle="Direct spatial inspection of Earth System Science parameters. Select observational layers or climate sentinels to reveal anomalies, orbital telemetry, and sonic mappings."
            badge="ORBITAL TELEMETRY MESH"
            badgeVariant="sand"
          />
        </div>

        {/* Dataset Editorial Layer Switcher */}
        <div className="explorer-reveal flex flex-wrap items-center gap-3 mb-10 pb-5 border-b border-[#F0EEE5]/10">
          <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mr-2">
            OBSERVATIONAL LAYER:
          </span>
          {datasetOptions.map((opt) => {
            const isActive = activeDataset === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveDataset(opt.id)}
                className={`inline-flex items-center gap-2.5 px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 cursor-pointer rounded-full ${
                  isActive
                    ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_20px_rgba(240,238,229,0.15)]'
                    : 'bg-transparent text-[#F0EEE5]/70 border border-[#F0EEE5]/15 hover:border-[#D1B77D] hover:text-[#D1B77D]'
                }`}
              >
                <span className={`font-mono text-[10px] ${isActive ? 'text-[#111820]/60' : 'text-[#D1B77D]'}`}>
                  {opt.number}
                </span>
                <span style={{ color: isActive ? '#111820' : opt.color }}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main 3D Canvas & Telemetry Grid */}
        <div className="explorer-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Earth Globe Canvas Viewport */}
          <div className="lg:col-span-8 relative min-h-[520px] sm:min-h-[640px] bg-[#0c1219] border border-[#F0EEE5]/10 overflow-hidden flex flex-col justify-between p-6 sm:p-8">
            {/* Viewport Top Editorial Info */}
            <div className="relative z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-widest text-[#D1B77D] uppercase">
                  ACTIVE SENSOR: {dataset.shortCode}
                </span>
                <span className="hidden sm:inline text-[#F0EEE5]/20">•</span>
                <span className="hidden sm:inline font-sans text-xs text-[#F0EEE5]/70">
                  {dataset.satellitePlatform}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGlobeRotating(!globeRotating)}
                  className={`p-2 border text-xs font-mono transition-all cursor-pointer rounded-full ${
                    globeRotating
                      ? 'border-[#D1B77D]/60 bg-[#D1B77D]/15 text-[#D1B77D]'
                      : 'border-[#F0EEE5]/20 bg-transparent text-[#F0EEE5]/60 hover:text-white'
                  }`}
                  title="Toggle Planetary Rotation"
                  aria-label="Toggle Planetary Rotation"
                >
                  <RotateCw className={`w-4 h-4 ${globeRotating ? 'animate-spin-slow' : ''}`} />
                </button>
              </div>
            </div>

            {/* 3D Canvas Layer */}
            <div className="absolute inset-0 z-10">
              <EarthCanvas interactive={true} />
            </div>

            {/* Viewport Bottom Overlay: Vantage Cues */}
            <div className="relative z-20 flex flex-wrap items-end justify-between pt-4 border-t border-[#F0EEE5]/10 text-xs font-mono text-[#F0EEE5]/60">
              <div className="flex flex-col gap-1">
                <span className="text-[#D1B77D]">
                  INTERACTION: DRAG TO ROTATE GLOBE • SELECT SENTINEL PINS
                </span>
                <span className="text-[11px] text-[#F0EEE5]/40">
                  OPTICAL CALIBRATION: RAYLEIGH SCATTERING WITH GEOGRAPHIC BEACONS
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[#F0EEE5]/40">POLAR INCLINATION: </span>
                <span className="text-[#F0EEE5]/80">23.4° AXIAL TILT</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Scientific Telemetry & Sentinel Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            {/* Active Climate Sentinel Station Card (If Selected or Hovered) */}
            {currentSentinel ? (
              <Panel className="border-[#D1B77D]/40 bg-[#17222c]/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EEE5]/10">
                    <div className="flex items-center gap-2 text-[#D1B77D]">
                      <MapPin className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                        CLIMATE SENTINEL PIN
                      </span>
                    </div>
                    {activeSentinelId && (
                      <button
                        onClick={() => selectSentinel(null)}
                        className="text-[#F0EEE5]/60 hover:text-white transition-colors"
                        aria-label="Close Sentinel Details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-display text-xl font-bold text-[#F0EEE5] mb-1">
                    {currentSentinel.name}
                  </h4>
                  <span className="font-mono text-xs text-[#D1B77D] block mb-3">
                    {currentSentinel.lat > 0 ? `${currentSentinel.lat}° N` : `${Math.abs(currentSentinel.lat)}° S`},{' '}
                    {currentSentinel.lng > 0 ? `${currentSentinel.lng}° E` : `${Math.abs(currentSentinel.lng)}° W`}{' '}
                    <span className="text-[#F0EEE5]/40 font-sans">({currentSentinel.stationCode})</span>
                  </span>

                  <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/80 leading-relaxed mb-5 font-light">
                    {currentSentinel.description}
                  </p>

                  <div className="p-4 bg-[#111820]/80 border border-[#F0EEE5]/10 space-y-2 text-xs font-mono mb-5">
                    <div className="flex justify-between">
                      <span className="text-[#F0EEE5]/50">Sensor:</span>
                      <span className="text-[#F0EEE5] truncate max-w-[170px]">{currentSentinel.instrument}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#F0EEE5]/50">Baseline:</span>
                      <span className="text-[#D1B77D] truncate max-w-[170px]">{currentSentinel.baseline}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAuditSentinel(currentSentinel.id)}
                  className="w-full py-3 px-4 text-xs font-sans tracking-widest uppercase bg-[#E16D54] hover:bg-[#EB7B63] text-[#F0EEE5] font-semibold transition-all duration-300 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,109,84,0.25)]"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>AUDIT SENTINEL FREQUENCY</span>
                </button>
              </Panel>
            ) : null}

            {/* Scientific Layer Metric Panel */}
            <Panel className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#D1B77D] tracking-widest uppercase">
                    MEASUREMENT ({latestDataPoint.year})
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: dataset.themeColor }}
                  />
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span
                    className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#F0EEE5]"
                  >
                    {latestDataPoint.value > 0 && activeDataset === 'temperature'
                      ? `+${latestDataPoint.value}`
                      : latestDataPoint.value}
                  </span>
                  <span className="font-mono text-xs text-[#F0EEE5]/60">{dataset.unit}</span>
                </div>

                <p className="font-mono text-xs text-[#D1B77D]/90 mb-4">
                  Baseline: {dataset.baseline}
                </p>

                <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/80 leading-relaxed mb-6 font-light">
                  {dataset.description}
                </p>

                <div className="p-4 bg-[#111820]/60 border border-[#F0EEE5]/10 space-y-2.5 mb-6 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#F0EEE5]/50">Agency:</span>
                    <span className="text-[#F0EEE5]">{dataset.leadAgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#F0EEE5]/50">Instrument:</span>
                    <span className="text-[#F0EEE5]">{dataset.instrument}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#F0EEE5]/50">Epoch:</span>
                    <span className="text-[#D1B77D]">{dataset.temporalRange}</span>
                  </div>
                </div>
              </div>

              {/* Sonification Mapping Summary */}
              <div className="pt-4 border-t border-[#F0EEE5]/10">
                <div className="flex items-center gap-2 mb-2 text-[#E16D54] font-mono text-xs uppercase tracking-widest">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ACOUSTIC TRANSLATION</span>
                </div>
                <p className="font-sans text-xs text-[#F0EEE5]/85 mb-2 font-normal">
                  <strong className="font-medium text-[#F0EEE5]">{dataset.sonificationRule.acousticParameter}:</strong>{' '}
                  {dataset.sonificationRule.musicalMapping}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#F0EEE5]/50">
                  <span>Frequency: {dataset.sonificationRule.frequencyRange}</span>
                  <span className="text-[#D1B77D]">Deterministic Synthesis</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
};
