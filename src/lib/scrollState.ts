/**
 * High-Performance Scroll State Object for Continuous 3D Spatial Storytelling
 * 
 * Shared between Lenis, GSAP ScrollTrigger, and React Three Fiber useFrame.
 * Reading or updating this does NOT cause React component re-renders.
 */
export interface ChapterProgressMap {
  hero: number;
  explorer: number;
  fleet: number;
  stories: number;
  jukebox: number;
  signal: number;
  openScience: number;
}

export interface ScrollState {
  // Global normalized scroll progress [0.0 to 1.0]
  progress: number;
  // Normalized scroll velocity (positive = scrolling down, negative = scrolling up)
  velocity: number;
  // Raw scroll position in pixels
  scrollY: number;
  // Active chapter identifier
  activeChapter: 'hero' | 'explorer' | 'fleet' | 'stories' | 'jukebox' | 'signal' | 'open-science';
  // Per-chapter scroll progression [0.0 to 1.0]
  chapterProgress: ChapterProgressMap;
  // User interaction flag: true when user is actively dragging the 3D globe
  isInteractingWithGlobe: boolean;
  // Flag indicating if device prefers reduced motion
  prefersReducedMotion: boolean;
}

export const scrollState: ScrollState = {
  progress: 0,
  velocity: 0,
  scrollY: 0,
  activeChapter: 'hero',
  chapterProgress: {
    hero: 0,
    explorer: 0,
    fleet: 0,
    stories: 0,
    jukebox: 0,
    signal: 0,
    openScience: 0,
  },
  isInteractingWithGlobe: false,
  prefersReducedMotion: false,
};

// Helper function to linearly interpolate between two values
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}

// Helper function for cubic smoothstep interpolation
export function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
