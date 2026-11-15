import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { EarthGlobe } from '../canvas/EarthGlobe';
import { SATELLITE_FLEET } from '../../data/earthDatasets';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { Radio } from 'lucide-react';

interface ConstellationGlobeCanvasProps {
  selectedSatelliteId: string | null;
  onSelectSatellite: (id: string | null) => void;
}

const ConstellationScene: React.FC<{
  selectedSatelliteId: string | null;
  onSelectSatellite: (id: string | null) => void;
}> = ({ selectedSatelliteId, onSelectSatellite }) => {
  const satellitesGroupRef = useRef<THREE.Group>(null);
  const { globeRotating } = useObservatoryStore();

  useFrame((_, delta) => {
    if (satellitesGroupRef.current && globeRotating) {
      satellitesGroupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={satellitesGroupRef}>
      {/* 3D Earth without sentinel pins, with interactive satellites */}
      <EarthGlobe
        showSatellites={true}
        showSentinels={false}
        activeSatelliteId={selectedSatelliteId}
        onSelectSatellite={onSelectSatellite}
        scale={0.96}
      />
    </group>
  );
};

export const ConstellationGlobeCanvas: React.FC<ConstellationGlobeCanvasProps> = ({
  selectedSatelliteId,
  onSelectSatellite,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const activeSat = useMemo(
    () => SATELLITE_FLEET.find((s) => s.id === selectedSatelliteId) || SATELLITE_FLEET[0],
    [selectedSatelliteId]
  );

  return (
    <div className="relative w-full h-[460px] sm:h-[560px] bg-[#070B10] border-2 border-[#252D36] shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8">
      {/* 1. Aerospace HUD Top Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0E141D] border border-[#252D36] text-[#FF5938] font-mono text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#FF5938]" />
            <span>LEO CONSTELLATION RADAR</span>
          </div>
          <span className="hidden sm:inline font-mono text-xs text-[#83BBD5]">
            5 SYNCHRONOUS ORBITAL PLANES
          </span>
        </div>

        {/* Satellite Quick Switcher Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SATELLITE_FLEET.map((sat) => {
            const isSelected = selectedSatelliteId === sat.id;
            return (
              <button
                key={sat.id}
                onClick={() => onSelectSatellite(isSelected ? null : sat.id)}
                data-cursor-label="ORBIT"
                className={`px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#FF5938] text-[#070B10] border border-[#FF5938] shadow-sm'
                    : 'bg-[#0E141D] text-[#E9EDF0] border border-[#252D36] hover:border-[#83BBD5]'
                }`}
              >
                <span className="w-2 h-2" style={{ backgroundColor: sat.color }} />
                <span>{sat.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Three.js Constellation Canvas */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0.0, 1.2, 5.6], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.95,
          }}
        >
          {/* Natural Daylight Illumination Model */}
          <ambientLight intensity={0.55} color="#eef6ff" />
          <directionalLight position={[-4.0, 2.8, 4.5]} intensity={2.4} color="#fffcf5" />
          <directionalLight position={[4.0, -2.0, -3.0]} intensity={0.45} color="#a8cce4" />

          <Suspense fallback={null}>
            <Stars radius={50} depth={25} count={500} factor={2} fade speed={0.25} />
            <ConstellationScene
              selectedSatelliteId={selectedSatelliteId}
              onSelectSatellite={onSelectSatellite}
            />
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={true}
              minDistance={3.0}
              maxDistance={9.0}
              autoRotate={true}
              autoRotateSpeed={0.35}
              dampingFactor={0.06}
              rotateSpeed={0.7}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* 3. Corner Reticles */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF5938]/60" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF5938]/60" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF5938]/60" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF5938]/60" />
      </div>

      {/* 4. Telemetry Bottom Overlay HUD */}
      <div className="relative z-20 flex flex-wrap items-end justify-between pt-4 border-t border-[#252D36] text-xs font-mono text-[#7E8B98] pointer-events-none bg-[#070B10]/80 backdrop-blur-xs px-3 py-2 -mx-2 -mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2" style={{ backgroundColor: activeSat.color }} />
            <span className="font-bold text-[#E9EDF0] uppercase tracking-wide">
              {activeSat.name}
            </span>
            <span className="text-[#83BBD5]">[{activeSat.primarySensor}]</span>
          </div>
          <span className="text-[11px] text-[#7E8B98]">
            {activeSat.observationalFocus}
          </span>
        </div>

        <div className="flex items-center gap-6 mt-2 sm:mt-0 font-mono text-xs">
          <div>
            <span className="text-[#252D36]/80 text-[#7E8B98]">ALTITUDE: </span>
            <span className="text-[#FF5938] font-bold">{activeSat.orbitAltitudeKm} km</span>
          </div>
          <div>
            <span className="text-[#7E8B98]">INCLINATION: </span>
            <span className="text-[#E9EDF0] font-bold">{activeSat.orbitInclinationDeg}°</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[#7E8B98]">VELOCITY: </span>
            <span className="text-[#83BBD5] font-bold">~7.5 km/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
