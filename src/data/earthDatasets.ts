import type { DatasetKey, DatasetMeta, SatelliteMission } from './types';

export const SATELLITE_FLEET: SatelliteMission[] = [
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
    launchYear: 1999,
    orbitAltitudeKm: 705,
    orbitInclinationDeg: 98.2,
    primarySensor: 'MODIS / ASTER / CERES',
    observationalFocus: 'Global vegetation index (NDVI), surface temperature, cloud albedo',
    color: '#10b981', // Emerald
  },
  {
    id: 'aqua',
    name: 'Aqua (EOS PM-1)',
    launchYear: 2002,
    orbitAltitudeKm: 705,
    orbitInclinationDeg: 98.2,
    primarySensor: 'AIRS / AMSR-E / CERES',
    observationalFocus: 'Water cycle, oceanic evaporation, atmospheric temperature profiles',
    color: '#06b6d4', // Cyan
  },
  {
    id: 'grace-fo',
    name: 'GRACE-FO',
    launchYear: 2018,
    orbitAltitudeKm: 490,
    orbitInclinationDeg: 89.0,
    primarySensor: 'KBR / LRI Microwave Interferometer',
    observationalFocus: 'Planetary gravity anomalies, ice sheet mass loss, groundwater shift',
    color: '#a855f7', // Purple
  },
  {
    id: 'landsat-9',
    name: 'Landsat 9',
    launchYear: 2021,
    orbitAltitudeKm: 705,
    orbitInclinationDeg: 98.2,
    primarySensor: 'OLI-2 / TIRS-2',
    observationalFocus: 'High-resolution terrestrial land cover, urban expansion, glacier retreat',
    color: '#f59e0b', // Amber
  },
  {
    id: 'sentinel-6',
    name: 'Sentinel-6 Michael Freilich',
    launchYear: 2020,
    orbitAltitudeKm: 1336,
    orbitInclinationDeg: 66.0,
    primarySensor: 'Poseidon-4 Radar Altimeter',
    observationalFocus: 'Sub-millimeter ocean surface topography and global sea level rise',
    color: '#3b82f6', // Blue
  },
];

// NASA GISTEMP v4: Global Land-Ocean Temperature Index (1880–2026, baseline: 1951-1980 mean)
const TEMPERATURE_DATA = [
  { year: 1880, value: -0.16, anomaly: -0.16, milestone: 'Industrial Revolution acceleration; reliable meteorological records begin' },
  { year: 1890, value: -0.35, anomaly: -0.35 },
  { year: 1900, value: -0.08, anomaly: -0.08 },
  { year: 1910, value: -0.42, anomaly: -0.42, milestone: 'Global cooling phase driven by volcanic aerosols and solar minimum' },
  { year: 1920, value: -0.27, anomaly: -0.27 },
  { year: 1930, value: -0.14, anomaly: -0.14 },
  { year: 1940, value: 0.12, anomaly: 0.12, milestone: 'Mid-century warming pulse prior to post-war sulfate aerosol spike' },
  { year: 1950, value: -0.17, anomaly: -0.17 },
  { year: 1960, value: -0.03, anomaly: -0.03 },
  { year: 1970, value: 0.03, anomaly: 0.03, milestone: 'First Earth Day; initial satellite thermal sensors deployed' },
  { year: 1980, value: 0.26, anomaly: 0.26 },
  { year: 1990, value: 0.45, anomaly: 0.45, milestone: 'IPCC First Assessment Report released; rapid thermal ascent detected' },
  { year: 1995, value: 0.45, anomaly: 0.45 },
  { year: 1998, value: 0.61, anomaly: 0.61, milestone: 'Super El Niño year shatters global temperature records' },
  { year: 2000, value: 0.39, anomaly: 0.39 },
  { year: 2005, value: 0.68, anomaly: 0.68 },
  { year: 2010, value: 0.72, anomaly: 0.72 },
  { year: 2015, value: 0.90, anomaly: 0.90, milestone: 'Paris Climate Accord signed; Earth surpasses +0.9°C anomaly' },
  { year: 2016, value: 1.02, anomaly: 1.02, milestone: 'First year exceeding +1.0°C above baseline in modern instrumental record' },
  { year: 2017, value: 0.93, anomaly: 0.93 },
  { year: 2018, value: 0.85, anomaly: 0.85 },
  { year: 2019, value: 0.98, anomaly: 0.98 },
  { year: 2020, value: 1.02, anomaly: 1.02, milestone: 'Tied for warmest year on record; dramatic Arctic amplification' },
  { year: 2021, value: 0.85, anomaly: 0.85 },
  { year: 2022, value: 0.89, anomaly: 0.89 },
  { year: 2023, value: 1.17, anomaly: 1.17, milestone: 'Unprecedented global ocean and surface heat; warmest year on record' },
  { year: 2024, value: 1.28, anomaly: 1.28, milestone: 'Extends consecutive monthly temperature records globally' },
  { year: 2025, value: 1.32, anomaly: 1.32, milestone: 'Global average surface temperature approaches 1.5°C pre-industrial threshold' },
  { year: 2026, value: 1.35, anomaly: 1.35, milestone: 'Current NASA Space Apps operational datum' },
];

// Atmospheric CO2: NOAA / NASA Earth System Research Laboratories (Mauna Loa Observatory, ppm)
const CO2_DATA = [
  { year: 1880, value: 290.8, milestone: 'Pre-industrial equilibrium baseline (~280-290 ppm)' },
  { year: 1890, value: 294.4 },
  { year: 1900, value: 295.8 },
  { year: 1910, value: 300.1 },
  { year: 1920, value: 303.4 },
  { year: 1930, value: 307.5 },
  { year: 1940, value: 311.3 },
  { year: 1950, value: 311.5 },
  { year: 1958, value: 315.7, milestone: 'Dr. Charles David Keeling commences continuous daily monitoring at Mauna Loa' },
  { year: 1965, value: 320.0 },
  { year: 1970, value: 325.7 },
  { year: 1975, value: 331.1 },
  { year: 1980, value: 338.8 },
  { year: 1985, value: 346.1 },
  { year: 1990, value: 354.4 },
  { year: 1995, value: 360.8 },
  { year: 2000, value: 369.5 },
  { year: 2005, value: 379.8 },
  { year: 2010, value: 389.9 },
  { year: 2013, value: 400.0, milestone: 'Atmospheric CO2 crosses 400 ppm for the first time in human history' },
  { year: 2015, value: 401.0 },
  { year: 2018, value: 408.5 },
  { year: 2020, value: 414.2 },
  { year: 2022, value: 418.5 },
  { year: 2023, value: 421.1 },
  { year: 2024, value: 424.3, milestone: 'Growth rate surges beyond 3.0 ppm/year driven by tropical drought and fossil emissions' },
  { year: 2025, value: 426.8 },
  { year: 2026, value: 429.2, milestone: 'Current NASA Space Apps atmospheric snapshot' },
];

// Global Mean Sea Level: NASA PO.DAAC Satellite Altimetry (TOPEX/Poseidon, Jason 1-3, Sentinel-6, mm variation)
const SEA_LEVEL_DATA = [
  { year: 1993, value: 0.0, anomaly: 0.0, milestone: 'High-precision satellite radar altimetry baseline initiated with TOPEX/Poseidon' },
  { year: 1995, value: 6.2, anomaly: 6.2 },
  { year: 1998, value: 14.8, anomaly: 14.8 },
  { year: 2000, value: 21.3, anomaly: 21.3 },
  { year: 2003, value: 30.2, anomaly: 30.2 },
  { year: 2005, value: 37.8, anomaly: 37.8, milestone: 'Thermal expansion of warming oceans identified as primary rise driver' },
  { year: 2008, value: 47.1, anomaly: 47.1 },
  { year: 2010, value: 52.4, anomaly: 52.4 },
  { year: 2012, value: 63.8, anomaly: 63.8, milestone: 'Greenland and Antarctic ice sheet melt acceleration detected by GRACE' },
  { year: 2014, value: 71.0, anomaly: 71.0 },
  { year: 2016, value: 82.5, anomaly: 82.5 },
  { year: 2018, value: 89.2, anomaly: 89.2 },
  { year: 2020, value: 97.4, anomaly: 97.4, milestone: 'Launch of Sentinel-6 Michael Freilich satellite' },
  { year: 2021, value: 101.2, anomaly: 101.2 },
  { year: 2022, value: 104.9, anomaly: 104.9 },
  { year: 2023, value: 111.4, anomaly: 111.4, milestone: 'Rate of sea level rise exceeds 4.4 mm/year—more than double the 1993 rate' },
  { year: 2024, value: 116.8, anomaly: 116.8 },
  { year: 2025, value: 121.5, anomaly: 121.5 },
  { year: 2026, value: 126.0, anomaly: 126.0, milestone: 'Total cumulative rise reaches +126 mm since altimeter epoch began' },
];

// Normalized Difference Vegetation Index (NDVI): NASA MODIS / Terra (Terrestrial biosphere greenness anomaly)
const VEGETATION_DATA = [
  { year: 2000, value: 0.512, anomaly: 0.0, milestone: 'Terra MODIS global satellite vegetation baseline established' },
  { year: 2002, value: 0.515, anomaly: 0.003 },
  { year: 2004, value: 0.519, anomaly: 0.007 },
  { year: 2006, value: 0.516, anomaly: 0.004 },
  { year: 2008, value: 0.521, anomaly: 0.009 },
  { year: 2010, value: 0.524, anomaly: 0.012, milestone: 'Global greening trend observed in northern mid-to-high latitudes (CO2 fertilization)' },
  { year: 2012, value: 0.522, anomaly: 0.010 },
  { year: 2014, value: 0.528, anomaly: 0.016 },
  { year: 2016, value: 0.525, anomaly: 0.013, milestone: 'Severe Amazonian and Southeast Asian tropical drought temporarily retards greenness' },
  { year: 2018, value: 0.531, anomaly: 0.019 },
  { year: 2020, value: 0.533, anomaly: 0.021 },
  { year: 2022, value: 0.527, anomaly: 0.015, milestone: 'Widespread wildfires in Boreal forests and Mediterranean basin compress regional NDVI' },
  { year: 2023, value: 0.524, anomaly: 0.012 },
  { year: 2024, value: 0.521, anomaly: 0.009, milestone: 'Shifting growing seasons and thermal stress limit vegetation photosynthesis capacity' },
  { year: 2025, value: 0.519, anomaly: 0.007 },
  { year: 2026, value: 0.518, anomaly: 0.006, milestone: 'Equatorial canopy stress offset by arctic shrub expansion' },
];

// Antarctic Ozone Hole Minimum: NASA Ozone Watch (TOMS, OMI, OMPS on Suomi-NPP, Dobson Units)
const OZONE_DATA = [
  { year: 1979, value: 225, milestone: 'Historical natural baseline prior to chlorofluorocarbon (CFC) hole formation' },
  { year: 1982, value: 190 },
  { year: 1985, value: 140, milestone: 'Discovery of the Antarctic Ozone Hole by British Antarctic Survey' },
  { year: 1987, value: 120, milestone: 'Montreal Protocol negotiated—the most successful multilateral environmental treaty' },
  { year: 1990, value: 111 },
  { year: 1994, value: 73, milestone: 'Extreme ozone depletion; polar vortex stratosphere reaches record minimum' },
  { year: 1998, value: 86 },
  { year: 2000, value: 92 },
  { year: 2006, value: 84, milestone: 'Deepest and largest ozone hole area recorded (29.6 million sq km)' },
  { year: 2010, value: 118 },
  { year: 2015, value: 101 },
  { year: 2019, value: 164, milestone: 'Sudden stratospheric warming creates smallest spring ozone hole in 40 years' },
  { year: 2021, value: 103 },
  { year: 2023, value: 103 },
  { year: 2024, value: 135, milestone: 'Clear multidecadal recovery trajectory confirmed by NASA / NOAA atmospheric models' },
  { year: 2025, value: 148 },
  { year: 2026, value: 156, milestone: 'Projections on track for complete Antarctic recovery by circa 2066' },
];

export const EARTH_DATASETS: Record<DatasetKey, DatasetMeta> = {
  temperature: {
    id: 'temperature',
    name: 'Global Surface Temperature Anomaly',
    shortCode: 'GISTEMP v4',
    subtitle: 'Land-Ocean Temperature Deviation from 1951-1980 Baseline',
    unit: '°C Anomaly',
    baseline: '1951–1980 mean (14.0°C absolute)',
    temporalRange: '1880 – 2026',
    instrument: 'GHCNv4 meteorological stations & ERSSTv5 oceanic floats',
    leadAgency: 'NASA Goddard Institute for Space Studies (GISS)',
    satellitePlatform: 'Terra / Aqua / Suomi-NPP / JPSS',
    themeColor: '#f43f5e', // Crimson / Infrared Rose
    accentGlow: 'rgba(244, 63, 94, 0.4)',
    description:
      'The GISTEMP analysis quantifies changes in Earth’s global surface temperature relative to the mid-20th century. Positive values indicate excess thermal energy absorbed by the planet due to greenhouse forcing.',
    scientificImpact:
      'Surpassing +1.2°C anomaly drives irreversible polar ice mass loss, marine heatwaves, accelerated wildfire frequency, and disruptions to the jet stream.',
    sonificationRule: {
      acousticParameter: 'Fundamental Pitch & Harmonic Dissonance',
      musicalMapping: 'Baseline (0°C) maps to A3 (220 Hz). Warming shifts microtonally upward to A4 (440 Hz) and injects tritone intervals.',
      frequencyRange: '180 Hz – 520 Hz',
      timbralDescription: 'Polyphonic analog synthesizer voice with resonant low-pass sweep that opens as temperature increases.',
    },
    data: TEMPERATURE_DATA,
  },
  co2: {
    id: 'co2',
    name: 'Atmospheric Carbon Dioxide',
    shortCode: 'Mauna Loa CO2',
    subtitle: 'Direct Background Atmospheric Trace Gas Concentration',
    unit: 'ppm (parts per million)',
    baseline: 'Pre-industrial 280 ppm',
    temporalRange: '1880 – 2026',
    instrument: 'NDIR (Non-Dispersive Infrared) Gas Analyzers',
    leadAgency: 'NOAA Global Monitoring Lab & NASA OCO-2 / OCO-3',
    satellitePlatform: 'Orbiting Carbon Observatory-2 (OCO-2)',
    themeColor: '#f59e0b', // Solar Amber
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    description:
      'Continuous daily measurements of atmospheric carbon dioxide (CO2) from the remote high-altitude Mauna Loa Observatory, Hawaii, representing clean unpolluted Pacific air masses.',
    scientificImpact:
      'CO2 is the primary long-lived radiative forcing agent. Current levels exceeding 424 ppm have not existed on Earth in over 3 million years (Pliocene Epoch).',
    sonificationRule: {
      acousticParameter: 'Metronomic Pulse Rate (BPM) & Sub-bass Resonance',
      musicalMapping: 'Pre-industrial 280 ppm corresponds to 48 BPM resting pulse. 425+ ppm accelerates to 96 BPM sub-bass kick heartbeat.',
      frequencyRange: '45 Hz – 110 Hz',
      timbralDescription: 'Deep analog membrane synth generating an inescapable rhythmic carbon clock ticking forward.',
    },
    data: CO2_DATA,
  },
  seaLevel: {
    id: 'seaLevel',
    name: 'Global Mean Sea Level',
    shortCode: 'PO.DAAC Altimetry',
    subtitle: 'Satellite Radar Altimeter Cumulative Ocean Height Variation',
    unit: 'mm Anomaly',
    baseline: '1993 TOPEX/Poseidon epoch launch',
    temporalRange: '1993 – 2026',
    instrument: 'Dual-frequency Radar Altimeters & Microwave Radiometers',
    leadAgency: 'NASA Jet Propulsion Laboratory (JPL) & CNES / EUMETSAT',
    satellitePlatform: 'Sentinel-6 Michael Freilich / Jason-3',
    themeColor: '#38bdf8', // Cyan / Deep Ocean
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    description:
      'Measures the height of the global ocean surface with sub-centimeter precision from orbit. Sea level rises as seawater warms and expands, and as grounded glaciers and ice sheets melt into the sea.',
    scientificImpact:
      'Sea level rise compounds coastal storm surges, inundates freshwater aquifers, and threatens low-lying island nations and global littoral megacities.',
    sonificationRule: {
      acousticParameter: 'Resonant Bandpass Filter & Dynamic Stereo Spatial Width',
      musicalMapping: 'Sea level height expands a brown-noise ocean drone filter from 120 Hz to 1800 Hz, broadening acoustic spatial immersion.',
      frequencyRange: '60 Hz – 2200 Hz',
      timbralDescription: 'Atmospheric fluid drone layered with low brownian ocean surges modulated by orbital tidal cycles.',
    },
    data: SEA_LEVEL_DATA,
  },
  vegetation: {
    id: 'vegetation',
    name: 'Terrestrial Biosphere Index',
    shortCode: 'MODIS NDVI',
    subtitle: 'Normalized Difference Vegetation Index (Plant Photosynthetic Vigor)',
    unit: 'NDVI (0.0 – 1.0)',
    baseline: '2000 Terra MODIS initial calibration',
    temporalRange: '2000 – 2026',
    instrument: 'Moderate Resolution Imaging Spectroradiometer (MODIS)',
    leadAgency: 'NASA Goddard Space Flight Center',
    satellitePlatform: 'Terra & Aqua Satellites',
    themeColor: '#10b981', // Emerald Biosphere
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    description:
      'NDVI exploits the contrasting absorption of red visible light by chlorophyll and reflection of near-infrared light by plant mesophyll cell structures to gauge live vegetative biomass.',
    scientificImpact:
      'Monitors global deforestation, desertification, agricultural crop yields, and seasonal carbon sink sequestration capacity across all biomes.',
    sonificationRule: {
      acousticParameter: 'Harmonic Arpeggiator & Pentatonic Shimmer',
      musicalMapping: 'High vegetation indices trigger bright pentatonic bell overtones. Severe drought or canopy dieback removes upper partials.',
      frequencyRange: '320 Hz – 1800 Hz',
      timbralDescription: 'Crystalline FM synthesizer bell chimes shimmering in synchronized vegetative cadences.',
    },
    data: VEGETATION_DATA,
  },
  ozone: {
    id: 'ozone',
    name: 'Stratospheric Ozone Layer',
    shortCode: 'TROPOMI / OMPS',
    subtitle: 'Antarctic Spring Minimum Total Column Ozone Concentration',
    unit: 'Dobson Units (DU)',
    baseline: '220 DU historical threshold defining ozone hole',
    temporalRange: '1979 – 2026',
    instrument: 'Ozone Mapping and Profiler Suite (OMPS) & OMI',
    leadAgency: 'NASA Ozone Watch / Goddard Space Flight Center',
    satellitePlatform: 'Suomi-NPP / NOAA-20 / Aura',
    themeColor: '#a855f7', // Violet Stratosphere
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    description:
      'Monitors stratospheric ozone which shields biological life on Earth from harmful ultraviolet solar radiation (UV-B). Demonstrates recovery following the Montreal Protocol.',
    scientificImpact:
      'A proof of concept that global multilateral environmental policy succeeds: atmospheric chlorofluorocarbons have peaked and the ozone layer is steadily regenerating.',
    sonificationRule: {
      acousticParameter: 'Amplitude Modulation (AM) Depth & Harmonic Purity',
      musicalMapping: 'Severe depletion (70 DU) generates tremolo and harsh metallic phase modulation; recovery to 150+ DU cleanses into pure pure sine chords.',
      frequencyRange: '140 Hz – 880 Hz',
      timbralDescription: 'Ethereal solar-stratospheric AM synth drone resolving from harsh ultraviolet static into clear celestial harmony.',
    },
    data: OZONE_DATA,
  },
};
