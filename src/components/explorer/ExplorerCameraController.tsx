import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { gsap } from '../../lib/gsap';
import { useObservatoryStore } from '../../store/useObservatoryStore';
import { CLIMATE_SENTINEL_MAP } from '../../data/climateSentinels';
import {
  getSentinelWorldPosition,
  slerpDirectionVectors,
} from '../../utils/geoCoordinates';

interface ExplorerCameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  earthGroupRef: React.RefObject<THREE.Group | null>;
}

/**
 * ExplorerCameraController
 *
 * Implements smooth, bidirectional camera focusing on verified Climate Sentinels.
 * Uses GSAP and great-circle spherical arc interpolation (Slerp) to transition the camera
 * around the planetary body without clipping the surface or jumping abruptly.
 *
 * Features:
 * 1. World-transform awareness (Earth rotation, tilt, and scale).
 * 2. Parabolic arc elevation to prevent grazing or clipping the globe during long transitions.
 * 3. OrbitControls coordination (temporarily disarms controls during tween, updates target, re-arms on completion).
 * 4. Safe cancellation of in-flight transitions on rapid sentinel selection or overview reset.
 * 5. Automatic planetary rotation pausing during focused inspection.
 */
export const ExplorerCameraController: React.FC<ExplorerCameraControllerProps> = ({
  controlsRef,
  earthGroupRef,
}) => {
  const { camera, size } = useThree();
  const activeSentinelId = useObservatoryStore((s) => s.activeSentinelId);
  const sentinelFocusTrigger = useObservatoryStore((s) => s.sentinelFocusTrigger);
  const cameraResetTrigger = useObservatoryStore((s) => s.cameraResetTrigger);
  const globeRotating = useObservatoryStore((s) => s.globeRotating);
  const setGlobeRotating = useObservatoryStore((s) => s.setGlobeRotating);

  const cameraTweenRef = useRef<gsap.core.Tween | null>(null);
  const wasRotatingBeforeFocus = useRef<boolean>(true);
  const lastSentinelTriggerRef = useRef<number>(0);
  const lastResetTriggerRef = useRef<number>(0);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      if (cameraTweenRef.current) {
        cameraTweenRef.current.kill();
        cameraTweenRef.current = null;
      }
    };
  }, []);

  // Compute responsive camera distance for standard overview and close-up focus
  const getCameraDistances = () => {
    const aspect = size.width / size.height;
    const isMobile = size.width < 768;

    let overviewDist = 5.2;
    let focusDist = 3.75;

    if (isMobile) {
      overviewDist = 6.4;
      focusDist = 4.45;
    } else if (aspect < 1.0) {
      overviewDist = 5.8;
      focusDist = 4.15;
    } else if (aspect < 1.3) {
      overviewDist = 5.4;
      focusDist = 3.9;
    }

    return { overviewDist, focusDist };
  };

  // 1. FOCUS ANIMATION: Triggered on Sentinel selection or re-focus action
  useEffect(() => {
    if (!activeSentinelId) return;
    if (sentinelFocusTrigger === lastSentinelTriggerRef.current) return;
    lastSentinelTriggerRef.current = sentinelFocusTrigger;

    const sentinel = CLIMATE_SENTINEL_MAP[activeSentinelId];
    if (!sentinel) return;

    if (!earthGroupRef.current) return;

    // Pause automatic rotation while focused so user can inspect the observatory
    if (globeRotating) {
      wasRotatingBeforeFocus.current = true;
      setGlobeRotating(false);
    }

    // Cancel any currently running camera transition
    if (cameraTweenRef.current) {
      cameraTweenRef.current.kill();
      cameraTweenRef.current = null;
    }

    // Calculate verified world position of the station
    const markerWorldPos = getSentinelWorldPosition(
      sentinel.lat,
      sentinel.lng,
      earthGroupRef.current,
      2.016
    );

    const targetDir = markerWorldPos.clone().normalize();
    const { focusDist } = getCameraDistances();
    const targetCamPos = targetDir.clone().multiplyScalar(focusDist);

    // Camera starts from current position
    const startCamPos = camera.position.clone();
    const startDist = startCamPos.length();

    // Target lookAt: center of the planet [0, 0, 0] so marker is framed directly in view
    const startLookAt = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);
    const endLookAt = new THREE.Vector3(0, 0, 0);

    // Disarm OrbitControls during flight to prevent conflict
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const animObj = { progress: 0 };
    cameraTweenRef.current = gsap.to(animObj, {
      progress: 1,
      duration: 1.35,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = animObj.progress;

        // Spherical great-circle geodesic interpolation
        const curDir = slerpDirectionVectors(startCamPos, targetDir, p);

        // Outward parabolic clearance arc: ensures camera pulls back and never clips the globe
        const arcClearance = Math.sin(p * Math.PI) * 0.48;
        const curDist = THREE.MathUtils.lerp(startDist, focusDist, p) + arcClearance;

        camera.position.copy(curDir.multiplyScalar(curDist));

        // Smoothly interpolate lookAt target
        const curLookAt = startLookAt.clone().lerp(endLookAt, p);
        camera.lookAt(curLookAt);

        if (controlsRef.current) {
          controlsRef.current.target.copy(curLookAt);
        }
      },
      onComplete: () => {
        camera.position.copy(targetCamPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(endLookAt);
          controlsRef.current.update();
          controlsRef.current.enabled = true;
        }
        cameraTweenRef.current = null;
      },
      onInterrupt: () => {
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
        cameraTweenRef.current = null;
      },
    });
  }, [
    activeSentinelId,
    sentinelFocusTrigger,
    camera,
    size,
    controlsRef,
    earthGroupRef,
    globeRotating,
    setGlobeRotating,
  ]);

  // 2. RESET ANIMATION: Triggered when user selects Reset to Global Overview
  useEffect(() => {
    if (cameraResetTrigger === lastResetTriggerRef.current) return;
    lastResetTriggerRef.current = cameraResetTrigger;

    // Cancel any active animation
    if (cameraTweenRef.current) {
      cameraTweenRef.current.kill();
      cameraTweenRef.current = null;
    }

    const { overviewDist } = getCameraDistances();
    const targetOverviewPos = new THREE.Vector3(0.0, 0.15, overviewDist);
    const startCamPos = camera.position.clone();
    const startDist = startCamPos.length();

    const startLookAt = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);
    const endLookAt = new THREE.Vector3(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }

    const animObj = { progress: 0 };
    cameraTweenRef.current = gsap.to(animObj, {
      progress: 1,
      duration: 1.25,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = animObj.progress;
        const curDir = slerpDirectionVectors(startCamPos, targetOverviewPos, p);
        const arcClearance = Math.sin(p * Math.PI) * 0.35;
        const curDist = THREE.MathUtils.lerp(startDist, overviewDist, p) + arcClearance;

        camera.position.copy(curDir.multiplyScalar(curDist));

        const curLookAt = startLookAt.clone().lerp(endLookAt, p);
        camera.lookAt(curLookAt);

        if (controlsRef.current) {
          controlsRef.current.target.copy(curLookAt);
        }
      },
      onComplete: () => {
        camera.position.copy(targetOverviewPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(endLookAt);
          controlsRef.current.update();
          controlsRef.current.enabled = true;
        }
        cameraTweenRef.current = null;

        // Resume automatic planetary rotation if it was active prior to station inspection
        if (wasRotatingBeforeFocus.current) {
          setGlobeRotating(true);
        }
      },
      onInterrupt: () => {
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
        cameraTweenRef.current = null;
      },
    });
  }, [
    cameraResetTrigger,
    camera,
    size,
    controlsRef,
    setGlobeRotating,
  ]);

  return null;
};
