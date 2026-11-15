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

export interface BufferingPayload {
  isBuffering: boolean;
  reason?: string;
}

export type TickCallback = (payload: TransportTickPayload) => void;
export type StateChangeCallback = (state: TransportState) => void;
export type BufferingCallback = (payload: BufferingPayload) => void;

interface ScheduledItem {
  index: number;
  observation: EicObservation;
  params: SonificationParams;
  targetAudioTime: number;
}

/**
 * Master Synchronization Engine (Layer 13)
 * 
 * Uses Tone.Transport as the single authoritative master playback clock.
 * Every observation timestamp, NASA visual frame, D3 vector coordinate,
 * measurement readout, and generated audio parameter is scheduled directly
 * from this single authoritative time source.
 * 
 * Guarantees:
 * 1. Zero duplicate setInterval/setTimeout playback timers.
 * 2. Exactly one authoritative event scheduled on Tone.Transport ahead of DAC.
 * 3. Complete event cancellation upon seek, stop, or dataset switch.
 * 4. Controlled audio envelopes to prevent stale overlapping voices.
 * 5. Controlled buffering state (never silent audio-visual drift).
 * 6. Automatic resynchronization on browser tab visibility changes.
 * 7. Empirical jitter and audio scheduling error measurement.
 */
export class AudioTransport {
  private observations: EicObservation[] = [];
  private currentIndex = 0;
  private state: TransportState = 'STOPPED';
  private speedMultiplier = 1.0;
  private isLooping = false;

  // Authoritative Single-Event Scheduling on Tone.Transport
  private activeEventId: number | null = null;
  private nextTransportTime = 0;

  // Controlled Buffering State
  private isBuffering = false;
  private bufferingReason: string | null = null;
  private wasPlayingBeforeBuffering = false;

  // Visual Dispatch Queue (synchronized to Tone.now() via RAF)
  private visualQueue: ScheduledItem[] = [];
  private rafId: number | null = null;
  private isTabHidden = false;

  // Measured Synchronization Error Metrics
  private syncMetrics: MeasuredSyncError = {
    lastJitterMs: 0,
    meanJitterMs: 0,
    maxJitterMs: 0,
    sampleCount: 0,
  };

  private tickListeners: Set<TickCallback> = new Set();
  private stateListeners: Set<StateChangeCallback> = new Set();
  private bufferingListeners: Set<BufferingCallback> = new Set();
  private isNotifying = false;

  constructor() {
    this.initVisibilityListener();
  }

  /**
   * Browser tab visibility change listener
   * Prevents visual queue accumulation when tab is backgrounded
   */
  private initVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isTabHidden = true;
        } else {
          this.isTabHidden = false;
          // Tab became visible again: flush stale visual queue items immediately
          this.visualQueue = [];

          // Immediately sync visual display to active observation
          const currentObs = this.observations[this.currentIndex];
          if (currentObs) {
            const prev = this.currentIndex > 0 ? this.observations[this.currentIndex - 1] : undefined;
            const params = mapObservationToAudio(currentObs, prev);
            this.notifyTick(currentObs, params, this.currentIndex, Tone.now());
          }
        }
      });
    }
  }

  /**
   * Loads a scientific observation sequence into Tone.Transport
   */
  public loadSequence(observations: EicObservation[], startIndex = 0): void {
    this.stop();
    this.observations = observations;
    const clamped = Math.max(0, Math.min(Math.max(0, observations.length - 1), startIndex));
    this.currentIndex = clamped;

    // Reset sync metrics for clean observation track
    this.resetSyncMetrics();

    if (this.observations.length > 0) {
      const obs = this.observations[clamped];
      const prev = clamped > 0 ? this.observations[clamped - 1] : undefined;
      const params = mapObservationToAudio(obs, prev);
      this.notifyTick(obs, params, clamped, Tone.now());
    }
  }

  /**
   * Begins or resumes timeline playback driven by Tone.Transport
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
    }

    this.setState('PLAYING');
    this.visualQueue = [];

    // Start Tone.Transport master clock
    const transport = Tone.getTransport();
    transport.stop();
    transport.seconds = 0;
    transport.start();

    // Schedule initial observation tick
    this.nextTransportTime = 0.03; // 30ms lead-in
    this.scheduleNextTick(this.currentIndex);
    this.startVisualDispatch();
  }

  /**
   * Schedules the next observation tick on Tone.Transport
   */
  private scheduleNextTick(index: number): void {
    this.cancelActiveScheduledEvent();
    if (this.state !== 'PLAYING') return;

    if (index >= this.observations.length) {
      if (this.isLooping) {
        index = 0;
      } else {
        this.stop();
        return;
      }
    }

    const obs = this.observations[index];
    const prevObs = index > 0 ? this.observations[index - 1] : undefined;
    const params = mapObservationToAudio(obs, prevObs);

    const transport = Tone.getTransport();
    this.activeEventId = transport.scheduleOnce((time) => {
      this.activeEventId = null;
      if (this.state !== 'PLAYING') return;

      // If buffering, do not trigger audio or advance playhead
      if (this.isBuffering) return;

      // 1. Trigger deterministic sound synthesis at exact audio hardware time
      sonificationCore.playMeasurement(params, time);

      // 2. Queue visual dispatch synchronized to exact presentation time
      this.visualQueue.push({
        index,
        observation: obs,
        params,
        targetAudioTime: time,
      });

      // 3. Compute step duration adjusted for playback speed multiplier
      const baseDurationSec = Math.max(0.20, params.stepIntervalMs / 1000);
      const stepDurationSec = baseDurationSec / this.speedMultiplier;

      // 4. Schedule next sequential observation event
      this.nextTransportTime = transport.seconds + stepDurationSec;
      this.scheduleNextTick(index + 1);
    }, this.nextTransportTime);
  }

  /**
   * Cancels active scheduled event on Tone.Transport
   */
  private cancelActiveScheduledEvent(): void {
    if (this.activeEventId !== null) {
      try {
        Tone.getTransport().clear(this.activeEventId);
      } catch {}
      this.activeEventId = null;
    }
  }

  /**
   * Pauses the transport at the current observation index
   */
  public pause(): void {
    if (this.state !== 'PLAYING') return;
    this.cancelActiveScheduledEvent();
    Tone.getTransport().pause();
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
    this.cancelActiveScheduledEvent();
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    this.visualQueue = [];
    this.currentIndex = 0;
    sonificationCore.stopAll();
    this.setState('STOPPED');

    if (this.observations.length > 0) {
      const first = this.observations[0];
      const params = mapObservationToAudio(first);
      this.notifyTick(first, params, 0, Tone.now());
    }
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
   * Strictly cancels active scheduled event, clears stale visual queue, and aligns playhead
   */
  public seekToIndex(index: number, triggerAudio = true): void {
    if (this.observations.length === 0) return;
    const clamped = Math.max(0, Math.min(this.observations.length - 1, index));
    this.currentIndex = clamped;

    // 1. Immediately silence sounding voices & cancel scheduled Tone events
    this.cancelActiveScheduledEvent();
    sonificationCore.stopAll();
    this.visualQueue = [];

    const currentObs = this.observations[clamped];
    const prevObs = clamped > 0 ? this.observations[clamped - 1] : undefined;
    const params = mapObservationToAudio(currentObs, prevObs);

    // 2. If transport was playing, re-anchor playback from seek target
    if (this.state === 'PLAYING') {
      this.nextTransportTime = Tone.getTransport().seconds + 0.03;
      this.scheduleNextTick(clamped);
    }

    // 3. Trigger immediate sample preview if requested
    if (triggerAudio) {
      sonificationCore.playMeasurement(params);
    }

    // 4. Update visual display synchronously
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

  /**
   * Controlled Buffering Management
   * Never allow a slow frame or video download to desynchronize scientific data and audio silently
   */
  public setBuffering(isBuffering: boolean, reason?: string): void {
    if (this.isBuffering === isBuffering) return;
    this.isBuffering = isBuffering;
    this.bufferingReason = isBuffering ? (reason || 'Buffering observation assets...') : null;

    if (isBuffering) {
      if (this.state === 'PLAYING') {
        this.wasPlayingBeforeBuffering = true;
        this.cancelActiveScheduledEvent();
        Tone.getTransport().pause();
        sonificationCore.stopAll();
        this.setState('PAUSED');
      }
    } else {
      if (this.wasPlayingBeforeBuffering) {
        this.wasPlayingBeforeBuffering = false;
        Tone.getTransport().start();
        this.setState('PLAYING');
        this.nextTransportTime = Tone.getTransport().seconds + 0.03;
        this.scheduleNextTick(this.currentIndex);
      }
    }

    this.notifyBuffering({ isBuffering, reason: this.bufferingReason || undefined });
  }

  public getIsBuffering(): boolean {
    return this.isBuffering;
  }

  public getBufferingReason(): string | null {
    return this.bufferingReason;
  }

  // ---------------------------------------------------------------------------
  // Synchronized Visual Dispatch Loop (RAF driven by Tone.now())
  // ---------------------------------------------------------------------------
  private checkVisualDispatch(): void {
    if (this.isTabHidden) return;
    const currentAudioTime = Tone.now();

    while (this.visualQueue.length > 0 && this.visualQueue[0].targetAudioTime <= currentAudioTime) {
      const item = this.visualQueue.shift()!;
      // Precise audio-clock latency: difference between scheduled audio time and DAC presentation
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
    if (this.isTabHidden) return;
    const clamped = Math.max(0, jitterMs);
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

  public resetSyncMetrics(): void {
    this.syncMetrics = {
      lastJitterMs: 0,
      meanJitterMs: 0,
      maxJitterMs: 0,
      sampleCount: 0,
    };
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

  private notifyBuffering(payload: BufferingPayload): void {
    this.bufferingListeners.forEach((l) => l(payload));
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
    if (this.speedMultiplier === clamped) return;

    this.speedMultiplier = clamped;
    if (this.state === 'PLAYING') {
      // Re-anchor schedule next tick with the updated speed multiplier
      this.cancelActiveScheduledEvent();
      this.nextTransportTime = Tone.getTransport().seconds + 0.02;
      this.scheduleNextTick(this.currentIndex);
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

  public getCurrentPlaybackSeconds(): number {
    return Tone.getTransport().seconds;
  }

  /**
   * Diagnostic summary of synchronization health
   */
  public getDiagnostics() {
    const currentObs = this.getCurrentObservation();
    return {
      clockSource: 'Tone.Transport (Web Audio Context Clock)',
      transportState: this.state,
      currentIndex: this.currentIndex,
      totalObservations: this.observations.length,
      currentYear: currentObs?.year ?? null,
      currentValue: currentObs?.originalValue ?? null,
      playbackSeconds: Tone.getTransport().seconds,
      speedMultiplier: this.speedMultiplier,
      isLooping: this.isLooping,
      isBuffering: this.isBuffering,
      bufferingReason: this.bufferingReason,
      syncMetrics: { ...this.syncMetrics },
    };
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

  public onBuffering(listener: BufferingCallback): () => void {
    this.bufferingListeners.add(listener);
    return () => this.bufferingListeners.delete(listener);
  }

  public dispose(): void {
    this.stop();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.tickListeners.clear();
    this.stateListeners.clear();
    this.bufferingListeners.clear();
    this.observations = [];
  }
}

// Global Singleton Transport Instance
export const audioTransport = new AudioTransport();

if (typeof window !== 'undefined') {
  (window as any).__audioTransport = audioTransport;
  (window as any).Tone = Tone;
}
