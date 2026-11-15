import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { gsap } from '../../lib/gsap';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { SATELLITE_FLEET } from '../../data/earthDatasets';
import { scrollState } from '../../lib/scrollState';

// Converts geographic Latitude & Longitude to 3D Cartesian coordinates on sphere (Radius 2.0)
function latLngToVector3(lat: number, lng: number, radius = 2.018): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);
  return [x, y, z];
}

// Shader 1: Natural Daylight Earth Surface Shader (NASA Blue Marble Daylight Globe)
// Google Earth-style natural planetary illumination with deep blue oceans, realistic relief, and selective night lights
const EarthSurfaceShader = {
  uniforms: {
    uDayMap: { value: null as THREE.Texture | null },
    uNightMap: { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uNormalMap: { value: null as THREE.Texture | null },
    uCloudMap: { value: null as THREE.Texture | null },
    uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
    uCloudOffset: { value: 0.0 },
    uThermalAnomaly: { value: 0.0 },
    uNightLightBoost: { value: 1.0 },
    uShowNightLights: { value: 0.0 }, // 0.0 = Natural daylight globe, 1.0 = Scientific night-lights layer
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uDayMap;
    uniform sampler2D uNightMap;
    uniform sampler2D uSpecularMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uCloudMap;
    uniform vec3 uSunPosition;
    uniform float uCloudOffset;
    uniform float uThermalAnomaly;
    uniform float uNightLightBoost;
    uniform float uShowNightLights;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Seamless cotangent frame normal perturbation for bump relief without antimeridian seams
    vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm, vec3 mapN, vec2 uv) {
      vec3 q0 = dFdx(eye_pos);
      vec3 q1 = dFdy(eye_pos);
      vec2 st0 = dFdx(uv);
      vec2 st1 = dFdy(uv);

      if (abs(st0.x) > 0.5) st0.x = 0.0;
      if (abs(st1.x) > 0.5) st1.x = 0.0;

      vec3 N = surf_norm;
      vec3 S = normalize(q0 * st1.t - q1 * st0.t);
      vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
      vec3 B = normalize(cross(N, S));
      S = normalize(cross(B, N));

      mat3 tbn = mat3(S, B, N);
      return normalize(tbn * mapN);
    }

    void main() {
      vec3 normalGeo = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);

      // Perturb normal using NASA SRTM topography (relief on land, silky smooth on oceans)
      vec4 specMask = texture2D(uSpecularMap, vUv); // 1.0 = ocean, 0.0 = land
      vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      mapN.xy *= 0.38 * (1.0 - specMask.r * 0.75);
      vec3 normal = perturbNormal2Arb(vWorldPosition - cameraPosition, normalGeo, mapN, vUv);

      // Solar lighting geometry
      float NdotL = dot(normal, sunDir);

      // Natural Google Earth-style daylight illumination:
      // Direct sunlight provides directional key light, while balanced ambient fill
      // ensures all continents and oceans remain naturally illuminated and explorable.
      float directSun = pow(clamp(NdotL, 0.0, 1.0), 0.88);
      float daylight = mix(0.42, 1.0, directSun);

      // High-resolution NASA Blue Marble daytime albedo
      vec4 dayColor = texture2D(uDayMap, vUv);

      // Ocean water albedo calibration: deep sapphire blue water with realistic depth absorption
      vec3 oceanAlbedo = dayColor.rgb * vec3(0.62, 0.76, 0.96);
      vec3 surfaceAlbedo = mix(dayColor.rgb, oceanAlbedo, specMask.r * 0.42);

      // Real-time Cloud Shadow Cast onto Ground (Projected along solar direction)
      vec2 shadowShift = vec2(-sunDir.x, -sunDir.y) * 0.0028;
      vec2 cloudShadowUv = vec2(fract(vUv.x + uCloudOffset + shadowShift.x), clamp(vUv.y + shadowShift.y, 0.001, 0.999));
      vec4 shadowClouds = texture2D(uCloudMap, cloudShadowUv);
      float cloudShadow = mix(1.0, 0.68, smoothstep(0.12, 0.82, shadowClouds.a));

      // Direct solar spectrum: gentle warm illumination on key light side
      vec3 solarLightColor = mix(vec3(0.96, 0.98, 1.0), vec3(1.0, 0.94, 0.86), directSun * 0.5);

      // Realistic Ocean Specular Sunglint with Water Fresnel
      vec3 halfVector = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfVector), 0.0);
      float VdotH = clamp(dot(viewDir, halfVector), 0.0, 1.0);
      float fresnelWater = 0.025 + 0.975 * pow(1.0 - VdotH, 5.0);

      float sunglintCore = pow(NdotH, 140.0) * 2.0;
      float sunglintSheen = pow(NdotH, 22.0) * 0.16;
      float totalSunglint = (sunglintCore + sunglintSheen) * fresnelWater * specMask.r * directSun;
      vec3 sunglintColor = vec3(1.0, 0.98, 0.92) * totalSunglint;

      // Daylight surface with soft ground cloud shadow and crisp sunglint
      vec3 daySurface = (surfaceAlbedo * daylight * cloudShadow * solarLightColor) + sunglintColor;

      // Optional Suomi NPP VIIRS Night Lights: ONLY active when explicitly selected as scientific layer
      vec3 nightSurface = vec3(0.0);
      if (uShowNightLights > 0.01) {
        float nightFactor = smoothstep(0.05, -0.15, NdotL);
        vec4 nightColor = texture2D(uNightMap, vUv);
        nightSurface = nightColor.rgb * nightFactor * (1.5 * uNightLightBoost * uShowNightLights);
      }

      // Subtle thermal anomaly infrared response for GISTEMP analysis
      vec3 thermalGlow = vec3(1.0, 0.38, 0.10) * uThermalAnomaly * 0.28 * (1.0 - specMask.r);

      gl_FragColor = vec4(daySurface + nightSurface + thermalGlow, 1.0);
    }
  `,
};

// Shader 2: 3D Volumetric Cloud Sphere Shader (Radius 2.008)
// Shader 2: Natural 3D Volumetric Cloud Sphere Shader (Radius 2.008)
const CloudSphereShader = {
  uniforms: {
    uCloudMap: { value: null as THREE.Texture | null },
    uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
    uCloudOffset: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uCloudMap;
    uniform vec3 uSunPosition;
    uniform float uCloudOffset;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec2 cloudUv = vec2(fract(vUv.x + uCloudOffset), vUv.y);
      vec4 cloudSample = texture2D(uCloudMap, cloudUv);
      float cloudDensity = cloudSample.a;

      if (cloudDensity < 0.03) discard;

      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      float NdotL = dot(normal, sunDir);
      float directSun = clamp(NdotL, 0.0, 1.0);

      // Forward Mie scattering (silver lining toward sun)
      float forwardScatter = pow(max(dot(viewDir, -sunDir), 0.0), 4.5) * 0.28 * directSun;

      // Natural white daytime clouds with soft daylight illumination
      vec3 cloudBase = mix(vec3(0.92, 0.94, 0.98), vec3(1.0, 1.0, 1.0), directSun);
      vec3 finalCloudColor = cloudBase + forwardScatter;

      // Soft natural alpha
      float cloudAlpha = smoothstep(0.06, 0.88, cloudDensity) * 0.76;

      gl_FragColor = vec4(finalCloudColor, cloudAlpha);
    }
  `,
};

// Shader 3: Rayleigh Scattering Atmospheric Limb Shader (Radius 2.016, FrontSide)
const AtmosphereRimShader = {
  uniforms: {
    uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
    uColor: { value: new THREE.Color('#246E96') },
    uCoefficient: { value: 0.38 },
    uPower: { value: 3.8 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uSunPosition;
    uniform vec3 uColor;
    uniform float uCoefficient;
    uniform float uPower;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      // Fresnel grazing angle along silhouette rim
      float VdotN = max(dot(viewDir, normal), 0.0);
      float limb = pow(1.0 - VdotN, uPower);

      vec3 finalColor = uColor * limb * (uCoefficient * 1.6);
      float finalAlpha = clamp(limb * 0.82, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `,
};

export interface EarthGlobeProps {
  showSatellites?: boolean;
  showSentinels?: boolean;
  activeSatelliteId?: string | null;
  onSelectSatellite?: (id: string) => void;
  scale?: number;
  showNightLights?: boolean;
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  showSatellites = true,
  showSentinels = true,
  activeSatelliteId = null,
  onSelectSatellite,
  scale = 1.0,
  showNightLights = false,
}) => {
  const earthMeshRef = useRef<THREE.Mesh>(null!);
  const cloudsMeshRef = useRef<THREE.Mesh>(null!);
  const atmosphereMeshRef = useRef<THREE.Mesh>(null!);
  const earthGroupRef = useRef<THREE.Group>(null!);
  const cloudOffsetRef = useRef(0);

  // Store Selectors
  const globeRotating = useObservatoryStore((s) => s.globeRotating);
  const activeEicKey = useObservatoryStore((s) => s.activeEicKey);
  const atmosphereTargetColor = useObservatoryStore((s) => s.atmosphereTargetColor);
  const atmosphereTargetCoefficient = useObservatoryStore((s) => s.atmosphereTargetCoefficient);
  const thermalAnomalyFactor = useObservatoryStore((s) => s.thermalAnomalyFactor);
  const nightLightBoost = useObservatoryStore((s) => s.nightLightBoost);
  const activeSentinelId = useObservatoryStore((s) => s.activeSentinelId);
  const hoveredSentinelId = useObservatoryStore((s) => s.hoveredSentinelId);
  const selectSentinel = useObservatoryStore((s) => s.selectSentinel);
  const setHoveredSentinelId = useObservatoryStore((s) => s.setHoveredSentinelId);
  const isAudioUnlocked = useObservatoryStore((s) => s.isAudioUnlocked);
  const unlockAudio = useObservatoryStore((s) => s.unlockAudio);
  const startPlayback = useObservatoryStore((s) => s.startPlayback);

  const targetColorObj = useMemo(() => new THREE.Color(), []);

  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Adaptive Quality: Load NASA 4K textures on Desktop, optimized 2K/1K textures on Mobile
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const daySrc = isMobile ? '/textures/earth_day_2048.jpg' : '/textures/nasa_earth_day_4k.jpg';
    const nightSrc = isMobile ? '/textures/earth_night_2048.png' : '/textures/nasa_earth_night_4k.jpg';
    const cloudsSrc = isMobile ? '/textures/earth_clouds_1024.png' : '/textures/nasa_earth_clouds_4k.png';
    const specularSrc = isMobile ? '/textures/earth_specular_2048.jpg' : '/textures/nasa_earth_specular.jpg';
    const normalSrc = isMobile ? '/textures/earth_normal_2048.jpg' : '/textures/nasa_earth_normal.jpg';

    const day = loader.load(daySrc);
    const night = loader.load(nightSrc);
    const clouds = loader.load(cloudsSrc);
    const specular = loader.load(specularSrc);
    const normal = loader.load(normalSrc);

    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    clouds.colorSpace = THREE.SRGBColorSpace;
    specular.colorSpace = THREE.NoColorSpace;
    normal.colorSpace = THREE.NoColorSpace;

    [day, night, clouds, specular, normal].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = isMobile ? 4 : 16;
    });

    return { day, night, clouds, specular, normal };
  }, [isMobile]);

  // Adaptive Geometry: 144 segments on Desktop (flawless round limb), 64 segments on Mobile (80% vertex savings)
  const segments = isMobile ? 64 : 144;
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2.0, segments, segments), [segments]);
  const cloudsGeo = useMemo(() => new THREE.SphereGeometry(2.008, segments, segments), [segments]);
  const atmosphereGeo = useMemo(() => new THREE.SphereGeometry(2.016, segments, segments), [segments]);

  // Shader Materials
  const earthMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: textures.day },
        uNightMap: { value: textures.night },
        uSpecularMap: { value: textures.specular },
        uNormalMap: { value: textures.normal },
        uCloudMap: { value: textures.clouds },
        uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
        uCloudOffset: { value: 0.0 },
        uThermalAnomaly: { value: 0.0 },
        uNightLightBoost: { value: 1.0 },
        uShowNightLights: { value: 0.0 },
      },
      vertexShader: EarthSurfaceShader.vertexShader,
      fragmentShader: EarthSurfaceShader.fragmentShader,
    });
  }, [textures]);

  const cloudsMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: textures.clouds },
        uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
        uCloudOffset: { value: 0.0 },
      },
      vertexShader: CloudSphereShader.vertexShader,
      fragmentShader: CloudSphereShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [textures.clouds]);

  const atmosphereMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunPosition: { value: new THREE.Vector3(-4.0, 2.8, 4.5) },
        uColor: { value: new THREE.Color('#246E96') },
        uCoefficient: { value: 0.38 },
        uPower: { value: 3.8 },
      },
      vertexShader: AtmosphereRimShader.vertexShader,
      fragmentShader: AtmosphereRimShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  // Earth Entrance Animation
  useEffect(() => {
    if (earthGroupRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        earthGroupRef.current.scale.set(0.85, 0.85, 0.85);
        gsap.to(earthGroupRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.8,
          ease: 'power2.out',
        });
      }
    }
  }, []);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      cloudsGeo.dispose();
      atmosphereGeo.dispose();
      earthMat.dispose();
      cloudsMat.dispose();
      atmosphereMat.dispose();
      Object.values(textures).forEach((t) => t.dispose());
    };
  }, [sphereGeo, cloudsGeo, atmosphereGeo, earthMat, cloudsMat, atmosphereMat, textures]);

  // Satellite orbit coordinates
  const satelliteRings = useMemo(() => {
    return SATELLITE_FLEET.map((sat, idx) => {
      const radius = 2.38 + idx * 0.15;
      const angle = (idx * Math.PI) / 2.5;
      const inclinationRad = (sat.orbitInclinationDeg * Math.PI) / 180;
      return {
        ...sat,
        radius,
        angle,
        inclinationRad,
      };
    });
  }, []);

  // Climate Sentinel 3D Positions
  const sentinelNodes = useMemo(() => {
    return CLIMATE_SENTINELS.map((s) => ({
      ...s,
      pos: latLngToVector3(s.lat, s.lng, 2.016),
    }));
  }, []);

  // 60fps Continuous Loop (Zero-allocation animation loop with subtle pointer parallax)
  useFrame((state, delta) => {
    if (earthGroupRef.current && globeRotating) {
      earthGroupRef.current.rotation.y += delta * 0.038;
    }

    // Heavy physical planetary inertia and damped tilt in response to pointer movement
    // Planetary body feels massive, grounded, and dignified — never follows cursor aggressively
    if (earthGroupRef.current && !scrollState.isInteractingWithGlobe) {
      if (!scrollState.prefersReducedMotion && scrollState.progress <= 0.55) {
        // Observer vantage tilt response: subtle orbital pitch and roll (max ~2.5 deg)
        // Damped with 0.65s half-life so the planetary mass has physical weight and momentum
        const targetTiltX = 0.41 - state.pointer.y * 0.042;
        const targetRollZ = state.pointer.x * 0.032;
        easing.damp(earthGroupRef.current.rotation, 'x', targetTiltX, 0.65, delta);
        easing.damp(earthGroupRef.current.rotation, 'z', targetRollZ, 0.65, delta);
      } else {
        // Return smoothly to baseline axial inclination
        easing.damp(earthGroupRef.current.rotation, 'x', 0.41, 0.65, delta);
        easing.damp(earthGroupRef.current.rotation, 'z', 0.0, 0.65, delta);
      }
    }

    // Cloud system drift (slow atmospheric jet stream)
    cloudOffsetRef.current += delta * 0.0018;

    // Update Surface Shader uniforms
    if (earthMeshRef.current) {
      const mat = earthMeshRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms) {
        mat.uniforms.uCloudOffset.value = cloudOffsetRef.current;
        mat.uniforms.uThermalAnomaly.value = THREE.MathUtils.lerp(
          mat.uniforms.uThermalAnomaly.value,
          thermalAnomalyFactor,
          delta * 2.5
        );
        mat.uniforms.uNightLightBoost.value = THREE.MathUtils.lerp(
          mat.uniforms.uNightLightBoost.value,
          nightLightBoost,
          delta * 2.5
        );
        // Night lights ONLY activate when explicitly selected in scientific catalogue
        const isNightLightsActive = showNightLights || activeEicKey === 'nightlights_viirs';
        mat.uniforms.uShowNightLights.value = THREE.MathUtils.lerp(
          mat.uniforms.uShowNightLights.value,
          isNightLightsActive ? 1.0 : 0.0,
          delta * 3.0
        );
      }
    }

    // Update Cloud Layer uniforms
    if (cloudsMeshRef.current) {
      const mat = cloudsMeshRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms) {
        mat.uniforms.uCloudOffset.value = cloudOffsetRef.current;
      }
    }

    // Update Atmosphere Rayleigh Limb uniforms
    if (atmosphereMeshRef.current) {
      const mat = atmosphereMeshRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms) {
        targetColorObj.set(atmosphereTargetColor);
        mat.uniforms.uColor.value.lerp(targetColorObj, delta * 2.5);
        mat.uniforms.uCoefficient.value = THREE.MathUtils.lerp(
          mat.uniforms.uCoefficient.value,
          atmosphereTargetCoefficient,
          delta * 2.5
        );
      }
    }
  });

  const pointerDownPos = useRef({ x: 0, y: 0 });

  const handleSentinelPointerDown = (e: any) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleSentinelClick = async (e: any, sentinelId: string) => {
    e.stopPropagation();
    const dx = e.clientX - pointerDownPos.current.x;
    const dy = e.clientY - pointerDownPos.current.y;
    if (Math.hypot(dx, dy) > 8) {
      // User was dragging the globe, not clicking
      return;
    }
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await selectSentinel(sentinelId);
    await startPlayback();
  };

  return (
    <group ref={earthGroupRef} rotation={[0.41, 0, 0]} scale={[scale, scale, scale]}>
      {/* 1. Photorealistic 4K Earth Surface (Day/Night/Normal/Specular/Thermal) */}
      <mesh ref={earthMeshRef} geometry={sphereGeo} material={earthMat} />

      {/* 2. 3D Volumetric Cloud Layer Sphere (Radius 2.012 with Real-time Drift) */}
      <mesh ref={cloudsMeshRef} geometry={cloudsGeo} material={cloudsMat} />

      {/* 3. Subtle Rayleigh Atmospheric Limb Glow (Radius 2.028) */}
      <mesh ref={atmosphereMeshRef} geometry={atmosphereGeo} material={atmosphereMat} />

      {/* 4. Fine Keplerian Orbital Paths for NASA Fleet */}
      {showSatellites &&
        satelliteRings.map((sat) => {
          const isSatActive = activeSatelliteId === sat.id;
          return (
            <group key={sat.id} rotation={[sat.inclinationRad, 0, 0]}>
              <line>
                <ringGeometry args={[sat.radius - 0.002, sat.radius + 0.002, 96]} />
                <lineBasicMaterial
                  color={isSatActive ? sat.color : '#D1B77D'}
                  opacity={isSatActive ? 0.85 : 0.22}
                  transparent
                />
              </line>
              {/* Satellite Node Pin */}
              <mesh
                position={[sat.radius * Math.cos(sat.angle), sat.radius * Math.sin(sat.angle), 0]}
                onClick={(e) => {
                  if (onSelectSatellite) {
                    e.stopPropagation();
                    onSelectSatellite(sat.id);
                  }
                }}
              >
                <sphereGeometry args={[isSatActive ? 0.045 : 0.028, 16, 16]} />
                <meshBasicMaterial color={sat.color} />
              </mesh>
            </group>
          );
        })}

      {/* 5. Interactive Climate Sentinel Geographic Pins & Editorial Tooltips */}
      {showSentinels &&
        sentinelNodes.map((s) => {
          const isSelected = activeSentinelId === s.id;
          const isHovered = hoveredSentinelId === s.id;
          return (
            <group
              key={s.id}
              position={s.pos}
              onPointerDown={handleSentinelPointerDown}
              onClick={(e) => handleSentinelClick(e, s.id)}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredSentinelId(s.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredSentinelId(null);
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Core Sentinel Sphere Pin */}
              <mesh>
                <sphereGeometry args={[isSelected ? 0.042 : 0.028, 16, 16]} />
                <meshBasicMaterial color={s.color} />
              </mesh>

              {/* Pulsating Outer Beacon Ring */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.038, 0.052, 24]} />
                <meshBasicMaterial
                  color={s.color}
                  opacity={isSelected ? 0.95 : 0.55}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Editorial Hover Tooltip Label */}
              {isHovered && !isSelected && (
                <Html
                  position={[0, 0.08, 0]}
                  center
                  distanceFactor={7.5}
                  pointerEvents="none"
                >
                  <div className="bg-[#070B10]/95 text-[#E9EDF0] border border-[#FF5938]/60 px-2.5 py-1 shadow-lg whitespace-nowrap flex flex-col items-center gap-0.5 pointer-events-none select-none text-[11px] font-mono">
                    <span className="font-display font-bold text-xs tracking-wide text-[#E9EDF0]">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-[#FF5938] tracking-widest uppercase">
                      {s.stationCode} • {s.lat > 0 ? `${s.lat}°N` : `${Math.abs(s.lat)}°S`},{' '}
                      {s.lng > 0 ? `${s.lng}°E` : `${Math.abs(s.lng)}°W`}
                    </span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
    </group>
  );
};
