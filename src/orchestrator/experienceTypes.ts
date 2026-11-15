/**
 * PRITHVI — THE SOUND OF EARTH
 * Central Cinematic Experience Orchestration Types
 * Multiverse Vendhan — NASA Space Apps Challenge 2026
 */

export type ChapterId =
  | 'ch1-origin'     // 01 ORIGIN: Hero / Earth appears from deep space
  | 'ch2-orbit'      // 02 ORBIT: Explorer & Fleet / Atmosphere & Sentinels approach
  | 'ch3-signals'    // 03 SIGNALS: Stories / Orbital viewpoint & Editorial imagery
  | 'ch4-frequency'  // 04 FREQUENCY: Earth Jukebox / Sonic laboratory
  | 'ch5-decoding'   // 05 DECODING: Understand Signal / Technical mathematical composition
  | 'ch6-beyond';    // 06 BEYOND: Open Science / Living planetary legacy

export type CameraMode =
  | 'origin'
  | 'orbit'
  | 'signals'
  | 'frequency'
  | 'decoding'
  | 'beyond';

export type VisualScene =
  | 'deep-space-origin'
  | 'planetary-aperture'
  | 'orbital-signals'
  | 'sonic-laboratory'
  | 'technical-decoding'
  | 'open-science-archive';

export interface ChapterConfig {
  id: ChapterId;
  domId: string;
  chapterNumber: string;
  romanNumeral: string;
  title: string;
  subtitle: string;
  cameraMode: CameraMode;
  visualScene: VisualScene;
  progressStart: number;
  progressEnd: number;
  // Visual lighting parameters for 3D Earth environment
  lighting: {
    sunIntensity: number;
    ambientIntensity: number;
    earthshineIntensity: number;
    sunPosition: [number, number, number];
    atmosphereGlow: number;
  };
  // Camera transform targets [x, y, z]
  camera: {
    position: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  };
}

export interface ChapterTransitionState {
  isTransitioning: boolean;
  fromChapter: ChapterId | null;
  toChapter: ChapterId | null;
  progress: number;
  direction: 'forward' | 'backward' | 'direct';
}

export interface CameraTransformState {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  sunIntensity: number;
  ambientIntensity: number;
  atmosphereGlow: number;
}
