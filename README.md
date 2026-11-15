# PRITHVI — THE SOUND OF EARTH
### The Earth Information Jukebox // NASA Space Apps Challenge 2026

> *"Every change has a sound. Every sound tells a story."*

**Team:** MULTIVERSE VENDHAN  
**Challenge:** NASA Space Apps Challenge 2026 — The Earth Information Jukebox  
**Live Observatory Engine:** React 19 • Three.js • React Three Fiber • Tone.js • Web Audio API • GSAP • Lenis • D3 • Zod • Tailwind CSS v4  
**Design Identity:** Orbital Documentary (Editorial Aerospace Magazine)  
**Scientific Audit:** Certified in [docs/scientific-provenance-audit.md](docs/scientific-provenance-audit.md)  
**Submission Dossier:** Complete 7-Slide Presentation in [docs/nasa-space-apps-submission-dossier.md](docs/nasa-space-apps-submission-dossier.md)  

---

## 🌍 Executive Summary & Vision

**PRITHVI (Sanskrit for "Earth")** is an immersive digital orbital documentary and real-time scientific sonification instrument developed for the NASA Space Apps Challenge 2026: *The Earth Information Jukebox*.

Inspired by the NASA Scientific Visualization Studio (SVS), high-end digital editorial publications, and accessible multimodal design, PRITHVI transforms multi-decadal satellite telemetry into calibrated 3D spatial geometry and deterministic auditory displays.

$$\text{OBSERVE} \longrightarrow \text{EXPLORE} \longrightarrow \text{LISTEN} \longrightarrow \text{UNDERSTAND}$$

Instead of playing static background audio or arbitrary pre-recorded loops, **PRITHVI is a true scientific sonification instrument**: every acoustic parameter (fundamental frequency in Hertz, rhythmic tempo in BPM, harmonic dissonance, and resonant filter cutoff) is calculated in real time directly from validated NASA satellite observations.

---

## 🛰️ NASA Earth Information Center (EIC) Scientific Provenance Audit

PRITHVI ingests and validates authentic observations released by NASA and international partner agencies. Following a comprehensive forensic scientific audit ([docs/scientific-provenance-audit.md](docs/scientific-provenance-audit.md)), all misattributed SVS asset IDs were corrected, empirical temporal boundaries established, and unverified model proxies quarantined.

| Visualization | Official ID | Data Source | Variable | Physical Unit | True Temporal Range | In-Project Rows | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA Climate Spiral** | **SVS 5190** | NASA GISS (GISTEMP v4) | Surface Temperature Anomaly | °C | 1880–2024 (Annual snapshots) | 38 | **PARTIALLY VERIFIED (Subsampled)** — Values 1880–2024 match annual mean; 2025–2026 removed. |
| **DYAMOND Global $\text{CO}_2$** | **SVS 5196** | NOAA Global Monitoring Lab & Scripps / NASA GMAO | Atmospheric $\text{CO}_2$ Mole Fraction | ppm | Model: Jan–Mar 2020; In-situ: 1958–2024 | 21 | **PARTIALLY VERIFIED (Disjoint)** — SVS 5196 simulation differentiated from in-situ Keeling curve. |
| **Global Mean Sea Level** | **SVS 5312** | NASA PO.DAAC / JPL (Sentinel-6, Jason series) | Sea Surface Height Variation | mm | 1993–2023 | 20 | **VERIFIED (Bounded 1993–2023)** — Capped at verified 2023 record ($+111.4\text{ mm}$). |
| **Atmospheric Aerosols** | *Model Proxy* | NASA GMAO Forward Processing (MODIS/VIIRS) | Aerosol Optical Depth (AOD 550nm) | Dimensionless AOD | 2000–2024 (Assimilation proxy) | 14 | **QUARANTINED / DISABLED** — Disabled in UI; unverified against DAAC scalar releases. |
| **Change in Night Lights** | **SVS 5313** | NASA ESDS Black Marble / Suomi NPP VIIRS | Top-of-Atmosphere Nocturnal Radiance | $\text{nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$ | 2012–2023 | 12 | **VERIFIED (Bounded 2012–2023)** — Capped at verified 2023 record ($124.6\text{ nW}$). |

---

## 🎨 Creative Direction: "Orbital Documentary"

PRITHVI features an aerospace editorial visual identity inspired by high-end digital storytelling:
- **Alternating Light & Dark Chapters:** Breaks visual monotony by alternating between deep space black (`#070B10`) and starlight white editorial paper (`#E9EDF0`).
- **Typographic Hierarchy:**
  - *Headlines:* `Barlow Condensed` (uppercase, bold/extrabold, tight letter-spacing).
  - *Body:* `IBM Plex Sans` (clean, readable editorial prose).
  - *Telemetry & Code:* `IBM Plex Mono` (calibrated scientific readings, formulas, and coordinates).
- **Aerospace Color Tokens:**
  - Deep Space Black: `#070B10`
  - Starlight White: `#E9EDF0`
  - Launch Signal Orange: `#FF5938`
  - Atmospheric Blue: `#83BBD5`
  - Technical Graphite: `#252D36`

---

## 🎼 The Real-Time Sonification Engine

PRITHVI features a dedicated synthesizer graph built on **Tone.js v15** and the native **Web Audio API**. It operates with a brickwall anti-clipping limiter ($-0.5\text{ dB}$ threshold) and high-fidelity analyser nodes feeding a 48-band FFT spectrum and real-time oscilloscope canvas.

### Deterministic Transfer Functions

1. **Thermal Frequency Transfer Function (GISTEMP v4):**
   $$f(\Delta T) = 220 \times 2^{\left(\frac{\Delta T}{1.2}\right)} \quad [\text{Hz}]$$
   *Maps temperature deviation ($\Delta T$) to musical pitch in equal temperament. Each $+1.2^\circ\text{C}$ warming anomaly doubles the frequency.*

2. **Greenhouse Rhythm Cadence Function (Mauna Loa $\text{CO}_2$):**
   $$\text{BPM}(\text{CO}_2) = 48 \times \left(\frac{\text{CO}_2}{280.0}\right)^{1.4} \quad [\text{Beats / Minute}]$$
   *Accelerates the subterranean membrane kick heartbeat from a calm $48\text{ BPM}$ pre-industrial resting pulse to an urgent $92+\text{ BPM}$ modern cadence.*

3. **Oceanic Altimetry Resonant Filter Swell (Sentinel-6 / PO.DAAC):**
   $$f_{\text{cutoff}}(\text{GMSL}) = 120 + 2280 \times \left(\frac{\text{GMSL}}{120}\right) \quad [\text{Hz}]$$
   *Modulates a 4-pole resonant bandpass filter over brownian noise, evoking rising tidal surges.*

4. **Aerosol Particulate Modulation (GEOS-FP Proxy):**
   $$\text{ModIndex}(\text{AOD}) = 0.2 + 2.5 \times \left(\frac{\text{AOD}}{0.5}\right)$$
   *Modulates frequency modulation (FM) index to induce crystalline inharmonic overtones during high particulate loading.*

### Psychoacoustic Consonance vs. Dissonance
- **Equilibrium (1880 Baseline):** Resolves into consonant $3:2$ Perfect Fifths ($D_3 + A_3$) and calm $48\text{ BPM}$ biological pulse.
- **Acceleration (1975):** Introduces $5:4$ Major Thirds ($G_3$) and accelerating $69\text{ BPM}$ tempo.
- **Anthropocene Stress (2024):** Triggers grating $16:15$ Minor Seconds ($G_4$ with $G\sharp_4$) and tritones, provoking natural biological urgency in response to biospheric stress.

---

## 🌐 The 6 Editorial Chapters

1. **CHAPTER 01 // ORIGIN (`#hero` — Dark `#070B10`):** Colossal Barlow Condensed title, mission metadata, real-time 3D Earth emerging from deep space, and dual calls to action (`BEGIN THE JOURNEY` and `LISTEN TO EARTH`).
2. **CHAPTER 02 // ORBIT (`#explorer` & `#fleet` — Light `#E9EDF0`):** Starlight white magazine layout with framed dark 3D Earth aperture, 5 NASA Climate Sentinels with fly-to camera controls, and active NASA Earth Fleet orbit tracking (Terra, Aqua, GRACE-FO, Landsat 9, Sentinel-6).
3. **CHAPTER 03 // SIGNALS (`#stories` — Dark `#070B10`):** Deep editorial scientific stories using verified NASA EIC visuals, investigator pull-quotes (Dr. Gavin Schmidt, Dr. Ralph Keeling, Dr. Josh Willis), timeline telemetry, and direct sonification audition links.
4. **CHAPTER 04 // FREQUENCY (`#jukebox` — Dark Acoustic Studio `#070B10` / `#0E141D`):** Primary challenge split composition:
   - *Left:* NASA SVS #5190 Climate Spiral polar canvas ($0.0^\circ\text{C}$, $+1.0^\circ\text{C}$, $+1.5^\circ\text{C}$ rings), multitrack time-series, Zod data audit table, and live 48-band FFT spectrum + oscilloscope.
   - *Right:* 5 EIC channel selector buttons (with quarantined aerosol stream disabled), live scientific readout, transfer formula HUD, and timeline scrubber bounded to empirical benchmarks (1880–2024).
5. **CHAPTER 05 // DECODING (`#signal` — Light Laboratory `#E9EDF0`):** Mathematical equations, epistemological limitations, and interactive harmonic audition lab comparing 1880, 1975, and 2024.
6. **CHAPTER 06 // BEYOND (`#open-science` — Dark `#070B10`):** Software Architecture blueprint card, 1-click CSV data export of all validated observations, official citations with copy buttons, WCAG 2.2 AA accessibility matrix, and NASA Space Apps team dossier.

---

## 🎬 Central Cinematic Experience Orchestrator (Layer 9)

PRITHVI orchestrates its six editorial chapters as a continuous, unified planetary narrative inspired by the spatial continuity of *Igloo* and the cinematic chapter pacing of *Charles Leclerc*:

- **Centralized Experience State (`useExperienceStore`):** Zustand-powered state engine tracking active chapter (`01 ORIGIN` through `06 BEYOND`), visual scene mode, camera interpolation state, active scientific story, and transition directions. High-frequency 60fps telemetry is decoupled from React renders to eliminate re-render overhead.
- **Continuous Persistent 3D Canvas:** Rather than mounting and destroying WebGL contexts across sections, a single persistent React Three Fiber canvas spans the entire application viewport.
- **6-Chapter Camera Trajectory Choreography:**
  - `01 ORIGIN`: Earth appears from deep space ($[0.0, 0.45, 7.5]$) with high-contrast solar rim illumination.
  - `02 ORBIT`: Camera sweeps into low-Earth orbit ($[1.62, -0.08, 6.8]$), activating Rayleigh atmospheric limb scattering and Ground Sentinel pin focus.
  - `03 SIGNALS`: Dramatic orbital perspective ($[-1.45, 0.20, 6.1]$) framing the NASA Earth Information Center editorial narratives.
  - `04 FREQUENCY`: Pulls into the dark sonic laboratory ($[0.0, 0.08, 7.3]$) with subdued ambient earthshine, letting the NASA SVS #5190 Polar Spiral and real-time FFT spectrum analyzer dominate visually.
  - `05 DECODING`: Settles into technical editorial composition ($[1.75, 0.12, 7.2]$), revealing the mathematical transfer functions and psychoacoustic logic.
  - `06 BEYOND`: Pulls out to monumental deep space ($[0.0, 0.05, 8.2]$), presenting the open-science dossier and verified citations.
- **Dynamic Cinematic Lighting Transitions:** Solar key light ($2.5 \to 1.6\text{ intensity}$) and atmospheric scattering coefficients lerp smoothly between chapters via `DynamicSceneLighting`.
- **Synchronized Conflict-Free Navigation:** Programmatic jumps through Navbar or ScrollProgressHUD coordinate directly with Lenis smooth scroll (`duration: 1.25s`), prevent ScrollTrigger race conditions, and preserve browser history via HTML5 `pushState` deep links (`#hero`, `#explorer`, `#stories`, `#jukebox`, `#signal`, `#open-science`).

---

## 🎯 Advanced Cursor & Tactile Interaction System (Layer 10)

PRITHVI features an aerospace-grade interaction language designed to feel precise, physical, and restrained:

1. **Custom Minimal Orbital Cursor (`CustomCursor.tsx`):**
   - **Desktop Only:** Strictly active for fine pointer devices (`@media (pointer: fine)`); completely unmounted on touch devices (`isTouchDevice === true`) to guarantee zero ghost tap lags and preserve native touch behavior.
   - **Precision Point & Orbital Ring:** Features a starlight central pointer that shifts to Launch Orange on interactive hover, surrounded by a subtle trailing ring with cardinal calibration ticks and a rotating satellite node.
   - **Contextual Action Badges:** Displays restrained technical action pills: `EXPLORE`, `ROTATE`, `LISTEN`, `OPEN`, `DISCOVER`, `DRAG`.
   - **Prose Preservation:** Automatically dims and hides over readable body paragraphs, ensuring editorial text selection and readability are never obstructed.
   - **Zero-Rerender Loop:** Coordinates interpolate smoothly at 60 FPS using direct DOM transforms in `requestAnimationFrame`.

2. **Magnetic Proximity Buttons (`MagneticButton.tsx`):**
   - Implements a restrained physical magnetic pull capped at $\pm 9\text{ px}$ with a spring pull strength of $0.24$.
   - **Dual-Layer Parallax:** The outer button boundary translates toward the cursor while inner typography and icons translate with secondary forward depth ($45\%$ of container pull).
   - Smooth cubic-bezier spring return on pointer exit (`0.45s cubic-bezier(0.25, 1, 0.5, 1)`).
   - Applied across primary CTAs ("BEGIN THE JOURNEY", "LISTEN TO EARTH", "LISTEN TO THIS DATA IN THE JUKEBOX", "EXPORT OBSERVATIONS (CSV)").

3. **Interactive Visual Frames (`InteractiveVisualFrame.tsx`):**
   - **3D Cursor-Following Parallax:** Cards calculate normalized pointer coordinates to apply dynamic `perspective(1000px) rotateX(...) rotateY(...) scale3d(...)` tilt.
   - **Aerospace Chamfered Geometry:** Technical reticle corners and precision clip-path edges.
   - **Secondary Depth Movement:** Visuals translate forward along the Z-axis (`translate3d(nx, ny, 16px)`).
   - **Animated Telemetry Caption Reveal:** Sliding HUD overlay revealing official NASA SVS identifiers, instrument citations, and calibrated epoch timestamps on hover.

4. **Physical 3D Earth Inertia & Damped Tilt (`EarthGlobe.tsx`):**
   - Rather than aggressive, twitchy mouse following, the planetary body responds with heavy physical inertia and dignified mass ($0.65\text{s}$ half-life damping via `maath.easing.damp`).
   - Active across viewing chapters (up to $55\%$ scroll progress) with subtle $\pm 2.5^\circ$ observer vantage tilt.
   - Yields cleanly when the user initiates manual orbital drag (`onStart`), smoothly recovering its astronomical axial tilt on release.

5. **Tactile Micro-Interactions:**
   - **Aerospace Range Slider:** Precision sharp thumb ($10\text{px} \times 18\text{px}$) that scales $1.15\times$ on hover with starlight border and blooms with a glowing orange aura and grabbing cursor when dragged.
   - **Rhythmic Audio Pulse Rings:** Animated ping indicators when Tone.js synthesis is actively outputting harmonic frequencies.
   - **Navigation Directional Indicators:** Desktop and mobile navigation links smoothly reveal animated directional arrows (`→`) and subtle letter-spacing expansion on hover.
   - **Keyboard Navigability:** Full WCAG 2.2 AA conformance with clear `focus-visible:ring-2` focus rings across all 80+ interactive controls.

---

## ♿ Multimodal Accessibility & WCAG 2.2 AA Compliance

- **Visual-to-Audio Equivalence:** Every acoustic parameter is simultaneously represented by live numeric readouts, musical note identifiers with cents offset, and a dedicated visual amplitude activity meter for users who are deaf or hard of hearing.
- **Global Keyboard Navigation (Hotkeys):** Press **`?`** anywhere in the application to open the on-screen keyboard guide.
  - `[Space]` — Toggle Play / Pause
  - `[M]` — Mute / Unmute Audio Bus
  - `[←]` / `[→]` — Seek Playhead 1 Year
  - `[1]` – `[5]` — Select Data Channel
  - `[R]` — Reset to 1880 Origin
  - `[?]` — Toggle Keyboard Shortcuts Guide
  - `[Esc]` — Dismiss Dialogs
- **Screen Reader Support:** Dynamic `role="status" aria-live="polite"` regions announce frequency, note, and observation year during playback.
- **Vestibular Motion Safety:** Respects `prefers-reduced-motion` across all GSAP animations and Three.js camera transitions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core Framework** | React 19, TypeScript 5.9, Vite 8 |
| **3D & WebGL Canvas** | Three.js, React Three Fiber (R3F), Drei, Custom GLSL Shaders, Postprocessing |
| **Audio Engine** | Tone.js v15, Native Web Audio API (`AudioContext`, `AnalyserNode`, `Limiter`) |
| **Animation & Scroll** | GSAP 3, ScrollTrigger, `@gsap/react`, Lenis Smooth Scroll |
| **Data & Visualization** | D3.js (Scales, Shapes, Polar Coordinates), PapaParse (CSV), Zod (Schema Validation) |
| **State Management** | Zustand 5 (Unidirectional reactive state bus with 0ms clock drift) |
| **Styling & Design** | Tailwind CSS v4, Lucide React Icons |
| **Typography** | Barlow Condensed (Headlines), IBM Plex Sans (Prose), IBM Plex Mono (Telemetry) |

---

## 🚀 Local Installation & Verification

```bash
# 1. Clone repository
git clone https://github.com/Multiverse-Vendhan/Prithvi-The-Sound-of-Earth.git
cd Prithvi-The-Sound-of-Earth

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Compile TypeScript & build production bundle
npm run build

# 5. Preview production build
npm run preview
```

---

## 📚 Authentic NASA Citations

1. **NASA GISTEMP v4:** GISTEMP Team, 2026: *GISS Surface Temperature Analysis (GISTEMP), version 4.* NASA Goddard Institute for Space Studies. [https://data.giss.nasa.gov/gistemp/](https://data.giss.nasa.gov/gistemp/)
2. **NOAA GML Mauna Loa $\text{CO}_2$:** Keeling, C.D., et al., 2026: *Atmospheric Carbon Dioxide Dry Air Mole Fractions from the Mauna Loa Observatory, Hawaii.* NOAA Global Monitoring Laboratory. [https://gml.noaa.gov/ccgg/trends/](https://gml.noaa.gov/ccgg/trends/)
3. **NASA PO.DAAC Sea Level:** Beckley et al., 2026: *Global Mean Sea Level Trend from TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, and Sentinel-6 Michael Freilich.* NASA JPL. [https://podaac.jpl.nasa.gov/](https://podaac.jpl.nasa.gov/)
4. **NASA VIIRS Black Marble:** Román, M. O., et al., 2026: *NASA's Black Marble Daily at-sensor TOA nighttime lights product suite.* NASA GSFC. [https://blackmarble.gsfc.nasa.gov/](https://blackmarble.gsfc.nasa.gov/)
5. **NASA SVS Climate Spiral:** SubbaRao, M., 2022: *GISS Surface Temperature Analysis Climate Spiral (1880–Present).* NASA SVS Asset #5190. [https://svs.gsfc.nasa.gov/5190/](https://svs.gsfc.nasa.gov/5190/)
6. **NASA SVS DYAMOND Simulation:** Christensen, A.J., & Ott, L., 2023: *DYAMOND Global Carbon Dioxide.* NASA SVS Asset #5196. [https://svs.gsfc.nasa.gov/5196/](https://svs.gsfc.nasa.gov/5196/)
7. **NASA SVS Sea Level Reveal:** SVS Team, 2024: *Slow Reveal Graphs: Global Mean Sea Level 1993–2023.* NASA SVS Asset #5312. [https://svs.gsfc.nasa.gov/5312/](https://svs.gsfc.nasa.gov/5312/)
8. **NASA SVS Night Lights:** SVS Team, 2024: *Change in Night Lights between 2012 and 2023 - EIC Version.* NASA SVS Asset #5313. [https://svs.gsfc.nasa.gov/5313/](https://svs.gsfc.nasa.gov/5313/)

---

## 🏆 NASA Space Apps Challenge 2026
- **Project:** PRITHVI — The Sound of Earth
- **Challenge:** The Earth Information Jukebox
- **Team:** MULTIVERSE VENDHAN
- **Submission Status:** Fully Audited, Verified & Publicly Deployable

*Dedicated to open science, empirical integrity, accessible education, and listening to our living planet.*
