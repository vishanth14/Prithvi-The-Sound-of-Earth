import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { scrollState, smoothstep, lerp } from '../lib/scrollState';
import { useExperienceStore } from './experienceStore';
import { CHAPTER_CONFIGS, CHAPTER_SEQUENCE } from './chapterConfig';
import type { CameraTransformState } from './experienceTypes';

/**
 * Central Cinematic Experience Orchestrator
 * Multiverse Vendhan — NASA Space Apps Challenge 2026
 * 
 * Manages the single Lenis smooth-scroll instance, synchronizes the GSAP ScrollTrigger
 * master timeline with labeled chapter checkpoints, and coordinates 60fps camera interpolation.
 */
class ExperienceOrchestrator {
  private lenis: Lenis | null = null;
  private triggers: ScrollTrigger[] = [];
  private masterTimeline: gsap.core.Timeline | null = null;
  private isInitialized = false;

  // High-performance mutable camera transform read by R3F useFrame (no React renders)
  public currentCameraTransform: CameraTransformState = {
    position: [0.0, 0.45, 7.5],
    lookAt: [0.0, 0.32, 0.0],
    fov: 42,
    sunIntensity: 2.2,
    ambientIntensity: 0.14,
    atmosphereGlow: 0.85,
  };

  /**
   * Initializes the unified Lenis, GSAP, and ScrollTrigger loop
   */
  public init(): void {
    if (this.isInitialized) return;

    // 1. Reduced Motion Preference Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollState.prefersReducedMotion = prefersReducedMotion;

    // 2. Single Unified Lenis Instance
    this.lenis = new Lenis({
      duration: prefersReducedMotion ? 0.1 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    (window as any).__lenis = this.lenis;
    (window as any).__scrollState = scrollState;
    (window as any).__experienceOrchestrator = this;

    // 3. Lenis scroll event updating scrollState and ScrollTrigger
    this.lenis.on('scroll', (e: any) => {
      const progress = e && typeof e.progress === 'number' ? e.progress : (this.lenis?.progress ?? 0);
      const velocity = e && typeof e.velocity === 'number' ? e.velocity : (this.lenis?.velocity ?? 0);
      const scrollY = e && typeof e.scroll === 'number' ? e.scroll : (this.lenis?.scroll ?? 0);
      scrollState.progress = Math.max(0, Math.min(1, progress));
      scrollState.velocity = velocity;
      scrollState.scrollY = scrollY;
      ScrollTrigger.update();
    });

    // 4. Single Unified GSAP Ticker Hook
    const tickerUpdate = (time: number) => {
      this.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // 5. Build Master Labeled GSAP Timeline for Chapter Choreography
    this.buildMasterTimeline();

    // 6. Register Chapter ScrollTriggers
    this.registerChapterTriggers();

    this.isInitialized = true;
  }

  /**
   * Constructs the master GSAP timeline with chapter labels and entrance/exit cues
   */
  private buildMasterTimeline(): void {
    if (this.masterTimeline) {
      this.masterTimeline.kill();
    }

    this.masterTimeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'none' },
    });

    // Chapter boundaries registered on master timeline
    this.masterTimeline.addLabel('ch1-origin', 0.0);
    this.masterTimeline.addLabel('ch2-orbit', 0.18);
    this.masterTimeline.addLabel('ch3-signals', 0.40);
    this.masterTimeline.addLabel('ch4-frequency', 0.60);
    this.masterTimeline.addLabel('ch5-decoding', 0.80);
    this.masterTimeline.addLabel('ch6-beyond', 1.00);
  }

  /**
   * Registers ScrollTrigger monitors for section tracking and camera state synchronization
   */
  private registerChapterTriggers(): void {
    this.triggers.forEach((t) => t.kill());
    this.triggers = [];

    const store = useExperienceStore.getState();

    CHAPTER_SEQUENCE.forEach((chapterId) => {
      const config = CHAPTER_CONFIGS[chapterId];
      const el = document.getElementById(config.domId);
      if (!el) return;

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => {
          store.setChapter(chapterId);
        },
        onEnterBack: () => {
          store.setChapter(chapterId);
        },
      });

      this.triggers.push(trigger);
    });
  }

  /**
   * Computes the interpolated camera & lighting target vectors for the given normalized scroll progress
   */
  public computeCameraTransform(progress: number, isMobile: boolean, distanceScale: number): CameraTransformState {
    const p = Math.max(0, Math.min(1, progress));

    if (p <= 0.12) {
      // 01 ORIGIN: Earth appears from darkness in deep space
      const t = smoothstep(0.0, 0.12, p);
      const c1 = CHAPTER_CONFIGS['ch1-origin'];
      const c2 = CHAPTER_CONFIGS['ch2-orbit'];

      const startPos: [number, number, number] = [0.0, 0.45, 7.5 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.32, 7.8 * distanceScale]
        : [1.62, -0.08, 8.2 * distanceScale];

      return {
        position: [
          lerp(startPos[0], endPos[0], t),
          lerp(startPos[1], endPos[1], t),
          lerp(startPos[2], endPos[2], t),
        ],
        lookAt: isMobile
          ? [0.0, lerp(0.32, 0.0, t), 0.0]
          : [lerp(0.0, 1.62, t), lerp(0.32, -0.08, t), 0.0],
        fov: lerp(c1.camera.fov, c2.camera.fov, t),
        sunIntensity: lerp(c1.lighting.sunIntensity, c2.lighting.sunIntensity, t),
        ambientIntensity: lerp(c1.lighting.ambientIntensity, c2.lighting.ambientIntensity, t),
        atmosphereGlow: lerp(c1.lighting.atmosphereGlow, c2.lighting.atmosphereGlow, t),
      };
    } else if (p <= 0.36) {
      // 02 ORBIT: Camera approaches Earth, atmosphere becomes richly visible
      const t = smoothstep(0.12, 0.36, p);
      const c2 = CHAPTER_CONFIGS['ch2-orbit'];
      const c3 = CHAPTER_CONFIGS['ch3-signals'];

      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.32, 7.8 * distanceScale]
        : [1.62, -0.08, 8.2 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.15, 7.4 * distanceScale]
        : [-1.45, 0.20, 6.1 * distanceScale];

      return {
        position: [
          lerp(startPos[0], endPos[0], t),
          lerp(startPos[1], endPos[1], t),
          lerp(startPos[2], endPos[2], t),
        ],
        lookAt: isMobile
          ? [0.0, 0.0, 0.0]
          : [lerp(1.62, -0.15, t), lerp(-0.08, 0.05, t), 0.0],
        fov: lerp(c2.camera.fov, c3.camera.fov, t),
        sunIntensity: lerp(c2.lighting.sunIntensity, c3.lighting.sunIntensity, t),
        ambientIntensity: lerp(c2.lighting.ambientIntensity, c3.lighting.ambientIntensity, t),
        atmosphereGlow: lerp(c2.lighting.atmosphereGlow, c3.lighting.atmosphereGlow, t),
      };
    } else if (p <= 0.52) {
      // 03 SIGNALS: Camera moves through orbital viewpoint, editorial imagery takes viewport
      const t = smoothstep(0.36, 0.52, p);
      const c3 = CHAPTER_CONFIGS['ch3-signals'];
      const c4 = CHAPTER_CONFIGS['ch4-frequency'];

      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.15, 7.4 * distanceScale]
        : [-1.45, 0.20, 6.1 * distanceScale];
      const endPos: [number, number, number] = [0.0, 0.08, 7.3 * distanceScale];

      return {
        position: [
          lerp(startPos[0], endPos[0], t),
          lerp(startPos[1], endPos[1], t),
          lerp(startPos[2], endPos[2], t),
        ],
        lookAt: isMobile
          ? [0.0, 0.0, 0.0]
          : [lerp(-0.15, 0.0, t), lerp(0.05, 0.0, t), 0.0],
        fov: lerp(c3.camera.fov, c4.camera.fov, t),
        sunIntensity: lerp(c3.lighting.sunIntensity, c4.lighting.sunIntensity, t),
        ambientIntensity: lerp(c3.lighting.ambientIntensity, c4.lighting.ambientIntensity, t),
        atmosphereGlow: lerp(c3.lighting.atmosphereGlow, c4.lighting.atmosphereGlow, t),
      };
    } else if (p <= 0.72) {
      // 04 FREQUENCY: Scene transitions into sonic laboratory
      const t = smoothstep(0.52, 0.72, p);
      const c4 = CHAPTER_CONFIGS['ch4-frequency'];
      const c5 = CHAPTER_CONFIGS['ch5-decoding'];

      const startPos: [number, number, number] = [0.0, 0.08, 7.3 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.0, 7.6 * distanceScale]
        : [1.75, 0.12, 7.2 * distanceScale];

      return {
        position: [
          lerp(startPos[0], endPos[0], t),
          lerp(startPos[1], endPos[1], t),
          lerp(startPos[2], endPos[2], t),
        ],
        lookAt: [0.0, 0.0, 0.0],
        fov: lerp(c4.camera.fov, c5.camera.fov, t),
        sunIntensity: lerp(c4.lighting.sunIntensity, c5.lighting.sunIntensity, t),
        ambientIntensity: lerp(c4.lighting.ambientIntensity, c5.lighting.ambientIntensity, t),
        atmosphereGlow: lerp(c4.lighting.atmosphereGlow, c5.lighting.atmosphereGlow, t),
      };
    } else if (p <= 0.88) {
      // 05 DECODING: Experience settles into technical editorial composition
      const t = smoothstep(0.72, 0.88, p);
      const c5 = CHAPTER_CONFIGS['ch5-decoding'];
      const c6 = CHAPTER_CONFIGS['ch6-beyond'];

      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.0, 7.6 * distanceScale]
        : [1.75, 0.12, 7.2 * distanceScale];
      const endPos: [number, number, number] = [0.0, 0.05, 8.2 * distanceScale];

      return {
        position: [
          lerp(startPos[0], endPos[0], t),
          lerp(startPos[1], endPos[1], t),
          lerp(startPos[2], endPos[2], t),
        ],
        lookAt: [0.0, 0.0, 0.0],
        fov: lerp(c5.camera.fov, c6.camera.fov, t),
        sunIntensity: lerp(c5.lighting.sunIntensity, c6.lighting.sunIntensity, t),
        ambientIntensity: lerp(c5.lighting.ambientIntensity, c6.lighting.ambientIntensity, t),
        atmosphereGlow: lerp(c5.lighting.atmosphereGlow, c6.lighting.atmosphereGlow, t),
      };
    } else {
      // 06 BEYOND: Final scene reveals the open-science story
      const c6 = CHAPTER_CONFIGS['ch6-beyond'];
      return {
        position: [0.0, 0.05, 8.2 * distanceScale],
        lookAt: [0.0, 0.0, 0.0],
        fov: c6.camera.fov,
        sunIntensity: c6.lighting.sunIntensity,
        ambientIntensity: c6.lighting.ambientIntensity,
        atmosphereGlow: c6.lighting.atmosphereGlow,
      };
    }
  }

  /**
   * Clean unmount disposal to prevent memory leaks, orphaned triggers, and ticker loops
   */
  public dispose(): void {
    this.triggers.forEach((t) => t.kill());
    this.triggers = [];
    if (this.masterTimeline) {
      this.masterTimeline.kill();
      this.masterTimeline = null;
    }
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.isInitialized = false;
  }
}

export const experienceOrchestrator = new ExperienceOrchestrator();
