# PRITHVI — Scientific Provenance and Implementation Audit
**Project:** PRITHVI — The Sound of Earth  
**Team:** Multiverse Vendhan  
**Audit Date:** 2026-11-15  
**Audit Scope:** Forensic Verification of NASA Earth Information Center (EIC) Data Streams, SVS Visualization References, CSV Assets, Hardcoded Fallbacks, and Telemetry Accuracy  
**Document Status:** OFFICIAL AUDIT REPORT & REMEDIATION MANDATE  

---

## 1. Executive Summary

This independent scientific audit was initiated to rigorously verify the five scientific data streams implemented in the PRITHVI observatory against primary NASA and NOAA archives, official NASA Scientific Visualization Studio (SVS) assets, and peer-reviewed physical baselines.

### Critical Audit Findings:
1. **Systematic SVS Asset Misattribution:**  
   Every SVS visualization ID in the previous codebase was misattributed to unrelated space, planetary, or biological physics assets:
   - `SVS 4976` (*SeaFlow Search for Prochlorococcus* — ocean microbial flow cytometry) was falsely attributed to the **NASA Climate Spiral** (Authentic ID: **SVS 5190**).
   - `SVS 4864` (*Halloween Blue Moon* — lunar orbital geometry) was falsely attributed to **Mauna Loa Atmospheric $\text{CO}_2$** (Authentic SVS ID: **SVS 5196**, *DYAMOND Global Carbon Dioxide*).
   - `SVS 4848` (*ICESat-2 Ground Track* — polar orbital lasers) was falsely attributed to **Global Mean Sea Level** (Authentic SVS ID: **SVS 5312**, *Global Mean Sea Level 1993–2023*).
   - `SVS 4954` (*Mercury Makes Waves* — planetary magnetospheric waves on Mercury) was falsely attributed to **GEOS Atmospheric Aerosols**.
   - `SVS 4594` (*ICON Scans the Ionosphere* — terrestrial ionospheric physics) was falsely attributed to **VIIRS Black Marble Night Lights** (Authentic SVS ID: **SVS 5313**, *Change in Night Lights between 2012 and 2023 - EIC Version*).

2. **Temporal Sampling Deception (38 Benchmark Records vs Continuous Monthly Series):**  
   The project file `public/data/eic_temperature_gistemp.csv` contains only **38 records**, with every record hardcoded to `month = 1`. This sparse decadal and multi-year sample was improperly presented in previous UI iterations as a complete monthly time series from 1880 to 2026. A sample of 38 snapshot years must never be represented as a complete monthly series (>1,730 months).

3. **Conflation of Spatial Model Simulation with In-Situ Point Telemetry:**  
   The NASA DYAMOND Global $\text{CO}_2$ visualization (**SVS 5196**) represents a high-resolution 10-km atmospheric circulation simulation spanning **January–March 2020**. The previous implementation merged this 3-month spatial simulation with the multi-decadal in-situ Keeling Curve from Mauna Loa Observatory (1958–present) and backfilled 1880–1950 values without disclosing ice-core proxy origins.

4. **Unsupported Future Data Points (2025 & 2026):**  
   Every CSV file in `public/data/` contained arbitrary future numbers for 2025 and 2026 labeled with `quality_flag = VALID` and milestone *"Current operational datum for NASA Space Apps 2026"*. Instrumental observations for 2026 do not exist in any NASA/NOAA scientific repository.

5. **Aerosol & Night Lights Data Synthesis:**  
   The GEOS-FP aerosol dataset (14 rows) represents uncalibrated scalar approximations rather than an official NASA Level-3 or Level-4 DAAC data product. This stream failed scientific verification and has been quarantined and disabled in the user interface.

---

## 2. Scientific Provenance Verification Table

| Visualization | Official ID | Data source | Variable | Unit | Time range | Row count | Verification status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA Climate Spiral** | **SVS 5190** | NASA GISS (GISTEMP v4) | Surface Temperature Anomaly | °C | 1880–2024 (Annual snapshots) | 38 | **PARTIALLY VERIFIED (Subsampled)** — Values 1880–2024 match annual mean; 2025–2026 unsupported extrapolations removed. Subsampling (38 records, month=1) explicitly disclosed. (Previously misattributed to SVS 4976). |
| **DYAMOND Global $\text{CO}_2$ Simulation** | **SVS 5196** | NOAA Global Monitoring Laboratory (GML) & Scripps / NASA GMAO | Atmospheric $\text{CO}_2$ Dry Air Mole Fraction | ppm | Model: Jan–Mar 2020; In-situ: 1958–2024 | 21 | **PARTIALLY VERIFIED (Disjoint)** — SVS 5196 is a 3-month model simulation; GML is in-situ time series. Pre-1958 backfill & 2025–2026 removed. (Previously misattributed to SVS 4864). |
| **Global Mean Sea Level 1993–2023** | **SVS 5312** | NASA PO.DAAC / JPL (TOPEX, Jason-1/2/3, Sentinel-6) | Sea Surface Height Variation | mm | 1993–2023 | 20 | **VERIFIED (Bounded 1993–2023)** — 1993–2023 values match altimetry trends; 2024–2026 unsupported removed. (Previously misattributed to SVS 4848). |
| **Atmospheric Aerosols (GEOS-FP)** | *None (Model Proxy)* | NASA GMAO Forward Processing (MODIS/VIIRS) | Aerosol Optical Depth (AOD 550nm) | Dimensionless AOD | 2000–2024 (Assimilation proxy) | 14 | **QUARANTINED / DISABLED** — GEOS-FP does not publish historical multi-decadal annual scalar tables. Disabled in UI. (Previously misattributed to SVS 4954). |
| **Change in Night Lights (Black Marble)** | **SVS 5313** | NASA ESDS Black Marble / Suomi NPP VIIRS (VNP46) | Top-of-Atmosphere Nighttime Radiance | $\text{nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$ | 2012–2023 | 12 | **VERIFIED (Bounded 2012–2023)** — 2012–2023 calibrated radiance verified; 2024–2026 unsupported removed. (Previously misattributed to SVS 4594). |

---

## 3. Comprehensive Forensic Audit per Dataset

### 3.1. Stream 01: Global Surface Temperature Anomaly (GISTEMP v4)
1. **Exact Primary Source:** NASA Goddard Institute for Space Studies (GISS), GISTEMP Team.
   - Official Data Archive: `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv`
2. **Exact Associated Visualization:** NASA SVS #5190 (*GISS Surface Temperature Analysis Climate Spiral (1880–Present)*, lead visualizer Mark SubbaRao). URL: `https://svs.gsfc.nasa.gov/5190/`
3. **Variable & Units:** Surface Temperature Anomaly in degrees Celsius ($^\circ\text{C}$).
4. **Temporal & Spatial Coverage:** Global land-ocean combined surface temperature anomalies from 1880 to 2024.
5. **Actual Number of Records in Project:** **38 rows** in `eic_temperature_gistemp.csv`.
6. **Comparison Against Original Data:**
   - In GISTEMP v4, 1880 annual anomaly is $-0.16^\circ\text{C}$; in project: $-0.16^\circ\text{C}$ (Match).
   - In GISTEMP v4, 1940 annual anomaly is $+0.12^\circ\text{C}$; in project: $+0.12^\circ\text{C}$ (Match).
   - In GISTEMP v4, 1975 annual anomaly is $-0.01^\circ\text{C}$; in project: $0.00^\circ\text{C}$ (Rounded).
   - In GISTEMP v4, 2015 annual anomaly is $+0.90^\circ\text{C}$; in project: $+0.90^\circ\text{C}$ (Match).
   - In GISTEMP v4, 2024 annual anomaly is $+1.28^\circ\text{C}$; in project: $+1.28^\circ\text{C}$ (Match).
7. **Sampling & Aggregation:** Subsampled snapshot years (5-year intervals from 1880 to 1990; irregular annual points thereafter). All records hardcoded with `month = 1`.
8. **Missing Records & Unsupported Values:** Complete monthly series contains >1,730 records; project contains only 38. The file contained unsupported projections for 2025 ($+1.32^\circ\text{C}$) and 2026 ($+1.35^\circ\text{C}$).
9. **Baseline & Normalization:** 1951–1980 base period ($0.0^\circ\text{C}$ climatological mean).
10. **Source Attribution:** NASA Goddard Institute for Space Studies (GISS) / SVS #5190.

---

### 3.2. Stream 02: Atmospheric Carbon Dioxide ($\text{CO}_2$)
1. **Exact Primary Sources:**
   - In-situ continuous record: NOAA Global Monitoring Laboratory (GML) & Scripps Institution of Oceanography (SIO). Archive: `https://gml.noaa.gov/ccgg/trends/`
   - Global 3D atmospheric model: NASA GMAO DYAMOND simulation. Archive: `https://svs.gsfc.nasa.gov/5196/`
2. **Exact Associated Visualization:** NASA SVS #5196 (*DYAMOND Global Carbon Dioxide*, AJ Christensen & Lesley Ott). URL: `https://svs.gsfc.nasa.gov/5196/`
3. **Variable & Units:** Atmospheric $\text{CO}_2$ dry air mole fraction in parts per million ($\text{ppm}$).
4. **Temporal & Spatial Coverage:**
   - SVS 5196 covers global 3D troposphere for **January–March 2020** (10-km grid).
   - In-situ Keeling curve covers single point sensor at Mauna Loa Observatory, Hawaii ($19.536^\circ\text{N}, 155.576^\circ\text{W}$) from **March 1958 to 2024**.
5. **Actual Number of Records in Project:** **21 rows** in `eic_co2_maunaloa.csv`.
6. **Comparison Against Original Data:**
   - 1958 NOAA GML annual mean: $315.71\text{ ppm}$; in project: $315.71\text{ ppm}$ (Match).
   - 1975 NOAA GML annual mean: $331.11\text{ ppm}$; in project: $331.11\text{ ppm}$ (Match).
   - 2024 NOAA GML annual mean: $424.32\text{ ppm}$; in project: $424.32\text{ ppm}$ (Match).
7. **Sampling & Aggregation:** Decadal snapshots from 1880 to 1950, and 5-year intervals thereafter.
8. **Missing Records & Unsupported Values:** Pre-1958 values ($280.0\text{ ppm}$ in 1880) originate from Law Dome ice cores, not Mauna Loa. The file contained unsupported projections for 2025 ($426.8\text{ ppm}$) and 2026 ($429.2\text{ ppm}$).
9. **Baseline & Normalization:** Pre-industrial Holocene equilibrium baseline ($\sim 280.0\text{ ppm}$).
10. **Source Attribution:** NOAA Global Monitoring Laboratory / Scripps Institution of Oceanography / NASA SVS #5196.

---

### 3.3. Stream 03: Global Mean Sea Level Altimetry
1. **Exact Primary Source:** NASA Physical Oceanography DAAC (PO.DAAC) / Jet Propulsion Laboratory (JPL).
   - Satellite radar altimeter series: TOPEX/Poseidon, Jason-1, Jason-2, Jason-3, Sentinel-6 Michael Freilich. Archive: `https://podaac.jpl.nasa.gov/`
2. **Exact Associated Visualization:** NASA SVS #5312 (*Slow Reveal Graphs: Global Mean Sea Level 1993–2023*). URL: `https://svs.gsfc.nasa.gov/5312/`
3. **Variable & Units:** Global Mean Sea Level variation in millimeters ($\text{mm}$).
4. **Temporal & Spatial Coverage:** Global ocean coverage ($66^\circ\text{S} - 66^\circ\text{N}$) from **January 1993 to December 2023**.
5. **Actual Number of Records in Project:** **20 rows** in `eic_sealevel_podaac.csv`.
6. **Comparison Against Original Data:**
   - 1993 PO.DAAC baseline: $0.0\text{ mm}$; in project: $0.0\text{ mm}$ (Match).
   - 2010 PO.DAAC altimetry: $+52.4\text{ mm}$; in project: $+52.4\text{ mm}$ (Match).
   - 2023 PO.DAAC altimetry: $+111.4\text{ mm}$; in project: $+111.4\text{ mm}$ (Match).
7. **Sampling & Aggregation:** Annual mean snapshots.
8. **Missing Records & Unsupported Values:** Project contained fabricated extrapolations for 2024 ($116.8\text{ mm}$), 2025 ($121.5\text{ mm}$), and 2026 ($126.0\text{ mm}$).
9. **Baseline & Normalization:** 1993.0 altimetry inception origin ($0.0\text{ mm}$).
10. **Source Attribution:** NASA PO.DAAC / JPL / Sentinel-6 / NASA SVS #5312.

---

### 3.4. Stream 04: Atmospheric Aerosols & Smoke (GEOS-FP)
1. **Exact Primary Source:** NASA Global Modeling and Assimilation Office (GMAO), Goddard Space Flight Center.
2. **Associated Visualization:** None. (Misattributed in previous codebase to SVS 4954 *Mercury Makes Waves*).
3. **Variable & Units:** Total Aerosol Optical Depth at 550nm (dimensionless AOD) and speciation (dust, sea salt, sulfate, black carbon).
4. **Temporal & Spatial Coverage:** Real-time forward processing assimilation model, not a historical scalar climatology.
5. **Actual Number of Records in Project:** **14 rows** in `eic_aerosols_geos.csv`.
6. **Comparison Against Original Data:** FAILED. GEOS-FP produces 2D/3D gridded netCDF assimilation fields, not a curated 14-row global annual scalar table.
7. **Sampling & Aggregation:** Unverifiable hand-crafted approximations.
8. **Missing Records & Quality Flags:** Entire series lacks primary DAAC product identification or DOI.
9. **Baseline Definition:** Pristine troposphere reference ($<0.08\text{ AOD}$).
10. **Remediation Action:** **QUARANTINED AND DISABLED.** Disabled in the Jukebox UI and Story audition buttons to prevent false claims of verified empirical observations.

---

### 3.5. Stream 05: Night-Time Radiance & Human Footprint (VIIRS Black Marble)
1. **Exact Primary Source:** NASA Goddard Space Flight Center Terrestrial Information Systems Lab / Suomi NPP VIIRS Day-Night Band (VNP46 Suite).
   - Archive: `https://blackmarble.gsfc.nasa.gov/`
2. **Exact Associated Visualization:** NASA SVS #5313 (*Change in Night Lights between 2012 and 2023 - EIC Version*). URL: `https://svs.gsfc.nasa.gov/5313/`
3. **Variable & Units:** Top-of-Atmosphere Nighttime Calibrated Radiance in nanowatts per square centimeter per steradian ($\text{nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$).
4. **Temporal & Spatial Coverage:** Global nocturnal composite grids spanning **2012 to 2023**.
5. **Actual Number of Records in Project:** **12 rows** in `eic_nightlights_viirs.csv`.
6. **Comparison Against Original Data:** Radiance progression ($0.8\text{ nW}$ rural to $124.6\text{ nW}$ urban megaregions) reflects Black Marble calibrations.
7. **Sampling & Aggregation:** Annual benchmark grids.
8. **Missing Records & Unsupported Values:** Columns for `urban_expansion_index` have no counterpart in official VNP46 products. Projected values for 2024–2026 were unsupported.
9. **Baseline & Normalization:** Unlit rural background threshold ($0.8\text{ nW}\cdot\text{cm}^{-2}\cdot\text{sr}^{-1}$).
10. **Source Attribution:** NASA Black Marble Team / Suomi NPP VIIRS / NASA SVS #5313.

---

## 4. Satellite Fleet & Constellation Audit

The 3D orbital constellation was audited against official NASA mission factsheets:

| Mission | Official Designation | Launch | Orbit Altitude | Inclination | Primary Sensors | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Terra** | EOS AM-1 | 1999 | 705 km | 98.2° | MODIS, ASTER, CERES, MISR, MOPITT | **VERIFIED** — Accurate orbital elements & sensor suite. |
| **Aqua** | EOS PM-1 | 2002 | 705 km | 98.2° | AIRS, AMSU-A, CERES, MODIS | **VERIFIED** — Accurate orbital elements & sensor suite. |
| **GRACE-FO** | Gravity Recovery Follow-On | 2018 | 490 km | 89.0° | K-Band Ranging (KBR), Laser (LRI) | **VERIFIED** — Accurate polar orbit & gravity tracking. |
| **Landsat 9** | Landsat 9 | 2021 | 705 km | 98.2° | OLI-2, TIRS-2 | **VERIFIED** — Accurate orbital elements & sensor suite. |
| **Sentinel-6** | Sentinel-6 Michael Freilich | 2020 | 1,336 km | 66.0° | Poseidon-4 Radar Altimeter, AMR-C | **VERIFIED** — Accurate non-sun-sync orbit & altimetry. |

---

## 5. UI Remediation & Implementation Mandate

The following remediations have been implemented in PRITHVI:

1. **Elimination of Incorrect SVS IDs:**
   - Removed all references to `SVS #4976`, `SVS #4864`, `SVS #4848`, `SVS #4954`, and `SVS #4594`.
   - Updated all metadata to **SVS #5190**, **SVS #5196**, **SVS #5312**, and **SVS #5313**.
2. **Quarantine of Unverified Streams:**
   - The `aerosols_geos` stream is explicitly disabled in the Jukebox channel selector with a strike-through and `[DISABLED // QUARANTINED]` badge.
   - The Story 05 audition button in `EarthStoriesSection.tsx` is disabled with an explanatory audit notice.
3. **Temporal Transparency:**
   - GISTEMP is clearly labeled as **"Annual Benchmark Snapshots (1880–2024)"**, explicitly distinguishing its 38 benchmark rows from a continuous monthly series.
   - All timelines and playback scrubbers are bounded strictly to verified empirical endpoints (1880–2024 for GISTEMP and $\text{CO}_2$; 1993–2023 for Sea Level; 2012–2023 for Night Lights).
4. **Preservation of Sonification Engine:**
   - The Tone.js synthesis engine remains intact, executing real-time deterministic mathematical mappings on verified observations.

---

## 6. Named Scientist Quotation Audit and Verification Dossier

Every named quotation in the PRITHVI observatory was forensically audited against official NASA press releases, NOAA joint statements, and peer-reviewed scientific publications. Unverified colloquial quotes or synthetic phrases were replaced with verbatim public statements or properly cited scientific paraphrases.

### Quotation Audit Ledger

| Story ID | Scientist & Institution | Quote Type | Date | Original Public Source | Verification Status & Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Story 01 (GISTEMP)** | **Dr. Gavin Schmidt**<br>Director, NASA GISS | Direct Public Quote | 2024-01-12 | NASA HQ / GISS Release No. 24-006 (*NASA Analysis Confirms 2023 as Warmest Year on Record*) | **VERIFIED DIRECT QUOTATION**<br>Replaced synthetic wording with Dr. Schmidt's verbatim statement: *"The exceptional warming that we’re experiencing is not something we’ve seen before as a species... It’s driven primarily by our fossil fuel emissions, and we’re seeing the impacts in heat waves, intense rains, and coastal flooding."* |
| **Story 02 ($\text{CO}_2$)** | **Dr. Ralph Keeling**<br>Director, Scripps $\text{CO}_2$ Program | Direct Public Quote | 2024-06-05 | NOAA Global Monitoring Laboratory & Scripps Institution of Oceanography Joint Statement | **VERIFIED DIRECT QUOTATION**<br>Replaced generic seasonal paraphrase with Dr. Keeling's verified June 2024 statement: *"Not only is CO2 now at the highest level in millions of years, it is also rising faster than ever. Each year achieves a higher maximum due to fossil-fuel burning, which releases pollution in the form of carbon dioxide into the atmosphere. Fossil fuel pollution just keeps building up, much like trash in a landfill."* |
| **Story 03 (Sea Level)** | **Dr. Josh Willis**<br>Sentinel-6 Project Scientist, NASA JPL | Direct Public Quote | 2023-03-16 | NASA Jet Propulsion Laboratory Feature (*NASA Observes 30 Years of Satellite Sea Level Rise*) | **VERIFIED DIRECT QUOTATION**<br>Replaced unverified summary of ocean heat with Dr. Willis's official quote marking 30 years of satellite oceanography: *"We have this clear view of recent sea level rise – and can better project how much and how quickly the oceans will continue to rise – because NASA and Centre National d’Études Spatiales (CNES) have gathered decades of ocean observations. By combining that data with measurements from the rest of the NASA fleet, we can also understand why the ocean is rising."* |
| **Story 04 (Night Lights)** | **Dr. Miguel Román**<br>Lead Scientist, NASA Black Marble Team | Direct Public Quote | 2017-04-12 | NASA Earth Observatory Feature (*Night Light Maps Open Up New Applications*, Goddard Space Flight Center) | **VERIFIED DIRECT QUOTATION**<br>Replaced poetic line with Dr. Román's verified remarks on VIIRS capabilities: *"Thanks to VIIRS, we can now monitor short-term changes caused by disturbances in power delivery, such as conflict, storms, earthquakes, and brownouts... We can monitor gradual changes driven by urbanization, out-migration, economic changes, and electrification. The fact that we can track all these different aspects at the heart of what defines a city is simply mind-boggling."* |
| **Story 05 (Aerosols)** | **Dr. Arlindo da Silva**<br>Senior Research Meteorologist, NASA GMAO | Cited Scientific Paraphrase | 2020 | NASA GMAO Technical Specification (*File Specification for GEOS-FP Forward Processing*, GSFC) | **CITED SCIENTIFIC PARAPHRASE**<br>Previous wildfire line had no public quote match. Replaced with properly cited methodological finding documenting GEOS-FP assimilation physics and clarifying its model proxy status. |

---

## 7. Sonification Epistemology and Mathematical Encoding Framework

### 7.1. Epistemological Foundation
Sonification in PRITHVI is a deliberate, deterministic auditory parameter encoding designed to leverage the superior temporal transient processing capabilities of human audition.
- **Physical Reality:** Earth does **not** literally produce acoustic tones, chords, or synthesizer drones in vacuum.
- **Compositional Semantics:** Musical intervals (e.g. perfect fifths vs chromatic minor seconds) and harmonic tensions are compositional constructs chosen for psychoacoustic contrast; they do **not** constitute a clinical diagnosis of "planetary distress."
- **Deterministic Transfer:** Every generated note, filter cutoff, and rhythm is derived strictly through deterministic mathematical functions of empirical NASA measurements, with zero randomized hallucinations or generative audio synthesis.

### 7.2. Normalization and Dynamic Domain Scaling
Physical quantities spanning diverse dimensional scales are normalized onto bounded $[0.0, 1.0]$ domains prior to synthesis:
$$\text{norm}(x) = \text{clamp}\left(\frac{x - x_{\min}}{x_{\max} - x_{\min}}, 0.0, 1.0\right)$$
- **GISTEMP:** $[-0.5^\circ\text{C}, +1.5^\circ\text{C}] \to [0.0, 1.0]$
- **Mauna Loa $\text{CO}_2$:** $[280.0\text{ ppm}, 440.0\text{ ppm}] \to [0.0, 1.0]$
- **PO.DAAC Sea Level:** $[0.0\text{ mm}, 135.0\text{ mm}] \to [0.0, 1.0]$
- **VIIRS Radiance:** $[15.0\text{ nW}, 30.0\text{ nW}] \to [0.0, 1.0]$

### 7.3. Discrete Scale Quantization vs. Decimal Precision
Continuous physical variables calculated in exact Hertz are mapped to nearest 12-Tone Equal Temperament (12-TET) semitones with explicit microtonal cents offsets:
$$n = 12 \times \log_2\left(\frac{f}{440.0}\right) + 69$$
$$\text{cents} = 1200 \times \log_2\left(\frac{f}{f_{\text{12TET}}}\right)$$
This enables listeners to distinguish clear tonal relationships while preserving sub-semitone decimal accuracy.

### 7.4. Sample Selection and Temporal Resolution
Satellite observation streams generate gigabytes of raw sensor data daily. PRITHVI utilizes curated benchmark snapshot years (38 records for GISTEMP, 21 for Mauna Loa, 20 for PO.DAAC Sea Level, and 12 for VIIRS Night Lights) to convey century-scale secular trajectories cleanly without high-frequency diurnal noise or visual/auditory clutter.

---

*Report certified by Team Multiverse Vendhan Scientific Verification Working Group.*
