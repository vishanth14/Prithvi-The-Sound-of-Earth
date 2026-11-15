import React, { useRef } from 'react';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { EARTH_DATASETS } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import type { DatasetKey } from '../../data/types';
import type { EicDatasetKey } from '../../data/eicSchemas';
import { SectionHeader } from '../common/SectionHeader';
import { Panel } from '../common/Panel';
import { Badge } from '../common/Badge';
import { EarthCanvas } from '../canvas/EarthCanvas';
import {
  Thermometer,
  CloudRain,
  Waves,
  Trees,
  ShieldAlert,
  RotateCw,
  MapPin,
  X,
  ExternalLink,
  Headphones,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ScientificLayerDetail {
  id: DatasetKey;
  eicKey: EicDatasetKey;
  number: string;
  category: string;
  scientificTitle: string;
  shortLabel: string;
  description: string;
  nasaVisualization: string;
  dataSource: string;
  leadAgency: string;
  instrument: string;
  unit: string;
  timeRange: string;
  scientificExplanation: string;
  color: string;
}

const SCIENTIFIC_LAYERS: Record<DatasetKey, ScientificLayerDetail> = {
  temperature: {
    id: 'temperature',
    eicKey: 'gistemp',
    number: '01',
    category: 'GLOBAL SURFACE TEMPERATURE',
    scientificTitle: 'GISS Surface Temperature Analysis (GISTEMP v4)',
    shortLabel: 'Surface Temperature',
    description:
      'Comprehensive estimate of global surface temperature change combining meteorological stations, Antarctic boreholes, and ocean buoy sea-surface measurements.',
    nasaVisualization: 'NASA SVS #4976 Climate Spiral & EIC Global Anomaly Visualizer',
    dataSource: 'NASA Goddard Institute for Space Studies (GISS)',
    leadAgency: 'NASA Earth Science Division',
    instrument: 'GHCNv4 Meteorological Sensors & ERSSTv5 Ocean Buoys',
    unit: '°C Anomaly (vs 1951–1980 baseline)',
    timeRange: '1880 – 2026 (147-year empirical instrumental record)',
    scientificExplanation:
      'Quantifies global thermal amplification relative to mid-20th-century climate equilibrium. Values exceeding +1.0°C indicate sustained greenhouse radiative forcing; +1.5°C represents the international Paris Agreement threshold.',
    color: '#D1B77D',
  },
  co2: {
    id: 'co2',
    eicKey: 'co2_maunaloa',
    number: '02',
    category: 'ATMOSPHERIC GREENHOUSE GASES',
    scientificTitle: 'Atmospheric Carbon Dioxide Mole Fraction',
    shortLabel: 'Carbon Dioxide (CO₂)',
    description:
      'Direct in-situ air sampling and cavity ring-down laser spectroscopy monitoring baseline background greenhouse gas concentrations above marine boundary layer.',
    nasaVisualization: 'NASA OCO-2 Global Carbon Cycle & SVS Keeling Trace',
    dataSource: 'NOAA Global Monitoring Laboratory (GML) & NASA OCO-2',
    leadAgency: 'NOAA / NASA Earth Science',
    instrument: 'Cavity Ring-Down Laser Spectrometer & Picarro G2401',
    unit: 'Parts Per Million (ppm)',
    timeRange: '1958 – 2026 (Continuous Keeling observatory epoch)',
    scientificExplanation:
      'Tracks background tropospheric CO₂ mole fractions. Pre-industrial equilibrium was ~280 ppm; current values exceed 424 ppm, demonstrating biospheric seasonal respiration overlaid on exponential anthropogenic emissions.',
    color: '#E16D54',
  },
  seaLevel: {
    id: 'seaLevel',
    eicKey: 'sealevel_podaac',
    number: '03',
    category: 'OCEAN & SEA LEVEL VARIANCE',
    scientificTitle: 'Global Mean Sea Level Satellite Altimetry Record',
    shortLabel: 'Sea Level Variance',
    description:
      'Integrated multi-satellite radar altimetry tracking global ocean steric thermal expansion and barystatic mass addition from land-ice melting.',
    nasaVisualization: 'NASA PO.DAAC Integrated Ocean Surface Topography',
    dataSource: 'NASA Physical Oceanography DAAC (PO.DAAC)',
    leadAgency: 'NASA / ESA / EUMETSAT / CNES',
    instrument: 'Poseidon-4 Radar Altimeter & AMR-C Microwave Radiometer',
    unit: 'Millimeters (mm variance vs 1993 baseline)',
    timeRange: '1993 – 2026 (Continuous multi-mission altimeter record)',
    scientificExplanation:
      'Measures total oceanic volume change resulting from steric thermal expansion (warming seawater expands) and barystatic addition (glacier and polar ice sheet melt). Current global mean sea level has risen +116.8 mm since 1993.',
    color: '#508CA4',
  },
  vegetation: {
    id: 'vegetation',
    eicKey: 'aerosols_geos',
    number: '04',
    category: 'AEROSOLS & ATMOSPHERIC PARTICULATES',
    scientificTitle: 'Goddard Earth Observing System Aerosol Optical Depth (GEOS-FP)',
    shortLabel: 'Aerosol Optical Depth',
    description:
      'Assimilated satellite radiance and chemical transport modeling tracking atmospheric particulate extinction from wildfire smoke, desert dust, and urban pollution.',
    nasaVisualization: 'NASA Earth Information Center Atmospheric Transport Model',
    dataSource: 'NASA Global Modeling and Assimilation Office (GMAO)',
    leadAgency: 'NASA Goddard Space Flight Center',
    instrument: 'Terra & Aqua MODIS Spectroradiometer & GEOS-FP Assimilation',
    unit: 'Aerosol Optical Depth (AOD unitless index, 550nm)',
    timeRange: '2000 – 2026 (Modern EOS satellite observation epoch)',
    scientificExplanation:
      'AOD quantifies total light attenuation through the atmospheric column by airborne aerosols. Values under 0.1 indicate pristine atmospheric clarity; values above 0.4 indicate dense smoke, desert dust transport, or severe air quality hazard.',
    color: '#9D8DF1',
  },
  ozone: {
    id: 'ozone',
    eicKey: 'nightlights_viirs',
    number: '05',
    category: 'NIGHT-TIME LIGHTS & ANTHROPOGENIC RADIANCE',
    scientificTitle: 'Suomi NPP VIIRS Day-Night Band Nighttime Radiance',
    shortLabel: 'Night-Time Radiance',
    description:
      'Calibrated nocturnal anthropogenic lighting, urban electrification expansion, maritime fleets, and disaster blackout recovery monitoring.',
    nasaVisualization: 'NASA Earth Science Data Systems (ESDS) Black Marble HD Suite',
    dataSource: 'NASA/NOAA Suomi National Polar-orbiting Partnership (Suomi NPP)',
    leadAgency: 'NASA / NOAA',
    instrument: 'Visible Infrared Imaging Radiometer Suite (VIIRS Day-Night Band)',
    unit: 'nW·cm⁻²·sr⁻¹ (Nanowatts per sq cm per steradian)',
    timeRange: '2012 – 2026 (Multi-decadal calibrated nocturnal dataset)',
    scientificExplanation:
      'Measures artificial light emissions at night from urban infrastructure, commercial shipping, offshore rigs, and power grids. Correlates directly with human energy consumption, economic density, and extreme weather power grid resilience.',
    color: '#4EBA97',
  },
};

export const EarthExplorerSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    activeDataset,
    setActiveDataset,
    setActiveEicKey,
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
  const activeLayer = SCIENTIFIC_LAYERS[activeDataset];

  const layerNavList: { id: DatasetKey; icon: React.ReactNode }[] = [
    { id: 'temperature', icon: <Thermometer className="w-3.5 h-3.5" /> },
    { id: 'co2', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { id: 'seaLevel', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'vegetation', icon: <Trees className="w-3.5 h-3.5" /> },
    { id: 'ozone', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  ];

  const latestDataPoint = dataset.data[dataset.data.length - 1];

  const displaySentinelId = activeSentinelId || hoveredSentinelId;
  const currentSentinel = displaySentinelId
    ? CLIMATE_SENTINELS.find((s) => s.id === displaySentinelId)
    : null;

  const handleSelectLayer = async (key: DatasetKey) => {
    await setActiveDataset(key);
    await setActiveEicKey(SCIENTIFIC_LAYERS[key].eicKey);
  };

  const handleListenToData = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await setActiveEicKey(activeLayer.eicKey);
    await startPlayback();
    const sonificationEl =
      document.getElementById('sonification') || document.getElementById('listen');
    if (sonificationEl) {
      sonificationEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewInJukebox = async () => {
    await setActiveEicKey(activeLayer.eicKey);
    const jukeboxEl =
      document.getElementById('eic-jukebox') || document.getElementById('stories');
    if (jukeboxEl) {
      jukeboxEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBackToOverview = () => {
    selectSentinel(null);
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
            category="PLANETARY OBSERVATORY ATLAS"
            title="INTERACTIVE 3D EARTH EXPLORATION"
            subtitle="An interactive scientific atlas powered by authentic NASA Earth-observing satellite telemetry. Rotate the globe, pinpoint verified ground sentinels, and select empirical planetary layers to audition their sonic properties."
            badge="NASA EIC VERIFIED DATA"
            badgeVariant="sand"
          />
        </div>

        {/* Dataset Editorial Layer Switcher Bar */}
        <div className="explorer-reveal flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 pb-4 border-b border-[#F0EEE5]/10">
          <span className="font-mono text-xs text-[#D1B77D] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#D1B77D]" />
            DATA LAYERS:
          </span>
          {layerNavList.map((item) => {
            const layer = SCIENTIFIC_LAYERS[item.id];
            const isActive = activeDataset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectLayer(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-sans tracking-wide uppercase transition-all duration-300 cursor-pointer rounded-full ${
                  isActive
                    ? 'bg-[#F0EEE5] text-[#111820] font-semibold shadow-[0_4px_20px_rgba(240,238,229,0.18)] scale-105'
                    : 'bg-transparent text-[#F0EEE5]/70 border border-[#F0EEE5]/15 hover:border-[#D1B77D] hover:text-[#D1B77D]'
                }`}
              >
                <span
                  className={`font-mono text-[10px] ${
                    isActive ? 'text-[#111820]/60' : 'text-[#D1B77D]'
                  }`}
                >
                  {layer.number}
                </span>
                <span style={{ color: isActive ? '#111820' : layer.color }}>{item.icon}</span>
                <span>{layer.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Verified Climate Sentinels Quick Nav */}
        <div className="explorer-reveal flex flex-wrap items-center gap-2 sm:gap-2.5 mb-10 pb-4 border-b border-[#F0EEE5]/10 text-xs">
          <span className="font-mono text-xs text-[#E16D54] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E16D54]" />
            CLIMATE SENTINELS:
          </span>
          {CLIMATE_SENTINELS.map((s) => {
            const isSelected = activeSentinelId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => selectSentinel(isSelected ? null : s.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all duration-200 rounded-full cursor-pointer ${
                  isSelected
                    ? 'bg-[#E16D54] text-[#F0EEE5] font-semibold shadow-[0_2px_12px_rgba(225,109,84,0.3)]'
                    : 'bg-[#0C1017] text-[#F0EEE5]/70 border border-[#F0EEE5]/10 hover:border-[#E16D54] hover:text-[#E16D54]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name}</span>
                <span className="text-[10px] text-[#F0EEE5]/40">({s.stationCode})</span>
              </button>
            );
          })}
          {activeSentinelId && (
            <button
              onClick={handleBackToOverview}
              className="px-3 py-1.5 text-xs font-mono text-[#D1B77D] hover:text-white underline cursor-pointer ml-auto"
            >
              RESET TO GLOBAL OVERVIEW
            </button>
          )}
        </div>

        {/* Main 3D Canvas Viewport & Comprehensive Scientific Detail Panel */}
        <div className="explorer-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Earth Globe Canvas Viewport */}
          <div className="lg:col-span-7 relative min-h-[520px] sm:min-h-[660px] bg-[#0c1219] border border-[#F0EEE5]/10 overflow-hidden flex flex-col justify-between p-6 sm:p-8">
            {/* Viewport Top Header */}
            <div className="relative z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-widest text-[#D1B77D] uppercase">
                  ACTIVE LAYER: {activeLayer.shortLabel}
                </span>
                <span className="hidden sm:inline text-[#F0EEE5]/20">•</span>
                <span className="hidden sm:inline font-sans text-xs text-[#F0EEE5]/70">
                  {activeLayer.leadAgency}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeSentinelId && (
                  <button
                    onClick={handleBackToOverview}
                    className="px-3 py-1.5 border border-[#D1B77D]/60 bg-[#D1B77D]/10 hover:bg-[#D1B77D]/20 text-[#D1B77D] text-xs font-mono tracking-wider uppercase transition-colors rounded-full cursor-pointer"
                  >
                    RESET VIEW
                  </button>
                )}
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

            {/* Viewport Bottom Overlay: Interactive Instructions */}
            <div className="relative z-20 flex flex-wrap items-end justify-between pt-4 border-t border-[#F0EEE5]/10 text-xs font-mono text-[#F0EEE5]/60">
              <div className="flex flex-col gap-1">
                <span className="text-[#D1B77D] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E16D54]" />
                  DRAG GLOBE TO ROTATE • SCROLL TO ZOOM • SELECT BEACONS
                </span>
                <span className="text-[11px] text-[#F0EEE5]/40">
                  RAYLEIGH SCATTERING WITH GEOGRAPHICALLY VERIFIED OBSERVATORIES
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[#F0EEE5]/40">POLAR TILT: </span>
                <span className="text-[#F0EEE5]/80">23.44° EQUATORIAL EPOCH</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Scientific Detail Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            {/* Active Climate Sentinel Station Card (If Selected or Hovered) */}
            {currentSentinel ? (
              <Panel className="border-[#D1B77D]/50 bg-[#162330]/95 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EEE5]/10">
                    <div className="flex items-center gap-2 text-[#D1B77D]">
                      <MapPin className="w-4 h-4 text-[#E16D54]" />
                      <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                        VERIFIED CLIMATE OBSERVATORY
                      </span>
                    </div>
                    <button
                      onClick={handleBackToOverview}
                      className="text-[#F0EEE5]/60 hover:text-white transition-colors cursor-pointer"
                      title="Back to Global Overview"
                      aria-label="Back to Global Overview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-display text-2xl font-bold text-[#F0EEE5] mb-1">
                    {currentSentinel.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs text-[#D1B77D]">
                      {currentSentinel.lat > 0
                        ? `${currentSentinel.lat.toFixed(2)}°N`
                        : `${Math.abs(currentSentinel.lat).toFixed(2)}°S`}
                      ,{' '}
                      {currentSentinel.lng > 0
                        ? `${currentSentinel.lng.toFixed(2)}°E`
                        : `${Math.abs(currentSentinel.lng).toFixed(2)}°W`}
                    </span>
                    <span className="text-[#F0EEE5]/30">•</span>
                    <span className="font-mono text-xs text-[#F0EEE5]/60">
                      ID: {currentSentinel.stationCode}
                    </span>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/85 leading-relaxed mb-5 font-light">
                    {currentSentinel.description}
                  </p>

                  <div className="p-4 bg-[#111820]/80 border border-[#F0EEE5]/10 space-y-2 text-xs font-mono mb-5">
                    <div className="flex justify-between">
                      <span className="text-[#F0EEE5]/50">Primary Sensor:</span>
                      <span className="text-[#F0EEE5] truncate max-w-[200px]">
                        {currentSentinel.instrument}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#F0EEE5]/50">Baseline Reference:</span>
                      <span className="text-[#D1B77D] truncate max-w-[200px]">
                        {currentSentinel.baseline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleListenToData}
                    className="flex-1 py-3 px-4 text-xs font-sans tracking-widest uppercase bg-[#E16D54] hover:bg-[#EB7B63] text-[#F0EEE5] font-semibold transition-all duration-300 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(225,109,84,0.3)]"
                  >
                    <Headphones className="w-4 h-4" />
                    <span>LISTEN TO THIS DATA</span>
                  </button>

                  <button
                    onClick={handleBackToOverview}
                    className="py-3 px-4 text-xs font-sans tracking-wider uppercase border border-[#F0EEE5]/20 hover:border-[#D1B77D] text-[#F0EEE5]/80 hover:text-[#D1B77D] transition-colors rounded-full cursor-pointer text-center"
                  >
                    RESET OVERVIEW
                  </button>
                </div>
              </Panel>
            ) : null}

            {/* Scientific Layer Detail Panel */}
            <Panel className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header Tag with Agency Badge */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0EEE5]/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: activeLayer.color }}
                    />
                    <span className="font-mono text-xs text-[#D1B77D] tracking-widest uppercase font-medium">
                      {activeLayer.category}
                    </span>
                  </div>
                  <Badge variant="paper">{activeLayer.leadAgency}</Badge>
                </div>

                {/* Layer Master Scientific Title */}
                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F0EEE5] mb-2 leading-tight">
                  {activeLayer.scientificTitle}
                </h3>

                {/* Measurement Metric Callout */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#F0EEE5]"
                  >
                    {latestDataPoint.value > 0 && activeDataset === 'temperature'
                      ? `+${latestDataPoint.value}`
                      : latestDataPoint.value}
                  </span>
                  <span className="font-mono text-xs text-[#F0EEE5]/60">{activeLayer.unit}</span>
                  <span className="text-xs font-mono text-[#D1B77D] ml-2">
                    ({latestDataPoint.year})
                  </span>
                </div>

                {/* Layer Description */}
                <p className="font-sans text-xs sm:text-sm text-[#F0EEE5]/80 leading-relaxed mb-5 font-light">
                  {activeLayer.description}
                </p>

                {/* Scientific Explanation Box */}
                <div className="p-4 bg-[#111820]/70 border border-[#F0EEE5]/10 mb-5 space-y-2">
                  <span className="font-mono text-[11px] text-[#D1B77D] uppercase tracking-wider block font-medium">
                    SCIENTIFIC PHENOMENON & MECHANISM:
                  </span>
                  <p className="font-sans text-xs text-[#F0EEE5]/85 leading-relaxed font-normal">
                    {activeLayer.scientificExplanation}
                  </p>
                </div>

                {/* Key Metadata Table */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                  <div className="p-3 bg-[#111820]/50 border border-[#F0EEE5]/10">
                    <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">
                      TIME RANGE
                    </span>
                    <span className="text-[#D1B77D] font-medium">{activeLayer.timeRange}</span>
                  </div>

                  <div className="p-3 bg-[#111820]/50 border border-[#F0EEE5]/10">
                    <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">
                      PRIMARY SENSOR
                    </span>
                    <span className="text-[#F0EEE5] font-medium truncate block">
                      {activeLayer.instrument}
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-[#111820]/50 border border-[#F0EEE5]/10">
                    <span className="text-[#F0EEE5]/50 block text-[10px] uppercase">
                      NASA EIC VISUALIZATION
                    </span>
                    <span className="text-[#F0EEE5] font-medium flex items-center justify-between">
                      <span>{activeLayer.nasaVisualization}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#D1B77D]" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Listen & Jukebox Navigation */}
              <div className="pt-4 border-t border-[#F0EEE5]/10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleListenToData}
                  className="flex-1 py-3.5 px-6 text-xs font-sans tracking-widest uppercase bg-[#F0EEE5] hover:bg-white text-[#111820] font-semibold transition-all duration-300 rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(240,238,229,0.2)] active:scale-[0.98]"
                >
                  <Headphones className="w-4 h-4 text-[#111820]" />
                  <span>LISTEN TO THIS DATA</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#111820]" />
                </button>

                <button
                  onClick={handleViewInJukebox}
                  className="py-3.5 px-5 text-xs font-sans tracking-wider uppercase border border-[#F0EEE5]/20 hover:border-[#D1B77D] text-[#F0EEE5]/80 hover:text-[#D1B77D] transition-colors rounded-full cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>VIEW EIC JUKEBOX</span>
                  <ExternalLink className="w-3 h-3 text-[#D1B77D]" />
                </button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
};
