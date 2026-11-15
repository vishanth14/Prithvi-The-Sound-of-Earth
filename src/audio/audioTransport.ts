import type { EicObservation } from '../data/eicSchemas';
import { mapObservationToAudio, type SonificationParams } from './dataMapping';
import { sonificationCore } from './sonification';

export type TransportState = 'STOPPED' | 'PLAYING' | 'PAUSED';

export interface TransportTickPayload {
  observation: EicObservation;
  params: SonificationParams;
  index: number;
  totalRecords: number;
  progressPercent: number;
}

export type TickCallback = (payload: TransportTickPayload) => void;
export type StateChangeCallback = (state: TransportState) => void;

/**
 * Audio Transport & Timeline Sequencer
 * Manages playback cadence, seeking, looping, rate-of-change coupled tempo,
 * and deterministic synchronization with the visual layers.
 */
export class AudioTransport {
  private observations: EicObservation[] = [];
  private currentIndex = 0;
  private state: TransportState = 'STOPPED';
  
  private timerId: number | null = null;
  private speedMultiplier = 1.0;
  private isLooping = false;

  private tickListeners: Set<TickCallback> = new Set();
  private stateListeners: Set<StateChangeCallback> = new Set();

  /**
   * Loads a scientific observation sequence into the transport
   */
  public loadSequence(observations: EicObservation[], startIndex = 0): void {
    this.stop();
    this.observations = observations;
    this.currentIndex = Math.max(0, Math.min(observations.length - 1, startIndex));
  }

  /**
   * Begins or resumes timeline playback
   */
  public async play(): Promise<void> {
    if (this.observations.length === 0) return;

    // Ensure audio context is unlocked
    if (!sonificationCore.getIsInitialized()) {
      const ok = await sonificationCore.init();
      if (!ok) return;
    }

    if (this.state === 'PLAYING') return;

    // If reached end, replay from beginning
    if (this.currentIndex >= this.observations.length - 1) {
      this.currentIndex = 0;
    }

    this.setState('PLAYING');
    this.scheduleNextTick();
  }

  /**
   * Pauses the transport at the current observation index
   */
  public pause(): void {
    if (this.state !== 'PLAYING') return;
    this.clearTimer();
    this.setState('PAUSED');
  }

  /**
   * Resumes playback from paused position
   */
  public resume(): void {
    if (this.state === 'PAUSED') {
      this.play();
    }
  }

  /**
   * Stops playback and resets playhead to start
   */
  public stop(): void {
    this.clearTimer();
    this.currentIndex = 0;
    sonificationCore.stopAll();
    this.setState('STOPPED');
  }

  /**
   * Replays timeline sequence from index 0
   */
  public async replay(): Promise<void> {
    this.stop();
    await this.play();
  }

  /**
   * Direct timeline scrub / seek to a specific index
   */
  public seekToIndex(index: number, triggerAudio = true): void {
    if (this.observations.length === 0) return;
    const clamped = Math.max(0, Math.min(this.observations.length - 1, index));
    this.currentIndex = clamped;

    const currentObs = this.observations[clamped];
    const prevObs = clamped > 0 ? this.observations[clamped - 1] : undefined;
    const params = mapObservationToAudio(currentObs, prevObs);

    if (triggerAudio) {
      sonificationCore.playMeasurement(params);
    }

    this.notifyTick(currentObs, params, clamped);
  }

  /**
   * Direct seek by calendar year
   */
  public seekToYear(year: number, triggerAudio = true): void {
    if (this.observations.length === 0) return;
    const idx = this.observations.findIndex((o) => o.year === year);
    if (idx !== -1) {
      this.seekToIndex(idx, triggerAudio);
    } else {
      // Find closest year
      let closestIdx = 0;
      let minDiff = Infinity;
      this.observations.forEach((o, i) => {
        const diff = Math.abs(o.year - year);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      });
      this.seekToIndex(closestIdx, triggerAudio);
    }
  }

  /**
   * Schedules the next empirical step tick based on calculated tempo/interval
   */
  private scheduleNextTick(): void {
    this.clearTimer();
    if (this.state !== 'PLAYING' || this.observations.length === 0) return;

    const currentObs = this.observations[this.currentIndex];
    const prevObs = this.currentIndex > 0 ? this.observations[this.currentIndex - 1] : undefined;
    const params = mapObservationToAudio(currentObs, prevObs);

    // Play synthesized sound
    sonificationCore.playMeasurement(params);

    // Notify all UI visualizers
    this.notifyTick(currentObs, params, this.currentIndex);

    // Determine interval for next step (accounting for change-rate coupled tempo)
    const baseInterval = params.stepIntervalMs;
    const adjustedInterval = Math.max(200, Math.round(baseInterval / this.speedMultiplier));

    this.timerId = window.setTimeout(() => {
      if (this.currentIndex < this.observations.length - 1) {
        this.currentIndex++;
        this.scheduleNextTick();
      } else {
        if (this.isLooping) {
          this.currentIndex = 0;
          this.scheduleNextTick();
        } else {
          this.setState('STOPPED');
        }
      }
    }, adjustedInterval);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private setState(nextState: TransportState): void {
    if (this.state !== nextState) {
      this.state = nextState;
      this.stateListeners.forEach((listener) => listener(nextState));
    }
  }

  private notifyTick(obs: EicObservation, params: SonificationParams, index: number): void {
    const payload: TransportTickPayload = {
      observation: obs,
      params,
      index,
      totalRecords: this.observations.length,
      progressPercent: Number(((index / Math.max(1, this.observations.length - 1)) * 100).toFixed(1)),
    };
    this.tickListeners.forEach((l) => l(payload));
  }

  // Configuration Getters & Setters
  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(4.0, multiplier));
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setIsLooping(loop: boolean): void {
    this.isLooping = loop;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  public getState(): TransportState {
    return this.state;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getCurrentObservation(): EicObservation | undefined {
    return this.observations[this.currentIndex];
  }

  // Event Subscription
  public onTick(listener: TickCallback): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  public onStateChange(listener: StateChangeCallback): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }
}

// Global Singleton Transport Instance
export const audioTransport = new AudioTransport();
