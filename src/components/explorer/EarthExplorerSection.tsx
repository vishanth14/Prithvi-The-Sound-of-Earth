import React, { useRef } from 'react';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { EARTH_DATASETS } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import { MagneticButton } from '../common/MagneticButton';
import type { DatasetKey } from '../../data/types';
import type { EicDatasetKey } from '../../data/eicSchemas';
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
  BookOpen,
  Globe,
} from 'lucide-react';

import { ExplorerGlobeCanvas } from './ExplorerGlobeCanvas';

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
  geographicExtent: string;
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
      'Comprehensive estimate of global surface temperature anomalies combining meteorological stations, Antarctic boreholes, and ocean buoy sea-surface measurements.',
    nasaVisualization: 'NASA SVS #5190 Climate Spiral & EIC Global Anomaly Visualizer',
    dataSource: 'NASA Goddard Institute for Space Studies (GISS)',
    leadAgency: 'NASA Earth Science Division',
    instrument: 'GHCNv4 Meteorological Sensors & ERSSTv5 Ocean Buoys',
    unit: '°C Anomaly (vs 1951–1980 baseline)',
    timeRange: '1880 – 2024 (Annual Benchmark Series)',
    geographicExtent: 'Global (90°N – 90°S, 180°W – 180°E; 2°×2° gridded resolution)',
    scientificExplanation:
      'Quantifies global thermal amplification relative to mid-20th-century climate equilibrium. Values exceeding +1.0°C indicate sustained greenhouse radiative forcing; +1.5°C represents the international Paris Agreement threshold.',
    color: '#FF5938',
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
    nasaVisualization: 'NASA SVS #5196 (DYAMOND Simulation) & NOAA GML Keeling Curve',
    dataSource: 'NOAA Global Monitoring Laboratory (GML) & NASA GMAO',
    leadAgency: 'NOAA / NASA Earth Science',
    instrument: 'Cavity Ring-Down Laser Spectrometer & Picarro G2401',
    unit: 'Parts Per Million (ppm)',
    timeRange: '1958 – 2024 (Continuous Keeling observatory epoch)',
    geographicExtent: 'Global Baseline (19.53°N, 155.58°W Mauna Loa + Marine Troposphere)',
    scientificExplanation:
      'Tracks background tropospheric CO₂ mole fractions. Pre-industrial equilibrium was ~280 ppm; current values exceed 424 ppm, demonstrating biospheric seasonal respiration overlaid on exponential anthropogenic emissions.',
    color: '#83BBD5',
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
    nasaVisualization: 'NASA SVS #5312 (Global Mean Sea Level 1993–2023)',
    dataSource: 'NASA Physical Oceanography DAAC (PO.DAAC)',
    leadAgency: 'NASA / ESA / EUMETSAT / CNES',
    instrument: 'Poseidon-4 Radar Altimeter & AMR-C Microwave Radiometer',
    unit: 'Millimeters (mm variance vs 1993 baseline)',
    timeRange: '1993 – 2023 (Continuous multi-mission altimeter record)',
    geographicExtent: 'Global Oceans (66°S – 66°N ice-free marine domain; Jason / Sentinel-6)',
    scientificExplanation:
      'Measures total oceanic volume change resulting from steric thermal expansion (warming seawater expands) and barystatic addition (glacier and polar ice sheet melt). Current global mean sea level has risen +111.4 mm above the 1993 baseline.',
    color: '#83BBD5',
  },
  vegetation: {
    id: 'vegetation',
    eicKey: 'aerosols_geos',
    number: '04',
    category: 'AEROSOLS & ATMOSPHERIC PARTICULATES',
    scientificTitle: 'Goddard Earth Observing System Aerosol Optical Depth (GEOS-FP)',
    shortLabel: 'Aerosol Optical Depth (Experimental Proxy)',
    description:
      'Assimilated satellite radiance and chemical transport modeling tracking atmospheric particulate extinction from wildfire smoke, desert dust, and urban pollution.',
    nasaVisualization: 'NASA GMAO GEOS Aerosol Suite (Experimental Model Proxy)',
    dataSource: 'NASA Global Modeling and Assimilation Office (GMAO)',
    leadAgency: 'NASA Goddard Space Flight Center',
    instrument: 'Terra & Aqua MODIS Spectroradiometer & GEOS-FP Assimilation',
    unit: 'Aerosol Optical Depth (AOD unitless index, 550nm)',
    timeRange: '2000 – 2024 (Experimental Model Proxy)',
    geographicExtent: 'Global Atmospheric Column (550nm total aerosol optical depth; gridded assimilation)',
    scientificExplanation:
      'AOD quantifies total light attenuation through the atmospheric column by airborne aerosols. Values under 0.1 indicate pristine atmospheric clarity; values above 0.4 indicate dense smoke, desert dust transport, or severe air quality hazard. Note: Current stream is an experimental proxy.',
    color: '#252D36',
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
    nasaVisualization: 'NASA SVS #5313 (Change in Night Lights 2012–2023 - EIC Version)',
    dataSource: 'NASA/NOAA Suomi National Polar-orbiting Partnership (Suomi NPP)',
    leadAgency: 'NASA / NOAA',
    instrument: 'Visible Infrared Imaging Radiometer Suite (VIIRS Day-Night Band)',
    unit: 'nW·cm⁻²·sr⁻¹ (Nanowatts per sq cm per steradian)',
    timeRange: '2012 – 2023 (EIC Hyperwall Series)',
    geographicExtent: 'Global Land Surface & Continental Margins (75°N – 65°S latitudinal swath; 750m)',
    scientificExplanation:
      'Measures artificial light emissions at night from urban infrastructure, commercial shipping, offshore rigs, and power grids. Correlates directly with human energy consumption, economic density, and extreme weather power grid resilience.',
    color: '#FF5938',
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
    triggerSentinelFocus,
    resetCameraOrientation,
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
    const jukeboxEl =
      document.getElementById('jukebox') ||
      document.getElementById('sonification') ||
      document.getElementById('listen');
    if (jukeboxEl) {
      jukeboxEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewInJukebox = async () => {
    await setActiveEicKey(activeLayer.eicKey);
    const jukeboxEl =
      document.getElementById('jukebox') ||
      document.getElementById('eic-jukebox') ||
      document.getElementById('stories');
    if (jukeboxEl) {
      jukeboxEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenStory = async (eicKey?: EicDatasetKey) => {
    const key = eicKey || activeLayer.eicKey;
    await setActiveEicKey(key);
    const storiesEl = document.getElementById('stories');
    if (storiesEl) {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(storiesEl, { duration: 1.2 });
      } else {
        storiesEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleFocusLocation = () => {
    triggerSentinelFocus();
  };

  const handleBackToOverview = () => {
    resetCameraOrientation();
  };

  return (
    <section
      ref={sectionRef}
      id="explorer"
      className="relative w-full py-24 px-6 sm:px-10 lg:px-16 border-t border-[#252D36]/20 z-10 bg-transparent text-[#070B10] selection:bg-[#FF5938]/30 selection:text-[#070B10]"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Editorial Top Paper Header & Layer Navigation */}
        <div className="explorer-reveal bg-[#E9EDF0] text-[#070B10] p-6 sm:p-8 border border-[#252D36] shadow-xl pointer-events-auto">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#252D36]/20 pb-3">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#FF5938] font-bold">
                CHAPTER 02 // ORBIT
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-[#252D36] font-semibold">
                NASA EIC OBSERVATION FLEET
              </span>
            </div>
            <h2 className="font-display font-extrabold text-5xl sm:text-7xl text-[#070B10] tracking-tight uppercase leading-[0.9] mb-4">
              A PLANET IN MOTION
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#252D36]/80 font-normal leading-relaxed max-w-3xl">
              A full-width scientific visualization introducing the Earth observation journey, powered by genuine NASA Earth Information Center imagery, physical ground sentinels, and the low-Earth orbit satellite fleet.
            </p>
          </div>

          {/* Dataset Editorial Layer Switcher Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 pb-4 border-b border-[#252D36]/20">
            <span className="font-mono text-xs text-[#252D36] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-bold">
              <Compass className="w-3.5 h-3.5 text-[#FF5938]" />
              DATA LAYERS:
            </span>
            {layerNavList.map((item) => {
              const layer = SCIENTIFIC_LAYERS[item.id];
              const isActive = activeDataset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectLayer(item.id)}
                  data-cursor-label="EXPLORE"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#070B10] text-[#E9EDF0] border-2 border-[#070B10]'
                      : 'bg-white text-[#070B10] border border-[#252D36]/30 hover:border-[#FF5938]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-[#FF5938]' : 'text-[#252D36]/60'
                    }`}
                  >
                    {layer.number}
                  </span>
                  <span style={{ color: isActive ? '#FF5938' : layer.color }}>{item.icon}</span>
                  <span>{layer.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Verified Climate Sentinels Quick Nav (Options 1–5 + Option 6 Reset) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            <span className="font-mono text-xs text-[#252D36] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#FF5938]" />
              CLIMATE SENTINELS:
            </span>
            {CLIMATE_SENTINELS.map((s, idx) => {
              const isSelected = activeSentinelId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (isSelected) {
                      triggerSentinelFocus();
                    } else {
                      selectSentinel(s.id);
                    }
                  }}
                  data-cursor-label="FOCUS"
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938] ${
                    isSelected
                      ? 'bg-[#FF5938] text-[#070B10] font-bold border-2 border-[#FF5938] shadow-md'
                      : 'bg-white text-[#252D36] border border-[#252D36]/30 hover:border-[#FF5938]'
                  }`}
                >
                  <span
                    className="w-2 h-2 shrink-0"
                    style={{ backgroundColor: isSelected ? '#070B10' : s.color }}
                  />
                  <span className="font-bold">{idx + 1}. {s.stationCode}</span>
                  <span className="hidden xl:inline font-sans text-xs text-[#252D36]/75">
                    ({s.name.split(',')[0]})
                  </span>
                </button>
              );
            })}

            {/* Option 6: RESET TO GLOBAL OVERVIEW */}
            <button
              onClick={handleBackToOverview}
              data-cursor-label="RESET"
              aria-label="Reset to Global Overview"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938] ${
                activeSentinelId
                  ? 'bg-[#070B10] text-[#FF5938] border border-[#FF5938] hover:bg-[#FF5938] hover:text-[#070B10] shadow-sm'
                  : 'bg-transparent text-[#7E8B98] border border-[#252D36]/30 hover:border-[#252D36] hover:text-[#070B10]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#FF5938]" />
              <span>6. RESET TO GLOBAL OVERVIEW</span>
            </button>
          </div>
        </div>

        {/* Main 3D Canvas Viewport & Comprehensive Scientific Detail Panel */}
        <div className="explorer-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Earth Globe Canvas Viewport */}
          <div className="lg:col-span-7 relative min-h-[520px] sm:min-h-[660px] bg-[#070B10] border-2 border-[#252D36] overflow-hidden flex flex-col justify-between p-6 sm:p-8 shadow-2xl pointer-events-auto group">
            {/* Interactive 3D Earth Globe Canvas */}
            <ExplorerGlobeCanvas />

            {/* Viewport Top Header */}
            <div className="relative z-20 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-widest text-[#FF5938] uppercase font-bold">
                  ACTIVE LAYER: {activeLayer.shortLabel}
                </span>
                <span className="hidden sm:inline text-[#252D36]">•</span>
                <span className="hidden sm:inline font-mono text-xs text-[#83BBD5]">
                  {activeLayer.leadAgency}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToOverview}
                  data-cursor-label="RESET"
                  className={`px-3 py-1.5 border text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    activeSentinelId
                      ? 'border-[#FF5938] bg-[#FF5938] text-[#070B10] font-bold shadow-md'
                      : 'border-[#252D36] bg-[#070B10]/85 hover:border-[#FF5938] text-[#E9EDF0] hover:text-[#FF5938]'
                  }`}
                  title="Reset Planetary Overview & North-Up Orientation"
                >
                  <Compass className={`w-3.5 h-3.5 ${activeSentinelId ? 'text-[#070B10]' : 'text-[#FF5938]'}`} />
                  <span>{activeSentinelId ? 'GLOBAL OVERVIEW' : 'RESET VIEW'}</span>
                </button>
                <button
                  onClick={() => setGlobeRotating(!globeRotating)}
                  data-cursor-label="ROTATE"
                  className={`p-2 border text-xs font-mono transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    globeRotating
                      ? 'border-[#FF5938] bg-[#FF5938]/20 text-[#FF5938]'
                      : 'border-[#252D36] bg-[#070B10] text-[#7E8B98] hover:text-[#E9EDF0]'
                  }`}
                  title="Toggle Planetary Rotation"
                  aria-label="Toggle Planetary Rotation"
                >
                  <RotateCw className={`w-4 h-4 ${globeRotating ? 'animate-spin-slow' : ''}`} />
                </button>
              </div>
            </div>

            {/* Corner HUD crosshairs for precision scientific aperture */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF5938]/60" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF5938]/60" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF5938]/60" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF5938]/60" />
            </div>

            {/* Viewport Bottom Overlay: Interactive Instructions */}
            <div className="relative z-20 flex flex-wrap items-end justify-between pt-4 border-t border-[#252D36] text-xs font-mono text-[#7E8B98] pointer-events-none bg-[#070B10]/70 backdrop-blur-xs px-3 py-2 -mx-2 -mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-[#83BBD5] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 bg-[#FF5938]" />
                  DRAG GLOBE TO ROTATE • SCROLL TO ZOOM (3.2x — 12.0x) • SELECT SENTINEL BEACONS
                </span>
                <span className="text-[11px] text-[#7E8B98]">
                  HIGH-FIDELITY PLANETARY SHADERS WITH GEOGRAPHICALLY VERIFIED OBSERVATORIES
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[#7E8B98]">POLAR AXIAL TILT: </span>
                <span className="text-[#E9EDF0] font-semibold">23.44° EQUATORIAL EPOCH</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Scientific Detail Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between pointer-events-auto">
            {/* Active Climate Sentinel Station Card (If Selected or Hovered) */}
            {currentSentinel ? (
              <div className="border-2 border-[#FF5938] bg-[#070B10] text-[#E9EDF0] p-6 sm:p-7 shadow-2xl flex flex-col justify-between transition-all duration-300">
                <div>
                  {/* Header Identifier & Close Button */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#252D36]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#FF5938] inline-block" />
                      <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#FF5938]">
                        CLIMATE SENTINEL // {currentSentinel.stationCode}
                      </span>
                    </div>
                    <button
                      onClick={handleBackToOverview}
                      className="text-[#7E8B98] hover:text-[#FF5938] transition-colors cursor-pointer p-1"
                      title="Return to Global View"
                      aria-label="Return to Global View"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Region */}
                  <h4 className="font-display text-2xl sm:text-3xl font-extrabold text-[#E9EDF0] uppercase tracking-tight mb-1 leading-tight">
                    {currentSentinel.name}
                  </h4>
                  <div className="font-mono text-xs text-[#83BBD5] mb-4 flex flex-wrap items-center gap-2">
                    <span>{currentSentinel.region}</span>
                    {currentSentinel.elevationMeters > 0 && (
                      <>
                        <span className="text-[#252D36]">•</span>
                        <span className="text-[#7E8B98]">
                          {currentSentinel.elevationMeters.toLocaleString()} m a.s.l.
                        </span>
                      </>
                    )}
                  </div>

                  {/* Representative Label for Distributed Arrays (e.g. TAO/TRITON) */}
                  {currentSentinel.representativeLabel && (
                    <div className="mb-4 px-3 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/40 font-mono text-[11px] text-[#06B6D4]">
                      {currentSentinel.representativeLabel}
                    </div>
                  )}

                  {/* Section 1: Scientific Role */}
                  <div className="mb-3.5">
                    <span className="font-mono text-[10px] text-[#7E8B98] uppercase tracking-widest font-bold block mb-1">
                      SCIENTIFIC ROLE
                    </span>
                    <p className="font-sans text-xs text-[#E9EDF0]/90 leading-relaxed font-normal">
                      {currentSentinel.scientificPurpose}
                    </p>
                  </div>

                  {/* Section 2: Geographic Location & Observation Type */}
                  <div className="mb-3.5 p-3.5 bg-[#0E141D] border border-[#252D36] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[#7E8B98] block text-[10px] uppercase tracking-wider font-semibold">
                        GEOGRAPHIC LOCATION
                      </span>
                      <span className="text-[#E9EDF0] font-bold">
                        {currentSentinel.lat > 0
                          ? `${currentSentinel.lat.toFixed(4)}°N`
                          : `${Math.abs(currentSentinel.lat).toFixed(4)}°S`}
                        ,{' '}
                        {currentSentinel.lng > 0
                          ? `${currentSentinel.lng.toFixed(4)}°E`
                          : `${Math.abs(currentSentinel.lng).toFixed(4)}°W`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#7E8B98] block text-[10px] uppercase tracking-wider font-semibold">
                        OBSERVATION TYPE
                      </span>
                      <span className="text-[#83BBD5] font-semibold">
                        {currentSentinel.measurementType}
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Scientific Context & Instrumentation */}
                  <div className="mb-3.5 space-y-2 p-3 bg-[#0E141D] border border-[#252D36] text-xs font-mono">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#7E8B98]">Sensor / Instrument:</span>
                      <span className="text-[#E9EDF0] font-semibold text-right truncate max-w-[220px]">
                        {currentSentinel.instrument}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#7E8B98]">Baseline Reference:</span>
                      <span className="text-[#83BBD5] font-semibold text-right truncate max-w-[220px]">
                        {currentSentinel.baseline}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#7E8B98]">Data Source:</span>
                      <span className="text-[#E9EDF0] font-semibold text-right truncate max-w-[220px]">
                        {currentSentinel.source}
                      </span>
                    </div>
                  </div>

                  {/* Section 4: Data Limitations */}
                  <div className="mb-5">
                    <span className="font-mono text-[10px] text-[#7E8B98] uppercase tracking-widest font-bold block mb-1">
                      DATA COVERAGE & LIMITATIONS
                    </span>
                    <p className="font-sans text-[11px] text-[#7E8B98] leading-relaxed font-normal">
                      {currentSentinel.dataLimitations}
                    </p>
                  </div>
                </div>

                {/* Actions: FOCUS ON LOCATION | OPEN SOURCE | RETURN TO GLOBAL VIEW */}
                <div className="space-y-2 pt-4 border-t border-[#252D36]">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleFocusLocation}
                      data-cursor-label="FOCUS"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FF5938] hover:bg-[#ff6f52] text-[#070B10] font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>FOCUS ON LOCATION</span>
                    </button>

                    <a
                      href={currentSentinel.attributionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor-label="SOURCE"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 border border-[#252D36] hover:border-[#83BBD5] text-[#83BBD5] hover:text-[#E9EDF0] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer bg-[#0E141D]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>OPEN SOURCE</span>
                    </a>

                    <button
                      onClick={handleBackToOverview}
                      data-cursor-label="RESET"
                      className="py-2.5 px-3 border border-[#252D36] hover:border-[#FF5938] text-[#7E8B98] hover:text-[#FF5938] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer text-center hover:bg-[#0E141D]"
                    >
                      RETURN TO GLOBAL VIEW
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <MagneticButton
                      onClick={() => handleOpenStory(currentSentinel.eicKey)}
                      cursorLabel="STORY"
                      variant="primary"
                      size="sm"
                      className="flex-1 py-2 px-3 text-xs font-bold tracking-wider"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#070B10]" />
                      <span>EXPLORE STORY</span>
                    </MagneticButton>

                    <MagneticButton
                      onClick={handleListenToData}
                      cursorLabel="LISTEN"
                      variant="secondary"
                      size="sm"
                      className="flex-1 py-2 px-3 text-xs font-bold tracking-wider"
                    >
                      <Headphones className="w-3.5 h-3.5 text-[#83BBD5]" />
                      <span>LISTEN</span>
                    </MagneticButton>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Scientific Layer Detail Panel */}
            <div className="flex-1 flex flex-col justify-between bg-white border-2 border-[#252D36] p-6 sm:p-8 shadow-sm">
              <div>
                {/* Header Tag with Agency Badge */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#252D36]/20">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5"
                      style={{ backgroundColor: activeLayer.color }}
                    />
                    <span className="font-mono text-xs text-[#252D36] tracking-widest uppercase font-bold">
                      {activeLayer.category}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-[#E9EDF0] text-[#070B10] font-mono text-[10px] uppercase font-bold border border-[#252D36]/20">
                    {activeLayer.leadAgency}
                  </span>
                </div>

                {/* Layer Master Scientific Title */}
                <h3 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#070B10] mb-3 leading-[0.95] uppercase">
                  {activeLayer.scientificTitle}
                </h3>

                {/* Measurement Metric Callout */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#070B10]"
                  >
                    {latestDataPoint.value > 0 && activeDataset === 'temperature'
                      ? `+${latestDataPoint.value}`
                      : latestDataPoint.value}
                  </span>
                  <span className="font-mono text-xs text-[#252D36]/70 font-semibold">{activeLayer.unit}</span>
                  <span className="text-xs font-mono text-[#FF5938] ml-2 font-bold">
                    ({latestDataPoint.year})
                  </span>
                </div>

                {/* Layer Description */}
                <p className="font-sans text-xs sm:text-sm text-[#252D36]/80 leading-relaxed mb-5 font-normal">
                  {activeLayer.description}
                </p>

                {/* Scientific Explanation Box */}
                <div className="p-4 bg-[#E9EDF0] border border-[#252D36]/20 mb-5 space-y-2">
                  <span className="font-mono text-[11px] text-[#070B10] uppercase tracking-wider block font-bold">
                    SCIENTIFIC PHENOMENON & MECHANISM:
                  </span>
                  <p className="font-sans text-xs text-[#252D36] leading-relaxed font-normal">
                    {activeLayer.scientificExplanation}
                  </p>
                </div>

                {/* Key Metadata Table */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                  <div className="p-3 bg-[#E9EDF0]/60 border border-[#252D36]/20">
                    <span className="text-[#252D36]/60 block text-[10px] uppercase font-bold">
                      TEMPORAL COVERAGE
                    </span>
                    <span className="text-[#070B10] font-semibold">{activeLayer.timeRange}</span>
                  </div>

                  <div className="p-3 bg-[#E9EDF0]/60 border border-[#252D36]/20">
                    <span className="text-[#252D36]/60 block text-[10px] uppercase font-bold">
                      PRIMARY SENSOR
                    </span>
                    <span className="text-[#070B10] font-semibold truncate block">
                      {activeLayer.instrument}
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-[#E9EDF0]/60 border border-[#252D36]/20">
                    <span className="text-[#252D36]/60 block text-[10px] uppercase font-bold">
                      GEOGRAPHIC EXTENT
                    </span>
                    <span className="text-[#070B10] font-semibold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FF5938] shrink-0" />
                      <span>{activeLayer.geographicExtent}</span>
                    </span>
                  </div>

                  <div className="col-span-2 p-3 bg-[#E9EDF0]/60 border border-[#252D36]/20">
                    <span className="text-[#252D36]/60 block text-[10px] uppercase font-bold">
                      AUTHENTIC NASA VISUALIZATION
                    </span>
                    <span className="text-[#070B10] font-semibold flex items-center justify-between">
                      <span>{activeLayer.nasaVisualization}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5938] shrink-0" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Listen & Jukebox Navigation */}
              <div className="pt-4 border-t border-[#252D36]/20 flex flex-col sm:flex-row gap-3">
                <MagneticButton
                  onClick={() => handleOpenStory()}
                  cursorLabel="STORY"
                  variant="primary"
                  size="md"
                  className="flex-1 py-3.5 px-5 font-black tracking-widest gap-2"
                >
                  <BookOpen className="w-4 h-4 text-[#070B10]" />
                  <span>EXPLORE SCIENTIFIC STORY</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#070B10]" />
                </MagneticButton>

                <MagneticButton
                  onClick={handleListenToData}
                  cursorLabel="LISTEN"
                  variant="custom"
                  size="md"
                  className="py-3.5 px-5 font-bold tracking-wider uppercase border-2 border-[#252D36] hover:bg-[#070B10] hover:text-[#E9EDF0] text-[#070B10] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Headphones className="w-4 h-4" />
                  <span>LISTEN TO DATA</span>
                </MagneticButton>

                <MagneticButton
                  onClick={handleViewInJukebox}
                  cursorLabel="JUKEBOX"
                  variant="custom"
                  size="md"
                  className="py-3.5 px-4 font-bold tracking-wider uppercase border border-[#252D36]/40 hover:bg-[#070B10] hover:text-[#E9EDF0] text-[#7E8B98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  title="Open Jukebox Laboratory"
                >
                  <span>JUKEBOX</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
