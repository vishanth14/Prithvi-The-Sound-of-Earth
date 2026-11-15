import type { ChapterId, ChapterConfig } from './experienceTypes';

export const CHAPTER_CONFIGS: Record<ChapterId, ChapterConfig> = {
  'ch1-origin': {
    id: 'ch1-origin',
    domId: 'hero',
    chapterNumber: '01',
    romanNumeral: 'I',
    title: 'ORIGIN',
    subtitle: 'Earth Appears From Deep Space',
    cameraMode: 'origin',
    visualScene: 'deep-space-origin',
    progressStart: 0.0,
    progressEnd: 0.12,
    lighting: {
      sunIntensity: 2.4,
      ambientIntensity: 0.55,
      earthshineIntensity: 0.25,
      sunPosition: [-4.0, 2.8, 4.5],
      atmosphereGlow: 0.95,
    },
    camera: {
      position: [0.0, 0.0, 6.8],
      lookAt: [0.0, 0.0, 0.0],
      fov: 42,
    },
  },

  'ch2-orbit': {
    id: 'ch2-orbit',
    domId: 'explorer',
    chapterNumber: '02',
    romanNumeral: 'II',
    title: 'ORBIT',
    subtitle: 'Planetary Approach & Atmospheric Horizon',
    cameraMode: 'orbit',
    visualScene: 'planetary-aperture',
    progressStart: 0.12,
    progressEnd: 0.36,
    lighting: {
      sunIntensity: 2.5,
      ambientIntensity: 0.18,
      earthshineIntensity: 0.16,
      sunPosition: [-4.5, 2.8, 4.2],
      atmosphereGlow: 1.15,
    },
    camera: {
      position: [1.62, -0.08, 6.8],
      lookAt: [1.62, -0.08, 0.0],
      fov: 44,
    },
  },

  'ch3-signals': {
    id: 'ch3-signals',
    domId: 'stories',
    chapterNumber: '03',
    romanNumeral: 'III',
    title: 'SIGNALS',
    subtitle: 'Orbital Viewpoint & Planetary Narratives',
    cameraMode: 'signals',
    visualScene: 'orbital-signals',
    progressStart: 0.36,
    progressEnd: 0.52,
    lighting: {
      sunIntensity: 2.0,
      ambientIntensity: 0.12,
      earthshineIntensity: 0.20,
      sunPosition: [-3.8, 3.2, 3.5],
      atmosphereGlow: 0.95,
    },
    camera: {
      position: [-1.45, 0.20, 6.1],
      lookAt: [-0.15, 0.05, 0.0],
      fov: 45,
    },
  },

  'ch4-frequency': {
    id: 'ch4-frequency',
    domId: 'jukebox',
    chapterNumber: '04',
    romanNumeral: 'IV',
    title: 'FREQUENCY',
    subtitle: 'The Sonic Laboratory & SVS #5190 Polar Spiral',
    cameraMode: 'frequency',
    visualScene: 'sonic-laboratory',
    progressStart: 0.52,
    progressEnd: 0.72,
    lighting: {
      sunIntensity: 1.6,
      ambientIntensity: 0.10,
      earthshineIntensity: 0.08,
      sunPosition: [-5.0, 2.5, 4.0],
      atmosphereGlow: 0.70,
    },
    camera: {
      position: [0.0, 0.08, 7.3],
      lookAt: [0.0, 0.0, 0.0],
      fov: 43,
    },
  },

  'ch5-decoding': {
    id: 'ch5-decoding',
    domId: 'signal',
    chapterNumber: '05',
    romanNumeral: 'V',
    title: 'DECODING',
    subtitle: 'Technical Editorial & Mathematical Mapping',
    cameraMode: 'decoding',
    visualScene: 'technical-decoding',
    progressStart: 0.72,
    progressEnd: 0.88,
    lighting: {
      sunIntensity: 2.1,
      ambientIntensity: 0.16,
      earthshineIntensity: 0.14,
      sunPosition: [-4.2, 3.0, 4.2],
      atmosphereGlow: 1.0,
    },
    camera: {
      position: [1.75, 0.12, 7.2],
      lookAt: [0.0, 0.0, 0.0],
      fov: 44,
    },
  },

  'ch6-beyond': {
    id: 'ch6-beyond',
    domId: 'open-science',
    chapterNumber: '06',
    romanNumeral: 'VI',
    title: 'BEYOND',
    subtitle: 'Living Planetary Archive & Open Science Dossier',
    cameraMode: 'beyond',
    visualScene: 'open-science-archive',
    progressStart: 0.88,
    progressEnd: 1.0,
    lighting: {
      sunIntensity: 1.9,
      ambientIntensity: 0.15,
      earthshineIntensity: 0.12,
      sunPosition: [-5, 3, 4],
      atmosphereGlow: 0.90,
    },
    camera: {
      position: [0.0, 0.05, 8.2],
      lookAt: [0.0, 0.0, 0.0],
      fov: 42,
    },
  },
};

export const CHAPTER_SEQUENCE: ChapterId[] = [
  'ch1-origin',
  'ch2-orbit',
  'ch3-signals',
  'ch4-frequency',
  'ch5-decoding',
  'ch6-beyond',
];

export function getChapterByDomId(domId: string): ChapterConfig | undefined {
  if (domId === 'fleet') return CHAPTER_CONFIGS['ch2-orbit'];
  return Object.values(CHAPTER_CONFIGS).find((c) => c.domId === domId);
}
