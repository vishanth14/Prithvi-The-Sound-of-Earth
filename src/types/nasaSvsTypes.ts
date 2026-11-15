/**
 * PRITHVI — NASA SVS #5190 Frame-by-Frame Synchronization Types
 * 
 * SVS Resource: NASA SVS #5190 (Climate Spiral 1880-Present by Mark SubbaRao)
 * Scientific Source: NASA GISS GISTEMP v4 (1951-1980 Baseline)
 * Animation Specification: 2160x2160 @ 60fps, 1800 total frames (30.0s)
 * Timing Reality: 2D Spiral runs 0.0s to 23.366s (1402 frames, 1880 to 2026.83).
 * Rate: ~9.55 frames/year (~0.796 frames/month). 1 frame != 1 month.
 */

export interface NasaSvsFrame {
  year: number;
  month: number;
  anomaly: number;
  uncertainty: number;
  milestone: string;
  timestampSeconds: number;
  frameIndex: number;
  webpUri: string;
  jpgUri: string;
  svsId: number;
  dataset: string;
  baseline: string;
  resolution: string;
  originalResolution: string;
  fps: number;
  author: string;
}

export type VisualComparisonMode = 'dual' | 'nasa-original' | 'prithvi-spiral' | '3d-tornado';

export type FrameLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

export interface FrameSyncState {
  currentFrame: NasaSvsFrame | null;
  loadingState: FrameLoadingState;
  comparisonMode: VisualComparisonMode;
  preloadedCount: number;
  videoSynchronized: boolean;
}
