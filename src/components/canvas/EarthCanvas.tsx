import React, { Suspense, Component, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { easing } from 'maath';
import { EarthGlobe } from './EarthGlobe';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { AlertCircle, Globe } from 'lucide-react';

interface EarthCanvasProps {
  interactive?: boolean;
  className?: string;
  enablePostprocessing?: boolean;
}

// Converts geographic Latitude & Longitude to 3D Cartesian coordinates on sphere (Radius 2.0)
function latLngToVector3(lat: number, lng: number, radius = 2.016): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);
  return [x, y, z];
}

// Section Camera Coordinates & Vantage Angles (Distance 5.8-8.2 ensures dominant framing with zero edge clipping)
const CAMERA_PRESETS: Record<
  'hero' | 'explorer' | 'fleet' | 'timeline' | 'sonification' | 'science',
  { pos: [number, number, number]; lookAt: [number, number, number] }
> = {
  hero: { pos: [0.0, -0.15, 8.2], lookAt: [0, 0, 0] },
  explorer: { pos: [0.0, 0.0, 5.8], lookAt: [0, 0, 0] },
  fleet: { pos: [0.25, 2.2, 5.4], lookAt: [0, 0.1, 0] }, // Polar tilt to highlight satellite rings
  timeline: { pos: [-0.85, 0.12, 6.0], lookAt: [-0.1, 0, 0] }, // Offset to frame timeline
  sonification: { pos: [0.85, -0.15, 6.0], lookAt: [0.1, 0, 0] },
  science: { pos: [0.0, 0.22, 6.2], lookAt: [0, 0, 0] },
};

// Smooth Camera Controller linked to Observatory Scrollytelling & Climate Sentinel Zoom Focus
const CinematicCameraController: React.FC<{
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isInteractingRef: React.RefObject<boolean>;
}> = ({ controlsRef, isInteractingRef }) => {
  const { activeCameraTarget, activeSentinelId } = useObservatoryStore();

  useFrame((state, delta) => {
    // If user is actively dragging the 3D globe, do not override their manual view
    if (isInteractingRef.current) return;

    // Calculate aspect ratio for responsive distance scaling
    const aspect = state.size.width / state.size.height;
    let distanceScale = 1.0;
    if (aspect < 0.6) {
      // Mobile portrait (e.g. 390x844 aspect ~0.46)
      distanceScale = Math.max(1.0, 0.68 / aspect);
    } else if (aspect < 1.0) {
      // Tablet portrait (e.g. 768x1024 aspect ~0.75)
      distanceScale = Math.max(1.0, 0.88 / aspect);
    } else if (aspect < 1.3) {
      distanceScale = 1.08;
    }

    // If a verified Climate Sentinel is selected in Explorer, glide camera directly to that station!
    if (activeSentinelId && activeCameraTarget === 'explorer') {
      const s = useObservatoryStore.getState();
      const match = s.activeSentinelId;
      // Coordinates for all 5 verified climate sentinels
      const coords: Record<string, { lat: number; lng: number }> = {
        'mauna-loa': { lat: 19.5362, lng: -155.5763 },
        'svalbard': { lat: 78.2232, lng: 15.6267 },
        'vostok': { lat: -78.4644, lng: 106.8373 },
        'atto-amazon': { lat: -2.1436, lng: -59.0011 },
        'pacific-tao': { lat: 0.0, lng: -140.0 },
      };
      const c = match ? coords[match] : null;
      if (c) {
        const [sx, sy, sz] = latLngToVector3(c.lat, c.lng, 2.0);
        const norm = Math.hypot(sx, sy, sz) || 2.0;
        const camDistance = 3.9 * distanceScale;
        const targetPos: [number, number, number] = [
          (sx / norm) * camDistance,
          (sy / norm) * camDistance + 0.15,
          (sz / norm) * camDistance,
        ];
        easing.damp3(state.camera.position, targetPos, 0.65, delta);
        if (controlsRef.current) {
          easing.damp3(controlsRef.current.target, [sx * 0.4, sy * 0.4, sz * 0.4], 0.65, delta);
          controlsRef.current.update();
        }
        return;
      }
    }

    const preset = CAMERA_PRESETS[activeCameraTarget] || CAMERA_PRESETS.hero;
    const targetPos: [number, number, number] = [
      preset.pos[0],
      preset.pos[1],
      preset.pos[2] * distanceScale,
    ];

    // Smooth camera position damping (0.55s half-life)
    easing.damp3(state.camera.position, targetPos, 0.55, delta);

    if (controlsRef.current) {
      easing.damp3(controlsRef.current.target, preset.lookAt, 0.55, delta);
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
        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 bg-[#111820] border border-[#F0EEE5]/10 text-center">
          <Globe className="w-12 h-12 text-[#D1B77D] mb-3 animate-pulse" />
          <h3 className="font-display text-lg font-bold text-[#F0EEE5] mb-2">
            3D Planetary Viewport Standby
          </h3>
          <p className="font-sans text-xs text-[#F0EEE5]/70 max-w-sm mb-4">
            Hardware acceleration is currently unavailable or WebGL context was reset. Telemetry,
            sonification, and datasets remain fully operational.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#D1B77D] border border-[#D1B77D]/30 px-3 py-1 bg-[#D1B77D]/10">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>FALLBACK TELEMETRY MODE ACTIVE</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  interactive = true,
  className = '',
  enablePostprocessing = true,
}) => {
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
      <div className={`relative w-full h-full min-h-[380px] sm:min-h-[500px] ${className}`}>
        <Canvas
          camera={{ position: [0.0, -0.15, 8.2], fov: 42 }}
          dpr={isMobile ? 1 : [1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.95,
          }}
        >
          <Suspense fallback={null}>
            {/* Cinematic Camera Controller */}
            <CinematicCameraController
              controlsRef={controlsRef}
              isInteractingRef={isInteractingRef}
            />

            {/* Key Solar Illumination (Realistic sunlight hitting Earth from oblique angle) */}
            <directionalLight position={[-5, 3, 4]} intensity={2.1} color="#ffffff" />
            {/* Deep Space Ambient Earthshine */}
            <ambientLight intensity={0.22} color="#0c1730" />
            {/* Subtle Deep Oceanic Earthshine Scatter */}
            <pointLight position={[5, -2, -4]} intensity={0.15} color="#17465B" />

            {/* 3D Distant Starfield */}
            <Stars
              radius={80}
              depth={40}
              count={900}
              factor={3}
              saturation={0}
              fade
              speed={0.4}
            />

            {/* 3D Photorealistic Planetary Mesh */}
            <EarthGlobe />

            {/* Smooth Orbit Controls with Camera Clamps */}
            {interactive && (
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
                }}
                onEnd={() => {
                  isInteractingRef.current = false;
                }}
              />
            )}

            {/* Selective Postprocessing: Calibrated to prevent white blowout */}
            {enablePostprocessing && !isMobile && (
              <EffectComposer multisampling={0}>
                <Bloom
                  luminanceThreshold={0.92}
                  luminanceSmoothing={0.2}
                  intensity={0.22}
                  radius={0.35}
                />
                <Vignette eskil={false} offset={0.15} darkness={0.7} />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
