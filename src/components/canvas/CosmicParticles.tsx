import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../../lib/scrollState';

/**
 * 3D Fine Cosmic Particles & Space Dust
 * Responds to scroll velocity with subtle parallax drift.
 */
export const CosmicParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, opacities, count } = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread in a cylindrical shell around the Earth & camera flight path
      const radius = 4.0 + Math.random() * 12.0;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 16.0;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20.0;

      opacities[i] = 0.2 + Math.random() * 0.6;
    }

    return { positions, opacities, count };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, [positions, opacities]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color('#83BBD5'),
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || scrollState.prefersReducedMotion) return;

    // Subtle pointer parallax response on space dust
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(
      pointsRef.current.rotation.y,
      state.pointer.x * 0.04,
      delta * 2.0
    );
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(
      pointsRef.current.rotation.x,
      -state.pointer.y * 0.03,
      delta * 2.0
    );

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    // Parallax drift based on scroll velocity and slow natural ambient drift
    const scrollDrift = scrollState.velocity * 0.0035;
    const ambientDrift = delta * 0.06;

    for (let i = 0; i < count; i++) {
      let z = posArray[i * 3 + 2];
      z += scrollDrift + ambientDrift;

      // Wrap around bounds
      if (z > 12.0) {
        z = -10.0;
      } else if (z < -10.0) {
        z = 12.0;
      }

      posArray[i * 3 + 2] = z;
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};
