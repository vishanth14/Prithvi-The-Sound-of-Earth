import React, { useRef } from 'react';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { EARTH_DATASETS } from '../../data/earthDatasets';
import { gsap, useGSAP } from '../../lib/gsap';
import type { DatasetKey } from '../../data/types';
import type { EicDatasetKey } from '../../data/eicSchemas';
import { scrollState } from '../../lib/scrollState';
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
      'Comprehensive estimate of global surface temperature anomalies combining meteorological stations, Antarctic boreholes, and ocean buoy sea-surface measurements.',
    nasaVisualization: 'NASA SVS #5190 Climate Spiral & EIC Global Anomaly Visualizer',
    dataSource: 'NASA Goddard Institute for Space Studies (GISS)',
    leadAgency: 'NASA Earth Science Division',
    instrument: 'GHCNv4 Meteorological Sensors & ERSSTv5 Ocean Buoys',
    unit: '°C Anomaly (vs 1951–1980 baseline)',
    timeRange: '1880 – 2024 (Annual Benchmark Series)',
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

  const handleBackToOverview = () => {
    selectSentinel(null);
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
                CHAPTER 02 // EARTH OBSERVATION JOURNEY
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
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
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

          {/* Verified Climate Sentinels Quick Nav */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            <span className="font-mono text-xs text-[#252D36] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#FF5938]" />
              CLIMATE SENTINELS:
            </span>
            {CLIMATE_SENTINELS.map((s) => {
              const isSelected = activeSentinelId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSentinel(isSelected ? null : s.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF5938] text-[#070B10] font-bold border border-[#FF5938]'
                      : 'bg-white text-[#252D36] border border-[#252D36]/30 hover:border-[#FF5938]'
                  }`}
                >
                  <span className="w-2 h-2" style={{ backgroundColor: s.color }} />
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[10px] text-[#252D36]/60">({s.stationCode})</span>
                </button>
              );
            })}
            {activeSentinelId && (
              <button
                onClick={handleBackToOverview}
                className="px-3 py-1.5 text-xs font-mono text-[#070B10] font-bold underline cursor-pointer ml-auto hover:text-[#FF5938]"
              >
                RESET TO GLOBAL OVERVIEW
              </button>
            )}
          </div>
        </div>

        {/* Main 3D Canvas Viewport & Comprehensive Scientific Detail Panel */}
        <div className="explorer-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3D Earth Globe Canvas Viewport */}
          <div className="lg:col-span-7 relative min-h-[520px] sm:min-h-[660px] bg-[#070B10]/40 border-2 border-[#252D36] overflow-hidden flex flex-col justify-between p-6 sm:p-8 shadow-sm backdrop-blur-xs pointer-events-auto">
            {/* Viewport Top Header */}
            <div className="relative z-20 flex items-center justify-between">
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
                {activeSentinelId && (
                  <button
                    onClick={handleBackToOverview}
                    className="px-3 py-1.5 border border-[#FF5938] bg-[#FF5938]/15 hover:bg-[#FF5938] text-[#FF5938] hover:text-[#070B10] text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    RESET VIEW
                  </button>
                )}
                <button
                  onClick={() => setGlobeRotating(!globeRotating)}
                  className={`p-2 border text-xs font-mono transition-all cursor-pointer ${
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

            {/* 3D Interactive Aperture Viewport (Persistent Earth shines through) */}
            <div
              className="absolute inset-0 z-10 pointer-events-auto cursor-grab active:cursor-grabbing"
              data-cursor-label="ORBIT 3D"
              onPointerDown={() => {
                scrollState.isInteractingWithGlobe = true;
              }}
              onPointerUp={() => {
                scrollState.isInteractingWithGlobe = false;
              }}
            >
              {/* Corner HUD crosshairs for precision scientific aperture */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF5938]/60 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF5938]/60 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF5938]/60 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF5938]/60 pointer-events-none" />
            </div>

            {/* Viewport Bottom Overlay: Interactive Instructions */}
            <div className="relative z-20 flex flex-wrap items-end justify-between pt-4 border-t border-[#252D36] text-xs font-mono text-[#7E8B98]">
              <div className="flex flex-col gap-1">
                <span className="text-[#83BBD5] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 bg-[#FF5938]" />
                  DRAG GLOBE TO ROTATE • SCROLL TO ZOOM • SELECT BEACONS
                </span>
                <span className="text-[11px] text-[#7E8B98]">
                  RAYLEIGH SCATTERING WITH GEOGRAPHICALLY VERIFIED OBSERVATORIES
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-[#7E8B98]">POLAR TILT: </span>
                <span className="text-[#E9EDF0] font-semibold">23.44° EQUATORIAL EPOCH</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Scientific Detail Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between pointer-events-auto">
            {/* Active Climate Sentinel Station Card (If Selected or Hovered) */}
            {currentSentinel ? (
              <div className="border-2 border-[#FF5938] bg-[#070B10] text-[#E9EDF0] p-6 sm:p-7 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#252D36]">
                    <div className="flex items-center gap-2 text-[#FF5938]">
                      <MapPin className="w-4 h-4 text-[#FF5938]" />
                      <span className="font-mono text-xs uppercase tracking-widest font-bold">
                        VERIFIED CLIMATE OBSERVATORY
                      </span>
                    </div>
                    <button
                      onClick={handleBackToOverview}
                      className="text-[#7E8B98] hover:text-white transition-colors cursor-pointer"
                      title="Back to Global Overview"
                      aria-label="Back to Global Overview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-display text-3xl font-extrabold text-[#E9EDF0] uppercase tracking-tight mb-1">
                    {currentSentinel.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs text-[#83BBD5]">
                      {currentSentinel.lat > 0
                        ? `${currentSentinel.lat.toFixed(2)}°N`
                        : `${Math.abs(currentSentinel.lat).toFixed(2)}°S`}
                      ,{' '}
                      {currentSentinel.lng > 0
                        ? `${currentSentinel.lng.toFixed(2)}°E`
                        : `${Math.abs(currentSentinel.lng).toFixed(2)}°W`}
                    </span>
                    <span className="text-[#252D36]">•</span>
                    <span className="font-mono text-xs text-[#7E8B98]">
                      ID: {currentSentinel.stationCode}
                    </span>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-[#E9EDF0]/85 leading-relaxed mb-5 font-normal">
                    {currentSentinel.description}
                  </p>

                  <div className="p-4 bg-[#0E141D] border border-[#252D36] space-y-2 text-xs font-mono mb-5">
                    <div className="flex justify-between">
                      <span className="text-[#7E8B98]">Primary Sensor:</span>
                      <span className="text-[#E9EDF0] truncate max-w-[200px] font-semibold">
                        {currentSentinel.instrument}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7E8B98]">Baseline Reference:</span>
                      <span className="text-[#83BBD5] truncate max-w-[200px] font-semibold">
                        {currentSentinel.baseline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleListenToData}
                    className="flex-1 py-3 px-4 text-xs font-display font-bold tracking-widest uppercase bg-[#FF5938] hover:bg-[#E84C2C] text-[#070B10] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Headphones className="w-4 h-4 text-[#070B10]" />
                    <span>LISTEN TO THIS DATA</span>
                  </button>

                  <button
                    onClick={handleBackToOverview}
                    className="py-3 px-4 text-xs font-display font-bold tracking-wider uppercase border border-[#252D36] hover:border-[#83BBD5] text-[#E9EDF0] transition-colors cursor-pointer text-center"
                  >
                    RESET OVERVIEW
                  </button>
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
                      TIME RANGE
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
                      NASA EIC VISUALIZATION
                    </span>
                    <span className="text-[#070B10] font-semibold flex items-center justify-between">
                      <span>{activeLayer.nasaVisualization}</span>
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5938]" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Listen & Jukebox Navigation */}
              <div className="pt-4 border-t border-[#252D36]/20 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleListenToData}
                  className="flex-1 py-3.5 px-6 text-xs font-display font-bold tracking-widest uppercase bg-[#FF5938] hover:bg-[#E84C2C] text-[#070B10] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Headphones className="w-4 h-4 text-[#070B10]" />
                  <span>LISTEN TO THIS DATA</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#070B10]" />
                </button>

                <button
                  onClick={handleViewInJukebox}
                  className="py-3.5 px-5 text-xs font-display font-bold tracking-wider uppercase border-2 border-[#252D36] hover:bg-[#070B10] hover:text-[#E9EDF0] text-[#070B10] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>VIEW EIC JUKEBOX</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
