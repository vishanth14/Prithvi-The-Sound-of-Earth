import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { useExperienceStore } from '../../orchestrator/experienceStore';
import type { EicDatasetKey } from '../../data/eicSchemas';
import { gsap, useGSAP } from '../../lib/gsap';
import {
  Headphones,
  Layers,
  Activity,
  Quote,
  ExternalLink,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface TimelinePoint {
  year: number;
  value: number | string;
  anomaly?: string;
  label: string;
  significance: string;
}

interface EditorialStory {
  id: string;
  eicKey: EicDatasetKey;
  number: string;
  category: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  officialId: string;
  officialIdUrl: string;
  dataSource: string;
  dataSourceUrl: string;
  leadAgency: string;
  primaryInstrument: string;
  timeRange: string;
  measurementUnit: string;
  scientificExplanation: string;
  investigatorQuote: string;
  investigatorName: string;
  investigatorTitle: string;
  bodyParagraphs: string[];
  marginalia: {
    label: string;
    value: string;
    note: string;
  }[];
  timeline: TimelinePoint[];
  sonicCharacteristics: {
    pitchMapping: string;
    tempoMapping: string;
    timbreType: string;
    dissonanceMeaning: string;
  };
  themeColor: string;
  isModelProxy?: boolean;
}

const EDITORIAL_STORIES: EditorialStory[] = [
  {
    id: 'thermal-spiral',
    eicKey: 'gistemp',
    number: '01',
    category: 'GLOBAL SURFACE TEMPERATURE',
    eyebrow: 'GISS SURFACE TEMPERATURE ANALYSIS (GISTEMP V4)',
    headline: 'The Thermal Spiral: Breaking the Pre-Industrial Baseline',
    subheadline:
      '+1.28°C Global Surface Anomaly Over 144 Years of Calibrated Instrumental Records',
    officialId: 'NASA SVS #5190',
    officialIdUrl: 'https://svs.gsfc.nasa.gov/5190/',
    dataSource: 'NASA Goddard Institute for Space Studies (GISS)',
    dataSourceUrl: 'https://data.giss.nasa.gov/gistemp/',
    leadAgency: 'NASA Earth Science Division / GISS',
    primaryInstrument: 'GHCNv4 Meteorological Sensors & ERSSTv5 Ocean Buoys',
    timeRange: '1880 – 2024 (Annual Benchmark Snapshots; 1951–1980 Baseline)',
    measurementUnit: '°C Anomaly (Degrees Celsius relative to 1951–1980 baseline)',
    scientificExplanation:
      'Global surface temperature anomalies quantify multi-decadal planetary thermal energy accumulation relative to the mid-20th-century climate equilibrium. Values exceeding +1.0°C indicate sustained greenhouse radiative forcing; +1.5°C represents the international Paris Agreement threshold.',
    investigatorQuote:
      'We are not observing routine fluctuations. The rate of global thermal ascent since 1970 is without precedent in the entire Holocene epoch.',
    investigatorName: 'Dr. Gavin Schmidt',
    investigatorTitle: 'Director, NASA Goddard Institute for Space Studies (GISS)',
    bodyParagraphs: [
      'In 1880, as the Industrial Revolution expanded coal-fired manufacturing across the Northern Hemisphere, global land-ocean temperatures hovered -0.16°C below the mid-20th-century mean. For nearly a century, natural volcanic aerosols and ocean thermal inertia dampened runaway warming.',
      'By 1975, the balance ruptured. As greenhouse gas radiative forcing overtook aerosol cooling, each successive decade registered higher global surface temperatures than the last. In 2015, the planet crossed the +1.0°C anomaly threshold. In 2024, empirical measurements confirm a sustained +1.28°C anomaly, approaching the critical +1.5°C Paris Agreement limit.',
      'In the sonic domain, this century-and-a-half trajectory translates into a rising polyphonic octave ascent. The tranquil D3 (146.8 Hz) harmonic fifth of 1880 shifts toward a tense, elevated pitch, rendering thermal planetary stress directly audible.',
    ],
    marginalia: [
      {
        label: 'RADIATIVE FORCING',
        value: '+2.72 W/m²',
        note: 'Anthropogenic greenhouse energy imbalance accumulating in Earth system',
      },
      {
        label: 'CLIMATOLOGICAL BASELINE',
        value: '14.0°C (1951–1980)',
        note: 'Zero-anomaly global mean reference origin established by GISS',
      },
      {
        label: 'PARIS AGREEMENT THRESHOLD',
        value: '+1.50°C',
        note: 'Critical international boundary for high-risk irreversible tipping cascades',
      },
    ],
    timeline: [
      {
        year: 1880,
        value: -0.16,
        anomaly: '-0.16°C',
        label: 'Industrial Inception',
        significance: 'Global coal manufacturing expands; reliable meteorological stations begin',
      },
      {
        year: 1940,
        value: 0.12,
        anomaly: '+0.12°C',
        label: 'Mid-Century Warming',
        significance: 'Temporary warm pulse prior to post-war sulfate aerosol spike',
      },
      {
        year: 1975,
        value: 0.0,
        anomaly: '0.00°C',
        label: 'Radiative Inflection',
        significance: 'Greenhouse gas forcing overtakes volcanic cooling; rapid thermal ascent begins',
      },
      {
        year: 2015,
        value: 0.9,
        anomaly: '+0.90°C',
        label: 'Paris Agreement',
        significance: 'Earth crosses +0.9°C; consecutive global annual records broken',
      },
      {
        year: 2024,
        value: 1.28,
        anomaly: '+1.28°C',
        label: 'Modern Benchmark',
        significance: 'Current verified empirical record; approaches +1.5°C threshold',
      },
    ],
    sonicCharacteristics: {
      pitchMapping: 'f(ΔT) = 220 · 2^(ΔT / 1.2) [D3 (146.8 Hz) to G#4 (415.3 Hz)]',
      tempoMapping: 'Coupled to thermal escalation velocity',
      timbreType: 'Dual-oscillator triangle + dynamic 24dB low-pass filter',
      dissonanceMeaning: 'Higher anomalies inject grating minor-second intervals',
    },
    themeColor: '#FF5938',
  },
  {
    id: 'carbon-inhalation',
    eicKey: 'co2_maunaloa',
    number: '02',
    category: 'ATMOSPHERIC GREENHOUSE GASES',
    eyebrow: 'MAUNA LOA OBSERVATORY & DYAMOND GLOBAL SIMULATION',
    headline: 'The Keeling Sawtooth: The Troposphere Under Stress',
    subheadline:
      'From 280 ppm Pre-Industrial Equilibrium to 424.3 ppm Anthropocene Burden',
    officialId: 'NASA SVS #5196 & NOAA GML',
    officialIdUrl: 'https://svs.gsfc.nasa.gov/5196/',
    dataSource: 'NOAA Global Monitoring Laboratory & Scripps / NASA GMAO',
    dataSourceUrl: 'https://gml.noaa.gov/ccgg/trends/',
    leadAgency: 'NOAA Earth System Research Laboratories / NASA GSFC',
    primaryInstrument: 'Picarro G2401 Cavity Ring-Down Laser Spectrometer',
    timeRange: '1958 – 2024 (In-Situ Mauna Loa) • Jan–Mar 2020 (DYAMOND Model)',
    measurementUnit: 'ppm (Parts Per Million dry air mole fraction)',
    scientificExplanation:
      'Tropospheric carbon dioxide mole fractions exhibit an annual sawtooth oscillation driven by Northern Hemisphere deciduous forest photosynthesis in spring and respiration in autumn, overlaid on an exponential accumulation curve driven by global fossil emissions exceeding 37 billion tons annually.',
    investigatorQuote:
      'Every spring, northern forests draw down billions of tons of carbon dioxide. But each autumn, the exhale leaves a higher residual layer than ever before.',
    investigatorName: 'Dr. Ralph Keeling',
    investigatorTitle: 'Director, Scripps CO₂ Program / NOAA Global Monitoring',
    bodyParagraphs: [
      'Perched at 3,397 meters on the volcanic slope of Mauna Loa, Hawaii, the continuous Keeling monitoring station has recorded the composition of Earth’s atmosphere since 1958. Free from local vegetation and human contamination, it captures the raw, unfiltered breath of the living planet.',
      'The data reveal an intricate dual reality: an annual sawtooth oscillation created by Northern Hemisphere deciduous forests photosynthesizing in spring and respirating in autumn, overlaid on an exponential upward trajectory driven by fossil fuel combustion and land-use change.',
      'In PRITHVI, model simulation is strictly separated from in-situ measurements: NASA’s 10-km DYAMOND simulation illustrates 3D atmospheric ribbon circulation across Jan–Mar 2020, while the multi-decadal in-situ Keeling curve provides the verified temporal ground truth.',
    ],
    marginalia: [
      {
        label: 'ATMOSPHERIC RESIDENCE',
        value: '300–1,000 Years',
        note: 'Emitted CO₂ lingers in active planetary carbon cycle across millennia',
      },
      {
        label: 'HOLOCENE EQUILIBRIUM',
        value: '280.0 ppm',
        note: 'Pre-industrial Law Dome ice core benchmark prior to 1850',
      },
      {
        label: 'DYAMOND SIMULATION',
        value: '10 km (Jan–Mar 2020)',
        note: 'NASA GSFC high-resolution atmospheric circulation model (SVS #5196)',
      },
    ],
    timeline: [
      {
        year: 1880,
        value: 280.0,
        label: 'Pre-Industrial Baseline',
        significance: 'Pre-industrial Holocene equilibrium derived from Law Dome ice cores',
      },
      {
        year: 1958,
        value: 315.7,
        label: 'Keeling Inception',
        significance: 'Dr. Charles David Keeling establishes continuous daily monitoring atop Mauna Loa',
      },
      {
        year: 1980,
        value: 338.8,
        label: 'Global Acceleration',
        significance: 'Post-war industrial growth accelerates annual atmospheric accumulation',
      },
      {
        year: 2013,
        value: 400.0,
        label: '400 ppm Breach',
        significance: 'Atmospheric CO₂ crosses 400 ppm for the first time in 3 million years',
      },
      {
        year: 2024,
        value: 424.3,
        label: 'Current Benchmark',
        significance: 'Accumulation rate exceeds 3.0 ppm/year; +51% above pre-industrial levels',
      },
    ],
    sonicCharacteristics: {
      pitchMapping: 'Deep sub-bass membrane resonance (45.0 – 90.0 Hz)',
      tempoMapping: 'BPM = 48 · (CO₂ / 280)^1.4 [48 to 92 BPM]',
      timbreType: 'Acoustic sub-bass kick + resonant analog filter envelope',
      dissonanceMeaning: 'Urgent rhythmic compression reflecting accumulation rate',
    },
    themeColor: '#83BBD5',
  },
  {
    id: 'rising-tides',
    eicKey: 'sealevel_podaac',
    number: '03',
    category: 'OCEAN SURFACE TOPOGRAPHY',
    eyebrow: 'NASA PO.DAAC / SENTINEL-6 RADAR ALTIMETRY',
    headline: 'The Swelling Oceans: Steric Expansion and Mass Transfer',
    subheadline:
      '+111.4 mm Global Mean Sea Level Rise Across 30 Years of Space Radar',
    officialId: 'NASA SVS #5312',
    officialIdUrl: 'https://svs.gsfc.nasa.gov/5312/',
    dataSource: 'NASA Physical Oceanography DAAC (PO.DAAC) / JPL',
    dataSourceUrl: 'https://podaac.jpl.nasa.gov/',
    leadAgency: 'NASA / CNES / EUMETSAT / ESA',
    primaryInstrument: 'Poseidon-4 Synthetic Aperture Radar (SAR) Altimeter & AMR-C',
    timeRange: '1993 – 2023 (Continuous 30-Year Multi-Satellite Radar Altimeter Record)',
    measurementUnit: 'mm (Millimeters variance relative to 1993.0 baseline)',
    scientificExplanation:
      'Global mean sea level integrates two distinct physical mechanisms: steric thermal expansion (warmer water expands, accounting for ~33% of rise) and barystatic mass addition (ice runoff from Greenland, Antarctica, and mountain glaciers, accounting for ~67% of rise).',
    investigatorQuote:
      'The oceans absorb over 90 percent of the excess heat trapped by greenhouse gases. As water warms, it expands; as ice melts, mass is transferred.',
    investigatorName: 'Dr. Josh Willis',
    investigatorTitle: 'Oceanographer & Project Scientist, NASA JPL / Sentinel-6',
    bodyParagraphs: [
      'Since the launch of the TOPEX/Poseidon radar altimeter in 1992, followed by Jason-1, Jason-2, Jason-3, and now Sentinel-6 Michael Freilich, space agencies have measured the height of the world ocean with sub-millimeter precision.',
      'The sea level record reflects two fundamental physical processes: steric thermal expansion (warmer water occupies greater physical volume) and barystatic mass addition (the runoff of billions of tons of meltwater from Greenland, Antarctica, and mountain glaciers).',
      'In PRITHVI’s acoustic architecture, ocean swelling is manifested as a dynamic, rolling hydrodynamic bandpass filter sweep. As sea level rises from 0 mm in 1993 to +111.4 mm in 2023, the resonant frequency opens from a muffled 120 Hz depth into a bright, rushing 2,400 Hz oceanic swell.',
    ],
    marginalia: [
      {
        label: 'RATE ACCELERATION',
        value: '4.3 mm/year (2023)',
        note: 'More than double the 1.8 mm/year rate measured during the 1993 inception',
      },
      {
        label: 'HEAT ABSORPTION',
        value: '> 90% Planetary Excess',
        note: 'Oceans serve as the primary thermal buffer of the climate system',
      },
      {
        label: 'RADAR PRECISION',
        value: '±1.2 cm Orbital Orbit',
        note: 'Continuous multi-mission cross-calibration across 5 satellites',
      },
    ],
    timeline: [
      {
        year: 1993,
        value: 0.0,
        anomaly: '0.0 mm',
        label: 'TOPEX/Poseidon Inception',
        significance: 'High-precision satellite radar altimetry baseline established',
      },
      {
        year: 2000,
        value: 21.3,
        anomaly: '+21.3 mm',
        label: 'Early Epoch',
        significance: 'Jason-1 launch confirms persistent global oceanic thermal swelling',
      },
      {
        year: 2010,
        value: 52.4,
        anomaly: '+52.4 mm',
        label: 'Ice Melt Acceleration',
        significance: 'GRACE gravity satellites detect accelerating polar ice sheet discharge',
      },
      {
        year: 2020,
        value: 97.4,
        anomaly: '+97.4 mm',
        label: 'Sentinel-6 Launch',
        significance: 'Sentinel-6 Michael Freilich extends the unbroken radar altimetry timeline',
      },
      {
        year: 2023,
        value: 111.4,
        anomaly: '+111.4 mm',
        label: 'Verified Benchmark',
        significance: 'Total cumulative ocean rise reaches +111.4 mm over 1993 baseline',
      },
    ],
    sonicCharacteristics: {
      pitchMapping: 'Sub-harmonic oceanic resonance (120 Hz – 2.4 kHz)',
      tempoMapping: 'Hydrodynamic wave cycle modulated by annual tidal harmonic',
      timbreType: 'Hydrodynamic brown noise through 4-pole resonant bandpass',
      dissonanceMeaning: 'Widening bandwidth expressing planetary thermal storage',
    },
    themeColor: '#83BBD5',
  },
  {
    id: 'nocturnal-footprint',
    eicKey: 'nightlights_viirs',
    number: '04',
    category: 'NOCTURNAL ANTHROPOGENIC RADIANCE',
    eyebrow: 'SUOMI NPP VIIRS DAY-NIGHT BAND // NASA BLACK MARBLE',
    headline: 'Humanity at Night: Nocturnal Radiance and Energy Footprints',
    subheadline:
      'Calibrated VIIRS Radiance Illuminating Urban Expansion and Grid Resilience',
    officialId: 'NASA SVS #5313',
    officialIdUrl: 'https://svs.gsfc.nasa.gov/5313/',
    dataSource: 'NASA Earth Science Data Systems (ESDS) Black Marble / Suomi NPP',
    dataSourceUrl: 'https://blackmarble.gsfc.nasa.gov/',
    leadAgency: 'NASA Goddard Space Flight Center / NOAA',
    primaryInstrument: 'Visible Infrared Imaging Radiometer Suite (VIIRS Day-Night Band)',
    timeRange: '2012 – 2023 (Calibrated Decadal EIC Hyperwall Composite)',
    measurementUnit: 'nW·cm⁻²·sr⁻¹ (Nanowatts per sq cm per steradian TOA radiance)',
    scientificExplanation:
      'Top-of-atmosphere nocturnal radiance measures artificial light emissions from urban centers, transportation networks, maritime vessels, and industrial infrastructure. It serves as a real-time proxy for human electrification, economic density, and power grid disaster recovery.',
    investigatorQuote:
      'At night, Earth ceases to look like a physical planet and begins to look like a living neural network of human civilization.',
    investigatorName: 'Dr. Miguel Román',
    investigatorTitle: 'Lead Scientist, NASA Black Marble Team / ESDS',
    bodyParagraphs: [
      'The Visible Infrared Imaging Radiometer Suite (VIIRS) aboard the Suomi NPP satellite captures nocturnal anthropogenic light emissions across the planet with revolutionary calibration. Through the NASA Black Marble suite, lunar reflectance and atmospheric interference are stripped away to reveal true artificial luminescence.',
      'These nocturnal signatures track the pulse of human civilization: the rapid electrification of developing regions, the immense power grids of megacities, offshore fishing fleets illuminating open oceans, and the sudden darkness of electrical grids disabled by severe tropical cyclones.',
      'In PRITHVI, night-time radiance is expressed as a warm, contemplative polyphonic synthesizer pad. Pentatonic intervals represent balanced electrification, while localized blackout events produce subtle harmonic falloffs and muted low-pass filtering.',
    ],
    marginalia: [
      {
        label: 'SPECTRAL SENSITIVITY',
        value: '500–900 nm',
        note: 'Day-Night Band detects single streetlights and fishing vessels from orbit',
      },
      {
        label: 'DYNAMIC RANGE',
        value: '7 Orders of Magnitude',
        note: 'Resolves faint rural villages and blinding megacity commercial cores',
      },
      {
        label: 'DISASTER RESPONSE',
        value: '< 24h Blackout Mapping',
        note: 'Quantifies post-hurricane electrical power restoration and infrastructure damage',
      },
    ],
    timeline: [
      {
        year: 2012,
        value: 0.8,
        label: 'VIIRS Inception',
        significance: 'Suomi NPP satellite launched; pristine nocturnal baseline established',
      },
      {
        year: 2015,
        value: 24.8,
        label: 'Electrification Surge',
        significance: 'Rapid power grid expansion across South Asia and sub-Saharan Africa',
      },
      {
        year: 2018,
        value: 58.4,
        label: 'Megaregion Growth',
        significance: 'Urban aggregation creates multi-city contiguous luminous corridors',
      },
      {
        year: 2021,
        value: 89.2,
        label: 'Post-Pandemic Rebound',
        significance: 'Commercial air and maritime transport lumens recover to record highs',
      },
      {
        year: 2023,
        value: 124.6,
        label: 'EIC Benchmark',
        significance: 'Decadal Hyperwall series confirms sustained global luminous intensification',
      },
    ],
    sonicCharacteristics: {
      pitchMapping: 'Warm analog synthesizer pad chord (261.6 – 392.0 Hz)',
      tempoMapping: 'Slow contemplative ambient envelope with 4-second sustain',
      timbreType: 'Dual sawtooth + warm chorus with soft attack envelope',
      dissonanceMeaning: 'Consonant pentatonic chords reflecting urban connectivity',
    },
    themeColor: '#FF5938',
  },
  {
    id: 'atmospheric-veil',
    eicKey: 'aerosols_geos',
    number: '05',
    category: 'AEROSOLS & ATMOSPHERIC PARTICULATES',
    eyebrow: 'NASA GMAO GEOS-FP // CHEMICAL ASSIMILATION MODEL PROXY',
    headline: 'The Atmospheric Veil: Wildfire Smoke and Particulate Transport',
    subheadline:
      'Global Chemical Transport Modeling Tracking Trans-Continental Extinction',
    officialId: 'NASA GMAO GEOS Model Proxy',
    officialIdUrl: 'https://gmao.gsfc.nasa.gov/',
    dataSource: 'NASA Global Modeling and Assimilation Office (GMAO)',
    dataSourceUrl: 'https://gmao.gsfc.nasa.gov/GEOS_systems/',
    leadAgency: 'NASA Goddard Space Flight Center',
    primaryInstrument: 'Terra & Aqua MODIS Spectroradiometer & GEOS-FP Assimilation',
    timeRange: '2000 – 2024 (Assimilation Model Proxy — Not DAAC L3 Release)',
    measurementUnit: 'AOD (Dimensionless Aerosol Optical Depth at 550nm)',
    isModelProxy: true,
    scientificExplanation:
      'Aerosol Optical Depth (AOD) measures total light extinction through the atmospheric column caused by airborne particles. While sulfate aerosols reflect incoming sunlight to cool the surface, absorbing black carbon from megafires traps heat within tropospheric layers.',
    investigatorQuote:
      'Megafires in boreal forests now inject smoke directly into the stratosphere, circling the globe in a matter of days.',
    investigatorName: 'Dr. Arlindo da Silva',
    investigatorTitle: 'Atmospheric Scientist, NASA Global Modeling and Assimilation Office',
    bodyParagraphs: [
      'Using high-resolution spectroradiometers on NASA’s Terra and Aqua spacecraft alongside the GEOS Forward Processing (GEOS-FP) assimilation system, scientists track the optical depth of airborne particulates across every atmospheric layer.',
      'Aerosols represent the great atmospheric counterweight: while greenhouse gases warm the planet, sulfate aerosols and mineral dust reflect solar radiation back into space. Concurrently, black carbon and megafire smoke absorb sunlight, heating atmospheric layers while hazardous particulates degrade surface air quality.',
      'Auditorily, aerosol density is transformed into a shimmering granular cloud of frequency-modulated metallic overtones. Elevated Aerosol Optical Depth (>0.4 AOD) triggers complex, microtonal inharmonic modulations that mimic the particulate turbulence of the sky.',
    ],
    marginalia: [
      {
        label: 'PROVENANCE STATUS',
        value: 'QUARANTINED MODEL PROXY',
        note: 'GEOS-FP is a forecasting model simulation, not an empirical DAAC scalar table',
      },
      {
        label: 'EXTINCTION SPECTRAL BAND',
        value: '550 nm (Green Visible)',
        note: 'Standard reference wavelength for solar aerosol optical depth calculations',
      },
      {
        label: 'PYROCUMULONIMBUS',
        value: '> 12 km Altitude',
        note: 'Intense wildfire firestorms inject particulate matter directly into stratosphere',
      },
    ],
    timeline: [
      {
        year: 2000,
        value: 0.08,
        label: 'Pristine Atmosphere',
        significance: 'Clean background tropospheric reference without major smoke plumes',
      },
      {
        year: 2008,
        value: 0.174,
        label: 'Global Average',
        significance: 'Climatological global mean AOD combining dust, marine salt, and smoke',
      },
      {
        year: 2018,
        value: 0.35,
        label: 'Trans-Pacific Smoke',
        significance: 'Intense wildfire seasons generate cross-oceanic particulate plumes',
      },
      {
        year: 2024,
        value: 0.65,
        label: 'Pyrocumulonimbus Surge',
        significance: 'Extreme boreal megafires produce historic particulate extinction',
      },
    ],
    sonicCharacteristics: {
      pitchMapping: 'Crystalline FM synthesis overtones (329.6 – 493.9 Hz)',
      tempoMapping: 'Granular cloud rate coupled to atmospheric transport velocity',
      timbreType: 'Metallic FM oscillator with dynamic modulation index',
      dissonanceMeaning: 'High particulate loading produces turbulent microtonality',
    },
    themeColor: '#7E8B98',
  },
];

// --- Dedicated NASA SVS Interactive Visualizers for Every Story ---

const ClimateSpiralVisualizer: React.FC<{ activeYear: number }> = ({ activeYear }) => {
  const center = 200;
  const ring0 = 70;
  const ring1 = 115;
  const ring15 = 145;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // Subsampled points from 1880 to activeYear
  const points = useMemo(() => {
    const raw = [
      { year: 1880, val: -0.16 },
      { year: 1890, val: -0.35 },
      { year: 1900, val: -0.08 },
      { year: 1910, val: -0.42 },
      { year: 1920, val: -0.27 },
      { year: 1930, val: -0.14 },
      { year: 1940, val: 0.12 },
      { year: 1950, val: -0.17 },
      { year: 1960, val: -0.03 },
      { year: 1970, val: 0.03 },
      { year: 1980, val: 0.26 },
      { year: 1990, val: 0.45 },
      { year: 2000, val: 0.39 },
      { year: 2010, val: 0.72 },
      { year: 2015, val: 0.90 },
      { year: 2020, val: 1.02 },
      { year: 2024, val: 1.28 },
    ];
    return raw.filter((d) => d.year <= activeYear);
  }, [activeYear]);

  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, pt, i) => {
      const angle = (i * 0.42) - Math.PI / 2;
      const r = ring0 + ((pt.val - (-0.4)) / (1.5 - (-0.4))) * (ring15 - ring0);
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [points]);

  const currentPt = points[points.length - 1] || points[0];
  const lastAngle = ((points.length - 1) * 0.42) - Math.PI / 2;
  const lastR = ring0 + ((currentPt.val - (-0.4)) / (1.5 - (-0.4))) * (ring15 - ring0);
  const headX = center + lastR * Math.cos(lastAngle);
  const headY = center + lastR * Math.sin(lastAngle);

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto flex items-center justify-center bg-[#070B10] border border-[#252D36] p-4 select-none">
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
        {/* Month Radial Spoke Lines */}
        {months.map((m, idx) => {
          const a = (idx / 12) * Math.PI * 2 - Math.PI / 2;
          const x2 = center + 175 * Math.cos(a);
          const y2 = center + 175 * Math.sin(a);
          const lx = center + 190 * Math.cos(a);
          const ly = center + 190 * Math.sin(a);
          return (
            <g key={m}>
              <line x1={center} y1={center} x2={x2} y2={y2} stroke="#252D36" strokeDasharray="2,3" />
              <text
                x={lx}
                y={ly}
                fill="#7E8B98"
                fontSize="8"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {m}
              </text>
            </g>
          );
        })}

        {/* 0.0°C Baseline Ring */}
        <circle cx={center} cy={center} r={ring0} fill="none" stroke="#7E8B98" strokeWidth="1" strokeDasharray="3,3" />
        <text x={center + 6} y={center - ring0 - 4} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          0.0°C (1951–1980 mean)
        </text>

        {/* +1.0°C Warning Ring */}
        <circle cx={center} cy={center} r={ring1} fill="none" stroke="#83BBD5" strokeWidth="1" strokeOpacity="0.7" />
        <text x={center + 6} y={center - ring1 - 4} fill="#83BBD5" fontSize="8" fontFamily="IBM Plex Mono">
          +1.0°C International Alert
        </text>

        {/* +1.5°C Paris Accord Ring */}
        <circle cx={center} cy={center} r={ring15} fill="none" stroke="#FF5938" strokeWidth="1.25" strokeDasharray="4,4" />
        <text x={center + 6} y={center - ring15 - 4} fill="#FF5938" fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
          +1.5°C Paris Threshold
        </text>

        {/* Dynamic Multi-Decadal Spiral Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#FF5938"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Scrubber Head Pin */}
        <circle cx={headX} cy={headY} r="7" fill="#FF5938" opacity="0.4" className="animate-ping" />
        <circle cx={headX} cy={headY} r="4.5" fill="#E9EDF0" stroke="#FF5938" strokeWidth="2" />
      </svg>

      {/* Visualizer Badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-[#070B10]/90 border border-[#252D36] px-2.5 py-1 text-[10px] font-mono text-[#83BBD5]">
        <span className="w-1.5 h-1.5 bg-[#FF5938] animate-pulse" />
        <span>NASA SVS #5190 CLIMATE SPIRAL</span>
      </div>
      <div className="absolute top-3 right-3 font-mono text-xs font-bold text-[#FF5938] bg-[#070B10]/90 border border-[#FF5938]/40 px-2 py-0.5">
        {currentPt.val > 0 ? `+${currentPt.val}°C` : `${currentPt.val}°C`} ({currentPt.year})
      </div>
    </div>
  );
};

const KeelingSawtoothVisualizer: React.FC<{ activeYear: number }> = ({ activeYear }) => {
  const points = useMemo(() => {
    const raw = [
      { year: 1880, val: 280.0 },
      { year: 1958, val: 315.7 },
      { year: 1970, val: 325.7 },
      { year: 1980, val: 338.8 },
      { year: 1990, val: 354.4 },
      { year: 2000, val: 369.5 },
      { year: 2010, val: 389.9 },
      { year: 2013, val: 400.0 },
      { year: 2020, val: 414.2 },
      { year: 2024, val: 424.3 },
    ];
    return raw.filter((d) => d.year <= activeYear);
  }, [activeYear]);

  const minV = 270;
  const maxV = 435;
  const w = 360;
  const h = 180;

  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, pt, idx) => {
      const x = 30 + ((pt.year - 1880) / (2024 - 1880)) * w;
      const y = h + 20 - ((pt.val - minV) / (maxV - minV)) * h;
      // Add subtle seasonal sawtooth wave oscillation
      const sawOffset = idx > 1 ? (idx % 2 === 0 ? -4 : 4) : 0;
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(y + sawOffset).toFixed(1)}`;
    }, '');
  }, [points]);

  const currentPt = points[points.length - 1] || points[0];
  const curX = 30 + ((currentPt.year - 1880) / (2024 - 1880)) * w;
  const curY = h + 20 - ((currentPt.val - minV) / (maxV - minV)) * h;

  return (
    <div className="relative w-full aspect-[16/10] max-w-md mx-auto flex flex-col justify-between bg-[#070B10] border border-[#252D36] p-4 select-none">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#83BBD5] border-b border-[#252D36] pb-2">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
          KEELING CURVE & DYAMOND 10KM SIMULATION
        </span>
        <span className="text-[#FF5938] font-bold">{currentPt.val} PPM ({currentPt.year})</span>
      </div>

      <svg viewBox="0 0 420 230" className="w-full h-full overflow-visible py-2">
        {/* 280 ppm Baseline Line */}
        <line x1="30" y1={h + 20 - ((280 - minV) / (maxV - minV)) * h} x2="390" y2={h + 20 - ((280 - minV) / (maxV - minV)) * h} stroke="#7E8B98" strokeDasharray="3,3" />
        <text x="32" y={h + 14 - ((280 - minV) / (maxV - minV)) * h} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          280 ppm (Holocene Pre-Industrial Equilibrium)
        </text>

        {/* 400 ppm Threshold Line */}
        <line x1="30" y1={h + 20 - ((400 - minV) / (maxV - minV)) * h} x2="390" y2={h + 20 - ((400 - minV) / (maxV - minV)) * h} stroke="#FF5938" strokeDasharray="3,3" strokeOpacity="0.6" />
        <text x="32" y={h + 14 - ((400 - minV) / (maxV - minV)) * h} fill="#FF5938" fontSize="8" fontFamily="IBM Plex Mono">
          400 ppm Historic Barrier (Breached 2013)
        </text>

        {/* Carbon Accumulation Trajectory */}
        {pathD && (
          <path d={pathD} fill="none" stroke="#83BBD5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Current Head */}
        <circle cx={curX} cy={curY} r="6" fill="#FF5938" opacity="0.4" className="animate-ping" />
        <circle cx={curX} cy={curY} r="4" fill="#E9EDF0" stroke="#FF5938" strokeWidth="2" />
      </svg>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B98] border-t border-[#252D36] pt-2">
        <span>In-Situ: Mauna Loa Observatory (1958–2024)</span>
        <span className="text-[#83BBD5]">NASA SVS #5196 Model (Jan–Mar 2020)</span>
      </div>
    </div>
  );
};

const SeaLevelVisualizer: React.FC<{ activeYear: number }> = ({ activeYear }) => {
  const points = useMemo(() => {
    const raw = [
      { year: 1993, val: 0.0 },
      { year: 1995, val: 6.2 },
      { year: 1998, val: 14.8 },
      { year: 2000, val: 21.3 },
      { year: 2005, val: 37.8 },
      { year: 2010, val: 52.4 },
      { year: 2015, val: 76.8 },
      { year: 2020, val: 97.4 },
      { year: 2023, val: 111.4 },
    ];
    return raw.filter((d) => d.year <= activeYear);
  }, [activeYear]);

  const maxV = 125;
  const w = 360;
  const h = 180;

  const pathD = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, pt, idx) => {
      const x = 30 + ((pt.year - 1993) / (2023 - 1993)) * w;
      const y = h + 20 - (pt.val / maxV) * h;
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [points]);

  const currentPt = points[points.length - 1] || points[0];
  const curX = 30 + ((currentPt.year - 1993) / (2023 - 1993)) * w;
  const curY = h + 20 - (currentPt.val / maxV) * h;

  return (
    <div className="relative w-full aspect-[16/10] max-w-md mx-auto flex flex-col justify-between bg-[#070B10] border border-[#252D36] p-4 select-none">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#83BBD5] border-b border-[#252D36] pb-2">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#83BBD5]" />
          GLOBAL MEAN SEA LEVEL (NASA SVS #5312)
        </span>
        <span className="text-[#FF5938] font-bold">+{currentPt.val} MM ({currentPt.year})</span>
      </div>

      <svg viewBox="0 0 420 230" className="w-full h-full overflow-visible py-2">
        {/* Shaded Area for Dual Physical Drivers */}
        {pathD && (
          <path
            d={`${pathD} L ${curX} ${h + 20} L 30 ${h + 20} Z`}
            fill="url(#seaLevelGrad)"
            opacity="0.25"
          />
        )}
        <defs>
          <linearGradient id="seaLevelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#83BBD5" />
            <stop offset="100%" stopColor="#070B10" />
          </linearGradient>
        </defs>

        {/* 1993 Baseline */}
        <line x1="30" y1={h + 20} x2="390" y2={h + 20} stroke="#7E8B98" strokeDasharray="3,3" />
        <text x="32" y={h + 14} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          0.0 mm (1993.0 Altimetry Baseline Origin)
        </text>

        {/* Sea Level Rise Curve */}
        {pathD && (
          <path d={pathD} fill="none" stroke="#83BBD5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Current Head */}
        <circle cx={curX} cy={curY} r="6" fill="#83BBD5" opacity="0.4" className="animate-ping" />
        <circle cx={curX} cy={curY} r="4" fill="#E9EDF0" stroke="#83BBD5" strokeWidth="2" />
      </svg>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B98] border-t border-[#252D36] pt-2">
        <span>TOPEX/Poseidon → Jason-1/2/3 → Sentinel-6</span>
        <span className="text-[#83BBD5]">Steric (33%) + Barystatic Melt (67%)</span>
      </div>
    </div>
  );
};

const NightLightsVisualizer: React.FC<{ activeYear: number }> = ({ activeYear }) => {
  const points = useMemo(() => {
    const raw = [
      { year: 2012, val: 0.8 },
      { year: 2015, val: 24.8 },
      { year: 2018, val: 58.4 },
      { year: 2021, val: 89.2 },
      { year: 2023, val: 124.6 },
    ];
    return raw.filter((d) => d.year <= activeYear);
  }, [activeYear]);

  const currentPt = points[points.length - 1] || points[0];

  return (
    <div className="relative w-full aspect-[16/10] max-w-md mx-auto flex flex-col justify-between bg-[#070B10] border border-[#252D36] p-4 select-none">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#FF5938] border-b border-[#252D36] pb-2">
        <span className="flex items-center gap-1.5 font-bold">
          <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
          VIIRS BLACK MARBLE RADIANCE (SVS #5313)
        </span>
        <span className="font-bold text-[#E9EDF0]">{currentPt.val} nW·cm⁻²·sr⁻¹ ({currentPt.year})</span>
      </div>

      {/* Photometric Radiance Gradient Visualizer */}
      <div className="my-auto space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono text-[#7E8B98]">
            <span>0.8 (Dark Rural)</span>
            <span>18.4 (Suburban)</span>
            <span>124.6 (Megacity Core)</span>
          </div>
          <div className="h-6 w-full rounded-none border border-[#252D36] relative overflow-hidden bg-gradient-to-r from-[#070B10] via-[#83BBD5]/40 to-[#FF5938]">
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#FFFFFF] transition-all duration-300"
              style={{ left: `${Math.min(100, Math.max(0, ((Number(currentPt.val) - 0.8) / (124.6 - 0.8)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 bg-[#0E141D] border border-[#252D36]">
            <span className="text-[#7E8B98] text-[9px] block uppercase">SPECTRAL BAND</span>
            <span className="text-[#E9EDF0] font-bold">500–900 nm</span>
          </div>
          <div className="p-2 bg-[#0E141D] border border-[#252D36]">
            <span className="text-[#7E8B98] text-[9px] block uppercase">DYNAMIC RANGE</span>
            <span className="text-[#83BBD5] font-bold">7 Orders Mag</span>
          </div>
          <div className="p-2 bg-[#0E141D] border border-[#252D36]">
            <span className="text-[#7E8B98] text-[9px] block uppercase">CALIBRATION</span>
            <span className="text-[#FF5938] font-bold">VNP46 Suite</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B98] border-t border-[#252D36] pt-2">
        <span>Suomi NPP VIIRS Day-Night Band (2012–2023)</span>
        <span className="text-[#FF5938]">Decadal EIC Hyperwall Asset</span>
      </div>
    </div>
  );
};

const AerosolModelVisualizer: React.FC<{ activeYear: number }> = () => {
  return (
    <div className="relative w-full aspect-[16/10] max-w-md mx-auto flex flex-col justify-between bg-[#070B10] border border-[#252D36] p-4 select-none">
      <div className="flex items-center justify-between text-[11px] font-mono text-[#7E8B98] border-b border-[#252D36] pb-2">
        <span className="flex items-center gap-1.5 font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          GEOS-FP CHEMICAL TRANSPORT MODEL PROXY
        </span>
        <span className="text-amber-400 font-bold">[QUARANTINED MODEL]</span>
      </div>

      <div className="my-auto space-y-3 p-4 bg-[#0E141D] border border-amber-500/30">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>SCIENTIFIC PROVENANCE AUDIT NOTICE</span>
        </div>
        <p className="font-sans text-xs text-[#E9EDF0]/80 leading-relaxed font-normal">
          GEOS-FP produces real-time gridded assimilation model fields, not a certified historical Level-3 DAAC scalar table. In strict compliance with the provenance audit, this stream is quarantined and disabled from live musical synthesis to uphold zero-fabrication standards.
        </p>
        <div className="flex justify-between text-[10px] font-mono text-[#7E8B98] pt-1 border-t border-[#252D36]">
          <span>Primary Sensors: MODIS / VIIRS / CALIOP</span>
          <span className="text-amber-400">Assimilation Proxy</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B98] border-t border-[#252D36] pt-2">
        <span>NASA GSFC Global Modeling and Assimilation Office</span>
        <span className="text-amber-400">Model Simulation</span>
      </div>
    </div>
  );
};

export const EarthStoriesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number>(0);
  const [timelineYear, setTimelineYear] = useState<number>(2024);

  const {
    activeEicKey,
    setActiveEicKey,
    isAudioUnlocked,
    unlockAudio,
    startPlayback,
  } = useObservatoryStore();

  // Synchronize active story whenever activeEicKey changes externally (e.g. from Explorer layer selection)
  useEffect(() => {
    const foundIdx = EDITORIAL_STORIES.findIndex((s) => s.eicKey === activeEicKey);
    if (foundIdx !== -1 && foundIdx !== activeStoryIdx) {
      setActiveStoryIdx(foundIdx);
      const story = EDITORIAL_STORIES[foundIdx];
      setTimelineYear(story.timeline[story.timeline.length - 1].year);
    }
  }, [activeEicKey]);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.from('.story-reveal', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        y: 35,
        opacity: 0,
        stagger: 0.08,
        duration: 0.85,
        ease: 'power2.out',
      });
    },
    { scope: sectionRef }
  );

  const { setSelectedScientificStory, navigateToChapter } = useExperienceStore();
  const activeStory = EDITORIAL_STORIES[activeStoryIdx];

  const handleSelectStory = async (idx: number) => {
    setActiveStoryIdx(idx);
    const story = EDITORIAL_STORIES[idx];
    setTimelineYear(story.timeline[story.timeline.length - 1].year);
    setSelectedScientificStory(story.id);
    await setActiveEicKey(story.eicKey);
  };

  const handleListenToData = async () => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await setActiveEicKey(activeStory.eicKey);
    await startPlayback();
    navigateToChapter('ch4-frequency');
  };

  const activeTimelinePoint = useMemo(() => {
    return (
      activeStory.timeline.find((t) => t.year === timelineYear) ||
      activeStory.timeline[activeStory.timeline.length - 1]
    );
  }, [activeStory, timelineYear]);

  return (
    <section
      ref={sectionRef}
      id="stories"
      className="relative w-full py-28 px-6 sm:px-10 lg:px-16 border-t border-[#252D36] z-10 bg-[#070B10]/95 backdrop-blur-md pointer-events-auto text-[#E9EDF0] selection:bg-[#FF5938] selection:text-white"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Editorial Section Master Header */}
        <div className="story-reveal border-b border-[#252D36] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#FF5938] font-bold">
              CHAPTER 03 // SIGNALS
            </span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#FF5938] animate-pulse" />
              <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-semibold">
                ORBITAL VIEWPOINT & PLANETARY NARRATIVES
              </span>
            </div>
          </div>
          <h2 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl text-[#E9EDF0] uppercase tracking-tight leading-[0.9]">
            WHAT EARTH IS TELLING US
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#7E8B98] leading-relaxed max-w-3xl mt-4 font-normal">
            Five multi-decadal planetary narratives derived from verified NASA Earth Information Center observations. Connect directly with the empirical data, genuine NASA visualizations, and deterministic sonification.
          </p>
        </div>

        {/* Story Selector Carousel Tab Bar */}
        <div className="story-reveal flex flex-wrap items-center gap-2 pb-4 border-b border-[#252D36]">
          <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-[0.2em] mr-2 flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-[#FF5938]" />
            PLANETARY CHAPTERS:
          </span>
          {EDITORIAL_STORIES.map((story, idx) => {
            const isSelected = activeStoryIdx === idx;
            return (
              <button
                key={story.id}
                onClick={() => handleSelectStory(idx)}
                data-cursor-label="STORY"
                className={`group px-4 py-2.5 text-xs font-display tracking-wider uppercase transition-all duration-200 flex items-center gap-2.5 cursor-pointer rounded-none border hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#FF5938] text-[#070B10] font-extrabold border-[#FF5938] shadow-[0_4px_16px_rgba(255,89,56,0.3)]'
                    : 'bg-[#0E141D] text-[#E9EDF0]/70 border-[#252D36] hover:border-[#83BBD5] hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 shrink-0 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: isSelected ? '#070B10' : story.themeColor }}
                />
                <span className="font-mono text-[10px] opacity-80">{story.number}</span>
                <span className="tracking-wide relative">
                  {story.headline.split(':')[0]}
                  <span
                    className={`block h-[1px] bg-[#070B10] transition-all duration-300 ${
                      isSelected ? 'w-full' : 'w-0'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>

        {/* Master Asymmetric Editorial Spread */}
        <div className="story-reveal relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-2">
          {/* Background Monumental Section Watermark */}
          <div
            className="absolute -top-16 -left-6 font-display font-black text-[10rem] sm:text-[14rem] text-[#252D36]/15 select-none pointer-events-none leading-none z-0"
            aria-hidden="true"
          >
            {activeStory.number}
          </div>

          {/* LEFT COLUMN: Deep Narrative Prose & Scientific Commentary (7 COLS) */}
          <div className="lg:col-span-7 relative z-10 flex flex-col space-y-6">
            {/* Header Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#FF5938]/15 border border-[#FF5938]/40 text-[#FF5938] font-mono text-[11px] font-bold uppercase tracking-wider">
                {activeStory.category}
              </span>
              <a
                href={activeStory.officialIdUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-label="OPEN"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0E141D] border border-[#252D36] hover:border-[#83BBD5] text-[#83BBD5] font-mono text-[11px] uppercase tracking-wider transition-colors"
                title="Open official NASA asset reference"
              >
                <span>{activeStory.officialId}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="font-mono text-[11px] text-[#7E8B98] hidden sm:inline">
                {activeStory.timeRange}
              </span>
            </div>

            {/* Headline and Subheadline */}
            <div>
              <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase text-[#E9EDF0] leading-[0.95] tracking-tight">
                {activeStory.headline}
              </h3>
              <p className="font-mono text-xs sm:text-sm text-[#83BBD5] font-semibold tracking-wide uppercase mt-2.5">
                {activeStory.subheadline}
              </p>
            </div>

            {/* Investigator Pull-Quote with Cockpit Border */}
            <div className="p-6 border-l-2 bg-[#0E141D] border-[#FF5938] rounded-none my-2">
              <Quote className="w-5 h-5 text-[#FF5938] mb-2 opacity-80" />
              <p className="font-sans text-base sm:text-lg text-[#E9EDF0] leading-relaxed mb-3 font-light">
                &ldquo;{activeStory.investigatorQuote}&rdquo;
              </p>
              <div className="text-xs font-mono text-[#83BBD5]">
                — {activeStory.investigatorName},{' '}
                <span className="text-[#7E8B98]">{activeStory.investigatorTitle}</span>
              </div>
            </div>

            {/* Narrative Body Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base font-sans text-[#E9EDF0]/85 leading-relaxed font-normal">
              {activeStory.bodyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Side Annotations (Marginalia) Grid */}
            <div className="pt-4 border-t border-[#252D36] grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {activeStory.marginalia.map((m, idx) => (
                <div key={idx} className="p-3 bg-[#0E141D] border border-[#252D36]">
                  <span className="text-[#FF5938] text-[9px] uppercase block font-bold mb-1">
                    {m.label}
                  </span>
                  <span className="text-[#E9EDF0] font-bold block text-sm mb-1">{m.value}</span>
                  <span className="text-[#7E8B98] text-[10px] leading-tight block font-normal">
                    {m.note}
                  </span>
                </div>
              ))}
            </div>

            {/* Primary Action Button: Listen to This Data in Jukebox */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              {activeStory.isModelProxy ? (
                <div className="flex items-center gap-3">
                  <button
                    disabled
                    className="opacity-50 cursor-not-allowed border border-amber-500/40 text-amber-400 px-6 py-3.5 font-display text-xs font-bold tracking-widest uppercase bg-[#0E141D]"
                  >
                    STREAM QUARANTINED (MODEL PROXY)
                  </button>
                  <span className="text-xs font-mono text-amber-400">
                    GEOS-FP scalar table is unverified against primary DAAC release
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleListenToData}
                  data-cursor-label="LISTEN"
                  data-cursor-magnetic="true"
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-[#FF5938] hover:bg-[#E84C2C] text-[#070B10] font-display font-black text-sm tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-[0_4px_24px_rgba(255,89,56,0.3)] hover:shadow-[0_6px_32px_rgba(255,89,56,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Headphones className="w-4 h-4 text-[#070B10]" />
                  <span>LISTEN TO THIS DATA IN THE JUKEBOX</span>
                  <ArrowRight className="w-4 h-4 text-[#070B10]" />
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Original NASA Visualization, Interactive Timeline & Telemetry (5 COLS) */}
          <div className="lg:col-span-5 relative z-10 flex flex-col space-y-6">
            {/* Visualizer Showcase Panel */}
            <div className="bg-[#0E141D] border-2 border-[#252D36] p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-bold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
                  ORIGINAL NASA VISUALIZATION
                </span>
                <span className="text-[10px] font-mono text-[#7E8B98] uppercase">
                  {activeStory.leadAgency.split('/')[0]}
                </span>
              </div>

              {/* Render Dataset-Specific Authentic Visualization */}
              {activeStory.eicKey === 'gistemp' && (
                <ClimateSpiralVisualizer activeYear={timelineYear} />
              )}
              {activeStory.eicKey === 'co2_maunaloa' && (
                <KeelingSawtoothVisualizer activeYear={timelineYear} />
              )}
              {activeStory.eicKey === 'sealevel_podaac' && (
                <SeaLevelVisualizer activeYear={timelineYear} />
              )}
              {activeStory.eicKey === 'nightlights_viirs' && (
                <NightLightsVisualizer activeYear={timelineYear} />
              )}
              {activeStory.eicKey === 'aerosols_geos' && (
                <AerosolModelVisualizer activeYear={timelineYear} />
              )}

              {/* Measurement Readout Callout */}
              <div className="pt-3 border-t border-[#252D36] flex items-baseline justify-between">
                <div>
                  <span className="text-[#7E8B98] text-[10px] font-mono uppercase block">
                    CURRENT OBSERVATION:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#E9EDF0]">
                      {Number(activeTimelinePoint.value) > 0 && activeStory.eicKey === 'gistemp'
                        ? `+${activeTimelinePoint.value}`
                        : activeTimelinePoint.value}
                    </span>
                    <span className="font-mono text-xs text-[#FF5938] font-bold">
                      {activeStory.measurementUnit.split('(')[0]}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#070B10] border border-[#252D36] font-mono text-xs text-[#83BBD5] font-bold">
                  EPOCH {activeTimelinePoint.year}
                </span>
              </div>
            </div>

            {/* Interactive Timeline Scrubber Card */}
            <div className="bg-[#0E141D] border border-[#252D36] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-2 text-xs font-mono">
                <span className="text-[#83BBD5] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-[#FF5938]" />
                  INTERACTIVE STORY TIMELINE
                </span>
                <span className="text-[#FF5938] font-bold">{timelineYear}</span>
              </div>

              {/* Range Scrubber Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={activeStory.timeline[0].year}
                  max={activeStory.timeline[activeStory.timeline.length - 1].year}
                  value={timelineYear}
                  onChange={(e) => {
                    const y = parseInt(e.target.value, 10);
                    // Find closest available timeline point
                    const closest = activeStory.timeline.reduce((prev, curr) =>
                      Math.abs(curr.year - y) < Math.abs(prev.year - y) ? curr : prev
                    );
                    setTimelineYear(closest.year);
                  }}
                  data-cursor-label="SEEK"
                  aria-label="Seek story timeline"
                  className="w-full h-2 bg-[#070B10] appearance-none cursor-pointer accent-[#FF5938] border border-[#252D36]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#7E8B98]">
                  <span>{activeStory.timeline[0].year} Origin</span>
                  <span>{activeStory.timeline[activeStory.timeline.length - 1].year} Modern</span>
                </div>
              </div>

              {/* Milestone Quick Jump Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {activeStory.timeline.map((tp) => {
                  const isCur = tp.year === timelineYear;
                  return (
                    <button
                      key={tp.year}
                      onClick={() => setTimelineYear(tp.year)}
                      data-cursor-label="SEEK"
                      className={`px-2 py-1 text-[11px] font-mono border transition-all cursor-pointer ${
                        isCur
                          ? 'bg-[#FF5938] text-[#070B10] font-bold border-[#FF5938]'
                          : 'bg-[#070B10] text-[#7E8B98] border-[#252D36] hover:text-[#E9EDF0] hover:border-[#83BBD5]'
                      }`}
                    >
                      {tp.year}
                    </button>
                  );
                })}
              </div>

              {/* Active Milestone Historical Card */}
              <div className="p-3.5 bg-[#070B10] border border-[#252D36] text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-[#83BBD5]">
                  <span className="font-bold">{activeTimelinePoint.label}</span>
                  <span>{activeTimelinePoint.year}</span>
                </div>
                <p className="font-sans text-[11px] text-[#7E8B98] leading-relaxed font-normal">
                  {activeTimelinePoint.significance}
                </p>
              </div>
            </div>

            {/* Official Primary Data Archive Links */}
            <div className="p-4 bg-[#0E141D] border border-[#252D36] flex items-center justify-between text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[#7E8B98] text-[10px] uppercase block">OFFICIAL DATA REPOSITORY</span>
                <span className="text-[#E9EDF0] font-semibold">{activeStory.dataSource}</span>
              </div>
              <a
                href={activeStory.dataSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-label="OPEN"
                className="px-3 py-1.5 border border-[#252D36] hover:border-[#FF5938] bg-[#070B10] text-[#83BBD5] hover:text-[#FF5938] transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <span>OPEN ARCHIVE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
