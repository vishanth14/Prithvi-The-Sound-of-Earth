import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
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

// Shader 1: Photorealistic Earth Surface Shader with Lambertian Cosine Falloff, Water Fresnel Sunglint, and VIIRS Night Lights
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

    // Seamless cotangent frame normal perturbation for bump relief without antimeridian seams
    vec3 perturbNormal2Arb(vec3 eye_pos, vec3 surf_norm, vec3 mapN, vec2 uv) {
      vec3 q0 = dFdx(eye_pos);
      vec3 q1 = dFdy(eye_pos);
      vec2 st0 = dFdx(uv);
      vec2 st1 = dFdy(uv);

      // Prevent seam derivative jump at UV wrapping boundary
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

      // Perturb normal using NASA SRTM topography (relief on land, smooth on oceans)
      vec4 specMask = texture2D(uSpecularMap, vUv); // 1.0 = ocean, 0.0 = land
      vec3 mapN = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      mapN.xy *= 0.42 * (1.0 - specMask.r * 0.70);
      vec3 normal = perturbNormal2Arb(vWorldPosition - cameraPosition, normalGeo, mapN, vUv);

      // Solar lighting angle on perturbed surface
      float NdotL = dot(normal, sunDir);

      // Atmospheric twilight wrap (subtle Rayleigh refraction past physical horizon)
      float twilight = smoothstep(-0.08, 0.08, NdotL);

      // Physically-based Lambertian diffuse curvature falloff (prevents washed-out flat disc)
      float diffuseLambert = clamp(NdotL, 0.0, 1.0);
      float diffuse = pow(diffuseLambert, 0.92) * twilight;

      // Texture samples from NASA Blue Marble & Black Marble
      vec4 dayColor = texture2D(uDayMap, vUv);
      vec4 nightColor = texture2D(uNightMap, vUv);

      // Ocean water albedo calibration: deep ocean absorbs light, displaying rich sapphire/navy
      vec3 oceanAlbedo = dayColor.rgb * vec3(0.68, 0.80, 0.96);
      vec3 surfaceAlbedo = mix(dayColor.rgb, oceanAlbedo, specMask.r * 0.48);

      // Real-time Cloud Shadow Cast onto Ground (Projected along solar direction)
      vec2 shadowShift = vec2(-sunDir.x, -sunDir.y) * 0.0032;
      vec2 cloudShadowUv = vec2(fract(vUv.x + uCloudOffset + shadowShift.x), clamp(vUv.y + shadowShift.y, 0.001, 0.999));
      vec4 shadowClouds = texture2D(uCloudMap, cloudShadowUv);
      float cloudShadow = mix(1.0, 0.40, smoothstep(0.08, 0.82, shadowClouds.a));

      // Direct solar spectrum shifts warmer near grazing angles (Rayleigh extinction of blue light)
      float sunsetFactor = smoothstep(0.24, -0.02, NdotL) * twilight;
      vec3 solarLightColor = mix(vec3(1.0, 0.99, 0.96), vec3(1.0, 0.68, 0.35), pow(sunsetFactor, 2.2) * 0.72);

      // Realistic Ocean Specular Sunglint with Water Fresnel (n = 1.333, F0 = 0.025)
      vec3 halfVector = normalize(sunDir + viewDir);
      float NdotH = max(dot(normal, halfVector), 0.0);
      float VdotH = clamp(dot(viewDir, halfVector), 0.0, 1.0);
      float fresnelWater = 0.025 + 0.975 * pow(1.0 - VdotH, 5.0);

      // Sharp orbital sunglint core + ocean microfacet sheen
      float sunglintCore = pow(NdotH, 180.0) * 2.4;
      float sunglintSheen = pow(NdotH, 28.0) * 0.22;
      float totalSunglint = (sunglintCore + sunglintSheen) * fresnelWater * specMask.r * twilight;
      vec3 sunglintColor = vec3(1.0, 0.98, 0.92) * totalSunglint;

      // Lit Day Surface with ground cloud shadow, warm solar twilight, and crisp ocean sunglint
      vec3 daySurface = (surfaceAlbedo * diffuse * cloudShadow * solarLightColor) + sunglintColor;

      // Suomi NPP VIIRS Night Lights: strictly active on unlit hemisphere & deep twilight (no daylight bleed)
      float nightFactor = smoothstep(0.02, -0.12, NdotL);
      vec4 overheadClouds = texture2D(uCloudMap, vec2(fract(vUv.x + uCloudOffset), vUv.y));
      float cloudCityOcclusion = mix(1.0, 0.28, smoothstep(0.1, 0.8, overheadClouds.a));
      vec3 nightSurface = nightColor.rgb * nightFactor * cloudCityOcclusion * (1.60 * uNightLightBoost);

      // Subtle thermal anomaly infrared response for GISTEMP analysis
      vec3 thermalGlow = vec3(1.0, 0.38, 0.10) * uThermalAnomaly * 0.28 * (1.0 - specMask.r) * twilight;

      // Deep Space Earthshine Ambient (faint starlight illumination)
      vec3 ambient = dayColor.rgb * 0.008 + vec3(0.001, 0.002, 0.005);

      gl_FragColor = vec4(daySurface + nightSurface + thermalGlow + ambient, 1.0);
    }
  `,
};

// Shader 2: 3D Volumetric Cloud Sphere Shader (Radius 2.008)
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
      float cloudDensity = cloudSample.a;

      // Early discard clear sky to optimize fillrate
      if (cloudDensity < 0.03) discard;

      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(uSunPosition - vWorldPosition);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      float NdotL = dot(normal, sunDir);
      float cloudTwilight = smoothstep(-0.06, 0.10, NdotL);
      float cloudLambert = clamp(NdotL, 0.0, 1.0);
      float cloudSun = pow(cloudLambert, 0.88);

      // Forward Mie scattering (delicate silver lining when viewing toward the sun through clouds)
      float forwardScatter = pow(max(dot(viewDir, -sunDir), 0.0), 4.5) * 0.32 * cloudTwilight;

      // Sunset golden-orange glow along cloud tops at the terminator
      float cloudSunsetFactor = smoothstep(0.20, -0.02, NdotL) * cloudTwilight;
      vec3 cloudSunColor = mix(vec3(0.96, 0.98, 1.0), vec3(1.0, 0.68, 0.38), pow(cloudSunsetFactor, 2.0) * 0.70);

      // Sunlit daytime cloud color
      vec3 dayCloudColor = cloudSunColor * (0.45 + 0.55 * cloudSun) + forwardScatter;

      // Night-side dark clouds
      vec3 nightCloudColor = vec3(0.003, 0.005, 0.008);
      vec3 finalCloudColor = mix(nightCloudColor, dayCloudColor, cloudTwilight);

      // Cloud alpha modulation: soft transparent wisps, full opacity for storm centers
      float cloudAlpha = smoothstep(0.05, 0.85, cloudDensity);
      // Reduce alpha on night side so dark clouds don't wash out space
      float finalAlpha = cloudAlpha * mix(0.10, 0.82, cloudTwilight);

      gl_FragColor = vec4(finalCloudColor, finalAlpha);
    }
  `,
};

// Shader 3: Rayleigh Scattering Atmospheric Limb Shader (Radius 2.016, FrontSide, Zero Night Halo)
const AtmosphereRimShader = {
  uniforms: {
    uSunPosition: { value: new THREE.Vector3(-5, 3, 4) },
    uColor: { value: new THREE.Color('#1E5A7A') },
    uCoefficient: { value: 0.42 },
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

      // Fresnel limb falloff on FrontSide (grazing angle at planetary silhouette)
      float VdotN = max(dot(viewDir, normal), 0.0);
      float fresnel = 1.0 - VdotN;
      float limb = pow(fresnel, uPower);

      // Strict Solar Phase Scattering: atmosphere ONLY scatters light when illuminated by the Sun!
      float cosSun = dot(normal, sunDir);
      float sunFactor = smoothstep(-0.04, 0.25, cosSun);

      // If unlit hemisphere, zero atmospheric glow (completely transparent on night side, NO halo)
      if (sunFactor <= 0.001) discard;

      // Rayleigh scattering phase function
      float phase = 0.75 * (1.0 + 0.5 * cosSun * cosSun);

      // Sunset reddening along the terminator limb
      float terminatorSunset = smoothstep(0.25, -0.02, cosSun) * sunFactor;
      vec3 limbColor = mix(uColor, vec3(1.0, 0.55, 0.25), pow(terminatorSunset, 2.5) * 0.80);

      vec3 finalColor = limbColor * limb * phase * sunFactor * (uCoefficient * 1.5);
      float finalAlpha = clamp(limb * sunFactor * 0.92, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, finalAlpha);
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

  // Shared Geometries (High-resolution 144-segment spheres eliminate polygonal silhouette faceting)
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(2.0, 144, 144), []);
  const cloudsGeo = useMemo(() => new THREE.SphereGeometry(2.008, 144, 144), []);
  const atmosphereGeo = useMemo(() => new THREE.SphereGeometry(2.016, 144, 144), []);

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
        uCoefficient: { value: 0.42 },
        uPower: { value: 4.2 },
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

    // Gentle, restrained aerospace pointer parallax in Hero chapter (observer vantage response)
    if (earthGroupRef.current && !scrollState.isInteractingWithGlobe) {
      if (scrollState.progress <= 0.12 && !scrollState.prefersReducedMotion) {
        const targetTiltX = 0.41 - state.pointer.y * 0.038; // subtle orbital pitch (max ~2.2 deg)
        const targetRollZ = state.pointer.x * 0.028;        // subtle orbital roll (max ~1.6 deg)
        earthGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          earthGroupRef.current.rotation.x,
          targetTiltX,
          delta * 2.2
        );
        earthGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          earthGroupRef.current.rotation.z,
          targetRollZ,
          delta * 2.2
        );
      } else {
        earthGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          earthGroupRef.current.rotation.x,
          0.41,
          delta * 2.5
        );
        earthGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          earthGroupRef.current.rotation.z,
          0.0,
          delta * 2.5
        );
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
