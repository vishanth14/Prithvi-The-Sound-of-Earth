# PRITHVI — THE SOUND OF EARTH
### The Earth Information Jukebox // NASA Space Apps Challenge 2026

> *"Every change has a sound. Every sound tells a story."*

**Team:** MULTIVERSE VENDHAN  
**Challenge:** NASA Space Apps Challenge 2026 — The Earth Information Jukebox  
**Live Observatory Engine:** React 19 • Three.js • React Three Fiber • Tone.js • Web Audio API • GSAP • Lenis • D3 • Zod • Tailwind CSS v4

---

## 🌍 Executive Summary & Vision

**PRITHVI (Sanskrit for "Earth")** is an immersive digital orbital observatory that bridges empirical NASA Earth system science with psychoacoustic sonification. Inspired by the NASA Scientific Visualization Studio (SVS), high-end digital observatories, and accessible multimodal design, PRITHVI transforms multi-decadal satellite telemetry into calibrated 3D spatial geometry and deterministic auditory displays.

$$\text{SEE} \longrightarrow \text{EXPLORE} \longrightarrow \text{LISTEN} \longrightarrow \text{UNDERSTAND}$$

Instead of playing static background audio or arbitrary musical loops, **PRITHVI is a true scientific sonification instrument**: every acoustic parameter (fundamental frequency in Hertz, rhythmic tempo in BPM, harmonic dissonance, and resonant filter cutoff) is calculated in real time directly from validated NASA satellite observations.

---

## 🛰️ NASA Earth Information Center (EIC) Data Integration

PRITHVI ingests and validates authentic observations released by NASA and international partner agencies. Data is processed through an automated **PapaParse + Zod schema validation** pipeline that guarantees strict scientific integrity (preserving original measurements, physical units, baselines, and data flags without silent imputation or uncalibrated fabrication).

| Dataset Stream | Lead Agency & Sensors | Temporal Range | Physical Measurement | Primary Unit | Baseline Benchmark |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GISTEMP v4** | NASA GISS / Meteorological Stations | 1880 – 2026 | Global Surface Temperature Anomaly | °C | 1951–1980 climatological mean |
| **Mauna Loa CO₂** | NOAA Global Monitoring Lab / Scripps | 1958 – 2026 | Atmospheric $\text{CO}_2$ Mole Fraction | ppm | 280.0 ppm pre-industrial standard |
| **PO.DAAC Altimetry** | NASA JPL / Sentinel-6 / Jason Series | 1993 – 2026 | Global Mean Sea Level (GMSL) | mm | 1993–2008 altimetric reference |
| **GEOS-FP Aerosols** | NASA GMAO / Terra & Aqua MODIS | 2000 – 2026 | Aerosol Optical Depth (AOD 550nm) | Unitless | 0.05 clean background troposphere |
| **VIIRS Night Lights** | NASA Black Marble / Suomi-NPP / NOAA | 2012 – 2026 | Anthropogenic Nocturnal Radiance | $\text{nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$ | 5.0 rural dark-sky reference |

---

## 🎼 The Real-Time Sonification Engine

PRITHVI features a dedicated synthesizer graph built on **Tone.js v15** and the native **Web Audio API**. It operates with a brickwall anti-clipping limiter ($-0.5\text{ dB}$ threshold) and high-fidelity analyser nodes feeding a 48-band FFT spectrum and real-time oscilloscope canvas.

### Deterministic Transfer Functions

1. **Thermal Frequency Transfer Function (GISTEMP v4):**
   $$f(\Delta T) = 146.83 \times 2^{\left(\frac{\Delta T + 0.16}{1.2}\right)} \quad [\text{Hz}]$$
   *Maps temperature deviation ($\Delta T$) to pitch in equal temperament. Baseline equilibrium begins at $146.83\text{ Hz}$ ($D_3$). Each $+1.2^\circ\text{C}$ warming anomaly doubles the frequency.*

2. **Greenhouse Rhythm Cadence Function (Mauna Loa $\text{CO}_2$):**
   $$\text{BPM}(\text{CO}_2) = 48 \times \left(\frac{\text{CO}_2}{280.0}\right)^{1.4} \quad [\text{Beats / Minute}]$$
   *Accelerates the subterranean membrane kick heartbeat from a calm $48\text{ BPM}$ pre-industrial pulse to an urgent $96+\text{ BPM}$ modern Anthropocene tempo.*

3. **Oceanic Altimetry Resonant Filter Swell (Sentinel-6 / PO.DAAC):**
   $$f_{\text{cutoff}}(\text{GMSL}) = 120 + 2280 \times \left(\frac{\text{GMSL} + 3.5}{120}\right) \quad [\text{Hz}]$$
   *Modulates a 4-pole resonant bandpass filter over brownian noise, evoking rising tidal surges.*

4. **Wildfire Aerosol Inharmonicity Modulation (GEOS-FP):**
   $$\beta(\text{AOD}) = 0.2 + 8.0 \times \left(\frac{\text{AOD} - 0.05}{0.40}\right)$$
   *Modulates frequency modulation (FM) index to induce metallic dissonance during catastrophic aerosol and wildfire smoke spikes.*

### Psychoacoustic Consonance vs. Dissonance
- **Equilibrium States (1880 Baseline):** Resolves into consonant $3:2$ Perfect Fifths ($D_3 + A_3$) and calm $48\text{ BPM}$ biological pulse.
- **Transitional States (1975):** Introduces $5:4$ Major Thirds and accelerating $69\text{ BPM}$ tempo.
- **Anthropocene Stress (2026):** Triggers grating $16:15$ Minor Seconds ($G\sharp_4$ with $A_4$) and tritones ($\text{dim } 5^{\text{th}}$), provoking natural biological tension in response to planetary strain.

---

## 🌐 Application Architecture & User Journey

PRITHVI is organized into 7 integrated observatory chapters:

1. **Section 01 // Cinematic Landing Observatory:** Mission briefing, live telemetry ticker, and Web Audio unlock gateway.
2. **Section 02 // Interactive 3D Earth Explorer:** Photorealistic Three.js sphere with custom atmospheric Rayleigh scattering shaders, dynamic thermal bloom uniforms, nocturnal city light modulation, and 5 clickable NASA Climate Sentinel ground stations (Mauna Loa, Svalbard, Vostok, Amazon ATTO, Pacific TAO).
3. **Section 03 // NASA Earth Information Center Visualizer:**
   - **NASA SVS #4976 Climate Spiral:** D3 polar coordinates plotting temperature progression from 1880 to 2026 ($0.0^\circ\text{C}$ baseline, $+1.0^\circ\text{C}$, $+1.5^\circ\text{C}$ Paris Agreement threshold ring).
   - **5-Stream Multi-Track Visualizer:** Synchronized multi-variable timeline.
   - **Zod Schema Data Audit:** Transparent data quality, baseline, and missing-value report.
4. **Section 04 // Orbital Satellite Constellations:** Keplerian orbital trajectories for NASA's Earth System Observatory fleet (Terra, Aqua, GRACE-FO, Landsat 9, Sentinel-6).
5. **Section 05 // Scientific Data Exploration Timeline:** Scrubber-controlled time-series with live **Sound-to-Data Synchronized Legend HUD**.
6. **Section 06 // Real-Time Sonification Laboratory:** 48-band FFT spectrum analyzer, 60fps oscilloscope canvas, decibel/frequency graticule, speed multipliers ($0.5\times$ to $2.0\times$), looping, volume, and mute.
7. **Section 07 // Sound-to-Science & Epistemology:**
   - **Interactive Psychoacoustic Harmonic Audition Lab:** 1-click comparative auditioning between 1880, 1975, and 2026.
   - **Open Science CSV Data Export:** One-click download of all validated observations.
   - **Multimodal Accessibility Matrix & Citations:** WCAG 2.2 AA audit and direct links to NASA repositories.

---

## ♿ Multimodal Accessibility & WCAG 2.2 AA Compliance

PRITHVI was engineered from inception to ensure inclusive access for all researchers, educators, and citizens:

- **Visual-to-Audio Equivalence:** Every acoustic parameter is simultaneously represented by live numeric readouts, musical note identifiers with cents offset ($\pm 50\text{¢}$), and a dedicated visual amplitude activity meter for users who are deaf or hard of hearing.
- **Screen Reader Live Regions:** Dynamic `role="status" aria-live="polite"` announcements speak changes in sonification frequency, note name, and observation year during playback.
- **ARIA Semantics:** All timeline scrubbers, volume faders, and track pickers feature `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and descriptive `aria-valuetext`.
- **High-Contrast Focus Indicators:** All interactive elements feature prominent `focus-visible:ring-2 focus-visible:ring-cyan-400` styling.
- **Vestibular Motion Safety:** Honors `prefers-reduced-motion` across GSAP transitions and Three.js camera animations.

### ⌨️ Global Keyboard Navigation (Hotkeys)

Press **`?`** anywhere in the application to open the on-screen keyboard guide.

| Key | Action |
| :--- | :--- |
| **`[Space]`** | Toggle Sonification Play / Pause |
| **`[M]`** | Mute / Unmute Master Audio Bus |
| **`[←]` / `[→]`** | Step Timeline Playhead Backward / Forward 1 Year |
| **`[1]` – `[5]`** | Select EIC Stream (Thermal, $\text{CO}_2$, Sea Level, Aerosols, Night Lights) |
| **`[R]`** | Reset Timeline to 1880 Pre-Industrial Origin |
| **`[?]`** | Open / Close Keyboard Shortcuts Manual |
| **`[Esc]`** | Dismiss Modals & Dialogs |

---

## 🛠️ Technology Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript 5.9, Vite 8 |
| **3D & WebGL Canvas** | Three.js, React Three Fiber (R3F), Drei, Postprocessing, Maath |
| **Audio Engine** | Tone.js v15, Native Web Audio API (`AudioContext`, `AnalyserNode`) |
| **Animation & Scroll** | GSAP 3, ScrollTrigger, `@gsap/react`, Lenis Smooth Scroll |
| **Data & Visualization** | D3.js (Scales, Shapes, Polar Coordinates), PapaParse (CSV), Zod (Schema Validation) |
| **State Management** | Zustand 5 (Unidirectional reactive state bus with 0ms clock drift) |
| **Styling & Design** | Tailwind CSS v4, Lucide React Icons |
| **Typography** | Space Grotesk (Display), Inter (Sans), IBM Plex Mono (Telemetry & Code) |

---

## 🚀 Local Installation & Development

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/Multiverse-Vendhan/Prithvi-The-Sound-of-Earth.git
cd Prithvi-The-Sound-of-Earth

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173/
```

### Verification & Testing Commands

```bash
# Run ESLint code quality audit
npm run lint

# Compile TypeScript and build production bundle
npm run build

# Preview optimized production bundle
npm run preview
```

---

## 📚 Official Scientific Citations & Attributions

1. **NASA GISTEMP v4:** GISTEMP Team, 2026: *GISS Surface Temperature Analysis (GISTEMP), version 4.* NASA Goddard Institute for Space Studies. [https://data.giss.nasa.gov/gistemp/](https://data.giss.nasa.gov/gistemp/)
2. **NOAA / SIO Mauna Loa $\text{CO}_2$:** Keeling, C.D., et al., 2026: *Atmospheric Carbon Dioxide Dry Air Mole Fractions from the Mauna Loa Observatory, Hawaii.* NOAA Global Monitoring Laboratory. [https://gml.noaa.gov/ccgg/trends/](https://gml.noaa.gov/ccgg/trends/)
3. **NASA PO.DAAC Sea Level:** Beckley et al., 2026: *Global Mean Sea Level Trend from TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, and Sentinel-6 Michael Freilich.* NASA JPL. [https://podaac.jpl.nasa.gov/](https://podaac.jpl.nasa.gov/)
4. **NASA MODIS NDVI:** Didan, K., 2026: *MOD13A2 MODIS/Terra Vegetation Indices 16-Day L3 Global 1km SIN Grid V061.* NASA LP DAAC. [https://lpdaac.usgs.gov/](https://lpdaac.usgs.gov/)
5. **NASA Ozone Watch:** Newman, P. A., et al., 2026: *NASA Ozone Watch Historical Antarctic Column Ozone Database.* NASA Goddard Space Flight Center. [https://ozonewatch.gsfc.nasa.gov/](https://ozonewatch.gsfc.nasa.gov/)
6. **NASA SVS Climate Spiral:** NASA Goddard Space Flight Center Scientific Visualization Studio, Asset #4976.

---

## 🏆 NASA Space Apps Challenge 2026

- **Project:** PRITHVI — The Sound of Earth
- **Challenge:** The Earth Information Jukebox
- **Team:** MULTIVERSE VENDHAN
- **Year:** 2026

*Dedicated to open science, accessible education, and listening to our living planet.*
