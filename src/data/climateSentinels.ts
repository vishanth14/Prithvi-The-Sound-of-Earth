import { z } from 'zod';
import type { DatasetKey } from './types';
import type { EicDatasetKey } from './eicSchemas';

/**
 * Authoritative Zod Schema for Climate Sentinel Stations
 * Validates metadata for all ground, marine, and polar Earth observation stations.
 */
export const ClimateSentinelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stationCode: z.string().min(2),
  datasetKey: z.custom<DatasetKey>(),
  eicKey: z.custom<EicDatasetKey>(),
  description: z.string().min(10),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  elevationMeters: z.number(),
  region: z.string().min(2),
  scientificPurpose: z.string().min(10),
  measurementType: z.string().min(5),
  instrument: z.string().min(2),
  baseline: z.string().min(5),
  source: z.string().min(2),
  attributionUrl: z.string().url(),
  geographicDescription: z.string().min(10),
  dataLimitations: z.string().min(10),
  representativeLabel: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type ClimateSentinel = z.infer<typeof ClimateSentinelSchema>;

/**
 * Authoritative Single Source of Truth for Climate Sentinels
 * Verified against NOAA GML, Norwegian Polar Institute, AARI, INPA/Max Planck, and NOAA PMEL.
 */
export const RAW_CLIMATE_SENTINELS: ClimateSentinel[] = [
  {
    id: 'mauna-loa',
    name: 'Mauna Loa Observatory, Hawaii',
    stationCode: 'MLO-NOAA',
    datasetKey: 'co2',
    eicKey: 'co2_maunaloa',
    description:
      'Premier atmospheric baseline monitoring station providing the continuous instrumental record of atmospheric carbon dioxide (Keeling Curve) since 1958.',
    lat: 19.5362,
    lng: -155.5763,
    elevationMeters: 3397,
    region: 'Hawaii, United States (Pacific Ocean)',
    scientificPurpose:
      'Atmospheric baseline monitoring and long-term carbon dioxide mole fraction observations in the undisturbed Pacific free troposphere.',
    measurementType: 'Atmospheric Carbon Dioxide (CO₂ mole fraction, ppm)',
    instrument: 'Picarro G2401 Cavity Ring-Down Spectrometer & NDIR Analyser',
    baseline: '280.0 ppm pre-industrial benchmark',
    source: 'NOAA Global Monitoring Laboratory / Scripps Institution of Oceanography',
    attributionUrl: 'https://gml.noaa.gov/obop/mlo/',
    geographicDescription:
      'Situated at 3,397 m on the northern slope of Mauna Loa volcano on Hawaii Island, well above the local marine boundary layer.',
    dataLimitations:
      'Measures clean background marine boundary and tropospheric air; local volcanic degassing episodes are detected and filtered using continuous CO₂ variability flags.',
    color: '#FF5938',
  },
  {
    id: 'svalbard',
    name: 'Svalbard Arctic Sentinel, Norway',
    stationCode: 'SVB-ARC',
    datasetKey: 'temperature',
    eicKey: 'gistemp',
    description:
      'High-Arctic climate observatory monitoring extreme polar amplification, surface temperature anomalies, greenhouse gas trends, and sea ice retreat.',
    lat: 78.9067,
    lng: 11.8883,
    elevationMeters: 474,
    region: 'Zeppelin Observatory, Ny-Ålesund, Svalbard (Norway)',
    scientificPurpose:
      'Monitoring high-latitude polar warming amplification, cryosphere albedo feedback, and Arctic atmospheric composition.',
    measurementType: 'Surface Temperature Anomaly & Thermal Amplification (°C)',
    instrument: 'Zeppelin Atmospheric Profiler & WMO Global Atmosphere Watch Network',
    baseline: '1951–1980 GISTEMP Climatological Mean',
    source: 'Norwegian Polar Institute (NPI) / NILU / WMO GAW',
    attributionUrl: 'https://www.polar-observatory.eu/',
    geographicDescription:
      'Perched on Mount Zeppelin (474 m) above Ny-Ålesund on the island of Spitsbergen, isolated from local human emissions.',
    dataLimitations:
      'Represents northern high-latitude climate amplification; subject to polar day/night radiative extremes and seasonal snow/ice albedo transitions.',
    color: '#F59E0B',
  },
  {
    id: 'vostok',
    name: 'Vostok Research Station, Antarctica',
    stationCode: 'VOS-ICE',
    datasetKey: 'temperature',
    eicKey: 'gistemp',
    description:
      'Continental polar ice-core paleoclimate baseline, recovering over 420,000 years of atmospheric composition and glacial-interglacial temperature cycles.',
    lat: -78.4644,
    lng: 106.8373,
    elevationMeters: 3488,
    region: 'Princess Elizabeth Land, Inland East Antarctica',
    scientificPurpose:
      'Preserving deep ice-core paleoclimate records and monitoring the lowest natural ground thermal baselines on the East Antarctic Ice Sheet.',
    measurementType: 'Paleoclimate Temperature & Cryosphere Thermal Mass (°C)',
    instrument: 'Vostok Deep Ice Core Mass Spectrometry & In-situ Automatic Weather Station',
    baseline: 'Holocene Equilibrium Baseline & 1951–1980 Climatology',
    source: 'Russian Antarctic Expedition (AARI) / Antarctic Treaty / IPICS',
    attributionUrl: 'https://www.aari.ru/',
    geographicDescription:
      'Located in the interior of the East Antarctic Ice Sheet at 3,488 m altitude near the Southern Pole of Cold, resting above subglacial Lake Vostok.',
    dataLimitations:
      'Extreme hyper-arid polar desert; represents East Antarctic continental interior conditions with minimal marine influence; lowest recorded ground temperature -89.2°C.',
    color: '#38BDF8',
  },
  {
    id: 'atto-amazon',
    name: 'Amazon Tall Tower Observatory (ATTO), Brazil',
    stationCode: 'ATTO-BIO',
    datasetKey: 'vegetation',
    eicKey: 'aerosols_geos',
    description:
      '325-meter research mast measuring tropical biosphere-atmosphere exchange, biogenic volatile organic compounds, greenhouse gas fluxes, and wildfire plumes.',
    lat: -2.1459,
    lng: -59.0056,
    elevationMeters: 130,
    region: 'Uatumã Sustainable Development Reserve, Amazonas, Brazil',
    scientificPurpose:
      'Continental tropical biosphere monitoring, measuring forest-atmosphere exchange, biogenic aerosols, and carbon sink dynamics across the Amazon basin.',
    measurementType: 'Vegetation Dynamics, Aerosol Optical Depth & VOC Fluxes',
    instrument: '325 m Instrumented Mast & GEOS-FP Aerosol Chemistry Sensors',
    baseline: 'Pristine Clean-Sky Baseline (0.12 AOD)',
    source: 'National Institute of Amazonian Research (INPA) / Max Planck Society',
    attributionUrl: 'https://www.attoproject.org/',
    geographicDescription:
      'A 325-meter steel tower situated in pristine terra firme rainforest ~150 km northeast of Manaus, reaching above the forest boundary layer.',
    dataLimitations:
      'Footprint encompasses sub-basin central Amazon rainforest; observations reflect mixed biogenic emission baseline and seasonal regional biomass burning smoke.',
    color: '#8B5CF6',
  },
  {
    id: 'pacific-tao',
    name: 'Pacific TAO/TRITON Buoy Array, Equator',
    stationCode: 'TAO-ENSO',
    datasetKey: 'seaLevel',
    eicKey: 'sealevel_podaac',
    description:
      'Trans-Pacific ocean mooring network measuring equatorial ocean thermal expansion, El Niño-Southern Oscillation dynamics, and altimetry calibration.',
    lat: 0.0,
    lng: -140.0,
    elevationMeters: 0,
    region: 'Central Equatorial Pacific Ocean',
    representativeLabel: 'Representative Central Mooring (0°N, 140°W) • TAO/TRITON Array',
    scientificPurpose:
      'Real-time oceanographic and meteorological monitoring of equatorial Pacific thermal structure, ENSO oscillations, and satellite radar altimetry ground truthing.',
    measurementType: 'Sea Surface Height Anomaly & Ocean Thermal Expansion (mm)',
    instrument: 'ATLAS Mooring Dual-Frequency GPS & Radar Calibration Array (Sentinel-6 / Jason)',
    baseline: '1993.0 Satellite Altimetry Reference Origin',
    source: 'NOAA PMEL / Global Tropical Moored Buoy Array',
    attributionUrl: 'https://www.pmel.noaa.gov/tao/',
    geographicDescription:
      'Represented by central mooring at 0°N, 140°W within the trans-Pacific array of ~70 moored ocean buoys spanning from 8°S to 8°N and 95°W to 137°E.',
    dataLimitations:
      'Point coordinate represents the central equatorial mooring (0°N, 140°W) of a distributed 70-station array; data represents open-ocean tropical marine boundary layer.',
    color: '#06B6D4',
  },
];

// Validate all sentinels against Zod schema at runtime
export const CLIMATE_SENTINELS: ClimateSentinel[] = z
  .array(ClimateSentinelSchema)
  .parse(RAW_CLIMATE_SENTINELS);

export const CLIMATE_SENTINEL_MAP: Record<string, ClimateSentinel> = Object.fromEntries(
  CLIMATE_SENTINELS.map((s) => [s.id, s])
);
