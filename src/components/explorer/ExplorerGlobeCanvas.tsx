import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { EarthGlobe } from '../canvas/EarthGlobe';
import { ExplorerCameraController } from './ExplorerCameraController';
import { useObservatoryStore } from '../../store/useObservatoryStore';

export const ExplorerGlobeCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const earthGroupRef = useRef<THREE.Group>(null);
  const globeRotating = useObservatoryStore((s) => s.globeRotating);

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
          toneMappingExposure: 0.98,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('[ExplorerGlobe] WebGL context lost. Awaiting restoration...');
          });
        }}
      >
        {/* Natural Daylight Illumination Model (Google Earth Style) */}
        <ambientLight intensity={0.55} color="#eef6ff" />
        <directionalLight position={[-4.0, 2.8, 4.5]} intensity={2.4} color="#fffcf5" />
        <directionalLight position={[4.0, -2.0, -3.0]} intensity={0.45} color="#a8cce4" />

        <Suspense fallback={null}>
          <Stars radius={50} depth={25} count={400} factor={2} fade speed={0.2} />

          {/* 3D Natural Daylight Earth Globe with Interactive Climate Sentinels */}
          <EarthGlobe
            ref={earthGroupRef}
            showSatellites={false}
            showSentinels={true}
            scale={1.0}
          />

          {/* Precision Spherical-Arc Camera Controller for Sentinel Focus & Global Overview */}
          <ExplorerCameraController
            controlsRef={controlsRef}
            earthGroupRef={earthGroupRef}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={2.5}
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
