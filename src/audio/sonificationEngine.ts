import * as Tone from 'tone';
import type { DatasetKey, DataPoint } from '../data/types';
import { EARTH_DATASETS } from '../data/earthDatasets';
import { sonificationCore } from './sonification';

class SonificationEngine {
  private isInitialized = false;
  private isPlaying = false;
  private isMuted = false;
  private masterGain: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private reverb: Tone.Reverb | null = null;
  private waveformAnalyser: Tone.Analyser | null = null;
  private fftAnalyser: Tone.Analyser | null = null;

  // Synthesizers
  private polySynth: Tone.PolySynth | null = null;
  private membraneSynth: Tone.MembraneSynth | null = null;
  private fmSynth: Tone.FMSynth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;
  private oceanFilter: Tone.Filter | null = null;

  // Active loop / sequence IDs
  private loopId: number | null = null;
  private currentDataset: DatasetKey = 'temperature';

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await Tone.start();

      // Master Signal Chain
      this.limiter = new Tone.Limiter(-0.5).toDestination();
      this.masterGain = new Tone.Gain(0.75).connect(this.limiter);

      // Web Audio Analysers for UI Visualizations
      this.waveformAnalyser = new Tone.Analyser('waveform', 256);
      this.fftAnalyser = new Tone.Analyser('fft', 64);
      this.masterGain.connect(this.waveformAnalyser);
      this.masterGain.connect(this.fftAnalyser);

      // Ambient Space Reverb
      this.reverb = new Tone.Reverb({
        decay: 3.8,
        preDelay: 0.04,
        wet: 0.35,
      }).connect(this.masterGain);
      await this.reverb.generate();

      // 1. PolySynth for Thermal Anomaly (GISTEMP)
      this.polySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.4,
          decay: 0.8,
          sustain: 0.6,
          release: 1.8,
        },
      }).connect(this.reverb);
      this.polySynth.volume.value = -6;

      // 2. MembraneSynth for Carbon Pulse (Mauna Loa CO2)
      this.membraneSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.005,
          decay: 0.4,
          sustain: 0.01,
          release: 0.8,
        },
      }).connect(this.masterGain);
      this.membraneSynth.volume.value = -4;

      // 3. Ocean Filter & NoiseSynth for Sea Level (Sentinel-6)
      this.oceanFilter = new Tone.Filter({
        frequency: 380,
        type: 'bandpass',
        Q: 2.5,
      }).connect(this.reverb);

      this.noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: {
          attack: 1.2,
          decay: 2.0,
          sustain: 0.5,
          release: 2.5,
        },
      }).connect(this.oceanFilter);
      this.noiseSynth.volume.value = -12;

      // 4. FMSynth for Biosphere & Ozone (MODIS / OMPS)
      this.fmSynth = new Tone.FMSynth({
        harmonicity: 2.5,
        modulationIndex: 3,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.2,
          decay: 0.6,
          sustain: 0.3,
          release: 1.2,
        },
        modulation: { type: 'triangle' },
        modulationEnvelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.2,
          release: 0.8,
        },
      }).connect(this.reverb);
      this.fmSynth.volume.value = -8;

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('Web Audio initialization suspended or blocked:', err);
      return false;
    }
  }

  public async playTrack(datasetKey: DatasetKey, dataPoint?: DataPoint): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return;
    }

    this.currentDataset = datasetKey;
    this.isPlaying = true;
    this.stopLoop();

    const dataset = EARTH_DATASETS[datasetKey];
    const point = dataPoint || dataset.data[dataset.data.length - 1];

    switch (datasetKey) {
      case 'temperature':
        this.playTemperatureTrack(point.value);
        break;
      case 'co2':
        this.playCo2Track(point.value);
        break;
      case 'seaLevel':
        this.playSeaLevelTrack(point.value);
        break;
      case 'vegetation':
        this.playVegetationTrack(point.value);
        break;
      case 'ozone':
        this.playOzoneTrack(point.value);
        break;
    }
  }

  // 1. Surface Temperature: Anomaly modulates chord dissonance & pitch
  private playTemperatureTrack(anomaly: number): void {
    if (!this.polySynth) return;

    const tick = () => {
      if (!this.isPlaying || !this.polySynth) return;

      // Baseline (0°C) maps to pure Pythagorean A3 / E4 / A4 (220 Hz)
      // As anomaly exceeds +1.0°C, inject minor seconds and high tension tritones
      let notes = ['A3', 'E4', 'A4'];
      if (anomaly > 0.5 && anomaly <= 1.0) {
        notes = ['A3', 'E4', 'B4', 'C#5'];
      } else if (anomaly > 1.0 && anomaly <= 1.25) {
        notes = ['A3', 'F4', 'C5', 'D#5']; // Diminished tension
      } else if (anomaly > 1.25) {
        notes = ['A3', 'D#4', 'G4', 'E5']; // Tritone disequilibrium
      }

      this.polySynth.triggerAttackRelease(notes, '2n');
    };

    tick();
    this.loopId = window.setInterval(tick, 2400);
  }

  // 2. Carbon Dioxide: Concentration modulates pulse tempo (BPM) & sub-bass
  private playCo2Track(ppm: number): void {
    if (!this.membraneSynth) return;

    // Normalizing BPM: 280 ppm = 48 BPM (~1250ms), 425 ppm = 96 BPM (~625ms)
    const factor = Math.min(1, Math.max(0, (ppm - 280) / (435 - 280)));
    const intervalMs = 1250 - factor * 625;

    const tick = () => {
      if (!this.isPlaying || !this.membraneSynth) return;
      const pitch = ppm > 400 ? 'C1' : 'A0';
      this.membraneSynth.triggerAttackRelease(pitch, '8n');
    };

    tick();
    this.loopId = window.setInterval(tick, intervalMs);
  }

  // 3. Sea Level: Resonant filter sweep over oceanic brown noise
  private playSeaLevelTrack(seaLevelMm: number): void {
    if (!this.noiseSynth || !this.oceanFilter) return;

    // Filter frequency sweeps from 180 Hz to 1600 Hz with cumulative sea level rise
    const freq = 180 + Math.min(1400, Math.max(0, seaLevelMm * 11));
    this.oceanFilter.frequency.rampTo(freq, 0.4);

    const tick = () => {
      if (!this.isPlaying || !this.noiseSynth) return;
      this.noiseSynth.triggerAttackRelease('2n');
    };

    tick();
    this.loopId = window.setInterval(tick, 2000);
  }

  // 4. Biosphere: Photosynthetic vigor translates to bright pentatonic bell chimes
  private playVegetationTrack(ndvi: number): void {
    if (!this.fmSynth) return;

    const pentatonicScale = ['A4', 'B4', 'C#5', 'E5', 'F#5', 'A5'];
    let noteIndex = 0;

    const tick = () => {
      if (!this.isPlaying || !this.fmSynth) return;

      // Higher NDVI increases brightness and harmonic index
      const modIndex = 1 + (ndvi - 0.45) * 20;
      this.fmSynth.modulationIndex.value = Math.max(1, Math.min(8, modIndex));

      const note = pentatonicScale[noteIndex % pentatonicScale.length];
      noteIndex++;
      this.fmSynth.triggerAttackRelease(note, '4n');
    };

    tick();
    this.loopId = window.setInterval(tick, 700);
  }

  // 5. Ozone Layer: Stratospheric healing resolves from dissonance into celestial pure fifths
  private playOzoneTrack(dobsonUnits: number): void {
    if (!this.polySynth) return;

    const tick = () => {
      if (!this.isPlaying || !this.polySynth) return;

      // Deep ozone hole (<100 DU) = harsh cluster
      // Recovery (>150 DU) = celestial harmonious chord
      let chord = ['F3', 'B3', 'F#4']; // Dissonant hole
      if (dobsonUnits > 115 && dobsonUnits <= 140) {
        chord = ['G3', 'D4', 'G4'];
      } else if (dobsonUnits > 140) {
        chord = ['C4', 'G4', 'E5']; // Pure recovery
      }

      this.polySynth.triggerAttackRelease(chord, '1m');
    };

    tick();
    this.loopId = window.setInterval(tick, 3200);
  }

  public updateParameters(datasetKey: DatasetKey, value: number): void {
    if (!this.isPlaying || this.currentDataset !== datasetKey) return;
    this.playTrack(datasetKey, { year: 2026, value });
  }

  public stop(): void {
    this.isPlaying = false;
    this.stopLoop();
    if (this.polySynth) this.polySynth.releaseAll();
  }

  private stopLoop(): void {
    if (this.loopId !== null) {
      clearInterval(this.loopId);
      this.loopId = null;
    }
  }

  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.rampTo(this.isMuted ? 0 : volume, 0.05);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(muted ? 0 : 0.75, 0.05);
    }
  }

  public getWaveformData(): Float32Array {
    if (!this.waveformAnalyser) return new Float32Array(128);
    return this.waveformAnalyser.getValue() as Float32Array;
  }

  public getFftData(): Float32Array {
    if (!this.fftAnalyser) return new Float32Array(48);
    return this.fftAnalyser.getValue() as Float32Array;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Deterministic EIC Sonification Note Trigger
   * Plays a specific scientific frequency and acoustic timbre.
   */
  public async playEicTone(
    frequencyHz: number,
    timbre: 'triangle' | 'membrane' | 'fm' | 'noise' = 'triangle',
    duration = '8n'
  ): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return;
    }

    try {
      if (timbre === 'triangle' && this.polySynth) {
        this.polySynth.triggerAttackRelease(frequencyHz, duration);
      } else if (timbre === 'membrane' && this.membraneSynth) {
        this.membraneSynth.triggerAttackRelease(frequencyHz, duration);
      } else if (timbre === 'fm' && this.fmSynth) {
        this.fmSynth.triggerAttackRelease(frequencyHz, duration);
      } else if (timbre === 'noise' && this.noiseSynth && this.oceanFilter) {
        this.oceanFilter.frequency.rampTo(Math.max(100, Math.min(3000, frequencyHz)), 0.1);
        this.noiseSynth.triggerAttackRelease(duration);
      }
    } catch (err) {
      console.warn('EIC Tone trigger skipped:', err);
    }
  }

  /**
   * Play from structured SonificationParams
   */
  public async playMeasurement(params: import('./dataMapping').SonificationParams): Promise<void> {
    await sonificationCore.playMeasurement(params);
  }
}

// Singleton export
export const sonificationEngine = new SonificationEngine();

// Re-export modular sonification architecture
export * from './dataMapping';
export * from './sonification';
export * from './audioTransport';
