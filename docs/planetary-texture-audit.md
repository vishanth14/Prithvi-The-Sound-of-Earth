# PRITHVI — Planetary Texture & Imagery Technical Audit
**Project:** PRITHVI — The Sound of Earth  
**Team:** Multiverse Vendhan  
**NASA Space Apps Challenge 2026:** The Earth Information Jukebox  
**Layer:** Layer 11 — Planetary Rendering & Exploration Engine  

---

## 1. Architectural Scope & Disclaimer
> [!NOTE]
> **Exploration Engine Scope:** PRITHVI delivers a high-fidelity, Google Earth-inspired planetary exploration experience focused specifically on multi-decadal NASA Earth Information Center (EIC) scientific datasets. It integrates physical Three.js WebGL shaders with real-time Tone.js sonification. It is **not** equivalent to Google Earth's multi-petabyte global street-level, aerial photogrammetry, or commercial satellite imagery tile-streaming infrastructure.

---

## 2. Empirical Planetary Texture Registry

Every surface map utilized in PRITHVI is derived exclusively from verified, publicly available, authentic NASA scientific repositories. **Zero artificial intelligence (AI) generated planet textures or synthetic fantasy bitmaps are permitted.**

| Layer Map | Asset Path | Dimensions | Size | Format | Color Space | Min / Mag Filter | Anisotropy | Primary Scientific Source & Agency | License |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Earth Day Surface** | `/textures/nasa_earth_day_4k.jpg` | $4096 \times 2048$ | $1,360\text{ KB}$ | JPEG | sRGB (`THREE.SRGBColorSpace`) | `LinearMipmapLinear` / `Linear` | 16x | **NASA Visible Earth / Blue Marble: Next Generation (BMNG).** Surface topography and land cover derived from Terra/Aqua MODIS observations. | Public Domain (NASA Open Data) |
| **Earth Night Lights** | `/textures/nasa_earth_night_4k.jpg` | $4096 \times 2048$ | $698\text{ KB}$ | JPEG | sRGB (`THREE.SRGBColorSpace`) | `LinearMipmapLinear` / `Linear` | 16x | **NASA GSFC / NOAA Suomi NPP VIIRS Black Marble (VNP46 suite).** Calibrated nocturnal surface radiance ($500\text{--}900\text{ nm}$). | Public Domain (NASA/NOAA Open Data) |
| **Earth Cloud Sphere** | `/textures/nasa_earth_clouds_4k.png` | $4096 \times 2048$ | $4,915\text{ KB}$ | PNG (8-bit alpha) | sRGB (`THREE.SRGBColorSpace`) | `LinearMipmapLinear` / `Linear` | 16x | **NASA Visible Earth Composite Cloud Imagery.** Global cloud fraction composite from geostationary and polar-orbiting meteorological satellites. | Public Domain (NASA Open Data) |
| **Surface Relief Normal** | `/textures/nasa_earth_normal.jpg` | $2048 \times 1024$ | $328\text{ KB}$ | JPEG | Linear (`THREE.NoColorSpace`) | `LinearMipmapLinear` / `Linear` | 16x | **NASA JPL / Shuttle Radar Topography Mission (SRTM30).** Global digital elevation model converted to normalized tangent vectors. | Public Domain (NASA/JPL Open Data) |
| **Ocean Specular Mask** | `/textures/nasa_earth_specular.jpg` | $2048 \times 1024$ | $218\text{ KB}$ | JPEG | Linear (`THREE.NoColorSpace`) | `LinearMipmapLinear` / `Linear` | 16x | **NASA Blue Marble Water Mask.** Binary ocean-vs-land mask ($1.0 = \text{water/ocean}$, $0.0 = \text{land}$). | Public Domain (NASA Open Data) |

---

## 3. Shader Formulation & Physical Lighting Models

### A. Surface Shader (`EarthSurfaceShader`)
- **Cotangent Frame Normal Perturbation (`perturbNormal2Arb`):** Evaluates surface derivatives (`dFdx`, `dFdy`) without antimeridian boundary seams, modulating land relief while maintaining mirror-smooth ocean surfaces.
- **Physical Ocean Specular Sunglint with Water Fresnel:**
  $$\text{Fresnel}(V, H) = F_0 + (1 - F_0)(1 - V \cdot H)^5 \quad (F_0 = 0.025, n = 1.333)$$
  $$\text{Sunglint} = \left(2.4 \cdot (N \cdot H)^{180} + 0.22 \cdot (N \cdot H)^{28}\right) \cdot \text{Fresnel} \cdot \text{specMask.r} \cdot \text{twilight}$$
- **Day/Night Terminator:** Smooth cosine falloff $\text{smoothstep}(0.02, -0.12, N \cdot L)$ preventing abrupt cutoffs or unnatural glowing rims on the night hemisphere.
- **City Light Cloud Occlusion:** Night lights are dynamically attenuated beneath dense overhead storm systems ($\text{mix}(1.0, 0.28, \alpha_{\text{cloud}})$), matching real-world orbital observations.

### B. Volumetric Cloud Sphere (`CloudSphereShader`, Radius 2.008)
- **Forward Mie Scattering:** Simulates silver-lining illumination when camera views toward the Sun through thin cloud margins ($\text{pow}(\max(V \cdot -L, 0.0), 4.5) \cdot 0.32$).
- **Terminator Chromatic Shift:** Shifts cloud tops from crisp daylight white ($\text{RGB}(0.96, 0.98, 1.0)$) to golden-amber ($\text{RGB}(1.0, 0.68, 0.38)$) at solar grazing angles.
- **Ground Cloud Shadow Projection:** Projects cloud shadows onto the ground sphere along the solar vector, producing physical spatial depth between atmosphere and topography.

### C. Atmospheric Rayleigh Limb (`AtmosphereRimShader`, Radius 2.016)
- **FrontSide Grazing Ingress:** Renders on FrontSide with dynamic limb exponent ($\text{pow}(1.0 - V \cdot N, 4.2)$), eliminating unrealistic neon silhouettes.
- **Strict Solar Phase Masking:** Atmosphere only scatters light when solar illumination is positive ($N \cdot L > -0.04$), rendering the night hemisphere completely dark and transparent against the distant starfield.

---

## 4. Visual Performance & Memory Architecture

- **Total Texture VRAM Footprint:** $\approx 48\text{ MB}$ uncompressed in GPU memory, allowing 60 FPS performance even on low-power mobile GPUs (Adreno 600+, Apple A12+).
- **Anisotropic Filtering:** $16\times$ sampling eliminates blur and moiré at glancing polar viewing angles.
- **Resource Lifecycle:** All WebGL geometries (`SphereGeometry(2.0, 144, 144)`), custom shaders, and texture handles are explicitly disposed of on component unmount to prevent GPU memory leaks.
