import React, { Suspense, Component, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { easing } from 'maath';
import { EarthGlobe } from './EarthGlobe';
import { CosmicParticles } from './CosmicParticles';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { scrollState } from '../../lib/scrollState';
import { experienceOrchestrator } from '../../orchestrator/experienceOrchestrator';
import { Globe } from 'lucide-react';

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
 * Continuous 6-Chapter Cinematic Camera Controller
 * 
 * Synchronized with the Central Experience Orchestrator:
 * - 01 ORIGIN: Earth appears from darkness in deep space.
 * - 02 ORBIT: Camera approaches Earth, Rayleigh atmosphere becomes visible.
 * - 03 SIGNALS: Camera moves through orbital viewpoint, editorial imagery takes over.
 * - 04 FREQUENCY: Scene transitions into sonic laboratory.
 * - 05 DECODING: Settles into technical editorial composition.
 * - 06 BEYOND: Final scene reveals the open-science story.
 */
const ContinuousScrollCameraController: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isInteractingRef: React.RefObject<boolean>;
}> = ({ controlsRef, isInteractingRef }) => {
  const { activeSentinelId, cameraResetTrigger } = useObservatoryStore();
  const lastResetRef = useRef(cameraResetTrigger);

  useEffect(() => {
    if (cameraResetTrigger !== lastResetRef.current) {
      lastResetRef.current = cameraResetTrigger;
      scrollState.isInteractingWithGlobe = false;
      if (isInteractingRef.current) {
        isInteractingRef.current = false;
      }
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [cameraResetTrigger, controlsRef, isInteractingRef]);

  useFrame((state, delta) => {
    // If user is actively dragging the 3D globe, let OrbitControls handle it and update
    if (isInteractingRef.current || scrollState.isInteractingWithGlobe) {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      return;
    }

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

    const p = scrollState.progress;

    // Climate Sentinel Station Focus (Active when exploring inside Chapter 2)
    if (activeSentinelId && p >= 0.08 && p <= 0.36) {
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
          state.camera.lookAt(controlsRef.current.target);
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
        state.camera.lookAt(controlsRef.current.target);
      }
      return;
    }

    // Compute continuous interpolated camera transform from Experience Orchestrator
    const transform = experienceOrchestrator.computeCameraTransform(p, isMobile, distanceScale);
    experienceOrchestrator.currentCameraTransform = transform;

    // Smooth camera damping using maath (0.55s half-life for cinematic fluidity)
    easing.damp3(state.camera.position, transform.position, 0.55, delta);

    if (controlsRef.current) {
      easing.damp3(controlsRef.current.target, transform.lookAt, 0.55, delta);
      state.camera.lookAt(controlsRef.current.target);
    } else {
      state.camera.lookAt(new THREE.Vector3(...transform.lookAt));
    }

    if ('fov' in state.camera) {
      const persCam = state.camera as THREE.PerspectiveCamera;
      easing.damp(persCam, 'fov', transform.fov, 0.55, delta);
      persCam.updateProjectionMatrix();
    }
  });

  return null;
};

/**
 * Dynamic Scene Lighting Controller
 * Aligned with natural daylight illumination for Google Earth-style planetary exploration.
 */
const DynamicSceneLighting: React.FC = () => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambLightRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    const transform = experienceOrchestrator.currentCameraTransform;
    if (dirLightRef.current) {
      easing.damp(dirLightRef.current, 'intensity', transform.sunIntensity, 0.45, delta);
    }
    if (ambLightRef.current) {
      easing.damp(ambLightRef.current, 'intensity', transform.ambientIntensity, 0.45, delta);
    }
  });

  return (
    <>
      {/* Solar Directional Key Light aligned with shader uSunPosition [-4.0, 2.8, 4.5] */}
      <directionalLight ref={dirLightRef} position={[-4.0, 2.8, 4.5]} intensity={2.4} color="#fffcf5" />
      {/* Balanced Natural Daylight Ambient Fill (prevents harsh black unlit hemisphere) */}
      <ambientLight ref={ambLightRef} intensity={0.55} color="#eef6ff" />
      {/* Subtle Back Daylight Scatter */}
      <directionalLight position={[4.0, -2.0, -3.0]} intensity={0.45} color="#a8cce4" />
    </>
  );
};

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

const WebGLMetricsProbe: React.FC = () => {
  useFrame((state) => {
    if (typeof window !== 'undefined') {
      (window as any).__threeScene = state.scene;
      (window as any).__threeCamera = state.camera;
      (window as any).__threeGl = state.gl;
      (window as any).__threeMetrics = {
        drawCalls: state.gl.info.render.calls,
        triangles: state.gl.info.render.triangles,
        points: state.gl.info.render.points,
        lines: state.gl.info.render.lines,
        geometries: state.gl.info.memory.geometries,
        textures: state.gl.info.memory.textures,
        dpr: state.gl.getPixelRatio(),
      };
    }
  });
  return null;
};

// Static Photographic Fallback Component
// Renders licensed NASA Blue Marble 4K photography with a subtle corner chip, NEVER overlapping hero typography
const StaticEarthFallback: React.FC = () => (
  <div className="relative w-full h-full overflow-hidden bg-[#070B10] pointer-events-none">
    <img
      src="/textures/nasa_earth_day_4k.jpg"
      alt="NASA Blue Marble 4K Earth Surface"
      className="w-full h-full object-cover object-center opacity-85 scale-105"
      style={{ filter: 'brightness(0.95) contrast(1.08)' }}
    />
    <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070B10]/20 to-[#070B10]/80" />
    {/* Unobtrusive corner badge placed safely in bottom-right corner */}
    <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#070B10]/90 border border-[#252D36] font-mono text-[10px] text-[#83BBD5]">
      <Globe className="w-3.5 h-3.5 text-[#FF5938]" />
      <span>NASA BLUE MARBLE 2D APERTURE ACTIVE</span>
    </div>
  </div>
);

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
      return <StaticEarthFallback />;
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
  const [isWebGLSupported] = useState<boolean>(() => isWebGLAvailable());
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

  if (!isWebGLSupported) {
    return <StaticEarthFallback />;
  }

  return (
    <WebGLErrorBoundary>
      <div className="relative w-full h-full pointer-events-auto" data-cursor-label="ROTATE">
        <Canvas
          camera={{ position: [0.0, 0.0, 6.8], fov: 42 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.95,
          }}
          onCreated={({ gl }) => {
            // Prevent browser from destroying context; await automatic restoration
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('[PersistentEarth] WebGL context lost. Awaiting restoration...');
            });
            gl.domElement.addEventListener('webglcontextrestored', () => {
              console.info('[PersistentEarth] WebGL context restored successfully.');
            });
          }}
        >
          <Suspense fallback={null}>
            {/* Continuous Scroll-Driven Camera Controller */}
            <ContinuousScrollCameraController
              controlsRef={controlsRef}
              isInteractingRef={isInteractingRef}
            />

            {/* Dynamic Daylight Scene Lighting Aligned with Sun Vector */}
            <DynamicSceneLighting />

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

            {/* 3D Daylight Natural Earth Globe (Clean on Hero without orbital clutter) */}
            <EarthGlobe showSatellites={false} showSentinels={false} />

            {/* Real-time WebGL Metrics Telemetry Probe */}
            <WebGLMetricsProbe />

            {/* Orbit Controls with User Interaction Hooks */}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={false}
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
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
