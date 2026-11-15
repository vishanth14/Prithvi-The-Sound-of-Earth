import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from '../../lib/gsap';
import { useObservatoryStore, CLIMATE_SENTINELS } from '../../store/useObservatoryStore';
import { SATELLITE_FLEET } from '../../data/earthDatasets';

// Converts geographic Latitude & Longitude to 3D Cartesian coordinates on sphere (Radius 2.0)
function latLngToVector3(lat: number, lng: number, radius = 2.016): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);
  return [x, y, z];
}

// Shader 1: Earth Surface Shader with Cotangent Frame Normal Perturbation, Specular, and Cloud Shadow
const EarthSurfaceShader = {
  uniforms: {
    uDayMap: { value: null as THREE.Texture | null },
    uNightMap: { value: null as THREE.Texture | null },
    uSpecularMap: { value: null as THREE.Texture | null },
    uNormalMap: { value: null as THREE.Texture | null },
    uCloudMap: { value: null as THREE.Texture | null },
    uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
    uCloudOffset: { value: 0.0 },
    uThermalAnomaly: { value: 0.0 },
    uNightLightBoost: { value: 1.0 },
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

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Cotangent frame normal perturbation for bump relief without explicit tangents
    vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm, vec3 mapN, vec2 uv) {
      vec3 q0 = dFdx(eye_pos.xyz);
      vec3 q1 = dFdy(eye_pos.xyz);
      vec2 st0 = dFdx(uv.st);
      vec2 st1 = dFdy(uv.st);

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

      // Perturb normal using NASA SRTM topography normal map
      vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      mapN.xy *= 0.55; // Subtle natural relief
      vec3 normal = perturbNormal2Arb(vWorldPosition - cameraPosition, normalGeo, mapN, vUv);

      // Solar lighting angle on perturbed terrain
      float NdotL = dot(normal, sunDir);

      // Texture samples from NASA Blue Marble & Black Marble
      vec4 dayColor = texture2D(uDayMap, vUv);
      vec4 nightColor = texture2D(uNightMap, vUv);
      vec4 specMask = texture2D(uSpecularMap, vUv);

      // Real-time Cloud Shadow Cast onto Ground (Cloud density is in alpha channel)
      vec2 cloudUv = vec2(fract(vUv.x + uCloudOffset + 0.0015), vUv.y);
      vec4 clouds = texture2D(uCloudMap, cloudUv);
      float cloudShadow = mix(1.0, 0.55, clouds.a);

      // Natural Planetary Terminator (smooth atmospheric transition zone)
      float dayFactor = smoothstep(-0.06, 0.12, NdotL);
      float nightFactor = 1.0 - smoothstep(-0.12, 0.04, NdotL);

      // Realistic Ocean Specular Shimmer (calibrated to prevent white blowout)
      vec3 halfVector = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfVector), 0.0);
      float specular = pow(NdotH, 48.0) * specMask.r * 0.65 * dayFactor;
      vec3 specularColor = vec3(0.65, 0.82, 1.0) * specular;

      // Lit Day Surface with ground cloud shadow and ocean specular reflection
      vec3 daySurface = (dayColor.rgb * cloudShadow * dayFactor) + specularColor;

      // Night Surface with Suomi NPP VIIRS city lights emerging smoothly on unlit hemisphere
      vec3 nightSurface = nightColor.rgb * nightFactor * (1.35 * uNightLightBoost);

      // Subtle thermal anomaly infrared response for GISTEMP analysis
      vec3 thermalGlow = vec3(1.0, 0.42, 0.12) * uThermalAnomaly * 0.22 * (1.0 - specMask.r) * dayFactor;

      // Deep Space Earthshine Ambient
      vec3 ambient = dayColor.rgb * 0.022;

      gl_FragColor = vec4(daySurface + nightSurface + thermalGlow + ambient, 1.0);
    }
  `,
};

// Shader 2: 3D Volumetric Cloud Sphere Shader (Radius 2.012)
const CloudSphereShader = {
  uniforms: {
    uCloudMap: { value: null as THREE.Texture | null },
    uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
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
      float cloudAlpha = cloudSample.a;

      // Early discard clear sky
      if (cloudAlpha < 0.04) discard;

      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      float NdotL = dot(normal, sunDir);
      float sunFactor = smoothstep(-0.12, 0.22, NdotL);

      // Forward sunlight scattering through cloud water droplets (delicate silver lining)
      float forwardScatter = pow(max(dot(viewDir, -sunDir), 0.0), 3.5) * 0.25 * sunFactor;

      vec3 dayCloudColor = vec3(0.96, 0.98, 1.0) * (0.85 + forwardScatter);
      vec3 nightCloudColor = vec3(0.015, 0.02, 0.03);
      vec3 finalCloudColor = mix(nightCloudColor, dayCloudColor, sunFactor);

      // Natural cloud transparency
      gl_FragColor = vec4(finalCloudColor, cloudAlpha * (0.1 + 0.75 * sunFactor));
    }
  `,
};

// Shader 3: Rayleigh Scattering Atmospheric Limb Shader (Radius 2.028)
const AtmosphereRimShader = {
  uniforms: {
    uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
    uColor: { value: new THREE.Color('#1E5A7A') },
    uCoefficient: { value: 0.58 },
    uPower: { value: 4.2 },
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
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);

      // Fresnel limb falloff
      float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
      float atmosphere = pow(fresnel, uPower) * uCoefficient;

      // Rayleigh sun-phase scattering (brighter towards solar incidence)
      float cosTheta = dot(normal, sunDir);
      float sunFactor = smoothstep(-0.25, 0.35, cosTheta);
      float phase = 0.75 * (1.0 + cosTheta * cosTheta);

      vec3 finalColor = uColor * atmosphere * phase * (0.2 + 0.8 * sunFactor);
      float alpha = atmosphere * (0.22 + 0.78 * sunFactor);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

export const EarthGlobe: React.FC = () => {
  const earthMeshRef = useRef<THREE.Mesh>(null!);
  const cloudsMeshRef = useRef<THREE.Mesh>(null!);
  const atmosphereMeshRef = useRef<THREE.Mesh>(null!);
  const earthGroupRef = useRef<THREE.Group>(null!);
  const cloudOffsetRef = useRef(0);

  // Store Selectors
  const globeRotating = useObservatoryStore((s) => s.globeRotating);
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

  // Load NASA Scientific Texture Suite with full anisotropic mipmapping
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const day = loader.load('/textures/nasa_earth_day_4k.jpg');
    const night = loader.load('/textures/nasa_earth_night_4k.jpg');
    const clouds = loader.load('/textures/nasa_earth_clouds_4k.png');
    const specular = loader.load('/textures/nasa_earth_specular.jpg');
    const normal = loader.load('/textures/nasa_earth_normal.jpg');

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
      tex.anisotropy = 16;
    });

    return { day, night, clouds, specular, normal };
  }, []);

  // Shared Geometries (Tuned for precise radii)
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2.0, 96, 96), []);
  const cloudsGeo = useMemo(() => new THREE.SphereGeometry(2.012, 96, 96), []);
  const atmosphereGeo = useMemo(() => new THREE.SphereGeometry(2.028, 96, 96), []);

  // Shader Materials
  const earthMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: textures.day },
        uNightMap: { value: textures.night },
        uSpecularMap: { value: textures.specular },
        uNormalMap: { value: textures.normal },
        uCloudMap: { value: textures.clouds },
        uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
        uCloudOffset: { value: 0.0 },
        uThermalAnomaly: { value: 0.0 },
        uNightLightBoost: { value: 1.0 },
      },
      vertexShader: EarthSurfaceShader.vertexShader,
      fragmentShader: EarthSurfaceShader.fragmentShader,
    });
  }, [textures]);

  const cloudsMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: textures.clouds },
        uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
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
        uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
        uColor: { value: new THREE.Color('#1E5A7A') },
        uCoefficient: { value: 0.58 },
        uPower: { value: 4.2 },
      },
      vertexShader: AtmosphereRimShader.vertexShader,
      fragmentShader: AtmosphereRimShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
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

  // 60fps Continuous Loop (Zero-allocation animation loop)
  useFrame((_, delta) => {
    if (earthGroupRef.current && globeRotating) {
      earthGroupRef.current.rotation.y += delta * 0.038;
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

  const handleSentinelClick = async (sentinelId: string) => {
    if (!isAudioUnlocked) {
      await unlockAudio();
    }
    await selectSentinel(sentinelId);
    await startPlayback();
  };

  return (
    <group ref={earthGroupRef} rotation={[0.41, 0, 0]}>
      {/* 1. Photorealistic 4K Earth Surface (Day/Night/Normal/Specular/Thermal) */}
      <mesh ref={earthMeshRef} geometry={sphereGeo} material={earthMat} />

      {/* 2. 3D Volumetric Cloud Layer Sphere (Radius 2.012 with Real-time Drift) */}
      <mesh ref={cloudsMeshRef} geometry={cloudsGeo} material={cloudsMat} />

      {/* 3. Subtle Rayleigh Atmospheric Limb Glow (Radius 2.028) */}
      <mesh ref={atmosphereMeshRef} geometry={atmosphereGeo} material={atmosphereMat} />

      {/* 4. Fine Keplerian Orbital Paths for NASA Fleet */}
      {satelliteRings.map((sat) => (
        <group key={sat.id} rotation={[sat.inclinationRad, 0, 0]}>
          <line>
            <ringGeometry args={[sat.radius - 0.0018, sat.radius + 0.0018, 96]} />
            <lineBasicMaterial color="#D1B77D" opacity={0.12} transparent />
          </line>
          {/* Satellite Node Pin */}
          <mesh position={[sat.radius * Math.cos(sat.angle), sat.radius * Math.sin(sat.angle), 0]}>
            <sphereGeometry args={[0.024, 16, 16]} />
            <meshBasicMaterial color={sat.color} />
          </mesh>
        </group>
      ))}

      {/* 5. Interactive Climate Sentinel Geographic Pins & Editorial Tooltips */}
      {sentinelNodes.map((s) => {
        const isSelected = activeSentinelId === s.id;
        const isHovered = hoveredSentinelId === s.id;
        return (
          <group
            key={s.id}
            position={s.pos}
            onClick={(e) => {
              e.stopPropagation();
              handleSentinelClick(s.id);
            }}
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
            {(isHovered || isSelected) && (
              <Html
                position={[0, 0.08, 0]}
                center
                distanceFactor={14}
                pointerEvents="none"
              >
                <div className="bg-[#111820]/95 text-[#F0EEE5] border border-[#D1B77D]/60 px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md whitespace-nowrap flex flex-col items-center gap-0.5 pointer-events-none select-none">
                  <span className="font-display font-semibold text-xs tracking-wide text-[#F0EEE5]">
                    {s.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#D1B77D] tracking-widest uppercase">
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
