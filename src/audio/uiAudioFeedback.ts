import * as Tone from 'tone';
import { useObservatoryStore } from '../store/useObservatoryStore';

/**
 * PRITHVI — Restrained Aerospace Interface Audio Feedback
 * 
 * Provides subtle, tactile acoustic feedback for user interactions:
 * - Extremely soft (-36dB to -44dB) so it never interferes with scientific sonification.
 * - Operates ONLY after explicit audio initialization (when isAudioUnlocked === true).
 * - Rate-limited / debounced to prevent acoustic clutter during rapid mouse movement.
 * - Zero interference with the scientific sonification synthesizer voices.
 */

type UiSoundType = 'hover' | 'click' | 'toggle' | 'chapter';

class UiAudioFeedbackEngine {
  private synth: Tone.Synth | null = null;
  private clickFilter: Tone.Filter | null = null;
  private gainNode: Tone.Gain | null = null;
  private lastPlayTime: Record<UiSoundType, number> = {
    hover: 0,
    click: 0,
    toggle: 0,
    chapter: 0,
  };

  private minIntervals: Record<UiSoundType, number> = {
    hover: 85,    // At least 85ms between hover ticks to avoid buzzing
    click: 50,
    toggle: 80,
    chapter: 600, // Chapter notifications are spacious
  };

  private initEngine() {
    if (this.synth) return;
    try {
      this.gainNode = new Tone.Gain(0.22).toDestination();
      this.clickFilter = new Tone.Filter({
        frequency: 3200,
        type: 'bandpass',
        Q: 2.5,
      }).connect(this.gainNode);

      this.synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.025,
          sustain: 0.0,
          release: 0.02,
        },
      }).connect(this.clickFilter);
      this.synth.volume.value = -38; // Extremely soft, luxury tactile feel
    } catch {
      // Audio context might be restricted or pending
    }
  }

  public play(type: UiSoundType) {
    const store = useObservatoryStore.getState();
    if (!store.isAudioUnlocked || store.isMuted) return;

    const now = performance.now();
    if (now - this.lastPlayTime[type] < this.minIntervals[type]) {
      return;
    }
    this.lastPlayTime[type] = now;

    if (!this.synth) {
      this.initEngine();
    }
    if (!this.synth) return;

    try {
      switch (type) {
        case 'hover': {
          // 8ms delicate micro-tick at 2400 Hz (like a precision Leica shutter or cockpit dial)
          this.synth.triggerAttackRelease(2400, '32n', undefined, 0.12);
          break;
        }
        case 'click': {
          // 14ms tactile click at 1800 Hz
          this.synth.triggerAttackRelease(1800, '32n', undefined, 0.28);
          break;
        }
        case 'toggle': {
          // Crisp harmonic blip
          this.synth.triggerAttackRelease(2100, '16n', undefined, 0.22);
          break;
        }
        case 'chapter': {
          // Soft resonant milestone bell
          this.synth.triggerAttackRelease(880, '16n', undefined, 0.18);
          break;
        }
      }
    } catch {
      // Ignore audio scheduling race conditions during rapid teardown
    }
  }
}

export const uiAudioFeedback = new UiAudioFeedbackEngine();
