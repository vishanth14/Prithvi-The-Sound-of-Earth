import type { EicDatasetKey, EicObservation } from '../data/eicSchemas';

/**
 * Scientific Sonification Parameter Payload
 * Deterministic audio parameters computed directly from empirical observations.
 */
export interface SonificationParams {
  // Pitch & Frequency
  frequencyHz: number;
  noteName: string; // Nearest tempered note (e.g. "A3", "C#4", "E5")
  centsOffset: number; // Pitch deviation from equal temperament in cents [-50, +50]
  
  // Dynamic & Amplitude
  gain: number; // Linear gain [0.0..1.0]
  velocity: number; // MIDI-style velocity [0..1]
  
  // Timing & Rhythm
  durationSeconds: number;
  durationTone: string; // Tone.js time notation e.g. "8n", "4n", "2n"
  stepIntervalMs: number; // Cadence interval in milliseconds based on change rate
  tempoBpm: number; // Beats per minute equivalent
  
  // Timbre & Synthesis Modulation
  timbreType: 'thermalSynth' | 'carbonPulse' | 'oceanSwell' | 'aerosolGranular' | 'radiancePad';
  harmonicity: number; // FM ratio or sub-harmonic factor
  modulationIndex: number; // FM modulation depth or dissonance intensity
  filterCutoffHz: number; // Dynamic filter cutoff
  
  // Scientific Sound-to-Data Explanation
  explanation: {
    datasetTitle: string;
    rawMeasurement: string;
    baselineComparison: string;
    rateOfChangeMetric: string;
    pitchFormula: string;
    rhythmFormula: string;
    intensityFormula: string;
    dissonanceInterpretation: string;
  };
}

/**
 * Standard Western Equal Temperament Scale Table (A0 = 27.5 Hz to C8 = 4186 Hz)
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Converts frequency in Hz to nearest musical note name and cents offset
 */
export function frequencyToNote(freqHz: number): { noteName: string; centsOffset: number } {
  if (freqHz <= 0) return { noteName: 'C0', centsOffset: 0 };
  
  // MIDI note number where A4 (69) = 440 Hz
  const midiNote = 12 * (Math.log2(freqHz / 440)) + 69;
  const roundedMidi = Math.round(midiNote);
  const cents = Math.round((midiNote - roundedMidi) * 100);
  
  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const noteName = `${NOTE_NAMES[noteIndex]}${octave}`;
  
  return { noteName, centsOffset: cents };
}

/**
 * Scales an input value linearly from domain [inMin, inMax] to range [outMin, outMax]
 */
export function clampScale(
  val: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin;
  const clamped = Math.max(inMin, Math.min(inMax, val));
  const normalized = (clamped - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

/**
 * -----------------------------------------------------------------------------
 * 1. GISTEMP SURFACE TEMPERATURE MAPPING
 * -----------------------------------------------------------------------------
 * Physical Phenomenon: Global Thermal Anomaly relative to 1951-1980 mean.
 * - Anomaly (-0.5°C to +1.5°C) → Exponential pitch ladder from D3 (146.8 Hz) to F#5 (739.9 Hz).
 * - Warming Rate (|ΔT / Δt|) → Rhythmic acceleration (1600ms down to 500ms).
 * - High Thermal Stress (> +1.0°C) → Injects tritone harmonic tension and opens filter.
 */
export function mapGistempObservation(
  current: EicObservation,
  previous?: EicObservation
): SonificationParams {
  const anomaly = current.originalValue ?? 0;
  const prevAnomaly = previous?.originalValue ?? anomaly;
  const deltaYears = Math.max(1, (current.year - (previous?.year ?? (current.year - 1))));
  const rateOfChange = (anomaly - prevAnomaly) / deltaYears; // °C per year

  // Pitch Mapping: Exponential frequency curve
  // Baseline 0.0°C maps to A3 (220.0 Hz)
  // -0.42°C maps to ~155 Hz (Eb3)
  // +1.35°C maps to ~740 Hz (F#5)
  const norm = Math.max(0, Math.min(1, (anomaly - (-0.5)) / (1.5 - (-0.5))));
  const freqHz = 146.83 * Math.pow(2, norm * 2.33);
  const { noteName, centsOffset } = frequencyToNote(freqHz);

  // Rhythm Mapping: Faster rate of warming = more urgent cadence
  const absRate = Math.abs(rateOfChange);
  const stepIntervalMs = clampScale(absRate, 0.0, 0.05, 1400, 500);
  const tempoBpm = Math.round(60000 / stepIntervalMs);

  // Intensity & Timbre Modulation
  // Filter cutoff opens as anomaly climbs, exposing brighter harmonics
  const filterCutoffHz = clampScale(norm, 0, 1, 400, 3800);
  const modulationIndex = anomaly > 1.0 ? clampScale(anomaly, 1.0, 1.5, 0.5, 4.0) : 0.1;
  const gain = clampScale(norm, 0, 1, 0.45, 0.85);

  return {
    frequencyHz: Number(freqHz.toFixed(1)),
    noteName,
    centsOffset,
    gain: Number(gain.toFixed(2)),
    velocity: Number((0.5 + norm * 0.4).toFixed(2)),
    durationSeconds: 1.2,
    durationTone: '2n',
    stepIntervalMs: Math.round(stepIntervalMs),
    tempoBpm,
    timbreType: 'thermalSynth',
    harmonicity: 1.0,
    modulationIndex: Number(modulationIndex.toFixed(2)),
    filterCutoffHz: Math.round(filterCutoffHz),
    explanation: {
      datasetTitle: 'NASA GISTEMP v4 Surface Temperature Anomaly',
      rawMeasurement: `${anomaly > 0 ? '+' : ''}${anomaly.toFixed(2)} °C anomaly`,
      baselineComparison: `${anomaly >= 0 ? '+' : ''}${anomaly.toFixed(2)} °C relative to 1951–1980 climatological baseline`,
      rateOfChangeMetric: `${rateOfChange >= 0 ? '+' : ''}${(rateOfChange * 10).toFixed(3)} °C / decade`,
      pitchFormula: 'f(ΔT) = 146.83 · 2^(norm · 2.33) [Hz] mapped exponentially across 2.33 octaves',
      rhythmFormula: 'Tempo accelerates from 43 BPM to 120 BPM proportional to annual decadal warming velocity',
      intensityFormula: 'Dual-oscillator filter cutoff opens from 400 Hz to 3800 Hz as global heat accumulates',
      dissonanceInterpretation:
        anomaly <= 0.5
          ? 'Consonant harmonic intervals (baseline thermal stability)'
          : anomaly <= 1.0
          ? 'Chromatic frequency ascent providing auditory contrast as anomaly increases'
          : 'High register tension with upper overtones encoding the elevated >1.0°C anomaly',
    },
  };
}

/**
 * -----------------------------------------------------------------------------
 * 2. MAUNA LOA ATMOSPHERIC CO2 MAPPING
 * -----------------------------------------------------------------------------
 * Physical Phenomenon: Atmospheric Carbon Concentration & Keeling Curve.
 * - Concentration (315 ppm to 430 ppm) → Sub-bass fundamental (45 Hz to 90 Hz).
 * - Annual Growth Rate (0.5 to 3.5 ppm/yr) → Heartbeat pulse rate (48 BPM to 138 BPM).
 * - Exceeding 400 ppm threshold → Lowers pitch register to heavy sub-bass A0/C1.
 */
export function mapCo2Observation(
  current: EicObservation,
  previous?: EicObservation
): SonificationParams {
  const ppm = current.originalValue ?? 280;
  const prevPpm = previous?.originalValue ?? ppm;
  const deltaPpm = ppm - prevPpm;
  const growthRate = (current.secondaryMetrics?.growth_rate_ppm_yr as number) ?? 1.5;
  const norm = Math.max(0, Math.min(1, (ppm - 280) / (440 - 280)));

  // Pitch: Sub-bass resonance between 45.0 Hz (F1) and 90.0 Hz (F#2)
  const freqHz = 45.0 + norm * 45.0;
  const { noteName, centsOffset } = frequencyToNote(freqHz);

  // Rhythm: Keeling pulse tempo directly driven by annual ppm growth rate
  // 0.5 ppm/yr = 48 BPM; 3.4 ppm/yr (record 2023) = 138 BPM
  const tempoBpm = Math.round(clampScale(growthRate, 0.4, 3.5, 48, 138));
  const stepIntervalMs = Math.round(60000 / tempoBpm);

  const gain = clampScale(norm, 0, 1, 0.5, 0.9);
  const filterCutoffHz = clampScale(norm, 0, 1, 150, 650);

  return {
    frequencyHz: Number(freqHz.toFixed(1)),
    noteName,
    centsOffset,
    gain: Number(gain.toFixed(2)),
    velocity: Number((0.6 + norm * 0.35).toFixed(2)),
    durationSeconds: 0.6,
    durationTone: '8n',
    stepIntervalMs,
    tempoBpm,
    timbreType: 'carbonPulse',
    harmonicity: 0.5,
    modulationIndex: Number((norm * 2.5).toFixed(2)),
    filterCutoffHz: Math.round(filterCutoffHz),
    explanation: {
      datasetTitle: 'Atmospheric Carbon Dioxide (Mauna Loa Observatory)',
      rawMeasurement: `${ppm.toFixed(1)} ppm (dry air mole fraction)`,
      baselineComparison: `+${(ppm - 280).toFixed(1)} ppm above pre-industrial 280.0 ppm benchmark (+${(((ppm - 280) / 280) * 100).toFixed(0)}%)`,
      rateOfChangeMetric: `${growthRate.toFixed(2)} ppm/year atmospheric accumulation rate (Δ: ${deltaPpm >= 0 ? '+' : ''}${deltaPpm.toFixed(1)} ppm)`,
      pitchFormula: 'f(ppm) = 45.0 + ((ppm - 280) / 160) · 45.0 [Hz] in sub-audible physical bass register',
      rhythmFormula: 'Heartbeat pulse rate accelerates from 48 BPM (IGY 1958) to 138 BPM (modern record)',
      intensityFormula: 'Acoustic membrane resonance density increases with greenhouse radiative forcing',
      dissonanceInterpretation:
        ppm < 350
          ? 'Steady baseline pulse cadence (48–60 BPM) reflecting pre-1990 concentrations'
          : ppm < 400
          ? 'Moderately accelerated cadence (60–85 BPM) tracking steady atmospheric accumulation'
          : 'Accelerated 90+ BPM cadence encoding post-2013 concentrations exceeding 400 ppm',
    },
  };
}

/**
 * -----------------------------------------------------------------------------
 * 3. PO.DAAC GLOBAL MEAN SEA LEVEL MAPPING
 * -----------------------------------------------------------------------------
 * Physical Phenomenon: Satellite Radar Ocean Altimetry (TOPEX/Jason/Sentinel-6).
 * - Sea Height Variation (0 mm to 130 mm) → Resonant bandpass filter sweep over oceanic brown noise.
 * - Center Frequency: 120 Hz (deep sub-oceanic) sweeps to 2400 Hz (coastal surge).
 */
export function mapSeaLevelObservation(
  current: EicObservation,
  previous?: EicObservation
): SonificationParams {
  const mm = current.originalValue ?? 0;
  const prevMm = previous?.originalValue ?? mm;
  const deltaYears = Math.max(1, current.year - (previous?.year ?? (current.year - 1)));
  const rateMmPerYear = (mm - prevMm) / deltaYears;

  const norm = Math.max(0, Math.min(1, mm / 135.0));

  // Frequency: Hydrodynamic bandpass filter sweep
  // 0 mm (1993) = 120 Hz; 126 mm (2026) = ~2400 Hz
  const freqHz = 120.0 * Math.pow(10, norm * 1.30);
  const { noteName, centsOffset } = frequencyToNote(freqHz);

  // Tempo reflects rate of sea level rise acceleration
  // 1993: ~2.0 mm/yr = 50 BPM; 2026: ~4.5 mm/yr = 92 BPM
  const tempoBpm = Math.round(clampScale(rateMmPerYear, 1.5, 5.0, 50, 92));
  const stepIntervalMs = Math.round(60000 / tempoBpm);

  const gain = clampScale(norm, 0, 1, 0.4, 0.85);

  return {
    frequencyHz: Number(freqHz.toFixed(1)),
    noteName,
    centsOffset,
    gain: Number(gain.toFixed(2)),
    velocity: 0.7,
    durationSeconds: 2.2,
    durationTone: '2n',
    stepIntervalMs,
    tempoBpm,
    timbreType: 'oceanSwell',
    harmonicity: 2.5,
    modulationIndex: 1.0,
    filterCutoffHz: Math.round(freqHz),
    explanation: {
      datasetTitle: 'Global Mean Sea Level Satellite Altimetry (PO.DAAC / JPL)',
      rawMeasurement: `+${mm.toFixed(1)} mm sea height variation`,
      baselineComparison: `+${mm.toFixed(1)} mm cumulative ocean surface elevation since 1993.0 inception`,
      rateOfChangeMetric: `${rateMmPerYear.toFixed(2)} mm/year current rate of rise (doubled since 1993)`,
      pitchFormula: 'f_center(mm) = 120 · 10^(norm · 1.30) [Hz] sweep over hydrodynamic brownian noise',
      rhythmFormula: 'Tidal swell period modulates from 50 BPM to 92 BPM tracking acceleration',
      intensityFormula: 'Acoustic wave power scales directly with total ocean heat content uptake',
      dissonanceInterpretation:
        mm < 40
          ? 'Low-frequency resonant filtering (120 Hz to 350 Hz) encoding early 1990s baseline'
          : mm < 85
          ? 'Expanding mid-frequency spectral bandwidth as ocean elevation increases'
          : 'High-frequency resonance peak reaching 2,400 Hz encoding cumulative +111.4 mm rise',
    },
  };
}

/**
 * -----------------------------------------------------------------------------
 * 4. GEOS-FP ATMOSPHERIC AEROSOL OPTICAL DEPTH MAPPING
 * -----------------------------------------------------------------------------
 * Physical Phenomenon: Total AOD + Wildfire Smoke & Dust Particulate Absorption.
 * - Total AOD (0.12 to 0.22) → FM Modulation Depth & Shimmering Glassy Bell.
 * - Wildfire Smoke spikes (Black Carbon > 0.6 µg/m³) → High metallic inharmonicity.
 */
export function mapAerosolsObservation(
  current: EicObservation,
  previous?: EicObservation
): SonificationParams {
  const aod = current.originalValue ?? 0.14;
  const prevAod = previous?.originalValue ?? aod;
  const deltaAod = aod - prevAod;
  const blackCarbon = (current.secondaryMetrics?.black_carbon_ug_m3 as number) ?? 0.45;
  const norm = Math.max(0, Math.min(1, (aod - 0.10) / (0.25 - 0.10)));

  // Carrier Pitch: Centered around E4 (329.6 Hz) ascending to B4 (493.9 Hz)
  const freqHz = 329.63 * Math.pow(2, norm * 0.58);
  const { noteName, centsOffset } = frequencyToNote(freqHz);

  // Modulation index driven by wildfire smoke and aerosol turbidity
  const modIndex = clampScale(blackCarbon, 0.4, 0.8, 1.0, 9.0);
  const stepIntervalMs = clampScale(aod, 0.12, 0.20, 1100, 650);
  const tempoBpm = Math.round(60000 / stepIntervalMs);

  return {
    frequencyHz: Number(freqHz.toFixed(1)),
    noteName,
    centsOffset,
    gain: 0.65,
    velocity: Number((0.5 + norm * 0.4).toFixed(2)),
    durationSeconds: 1.0,
    durationTone: '4n',
    stepIntervalMs,
    tempoBpm,
    timbreType: 'aerosolGranular',
    harmonicity: 2.76, // Inharmonic metallic ratio
    modulationIndex: Number(modIndex.toFixed(2)),
    filterCutoffHz: Math.round(clampScale(modIndex, 1, 9, 800, 4200)),
    explanation: {
      datasetTitle: 'GEOS-FP Atmospheric Aerosol Optical Depth & Smoke',
      rawMeasurement: `${aod.toFixed(3)} AOD (Black Carbon: ${blackCarbon.toFixed(2)} µg/m³)`,
      baselineComparison: `${aod > 0.12 ? '+' : ''}${((aod - 0.12) / 0.12 * 100).toFixed(0)}% turbidity relative to GEOS clean-sky baseline (0.12 AOD)`,
      rateOfChangeMetric: `${blackCarbon.toFixed(2)} µg/m³ absorbing carbonaceous particulate load (ΔAOD: ${deltaAod >= 0 ? '+' : ''}${deltaAod.toFixed(3)})`,
      pitchFormula: 'f_carrier(AOD) = 329.63 · 2^(norm · 0.58) [Hz] glassy FM carrier',
      rhythmFormula: 'Atmospheric particulate diffusion cadence: 55 BPM to 92 BPM',
      intensityFormula: 'FM Modulation Index (1.0 to 9.0) scales with wildfire smoke optical scattering',
      dissonanceInterpretation:
        blackCarbon < 0.5
          ? 'Harmonic FM carrier tone (low modulation depth) encoding clean atmospheric column'
          : blackCarbon < 0.65
          ? 'Moderate particulate sidebands emerging as aerosol optical depth increases'
          : 'Dense inharmonic sidebands encoding elevated smoke and particulate turbidity',
    },
  };
}

/**
 * -----------------------------------------------------------------------------
 * 5. VIIRS BLACK MARBLE EARTH AT NIGHT MAPPING
 * -----------------------------------------------------------------------------
 * Physical Phenomenon: Calibrated Nighttime Radiance & Global Electrification.
 * - Radiance (18.4 nW to 25.0 nW) → Harmonious pentatonic chord expansion.
 * - As nocturnal illumination spreads, chord complexity blossoms from 3 to 8 voices.
 */
export function mapNightlightsObservation(
  current: EicObservation,
  previous?: EicObservation
): SonificationParams {
  const radiance = current.originalValue ?? 18.4;
  const prevRad = previous?.originalValue ?? radiance;
  const deltaRad = radiance - prevRad;
  const urbanIndex = (current.secondaryMetrics?.urban_expansion_index as number) ?? 100.0;
  const norm = Math.max(0, Math.min(1, (radiance - 15.0) / (30.0 - 15.0)));

  // Pitch: Rooted at C4 (261.6 Hz) climbing up to G4 (392.0 Hz)
  const freqHz = 261.63 * Math.pow(2, norm * 0.58);
  const { noteName, centsOffset } = frequencyToNote(freqHz);

  const tempoBpm = Math.round(clampScale(urbanIndex, 100, 136, 68, 108));
  const stepIntervalMs = Math.round(60000 / tempoBpm);

  return {
    frequencyHz: Number(freqHz.toFixed(1)),
    noteName,
    centsOffset,
    gain: 0.6,
    velocity: 0.65,
    durationSeconds: 1.4,
    durationTone: '2n',
    stepIntervalMs,
    tempoBpm,
    timbreType: 'radiancePad',
    harmonicity: 1.5,
    modulationIndex: 0.5,
    filterCutoffHz: Math.round(clampScale(norm, 0, 1, 600, 2800)),
    explanation: {
      datasetTitle: 'VIIRS Black Marble Earth at Night Nocturnal Radiance',
      rawMeasurement: `${radiance.toFixed(2)} nW·cm⁻²·sr⁻¹ (Urban Index: ${urbanIndex.toFixed(1)})`,
      baselineComparison: `+${(radiance - 18.4).toFixed(2)} nW above 2012 Suomi-NPP baseline (+${(((radiance - 18.4) / 18.4) * 100).toFixed(0)}%)`,
      rateOfChangeMetric: `Urban illumination expansion: +${(urbanIndex - 100).toFixed(1)} points (ΔRadiance: ${deltaRad >= 0 ? '+' : ''}${deltaRad.toFixed(2)} nW)`,
      pitchFormula: 'f(nW) = 261.63 · 2^(norm · 0.58) [Hz] warm analog choral root',
      rhythmFormula: 'Global urbanization cadence: 68 BPM to 108 BPM',
      intensityFormula: 'Analog filter resonance expands tracking artificial nocturnal illumination',
      dissonanceInterpretation:
        'Consonant pentatonic voicing where chord density scales with nocturnal artificial radiance',
    },
  };
}

/**
 * Universal Dataset Dispatcher: Maps any observation to its deterministic sonification params
 */
export function mapObservationToAudio(
  observation: EicObservation,
  previousObservation?: EicObservation
): SonificationParams {
  switch (observation.datasetId as EicDatasetKey) {
    case 'gistemp':
      return mapGistempObservation(observation, previousObservation);
    case 'co2_maunaloa':
      return mapCo2Observation(observation, previousObservation);
    case 'sealevel_podaac':
      return mapSeaLevelObservation(observation, previousObservation);
    case 'aerosols_geos':
      return mapAerosolsObservation(observation, previousObservation);
    case 'nightlights_viirs':
      return mapNightlightsObservation(observation, previousObservation);
    default:
      return mapGistempObservation(observation, previousObservation);
  }
}
