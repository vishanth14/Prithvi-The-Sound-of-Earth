import * as Tone from 'tone';
import type { SonificationParams } from './dataMapping';

/**
 * Core Real-Time Sonification Audio Synthesis Engine
 * Manages the native Web Audio graph, synthesis voice allocation, anti-clipping limiter,
 * and deterministic sound generation from NASA observations.
 */
export class SonificationEngineCore {
  private isInitialized = false;
  private isMuted = false;
  private masterGain: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private masterReverb: Tone.Reverb | null = null;
  
  // Real-time Web Audio Analysers
  private waveformAnalyser: Tone.Analyser | null = null;
  private fftAnalyser: Tone.Analyser | null = null;

  // Synthesis Instruments
  private thermalSynth: Tone.PolySynth | null = null;
  private thermalFilter: Tone.Filter | null = null;
  
  private carbonPulseSynth: Tone.MembraneSynth | null = null;
  private carbonSubBass: Tone.Synth | null = null;

  private oceanNoiseSynth: Tone.NoiseSynth | null = null;
  private oceanFilter: Tone.Filter | null = null;

  private aerosolFmSynth: Tone.FMSynth | null = null;
  private radiancePadSynth: Tone.PolySynth | null = null;

  // Active voice management to prevent uncontrolled overlap
  private activeNoteTimeout: number | null = null;

  /**
   * Initializes the Web Audio context upon explicit user interaction
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Resume Tone.js Web Audio Context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // 1. Anti-Clipping Master Signal Chain
      // A brickwall limiter prevents any inter-sample clipping regardless of polyphony
      this.limiter = new Tone.Limiter(-0.5).toDestination();
      this.masterGain = new Tone.Gain(0.8).connect(this.limiter);

      // 2. High-Fidelity Analyser Nodes for Oscilloscope & FFT
      this.waveformAnalyser = new Tone.Analyser('waveform', 256);
      this.fftAnalyser = new Tone.Analyser('fft', 64);
      this.masterGain.connect(this.waveformAnalyser);
      this.masterGain.connect(this.fftAnalyser);

      // 3. Acoustic Space Reverb (3.2s decay, gentle 30% wet)
      this.masterReverb = new Tone.Reverb({
        decay: 3.2,
        preDelay: 0.03,
        wet: 0.28,
      }).connect(this.masterGain);
      await this.masterReverb.generate();

      // 4. Voice 01: Thermal Anomaly Synth (GISTEMP)
      // Dual-oscillator with warm 24dB/oct lowpass filter
      this.thermalFilter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -24,
        Q: 1.8,
      }).connect(this.masterReverb);

      this.thermalSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.08, // Anti-click attack
          decay: 0.6,
          sustain: 0.4,
          release: 1.4,
        },
      }).connect(this.thermalFilter);
      this.thermalSynth.volume.value = -4;

      // 5. Voice 02: Carbon Pulse Synth (Mauna Loa CO2)
      // Percussive membrane punch + resonant subharmonic tail
      this.carbonPulseSynth = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 3.5,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.008,
          decay: 0.35,
          sustain: 0.01,
          release: 0.7,
        },
      }).connect(this.masterGain);
      this.carbonPulseSynth.volume.value = -3;

      this.carbonSubBass = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.05,
          decay: 0.5,
          sustain: 0.2,
          release: 0.9,
        },
      }).connect(this.masterGain);
      this.carbonSubBass.volume.value = -6;

      // 6. Voice 03: Oceanic Altimetry Swell (PO.DAAC Sea Level)
      // Brownian hydrodynamic noise through a resonant bandpass filter
      this.oceanFilter = new Tone.Filter({
        frequency: 240,
        type: 'bandpass',
        Q: 3.2,
      }).connect(this.masterReverb);

      this.oceanNoiseSynth = new Tone.NoiseSynth({
        noise: { type: 'brown' },
        envelope: {
          attack: 0.8,
          decay: 1.6,
          sustain: 0.4,
          release: 2.0,
        },
      }).connect(this.oceanFilter);
      this.oceanNoiseSynth.volume.value = -8;

      // 7. Voice 04: Aerosol Particulate FM Synth (GEOS-FP)
      // Inharmonic crystalline frequency modulation
      this.aerosolFmSynth = new Tone.FMSynth({
        harmonicity: 2.76,
        modulationIndex: 2.0,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.02,
          decay: 0.5,
          sustain: 0.25,
          release: 1.1,
        },
        modulation: { type: 'triangle' },
        modulationEnvelope: {
          attack: 0.04,
          decay: 0.3,
          sustain: 0.15,
          release: 0.8,
        },
      }).connect(this.masterReverb);
      this.aerosolFmSynth.volume.value = -7;

      // 8. Voice 05: Night Lights Radiance Synth (VIIRS Black Marble)
      // Analog-style warm pad with lush stereo spread
      this.radiancePadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'pwm', modulationFrequency: 0.4 },
        envelope: {
          attack: 0.3,
          decay: 0.8,
          sustain: 0.5,
          release: 1.6,
        },
      }).connect(this.masterReverb);
      this.radiancePadSynth.volume.value = -8;

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[Sonification] AudioContext initialization failed or suspended:', err);
      return false;
    }
  }

  /**
   * Triggers a sonification event dynamically from validated scientific parameters
   * with optional sample-accurate audio timestamp
   */
  public async playMeasurement(params: SonificationParams, audioTime?: number): Promise<void> {
    if (!this.isInitialized) {
      const ok = await this.init();
      if (!ok) return;
    }

    try {
      // Clear any pending note cutoff timer
      if (this.activeNoteTimeout) {
        clearTimeout(this.activeNoteTimeout);
        this.activeNoteTimeout = null;
      }

      switch (params.timbreType) {
        case 'thermalSynth':
          this.triggerThermalSound(params, audioTime);
          break;
        case 'carbonPulse':
          this.triggerCarbonSound(params, audioTime);
          break;
        case 'oceanSwell':
          this.triggerOceanSound(params, audioTime);
          break;
        case 'aerosolGranular':
          this.triggerAerosolSound(params, audioTime);
          break;
        case 'radiancePad':
          this.triggerRadianceSound(params, audioTime);
          break;
      }
    } catch (err) {
      console.warn('[Sonification] Note trigger error:', err);
    }
  }

  /**
   * 1. Thermal Anomaly: Modulates fundamental pitch, filter opening & dissonance
   */
  private triggerThermalSound(params: SonificationParams, audioTime?: number): void {
    if (!this.thermalSynth || !this.thermalFilter) return;

    // Smooth filter transition (avoids audio pops)
    if (audioTime !== undefined) {
      this.thermalFilter.frequency.rampTo(params.filterCutoffHz, 0.15, audioTime);
    } else {
      this.thermalFilter.frequency.rampTo(params.filterCutoffHz, 0.15);
    }

    const baseFreq = params.frequencyHz;

    // If thermal anomaly exceeds 1.0°C, construct tension chord (tritone / minor second)
    if (params.modulationIndex > 1.0) {
      const tritoneFreq = baseFreq * Math.pow(2, 6 / 12); // Diminished 5th
      const minorSecondFreq = baseFreq * Math.pow(2, 1 / 12);
      this.thermalSynth.triggerAttackRelease(
        [baseFreq, minorSecondFreq, tritoneFreq],
        params.durationTone,
        audioTime,
        params.velocity
      );
    } else {
      // Harmonic fifth + fundamental
      const fifthFreq = baseFreq * 1.5;
      this.thermalSynth.triggerAttackRelease(
        [baseFreq, fifthFreq],
        params.durationTone,
        audioTime,
        params.velocity
      );
    }
  }

  /**
   * 2. Carbon Heartbeat: Sub-bass percussive punch with tempo-coupled cadence
   */
  private triggerCarbonSound(params: SonificationParams, audioTime?: number): void {
    if (!this.carbonPulseSynth || !this.carbonSubBass) return;

    // Trigger membrane transient
    this.carbonPulseSynth.triggerAttackRelease(
      params.frequencyHz,
      params.durationTone,
      audioTime,
      params.velocity
    );

    // Complementary subharmonic bass anchor
    const subFreq = Math.max(30, params.frequencyHz * 0.5);
    this.carbonSubBass.triggerAttackRelease(
      subFreq,
      params.durationTone,
      audioTime,
      params.velocity * 0.8
    );
  }

  /**
   * 3. Oceanic Altimetry Swell: Resonant bandpass filter over brownian noise
   */
  private triggerOceanSound(params: SonificationParams, audioTime?: number): void {
    if (!this.oceanNoiseSynth || !this.oceanFilter) return;

    // Smooth frequency ramp mimicking oceanic tidal surge
    if (audioTime !== undefined) {
      this.oceanFilter.frequency.rampTo(params.filterCutoffHz, 0.35, audioTime);
    } else {
      this.oceanFilter.frequency.rampTo(params.filterCutoffHz, 0.35);
    }
    this.oceanNoiseSynth.triggerAttackRelease(params.durationTone, audioTime);
  }

  /**
   * 4. Aerosol Particulate Cloud: FM synthesis with metallic inharmonicity
   */
  private triggerAerosolSound(params: SonificationParams, audioTime?: number): void {
    if (!this.aerosolFmSynth) return;

    if (audioTime !== undefined) {
      this.aerosolFmSynth.harmonicity.rampTo(params.harmonicity, 0.05, audioTime);
      this.aerosolFmSynth.modulationIndex.rampTo(params.modulationIndex, 0.05, audioTime);
    } else {
      this.aerosolFmSynth.harmonicity.rampTo(params.harmonicity, 0.05);
      this.aerosolFmSynth.modulationIndex.rampTo(params.modulationIndex, 0.05);
    }

    this.aerosolFmSynth.triggerAttackRelease(
      params.frequencyHz,
      params.durationTone,
      audioTime,
      params.velocity
    );
  }

  /**
   * 5. Night Lights Radiance: Warm analog pad with pentatonic chord Voicing
   */
  private triggerRadianceSound(params: SonificationParams, audioTime?: number): void {
    if (!this.radiancePadSynth) return;

    const root = params.frequencyHz;
    // Pentatonic voicing: Root, Major 2nd, Perfect 5th, Octave
    const chord = [
      root,
      root * Math.pow(2, 2 / 12),
      root * 1.5,
      root * 2.0,
    ];

    this.radiancePadSynth.triggerAttackRelease(chord, params.durationTone, audioTime, params.velocity);
  }

  /**
   * Master Volume Control with smooth ramping
   */
  public setVolume(volume: number): void {
    if (this.masterGain) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.rampTo(this.isMuted ? 0 : clamped, 0.05);
    }
  }

  /**
   * Mute Toggle with click-free attenuation
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(muted ? 0 : 0.8, 0.04);
    }
  }

  /**
   * Immediate silence and polyphonic note release
   */
  public stopAll(): void {
    if (this.thermalSynth) this.thermalSynth.releaseAll();
    if (this.radiancePadSynth) this.radiancePadSynth.releaseAll();
    if (this.activeNoteTimeout) {
      clearTimeout(this.activeNoteTimeout);
      this.activeNoteTimeout = null;
    }
  }

  /**
   * Extracts live time-domain waveform data (oscilloscope)
   */
  public getWaveformData(): Float32Array {
    if (!this.waveformAnalyser) return new Float32Array(128);
    return this.waveformAnalyser.getValue() as Float32Array;
  }

  /**
   * Extracts live frequency spectrum data (FFT spectrogram)
   */
  public getFftData(): Float32Array {
    if (!this.fftAnalyser) return new Float32Array(64);
    return this.fftAnalyser.getValue() as Float32Array;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Complete clean lifecycle disposal of synthesizers, analysers, and nodes
   */
  public dispose(): void {
    this.stopAll();
    try {
      this.thermalSynth?.dispose();
      this.thermalSynth = null;
      this.thermalFilter?.dispose();
      this.thermalFilter = null;
      this.carbonPulseSynth?.dispose();
      this.carbonPulseSynth = null;
      this.carbonSubBass?.dispose();
      this.carbonSubBass = null;
      this.oceanNoiseSynth?.dispose();
      this.oceanNoiseSynth = null;
      this.oceanFilter?.dispose();
      this.oceanFilter = null;
      this.aerosolFmSynth?.dispose();
      this.aerosolFmSynth = null;
      this.radiancePadSynth?.dispose();
      this.radiancePadSynth = null;
      this.waveformAnalyser?.dispose();
      this.waveformAnalyser = null;
      this.fftAnalyser?.dispose();
      this.fftAnalyser = null;
      this.masterReverb?.dispose();
      this.masterReverb = null;
      this.limiter?.dispose();
      this.limiter = null;
      this.masterGain?.dispose();
      this.masterGain = null;
    } catch (e) {
      console.warn('[Sonification] Error during audio disposal:', e);
    }
    this.isInitialized = false;
  }
}

// Global Singleton for Synthesis Core
export const sonificationCore = new SonificationEngineCore();
