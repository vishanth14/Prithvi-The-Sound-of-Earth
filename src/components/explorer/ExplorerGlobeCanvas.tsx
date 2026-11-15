import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { EarthGlobe } from '../canvas/EarthGlobe';
import { useObservatoryStore } from '../../store/useObservatoryStore';

export const ExplorerGlobeCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { globeRotating, cameraResetTrigger } = useObservatoryStore();
  const lastResetRef = useRef(cameraResetTrigger);

  useEffect(() => {
    if (cameraResetTrigger !== lastResetRef.current) {
      lastResetRef.current = cameraResetTrigger;
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [cameraResetTrigger]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0.0, 0.15, 5.2], fov: 44 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[-6, 3, 5]} intensity={2.2} />
        <directionalLight position={[6, -2, -3]} intensity={0.4} color="#83BBD5" />

        <Suspense fallback={null}>
          <Stars radius={50} depth={25} count={400} factor={2} fade speed={0.2} />
          <EarthGlobe showSatellites={false} showSentinels={true} scale={1.0} />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={2.8}
            maxDistance={8.5}
            autoRotate={globeRotating}
            autoRotateSpeed={0.45}
            dampingFactor={0.06}
            rotateSpeed={0.7}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
