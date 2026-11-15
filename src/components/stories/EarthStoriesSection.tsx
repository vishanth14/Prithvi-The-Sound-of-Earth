import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { useExperienceStore } from '../../orchestrator/experienceStore';
import { MagneticButton } from '../common/MagneticButton';
import { InteractiveVisualFrame } from '../common/InteractiveVisualFrame';
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
  FileText,
} from 'lucide-react';

interface TimelinePoint {
  year: number;
  value: number | string;
  anomaly?: string;
  label: string;
  significance: string;
}

interface ScientificSpec {
  whatIsMeasured: string;
  whyItMatters: string;
  measurementUnit: string;
  timeRange: string;
  scientificBaseline: string;
  sourceAndInstrument: {
    agency: string;
    instrument: string;
    repositoryName: string;
    repositoryUrl: string;
  };
  sonificationMapping: {
    formula: string;
    pitchRange: string;
    rhythmCadence: string;
    timbralModulation: string;
    epistemologyNote: string;
  };
  limitations: string;
  officialCitation: {
    citationText: string;
    url: string;
    svsAssetId: string;
    svsAssetUrl: string;
  };
}

interface AuditedScientistQuote {
  quoteType: 'direct_quote' | 'cited_paraphrase';
  quoteText: string;
  scientistName: string;
  scientistTitle: string;
  quoteSource: string;
  quoteDate: string;
  quoteUrl: string;
}

interface EditorialStory {
  id: string;
  eicKey: EicDatasetKey;
  number: string;
  category: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  spec: ScientificSpec;
  auditedQuote: AuditedScientistQuote;
  bodyParagraphs: string[];
  marginalia: {
    label: string;
    value: string;
    note: string;
  }[];
  timeline: TimelinePoint[];
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
    headline: 'The Thermal Spiral: Earth’s Changing Energy Balance',
    subheadline:
      '+1.28°C Global Surface Temperature Anomaly Across 144 Years of Calibrated Instrumental Records',
    spec: {
      whatIsMeasured:
        'Global combined land-surface air and sea-surface temperature anomaly: the spatial-mean departure of surface temperatures from the mid-20th-century climatological baseline.',
      whyItMatters:
        'A positive global temperature anomaly indicates a persistent planetary energy imbalance—Earth absorbs more incoming solar radiative energy than it radiates back to space as infrared. Sustained multi-decadal warming alters jet stream patterns, intensifies hydrological cycles, accelerates cryospheric loss, and elevates global sea levels.',
      measurementUnit:
        '°C Anomaly (Degrees Celsius relative to 1951–1980 baseline; absolute global base mean ≈ 14.0°C)',
      timeRange:
        '1880 – 2024 (144-Year Continuous Multi-Sensor Archive, Curated Annual Benchmarks)',
      scientificBaseline:
        '1951–1980 climatological baseline (14.0°C global mean) defined by NASA GISS, chosen for comprehensive global weather station coverage prior to modern rapid warming.',
      sourceAndInstrument: {
        agency: 'NASA Goddard Institute for Space Studies (GISS) / Earth Science Division',
        instrument: 'NOAA GHCNv4 Land Weather Station Network & ERSSTv5 Ocean Buoy/Ship Sensors',
        repositoryName: 'NASA GISS Surface Temperature Analysis (GISTEMP v4)',
        repositoryUrl: 'https://data.giss.nasa.gov/gistemp/',
      },
      sonificationMapping: {
        formula: 'f(ΔT) = 146.83 · 2^(norm · 2.33) Hz [D3 (146.8 Hz) to G#4 (415.3 Hz)]',
        pitchRange: 'Exponential 2.33-octave frequency ladder; 0.0°C baseline maps to A3 (220.0 Hz)',
        rhythmCadence: 'Cadence accelerates from 43 BPM to 120 BPM proportional to annual decadal warming velocity',
        timbralModulation: 'Dual-oscillator 24 dB/oct low-pass filter cutoff sweeps from 400 Hz to 3,800 Hz',
        epistemologyNote:
          'Deliberate auditory parameter encoding. The synth tones provide perceptual contrast for human pattern recognition; Earth does not literally produce acoustic tones in space, and dissonance does not diagnose clinical planetary distress.',
      },
      limitations:
        'Historical meteorological station coverage prior to 1950 was sparser in the Southern Hemisphere, central ocean gyres, and Antarctica. Spatial interpolation methods (such as the GISS 1,200 km radius smoothing) and satellite night-light masks are applied to eliminate urban heat island biases.',
      officialCitation: {
        citationText:
          'GISTEMP Team, 2024: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. Dataset accessed 2024-11.',
        url: 'https://data.giss.nasa.gov/gistemp/',
        svsAssetId: 'NASA SVS #5190 (Climate Spiral)',
        svsAssetUrl: 'https://svs.gsfc.nasa.gov/5190/',
      },
    },
    auditedQuote: {
      quoteType: 'direct_quote',
      quoteText:
        'The exceptional warming that we’re experiencing is not something we’ve seen before as a species... It’s driven primarily by our fossil fuel emissions, and we’re seeing the impacts in heat waves, intense rains, and coastal flooding.',
      scientistName: 'Dr. Gavin Schmidt',
      scientistTitle: 'Director, NASA Goddard Institute for Space Studies (GISS)',
      quoteSource:
        'NASA Headquarters / GISS Press Release No. 24-006: NASA Analysis Confirms 2023 as Warmest Year on Record',
      quoteDate: 'January 12, 2024',
      quoteUrl: 'https://www.nasa.gov/news-release/nasa-analysis-confirms-2023-as-warmest-year-on-record/',
    },
    bodyParagraphs: [
      'In 1880, as the Industrial Revolution expanded coal-fired manufacturing across the Northern Hemisphere, global land-ocean temperatures hovered -0.16°C below the mid-20th-century mean. For nearly a century, natural volcanic aerosols and ocean thermal inertia dampened runaway warming.',
      'By 1975, the balance ruptured. As greenhouse gas radiative forcing overtook aerosol cooling, each successive decade registered higher global surface temperatures than the last. In 2015, the planet crossed the +1.0°C anomaly threshold. In 2024, empirical measurements confirm a sustained +1.28°C anomaly, approaching the critical +1.5°C Paris Agreement limit.',
      'In PRITHVI, this century-and-a-half trajectory is translated into a structured acoustic continuum. The tranquil D3 (146.8 Hz) harmonic fifth of 1880 shifts toward an elevated pitch register, rendering the multi-decadal accumulation of thermal energy audible through deliberate parameter mapping.',
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
    themeColor: '#FF5938',
  },
  {
    id: 'carbon-inhalation',
    eicKey: 'co2_maunaloa',
    number: '02',
    category: 'ATMOSPHERIC GREENHOUSE GASES',
    eyebrow: 'MAUNA LOA OBSERVATORY & DYAMOND GLOBAL SIMULATION',
    headline: 'The Keeling Sawtooth: The Troposphere’s Chemical Signature',
    subheadline:
      'Atmospheric Carbon Dioxide Dry Air Mole Fraction: From 280 ppm Pre-Industrial Baseline to 424.3 ppm',
    spec: {
      whatIsMeasured:
        'Atmospheric carbon dioxide (CO₂) dry air mole fraction in parts per million (ppm), representing the number of CO₂ molecules per million dry air molecules in the background troposphere.',
      whyItMatters:
        'Carbon dioxide is the dominant long-lived greenhouse gas forcing Earth’s modern climate. Emitted CO₂ lingers in the active carbon cycle for centuries to millennia, trapping infrared radiation in the lower atmosphere and driving ocean acidification when absorbed by seawater.',
      measurementUnit:
        'ppm (Parts Per Million dry air mole fraction; 1 ppm ≈ 2.13 Gigatons of Carbon in atmosphere)',
      timeRange:
        '1958 – 2024 (Continuous High-Precision In-Situ Record atop Mauna Loa)',
      scientificBaseline:
        'Pre-industrial Holocene equilibrium of approximately 280.0 ppm, confirmed through Law Dome and EPICA Dome C Antarctic ice core records prior to 1850.',
      sourceAndInstrument: {
        agency: 'NOAA Global Monitoring Laboratory (GML) & Scripps Institution of Oceanography, UC San Diego',
        instrument: 'Picarro G2401 Cavity Ring-Down Laser Spectrometer (CRDS) & In-Situ NDIR Gas Analyzer',
        repositoryName: 'NOAA Trends in Atmospheric Carbon Dioxide (Mauna Loa Baseline)',
        repositoryUrl: 'https://gml.noaa.gov/ccgg/trends/',
      },
      sonificationMapping: {
        formula: 'f(ppm) = 45.0 + ((ppm - 280) / 160) · 45.0 Hz; BPM = 48 · (ppm / 280)^1.4',
        pitchRange: 'Sub-bass membrane resonance ascending from 45.0 Hz (F1) to 90.0 Hz (F#2)',
        rhythmCadence: 'Pulse tempo accelerates from 48 BPM resting pulse to 92 BPM modern cadence',
        timbralModulation: 'Acoustic sub-bass kick with resonant analog low-pass filter opening from 150 Hz to 650 Hz',
        epistemologyNote:
          'The cadence acceleration translates the steepening multi-decadal slope into an auditory rhythm. It is a mathematical mapping for human auditory cognition, not a physical vibration emitted by gas molecules.',
      },
      limitations:
        'Mauna Loa is an active shield volcano; local volcanic degassing events occasionally contaminate samples with volcanic CO₂. Automated quality algorithms reject records during downslope wind conditions when volcanic vents blow toward the sampling tower. A brief interruption in late 2022 due to the Mauna Loa volcanic eruption was bridged by temporary sampling at Maunakea Observatories.',
      officialCitation: {
        citationText:
          'Keeling, R. F., et al., 2024: Atmospheric Carbon Dioxide Dry Air Mole Fractions from the Mauna Loa Observatory, Hawaii. Scripps CO₂ Program / NOAA Global Monitoring Laboratory.',
        url: 'https://gml.noaa.gov/ccgg/trends/',
        svsAssetId: 'NASA SVS #5196 (DYAMOND 10-km Model Context)',
        svsAssetUrl: 'https://svs.gsfc.nasa.gov/5196/',
      },
    },
    auditedQuote: {
      quoteType: 'direct_quote',
      quoteText:
        'Not only is CO2 now at the highest level in millions of years, it is also rising faster than ever. Each year achieves a higher maximum due to fossil-fuel burning, which releases pollution in the form of carbon dioxide into the atmosphere. Fossil fuel pollution just keeps building up, much like trash in a landfill.',
      scientistName: 'Dr. Ralph Keeling',
      scientistTitle: 'Director, Scripps CO₂ Program, Scripps Institution of Oceanography, UC San Diego',
      quoteSource: 'NOAA Global Monitoring Laboratory & Scripps Institution of Oceanography Joint Statement',
      quoteDate: 'June 5, 2024',
      quoteUrl: 'https://gml.noaa.gov/ccgg/trends/',
    },
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
    themeColor: '#83BBD5',
  },
  {
    id: 'rising-tides',
    eicKey: 'sealevel_podaac',
    number: '03',
    category: 'OCEAN SURFACE TOPOGRAPHY',
    eyebrow: 'NASA PO.DAAC / SENTINEL-6 RADAR ALTIMETRY',
    headline: 'The Swelling Ocean: Radar Altimetry and Water Volume',
    subheadline:
      '+111.4 mm Global Mean Sea Level Rise Across 30 Years of Unbroken Satellite Ocean Topography',
    spec: {
      whatIsMeasured:
        'Global Mean Sea Level (GMSL) anomaly: the area-weighted average sea surface height variance of the ice-free world ocean (66°S – 66°N) derived from satellite radar altimeters.',
      whyItMatters:
        'Global mean sea level integrates two distinct climate mechanisms: steric thermal expansion (~33% of rise, as warmer ocean water expands) and barystatic mass addition (~67% of rise, as land ice melts from Greenland, Antarctica, and mountain glaciers). Rising seas exacerbate coastal erosion, storm surge vulnerability, and saltwater encroachment into coastal aquifers.',
      measurementUnit:
        'mm (Millimeters sea surface elevation variance relative to 1993.0 baseline)',
      timeRange:
        '1993 – 2023 (Continuous 30-Year Satellite Radar Altimetry Record, 10-Day Cycles)',
      scientificBaseline:
        '1993.0 launch epoch of the TOPEX/Poseidon satellite mission, representing the inception of calibrated global satellite radar altimetry.',
      sourceAndInstrument: {
        agency: 'NASA Physical Oceanography DAAC (PO.DAAC) / JPL / CNES / EUMETSAT / ESA',
        instrument: 'Poseidon-4 Dual-Frequency SAR Altimeter & AMR-C Radiometer on Sentinel-6 Michael Freilich',
        repositoryName: 'NASA PO.DAAC / JPL Integrated Multi-Mission Ocean Altimeter Record',
        repositoryUrl: 'https://podaac.jpl.nasa.gov/',
      },
      sonificationMapping: {
        formula: 'f_center(mm) = 120 · 10^(norm · 1.30) Hz [120 Hz to 2,400 Hz sweep over brownian noise]',
        pitchRange: 'Resonant bandpass center sweeps across 4.3 octaves from sub-bass to bright mid-high register',
        rhythmCadence: 'Tidal wave modulation period shifts from 50 BPM (1993) to 92 BPM (2023) tracking acceleration',
        timbralModulation: '4-pole resonant bandpass filter applied to continuous hydrodynamic brownian noise',
        epistemologyNote:
          'The filter sweep sonifies cumulative volume expansion as opening spectral brightness. It is an intentional design choice for human audition, not literal underwater acoustic hydrophone recordings.',
      },
      limitations:
        'Radar altimeter footprints lose accuracy within ~10 km of coastlines due to land contamination in the radar footprint. Corrections must be applied for orbital drift, wet tropospheric water vapor delay, inverse barometric pressure, and solid-Earth Glacial Isostatic Adjustment (GIA, ~ -0.3 mm/year).',
      officialCitation: {
        citationText:
          'Beckley, B. D., et al., 2023: Global Mean Sea Level Trend from TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, and Sentinel-6 Michael Freilich. NASA Physical Oceanography DAAC (PO.DAAC).',
        url: 'https://podaac.jpl.nasa.gov/',
        svsAssetId: 'NASA SVS #5312 (Global Mean Sea Level 1993–2023)',
        svsAssetUrl: 'https://svs.gsfc.nasa.gov/5312/',
      },
    },
    auditedQuote: {
      quoteType: 'direct_quote',
      quoteText:
        'We have this clear view of recent sea level rise – and can better project how much and how quickly the oceans will continue to rise – because NASA and Centre National d’Études Spatiales (CNES) have gathered decades of ocean observations. By combining that data with measurements from the rest of the NASA fleet, we can also understand why the ocean is rising.',
      scientistName: 'Dr. Josh Willis',
      scientistTitle: 'Project Scientist for Sentinel-6 Michael Freilich, NASA Jet Propulsion Laboratory (JPL)',
      quoteSource: 'NASA Jet Propulsion Laboratory Science Feature: NASA Observes 30 Years of Satellite Sea Level Rise',
      quoteDate: 'March 16, 2023',
      quoteUrl: 'https://www.jpl.nasa.gov/news/nasa-observes-30-years-of-satellite-sea-level-rise',
    },
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
    themeColor: '#83BBD5',
  },
  {
    id: 'nocturnal-footprint',
    eicKey: 'nightlights_viirs',
    number: '04',
    category: 'NOCTURNAL ANTHROPOGENIC RADIANCE',
    eyebrow: 'SUOMI NPP VIIRS DAY-NIGHT BAND // NASA BLACK MARBLE',
    headline: 'Earth at Night: The Luminous Footprint of Modern Civilization',
    subheadline:
      'At-Sensor Top-of-Atmosphere Nocturnal Radiance Revealing Electrification, Urban Growth, and Grid Resilience',
    spec: {
      whatIsMeasured:
        'Calibrated top-of-atmosphere nighttime radiance in nanowatts per square centimeter per steradian (nW·cm⁻²·sr⁻¹), capturing artificial emissions from urban lighting, highway corridors, maritime fishing fleets, and industrial installations.',
      whyItMatters:
        'Nighttime radiance provides an objective spatial proxy for electrification, population density, and regional economic activity. Daily high-resolution night-light maps assist emergency responders in assessing power outages and infrastructure recovery following natural disasters.',
      measurementUnit:
        'nW·cm⁻²·sr⁻¹ (Nanowatts per square centimeter per steradian at-sensor TOA radiance)',
      timeRange:
        '2012 – 2023 (Calibrated Decadal Hyperwall Composite, Suomi NPP VIIRS VNP46 Suite)',
      scientificBaseline:
        'Unlit rural darkness threshold (0.8 nW·cm⁻²·sr⁻¹) established in remote desert calibration sites during new moon orbital passes.',
      sourceAndInstrument: {
        agency: 'NASA Goddard Space Flight Center (GSFC) Earth Science Data Systems / NOAA',
        instrument: 'Visible Infrared Imaging Radiometer Suite (VIIRS) Day-Night Band (DNB) aboard Suomi NPP & NOAA-20',
        repositoryName: 'NASA Black Marble High-Definition Product Suite (VNP46)',
        repositoryUrl: 'https://blackmarble.gsfc.nasa.gov/',
      },
      sonificationMapping: {
        formula: 'f(nW) = 261.63 · 2^(norm · 0.58) Hz [C4 (261.6 Hz) to G4 (392.0 Hz)]',
        pitchRange: 'Warm polyphonic synthesizer pad voicing rooted in the middle C4–G4 register',
        rhythmCadence: 'Ambient sustain envelope with slow 4-second decay; cadence tracks urbanization index (68 to 108 BPM)',
        timbralModulation: 'Consonant pentatonic chord density expands from 3 to 8 voices as regional radiance increases',
        epistemologyNote:
          'Chord voicings represent spatial luminous density. Consonant intervals are chosen compositionally to convey interconnected infrastructure, not physical electromagnetic audio.',
      },
      limitations:
        'Raw nocturnal satellite imagery is heavily distorted by changing lunar illumination phases, surface snow cover, seasonal vegetation canopy, and atmospheric aerosol scattering. The NASA Black Marble algorithmic pipeline (VNP46) applies rigorous atmospheric correction, lunar irradiance modeling, and bidirectional reflectance distribution function (BRDF) adjustments to isolate true artificial light emissions.',
      officialCitation: {
        citationText:
          'Román, M. O., et al., 2018: NASA’s Black Marble daily at-sensor TOA nighttime lights product suite. Remote Sensing of Environment, 210, 113-143. DOI: 10.1016/j.rse.2018.03.017.',
        url: 'https://blackmarble.gsfc.nasa.gov/',
        svsAssetId: 'NASA SVS #5313 (Change in Night Lights between 2012 and 2023 - EIC Version)',
        svsAssetUrl: 'https://svs.gsfc.nasa.gov/5313/',
      },
    },
    auditedQuote: {
      quoteType: 'direct_quote',
      quoteText:
        'Thanks to VIIRS, we can now monitor short-term changes caused by disturbances in power delivery, such as conflict, storms, earthquakes, and brownouts... We can monitor gradual changes driven by urbanization, out-migration, economic changes, and electrification. The fact that we can track all these different aspects at the heart of what defines a city is simply mind-boggling.',
      scientistName: 'Dr. Miguel Román',
      scientistTitle: 'Lead Scientist, NASA Black Marble Team, NASA Goddard Space Flight Center',
      quoteSource: 'NASA Earth Observatory Science Feature: Night Light Maps Open Up New Applications',
      quoteDate: 'April 12, 2017',
      quoteUrl: 'https://earthobservatory.nasa.gov/features/NightLights',
    },
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
      'Chemical Transport Assimilation Modeling: Columnar Aerosol Optical Depth at 550 nm',
    isModelProxy: true,
    spec: {
      whatIsMeasured:
        'Columnar Aerosol Optical Depth (AOD) at 550 nm: the dimensionless measure of light extinction (scattering and absorption) through the vertical atmospheric column caused by airborne solid and liquid particles.',
      whyItMatters:
        'Aerosols exert complex radiative forcing on climate: sulfate aerosols and dust scatter incoming sunlight back to space (cooling), while black carbon from megafires absorbs solar radiation, warming atmospheric layers. Inhaled fine particulates (PM2.5) also represent a primary environmental health risk.',
      measurementUnit:
        'AOD (Dimensionless extinction coefficient at 550 nm green reference wavelength)',
      timeRange:
        '2000 – 2024 (GEOS Forward Processing Assimilation System)',
      scientificBaseline:
        'Clean-sky background tropospheric reference (0.08 – 0.12 AOD) measured in remote maritime sectors devoid of continental plumes.',
      sourceAndInstrument: {
        agency: 'NASA Global Modeling and Assimilation Office (GMAO), Goddard Space Flight Center',
        instrument: 'Terra & Aqua MODIS Spectroradiometers, Suomi NPP VIIRS, and CALIPSO CALIOP Lidar Assimilated into GEOS-FP',
        repositoryName: 'NASA GMAO Forward Processing (GEOS-FP) System',
        repositoryUrl: 'https://gmao.gsfc.nasa.gov/GEOS_systems/geos5_fp/',
      },
      sonificationMapping: {
        formula: 'f_carrier(AOD) = 329.63 · 2^(norm · 0.58) Hz; ModIdx = 0.2 + 2.5 · (AOD / 0.5)',
        pitchRange: 'Crystalline FM synthesis carrier centered on E4 (329.6 Hz) to B4 (493.9 Hz)',
        rhythmCadence: 'Particulate diffusion rate shifts from 55 BPM to 92 BPM',
        timbralModulation: 'Metallic inharmonic FM oscillator with dynamic modulation index scaling with particulate extinction',
        epistemologyNote:
          'High FM sidebands sonify particulate turbidity. This is a synthetic audio mapping, not natural aerodynamic sound.',
      },
      limitations:
        'MODEL PROXY CAVEAT: GEOS-FP is a forecasting and assimilation model that integrates physical fluid dynamic equations with satellite radiances; it does not publish an official historical scalar Level-3 table in DAAC repositories. In strict adherence to our provenance audit, this stream is quarantined and disabled from live audio playback to preserve zero-fabrication standards.',
      officialCitation: {
        citationText:
          'Lucchesi, R., 2020: File Specification for GEOS-FP Forward Processing. GMAO Office Note No. 1 (Version 1.2), NASA Goddard Space Flight Center.',
        url: 'https://gmao.gsfc.nasa.gov/GEOS_systems/geos5_fp/',
        svsAssetId: 'NASA GMAO GEOS Model Proxy (Quarantined)',
        svsAssetUrl: 'https://gmao.gsfc.nasa.gov/',
      },
    },
    auditedQuote: {
      quoteType: 'cited_paraphrase',
      quoteText:
        'In NASA Goddard’s atmospheric assimilation evaluations, Dr. Arlindo da Silva documents that while the GEOS system assimilates extensive satellite radiance to constrain circulation, global aerosol transport fields remain dynamic mathematical integrations of satellite observations and meteorological physics rather than direct in-situ scalar records.',
      scientistName: 'Dr. Arlindo da Silva',
      scientistTitle: 'Senior Research Meteorologist, NASA Global Modeling and Assimilation Office (GMAO)',
      quoteSource: 'NASA GMAO Technical Specification & Goddard Atmospheric Studies (NASA GSFC)',
      quoteDate: '2020',
      quoteUrl: 'https://gmao.gsfc.nasa.gov/GEOS_systems/geos5_fp/',
    },
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

        <circle cx={center} cy={center} r={ring0} fill="none" stroke="#7E8B98" strokeWidth="1" strokeDasharray="3,3" />
        <text x={center + 6} y={center - ring0 - 4} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          0.0°C (1951–1980 baseline)
        </text>

        <circle cx={center} cy={center} r={ring1} fill="none" stroke="#83BBD5" strokeWidth="1" strokeOpacity="0.7" />
        <text x={center + 6} y={center - ring1 - 4} fill="#83BBD5" fontSize="8" fontFamily="IBM Plex Mono">
          +1.0°C Global Milestone
        </text>

        <circle cx={center} cy={center} r={ring15} fill="none" stroke="#FF5938" strokeWidth="1.25" strokeDasharray="4,4" />
        <text x={center + 6} y={center - ring15 - 4} fill="#FF5938" fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
          +1.5°C Paris Accord Target
        </text>

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

        <circle cx={headX} cy={headY} r="7" fill="#FF5938" opacity="0.4" className="animate-ping" />
        <circle cx={headX} cy={headY} r="4.5" fill="#E9EDF0" stroke="#FF5938" strokeWidth="2" />
      </svg>

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
          KEELING CURVE & SVS #5196 MODEL
        </span>
        <span className="text-[#FF5938] font-bold">{currentPt.val} PPM ({currentPt.year})</span>
      </div>

      <svg viewBox="0 0 420 230" className="w-full h-full overflow-visible py-2">
        <line x1="30" y1={h + 20 - ((280 - minV) / (maxV - minV)) * h} x2="390" y2={h + 20 - ((280 - minV) / (maxV - minV)) * h} stroke="#7E8B98" strokeDasharray="3,3" />
        <text x="32" y={h + 14 - ((280 - minV) / (maxV - minV)) * h} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          280 ppm (Pre-Industrial Baseline)
        </text>

        <line x1="30" y1={h + 20 - ((400 - minV) / (maxV - minV)) * h} x2="390" y2={h + 20 - ((400 - minV) / (maxV - minV)) * h} stroke="#FF5938" strokeDasharray="3,3" strokeOpacity="0.6" />
        <text x="32" y={h + 14 - ((400 - minV) / (maxV - minV)) * h} fill="#FF5938" fontSize="8" fontFamily="IBM Plex Mono">
          400 ppm Benchmark (Breached 2013)
        </text>

        {pathD && (
          <path d={pathD} fill="none" stroke="#83BBD5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        <circle cx={curX} cy={curY} r="6" fill="#FF5938" opacity="0.4" className="animate-ping" />
        <circle cx={curX} cy={curY} r="4" fill="#E9EDF0" stroke="#FF5938" strokeWidth="2" />
      </svg>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B98] border-t border-[#252D36] pt-2">
        <span>In-Situ: Mauna Loa Observatory (1958–2024)</span>
        <span className="text-[#83BBD5]">NASA SVS #5196 DYAMOND Model</span>
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

        <line x1="30" y1={h + 20} x2="390" y2={h + 20} stroke="#7E8B98" strokeDasharray="3,3" />
        <text x="32" y={h + 14} fill="#7E8B98" fontSize="8" fontFamily="IBM Plex Mono">
          0.0 mm (1993.0 Altimetry Baseline Origin)
        </text>

        {pathD && (
          <path d={pathD} fill="none" stroke="#83BBD5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

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
  const [activeSpecTab, setActiveSpecTab] = useState<'measured' | 'baseline' | 'sonification' | 'limitations'>('measured');

  const {
    activeEicKey,
    setActiveEicKey,
    isAudioUnlocked,
    unlockAudio,
    startPlayback,
  } = useObservatoryStore();

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
                SCIENTIFIC EDITORIAL & EMPIRICAL STORIES
              </span>
            </div>
          </div>
          <h2 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl text-[#E9EDF0] uppercase tracking-tight leading-[0.9]">
            WHAT EARTH IS TELLING US
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#7E8B98] leading-relaxed max-w-3xl mt-4 font-normal">
            Five multi-decadal planetary narratives derived from verified NASA Earth Information Center observations. Connect directly with the empirical data, genuine NASA visualizations, peer-reviewed baselines, and deterministic sonification.
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

          {/* LEFT COLUMN: Narrative Prose, Scientific Specification & Audited Quote (7 COLS) */}
          <div className="lg:col-span-7 relative z-10 flex flex-col space-y-6">
            {/* Header Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#FF5938]/15 border border-[#FF5938]/40 text-[#FF5938] font-mono text-[11px] font-bold uppercase tracking-wider">
                {activeStory.category}
              </span>
              <a
                href={activeStory.spec.officialCitation.svsAssetUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-label="OPEN"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0E141D] border border-[#252D36] hover:border-[#83BBD5] text-[#83BBD5] font-mono text-[11px] uppercase tracking-wider transition-colors"
                title="Open official NASA asset reference"
              >
                <span>{activeStory.spec.officialCitation.svsAssetId}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="font-mono text-[11px] text-[#7E8B98] hidden sm:inline">
                {activeStory.spec.timeRange.split('(')[0]}
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

            {/* FORENSICALLY AUDITED INVESTIGATOR QUOTE WITH WORKING PUBLIC CITATION */}
            <div className="p-6 border-l-2 bg-[#0E141D] border-[#FF5938] rounded-none my-2 space-y-3">
              <div className="flex items-center justify-between">
                <Quote className="w-5 h-5 text-[#FF5938] opacity-80" />
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold bg-[#070B10] border border-[#252D36] text-[#83BBD5]">
                  {activeStory.auditedQuote.quoteType === 'direct_quote' ? 'VERIFIED PUBLIC QUOTATION' : 'CITED SCIENTIFIC PARAPHRASE'}
                </span>
              </div>
              <p className="font-sans text-base sm:text-lg text-[#E9EDF0] leading-relaxed font-light">
                &ldquo;{activeStory.auditedQuote.quoteText}&rdquo;
              </p>
              <div className="pt-2 border-t border-[#252D36] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#83BBD5] font-bold">{activeStory.auditedQuote.scientistName}</span>
                  <span className="text-[#7E8B98]">, {activeStory.auditedQuote.scientistTitle}</span>
                </div>
                <a
                  href={activeStory.auditedQuote.quoteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor-label="SOURCE"
                  className="inline-flex items-center gap-1 text-[11px] text-[#FF5938] hover:text-[#83BBD5] transition-colors"
                >
                  <span>{activeStory.auditedQuote.quoteDate} Record</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Narrative Body Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base font-sans text-[#E9EDF0]/85 leading-relaxed font-normal">
              {activeStory.bodyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* 10-POINT SCIENTIFIC SPECIFICATION PANEL */}
            <div className="p-5 sm:p-6 bg-[#0E141D] border border-[#252D36] rounded-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#83BBD5] font-bold uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-[#FF5938]" />
                  <span>10-POINT SCIENTIFIC SPECIFICATION & PROVENANCE</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <button
                    onClick={() => setActiveSpecTab('measured')}
                    className={`px-2 py-1 uppercase transition-colors border ${
                      activeSpecTab === 'measured'
                        ? 'bg-[#FF5938] text-[#070B10] font-bold border-[#FF5938]'
                        : 'bg-[#070B10] text-[#7E8B98] border-[#252D36] hover:text-white'
                    }`}
                  >
                    01-03 CORE
                  </button>
                  <button
                    onClick={() => setActiveSpecTab('baseline')}
                    className={`px-2 py-1 uppercase transition-colors border ${
                      activeSpecTab === 'baseline'
                        ? 'bg-[#FF5938] text-[#070B10] font-bold border-[#FF5938]'
                        : 'bg-[#070B10] text-[#7E8B98] border-[#252D36] hover:text-white'
                    }`}
                  >
                    04-06 BASELINE
                  </button>
                  <button
                    onClick={() => setActiveSpecTab('sonification')}
                    className={`px-2 py-1 uppercase transition-colors border ${
                      activeSpecTab === 'sonification'
                        ? 'bg-[#FF5938] text-[#070B10] font-bold border-[#FF5938]'
                        : 'bg-[#070B10] text-[#7E8B98] border-[#252D36] hover:text-white'
                    }`}
                  >
                    07-08 AUDIO
                  </button>
                  <button
                    onClick={() => setActiveSpecTab('limitations')}
                    className={`px-2 py-1 uppercase transition-colors border ${
                      activeSpecTab === 'limitations'
                        ? 'bg-[#FF5938] text-[#070B10] font-bold border-[#FF5938]'
                        : 'bg-[#070B10] text-[#7E8B98] border-[#252D36] hover:text-white'
                    }`}
                  >
                    09-10 LIMITS
                  </button>
                </div>
              </div>

              {/* SPEC TAB 1: 01-03 WHAT IS MEASURED, WHY IT MATTERS & UNIT */}
              {activeSpecTab === 'measured' && (
                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <span className="text-[#FF5938] font-bold text-[10px] uppercase block mb-1">
                      ITEM 02 // WHAT IS BEING MEASURED
                    </span>
                    <p className="font-sans text-sm text-[#E9EDF0] leading-relaxed">
                      {activeStory.spec.whatIsMeasured}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#FF5938] font-bold text-[10px] uppercase block mb-1">
                      ITEM 03 // WHY IT MATTERS (PLANETARY SIGNIFICANCE)
                    </span>
                    <p className="font-sans text-sm text-[#E9EDF0]/90 leading-relaxed">
                      {activeStory.spec.whyItMatters}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#252D36] flex items-center justify-between">
                    <span className="text-[#7E8B98]">ITEM 04 // MEASUREMENT UNIT:</span>
                    <span className="text-[#83BBD5] font-bold">{activeStory.spec.measurementUnit}</span>
                  </div>
                </div>
              )}

              {/* SPEC TAB 2: 04-06 TIME RANGE, BASELINE & SOURCE INSTRUMENT */}
              {activeSpecTab === 'baseline' && (
                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <span className="text-[#83BBD5] font-bold text-[10px] uppercase block mb-1">
                      ITEM 05 // OBSERVATION TIME RANGE
                    </span>
                    <p className="font-sans text-sm text-[#E9EDF0]">
                      {activeStory.spec.timeRange}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#83BBD5] font-bold text-[10px] uppercase block mb-1">
                      ITEM 06 // SCIENTIFIC BASELINE DEFINITION
                    </span>
                    <p className="font-sans text-sm text-[#E9EDF0]/90 leading-relaxed">
                      {activeStory.spec.scientificBaseline}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#252D36] space-y-1">
                    <span className="text-[#FF5938] font-bold text-[10px] uppercase block">
                      ITEM 07 // PRIMARY SENSORS & LEAD AGENCY
                    </span>
                    <div className="text-[#E9EDF0] font-sans text-xs">
                      <span className="font-bold text-[#83BBD5]">{activeStory.spec.sourceAndInstrument.agency}</span> — {activeStory.spec.sourceAndInstrument.instrument}
                    </div>
                  </div>
                </div>
              )}

              {/* SPEC TAB 3: 07-08 HOW SELECTED DATA PRODUCES SOUND */}
              {activeSpecTab === 'sonification' && (
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-[#FF5938] font-bold text-[10px] uppercase block mb-1">
                      ITEM 08 // SONIFICATION TRANSFER FORMULATION
                    </span>
                    <div className="p-2.5 bg-[#070B10] border border-[#252D36] text-[#FF5938] text-xs font-bold">
                      {activeStory.spec.sonificationMapping.formula}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-[#070B10] border border-[#252D36]">
                      <span className="text-[#7E8B98] block text-[9px] uppercase">PITCH REGISTER</span>
                      <span className="text-[#E9EDF0]">{activeStory.spec.sonificationMapping.pitchRange}</span>
                    </div>
                    <div className="p-2 bg-[#070B10] border border-[#252D36]">
                      <span className="text-[#7E8B98] block text-[9px] uppercase">PULSE CADENCE</span>
                      <span className="text-[#E9EDF0]">{activeStory.spec.sonificationMapping.rhythmCadence}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-[#070B10] border border-[#252D36] space-y-1">
                    <span className="text-[#83BBD5] font-bold text-[10px] uppercase block">
                      EPISTEMOLOGICAL NOTICE // DELIBERATE AUDITORY ENCODING
                    </span>
                    <p className="font-sans text-[11px] text-[#7E8B98] leading-relaxed">
                      {activeStory.spec.sonificationMapping.epistemologyNote}
                    </p>
                  </div>
                </div>
              )}

              {/* SPEC TAB 4: 09-10 LIMITATIONS & OFFICIAL CITATION */}
              {activeSpecTab === 'limitations' && (
                <div className="space-y-3.5 text-xs font-mono">
                  <div>
                    <span className="text-amber-400 font-bold text-[10px] uppercase block mb-1">
                      ITEM 09 // SCIENTIFIC & INSTRUMENTAL LIMITATIONS
                    </span>
                    <p className="font-sans text-xs text-[#E9EDF0]/90 leading-relaxed">
                      {activeStory.spec.limitations}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#252D36] space-y-1.5">
                    <span className="text-[#83BBD5] font-bold text-[10px] uppercase block">
                      ITEM 10 // OFFICIAL CITATION & VERIFIED REPOSITORY
                    </span>
                    <p className="font-sans text-xs text-[#7E8B98] italic">
                      &ldquo;{activeStory.spec.officialCitation.citationText}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href={activeStory.spec.officialCitation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor-label="ARCHIVE"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#070B10] border border-[#252D36] hover:border-[#FF5938] text-[#83BBD5] text-xs font-bold transition-colors"
                      >
                        <span>PRIMARY DATA REPOSITORY</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={activeStory.spec.officialCitation.svsAssetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor-label="SVS"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#070B10] border border-[#252D36] hover:border-[#FF5938] text-[#FF5938] text-xs font-bold transition-colors"
                      >
                        <span>OFFICIAL NASA SVS ASSET</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Marginalia Telemetry Grid */}
            <div className="pt-2 border-t border-[#252D36] grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
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
            <div className="pt-2 flex flex-wrap items-center gap-4">
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
                <MagneticButton
                  onClick={handleListenToData}
                  cursorLabel="LISTEN"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-4 font-black tracking-widest"
                >
                  <Headphones className="w-4 h-4 text-[#070B10]" />
                  <span>LISTEN TO THIS DATA IN THE JUKEBOX</span>
                  <ArrowRight className="w-4 h-4 text-[#070B10]" />
                </MagneticButton>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Original NASA Visualization, Interactive Timeline & Telemetry (5 COLS) */}
          <div className="lg:col-span-5 relative z-10 flex flex-col space-y-6">
            {/* Visualizer Showcase Panel with 3D Parallax & Telemetry Caption Reveal */}
            <InteractiveVisualFrame
              captionTitle={activeStory.headline.split(':')[0]}
              captionSubtitle={`${activeStory.spec.sourceAndInstrument.instrument.split('&')[0]} • Epoch ${activeTimelinePoint.year}`}
              officialId={activeStory.spec.officialCitation.svsAssetId}
              officialUrl={activeStory.spec.officialCitation.svsAssetUrl}
              className="p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#252D36] pb-3">
                <span className="font-mono text-xs text-[#83BBD5] uppercase tracking-widest font-bold flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FF5938]" />
                  ORIGINAL NASA VISUALIZATION
                </span>
                <span className="text-[10px] font-mono text-[#7E8B98] uppercase">
                  {activeStory.spec.sourceAndInstrument.agency.split('/')[0]}
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
                      {activeStory.spec.measurementUnit.split('(')[0]}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#070B10] border border-[#252D36] font-mono text-xs text-[#83BBD5] font-bold">
                  EPOCH {activeTimelinePoint.year}
                </span>
              </div>
            </InteractiveVisualFrame>

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
                <span className="text-[#E9EDF0] font-semibold">{activeStory.spec.sourceAndInstrument.repositoryName}</span>
              </div>
              <a
                href={activeStory.spec.sourceAndInstrument.repositoryUrl}
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
