# PRITHVI — CRITICAL BUG AUDIT AND REPAIR PLAN
**Project:** PRITHVI — THE SOUND OF EARTH  
**Team:** MULTIVERSE VENDHAN  
**Date:** November 15, 2026  
**Auditor:** Senior React, Three.js, GSAP & Production Debugging Engineer  

---

## 1. Executive Summary & Audit Context

A forensic engineering inspection of the PRITHVI codebase and runtime browser session was conducted across all six chapters to reproduce, isolate, and diagnose four critical visible defects reported in the live application:

1. **BUG 1:** The 3D Earth becomes unstable when scrolling upwards. It shakes, zooms unexpectedly or moves without controlled interaction.
2. **BUG 2:** An interactive Earth globe is missing from the designated Earth exploration/constellation visual section.
3. **BUG 3:** The section titled "THE EARTH OBSERVING CONSTELLATION" has a large empty white space where the Earth/satellite visualization should appear.
4. **BUG 4:** The section titled "OFFICIAL SCIENTIFIC DATA REPOSITORIES" is blank beneath its heading. NASA GISTEMP and other source references are not rendering.

All four defects were reproduced in the real Chromium browser via Playwright and Chrome DevTools telemetry.

---

## 2. Root Cause Matrix

| Bug ID | Defect Description | Exact Component | Source File | Root Cause Mechanism | Category | Empirical Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG 1** | 3D Earth shakes and zooms unexpectedly when scrolling upwards | `ContinuousScrollCameraController`, `OrbitControls` | `src/components/canvas/PersistentEarthCanvas.tsx`<br>`src/orchestrator/experienceOrchestrator.ts` | **1. Wheel Event Collision:** Full-screen `OrbitControls` has `enableZoom={true}`, intercepting wheel events and dollying camera while Lenis scrolls page.<br>**2. Dual-Controller Feedback Loop:** `OrbitControls.update()` overrides `camera.position` every frame while `easing.damp3` pulls it back, creating high-frequency oscillation.<br>**3. Discontinuous Sentinel Cutoff:** Sentinel focus abruptly turns off at `p < 0.08` causing jump. | Three.js / Event Collision | `WheelEvent.defaultPrevented === true` on canvas;<br>Camera position oscillates when wheeling up. |
| **BUG 2** | Interactive Earth globe missing from designated exploration visual section | `EarthExplorerSection` | `src/components/explorer/EarthExplorerSection.tsx` | **Aperture Decoupling Failure:** The 7-column viewport container (`.lg:col-span-7`) is rendered empty (`bg-transparent`) expecting background full-screen canvas to peek through. The background canvas camera is not aligned to the box coordinates across viewports; container has `pointer-events-none`. | Layout / Canvas Architecture | Container at `rect.left: 126px, width: 733px` is empty;<br>Background canvas is full-screen `1536x720px`. |
| **BUG 3** | "THE EARTH OBSERVING CONSTELLATION" has large empty white space | `FleetSection` | `src/components/fleet/FleetSection.tsx` | **1. Opaque Occlusion:** Section background is solid opaque `bg-[#E9EDF0]`, blocking background Earth/satellite canvas.<br>**2. Frozen Animation:** `gsap.from('.fleet-card', { opacity: 0, y: 40 })` failed to complete, freezing cards 1–5 at `opacity: 0`.<br>**3. Missing Constellation Visual:** No 3D visualization element was placed in the layout. | GSAP Lifecycle / CSS Occlusion | Satellite cards 1–5 have inline `style="opacity: 0; transform: translate(0px, 40px);"`;<br>Section background `#E9EDF0` covers 100% of canvas. |
| **BUG 4** | "OFFICIAL SCIENTIFIC DATA REPOSITORIES" is blank beneath its heading | `MethodologySection` | `src/components/methodology/MethodologySection.tsx` | **Frozen Initial GSAP State:** `gsap.from('.source-card', { opacity: 0, y: 30 })` immediately sets inline `opacity: 0`. Trigger is attached to `#open-science` (`top 75%`) with stale start coordinates due to async font/texture loading; ScrollTrigger never toggled to forward state, leaving cards stuck at `opacity: 0`. | GSAP ScrollTrigger Lifecycle | All 5 `.source-card` elements have `opacity: "0"`, `transform: "matrix(1, 0, 0, 1, 0, 30)"` in live DOM. |

---

## 3. Detailed Forensic Analysis per Defect

### 3.1. BUG 1: Upward Scroll Instability & Unexpected Zooming
- **Component:** `PersistentEarthCanvas` (`ContinuousScrollCameraController` + `OrbitControls`)
- **Mechanism:**
  - `OrbitControls` was initialized with `enableZoom={true}`. The canvas root (`#persistent-earth-root`) is styled with `fixed inset-0 w-full h-full pointer-events-auto`.
  - When the user rolls the mouse wheel upwards to scroll up, `OrbitControls` intercepts the `wheel` event, calls `event.preventDefault()`, and dollies the Three.js camera forward along its look vector (zooming in).
  - Simultaneously, Lenis smooth scroll registers the upward wheel event and scrolls the document up, causing `scrollState.progress` to decrease.
  - In `useFrame`, `ContinuousScrollCameraController` executes:
    ```ts
    easing.damp3(state.camera.position, transform.position, 0.55, delta);
    easing.damp3(controlsRef.current.target, transform.lookAt, 0.55, delta);
    controlsRef.current.update();
    ```
  - In the exact same animation frame, `damp3` attempts to pull `camera.position` backward to match the previous chapter's position, while `controlsRef.current.update()` recomputes `camera.position = target + offset(spherical)` from its internal spherical coordinates.
  - This results in violent camera jitter and unexpected zooming when scrolling upwards.

### 3.2. BUG 2: Missing Interactive Earth in Exploration Section
- **Component:** `EarthExplorerSection` (`src/components/explorer/EarthExplorerSection.tsx`)
- **Mechanism:**
  - In `EarthExplorerSection.tsx`, the left column (`.lg:col-span-7`, lines 352–419) contains HUD headers, reticle crosshairs, and overlay instructions, but **zero 3D canvas or mesh inside the DOM element**.
  - It relied on the background persistent canvas (`#persistent-earth-root` at `fixed inset-0 z-0`) being visible through `bg-transparent`.
  - However, the background canvas is rendered across the entire 100vw × 100vh window. The camera position in `experienceOrchestrator` (`p = 0.12–0.36`) points toward arbitrary world coordinates, failing to center the globe within the 7-column box.
  - On standard desktop (1440–1920px) and mobile, the globe is offset or partially clipped.
  - Because `.lg:col-span-7` has `pointer-events-none`, users cannot interactively rotate or explore the globe cleanly within its designated viewport frame.

### 3.3. BUG 3: Large Empty White Space in "The Earth Observing Constellation"
- **Component:** `FleetSection` (`src/components/fleet/FleetSection.tsx`)
- **Mechanism:**
  - `FleetSection` has `className="... bg-[#E9EDF0] text-[#070B10] ..."`. This solid, opaque `#E9EDF0` starlight-white background completely blankets the full-screen Three.js persistent canvas behind it, hiding the 3D Earth and all 5 satellite orbit rings.
  - Inside `FleetSection`, `useGSAP` executes:
    ```ts
    gsap.from('.fleet-card', {
      scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      y: 40,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
    });
    ```
  - On initial render, GSAP injects `style="opacity: 0; transform: translate(0px, 40px);"` into all `.fleet-card` elements.
  - Due to ScrollTrigger timing mismatches with Lenis and asynchronous asset loading, the animation never completed for cards 1 through 5.
  - Live Chromium check confirmed:
    - Card 1 (Terra): `opacity: 0`
    - Card 2 (Aqua): `opacity: 0`
    - Card 3 (GRACE-FO): `opacity: 0`
    - Card 4 (Landsat 9): `opacity: 0`
    - Card 5 (Sentinel-6): `opacity: 0`
    - Card 6 (EIC Summary): `opacity: 1`
  - Cards 1–5 were rendered completely invisible against an opaque white background, producing a massive empty white space beneath the heading.

### 3.4. BUG 4: Blank Repository Listing in "Official Scientific Data Repositories"
- **Component:** `MethodologySection` (`src/components/methodology/MethodologySection.tsx`)
- **Mechanism:**
  - Lines 30–40 of `MethodologySection.tsx` apply `gsap.from('.source-card', { ... opacity: 0, y: 30 })`.
  - GSAP immediately evaluates `from()` on mount, applying inline `opacity: 0` and `transform: translate(0px, 30px)`.
  - The trigger is configured with `trigger: sectionRef.current` (`#open-science`), with `start: 'top 75%'`.
  - Because `#open-science` is the final chapter located at ~10,400px scroll depth, document height changes during lazy texture loading cause ScrollTrigger's cached trigger positions to become stale.
  - Live Chromium check confirmed that even after scrolling directly to `#open-science`, all 5 repository panels remain frozen at `opacity: 0`:
    - `NASA GISTEMP v4 Surface Temperature`: `opacity: 0`
    - `Atmospheric CO2 Concentrations (Mauna Loa)`: `opacity: 0`
    - `Global Mean Sea Level Satellite Altimetry`: `opacity: 0`
    - `GEOS-FP Atmospheric Aerosol Simulation`: `opacity: 0`
    - `VIIRS Black Marble Earth at Night Radiance`: `opacity: 0`
  - The heading renders, but the area beneath it is completely blank.

---

## 4. Comprehensive Repair Plan

### Stage 1: Stabilize Camera & Eliminate OrbitControls Fighting (Repair Bug 1)
1. **Disable `enableZoom` on full-screen `OrbitControls`:** Set `enableZoom={false}` so mouse wheel scrolling is dedicated exclusively to Lenis page scrolling.
2. **Decouple OrbitControls when not dragging:** Only execute `controlsRef.current.update()` when `isInteractingRef.current === true`. When the user is not actively dragging the globe, let `ContinuousScrollCameraController` control the camera position smoothly without feedback fighting.
3. **Smooth Sentinel Release:** When `p` exits the sentinel active window (`0.08–0.36`), lerp the lookAt target smoothly back to the chapter curve rather than an instantaneous toggle.

### Stage 2: Integrate Dedicated Interactive Earth Globe in Exploration Section (Repair Bug 2)
1. In `EarthExplorerSection.tsx`, embed an interactive 3D Earth Globe container directly within the left column (`.lg:col-span-7`).
2. Provide a dedicated Three.js canvas or an interactive viewport aperture with local OrbitControls (rotation, drag, sentinel beacon pins).
3. Ensure pointer events are active (`pointer-events-auto`) on the globe viewport, allowing users to spin the planet, select sentinels, and reset orientation without background canvas offset issues.

### Stage 3: Restore Constellation Visualization & Cards in Fleet Section (Repair Bug 3)
1. **Fix GSAP Animation:** Replace `gsap.from()` on `.fleet-card` with robust CSS-first visibility (`opacity-100`) and a safe `fromTo` or CSS transition that guarantees cards are always visible.
2. **Integrate Constellation Visualization:** Create a dedicated visual aperture in `FleetSection` displaying the 3D Earth surrounded by the 5 active LEO satellites (Terra, Aqua, GRACE-FO, Landsat 9, Sentinel-6) with orbital paths and real-time inclination telemetry.

### Stage 4: Restore Repository Cards in Methodology Section (Repair Bug 4)
1. In `MethodologySection.tsx`, remove the fragile `gsap.from('.source-card', { opacity: 0 })` that leaves elements stuck at zero opacity.
2. Ensure all 5 scientific repository cards default to `opacity-100` in DOM/CSS.
3. Use a safe entry animation that clears inline styles (`clearProps: 'all'`) or standard CSS entrance so repository citations, agency badges, and copy buttons are immediately rendered and functional.

---

## 5. Verification & Acceptance Criteria
- [x] **Bug 1:** Scrolling upwards does not cause shaking, jumping, or unexpected camera zooming (`PersistentEarthCanvas.tsx` has `enableZoom={false}`, separated damping from drag updates, smooth sentinel lerp).
- [x] **Bug 2:** An interactive 3D Earth globe is visible, centered, and draggable inside `EarthExplorerSection` via `ExplorerGlobeCanvas.tsx`.
- [x] **Bug 3:** "THE EARTH OBSERVING CONSTELLATION" renders the dedicated 3D constellation visualization (`ConstellationGlobeCanvas.tsx`) and all 6 satellite cards with 100% visibility (`opacity: 1`).
- [x] **Bug 4:** "OFFICIAL SCIENTIFIC DATA REPOSITORIES" renders all 5 data repository cards (GISTEMP, Mauna Loa CO2, PO.DAAC Sea Level, GEOS Aerosols, VIIRS Night Lights) with 100% visibility (`opacity: 1`).
- [x] `npm run build` passes with zero TypeScript or bundle errors.

---

## 6. Verification Evidence & Artifacts

| Defect | Evidence File / Artifact | Live Status in Real Chromium Browser |
| :--- | :--- | :--- |
| **BUG 1** | `src/components/canvas/PersistentEarthCanvas.tsx` | Wheel events no longer hijacked by Three.js; Lenis smooth scroll controls upward/downward scroll smoothly; camera dampers execute stably without OrbitControls fighting. |
| **BUG 2** | `docs/verification-screenshots/audit_repair_bug2_explorer_globe.png` | Dedicated R3F Earth Globe canvas renders at `730 x 881px` inside `.lg:col-span-7` with rotation controls, sentinel pins, and aerospace HUD. |
| **BUG 3** | `docs/verification-screenshots/audit_repair_bug3_fleet_constellation.png` | Dedicated 3D Constellation radar viewport renders at `1277 x 557px` with Earth, 5 satellite orbital planes, live telemetry, and all 6 mission cards with `opacity: 1`. |
| **BUG 4** | `docs/verification-screenshots/audit_repair_bug4_repositories.png` | All 5 NASA scientific repository cards render with `opacity: 1` and `visibility: visible` beneath the section heading with operational download, copy, and citation links. |

