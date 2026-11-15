import { z } from 'zod';

// Zod Schema for a single Earth Observation Data Point
export const DataPointSchema = z.object({
  year: z.number().int().min(1880).max(2030),
  value: z.number(), // The primary metric (e.g., °C anomaly, ppm, mm, NDVI, DU)
  anomaly: z.number().optional(), // Baseline anomaly if distinct from value
  uncertainty: z.number().optional(), // Measurement confidence interval (±)
  milestone: z.string().optional(), // Historical or scientific event in that year
  regionAnomaly: z.record(z.string(), z.number()).optional(), // Regional anomalies (e.g. Arctic, Tropics, Oceans)
});

export type DataPoint = z.infer<typeof DataPointSchema>;

// Supported Earth Science Datasets
export type DatasetKey = 'temperature' | 'co2' | 'seaLevel' | 'vegetation' | 'ozone';

export interface DatasetMeta {
  id: DatasetKey;
  name: string;
  shortCode: string;
  subtitle: string;
  unit: string;
  baseline: string;
  temporalRange: string;
  instrument: string;
  leadAgency: string;
  satellitePlatform: string;
  themeColor: string; // Tailwind hex color
  accentGlow: string;
  description: string;
  scientificImpact: string;
  sonificationRule: {
    acousticParameter: string;
    musicalMapping: string;
    frequencyRange: string;
    timbralDescription: string;
  };
  data: DataPoint[];
}

export interface SatelliteMission {
  id: string;
  name: string;
  launchYear: number;
  orbitAltitudeKm: number;
  orbitInclinationDeg: number;
  primarySensor: string;
  observationalFocus: string;
  color: string;
}
