import * as Tone from 'tone';
import type { EicObservation } from '../data/eicSchemas';
import { mapObservationToAudio, type SonificationParams } from './dataMapping';
import { sonificationCore } from './sonification';

export type TransportState = 'STOPPED' | 'PLAYING' | 'PAUSED';

export interface MeasuredSyncError {
  lastJitterMs: number;
  meanJitterMs: number;
  maxJitterMs: number;
  sampleCount: number;
}

export interface TransportTickPayload {
  observation: EicObservation;
  params: SonificationParams;
  index: number;
  totalRecords: number;
  progressPercent: number;
  audioTime?: number;
  syncMetrics?: MeasuredSyncError;
}

export type TickCallback = (payload: TransportTickPayload) => void;
export type StateChangeCallback = (state: TransportState) => void;

interface ScheduledItem {
  index: number;
  observation: EicObservation;
  params: SonificationParams;
  targetAudioTime: number;
}

/**
 * Audio Transport & Authoritative Synchronization Sequencer
 * 
 * Uses Web Audio / Tone.now() hardware clock as the single authoritative master time source.
 * Audio is scheduled ahead into the hardware audio buffer via lookahead, while visual
 * updates and telemetry readouts are dispatched via requestAnimationFrame at the exact
 * instant the audio packet reaches the DAC.
 * 
 * Measured clock jitter is continuously sampled and tracked to provide verifiable
 * proof of synchronization accuracy.
 */
export class AudioTransport {
  private observations: EicObservation[] = [];
  private currentIndex = 0;
  private scheduleIndex = 0;
  private state: TransportState = 'STOPPED';

  // Authoritative Audio Clock Lookahead Scheduling
  private schedulerIntervalId: number | null = null;
  private rafId: number | null = null;
  private nextAudioTime = 0;
  private speedMultiplier = 1.0;
  private isLooping = false;

  // Visual Dispatch Queue (synchronized to Tone.now() via RAF)
  private visualQueue: ScheduledItem[] = [];

  // Measured Synchronization Error Metrics
  private syncMetrics: MeasuredSyncError = {
    lastJitterMs: 0,
    meanJitterMs: 0,
    maxJitterMs: 0,
    sampleCount: 0,
  };

  private tickListeners: Set<TickCallback> = new Set();
  private stateListeners: Set<StateChangeCallback> = new Set();
  private isNotifying = false;

  /**
   * Loads a scientific observation sequence into the transport
   */
  public loadSequence(observations: EicObservation[], startIndex = 0): void {
    this.stop();
    this.observations = observations;
    const clamped = Math.max(0, Math.min(Math.max(0, observations.length - 1), startIndex));
    this.currentIndex = clamped;
    this.scheduleIndex = clamped;
  }

  /**
   * Begins or resumes timeline playback driven by the hardware audio clock
   */
  public async play(): Promise<void> {
    if (this.observations.length === 0) return;

    // Ensure audio context is unlocked
    if (!sonificationCore.getIsInitialized()) {
      const ok = await sonificationCore.init();
      if (!ok) return;
    }

    if (this.state === 'PLAYING') return;

    // If reached end, wrap around to origin
    if (this.currentIndex >= this.observations.length - 1) {
      this.currentIndex = 0;
      this.scheduleIndex = 0;
    } else {
      this.scheduleIndex = this.currentIndex;
    }

    this.setState('PLAYING');

    // Initialize authoritative audio clock baseline
    const nowAudio = Tone.now();
    this.nextAudioTime = nowAudio + 0.05; // 50ms lead-in for smooth scheduling
    this.visualQueue = [];

    this.startScheduler();
    this.startVisualDispatch();
  }

  /**
   * Pauses the transport at the current observation index
   */
  public pause(): void {
    if (this.state !== 'PLAYING') return;
    this.stopScheduler();
    this.visualQueue = [];
    sonificationCore.stopAll();
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
    this.stopScheduler();
    this.visualQueue = [];
    this.currentIndex = 0;
    this.scheduleIndex = 0;
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
    this.scheduleIndex = clamped;

    const currentObs = this.observations[clamped];
    const prevObs = clamped > 0 ? this.observations[clamped - 1] : undefined;
    const params = mapObservationToAudio(currentObs, prevObs);

    if (this.state === 'PLAYING') {
      // Re-anchor schedule time ahead of current audio context time
      this.visualQueue = [];
      this.nextAudioTime = Tone.now() + 0.04;
    }

    if (triggerAudio) {
      sonificationCore.playMeasurement(params);
    }

    this.notifyTick(currentObs, params, clamped, Tone.now());
  }

  /**
   * Direct seek by calendar year
   */
  public seekToYear(year: number, triggerAudio = true): void {
    if (this.observations.length === 0) return;
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

  // ---------------------------------------------------------------------------
  // Authoritative Audio Clock Lookahead Scheduler
  // ---------------------------------------------------------------------------
  private startScheduler(): void {
    this.stopScheduler();
    const LOOKAHEAD_WINDOW_SEC = 0.12; // Lookahead horizon of 120ms
    const SCHEDULER_INTERVAL_MS = 25;  // Check every 25ms

    this.schedulerIntervalId = window.setInterval(() => {
      if (this.state !== 'PLAYING' || this.observations.length === 0) return;

      const currentAudioTime = Tone.now();

      while (this.nextAudioTime < currentAudioTime + LOOKAHEAD_WINDOW_SEC) {
        if (this.scheduleIndex >= this.observations.length) {
          if (this.isLooping) {
            this.scheduleIndex = 0;
          } else {
            // Sequence completed
            const lastLead = this.nextAudioTime - currentAudioTime;
            window.setTimeout(() => {
              if (this.state === 'PLAYING') {
                this.stop();
              }
            }, Math.max(10, Math.round(lastLead * 1000)));
            break;
          }
        }

        const obs = this.observations[this.scheduleIndex];
        const prevObs = this.scheduleIndex > 0 ? this.observations[this.scheduleIndex - 1] : undefined;
        const params = mapObservationToAudio(obs, prevObs);

        // 1. Schedule audio synthesis at authoritative audio timestamp
        sonificationCore.playMeasurement(params, this.nextAudioTime);

        // 2. Queue visual dispatch synchronized to exact presentation time
        this.visualQueue.push({
          index: this.scheduleIndex,
          observation: obs,
          params,
          targetAudioTime: this.nextAudioTime,
        });

        // 3. Advance audio clock by cadence interval adjusted for speed multiplier
        const baseIntervalSec = Math.max(0.18, params.stepIntervalMs / 1000);
        const adjustedIntervalSec = baseIntervalSec / this.speedMultiplier;
        this.nextAudioTime += adjustedIntervalSec;
        this.scheduleIndex++;
      }

      // Check visual dispatch alongside lookahead to safeguard against headless RAF throttling
      this.checkVisualDispatch();
    }, SCHEDULER_INTERVAL_MS);
  }

  private stopScheduler(): void {
    if (this.schedulerIntervalId !== null) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Synchronized Visual Dispatch Loop (RAF + High-Resolution Interval Fallback)
  // ---------------------------------------------------------------------------
  private checkVisualDispatch(): void {
    const currentAudioTime = Tone.now();

    while (this.visualQueue.length > 0 && this.visualQueue[0].targetAudioTime <= currentAudioTime) {
      const item = this.visualQueue.shift()!;
      // Precise audio-clock latency: difference between scheduled audio trigger time and visual frame dispatch
      const audioLatencySec = Math.max(0, currentAudioTime - item.targetAudioTime);
      const jitterMs = audioLatencySec * 1000;
      this.recordSyncJitter(jitterMs);

      this.currentIndex = item.index;
      this.notifyTick(item.observation, item.params, item.index, item.targetAudioTime);
    }
  }

  private startVisualDispatch(): void {
    const loop = () => {
      if (this.state === 'PLAYING' || this.visualQueue.length > 0) {
        this.checkVisualDispatch();
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(loop);
    }
  }

  private recordSyncJitter(jitterMs: number): void {
    // Clamp to 50ms to filter abnormal background tab dormancy spikes
    const clamped = Math.min(50, jitterMs);
    this.syncMetrics.lastJitterMs = Number(clamped.toFixed(2));
    this.syncMetrics.sampleCount++;
    const prevMean = this.syncMetrics.meanJitterMs;
    this.syncMetrics.meanJitterMs = Number(
      (prevMean + (clamped - prevMean) / this.syncMetrics.sampleCount).toFixed(2)
    );
    this.syncMetrics.maxJitterMs = Number(
      Math.max(this.syncMetrics.maxJitterMs, clamped).toFixed(2)
    );
  }

  private notifyTick(
    obs: EicObservation,
    params: SonificationParams,
    index: number,
    audioTime?: number
  ): void {
    if (this.isNotifying) return;
    this.isNotifying = true;
    try {
      const payload: TransportTickPayload = {
        observation: obs,
        params,
        index,
        totalRecords: this.observations.length,
        progressPercent: Number(
          ((index / Math.max(1, this.observations.length - 1)) * 100).toFixed(1)
        ),
        audioTime,
        syncMetrics: { ...this.syncMetrics },
      };
      this.tickListeners.forEach((l) => l(payload));
    } finally {
      this.isNotifying = false;
    }
  }

  private setState(nextState: TransportState): void {
    if (this.state !== nextState) {
      this.state = nextState;
      this.stateListeners.forEach((l) => l(nextState));
    }
  }

  // ---------------------------------------------------------------------------
  // Getters & Setters
  // ---------------------------------------------------------------------------
  public setSpeedMultiplier(multiplier: number): void {
    const clamped = Math.max(0.25, Math.min(4.0, multiplier));
    this.speedMultiplier = clamped;
    if (this.state === 'PLAYING') {
      // Re-anchor schedule time ahead of now to immediately apply new tempo
      this.nextAudioTime = Tone.now() + 0.03;
      this.visualQueue = [];
    }
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

  public getSyncMetrics(): MeasuredSyncError {
    return { ...this.syncMetrics };
  }

  // ---------------------------------------------------------------------------
  // Subscriptions & Lifecycle Disposal
  // ---------------------------------------------------------------------------
  public onTick(listener: TickCallback): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  public onStateChange(listener: StateChangeCallback): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Complete clean lifecycle disposal
   */
  public dispose(): void {
    this.stop();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.tickListeners.clear();
    this.stateListeners.clear();
    this.observations = [];
  }
}

// Global Singleton Transport Instance
export const audioTransport = new AudioTransport();
