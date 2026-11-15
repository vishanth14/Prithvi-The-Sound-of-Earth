import React, { Suspense, Component, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { easing } from 'maath';
import { EarthGlobe } from './EarthGlobe';
import { CosmicParticles } from './CosmicParticles';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { scrollState, smoothstep, lerp } from '../../lib/scrollState';
import { AlertCircle, Globe } from 'lucide-react';

// Converts Latitude & Longitude to 3D Cartesian coordinates on sphere (Radius 2.0)
function latLngToVector3(lat: number, lng: number, radius = 2.016): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);
  return [x, y, z];
}

/**
 * Continuous 3D Scroll-Driven Camera Controller
 * 
 * Maps continuous Lenis / GSAP scroll progress directly to 3D camera trajectory:
 * - Chapter 1 (0.00 - 0.20): Orbital Entry in deep space.
 * - Chapter 2 (0.20 - 0.42): The Planet approaches, shifts left for editorial aperture.
 * - Chapter 3 (0.42 - 0.65): Planetary Signals, atmospheric perspective & satellite tracks.
 * - Chapter 4 (0.65 - 0.84): Earth in Sound, transitions to sonification split layout.
 * - Chapter 5 (0.84 - 1.00): Understanding the Data, settles into scientific viewing position.
 */
const ContinuousScrollCameraController: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isInteractingRef: React.RefObject<boolean>;
}> = ({ controlsRef, isInteractingRef }) => {
  const { activeSentinelId } = useObservatoryStore();

  useFrame((state, delta) => {
    // If user is actively dragging the 3D globe, do not override their manual view
    if (isInteractingRef.current || scrollState.isInteractingWithGlobe) return;

    // Viewport aspect ratio & mobile detection
    const aspect = state.size.width / state.size.height;
    const isMobile = state.size.width < 768;

    // Distance scale to ensure zero edge clipping on narrow/portrait screens
    let distanceScale = 1.0;
    if (aspect < 0.6) {
      distanceScale = Math.max(1.0, 0.72 / aspect); // ~1.55 on mobile (e.g. 390x844)
    } else if (aspect < 1.0) {
      distanceScale = Math.max(1.0, 0.88 / aspect);
    } else if (aspect < 1.3) {
      distanceScale = 1.06;
    }

    // Continuous 5-Chapter Flight Path Coordinates synchronized to exact DOM section offsets
    const p = scrollState.progress;

    // Climate Sentinel Station Focus (Active when exploring inside Chapter 2)
    if (activeSentinelId && p >= 0.08 && p <= 0.30) {
      const coords: Record<string, { lat: number; lng: number }> = {
        'mauna-loa': { lat: 19.5362, lng: -155.5763 },
        'svalbard': { lat: 78.2232, lng: 15.6267 },
        'vostok': { lat: -78.4644, lng: 106.8373 },
        'atto-amazon': { lat: -2.1436, lng: -59.0011 },
        'pacific-tao': { lat: 0.0, lng: -140.0 },
      };
      const c = coords[activeSentinelId];
      if (c) {
        const [sx, sy, sz] = latLngToVector3(c.lat, c.lng, 2.0);
        const norm = Math.hypot(sx, sy, sz) || 2.0;
        const camDistance = 4.2 * distanceScale;
        const targetPos: [number, number, number] = [
          (sx / norm) * camDistance,
          (sy / norm) * camDistance + 0.12,
          (sz / norm) * camDistance,
        ];
        easing.damp3(state.camera.position, targetPos, 0.6, delta);
        if (controlsRef.current) {
          easing.damp3(controlsRef.current.target, [sx * 0.35, sy * 0.35, sz * 0.35], 0.6, delta);
          controlsRef.current.update();
        }
        return;
      }
    }

    // If user prefers reduced motion, hold a calm, centered, stable vantage
    if (scrollState.prefersReducedMotion) {
      const calmPos: [number, number, number] = [0.0, 0.15, 7.6 * distanceScale];
      easing.damp3(state.camera.position, calmPos, 0.5, delta);
      if (controlsRef.current) {
        easing.damp3(controlsRef.current.target, [0, 0.1, 0], 0.5, delta);
        controlsRef.current.update();
      }
      return;
    }

    let targetPos: [number, number, number] = [0.0, 0.45, 7.5 * distanceScale];
    let targetLookAt: [number, number, number] = [0.0, 0.32, 0.0];

    if (p <= 0.11) {
      // CHAPTER 1 — ORBITAL ENTRY (Hero Section: p = 0.00 to 0.11)
      const t = smoothstep(0.0, 0.11, p);
      const startPos: [number, number, number] = [0.0, 0.45, 7.5 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.32, 7.8 * distanceScale]
        : [1.62, -0.08, 8.4 * distanceScale];

      targetPos = [
        lerp(startPos[0], endPos[0], t),
        lerp(startPos[1], endPos[1], t),
        lerp(startPos[2], endPos[2], t),
      ];
      targetLookAt = isMobile
        ? [0.0, lerp(0.32, 0.0, t), 0.0]
        : [lerp(0.0, 1.62, t), lerp(0.32, -0.08, t), 0.0];
    } else if (p <= 0.24) {
      // CHAPTER 2 — THE PLANET / APERTURE (Explorer Section: p = 0.11 to 0.24)
      // Holds stable, unclipped aperture framing across the interactive exploration section
      targetPos = isMobile
        ? [0.0, 0.32, 7.8 * distanceScale]
        : [1.62, -0.08, 8.4 * distanceScale];
      targetLookAt = isMobile
        ? [0.0, 0.0, 0.0]
        : [1.62, -0.08, 0.0];
    } else if (p <= 0.36) {
      // CHAPTER 2.5 — FLEET CONSTELLATION (Fleet Section: p = 0.24 to 0.36)
      const t = smoothstep(0.24, 0.36, p);
      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.32, 7.8 * distanceScale]
        : [1.62, -0.08, 8.4 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.85, 7.0 * distanceScale]
        : [0.65, 1.80, 5.8 * distanceScale];

      targetPos = [
        lerp(startPos[0], endPos[0], t),
        lerp(startPos[1], endPos[1], t),
        lerp(startPos[2], endPos[2], t),
      ];
      targetLookAt = isMobile
        ? [0.0, 0.0, 0.0]
        : [lerp(1.62, 0.0, t), lerp(-0.08, 0.20, t), 0.0];
    } else if (p <= 0.51) {
      // CHAPTER 3 — PLANETARY SIGNALS (Stories Section: p = 0.36 to 0.51)
      const t = smoothstep(0.36, 0.51, p);
      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.20, 7.8 * distanceScale]
        : [-1.20, 0.00, 6.4 * distanceScale];
      const endPos: [number, number, number] = isMobile
        ? [0.0, 0.0, 8.2 * distanceScale]
        : [1.70, -0.15, 6.2 * distanceScale];

      targetPos = [
        lerp(startPos[0], endPos[0], t),
        lerp(startPos[1], endPos[1], t),
        lerp(startPos[2], endPos[2], t),
      ];
      targetLookAt = isMobile
        ? [0.0, 0.0, 0.0]
        : [lerp(0.0, 0.15, t), 0.0, 0.0];
    } else if (p <= 0.69) {
      // CHAPTER 4 — EARTH IN SOUND (Jukebox Section: p = 0.51 to 0.69)
      const t = smoothstep(0.51, 0.69, p);
      const startPos: [number, number, number] = isMobile
        ? [0.0, 0.0, 8.2 * distanceScale]
        : [1.70, -0.15, 6.2 * distanceScale];
      const endPos: [number, number, number] = [0.0, 0.05, 7.4 * distanceScale];

      targetPos = [
        lerp(startPos[0], endPos[0], t),
        lerp(startPos[1], endPos[1], t),
        lerp(startPos[2], endPos[2], t),
      ];
      targetLookAt = isMobile
        ? [0.0, 0.0, 0.0]
        : [lerp(0.15, 0.0, t), 0.0, 0.0];
    } else {
      // CHAPTER 5 — UNDERSTANDING THE DATA / OPEN SCIENCE (Science Section: p = 0.69 to 1.00)
      targetPos = [0.0, 0.05, 7.4 * distanceScale];
      targetLookAt = [0.0, 0.0, 0.0];
    }

    // Smooth camera damping using maath (0.55s half-life for cinematic fluidity)
    easing.damp3(state.camera.position, targetPos, 0.55, delta);

    if (controlsRef.current) {
      easing.damp3(controlsRef.current.target, targetLookAt, 0.55, delta);
      controlsRef.current.update();
    }
  });

  return null;
};

// WebGL Fallback Error Boundary
interface FallbackProps {
  children: React.ReactNode;
}

interface FallbackState {
  hasError: boolean;
  errorMessage: string;
}

class WebGLErrorBoundary extends Component<FallbackProps, FallbackState> {
  constructor(props: FallbackProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): FallbackState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('WebGL Rendering Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 bg-[#070B10] border border-[#252D36] text-center">
          <Globe className="w-12 h-12 text-[#FF5938] mb-3 animate-pulse" />
          <h3 className="font-display text-lg font-bold text-[#E9EDF0] mb-2 uppercase">
            3D Planetary Viewport Standby
          </h3>
          <p className="font-sans text-xs text-[#E9EDF0]/70 max-w-sm mb-4">
            Hardware acceleration is unavailable or WebGL context was reset. Telemetry,
            sonification, and scientific datasets remain fully operational.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#FF5938] border border-[#FF5938]/30 px-3 py-1 bg-[#FF5938]/10">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>FALLBACK TELEMETRY MODE ACTIVE</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Root Persistent Earth Canvas
 * Maintained as a single, continuous 3D planetary environment across all chapters.
 */
export const PersistentEarthCanvas: React.FC = () => {
  const { globeRotating } = useObservatoryStore();
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const isInteractingRef = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <WebGLErrorBoundary>
      <div className="relative w-full h-full pointer-events-auto">
        <Canvas
          camera={{ position: [0.0, -0.02, 7.8], fov: 42 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.88,
          }}
        >
          <Suspense fallback={null}>
            {/* Continuous Scroll-Driven Camera Controller */}
            <ContinuousScrollCameraController
              controlsRef={controlsRef}
              isInteractingRef={isInteractingRef}
            />

            {/* Solar Directional Illumination (Key Light aligned with shader uSunPosition [-5, 3, 4]) */}
            <directionalLight position={[-5, 3, 4]} intensity={2.0} color="#fffcf5" />
            {/* Deep Space Ambient Earthshine */}
            <ambientLight intensity={0.15} color="#0c1730" />
            {/* Deep Oceanic Earthshine Scatter */}
            <pointLight position={[5, -2, -4]} intensity={0.12} color="#17465B" />

            {/* 3D Distant Starfield */}
            <Stars
              radius={80}
              depth={40}
              count={900}
              factor={3}
              saturation={0}
              fade
              speed={0.35}
            />

            {/* Fine Cosmic Particles Responding to Scroll Velocity */}
            <CosmicParticles />

            {/* 3D Photorealistic Planetary Mesh */}
            <EarthGlobe />

            {/* Orbit Controls with User Interaction Hooks */}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={true}
              minDistance={3.2}
              maxDistance={12.0}
              autoRotate={globeRotating}
              autoRotateSpeed={0.35}
              dampingFactor={0.05}
              rotateSpeed={0.65}
              onStart={() => {
                isInteractingRef.current = true;
                scrollState.isInteractingWithGlobe = true;
              }}
              onEnd={() => {
                isInteractingRef.current = false;
                scrollState.isInteractingWithGlobe = false;
              }}
            />

            {/* Postprocessing Pipeline (Desktop Only) */}
            {!isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.96}
                  luminanceSmoothing={0.15}
                  intensity={0.16}
                  radius={0.25}
                />
                <Vignette eskil={false} offset={0.12} darkness={0.65} />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
